export interface EmployeeRecord {
  no?: number;
  nik: string;
  nama: string;
  bulan?: string;
  tahun?: string | number;
  unit: string;
  subUnit?: string;
  jabatan: string;
  status: string;
  nomorRekening?: string;

  // Aliases for compatibility
  departemen: string;
  statusKaryawan: string;
  hariKerja: number;

  // I. Penghasilan Tetap
  gajiPokok: number;

  // II. Tunjangan
  tunjanganJabatan: number;
  tunjanganProfesi: number;
  tunjanganKehadiran: number;
  tunjanganTetap: number;
  tunjanganBpjsKesehatan: number;
  tunjanganJht: number;
  tunjanganJkk: number;
  tunjanganJkm: number;
  tunjanganJp: number;
  bonus: number;
  tunjanganTransportMakan?: number;

  // III. Jasa Pelayanan
  jasaPelayanan: number;

  // IV. Lembur / Kompensasi
  lembur: number;
  kompensasiShift: number;
  jasaRujuk: number;
  lainLainPenghasilan: number;
  lemburInsentif?: number;

  // Total Penghasilan Kotor
  gajiKotor: number;
  calculatedGajiKotor: number;

  // Potongan
  iuranBpjsKesehatan: number;
  iuranBpjsKetenagakerjaan: number;
  pinjaman: number;
  punishmentKeterlambatan: number;
  kompensasiKetidakhadiran: number;
  pph21: number;
  lainLainPotongan: number;
  bpjsKesehatan?: number;
  bpjsKetenagakerjaan?: number;
  potonganLain?: number;
  totalPotongan: number;
  calculatedTotalPotongan: number;

  // Gaji Bersih / Penerimaan Bersih / THP
  gajiBersih: number;
  calculatedGajiBersih: number;
  terbilang: string;

  // Absensi
  cutiTahunan: number;
  izin: number;
  izinSakit: number;
  jumlahMenitTerlambat: number;
  tukarShift: number;

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
