import fs from 'fs';
import path from 'path';
import { PAYROLL_ROOT_DIR, ensureDir } from '../storage/file-store';
import { AuditLogEntry } from '@/app/types/whatsapp';

const LOGS_DIR = path.join(PAYROLL_ROOT_DIR, 'logs');
const AUDIT_FILE = path.join(LOGS_DIR, 'audit.log');

/**
 * Append an audit entry to the audit.log file
 */
export async function logAudit(
  action: string,
  details: string,
  status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS',
  user: string = 'Finance Staff'
): Promise<void> {
  try {
    ensureDir(LOGS_DIR);
    const now = new Date();
    // Format YYYY-MM-DD HH:mm:ss
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const logLine = `[${timestamp}] [${status.padEnd(7)}] [${user}] ${action} - ${details}\n`;
    
    await fs.promises.appendFile(AUDIT_FILE, logLine, 'utf-8');
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

/**
 * Read the most recent audit log entries for display in UI
 */
export async function getRecentAuditLogs(limit: number = 30): Promise<AuditLogEntry[]> {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    
    const content = await fs.promises.readFile(AUDIT_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const recentLines = lines.slice(-limit).reverse();
    
    const entries: AuditLogEntry[] = [];
    const logPattern = /^\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*?) - (.*)$/;
    
    for (const line of recentLines) {
      const match = line.match(logPattern);
      if (match) {
        entries.push({
          timestamp: match[1].trim(),
          status: match[2].trim() as 'SUCCESS' | 'WARNING' | 'ERROR',
          user: match[3].trim(),
          action: match[4].trim(),
          details: match[5].trim()
        });
      } else {
        entries.push({
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          user: 'System',
          action: 'Log',
          details: line
        });
      }
    }
    
    return entries;
  } catch (err) {
    console.error('Failed to read audit logs:', err);
    return [];
  }
}
