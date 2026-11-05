import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { logAudit } from '@/app/server/logger/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getAppSettings();
    const config = { ...settings.whatsapp, ...(body.whatsapp || {}) };

    if (config.simulationMode) {
      await logAudit('WA_TEST_CONN', 'Tes koneksi WhatsApp: Mode Simulasi Aktif (Sukses)', 'SUCCESS');
      return NextResponse.json({
        success: true,
        isSimulation: true,
        message: 'Mode Simulasi aktif. Pengiriman slip akan disimulasikan secara lokal dengan aman tanpa memotong kuota Meta API.'
      });
    }

    if (!config.phoneNumberId || !config.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Phone Number ID dan Access Token Meta WhatsApp wajib diisi'
      }, { status: 400 });
    }

    // Ping Meta Graph API endpoint
    const res = await fetch(`https://graph.facebook.com/v20.0/${config.phoneNumberId.trim()}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken.trim()}`
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error?.message || `Meta API Error (${res.status})`;
      await logAudit('WA_TEST_CONN', `Tes koneksi Meta API gagal: ${msg}`, 'ERROR');
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const data = await res.json();
    await logAudit('WA_TEST_CONN', `Tes koneksi Meta API berhasil: ${data.display_phone_number || data.id}`, 'SUCCESS');

    return NextResponse.json({
      success: true,
      isSimulation: false,
      message: `Terhubung sukses ke WhatsApp Business API: ${data.display_phone_number || data.id}`
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal mengetes koneksi WhatsApp' },
      { status: 500 }
    );
  }
}
