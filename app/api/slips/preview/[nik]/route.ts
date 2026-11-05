import { NextRequest, NextResponse } from 'next/server';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { generatePayslipPdf, getPdfFilePath } from '@/app/server/pdf/generator';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nik: string }> }
) {
  try {
    const { nik } = await context.params;
    const settings = await getAppSettings();
    const period = settings.activePeriod || '2026-11';

    const payrollData = await getFullPayrollData();
    const employee = payrollData.employees.find(e => e.nik === nik);

    if (!employee) {
      return NextResponse.json(
        { error: `Karyawan dengan NIK "${nik}" tidak ditemukan dalam data payroll` },
        { status: 404 }
      );
    }

    const pdfPath = getPdfFilePath(period, employee.pdfFilename);
    let pdfBuffer: Buffer;

    if (fs.existsSync(pdfPath)) {
      pdfBuffer = await fs.promises.readFile(pdfPath);
    } else {
      // Generate on demand and save
      pdfBuffer = await generatePayslipPdf({
        employee,
        company: settings.company,
        period,
        saveToDisk: true
      });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${employee.pdfFilename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal membuat preview PDF' },
      { status: 500 }
    );
  }
}
