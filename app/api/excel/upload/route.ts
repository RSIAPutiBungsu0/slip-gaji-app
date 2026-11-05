import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { writeAtomic } from '@/app/server/storage/file-store';
import { createExcelBackup } from '@/app/server/storage/backup-service';
import { logAudit } from '@/app/server/logger/audit';
import { getFullPayrollData } from '@/app/server/payroll/service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file Excel yang diunggah' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Format file tidak didukung. Harap unggah file .xlsx' }, { status: 400 });
    }

    const settings = await getAppSettings();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Backup current excel if exists
    await createExcelBackup(settings.storage.excelPath);

    // Save uploaded file atomically
    await writeAtomic(settings.storage.excelPath, buffer);
    await logAudit('EXCEL_UPLOAD', `File Excel baru diunggah: ${file.name} (${(buffer.length / 1024).toFixed(1)} KB)`, 'SUCCESS');

    const freshData = await getFullPayrollData();
    return NextResponse.json({
      success: true,
      message: `File ${file.name} berhasil diunggah dan dibaca`,
      data: freshData
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal memproses upload file' },
      { status: 500 }
    );
  }
}
