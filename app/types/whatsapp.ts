import { WhatsAppDeliveryStatus } from './employee';

export interface WhatsAppSendRequest {
  niks: string[];
  forceResend?: boolean;
}

export interface WhatsAppSendResultItem {
  nik: string;
  nama: string;
  phone: string;
  status: WhatsAppDeliveryStatus;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface WhatsAppBatchStatus {
  batchId: string;
  total: number;
  processed: number;
  success: number;
  failed: number;
  isRunning: boolean;
  currentEmployee?: string;
  startedAt: string;
  completedAt?: string;
  items: WhatsAppSendResultItem[];
}

export interface PeriodHistoryData {
  period: string;
  lastUpdated: string;
  records: Record<string, {
    status: WhatsAppDeliveryStatus;
    phone: string;
    messageId?: string;
    error?: string;
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
  }>;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}
