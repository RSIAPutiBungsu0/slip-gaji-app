import { NextRequest, NextResponse } from 'next/server';
import { getFullPayrollData } from '@/app/server/payroll/service';
import { getAppSettings } from '@/app/server/storage/settings-store';
import { generatePayslipPdf } from '@/app/server/pdf/generator';
import { generatePayslipImage } from '@/app/server/pdf/image-generator';
import { logAudit } from '@/app/server/logger/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const niks: string[] | undefined = body.niks; // optional filter
    const settings = await getAppSettings();
    const period = settings.activePeriod || '2026-11';

    const payrollData = await getFullPayrollData();
    let targetEmployees = payrollData.employees;

    if (niks && niks.length > 0) {
      const set = new Set(niks);
      targetEmployees = targetEmployees.filter(e => set.has(e.nik));
    }

    if (targetEmployees.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data karyawan yang dipilih untuk dibuatkan slip PDF' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const emp of targetEmployees) {
      try {
        await generatePayslipPdf({
          employee: emp,
          company: settings.company,
          period,
          saveToDisk: true
        });

        // Also pre-generate image slip on disk
        try {
          await generatePayslipImage({
            employee: emp,
            company: settings.company,
            period,
            saveToDisk: true
          });
        } catch {
          // Non-blocking if image fails
        }

        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`NIK ${emp.nik}: ${(err as Error).message}`);
      }
    }

    await logAudit(
      'PDF_GENERATE_BULK',
      `Generate PDF massal selesai: ${successCount} berhasil, ${failedCount} gagal untuk periode ${period}`,
      failedCount > 0 ? 'WARNING' : 'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      period,
      totalRequested: targetEmployees.length,
      successCount,
      failedCount,
      errors
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal generate slip gaji PDF' },
      { status: 500 }
    );
  }
}
