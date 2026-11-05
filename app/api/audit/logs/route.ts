import { NextResponse } from 'next/server';
import { getRecentAuditLogs } from '@/app/server/logger/audit';

export async function GET() {
  try {
    const logs = await getRecentAuditLogs(50);
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Gagal mengambil log audit' },
      { status: 500 }
    );
  }
}
