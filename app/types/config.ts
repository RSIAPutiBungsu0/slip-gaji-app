export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  signerName: string;
  signerTitle: string;
  signerCity: string;
  logoUrl?: string;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  templateName: string;
  templateLanguage: string;
  simulationMode: boolean; // if true, simulates Meta Cloud API sending with realistic latency and 98% success
}

export interface StorageConfig {
  excelPath: string;
  slipsPath: string;
  logsPath: string;
  backupPath: string;
}

export interface AppSettings {
  company: CompanySettings;
  whatsapp: WhatsAppConfig;
  storage: StorageConfig;
  activePeriod: string; // e.g. "2026-11"
  activeSheet?: string;
}
