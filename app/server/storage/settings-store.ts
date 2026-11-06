import fs from 'fs';
import path from 'path';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic, readJsonSafe } from './file-store';
import { AppSettings } from '@/app/types/config';

const CONFIG_DIR = path.join(PAYROLL_ROOT_DIR, 'config');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'app-settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  company: {
    companyName: 'RSIA PUTI BUNGSU',
    companyAddress: 'Jl. Raden Intan, Bandar Jaya Timur, Terbanggi Besar, Lampung Tengah 34163',
    companyPhone: '(0725) 529123',
    companyEmail: 'rsia.putibungsu@gmail.com',
    signerName: 'dr. Puteri Rahimi Halim MARS',
    signerTitle: 'Direktur',
    signerCity: 'Bandarjaya'
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    wabaId: process.env.WHATSAPP_WABA_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    templateName: 'slip_gaji_bulanan',
    templateLanguage: 'id',
    simulationMode: true // Enabled by default for easy demo/testing without Meta API keys
  },
  storage: {
    excelPath: path.join(PAYROLL_ROOT_DIR, 'data', 'payroll.xlsx'),
    slipsPath: path.join(PAYROLL_ROOT_DIR, 'slips'),
    logsPath: path.join(PAYROLL_ROOT_DIR, 'logs'),
    backupPath: path.join(PAYROLL_ROOT_DIR, 'backup')
  },
  activePeriod: '2026-10',
  activeSheet: 'Payroll Okt 2026'
};

/**
 * Normalizes storage paths to ensure they work seamlessly on Linux/POSIX,
 * resolving relative paths and converting legacy Windows drive paths (e.g. C:\...)
 * to valid Linux paths under PAYROLL_ROOT_DIR.
 */
export function normalizeStoragePath(rawPath: string | undefined, defaultPath: string): string {
  if (!rawPath || typeof rawPath !== 'string' || !rawPath.trim()) {
    return defaultPath;
  }

  // Normalize all backslashes to forward slashes
  let p = rawPath.replace(/\\/g, '/').trim();

  // If running on non-Windows OS (Linux, macOS, Docker) and path has a Windows drive prefix (e.g. C:/...)
  if (process.platform !== 'win32' && /^[a-zA-Z]:/.test(p)) {
    const match = p.match(/(?:^|\/)Payroll\/(.*)$/i);
    if (match) {
      return path.join(PAYROLL_ROOT_DIR, match[1]);
    }
    return defaultPath;
  }

  // If path is relative (e.g. ./Payroll/data/payroll.xlsx or Payroll/data/...)
  if (!path.isAbsolute(p)) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), p);
  }

  // If it's an absolute path that doesn't exist on this machine
  // (e.g. cloned from another machine or user's directory like /home/other/...)
  if (!fs.existsSync(p)) {
    const match = p.match(/(?:^|\/)Payroll\/(.*)$/i);
    if (match) {
      const candidate = path.join(PAYROLL_ROOT_DIR, match[1]);
      if (fs.existsSync(candidate) || fs.existsSync(path.dirname(candidate))) {
        return candidate;
      }
    }
  }

  return p;
}

export async function getAppSettings(): Promise<AppSettings> {
  ensureDir(CONFIG_DIR);
  const existing = await readJsonSafe<AppSettings>(SETTINGS_FILE);
  if (existing) {
    // Deep merge with defaults and normalize paths for the current OS
    return {
      ...DEFAULT_SETTINGS,
      ...existing,
      company: { ...DEFAULT_SETTINGS.company, ...existing.company },
      whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...existing.whatsapp },
      storage: {
        excelPath: normalizeStoragePath(existing.storage?.excelPath, DEFAULT_SETTINGS.storage.excelPath),
        slipsPath: normalizeStoragePath(existing.storage?.slipsPath, DEFAULT_SETTINGS.storage.slipsPath),
        logsPath: normalizeStoragePath(existing.storage?.logsPath, DEFAULT_SETTINGS.storage.logsPath),
        backupPath: normalizeStoragePath(existing.storage?.backupPath, DEFAULT_SETTINGS.storage.backupPath)
      }
    };
  }

  // Write default settings if file doesn't exist
  await writeAtomic(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  return DEFAULT_SETTINGS;
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const rawStorage = { ...current.storage, ...(newSettings.storage || {}) };

  const updated: AppSettings = {
    ...current,
    ...newSettings,
    company: { ...current.company, ...(newSettings.company || {}) },
    whatsapp: { ...current.whatsapp, ...(newSettings.whatsapp || {}) },
    storage: {
      excelPath: normalizeStoragePath(rawStorage.excelPath, DEFAULT_SETTINGS.storage.excelPath),
      slipsPath: normalizeStoragePath(rawStorage.slipsPath, DEFAULT_SETTINGS.storage.slipsPath),
      logsPath: normalizeStoragePath(rawStorage.logsPath, DEFAULT_SETTINGS.storage.logsPath),
      backupPath: normalizeStoragePath(rawStorage.backupPath, DEFAULT_SETTINGS.storage.backupPath)
    }
  };

  ensureDir(CONFIG_DIR);
  await writeAtomic(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}
