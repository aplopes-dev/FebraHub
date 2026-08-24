#!/usr/bin/env bash
#
# Instala o toolchain Linux desktop do Flutter no Ubuntu/Debian.
# Precisa de sudo (senha no terminal).
#
# Uso:
#   ./tool/setup-linux-deps.sh
#
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  echo "erro: rode como usuário normal (o script chama sudo)." >&2
  exit 1
fi

echo "==> Pacotes do toolchain Linux (Flutter desktop + GTK + libsecret)"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  clang \
  cmake \
  ninja-build \
  pkg-config \
  libgtk-3-dev \
  liblzma-dev \
  libstdc++-14-dev \
  libsecret-1-dev \
  libjsoncpp-dev \
  xz-utils \
  gnome-keyring

export PATH="${HOME}/flutter/bin:${PATH}"

if ! command -v flutter >/dev/null 2>&1; then
  echo "aviso: flutter não está no PATH. Exporte: export PATH=\"\$HOME/flutter/bin:\$PATH\"" >&2
else
  echo "==> flutter doctor (Linux toolchain)"
  flutter doctor
fi

echo
echo "Pronto. Depois:"
echo "  cd apps/pdv/app"
echo "  export PATH=\"\$HOME/flutter/bin:\$PATH\""
echo "  flutter pub get"
echo "  flutter run -d linux"
