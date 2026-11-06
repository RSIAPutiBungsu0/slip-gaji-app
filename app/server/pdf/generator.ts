import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';
import { EmployeeRecord } from '@/app/types/employee';
import { CompanySettings } from '@/app/types/config';
import { formatIDR } from '../payroll/calculator';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic } from '../storage/file-store';
import { logAudit } from '../logger/audit';

export interface GeneratePdfOptions {
  employee: EmployeeRecord;
  company: CompanySettings;
  period: string; // e.g. "2026-10"
  periodLabel?: string; // e.g. "Oktober 2026"
  saveToDisk?: boolean;
}

/**
 * Converts "2026-10" to "Oktober 2026"
 */
export function formatPeriodLabel(periodStr: string): string {
  const parts = periodStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return periodStr;
}

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string | null {
  if (cachedLogoBase64 !== null) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-rsia.png');
    if (fs.existsSync(logoPath)) {
      const data = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${data.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.error('Failed to load logo-rsia.png:', err);
  }
  return null;
}

/**
 * Generates an official, publication-quality Payslip PDF in A4 format
 * matching RSIA PUTI BUNGSU standard layout.
 */
export async function generatePayslipPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { employee, company, period, saveToDisk = true } = options;

  const bulan = (employee.bulan || (period.split('-')[1] ? [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ][parseInt(period.split('-')[1], 10) - 1] : 'OKTOBER')).toUpperCase();

  const tahun = employee.tahun || (period.split('-')[0] || '2026');

  // Initialize A4 PDF: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Header (Kop Surat RSIA PUTI BUNGSU)
  // Draw Logo Image
  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, margin + 1.5, 18, 18);
  } else {
    // Fallback Vector
    doc.setFillColor(88, 28, 135);
    doc.roundedRect(margin + 5, margin + 2, 7, 18, 1.5, 1.5, 'F');
    doc.roundedRect(margin, margin + 7.5, 17, 7, 1.5, 1.5, 'F');
  }

  // Hospital Name & Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(88, 28, 135);
  doc.text(company.companyName || 'RSIA PUTI BUNGSU', pageWidth / 2 + 6, margin + 6.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(88, 28, 135);
  doc.text(company.companyAddress || 'Jl. Raden Intan, Bandar Jaya Timur, Terbanggi Besar,', pageWidth / 2 + 6, margin + 12, { align: 'center' });
  doc.text('Lampung Tengah 34163', pageWidth / 2 + 6, margin + 17, { align: 'center' });

  // Header separator line
  const headerLineY = margin + 22;
  doc.setDrawColor(30, 41, 59); // Slate-800
  doc.setLineWidth(0.7);
  doc.line(margin, headerLineY, pageWidth - margin, headerLineY);

  // 2. Title & Slip Metadata
  const titleY = headerLineY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SLIP GAJI', pageWidth / 2, titleY, { align: 'center' });

  // Metadata Grid (2 Columns: Left aligns with PENGHASILAN, Right with POTONGAN)
  const metaStartY = titleY + 5;
  const metaColLeftX = margin;
  const metaColRightX = margin + 98;
  const metaLabelW = 28;
  const metaRowH = 4.2;

  const drawMetaCell = (label: string, val: string, x: number, y: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(label, x, y);
    doc.text(':', x + metaLabelW, y);
    doc.setFont('helvetica', label === 'Nama' ? 'bold' : 'normal');
    doc.text(val, x + metaLabelW + 3, y);
  };

  // Left Column
  drawMetaCell('Bulan', bulan, metaColLeftX, metaStartY);
  drawMetaCell('Tahun', String(tahun), metaColLeftX, metaStartY + metaRowH);
  drawMetaCell('Unit', employee.unit || employee.departemen || '-', metaColLeftX, metaStartY + (metaRowH * 2));
  drawMetaCell('Sub Unit/Bagian', employee.subUnit || '-', metaColLeftX, metaStartY + (metaRowH * 3));

  // Right Column
  drawMetaCell('Nama', employee.nama, metaColRightX, metaStartY);
  drawMetaCell('Jabatan', employee.jabatan || '-', metaColRightX, metaStartY + metaRowH);
  drawMetaCell('Status', employee.status || employee.statusKaryawan || 'Full Time', metaColRightX, metaStartY + (metaRowH * 2));

  // Separator line before columns
  const colHeaderLineY = metaStartY + (metaRowH * 3) + 3.5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(margin, colHeaderLineY, pageWidth - margin, colHeaderLineY);

  // 3. Main Columns: PENGHASILAN vs POTONGAN
  const colTopY = colHeaderLineY + 5.5;
  const colLeftX = margin;
  const colLeftW = 90;
  const colRightX = margin + 98;
  const colRightW = contentWidth - 98;

  // Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PENGHASILAN', colLeftX + (colLeftW / 2) - 10, colTopY);
  doc.text('POTONGAN', colRightX + (colRightW / 2) - 10, colTopY);

  const lineH = 4.2;
  let leftY = colTopY + 5.5;
  let rightY = colTopY + 5.5 + lineH; // Lowered by 1 line under POTONGAN header

  const drawColRow = (
    label: string,
    valNum: number,
    x: number,
    y: number,
    w: number,
    indent: boolean = false,
    showZero: boolean = true
  ) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(label, x + (indent ? 3 : 0), y);
    doc.text(':', x + w - 24, y);
    const textVal = valNum > 0 ? formatIDR(valNum).replace('Rp ', '') : (showZero ? '-' : '-');
    doc.text(textVal, x + w, y, { align: 'right' });
  };

  const drawSectionTitle = (title: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x, y);
  };

  // --- LEFT COLUMN: PENGHASILAN ---
  // I. PENGHASILAN TETAP
  drawSectionTitle('I. PENGHASILAN TETAP', colLeftX, leftY);
  leftY += lineH;
  drawColRow('Gaji Pokok', employee.gajiPokok, colLeftX, leftY, colLeftW, true);
  leftY += lineH;

  // II. TUNJANGAN
  drawSectionTitle('II. TUNJANGAN', colLeftX, leftY);
  leftY += lineH;
  drawColRow('Jabatan', employee.tunjanganJabatan, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Profesi', employee.tunjanganProfesi, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Kehadiran', employee.tunjanganKehadiran, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Tetap', employee.tunjanganTetap, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('BPJS Kesehatan', employee.tunjanganBpjsKesehatan, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('JHT', employee.tunjanganJht, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('JKK', employee.tunjanganJkk, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('JKM', employee.tunjanganJkm, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('JP', employee.tunjanganJp, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Bonus 2022', employee.bonus, colLeftX, leftY, colLeftW, true);
  leftY += lineH;

  // III. JASA PELAYANAN
  drawSectionTitle('III. JASA PELAYANAN', colLeftX, leftY);
  leftY += lineH;
  drawColRow('Jasa Pelayanan', employee.jasaPelayanan, colLeftX, leftY, colLeftW, true);
  leftY += lineH;

  // IV. LEMBUR / KOMPENSASI
  drawSectionTitle('IV. LEMBUR/KOMPENSASI', colLeftX, leftY);
  leftY += lineH;
  drawColRow('Lembur', employee.lembur, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Kompensasi Pengganti Shift', employee.kompensasiShift, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Jasa Rujuk', employee.jasaRujuk, colLeftX, leftY, colLeftW, true);
  leftY += lineH;
  drawColRow('Lain-Lain', employee.lainLainPenghasilan, colLeftX, leftY, colLeftW, true);
  leftY += lineH;

  // --- RIGHT COLUMN: POTONGAN ---
  drawColRow('Iuran BPJS Kesehatan', employee.iuranBpjsKesehatan, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('Iuran BPJS Ketenagakerjaan', employee.iuranBpjsKetenagakerjaan, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('Pinjaman', employee.pinjaman, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('Punishment Keterlambatan', employee.punishmentKeterlambatan, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('Kompensasi Ketidakhadiran', employee.kompensasiKetidakhadiran, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('PPH 21', employee.pph21, colRightX, rightY, colRightW);
  rightY += lineH;
  drawColRow('Lain-lain', employee.lainLainPotongan, colRightX, rightY, colRightW);
  rightY += lineH + 1.5;

  // Right total potongan box / double line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(colRightX, rightY - 1, colRightX + colRightW, rightY - 1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('POTONGAN', colRightX, rightY + 3);
  doc.text(':', colRightX + colRightW - 24, rightY + 3);
  doc.text(formatIDR(employee.calculatedTotalPotongan).replace('Rp ', ''), colRightX + colRightW, rightY + 3, { align: 'right' });
  doc.line(colRightX, rightY + 5.5, colRightX + colRightW, rightY + 5.5);

  rightY += 12;

  // --Absensi-- Section under Potongan (Light grey background like Penerimaan Bersih)
  const absensiBoxY = rightY - 3;
  const absensiBoxH = (lineH * 6) + 3.5;
  doc.setFillColor(226, 232, 240); // Soft Slate Gray #e2e8f0
  doc.rect(colRightX, absensiBoxY, colRightW, absensiBoxH, 'F');
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(colRightX, absensiBoxY, colRightX + colRightW, absensiBoxY);
  doc.line(colRightX, absensiBoxY + absensiBoxH, colRightX + colRightW, absensiBoxY + absensiBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('--Absensi--', colRightX + 2, rightY);
  rightY += lineH;

  const drawAbsensiRow = (label: string, val: number) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(label, colRightX + 2, rightY);
    doc.text(':', colRightX + colRightW - 24, rightY);
    doc.text(String(val), colRightX + colRightW - 2, rightY, { align: 'right' });
    rightY += lineH;
  };

  drawAbsensiRow('Cuti Tahunan', employee.cutiTahunan);
  drawAbsensiRow('Izin', employee.izin);
  drawAbsensiRow('Izin Sakit', employee.izinSakit);
  drawAbsensiRow('Jumlah Menit Terlambat', employee.jumlahMenitTerlambat);
  drawAbsensiRow('Tukar Shift', employee.tukarShift);

  // 4. Totals Bar (Penghasilan Kotor & Potongan baseline)
  const bottomBodyY = Math.max(leftY, rightY) + 2;

  // Horizontal line above totals
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(margin, bottomBodyY, pageWidth - margin, bottomBodyY);

  // PENGHASILAN KOTOR (Bold)
  const kotorY = bottomBodyY + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PENGHASILAN KOTOR', colLeftX, kotorY);
  doc.text(':', colLeftX + colLeftW - 24, kotorY);
  doc.text(formatIDR(employee.calculatedGajiKotor).replace('Rp ', ''), colLeftX + colLeftW, kotorY, { align: 'right' });

  // 5. PENERIMAAN BERSIH Highlight Bar
  const netBarY = kotorY + 4;
  doc.setFillColor(226, 232, 240); // Soft Slate Gray #e2e8f0
  doc.rect(margin, netBarY, contentWidth, 7, 'F');
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, netBarY, pageWidth - margin, netBarY);
  doc.line(margin, netBarY + 7, pageWidth - margin, netBarY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PENERIMAAN BERSIH', margin + 2, netBarY + 4.8);
  doc.text(':', margin + colLeftW - 24, netBarY + 4.8);
  doc.text(formatIDR(employee.calculatedGajiBersih), pageWidth - margin - 2, netBarY + 4.8, { align: 'right' });

  // 6. Terbilang, Bank Account, & Signer
  const footerStartY = netBarY + 11;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.terbilang.toLowerCase(), margin, footerStartY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Telah ditransfer ke rekening: ${employee.nomorRekening || '-'}`, margin, footerStartY + 5);

  // Date and Signer on Right (Right-aligned, lowered by 2 lines)
  const signerStartY = footerStartY + 5 + (lineH * 2);
  const now = new Date();
  const dateStr = `${company.signerCity || 'Bandarjaya'}, 1-${bulan.slice(0, 3)}-${String(tahun).slice(-2)}`;
  doc.text(dateStr, pageWidth - margin, signerStartY, { align: 'right' });

  // Signer Name
  const signerName = company.signerName || 'dr. Puteri Rahimi Halim MARS';
  doc.setFont('helvetica', 'normal');
  doc.text(signerName, pageWidth - margin, signerStartY + 24, { align: 'right' });

  // Convert to Buffer
  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);

  // Optionally save to disk
  if (saveToDisk) {
    const slipsDir = path.join(PAYROLL_ROOT_DIR, 'slips', period);
    ensureDir(slipsDir);
    const filePath = path.join(slipsDir, employee.pdfFilename);
    await writeAtomic(filePath, buffer);
  }

  return buffer;
}

/**
 * Checks if PDF file exists on disk for a given employee & period
 */
export function checkPdfExists(period: string, pdfFilename: string): boolean {
  const filePath = path.join(PAYROLL_ROOT_DIR, 'slips', period, pdfFilename);
  return fs.existsSync(filePath);
}

/**
 * Get PDF file path
 */
export function getPdfFilePath(period: string, pdfFilename: string): string {
  return path.join(PAYROLL_ROOT_DIR, 'slips', period, pdfFilename);
}
