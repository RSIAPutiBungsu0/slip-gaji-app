export interface EmployeeRecord {
  no?: number;
  nik: string;
  nama: string;
  departemen: string;
  jabatan: string;
  statusKaryawan: string;
  hariKerja: number;
  
  // Penghasilan
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganTransportMakan: number;
  lemburInsentif: number;
  gajiKotor: number;
  calculatedGajiKotor: number;
  
  // Potongan
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  pph21: number;
  potonganLain: number;
  totalPotongan: number;
  calculatedTotalPotongan: number;
  
  // Gaji Bersih / THP
  gajiBersih: number;
  calculatedGajiBersih: number;
  terbilang: string;
  
  // Kontak
  nomorWhatsappRaw: string;
  nomorWhatsapp: string; // Format: 628xxxxxxxxxx
  isValidPhone: boolean;
  
  // Validasi & Status
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  hasMathInconsistency: boolean;
  
  // File & WhatsApp
  pdfGenerated: boolean;
  pdfFilename: string;
  whatsappStatus: WhatsAppDeliveryStatus;
  whatsappError?: string;
  whatsappSentAt?: string;
  whatsappMessageId?: string;
}

export type WhatsAppDeliveryStatus = 'Draft' | 'Queued' | 'Sent' | 'Delivered' | 'Read' | 'Failed';

export interface PayrollSummaryKPI {
  totalKaryawan: number;
  totalGajiKotor: number;
  totalPotongan: number;
  totalGajiBersih: number;
  totalPdfSiap: number;
  totalPdfBelum: number;
  totalWaTerkirim: number;
  totalWaPending: number;
  totalWaGagal: number;
  totalInkonsisten: number;
  isAllConsistent: boolean;
}
