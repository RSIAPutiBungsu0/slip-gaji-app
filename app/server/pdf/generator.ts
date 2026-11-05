import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  period: string; // e.g. "2026-11"
  periodLabel?: string; // e.g. "November 2026"
  saveToDisk?: boolean;
}

/**
 * Converts "2026-11" to "November 2026"
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

/**
 * Generates an official, publication-quality Payslip PDF in A4 format.
 * Returns the PDF as a Buffer.
 */
export async function generatePayslipPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { employee, company, period, saveToDisk = true } = options;
  const periodLabel = options.periodLabel || formatPeriodLabel(period);

  // Initialize A4 PDF: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Company Header with subtle border
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, margin, contentWidth, 24, 'F');

  // Decorative Emerald accent bar
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(margin, margin + 24, contentWidth, 2, 'F');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName.toUpperCase(), margin + 6, margin + 9);

  // Company Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(company.companyAddress, margin + 6, margin + 15);
  doc.text(`Telp: ${company.companyPhone}  |  Email: ${company.companyEmail}`, margin + 6, margin + 20);

  // Document Title Banner
  const titleY = margin + 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, titleY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(`Periode: ${periodLabel}`, pageWidth / 2, titleY + 5.5, { align: 'center' });

  // 2. Employee Info Grid
  const infoStartY = titleY + 11;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(margin, infoStartY, contentWidth, 26, 2, 2, 'FD');

  const col1X = margin + 4;
  const col1ValX = margin + 35;
  const col2X = margin + (contentWidth / 2) + 2;
  const col2ValX = margin + (contentWidth / 2) + 38;

  doc.setFontSize(8.5);
  
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('NIK', col1X, infoStartY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.nik}`, col1ValX, infoStartY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Hari Kerja', col2X, infoStartY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.hariKerja} Hari`, col2ValX, infoStartY + 7);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Karyawan', col1X, infoStartY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.nama}`, col1ValX, infoStartY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Status Kepegawaian', col2X, infoStartY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.statusKaryawan}`, col2ValX, infoStartY + 14);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Jabatan / Unit', col1X, infoStartY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.jabatan}`, col1ValX, infoStartY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Departemen', col2X, infoStartY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${employee.departemen}`, col2ValX, infoStartY + 21);

  // 3. Two-Column Earnings vs Deductions Table
  const tableStartY = infoStartY + 31;
  const colHalfWidth = (contentWidth / 2) - 2;

  // Earnings Table (Left Column)
  const earningsData = [
    ['Gaji Pokok', formatIDR(employee.gajiPokok)],
    ['Tunjangan Jabatan', formatIDR(employee.tunjanganJabatan)],
    ['Tunj. Transport & Makan', formatIDR(employee.tunjanganTransportMakan)],
    ['Lembur / Insentif', formatIDR(employee.lemburInsentif)],
    ['TOTAL GAJI KOTOR', formatIDR(employee.calculatedGajiKotor)]
  ];

  // Deductions Table (Right Column)
  const deductionsData = [
    ['BPJS Kesehatan (1%)', formatIDR(employee.bpjsKesehatan)],
    ['BPJS Ketenagakerjaan (2%)', formatIDR(employee.bpjsKetenagakerjaan)],
    ['PPh 21', formatIDR(employee.pph21)],
    ['Potongan Lain', formatIDR(employee.potonganLain)],
    ['TOTAL POTONGAN', formatIDR(employee.calculatedTotalPotongan)]
  ];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin },
    tableWidth: colHalfWidth,
    head: [['RINCIAN PENGHASILAN', 'NOMINAL']],
    body: earningsData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: colHalfWidth - 32 },
      1: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      // Highlight total row
      if (data.row.index === earningsData.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin + colHalfWidth + 4 },
    tableWidth: colHalfWidth,
    head: [['RINCIAN PEMOTONGAN', 'NOMINAL']],
    body: deductionsData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: colHalfWidth - 32 },
      1: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      if (data.row.index === deductionsData.length - 1) {
        data.cell.styles.fillColor = [254, 242, 242]; // red-50
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [153, 27, 27]; // red-800
      }
    }
  });

  // 4. Take Home Pay (Gaji Bersih) Highlight Card
  const thpStartY = tableStartY + 45;
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, thpStartY, contentWidth, 23, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70); // Emerald-800
  doc.text('GAJI BERSIH (TAKE HOME PAY)', margin + 6, thpStartY + 7.5);

  doc.setFontSize(15);
  doc.setTextColor(4, 120, 87); // Emerald-700
  doc.text(formatIDR(employee.calculatedGajiBersih), pageWidth - margin - 6, thpStartY + 8.5, { align: 'right' });

  // Indonesian Terbilang Text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Terbilang: ${employee.terbilang}`, margin + 6, thpStartY + 17);

  // 5. Signatures and Footer
  const footerStartY = thpStartY + 29;
  
  // Confidentiality note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Dokumen ini diterbitkan secara otomatis dan sah tanpa tanda tangan basah.', margin, footerStartY + 5);
  
  const now = new Date();
  const printDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  doc.text(`Dicetak pada: ${printDateStr} WIB`, margin, footerStartY + 10);

  // Signer block (Right side)
  const signerX = pageWidth - margin - 65;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${company.signerCity}, ${periodLabel}`, signerX, footerStartY + 5);
  doc.text(company.signerTitle, signerX, footerStartY + 10);

  // Space for signature stamp
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${company.signerName} )`, signerX, footerStartY + 32);

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
