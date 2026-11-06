# Sistem Distribusi Slip Gaji WhatsApp & Payroll (Universal: Windows & Linux)

Aplikasi otomasi penggajian (payroll) dan distribusi slip gaji digital via WhatsApp berbasis Next.js 16 (App Router), ExcelJS, jsPDF, dan ImageResponse. Didesain secara portabel untuk berjalan lancar di lingkungan **Windows & Linux** dengan path relatif `./Payroll` yang dapat dijalankan dari folder manapun tanpa konfigurasi rumit.

---

## 🚀 Cara Menjalankan Aplikasi

### Di Windows:
Cukup klik ganda (double-click) file:
```cmd
start-payroll.bat
```
Atau jalankan via Terminal (CMD/PowerShell):
```cmd
start-payroll.bat
```

---

### Di Linux:
Jalankan via terminal atau skrip otomatis:
```bash
chmod +x start-payroll.sh
./start-payroll.sh
```

Aplikasi otomatis membuka browser di: **http://localhost:3000**

---

### 2. Menjalankan Manual dengan npm
```bash
npm install
npm run dev
```

Untuk mode produksi di Linux server:
```bash
npm run build
npm start
```

---

### 3. Menjalankan via Docker & Docker Compose
```bash
docker compose up -d --build
```
Semua data tersimpan persisten di folder volume `./Payroll`.

---

## 📂 Struktur Folder Penyimpanan Lokal di Linux

Aplikasi menggunakan path relatif portabel yang terpusat di folder `./Payroll`:

```
Payroll/
├── data/
│   ├── payroll.xlsx          # Master file Excel data gaji aktif
│   └── payroll-template.xlsx # Template standar Excel instansi
├── slips/
│   └── 2026-11/             # File PDF & PNG slip gaji per periode
├── logs/
│   ├── audit.log             # Catatan audit aktivitas sistem
│   └── history-2026-11.json  # Riwayat status distribusi WhatsApp
├── backup/                   # Cadangan otomatis setiap file Excel diperbarui
└── config/
    └── app-settings.json     # Konfigurasi instansi, WhatsApp, dan path
```

---

## 🖥️ Zero-CLI Desktop Shortcut (Untuk Staf Finance)

Untuk menjalankan atau membuka aplikasi langsung dari desktop Linux tanpa membuka terminal:

1. Salin `payroll.desktop` ke folder aplikasi atau Desktop:
   ```bash
   cp payroll.desktop ~/.local/share/applications/
   # Atau ke desktop:
   cp payroll.desktop ~/Desktop/
   chmod +x ~/Desktop/payroll.desktop
   ```
2. Klik 2x shortcut tersebut untuk membuka dashboard di browser bawaan Linux.

---

## ⚙️ Integrasi Sistem & Native Opener Linux

* **Buka File Excel Langsung:** Menggunakan `xdg-open` standar Linux desktop untuk membuka file `.xlsx` dengan aplikasi default (LibreOffice Calc, WPS Spreadsheets, OnlyOffice).
* **Salin Slip Gaji:** Format gambar PNG di-render langsung dan disalin ke clipboard sistem Linux, siap di-paste (`Ctrl+V`) ke WhatsApp Web.
* **Auto-Start di Linux Server:** Tersedia template `payroll.service.example` untuk systemd service.
