#!/usr/bin/env bash
# Ensure whisper-rs-sys / whisper.cpp see macOS 10.15+ for std::filesystem even if the parent shell
# exports a lower MACOSX_DEPLOYMENT_TARGET (common with Xcode toolchains).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$(uname -s)" == Darwin ]]; then
  export MACOSX_DEPLOYMENT_TARGET="10.15"
  export CMAKE_OSX_DEPLOYMENT_TARGET="10.15"
fi
TAURI_BIN="$ROOT/node_modules/.bin/tauri"
if [[ ! -x "$TAURI_BIN" ]]; then
  echo "tauri CLI not found at $TAURI_BIN — run: bun install" >&2
  exit 127
fi
exec "$TAURI_BIN" "$@"
