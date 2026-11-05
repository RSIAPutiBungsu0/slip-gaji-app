import { NextResponse } from 'next/server';
import { getCurrentBatchStatus } from '@/app/server/whatsapp/dispatcher';

export async function GET() {
  const status = getCurrentBatchStatus();
  return NextResponse.json({
    status: status || {
      batchId: '',
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      isRunning: false,
      items: []
    }
  });
}
