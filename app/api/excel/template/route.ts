import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { PAYROLL_ROOT_DIR } from '@/app/server/storage/file-store';
import { initializeDefaultExcelFiles } from '@/app/server/excel/template-generator';

export async function GET(req: NextRequest) {
  try {
    await initializeDefaultExcelFiles();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'template'; // 'template' or 'sample'

    const fileName = type === 'sample' ? 'payroll.xlsx' : 'payroll-template.xlsx';
    const filePath = path.join(PAYROLL_ROOT_DIR, 'data', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File acuan tidak ditemukan' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal mengunduh template Excel' },
      { status: 500 }
    );
  }
}
