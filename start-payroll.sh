#!/usr/bin/env bash
# ========================================================
# Sistem Payroll & Distribusi Slip Gaji WhatsApp
# Script Menjalankan Server Aplikasi (Linux Native)
# ========================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# Cari Node.js dan npm secara dinamis
if ! command -v node >/dev/null 2>&1; then
  # 1. Coba load NVM dari home user saat ini
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  elif [ -s "/usr/local/share/nvm/nvm.sh" ]; then
    export NVM_DIR="/usr/local/share/nvm"
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
fi

# 2. Jika masih belum ada di PATH, cari di folder instalasi umum Linux
if ! command -v node >/dev/null 2>&1; then
  for p in \
    /usr/bin \
    /usr/local/bin \
    /snap/bin \
    "$HOME/.nvm/versions/node/"*/bin \
    "$HOME/.asdf/shims" \
    "$HOME/.fnm/current/bin" \
    "$HOME/.local/bin"; do
    if [ -x "$p/node" ]; then
      export PATH="$p:$PATH"
      break
    fi
  done
fi

if ! command -v node >/dev/null 2>&1; then
  echo "=========================================================="
  echo "[ERROR] Node.js tidak ditemukan di sistem Linux ini!"
  echo "Harap pastikan Node.js (v18+) terinstall di server / komputer."
  echo "=========================================================="
  exit 1
fi

# Pastikan dependensi node_modules terinstall
if [ ! -d "$DIR/node_modules" ]; then
  echo "[INFO] Folder node_modules belum ditemukan, menjalankan npm install..."
  npm install
fi

# Pastikan folder penyimpanan lokal Payroll siap
mkdir -p "$DIR/Payroll/data" "$DIR/Payroll/slips" "$DIR/Payroll/logs" "$DIR/Payroll/backup" "$DIR/Payroll/config"

NODE_VER=$(node -v)
NPM_VER=$(npm -v)

echo "=========================================================="
echo "Sistem Payroll & Distribusi Slip Gaji WhatsApp"
echo "OS / Kernel : $(uname -s) $(uname -r) ($(uname -m))"
echo "Node.js     : $NODE_VER | npm: $NPM_VER"
echo "Direktori   : $DIR"
echo "Penyimpanan : $DIR/Payroll"
echo "Akses Web   : http://localhost:3000"
echo "=========================================================="

exec npm run dev
