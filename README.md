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

- **Pull request titles** must be conventional (e.g. `feat: add cue split shortcut`) — enforced in CI on PRs **into `main` / `master` only**.
- Examples: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`

[release-please](https://github.com/googleapis/release-please) opens a **Release PR** that bumps versions and updates `CHANGELOG.md`. Merging that PR creates tag `voxia-vX.Y.Z` (component prefix from config) and a GitHub Release, which triggers the Tauri build workflow.

### Maintainer setup (one-time)

1. **Updater signing keys** (if rotating keys, update `plugins.updater.pubkey` in `tauri.conf.json` to match the new public key):

   ```bash
   CI=true bun run tauri signer generate -w .tauri/voxia.key -f
   ```

   - Copy the **public** key (single line) into `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
     - Set GitHub repository secret:
       - `TAURI_SIGNING_PRIVATE_KEY` — full contents of `.tauri/voxia.key` (never commit).
     - If the key has **no password** (default when using `CI=true … signer generate -f`), **do not** create `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in GitHub Secrets. An empty value causes `Wrong password for that key` in CI.
     - Only add `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if you explicitly set a password when generating the key.

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
3. **`Tag Release`** creates git tag `voxia-vX.Y.Z` for any merged release PR still missing a tag (runs on every push to `main`, not only the release merge commit).
4. Tag push starts **`Release`**, which builds macOS (`.dmg`), Windows (`.msi` / `.exe`), and Linux (`.AppImage`), creates the GitHub Release, and uploads assets (plus `latest.json` for the updater).
5. Users: **Settings → Updates → Check for updates** (production builds only).

**Release PR merged but no deploy?** Push any commit to `main` (or run **Actions → Tag Release**) — it scans for merged release PRs without tags. With `skip-github-release`, release-please will not create the tag itself ([upstream issue](https://github.com/googleapis/release-please/issues/1561)). Manual recovery:

1. **Actions → Tag Release → Run workflow** with version e.g. `0.3.0`, or leave empty to tag all missing releases.
2. Or create the tag locally: `git tag voxia-v0.3.0 <release-merge-sha> && git push origin voxia-v0.3.0`
3. Ensure **`RELEASE_PLEASE_TOKEN`** is set so tag pushes trigger **Release**.

**Only see “Source code (zip)” on the release?** GitHub always adds those automatically. Installers appear only after the **`Release`** workflow succeeds.

- **Cause:** Releases created with the default `GITHUB_TOKEN` do **not** start other workflows. Configure `RELEASE_PLEASE_TOKEN` (PAT) for release-please (see step 5 above), _or_ run **Actions → Release → Run workflow** from branch **`main`**, and enter the tag exactly as on GitHub (e.g. `voxia-v0.2.0`, not `v0.2.0`).
- **Also required:** secret `TAURI_SIGNING_PRIVATE_KEY` (see step 1).
- Check **Actions → Release** for failed macOS / Windows / Linux jobs.

**`Cannot upload assets to an immutable release`:** release-please used to publish an empty GitHub Release first; re-uploading installers then fails. Fix for an existing tag:

1. GitHub → **Releases** → open the release → **Delete release** (keep the git tag).
2. **Actions → Release → Run workflow** from **`main`**, tag = e.g. `voxia-v0.2.2`.

Future releases use `skip-github-release: true` in release-please config so only **Release** creates the GitHub Release.

Private repositories: the default `latest.json` URL requires a **public** release asset URL; use a custom endpoint or proxy if the repo is private.

## IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
