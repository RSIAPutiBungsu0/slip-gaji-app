import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { PAYROLL_ROOT_DIR, ensureDir } from '../storage/file-store';
import { logAudit } from '../logger/audit';

export const SAMPLE_EMPLOYEES = [
  {
    no: 37,
    nik: '100237',
    nama: 'Irsyad Syarifuddin, S.Kom',
    bulan: 'OKTOBER',
    tahun: 2026,
    unit: 'IT',
    subUnit: '-',
    jabatan: 'Pelaksana',
    status: 'Full Time',
    rekening: 'Bank Mandiri - 1140029384729',
    wa: '081234567890',
    // Penghasilan Tetap
    gapok: 2150000,
    // Tunjangan
    tunjJabatan: 0,
    tunjProfesi: 250000,
    tunjKehadiran: 300000,
    tunjTetap: 200000,
    tunjBpjsKes: 45000,
    tunjJht: 75000,
    tunjJkk: 15000,
    tunjJkm: 10000,
    tunjJp: 30000,
    bonus: 0,
    // Jasa Pelayanan
    jaspel: 350000,
    // Lembur / Kompensasi
    lembur: 120000,
    kompensasiShift: 0,
    jasaRujuk: 0,
    lainPenghasilan: 0,
    // Potongan
    iuranBpjsKes: 45000,
    iuranBpjsTk: 130000,
    pinjaman: 0,
    punishmentKeterlambatan: 0,
    kompensasiKetidakhadiran: 0,
    pph21: 116856,
    lainPotongan: 0,
    // Absensi
    cuti: 1,
    izin: 0,
    sakit: 0,
    terlambatMenit: 0,
    tukarShift: 0
  },
  {
    no: 1,
    nik: '100201',
    nama: 'dr. Hendra Kusuma, Sp.OG',
    bulan: 'OKTOBER',
    tahun: 2026,
    unit: 'Medis & Pelayanan',
    subUnit: 'Spesialis Kebidanan & Kandungan',
    jabatan: 'Dokter Spesialis',
    status: 'Full Time',
    rekening: 'BSI - 7123456789',
    wa: '081298765432',
    gapok: 12000000,
    tunjJabatan: 3000000,
    tunjProfesi: 4000000,
    tunjKehadiran: 500000,
    tunjTetap: 1000000,
    tunjBpjsKes: 150000,
    tunjJht: 250000,
    tunjJkk: 30000,
    tunjJkm: 20000,
    tunjJp: 100000,
    bonus: 0,
    jaspel: 6500000,
    lembur: 0,
    kompensasiShift: 0,
    jasaRujuk: 500000,
    lainPenghasilan: 0,
    iuranBpjsKes: 150000,
    iuranBpjsTk: 400000,
    pinjaman: 0,
    punishmentKeterlambatan: 0,
    kompensasiKetidakhadiran: 0,
    pph21: 1250000,
    lainPotongan: 0,
    cuti: 0,
    izin: 0,
    sakit: 0,
    terlambatMenit: 0,
    tukarShift: 0
  },
  {
    no: 2,
    nik: '100202',
    nama: 'Ns. Nurul Hidayah, S.Kep',
    bulan: 'OKTOBER',
    tahun: 2026,
    unit: 'Keperawatan',
    subUnit: 'Rawat Inap',
    jabatan: 'Kepala Ruangan',
    status: 'Full Time',
    rekening: 'Bank Mandiri - 1140087654321',
    wa: '081311223344',
    gapok: 3500000,
    tunjJabatan: 750000,
    tunjProfesi: 500000,
    tunjKehadiran: 300000,
    tunjTetap: 250000,
    tunjBpjsKes: 50000,
    tunjJht: 90000,
    tunjJkk: 18000,
    tunjJkm: 12000,
    tunjJp: 35000,
    bonus: 0,
    jaspel: 850000,
    lembur: 200000,
    kompensasiShift: 100000,
    jasaRujuk: 0,
    lainPenghasilan: 0,
    iuranBpjsKes: 50000,
    iuranBpjsTk: 155000,
    pinjaman: 0,
    punishmentKeterlambatan: 0,
    kompensasiKetidakhadiran: 0,
    pph21: 150000,
    lainPotongan: 0,
    cuti: 0,
    izin: 0,
    sakit: 0,
    terlambatMenit: 0,
    tukarShift: 1
  },
  {
    no: 3,
    nik: '100203',
    nama: 'Bdn. Ratna Dewi, S.Tr.Keb',
    bulan: 'OKTOBER',
    tahun: 2026,
    unit: 'Kebidanan',
    subUnit: 'Kamar Bersalin (VK)',
    jabatan: 'Bidan Pelaksana',
    status: 'Full Time',
    rekening: 'BSI - 7234567890',
    wa: '082155667788',
    gapok: 3200000,
    tunjJabatan: 0,
    tunjProfesi: 450000,
    tunjKehadiran: 300000,
    tunjTetap: 200000,
    tunjBpjsKes: 48000,
    tunjJht: 85000,
    tunjJkk: 16000,
    tunjJkm: 11000,
    tunjJp: 32000,
    bonus: 0,
    jaspel: 900000,
    lembur: 250000,
    kompensasiShift: 150000,
    jasaRujuk: 0,
    lainPenghasilan: 0,
    iuranBpjsKes: 48000,
    iuranBpjsTk: 144000,
    pinjaman: 0,
    punishmentKeterlambatan: 0,
    kompensasiKetidakhadiran: 0,
    pph21: 125000,
    lainPotongan: 0,
    cuti: 0,
    izin: 0,
    sakit: 0,
    terlambatMenit: 0,
    tukarShift: 2
  },
  {
    no: 4,
    nik: '100204',
    nama: 'apt. Ahmad Zulkarnain, S.Farm',
    bulan: 'OKTOBER',
    tahun: 2026,
    unit: 'Farmasi',
    subUnit: 'Apotek & Depo Farmasi',
    jabatan: 'Penanggung Jawab Apotek',
    status: 'Full Time',
    rekening: 'Bank Mandiri - 1140099887766',
    wa: '081377889900',
    gapok: 4000000,
    tunjJabatan: 800000,
    tunjProfesi: 600000,
    tunjKehadiran: 300000,
    tunjTetap: 250000,
    tunjBpjsKes: 60000,
    tunjJht: 110000,
    tunjJkk: 20000,
    tunjJkm: 15000,
    tunjJp: 40000,
    bonus: 0,
    jaspel: 750000,
    lembur: 0,
    kompensasiShift: 0,
    jasaRujuk: 0,
    lainPenghasilan: 0,
    iuranBpjsKes: 60000,
    iuranBpjsTk: 185000,
    pinjaman: 0,
    punishmentKeterlambatan: 0,
    kompensasiKetidakhadiran: 0,
    pph21: 180000,
    lainPotongan: 0,
    cuti: 0,
    izin: 0,
    sakit: 0,
    terlambatMenit: 0,
    tukarShift: 0
  }
];

