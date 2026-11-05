#!/usr/bin/env bash
# ========================================================
# Sistem Payroll & Distribusi Slip Gaji WhatsApp
# Script Menjalankan Server Aplikasi (Zero-CLI Friendly)
# ========================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# Pastikan Node.js ada di PATH
export PATH="/home/server100/.gemini/antigravity-ide/bin:/home/server100/.nvm/versions/node/v20.20.2/bin:$PATH"

echo "=========================================================="
echo "Memulai Sistem Payroll & Distribusi Slip Gaji WhatsApp..."
echo "Akses Dashboard di: http://localhost:3000"
echo "=========================================================="

npm run dev
