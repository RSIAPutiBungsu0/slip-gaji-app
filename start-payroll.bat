@echo off
setlocal enabledelayedexpansion
title Sistem Payroll & Slip Gaji WhatsApp

:: Masuk ke direktori folder script ini berada agar path ./ selalu tepat
cd /d "%~dp0"

echo ========================================================
echo Sistem Payroll ^& Distribusi Slip Gaji WhatsApp
echo Direktori  : %CD%
echo Penyimpanan: %CD%\Payroll
echo Akses Web  : http://localhost:3000
echo ========================================================

:: Pastikan Node.js terinstall
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js tidak ditemukan di sistem Windows ini!
  echo Harap install Node.js (v18+) dari https://nodejs.org/
  pause
  exit /b 1
)

:: Pastikan folder lokal Payroll siap
if not exist "Payroll\data" mkdir "Payroll\data"
if not exist "Payroll\slips" mkdir "Payroll\slips"
if not exist "Payroll\logs" mkdir "Payroll\logs"
if not exist "Payroll\backup" mkdir "Payroll\backup"
if not exist "Payroll\config" mkdir "Payroll\config"

:: Pastikan dependensi terinstall
if not exist "node_modules" (
  echo [INFO] Menyiapkan dependensi node_modules...
  call npm install
)

:: Buka browser secara otomatis
start "" http://localhost:3000

:: Jalankan server Next.js
call npm run dev

pause

