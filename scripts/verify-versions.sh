#!/usr/bin/env bash
# Fail if package.json, Cargo.toml, and tauri.conf.json versions diverge.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PKG="$(
  node -e "console.log(require('$ROOT/package.json').version)"
)"
CARGO="$(
  awk -F'"' '/^version = / { print $2; exit }' "$ROOT/src-tauri/Cargo.toml"
)"
TAURI="$(
  node -e "console.log(require('$ROOT/src-tauri/tauri.conf.json').version)"
)"

if [[ "$PKG" != "$CARGO" || "$PKG" != "$TAURI" ]]; then
  echo "Version mismatch:" >&2
  echo "  package.json:     $PKG" >&2
  echo "  Cargo.toml:       $CARGO" >&2
  echo "  tauri.conf.json:  $TAURI" >&2
  exit 1
fi

echo "Versions aligned at $PKG"
