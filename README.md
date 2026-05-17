# Voxia

Desktop app (Tauri 2 + React 19 + Vite) for local video transcription, subtitle editing, and translation. See `spec/plan.md` for the full phased roadmap.

## Prerequisites

- [Bun](https://bun.sh/) and Rust stable
- **FFmpeg** for audio decode (see below)
- **Whisper ASR** is enabled by default (`whisper` is in Cargo **default** features and links `whisper-rs`; Metal on macOS). Use `cargo build -p voxia --no-default-features` only if you need a build without transcription.

### FFmpeg resolution

The Rust backend picks an `ffmpeg` executable in this order:

1. **`VOXIA_FFMPEG`** — absolute path to your `ffmpeg` binary  
2. **`binaries/ffmpeg`** (or `binaries/ffmpeg.exe` on Windows) in the same directory as the running app (useful for `tauri build` + `externalBin`, or after running the helper script)  
3. **`ffmpeg` on `PATH`**

Release builds bundle FFmpeg via `bundle.externalBin`. Before `bun run tauri build`, prepare the sidecar:

```bash
bun run prepare:ffmpeg -- "$(command -v ffmpeg)"
```

See `src-tauri/binaries/README.md` for per-target filenames.

## Commands

```bash
bun install
bun run tauri dev
```

Production web build:

```bash
bun run build
```

Rust checks (also run in CI):

```bash
cd src-tauri && cargo fmt --all -- --check && cargo clippy --all-targets -- -D warnings && cargo test
```

### Whisper-disabled stub build (optional)

```bash
cd src-tauri && cargo build --no-default-features
```

That omits `whisper-rs`; `transcribe_project` then returns the stub error from `asr.rs`.

## Releases and versioning

Versions are kept in sync across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`. Verify with:

```bash
bun run verify:versions
```

### Conventional commits

Use [Conventional Commits](https://www.conventionalcommits.org/) on `main`:

- **Pull request titles** must be conventional (e.g. `feat: add cue split shortcut`) — enforced in CI.
- Examples: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`

[release-please](https://github.com/googleapis/release-please) opens a **Release PR** that bumps versions and updates `CHANGELOG.md`. Merging that PR creates tag `vX.Y.Z` and a GitHub Release, which triggers the Tauri build workflow.

### Maintainer setup (one-time)

1. **Updater signing keys** (if rotating keys, update `plugins.updater.pubkey` in `tauri.conf.json` to match the new public key):

   ```bash
   CI=true bun run tauri signer generate -w .tauri/voxia.key -f
   ```

   - Copy the **public** key (single line) into `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
   - Set GitHub repository secrets:
     - `TAURI_SIGNING_PRIVATE_KEY` — full contents of `.tauri/voxia.key` (never commit).
     - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — leave empty if the key has no password.

2. **GitHub repo URL** — set `plugins.updater.endpoints` in `tauri.conf.json` to your repo:

   `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`

3. **Optional code signing** (recommended for distribution, separate from updater signing):
   - macOS: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`
   - Windows: `WINDOWS_CERTIFICATE`

4. Enable branch protection on `main`: require PR title / CI checks to pass.

5. **release-please must open PRs** — in the repo on GitHub go to **Settings → Actions → General → Workflow permissions**:
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
   - Save

   If your organization forbids that for `GITHUB_TOKEN`, create a fine-grained PAT (or classic PAT) with **Contents** and **Pull requests** write access on this repo, add it as secret `RELEASE_PLEASE_TOKEN`, and re-run the workflow.

### Release flow

1. Merge conventional commits to `main`.
2. Merge the **release-please** Release PR when ready to ship.
3. GitHub Actions `release.yml` builds macOS (aarch64), Windows, and Linux artifacts, signs updater bundles, and uploads `latest.json`.
4. Users: **Settings → Updates → Check for updates** (production builds only).

Private repositories: the default `latest.json` URL requires a **public** release asset URL; use a custom endpoint or proxy if the repo is private.

## IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
