//! Whisper inference — requires `--features whisper` (links `whisper-rs` / whisper.cpp).

use crate::project::Cue;

#[cfg(feature = "whisper")]
use std::ffi::CString;
#[cfg(feature = "whisper")]
use std::path::Path;
#[cfg(feature = "whisper")]
use uuid::Uuid;
#[cfg(feature = "whisper")]
use whisper_rs::{
    FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters, WhisperSegment,
};

/// Prefer `whisper_full_get_segment_text`; if it is empty, rebuild from per-token strings (same
/// idea as whisper.cpp segment assembly). Skips special tokens with `id >= token_eot`.
#[cfg(feature = "whisper")]
fn cue_text_from_whisper_segment(ctx: &WhisperContext, seg: &WhisperSegment<'_>) -> String {
    let primary = seg
        .to_str_lossy()
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    if !primary.is_empty() {
        return primary;
    }

    let eot = ctx.token_eot();
    let n = seg.n_tokens();
    let mut assembled = String::new();
    for i in 0..n {
        let Some(tok) = seg.get_token(i) else {
            continue;
        };
        if tok.token_id() >= eot {
            continue;
        }
        if let Ok(chunk) = tok.to_str_lossy() {
            assembled.push_str(&chunk);
        }
    }
    let out = assembled.trim().to_string();
    if out.is_empty() && n > 0 {
        log::warn!(
            "[asr] segment idx={} has {} tokens but empty text after token assembly",
            seg.segment_index(),
            n
        );
    }
    out
}

#[cfg(feature = "whisper")]
pub fn transcribe_f32_samples(
    model_path: &Path,
    samples: &[f32],
    language: Option<&str>,
    transcribe_cancel_token: tokio_util::sync::CancellationToken,
    on_progress: impl Fn(i32) + Send + Sync + 'static,
) -> Result<Vec<Cue>, String> {
    log::info!(
        "[asr] transcribe_f32_samples called, {} samples",
        samples.len()
    );
    let model = model_path
        .to_str()
        .ok_or_else(|| "model path utf-8".to_string())?;
    log::info!("[asr] loading whisper model: {model}");
    let ctx = WhisperContext::new_with_params(model, WhisperContextParameters::default()).map_err(
        |e| {
            log::error!("[asr] WhisperContext::new_with_params failed: {e}");
            e.to_string()
        },
    )?;
    log::info!("[asr] model loaded, creating state…");
    let mut state = ctx.create_state().map_err(|e| {
        log::error!("[asr] create_state failed: {e}");
        e.to_string()
    })?;
    log::info!("[asr] state created");

    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    let threads = std::thread::available_parallelism()
        .map(|n| n.get() as i32)
        .unwrap_or(4);
    log::info!("[asr] using {threads} threads");
    params.set_n_threads(threads);
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    params.set_translate(false);

    let auto = language
        .map(|l| l.is_empty() || l.eq_ignore_ascii_case("auto"))
        .unwrap_or(true);
    let lang_c = if auto {
        None
    } else {
        language.and_then(|l| CString::new(l).ok())
    };
    // whisper.cpp: if `detect_language` is true, `whisper_full` returns right after
    // `whisper_lang_auto_detect` and never runs the decoder — so you get 0 segments.
    // For transcription, keep `detect_language` false and use `language: None` (or "auto");
    // whisper still auto-detects language in that case, then continues to decode.
    if auto {
        log::info!("[asr] language: auto (detect then transcribe)");
        params.set_detect_language(false);
        params.set_language(None);
    } else if let Some(ref c) = lang_c {
        log::info!("[asr] language: {:?}", c);
        params.set_detect_language(false);
        params.set_language(Some(c.to_str().map_err(|_| "language utf-8")?));
    } else {
        log::info!("[asr] language: auto fallback (invalid language string)");
        params.set_detect_language(false);
        params.set_language(None);
    }

    // whisper-rs 0.16.0 `set_abort_callback_safe` is broken: it stores `Box<dyn FnMut() -> bool>`
    // but registers `trampoline::<F>` for the concrete closure type — UB when whisper.cpp calls
    // it from C++, often surfacing as `panic in a function that cannot unwind`. Skip in-process
    // abort; cancellation still applies after `full()` and during ffmpeg decode upstream.
    let cancel_post = transcribe_cancel_token.clone();
    params.set_progress_callback_safe(move |p| {
        on_progress(p);
    });

    log::info!("[asr] starting whisper inference (state.full)…");
    state.full(params, samples).map_err(|e| {
        log::error!("[asr] state.full() failed: {e}");
        e.to_string()
    })?;
    log::info!("[asr] whisper inference complete");

    if cancel_post.is_cancelled() {
        log::info!("[asr] cancelled after inference");
        return Err("cancelled".into());
    }

    let mut cues = Vec::new();
    for seg in state.as_iter() {
        let start_ms = seg.start_timestamp() * 10;
        let end_ms = seg.end_timestamp() * 10;
        let text = cue_text_from_whisper_segment(&ctx, &seg);
        cues.push(Cue {
            id: Uuid::new_v4().to_string(),
            start_ms,
            end_ms,
            text,
            translated_text: None,
        });
    }
    log::info!("[asr] extracted {} cues", cues.len());
    Ok(cues)
}

#[cfg(not(feature = "whisper"))]
pub fn transcribe_f32_samples(
    _model_path: &std::path::Path,
    _samples: &[f32],
    _language: Option<&str>,
    _cancel: tokio_util::sync::CancellationToken,
    _on_progress: impl Fn(i32) + Send + Sync + 'static,
) -> Result<Vec<Cue>, String> {
    Err("Whisper ASR is not included in this build (Cargo was built with --no-default-features). Rebuild with default features, e.g. `cargo build -p voxia` or `bun run tauri build`.".into())
}
