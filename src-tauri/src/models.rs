//! Model catalog, downloads (Range resume + SHA256), and listing.

use crate::events::{emit_model_progress, ModelProgressPayload};
use futures_util::StreamExt;
use serde::Serialize;
use sha2::Digest;
use sha2::Sha256;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tokio::io::AsyncWriteExt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ModelKind {
    Whisper,
    Nllb,
}

impl ModelKind {
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "whisper" => Some(Self::Whisper),
            "nllb" => Some(Self::Nllb),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            ModelKind::Whisper => "whisper",
            ModelKind::Nllb => "nllb",
        }
    }
}

#[derive(Debug, Clone)]
pub struct RemoteFile {
    pub relative_path: &'static str,
    pub url: &'static str,
    pub expected_sha256: Option<&'static str>,
    /// Known on-disk size (HF LFS HEAD often returns pointer size only).
    pub expected_bytes: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct ModelBundle {
    pub id: &'static str,
    pub display_name: &'static str,
    #[allow(dead_code)]
    pub kind: ModelKind,
    pub files: &'static [RemoteFile],
}

fn whisper_bundles() -> &'static [ModelBundle] {
    const BASE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin";
    const TINY: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin";
    const SMALL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin";
    static FILES: &[ModelBundle] = &[
        ModelBundle {
            id: "tiny",
            display_name: "Whisper tiny",
            kind: ModelKind::Whisper,
            files: &[RemoteFile {
                relative_path: "ggml-tiny.bin",
                url: TINY,
                expected_sha256: None,
                expected_bytes: Some(77_000_000),
            }],
        },
        ModelBundle {
            id: "base",
            display_name: "Whisper base",
            kind: ModelKind::Whisper,
            files: &[RemoteFile {
                relative_path: "ggml-base.bin",
                url: BASE,
                expected_sha256: None,
                expected_bytes: Some(147_000_000),
            }],
        },
        ModelBundle {
            id: "small",
            display_name: "Whisper small",
            kind: ModelKind::Whisper,
            files: &[RemoteFile {
                relative_path: "ggml-small.bin",
                url: SMALL,
                expected_sha256: None,
                expected_bytes: Some(487_000_000),
            }],
        },
    ];
    FILES
}

fn nllb_bundles() -> &'static [ModelBundle] {
    static NLLB_600M: &[RemoteFile] = &[
        RemoteFile {
            relative_path: "config.json",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/config.json",
            expected_sha256: None,
            expected_bytes: Some(846),
        },
        RemoteFile {
            relative_path: "tokenizer.json",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/tokenizer.json",
            expected_sha256: None,
            expected_bytes: Some(17_331_176),
        },
        RemoteFile {
            relative_path: "tokenizer_config.json",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/tokenizer_config.json",
            expected_sha256: None,
            expected_bytes: Some(564),
        },
        RemoteFile {
            relative_path: "sentencepiece.bpe.model",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/sentencepiece.bpe.model",
            expected_sha256: None,
            expected_bytes: Some(4_852_054),
        },
        RemoteFile {
            relative_path: "pytorch_model.bin",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/pytorch_model.bin",
            expected_sha256: None,
            expected_bytes: Some(2_460_457_927),
        },
        RemoteFile {
            relative_path: "special_tokens_map.json",
            url: "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/special_tokens_map.json",
            expected_sha256: None,
            expected_bytes: Some(3_548),
        },
    ];
    static BUNDLES: &[ModelBundle] = &[ModelBundle {
        id: "nllb-200-distilled-600M",
        display_name: "NLLB-200 distilled 600M",
        kind: ModelKind::Nllb,
        files: NLLB_600M,
    }];
    BUNDLES
}

pub fn bundle_for(kind: ModelKind, id: &str) -> Option<&'static ModelBundle> {
    let list: &[ModelBundle] = match kind {
        ModelKind::Whisper => whisper_bundles(),
        ModelKind::Nllb => nllb_bundles(),
    };
    list.iter().find(|b| b.id == id)
}

