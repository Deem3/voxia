//! Decode audio to mono 16 kHz `f32` via FFmpeg.
//!
//! Executable resolution (first match wins):
//! 1. `VOXIA_FFMPEG` — absolute path to an `ffmpeg` binary  
//! 2. `binaries/ffmpeg` (or `binaries/ffmpeg.exe` on Windows) next to the running executable, or any `binaries/ffmpeg-*` sidecar  
//! 3. Well-known installs (e.g. Homebrew on macOS, `/usr/bin/ffmpeg` on Linux)  
//! 4. `ffmpeg` / `ffmpeg.exe` on `PATH`  
//!
//! See `src-tauri/binaries/README.md` for optional bundled sidecars and `scripts/prepare-ffmpeg-sidecar.sh`.

use crate::events::{emit_model_progress, ModelProgressPayload};
use std::ffi::{OsStr, OsString};
use std::path::Path;
use std::process::Stdio;
use tauri::AppHandle;
use tokio::io::AsyncReadExt;
use tokio::process::Command;
use tokio_util::sync::CancellationToken;

fn default_ffmpeg_name() -> &'static OsStr {
    if cfg!(windows) {
        OsStr::new("ffmpeg.exe")
    } else {
        OsStr::new("ffmpeg")
    }
}

/// Picks `binaries/ffmpeg` / `binaries/ffmpeg.exe`, or any `binaries/ffmpeg-*` sidecar (see `prepare-ffmpeg-sidecar.sh`).
fn pick_from_binaries_dir(binaries_dir: &Path) -> Option<OsString> {
    if !binaries_dir.is_dir() {
        return None;
    }
    let plain = binaries_dir.join(default_ffmpeg_name());
    if plain.is_file() {
        return Some(plain.as_os_str().to_owned());
    }
    let mut matches: Vec<std::path::PathBuf> = std::fs::read_dir(binaries_dir)
        .ok()?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.file_name()
                    .and_then(|n| n.to_str())
                    .is_some_and(|n| n.starts_with("ffmpeg-"))
        })
        .collect();
    matches.sort();
    matches.into_iter().next().map(|p| p.as_os_str().to_owned())
}

fn well_known_system_ffmpeg() -> Option<OsString> {
    #[cfg(target_os = "macos")]
    const CANDIDATES: &[&str] = &["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"];
    #[cfg(target_os = "linux")]
    const CANDIDATES: &[&str] = &["/usr/bin/ffmpeg", "/snap/bin/ffmpeg"];
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    const CANDIDATES: &[&str] = &[];
    for path in CANDIDATES {
        if Path::new(path).is_file() {
            return Some(OsString::from(path));
        }
    }
    None
}

fn resolve_ffmpeg_program() -> OsString {
    if let Some(p) = std::env::var_os("VOXIA_FFMPEG") {
        return p;
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let candidates: &[std::path::PathBuf] = if cfg!(windows) {
                &[
                    dir.join("binaries").join("ffmpeg.exe"),
                    dir.join("ffmpeg.exe"),
                ]
            } else {
                &[dir.join("binaries").join("ffmpeg"), dir.join("ffmpeg")]
            };
            for c in candidates {
                if c.is_file() {
                    return c.as_os_str().to_owned();
                }
            }
            if let Some(p) = pick_from_binaries_dir(&dir.join("binaries")) {
                return p;
            }
        }
    }
    if let Some(p) = well_known_system_ffmpeg() {
        return p;
    }
    default_ffmpeg_name().to_os_string()
}

pub async fn extract_pcm_mono_f32_16k(
    app: &AppHandle,
    video_path: &Path,
    cancel: &CancellationToken,
) -> Result<Vec<f32>, String> {
    let vp = video_path
        .to_str()
        .ok_or_else(|| "video path is not valid UTF-8".to_string())?
        .to_string();

    let program = resolve_ffmpeg_program();
    log::info!("ffmpeg decode using {}", program.to_string_lossy());

    let mut child = Command::new(program)
        .args([
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            &vp,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-f",
            "f32le",
            "-",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let msg = format!(
                "ffmpeg spawn failed ({e}). Install ffmpeg, set VOXIA_FFMPEG, or place binaries/ffmpeg next to the app — see src-tauri/binaries/README.md"
            );
            log::error!("[audio] {msg}");
            msg
        })?;
    log::info!("[audio] ffmpeg process spawned");

    // Drain stderr concurrently: if the pipe fills and nobody reads it, ffmpeg
    // blocks on stderr writes and this step appears stuck forever.
    let stderr_opt = child.stderr.take();
    let stderr_join = tokio::spawn(async move {
        let mut err = String::new();
        if let Some(mut s) = stderr_opt {
            let _ = s.read_to_string(&mut err).await;
        }
        err
    });

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "ffmpeg missing stdout".to_string())?;

    let mut raw: Vec<u8> = Vec::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        if cancel.is_cancelled() {
            stderr_join.abort();
            let _ = child.kill().await;
            return Err("cancelled".into());
        }
        let n = stdout.read(&mut buf).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        raw.extend_from_slice(&buf[..n]);
        emit_model_progress(
            app,
            ModelProgressPayload {
                kind: "ffmpeg".into(),
                id: "decode".into(),
                bytes_received: raw.len() as u64,
                total_bytes: None,
                phase: "pcm".into(),
            },
        );
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    let stderr_text = stderr_join.await.unwrap_or_else(|e| e.to_string());
    if !status.success() {
        log::error!("[audio] ffmpeg failed ({status}): {stderr_text}");
        return Err(format!("ffmpeg failed ({status}): {stderr_text}"));
    }
    log::info!("[audio] ffmpeg done, {} raw bytes", raw.len());

    if !raw.len().is_multiple_of(4) {
        return Err("ffmpeg output not aligned to f32".into());
    }
    Ok(raw
        .chunks_exact(4)
        .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
        .collect())
}
