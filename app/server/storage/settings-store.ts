import path from 'path';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic, readJsonSafe } from './file-store';
import { AppSettings } from '@/app/types/config';

const CONFIG_DIR = path.join(PAYROLL_ROOT_DIR, 'config');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'app-settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  company: {
    companyName: 'PT CONTOH SEJAHTERA INDONESIA',
    companyAddress: 'Gedung Menara Kantor Lt. 5, Jakarta Selatan',
    companyPhone: '(021) 12345678',
    companyEmail: 'finance@perusahaan.co.id',
    signerName: 'Budi Handoko, S.E.',
    signerTitle: 'Finance & Payroll Department Manager',
    signerCity: 'Jakarta'
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
  activePeriod: '2026-11',
  activeSheet: 'Payroll Nov 2026'
};

export async function getAppSettings(): Promise<AppSettings> {
  ensureDir(CONFIG_DIR);
  const existing = await readJsonSafe<AppSettings>(SETTINGS_FILE);
  if (existing) {
    // Deep merge with defaults in case new fields were added
    return {
      ...DEFAULT_SETTINGS,
      ...existing,
      company: { ...DEFAULT_SETTINGS.company, ...existing.company },
      whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...existing.whatsapp },
      storage: { ...DEFAULT_SETTINGS.storage, ...existing.storage }
    };
  }
  
  // Write default settings if file doesn't exist
  await writeAtomic(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  return DEFAULT_SETTINGS;
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...newSettings,
    company: { ...current.company, ...(newSettings.company || {}) },
    whatsapp: { ...current.whatsapp, ...(newSettings.whatsapp || {}) },
    storage: { ...current.storage, ...(newSettings.storage || {}) }
  };
  
  ensureDir(CONFIG_DIR);
  await writeAtomic(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}
