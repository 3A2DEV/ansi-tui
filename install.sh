#!/usr/bin/env bash
# ansi-tui installer
# Usage:
#   Online:        ./install.sh
#   From npm pack: ./install.sh --local ./ansi-tui-0.1.0.tgz
#   No install:    npx ansi-tui
set -euo pipefail

PREFIX="${HOME}/.local"
MODE="online"
TARBALL=""

if [[ "${1:-}" == "--local" ]]; then
  MODE="local"
  TARBALL="${2:?Path to .tgz required for local install}"
fi

mkdir -p "${PREFIX}/lib" "${PREFIX}/bin"

if [[ "${MODE}" == "online" ]]; then
  npm install -g --prefix "${PREFIX}" ansi-tui
else
  npm install -g --prefix "${PREFIX}" "${TARBALL}"
fi

echo "ansi-tui installed to ${PREFIX}/bin/ansi-tui"
echo "Ensure ${PREFIX}/bin is in your PATH."
