import { EmployeeRecord } from '@/app/types/employee';
import { WhatsAppBatchStatus, WhatsAppSendResultItem } from '@/app/types/whatsapp';
import { getAppSettings } from '../storage/settings-store';
import { generatePayslipPdf, checkPdfExists, getPdfFilePath } from '../pdf/generator';
import { sendWhatsAppPayslip } from './client';
import { getPeriodHistory, updateEmployeeDeliveryStatus } from '../storage/history-store';
import { logAudit } from '../logger/audit';
import fs from 'fs';

// Global singleton to track current active batch progress
let currentBatchStatus: WhatsAppBatchStatus | null = null;

export function getCurrentBatchStatus(): WhatsAppBatchStatus | null {
  return currentBatchStatus;
}

export interface DispatchBatchOptions {
  employees: EmployeeRecord[];
  targetNiks: string[];
  period: string;
  forceResend?: boolean;
}

/**
 * Dispatches WhatsApp payslips for selected employees in a batch queue with rate limiting.
 */
export async function dispatchBatchWhatsApp(options: DispatchBatchOptions): Promise<WhatsAppBatchStatus> {
  const { employees, targetNiks, period, forceResend = false } = options;
  const settings = await getAppSettings();
  const history = await getPeriodHistory(period);

  const nikSet = new Set(targetNiks);
  const eligibleEmployees = employees.filter(emp => nikSet.has(emp.nik));

  const batchId = `batch_${Date.now()}`;
  currentBatchStatus = {
    batchId,
    total: eligibleEmployees.length,
    processed: 0,
    success: 0,
    failed: 0,
    isRunning: true,
    startedAt: new Date().toISOString(),
    items: []
  };

  await logAudit(
    'BATCH_START',
    `Memulai pengiriman batch ${eligibleEmployees.length} slip gaji untuk periode ${period}`,
    'SUCCESS'
  );

  // Run queue processing asynchronously
  processQueue(eligibleEmployees, period, settings, history, forceResend).catch(async (err) => {
    console.error('Batch processing error:', err);
    if (currentBatchStatus) {
      currentBatchStatus.isRunning = false;
      currentBatchStatus.completedAt = new Date().toISOString();
    }
    await logAudit('BATCH_CRASH', `Batch terhenti karena error: ${(err as Error).message}`, 'ERROR');
  });

  return currentBatchStatus;
}

async function processQueue(
  queue: EmployeeRecord[],
  period: string,
  settings: any,
  history: any,
  forceResend: boolean
): Promise<void> {
  for (const emp of queue) {
    if (!currentBatchStatus) break;
    currentBatchStatus.currentEmployee = `${emp.nama} (${emp.nik})`;

    // 1. Triple-Check Verification: NIK, Phone, and Math consistency
    if (!emp.isValidPhone || !emp.nomorWhatsapp) {
      recordItemResult(emp, 'Failed', 'Nomor telepon tidak valid');
      continue;
    }

    // 2. Idempotency Check
    const prevRecord = history.records[emp.nik];
    if (!forceResend && prevRecord && (prevRecord.status === 'Sent' || prevRecord.status === 'Delivered' || prevRecord.status === 'Read')) {
      recordItemResult(emp, prevRecord.status, 'Dilewati: sudah pernah terkirim sebelumnya (Gunakan opsi Paksa Kirim jika ingin mengulang)');
      continue;
    }

    try {
      // 3. Ensure PDF is generated and ready
      let pdfBuffer: Buffer;
      const pdfPath = getPdfFilePath(period, emp.pdfFilename);

      if (fs.existsSync(pdfPath)) {
        pdfBuffer = await fs.promises.readFile(pdfPath);
      } else {
        pdfBuffer = await generatePayslipPdf({
          employee: emp,
          company: settings.company,
          period,
          saveToDisk: true
        });
      }

      // 4. Send via Meta API or Simulator
      const sendResult = await sendWhatsAppPayslip({
        config: settings.whatsapp,
        recipientPhone: emp.nomorWhatsapp,
        pdfBuffer,
        pdfFilename: emp.pdfFilename,
        employeeNik: emp.nik,
        employeeName: emp.nama,
        periodLabel: period
      });

      if (sendResult.success) {
        await updateEmployeeDeliveryStatus(period, emp.nik, {
          status: 'Sent',
          phone: emp.nomorWhatsapp,
          messageId: sendResult.messageId
        });
        recordItemResult(emp, 'Sent', undefined, sendResult.messageId);
      } else {
        await updateEmployeeDeliveryStatus(period, emp.nik, {
          status: 'Failed',
          phone: emp.nomorWhatsapp,
          error: sendResult.error
        });
        recordItemResult(emp, 'Failed', sendResult.error);
      }
    } catch (err) {
      const errMsg = (err as Error).message;
      await updateEmployeeDeliveryStatus(period, emp.nik, {
        status: 'Failed',
        phone: emp.nomorWhatsapp,
        error: errMsg
      });
      recordItemResult(emp, 'Failed', errMsg);
    }

    // Rate Limiting Delay (800ms between sends to avoid API throttling)
    await new Promise(r => setTimeout(r, 800));
  }

  if (currentBatchStatus) {
    currentBatchStatus.isRunning = false;
    currentBatchStatus.completedAt = new Date().toISOString();
    currentBatchStatus.currentEmployee = undefined;

    await logAudit(
      'BATCH_COMPLETE',
      `Batch selesai: ${currentBatchStatus.success} terkirim, ${currentBatchStatus.failed} gagal dari total ${currentBatchStatus.total}`,
      currentBatchStatus.failed > 0 ? 'WARNING' : 'SUCCESS'
    );
  }
}

function recordItemResult(
  emp: EmployeeRecord,
  status: any,
  error?: string,
  messageId?: string
) {
  if (!currentBatchStatus) return;
  currentBatchStatus.processed++;
  if (status === 'Sent' || status === 'Delivered' || status === 'Read') {
    currentBatchStatus.success++;
  } else if (status === 'Failed') {
    currentBatchStatus.failed++;
  }

  currentBatchStatus.items.push({
    nik: emp.nik,
    nama: emp.nama,
    phone: emp.nomorWhatsapp,
    status,
    messageId,
    error,
    timestamp: new Date().toISOString()
  });
}
