# Bundled FFmpeg (optional)

Voxia decodes audio with **FFmpeg**. By default the app looks for:

1. `VOXIA_FFMPEG` — absolute path to an `ffmpeg` executable  
2. A binary next to the app: `binaries/ffmpeg` (or `binaries/ffmpeg.exe` on Windows), same folder as the main executable  
3. Otherwise common install locations (e.g. `/opt/homebrew/bin/ffmpeg` on Apple Silicon, `/usr/local/bin/ffmpeg`, `/usr/bin/ffmpeg` on Linux)  
4. Otherwise `ffmpeg` / `ffmpeg.exe` on your `PATH`

If you ran `./scripts/prepare-ffmpeg-sidecar.sh /path/to/ffmpeg`, the app also picks up `binaries/ffmpeg-<host-triple>` next to the executable (see scan in `src-tauri/src/audio.rs`).

## Tauri `externalBin` (release bundles)

To ship a sidecar with `tauri build`, add under `bundle` in `tauri.conf.json` (not enabled by default so CI builds without a local ffmpeg still work):

```json
"externalBin": ["binaries/ffmpeg"]
```

Then place one static build per target triple next to this README, for example:

- `ffmpeg-aarch64-apple-darwin`
- `ffmpeg-x86_64-apple-darwin`
- `ffmpeg-x86_64-pc-windows-msvc.exe`
- `ffmpeg-x86_64-unknown-linux-gnu`

Your host triple: `rustc --print host-tuple`.

## Helper script

From the repo root, after downloading a static `ffmpeg` for your OS:

```bash
chmod +x scripts/prepare-ffmpeg-sidecar.sh
./scripts/prepare-ffmpeg-sidecar.sh /path/to/ffmpeg
# or: bun run prepare:ffmpeg -- /path/to/ffmpeg
```

This copies into `src-tauri/binaries/ffmpeg-<triple>` and, if `src-tauri/target/` exists, into `target/debug/binaries/` and `target/release/binaries/` for local `cargo run` / `tauri dev`.

Do **not** commit proprietary binaries unless your license allows it; prefer documenting download URLs in your release process.
