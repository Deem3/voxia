#!/usr/bin/env bash
# Copy a static ffmpeg binary next to Tauri build outputs for local dev / bundling.
# Usage: ./scripts/prepare-ffmpeg-sidecar.sh /path/to/ffmpeg
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "usage: $0 /path/to/ffmpeg" >&2
  exit 1
fi
TRIPLE="$(rustc --print host-tuple 2>/dev/null || echo "")"
if [[ -z "$TRIPLE" ]]; then
  echo "rustc not found; cannot determine host triple" >&2
  exit 1
fi
mkdir -p "$ROOT/src-tauri/binaries"
EXT=""
if [[ "$(uname -s)" == MINGW* ]] || [[ "$(uname -s)" == MSYS* ]] || [[ "$(uname -s)" == CYGWIN* ]]; then
  EXT=".exe"
fi
DST_NAME="ffmpeg-${TRIPLE}${EXT}"
install -m0755 "$SRC" "$ROOT/src-tauri/binaries/$DST_NAME"
echo "installed src-tauri/binaries/$DST_NAME"
for profile in debug release; do
  TDIR="$ROOT/src-tauri/target/$profile/binaries"
  if [[ -d "$(dirname "$TDIR")" ]]; then
    mkdir -p "$TDIR"
    install -m0755 "$SRC" "$TDIR/ffmpeg${EXT}"
    echo "installed $TDIR/ffmpeg${EXT}"
  fi
done