pub fn models_root_dir(app: &AppHandle) -> Result<PathBuf, String> {
    use tauri_plugin_store::StoreExt;
    if let Ok(store) = app.store("settings.json") {
        if let Some(val) = store.get("modelsDirOverride") {
            if let Some(s) = val.as_str().filter(|s| !s.trim().is_empty()) {
                let p = PathBuf::from(s);
                if p.is_absolute() {
                    std::fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                    return Ok(p);
                }
            }
        }
    }
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("models");
    Ok(base)
}

pub fn kind_dir(app: &AppHandle, kind: ModelKind) -> Result<PathBuf, String> {
    let sub = match kind {
        ModelKind::Whisper => "whisper",
        ModelKind::Nllb => "nllb",
    };
    let p = models_root_dir(app)?.join(sub);
    std::fs::create_dir_all(&p).map_err(|e| e.to_string())?;
    Ok(p)
}

pub fn whisper_model_path(app: &AppHandle, id: &str) -> Result<PathBuf, String> {
    let b =
        bundle_for(ModelKind::Whisper, id).ok_or_else(|| format!("unknown whisper model {id}"))?;
    let f = b.files.first().ok_or("bundle empty")?;
    Ok(kind_dir(app, ModelKind::Whisper)?.join(f.relative_path))
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelRow {
    pub id: String,
    pub kind: String,
    pub display_name: String,
    pub installed: bool,
    pub bytes_on_disk: u64,
    /// True when at least one `.part` resume file exists but the bundle is not fully installed.
    pub has_partial_download: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListModelsResponse {
    pub whisper: Vec<ModelRow>,
    pub nllb: Vec<ModelRow>,
}

fn file_size(path: &Path) -> u64 {
    std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

fn partial_path(dest: &Path) -> PathBuf {
    dest.with_extension("part")
}

/// Final file bytes plus any in-progress `.part` bytes for one catalog file.
fn bytes_for_file(dest: &Path) -> u64 {
    let mut bytes = file_size(dest);
    let partial = partial_path(dest);
    if partial.exists() {
        bytes += file_size(&partial);
    }
    bytes
}

fn bundle_row_stats(root: &Path, files: &[RemoteFile]) -> (bool, u64, bool) {
    let mut installed = true;
    let mut bytes_on_disk = 0u64;
    let mut has_partial = false;
    for f in files {
        let dest = root.join(f.relative_path);
        if !dest.exists() {
            installed = false;
        }
        let partial = partial_path(&dest);
        if partial.exists() && file_size(&partial) > 0 {
            has_partial = true;
        }
        bytes_on_disk += bytes_for_file(&dest);
    }
    let has_partial_download = has_partial && !installed;
    (installed, bytes_on_disk, has_partial_download)
}

fn file_sha256_hex(path: &Path) -> Result<String, String> {
    let data = std::fs::read(path).map_err(|e| e.to_string())?;
    Ok(hex::encode(Sha256::digest(&data)))
}

/// Returns true when `dest` exists and matches `expected_sha256` when provided.
/// Removes `dest` when a hash was expected but did not match.
fn file_is_complete(dest: &Path, expected_sha256: Option<&str>) -> Result<bool, String> {
    if !dest.exists() {
        return Ok(false);
    }
    if let Some(expected) = expected_sha256 {
        let hex = file_sha256_hex(dest)?;
        if hex != expected {
            std::fs::remove_file(dest).map_err(|e| e.to_string())?;
            return Ok(false);
        }
    }
    Ok(true)
}

pub fn list_models(app: &AppHandle) -> Result<ListModelsResponse, String> {
    let mut whisper = Vec::new();
    for b in whisper_bundles() {
        let root = kind_dir(app, ModelKind::Whisper)?;
        let (installed, bytes_on_disk, has_partial_download) =
            bundle_row_stats(root.as_path(), b.files);
        whisper.push(ModelRow {
            id: b.id.to_string(),
            kind: "whisper".into(),
            display_name: b.display_name.to_string(),
            installed,
            bytes_on_disk,
            has_partial_download,
            expected_sha256: b.files[0].expected_sha256.map(String::from),
        });
    }
    let mut nllb = Vec::new();
    for b in nllb_bundles() {
        let root = kind_dir(app, ModelKind::Nllb)?;
        let (installed, bytes_on_disk, has_partial_download) =
            bundle_row_stats(root.as_path(), b.files);
        nllb.push(ModelRow {
            id: b.id.to_string(),
            kind: "nllb".into(),
            display_name: b.display_name.to_string(),
            installed,
            bytes_on_disk,
            has_partial_download,
            expected_sha256: None,
        });
    }
    Ok(ListModelsResponse { whisper, nllb })
}

/// Removes all files for a known bundle (final paths and `.part` resume files).
pub fn delete_bundle(app: &AppHandle, kind: ModelKind, id: &str) -> Result<(), String> {
    let bundle = bundle_for(kind, id).ok_or_else(|| format!("unknown model {id}"))?;
    let root = kind_dir(app, kind)?;
    for f in bundle.files {
        let dest = root.join(f.relative_path);
        if dest.exists() {
            std::fs::remove_file(&dest).map_err(|e| e.to_string())?;
        }
        let partial = partial_path(&dest);
        if partial.exists() {
            std::fs::remove_file(&partial).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Ignore tiny HEAD lengths from HF LFS pointer stubs.
const MIN_HEAD_BYTES: u64 = 4096;

async fn head_content_length(client: &reqwest::Client, url: &str) -> Option<u64> {
    let resp = client.head(url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let len = resp.content_length()?;
    if len < MIN_HEAD_BYTES {
        return None;
    }
    Some(len)
}

fn file_expected_bytes(file: &RemoteFile) -> Option<u64> {
    file.expected_bytes
}

async fn estimate_bundle_total(client: &reqwest::Client, files: &[RemoteFile]) -> u64 {
    let mut total = 0u64;
    for f in files {
        if let Some(n) = file_expected_bytes(f) {
            total += n;
        } else if let Some(n) = head_content_length(client, f.url).await {
            total += n;
        }
    }
    total.max(1)
}

fn parse_content_range_total(value: &str) -> Option<u64> {
    // bytes 0-1023/2460457927
    let slash = value.rfind('/')?;
    value[slash + 1..].parse().ok()
}

fn response_file_total(resp: &reqwest::Response, range_start: u64) -> Option<u64> {
    if let Some(cr) = resp
        .headers()
        .get(reqwest::header::CONTENT_RANGE)
        .and_then(|v| v.to_str().ok())
    {
        if let Some(total) = parse_content_range_total(cr) {
            return Some(total);
        }
    }
    resp.content_length().map(|len| range_start + len)
}

struct DownloadOneFileParams<'a> {
    app: &'a AppHandle,
    client: &'a reqwest::Client,
    kind: ModelKind,
    bundle_id: &'a str,
    dest: &'a Path,
    url: &'a str,
    file: &'a RemoteFile,
    expected_sha256: Option<&'a str>,
    file_index: usize,
    file_total: usize,
    downloaded_base: u64,
    estimated_total: u64,
}

async fn download_one_file(p: DownloadOneFileParams<'_>) -> Result<(), String> {
    let DownloadOneFileParams {
        app,
        client,
        kind,
        bundle_id,
        dest,
        url,
        file,
        expected_sha256,
        file_index,
        file_total,
        downloaded_base,
        estimated_total,
    } = p;
    let partial = partial_path(dest);
    loop {
        let start = if partial.exists() {
            partial
                .metadata()
                .map(|m| m.len())
                .map_err(|e| e.to_string())?
        } else {
            0
        };

        let mut req = client.get(url);
        if start > 0 {
            req = req.header("Range", format!("bytes={start}-"));
        }

        let resp = req.send().await.map_err(|e| e.to_string())?;
        let status = resp.status();

        if start > 0 && status == reqwest::StatusCode::RANGE_NOT_SATISFIABLE {
            tokio::fs::remove_file(&partial).await.ok();
            continue;
        }

        if start > 0 && status == reqwest::StatusCode::OK {
            tokio::fs::remove_file(&partial).await.ok();
            continue;
        }

        if !(status.is_success()) {
            return Err(format!("HTTP {status} for {url}"));
        }

        let mut progress_total = estimated_total;
        if let Some(file_total_bytes) = response_file_total(&resp, start) {
            let floor = file_expected_bytes(file).unwrap_or(0);
            let file_bytes = file_total_bytes.max(floor);
            progress_total = progress_total.max(downloaded_base + file_bytes);
        }

        let append = start > 0 && status == reqwest::StatusCode::PARTIAL_CONTENT;

        let mut file = if append {
            tokio::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&partial)
                .await
                .map_err(|e| e.to_string())?
        } else {
            tokio::fs::File::create(&partial)
                .await
                .map_err(|e| e.to_string())?
        };

        let mut received = start;
        let mut stream = resp.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            received += chunk.len() as u64;
            let bytes_received = downloaded_base + received;
            emit_model_progress(
                app,
                ModelProgressPayload {
                    kind: kind.as_str().to_string(),
                    id: bundle_id.to_string(),
                    bytes_received,
                    total_bytes: Some(progress_total.max(bytes_received)),
                    phase: format!("file {}/{}", file_index + 1, file_total),
                },
            );
        }
        file.flush().await.map_err(|e| e.to_string())?;
        drop(file);

        if let Some(expected) = expected_sha256 {
            let hex = file_sha256_hex(&partial)?;
            if hex != expected {
                return Err(format!("sha256 mismatch: got {hex} expected {expected}"));
            }
        }

        std::fs::rename(&partial, dest).map_err(|e| e.to_string())?;
        return Ok(());
    }
}

pub async fn download_bundle(app: AppHandle, kind: ModelKind, id: String) -> Result<(), String> {
    let bundle = bundle_for(kind, &id).ok_or_else(|| format!("unknown model {id}"))?;
    let client = reqwest::Client::builder()
        .user_agent("voxia/0.1 (model download)")
        .build()
        .map_err(|e| e.to_string())?;

    let estimated_total = estimate_bundle_total(&client, bundle.files).await;

    let mut downloaded = 0u64;
    let n = bundle.files.len();
    for (i, f) in bundle.files.iter().enumerate() {
        let root = kind_dir(&app, kind)?;
        let dest = root.join(f.relative_path);
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        if file_is_complete(&dest, f.expected_sha256)? {
            downloaded += file_size(&dest);
            emit_model_progress(
                &app,
                ModelProgressPayload {
                    kind: kind.as_str().to_string(),
                    id: id.clone(),
                    bytes_received: downloaded,
                    total_bytes: Some(estimated_total.max(downloaded)),
                    phase: format!("file {}/{} (cached)", i + 1, n),
                },
            );
            continue;
        }
        download_one_file(DownloadOneFileParams {
            app: &app,
            client: &client,
            kind,
            bundle_id: &id,
            dest: &dest,
            url: f.url,
            file: f,
            expected_sha256: f.expected_sha256,
            file_index: i,
            file_total: n,
            downloaded_base: downloaded,
            estimated_total,
        })
        .await?;
        downloaded += file_size(&dest);
    }

    emit_model_progress(
        &app,
        ModelProgressPayload {
            kind: kind.as_str().to_string(),
            id: id.clone(),
            bytes_received: downloaded,
            total_bytes: Some(estimated_total.max(downloaded)),
            phase: "complete".into(),
        },
    );
    Ok(())
}
