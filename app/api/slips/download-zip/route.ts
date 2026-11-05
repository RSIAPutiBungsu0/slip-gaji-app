import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { generatePayslipPdf, getPdfFilePath } from '@/app/server/pdf/generator';
import { logAudit } from '@/app/server/logger/audit';

export async function GET(req: NextRequest) {
  try {
    const settings = await getAppSettings();
    const period = settings.activePeriod || '2026-11';
    const payrollData = await getFullPayrollData();

    if (payrollData.employees.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data karyawan pada periode ini' },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const folder = zip.folder(`Slip_Gaji_${period}`) || zip;

    // Ensure all PDFs exist and add to zip
    for (const emp of payrollData.employees) {
      const pdfPath = getPdfFilePath(period, emp.pdfFilename);
      let pdfBuffer: Buffer;

      if (fs.existsSync(pdfPath)) {
        pdfBuffer = await fs.promises.readFile(pdfPath);
      } else {
        pdfBuffer = await generatePayslipPdf({
          employee: emp,
          company: settings.company,
          period,
          saveToDisk: true
        });
      }

      folder.file(emp.pdfFilename, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const zipFilename = `Arsip_Slip_Gaji_${period}.zip`;
    await logAudit('ZIP_DOWNLOAD', `Arsip ZIP diunduh: ${zipFilename} (${(zipBuffer.length / 1024).toFixed(1)} KB)`, 'SUCCESS');

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal membuat arsip ZIP slip gaji' },
      { status: 500 }
    );
  }
}
