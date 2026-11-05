import fs from 'fs';
import path from 'path';
import { PAYROLL_ROOT_DIR, ensureDir } from './file-store';
import { logAudit } from '../logger/audit';

const BACKUP_DIR = path.join(PAYROLL_ROOT_DIR, 'backup');

/**
 * Creates an automatic timestamped backup of the Excel master file.
 * Returns the backup file path, or null if source file didn't exist.
 */
export async function createExcelBackup(sourceExcelPath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(sourceExcelPath)) {
      return null;
    }

    ensureDir(BACKUP_DIR);
    
    // Format timestamp: YYYY-MM-DD_HHmmss
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
    const baseName = path.basename(sourceExcelPath, path.extname(sourceExcelPath));
    const backupFileName = `${baseName}_${timestamp}.xlsx`;
    const targetBackupPath = path.join(BACKUP_DIR, backupFileName);

    await fs.promises.copyFile(sourceExcelPath, targetBackupPath);
    await logAudit('AUTO_BACKUP', `Snapshot cadangan dibuat: ${backupFileName}`, 'SUCCESS');

    // Maintain only last 20 backups to prevent infinite disk accumulation
    cleanOldBackups(20).catch(console.error);

    return targetBackupPath;
  } catch (err) {
    console.error('Failed to create excel backup:', err);
    await logAudit('AUTO_BACKUP', `Gagal membuat snapshot cadangan: ${(err as Error).message}`, 'ERROR');
    return null;
  }
}

/**
 * Cleanup old backups keeping the newest `keepCount` files
 */
async function cleanOldBackups(keepCount: number = 20): Promise<void> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = await fs.promises.readdir(BACKUP_DIR);
    const excelBackups = files
      .filter(f => f.endsWith('.xlsx'))
      .map(f => ({
        name: f,
        fullPath: path.join(BACKUP_DIR, f),
        stat: fs.statSync(path.join(BACKUP_DIR, f))
      }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    if (excelBackups.length > keepCount) {
      const toDelete = excelBackups.slice(keepCount);
      for (const item of toDelete) {
        await fs.promises.unlink(item.fullPath);
      }
    }
  } catch {
    // ignore cleanup errors
  }
}