export async function generateMasterPayrollExcel(targetFilePath: string, isSample: boolean = true): Promise<void> {
  const dir = path.dirname(targetFilePath);
  ensureDir(dir);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RSIA PUTI BUNGSU Payroll System';
  workbook.lastModifiedBy = 'Finance Staff';
  workbook.created = new Date();

  const sheetName = 'Payroll Okt 2026';
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // 42 Columns definition
  worksheet.columns = [
    // Identitas
    { header: 'No', key: 'no', width: 6 },
    { header: 'NIK', key: 'nik', width: 12 },
    { header: 'Nama Karyawan', key: 'nama', width: 28 },
    { header: 'Bulan', key: 'bulan', width: 12 },
    { header: 'Tahun', key: 'tahun', width: 10 },
    { header: 'Unit', key: 'unit', width: 20 },
    { header: 'Sub Unit / Bagian', key: 'subUnit', width: 22 },
    { header: 'Jabatan', key: 'jabatan', width: 20 },
    { header: 'Status Kepegawaian', key: 'status', width: 16 },
    { header: 'Nomor Rekening', key: 'nomorRekening', width: 26 },
    { header: 'Nomor WhatsApp', key: 'nomorWhatsapp', width: 18 },

    // I. Penghasilan Tetap
    { header: 'Gaji Pokok', key: 'gajiPokok', width: 18 },

    // II. Tunjangan
    { header: 'Tunj. Jabatan', key: 'tunjJabatan', width: 16 },
    { header: 'Tunj. Profesi', key: 'tunjProfesi', width: 16 },
    { header: 'Tunj. Kehadiran', key: 'tunjKehadiran', width: 16 },
    { header: 'Tunj. Tetap', key: 'tunjTetap', width: 16 },
    { header: 'Tunj. BPJS Kesehatan', key: 'tunjBpjsKes', width: 18 },
    { header: 'Tunj. JHT', key: 'tunjJht', width: 14 },
    { header: 'Tunj. JKK', key: 'tunjJkk', width: 14 },
    { header: 'Tunj. JKM', key: 'tunjJkm', width: 14 },
    { header: 'Tunj. JP', key: 'tunjJp', width: 14 },
    { header: 'Bonus', key: 'bonus', width: 14 },

    // III. Jasa Pelayanan
    { header: 'Jasa Pelayanan', key: 'jaspel', width: 18 },

    // IV. Lembur / Kompensasi
    { header: 'Lembur', key: 'lembur', width: 16 },
    { header: 'Kompensasi Pengganti Shift', key: 'kompensasiShift', width: 24 },
    { header: 'Jasa Rujuk', key: 'jasaRujuk', width: 16 },
    { header: 'Lain-lain (Penghasilan)', key: 'lainPenghasilan', width: 20 },

    // Total Kotor
    { header: 'Penghasilan Kotor', key: 'gajiKotor', width: 20 },

    // Potongan
    { header: 'Iuran BPJS Kesehatan', key: 'iuranBpjsKes', width: 18 },
    { header: 'Iuran BPJS Ketenagakerjaan', key: 'iuranBpjsTk', width: 22 },
    { header: 'Pinjaman', key: 'pinjaman', width: 16 },
    { header: 'Punishment Keterlambatan', key: 'punishmentKeterlambatan', width: 22 },
    { header: 'Kompensasi Ketidakhadiran', key: 'kompensasiKetidakhadiran', width: 22 },
    { header: 'PPh 21', key: 'pph21', width: 16 },
    { header: 'Lain-lain (Potongan)', key: 'lainPotongan', width: 18 },
    { header: 'Total Potongan', key: 'totalPotongan', width: 18 },

    // Penerimaan Bersih
    { header: 'Penerimaan Bersih (THP)', key: 'gajiBersih', width: 22 },

    // Absensi
    { header: 'Cuti Tahunan', key: 'cuti', width: 14 },
    { header: 'Izin', key: 'izin', width: 12 },
    { header: 'Izin Sakit', key: 'sakit', width: 12 },
    { header: 'Jumlah Menit Terlambat', key: 'terlambatMenit', width: 20 },
    { header: 'Tukar Shift', key: 'tukarShift', width: 14 }
  ];

  // Header row formatting
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Color code header by category
    if (colNumber <= 11) {
      // Identitas
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } }; // Indigo-950
    } else if (colNumber >= 12 && colNumber <= 27) {
      // Penghasilan
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Emerald-800
    } else if (colNumber === 28) {
      // Total Kotor
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Emerald-700
    } else if (colNumber >= 29 && colNumber <= 35) {
      // Potongan
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } }; // Red-800
    } else if (colNumber === 36) {
      // Total Potongan
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } }; // Red-700
    } else if (colNumber === 37) {
      // Penerimaan Bersih (THP)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }; // Indigo-700
    } else {
      // Absensi
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate-700
    }
  });

  const currencyFormat = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';

  if (isSample) {
    SAMPLE_EMPLOYEES.forEach((emp, i) => {
      const rowIndex = i + 2;
      const row = worksheet.addRow({
        no: emp.no,
        nik: emp.nik,
        nama: emp.nama,
        bulan: emp.bulan,
        tahun: emp.tahun,
        unit: emp.unit,
        subUnit: emp.subUnit,
        jabatan: emp.jabatan,
        status: emp.status,
        nomorRekening: emp.rekening,
        nomorWhatsapp: emp.wa,

        gajiPokok: emp.gapok,
        tunjJabatan: emp.tunjJabatan,
        tunjProfesi: emp.tunjProfesi,
        tunjKehadiran: emp.tunjKehadiran,
        tunjTetap: emp.tunjTetap,
        tunjBpjsKes: emp.tunjBpjsKes,
        tunjJht: emp.tunjJht,
        tunjJkk: emp.tunjJkk,
        tunjJkm: emp.tunjJkm,
        tunjJp: emp.tunjJp,
        bonus: emp.bonus,

        jaspel: emp.jaspel,

        lembur: emp.lembur,
        kompensasiShift: emp.kompensasiShift,
        jasaRujuk: emp.jasaRujuk,
        lainPenghasilan: emp.lainPenghasilan,

        // Formula Penghasilan Kotor: =SUM(L{row}:AA{row})
        gajiKotor: { formula: `=SUM(L${rowIndex}:AA${rowIndex})` },

        iuranBpjsKes: emp.iuranBpjsKes,
        iuranBpjsTk: emp.iuranBpjsTk,
        pinjaman: emp.pinjaman,
        punishmentKeterlambatan: emp.punishmentKeterlambatan,
        kompensasiKetidakhadiran: emp.kompensasiKetidakhadiran,
        pph21: emp.pph21,
        lainPotongan: emp.lainPotongan,

        // Formula Total Potongan: =SUM(AC{row}:AI{row})
        totalPotongan: { formula: `=SUM(AC${rowIndex}:AI${rowIndex})` },

        // Formula Penerimaan Bersih: =AB{row}-AJ{row}
        gajiBersih: { formula: `=AB${rowIndex}-AJ${rowIndex}` },

        cuti: emp.cuti,
        izin: emp.izin,
        sakit: emp.sakit,
        terlambatMenit: emp.terlambatMenit,
        tukarShift: emp.tukarShift
      });

      row.height = 24;

      // Currency formatting on all financial columns (12 to 37)
      for (let c = 12; c <= 37; c++) {
        const cell = row.getCell(c);
        cell.numFmt = currencyFormat;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Number alignments
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };

      // Attendance alignments
      for (let c = 38; c <= 42; c++) {
        row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Zebra striping
      if (i % 2 === 1) {
        row.eachCell((cell, colNumber) => {
          if (colNumber === 28) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }; // Light emerald
          } else if (colNumber === 36) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }; // Light rose
          } else if (colNumber === 37) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } }; // Light indigo
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Slate-50
          }
        });
      } else {
        // Highlight totals even on white rows
        row.getCell(28).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        row.getCell(36).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
        row.getCell(37).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      }
    });
  }

  await workbook.xlsx.writeFile(targetFilePath);
  await logAudit('EXCEL_GENERATE', `File Excel dibuat di ${targetFilePath}`, 'SUCCESS');
}

/**
 * Initializes default template and sample data if files do not exist.
 */
export async function initializeDefaultExcelFiles(): Promise<void> {
  const dataDir = path.join(PAYROLL_ROOT_DIR, 'data');
  ensureDir(dataDir);

  const mainPayrollPath = path.join(dataDir, 'payroll.xlsx');
  const templatePath = path.join(dataDir, 'payroll-template.xlsx');

  // Always generate/update template file
  await generateMasterPayrollExcel(templatePath, true);

  // If main payroll file doesn't exist, create it with sample data
  if (!fs.existsSync(mainPayrollPath)) {
    await generateMasterPayrollExcel(mainPayrollPath, true);
  }
}
