import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { PAYROLL_ROOT_DIR, ensureDir } from '../storage/file-store';
import { logAudit } from '../logger/audit';

export const SAMPLE_EMPLOYEES = [
  {
    no: 1,
    nik: '100201',
    nama: 'Budi Santoso',
    departemen: 'Finance & Accounting',
    jabatan: 'Senior Accounting Officer',
    status: 'Tetap',
    hari: 22,
    gapok: 8000000,
    tunjJabatan: 1500000,
    tunjMakan: 1200000,
    lembur: 500000,
    bpjsKes: 80000,
    bpjsTk: 160000,
    pph21: 250000,
    potLain: 0,
    wa: '081234567890'
  },
  {
    no: 2,
    nik: '100202',
    nama: 'Siti Aminah, S.Kom.',
    departemen: 'Teknologi Informasi',
    jabatan: 'Fullstack Lead Engineer',
    status: 'Tetap',
    hari: 22,
    gapok: 12500000,
    tunjJabatan: 2500000,
    tunjMakan: 1500000,
    lembur: 750000,
    bpjsKes: 125000,
    bpjsTk: 250000,
    pph21: 650000,
    potLain: 0,
    wa: '081298765432'
  },
  {
    no: 3,
    nik: '100203',
    nama: 'Ahmad Fauzi',
    departemen: 'Operasional',
    jabatan: 'Operations Supervisor',
    status: 'Tetap',
    hari: 22,
    gapok: 6500000,
    tunjJabatan: 1000000,
    tunjMakan: 1000000,
    lembur: 600000,
    bpjsKes: 65000,
    bpjsTk: 130000,
    pph21: 180000,
    potLain: 100000,
    wa: '081311223344'
  },
  {
    no: 4,
    nik: '100204',
    nama: 'Dewi Lestari, S.E.',
    departemen: 'Human Resources',
    jabatan: 'HR Specialist & Recruiter',
    status: 'Tetap',
    hari: 21,
    gapok: 7000000,
    tunjJabatan: 1200000,
    tunjMakan: 1100000,
    lembur: 0,
    bpjsKes: 70000,
    bpjsTk: 140000,
    pph21: 210000,
    potLain: 0,
    wa: '081399887766'
  },
  {
    no: 5,
    nik: '100205',
    nama: 'Rian Pratama',
    departemen: 'Teknologi Informasi',
    jabatan: 'Frontend Developer',
    status: 'Kontrak',
    hari: 22,
    gapok: 8500000,
    tunjJabatan: 500000,
    tunjMakan: 1200000,
    lembur: 400000,
    bpjsKes: 85000,
    bpjsTk: 170000,
    pph21: 320000,
    potLain: 0,
    wa: '085712345678'
  },
  {
    no: 6,
    nik: '100206',
    nama: 'Maya Indah',
    departemen: 'Marketing & Sales',
    jabatan: 'Digital Marketing Manager',
    status: 'Tetap',
    hari: 22,
    gapok: 10000000,
    tunjJabatan: 2000000,
    tunjMakan: 1400000,
    lembur: 800000,
    bpjsKes: 100000,
    bpjsTk: 200000,
    pph21: 520000,
    potLain: 0,
    wa: '085888776655'
  },
  {
    no: 7,
    nik: '100207',
    nama: 'Eko Prasetyo',
    departemen: 'Operasional',
    jabatan: 'Staff Logistik & Gudang',
    status: 'Tetap',
    hari: 22,
    gapok: 5200000,
    tunjJabatan: 300000,
    tunjMakan: 900000,
    lembur: 550000,
    bpjsKes: 52000,
    bpjsTk: 104000,
    pph21: 110000,
    potLain: 50000,
    wa: '087812344321'
  },
  {
    no: 8,
    nik: '100208',
    nama: 'Ratna Wulandari',
    departemen: 'Finance & Accounting',
    jabatan: 'Junior Tax Officer',
    status: 'Tetap',
    hari: 22,
    gapok: 6000000,
    tunjJabatan: 600000,
    tunjMakan: 1000000,
    lembur: 300000,
    bpjsKes: 60000,
    bpjsTk: 120000,
    pph21: 160000,
    potLain: 0,
    wa: '087799881122'
  },
  {
    no: 9,
    nik: '100209',
    nama: 'Hendra Gunawan',
    departemen: 'General Affairs',
    jabatan: 'Facility & GA Staff',
    status: 'Tetap',
    hari: 22,
    gapok: 5000000,
    tunjJabatan: 300000,
    tunjMakan: 900000,
    lembur: 250000,
    bpjsKes: 50000,
    bpjsTk: 100000,
    pph21: 95000,
    potLain: 0,
    wa: '089612345678'
  },
  {
    no: 10,
    nik: '100210',
    nama: 'Putri Ayu Wandira',
    departemen: 'Marketing & Sales',
    jabatan: 'Account Executive',
    status: 'Kontrak',
    hari: 20,
    gapok: 5500000,
    tunjJabatan: 400000,
    tunjMakan: 1000000,
    lembur: 700000,
    bpjsKes: 55000,
    bpjsTk: 110000,
    pph21: 130000,
    potLain: 0,
    wa: '082112348899'
  }
];

