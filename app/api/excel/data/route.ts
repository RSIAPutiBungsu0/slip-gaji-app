import { NextRequest, NextResponse } from 'next/server';
import { getFullPayrollData } from '@/app/server/payroll/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sheet = searchParams.get('sheet') || undefined;
    const data = await getFullPayrollData(sheet);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal memuat data payroll' },
      { status: 500 }
    );
  }
}
