#!/usr/bin/env bash
# Install ffmpeg for release CI and run prepare-ffmpeg-sidecar.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN_DIR="${RUNNER_TEMP:-/tmp}/ffmpeg-ci"
mkdir -p "$BIN_DIR"

RUNNER_OS="${RUNNER_OS:-$(uname -s)}"
FFMPEG_BIN=""

case "$RUNNER_OS" in
  Linux)
    sudo apt-get update -qq
    sudo apt-get install -y -qq ffmpeg
    FFMPEG_BIN="$(command -v ffmpeg)"
    ;;
  macOS)
    if ! command -v brew >/dev/null 2>&1; then
      echo "Homebrew required on macOS CI" >&2
      exit 1
    fi
    brew install ffmpeg
    FFMPEG_BIN="$(brew --prefix)/bin/ffmpeg"
    ;;
  Windows)
    ARCHIVE="$BIN_DIR/ffmpeg-win.zip"
    curl -fsSL "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -o "$ARCHIVE"
    unzip -qo "$ARCHIVE" -d "$BIN_DIR"
    FFMPEG_BIN="$(find "$BIN_DIR" -name ffmpeg.exe -type f | head -n 1)"
    ;;
  *)
    echo "Unsupported RUNNER_OS: $RUNNER_OS" >&2
    exit 1
    ;;
esac

if [[ -z "$FFMPEG_BIN" || ! -f "$FFMPEG_BIN" ]]; then
  echo "Could not resolve ffmpeg binary" >&2
  exit 1
fi

# Copy into RUNNER_TEMP — do not chmod system paths like /usr/bin/ffmpeg (fails in CI).
LOCAL_FFMPEG="$BIN_DIR/$(basename "$FFMPEG_BIN")"
cp "$FFMPEG_BIN" "$LOCAL_FFMPEG"
chmod +x "$LOCAL_FFMPEG"

"$ROOT/scripts/prepare-ffmpeg-sidecar.sh" "$LOCAL_FFMPEG"
echo "ffmpeg sidecar ready for $(rustc --print host-tuple)"
