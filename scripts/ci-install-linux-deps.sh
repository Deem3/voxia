#!/usr/bin/env bash
# Apt packages required to compile Tauri 2 on Ubuntu (GTK / GLib / WebKit).
set -euo pipefail

sudo apt-get update
sudo apt-get install -y \
  build-essential \
  cmake \
  pkg-config \
  libssl-dev \
  libclang-dev \
  libglib2.0-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libxdo-dev \
  patchelf \
  unzip \
  curl \
  wget \
  file