export async function generateMasterPayrollExcel(targetFilePath: string, isSample: boolean = true): Promise<void> {
  const dir = path.dirname(targetFilePath);
  ensureDir(dir);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Payroll Management';
  workbook.lastModifiedBy = 'Finance Staff';
  workbook.created = new Date();

  const sheetName = 'Payroll Nov 2026';
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Define columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'NIK', key: 'nik', width: 12 },
    { header: 'Nama Karyawan', key: 'nama', width: 28 },
    { header: 'Departemen', key: 'departemen', width: 24 },
    { header: 'Jabatan', key: 'jabatan', width: 24 },
    { header: 'Status Karyawan', key: 'statusKaryawan', width: 16 },
    { header: 'Hari Kerja', key: 'hariKerja', width: 12 },
    { header: 'Gaji Pokok', key: 'gajiPokok', width: 18 },
    { header: 'Tunj. Jabatan', key: 'tunjJabatan', width: 16 },
    { header: 'Tunj. Transport & Makan', key: 'tunjMakan', width: 22 },
    { header: 'Lembur / Insentif', key: 'lembur', width: 18 },
    { header: 'Gaji Kotor', key: 'gajiKotor', width: 20 },
    { header: 'BPJS Kes (1%)', key: 'bpjsKes', width: 16 },
    { header: 'BPJS TK (2%)', key: 'bpjsTk', width: 16 },
    { header: 'PPh 21', key: 'pph21', width: 16 },
    { header: 'Potongan Lain', key: 'potLain', width: 16 },
    { header: 'Total Potongan', key: 'totalPotongan', width: 18 },
    { header: 'Gaji Bersih (THP)', key: 'gajiBersih', width: 22 },
    { header: 'Nomor WhatsApp', key: 'nomorWhatsapp', width: 18 }
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  const currencyFormat = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';

  if (isSample) {
    SAMPLE_EMPLOYEES.forEach((emp, i) => {
      const rowIndex = i + 2;
      const calcKotor = emp.gapok + emp.tunjJabatan + emp.tunjMakan + emp.lembur;
      const calcPotongan = emp.bpjsKes + emp.bpjsTk + emp.pph21 + emp.potLain;
      const calcThp = calcKotor - calcPotongan;

      const row = worksheet.addRow({
        no: emp.no,
        nik: emp.nik,
        nama: emp.nama,
        departemen: emp.departemen,
        jabatan: emp.jabatan,
        statusKaryawan: emp.status,
        hariKerja: emp.hari,
        gajiPokok: emp.gapok,
        tunjJabatan: emp.tunjJabatan,
        tunjMakan: emp.tunjMakan,
        lembur: emp.lembur,
        gajiKotor: { formula: `H${rowIndex}+I${rowIndex}+J${rowIndex}+K${rowIndex}`, result: calcKotor },
        bpjsKes: emp.bpjsKes,
        bpjsTk: emp.bpjsTk,
        pph21: emp.pph21,
        potLain: emp.potLain,
        totalPotongan: { formula: `M${rowIndex}+N${rowIndex}+O${rowIndex}+P${rowIndex}`, result: calcPotongan },
        gajiBersih: { formula: `L${rowIndex}-Q${rowIndex}`, result: calcThp },
        nomorWhatsapp: emp.wa
      });

      row.height = 22;

      // Apply cell formatting
      [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].forEach(colIndex => {
        const cell = row.getCell(colIndex);
        cell.numFmt = currencyFormat;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      // Center text for No, NIK, Status, Hari, WA
      [1, 2, 6, 7, 19].forEach(colIndex => {
        row.getCell(colIndex).alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Highlight THP cell with subtle emerald background
      const thpCell = row.getCell(18);
      thpCell.font = { bold: true, color: { argb: 'FF065F46' } };
      thpCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFECFDF5' } // Emerald 50
      };
    });
  }

  await workbook.xlsx.writeFile(targetFilePath);
  await logAudit('EXCEL_GENERATE', `File Excel dibuat di ${targetFilePath}`, 'SUCCESS');
}

/**
 * Ensure default sample Excel and template exist on startup
 */
export async function initializeDefaultExcelFiles(): Promise<void> {
  const dataDir = path.join(PAYROLL_ROOT_DIR, 'data');
  ensureDir(dataDir);

  const samplePath = path.join(dataDir, 'payroll.xlsx');
  const templatePath = path.join(dataDir, 'payroll-template.xlsx');

  if (!fs.existsSync(samplePath)) {
    await generateMasterPayrollExcel(samplePath, true);
  }

  if (!fs.existsSync(templatePath)) {
    await generateMasterPayrollExcel(templatePath, false);
  }
}
