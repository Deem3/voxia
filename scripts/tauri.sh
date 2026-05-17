#!/usr/bin/env bash
# Ensure whisper-rs-sys / whisper.cpp see macOS 10.15+ for std::filesystem even if the parent shell
# exports a lower MACOSX_DEPLOYMENT_TARGET (common with Xcode toolchains).
set -euo pipefail
if [[ "$(uname -s)" == Darwin ]]; then
  export MACOSX_DEPLOYMENT_TARGET="10.15"
  export CMAKE_OSX_DEPLOYMENT_TARGET="10.15"
fi
exec tauri "$@"
