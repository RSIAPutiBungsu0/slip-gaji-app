import path from 'path';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic, readJsonSafe } from './file-store';
import { PeriodHistoryData } from '@/app/types/whatsapp';
import { WhatsAppDeliveryStatus } from '@/app/types/employee';

const LOGS_DIR = path.join(PAYROLL_ROOT_DIR, 'logs');

function getHistoryFilePath(period: string): string {
  // e.g. history-2026-11.json
  const safePeriod = period.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(LOGS_DIR, `history-${safePeriod}.json`);
}

/**
 * Get delivery history for a specific payroll period
 */
export async function getPeriodHistory(period: string): Promise<PeriodHistoryData> {
  ensureDir(LOGS_DIR);
  const filePath = getHistoryFilePath(period);
  const existing = await readJsonSafe<PeriodHistoryData>(filePath);
  
  if (existing) {
    return existing;
  }
  
  return {
    period,
    lastUpdated: new Date().toISOString(),
    records: {}
  };
}

/**
 * Update delivery status for an employee in the specified period
 */
export async function updateEmployeeDeliveryStatus(
  period: string,
  nik: string,
  data: {
    status: WhatsAppDeliveryStatus;
    phone: string;
    messageId?: string;
    error?: string;
  }
): Promise<PeriodHistoryData> {
  const history = await getPeriodHistory(period);
  const existingRecord = history.records[nik];
  const now = new Date().toISOString();
  
  history.records[nik] = {
    status: data.status,
    phone: data.phone,
    messageId: data.messageId || existingRecord?.messageId,
    error: data.error,
    sentAt: existingRecord?.sentAt || now,
    deliveredAt: data.status === 'Delivered' || data.status === 'Read' ? now : existingRecord?.deliveredAt,
    readAt: data.status === 'Read' ? now : existingRecord?.readAt
  };
  
  history.lastUpdated = now;
  
  const filePath = getHistoryFilePath(period);
  await writeAtomic(filePath, JSON.stringify(history, null, 2));
  
  return history;
}

/**
 * Batch update delivery records
 */
export async function batchUpdateDeliveryStatus(
  period: string,
  updates: Array<{
    nik: string;
    phone: string;
    status: WhatsAppDeliveryStatus;
    messageId?: string;
    error?: string;
  }>
): Promise<PeriodHistoryData> {
  const history = await getPeriodHistory(period);
  const now = new Date().toISOString();
  
  for (const update of updates) {
    const existingRecord = history.records[update.nik];
    history.records[update.nik] = {
      status: update.status,
      phone: update.phone,
      messageId: update.messageId || existingRecord?.messageId,
      error: update.error,
      sentAt: update.status === 'Sent' || update.status === 'Delivered' || update.status === 'Read' ? (existingRecord?.sentAt || now) : '',
      deliveredAt: update.status === 'Delivered' || update.status === 'Read' ? now : existingRecord?.deliveredAt,
      readAt: update.status === 'Read' ? now : existingRecord?.readAt
    };
  }
  
  history.lastUpdated = now;
  const filePath = getHistoryFilePath(period);
  await writeAtomic(filePath, JSON.stringify(history, null, 2));
  
  return history;
}
