import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { createExcelBackup } from '@/app/server/storage/backup-service';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { logAudit } from '@/app/server/logger/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sheet = body.sheet || undefined;
    const settings = await getAppSettings();

    // Trigger instant backup
    await createExcelBackup(settings.storage.excelPath);
    await logAudit('EXCEL_REFRESH', 'Muat ulang data Excel dipicu secara manual oleh pengguna', 'SUCCESS');

    const freshData = await getFullPayrollData(sheet);
    return NextResponse.json(freshData);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal merefresh file Excel' },
      { status: 500 }
    );
  }
}
