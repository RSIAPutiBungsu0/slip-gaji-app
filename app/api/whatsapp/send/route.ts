import { NextRequest, NextResponse } from 'next/server';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { dispatchBatchWhatsApp } from '@/app/server/whatsapp/dispatcher';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { niks, forceResend } = body;

    if (!niks || !Array.isArray(niks) || niks.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal satu karyawan untuk dikirimkan slip gaji' },
        { status: 400 }
      );
    }

    const settings = await getAppSettings();
    const period = settings.activePeriod || '2026-11';
    const payrollData = await getFullPayrollData();

    // Start dispatching batch
    const batchStatus = await dispatchBatchWhatsApp({
      employees: payrollData.employees,
      targetNiks: niks,
      period,
      forceResend: Boolean(forceResend)
    });

    return NextResponse.json({
      success: true,
      message: `Proses pengiriman slip dimulai untuk ${niks.length} karyawan`,
      batchStatus
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal memulai pengiriman WhatsApp' },
      { status: 500 }
    );
  }
}
