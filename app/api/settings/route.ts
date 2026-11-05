import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, updateAppSettings } from '@/app/server/storage/settings-store';
import { logAudit } from '@/app/server/logger/audit';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal mengambil pengaturan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateAppSettings(body);
    await logAudit('SETTINGS_UPDATE', 'Pengaturan aplikasi dan konfigurasi perusahaan diperbarui', 'SUCCESS');
    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan',
      settings: updated
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal menyimpan pengaturan' },
      { status: 500 }
    );
  }
}
