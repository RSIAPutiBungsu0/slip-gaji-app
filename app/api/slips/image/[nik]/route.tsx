import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { generatePayslipImage } from '@/app/server/pdf/image-generator';
import { PAYROLL_ROOT_DIR } from '@/app/server/storage/file-store';

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

    const imageFilename = employee.pdfFilename.replace(/\.pdf$/i, '.png');
    const slipsDir = path.join(PAYROLL_ROOT_DIR, 'slips', period);
    const imagePath = path.join(slipsDir, imageFilename);

    let imageBuffer: Buffer;

    // If already generated on disk, stream directly from disk
    if (fs.existsSync(imagePath)) {
      imageBuffer = await fs.promises.readFile(imagePath);
    } else {
      imageBuffer = await generatePayslipImage({
        employee,
        company: settings.company,
        period,
        saveToDisk: true
      });
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${imageFilename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal membuat gambar slip' },
      { status: 500 }
    );
  }
}
