# Voxia — overview (logic track)

Voxia is a Tauri 2 desktop app for offline-first transcription (Whisper), subtitle editing, translation (pluggable providers), and SRT/VTT export.

This repository’s **logic-only** track implements Rust commands, events, persistence on disk, and TypeScript stores/API helpers without the planned shadcn/Tailwind shell.

## Paths

- **Models root:** `{app_data_dir}/models/{whisper,nllb}/`
- **Project file:** `<video_stem>.voxia.json` adjacent to the video file (same parent directory).

## FFmpeg

Development builds expect the `ffmpeg` CLI on your `PATH` (for example `brew install ffmpeg`). The Tauri `externalBin` sidecar hook was removed from `tauri.conf.json` so CI and fresh clones compile without vendoring per-target binaries; you can restore `bundle.externalBin` and ship `src-tauri/binaries/ffmpeg-*` for release.

## Whisper (`whisper-rs`)

ASR links **`whisper-rs`** by default: the **`whisper`** feature is included in **`default`**, so `cargo check`, `bun run tauri dev`, and release builds run real inference (Metal on macOS via the target-specific dependency).

For a **stub** build without Whisper (e.g. very constrained CI), use `cargo build -p voxia --no-default-features`. Then `transcribe_project` returns the clear error from the stub in `asr.rs`.
