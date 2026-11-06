import { z } from 'zod';
import { EmployeeRecord } from '@/app/types/employee';
import { terbilang } from './calculator';

/**
 * Normalizes phone number to official Indonesian format: 628xxxxxxxxxx
 */
export function normalizePhoneNumber(raw: string | number | undefined | null): { normalized: string; isValid: boolean } {
  if (!raw) return { normalized: '', isValid: false };
  
  let cleaned = String(raw).trim().replace(/[^\d+]/g, '');
  
  // Handle leading '+'
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Replace leading 0 with 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  // Valid Indonesian mobile number starts with 628 and has 10 to 15 digits
  const isValid = /^628\d{8,12}$/.test(cleaned);
  
  return {
    normalized: cleaned,
    isValid
  };
}

export const EmployeeRawRowSchema = z.object({
  no: z.coerce.number().optional(),
  nik: z.string().min(1, 'NIK wajib diisi'),
  nama: z.string().min(2, 'Nama karyawan minimal 2 karakter'),
  bulan: z.string().optional(),
  tahun: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
  subUnit: z.string().optional(),
  jabatan: z.string().optional().default('Pelaksana'),
  status: z.string().optional().default('Full Time'),
  nomorRekening: z.string().optional(),
  hariKerja: z.coerce.number().optional().default(22),

  // I. Penghasilan Tetap
  gajiPokok: z.coerce.number().min(0).optional().default(0),

  // II. Tunjangan
  tunjanganJabatan: z.coerce.number().optional().default(0),
  tunjanganProfesi: z.coerce.number().optional().default(0),
  tunjanganKehadiran: z.coerce.number().optional().default(0),
  tunjanganTetap: z.coerce.number().optional().default(0),
  tunjanganBpjsKesehatan: z.coerce.number().optional().default(0),
  tunjanganJht: z.coerce.number().optional().default(0),
  tunjanganJkk: z.coerce.number().optional().default(0),
  tunjanganJkm: z.coerce.number().optional().default(0),
  tunjanganJp: z.coerce.number().optional().default(0),
  bonus: z.coerce.number().optional().default(0),
  tunjanganTransportMakan: z.coerce.number().optional().default(0),

  // III. Jasa Pelayanan
  jasaPelayanan: z.coerce.number().optional().default(0),

  // IV. Lembur / Kompensasi
  lembur: z.coerce.number().optional().default(0),
  kompensasiShift: z.coerce.number().optional().default(0),
  jasaRujuk: z.coerce.number().optional().default(0),
  lainLainPenghasilan: z.coerce.number().optional().default(0),
  lemburInsentif: z.coerce.number().optional().default(0),

  gajiKotor: z.coerce.number().optional().default(0),

  // Potongan
  iuranBpjsKesehatan: z.coerce.number().optional().default(0),
  iuranBpjsKetenagakerjaan: z.coerce.number().optional().default(0),
  pinjaman: z.coerce.number().optional().default(0),
  punishmentKeterlambatan: z.coerce.number().optional().default(0),
  kompensasiKetidakhadiran: z.coerce.number().optional().default(0),
  pph21: z.coerce.number().optional().default(0),
  lainLainPotongan: z.coerce.number().optional().default(0),
  totalPotongan: z.coerce.number().optional().default(0),

  gajiBersih: z.coerce.number().optional().default(0),

  // Absensi
  cutiTahunan: z.coerce.number().optional().default(0),
  izin: z.coerce.number().optional().default(0),
  izinSakit: z.coerce.number().optional().default(0),
  jumlahMenitTerlambat: z.coerce.number().optional().default(0),
  tukarShift: z.coerce.number().optional().default(0),

  nomorWhatsapp: z.union([z.string(), z.number()]).transform(v => String(v)).optional()
});

/**
 * Validates a list of parsed employee rows from Excel, performs uniqueness checks,
 * math consistency checks, and produces validated EmployeeRecord items.
 */
export function validatePayrollDataset(rawRows: any[], period: string): {
  employees: EmployeeRecord[];
  allValid: boolean;
  totalErrors: number;
  totalWarnings: number;
} {
  const nikSeen = new Map<string, number>();
  let totalErrors = 0;
  let totalWarnings = 0;

  // First pass: count NIK occurrences
  rawRows.forEach((row) => {
    const nik = String(row.nik || '').trim();
    if (nik) {
      nikSeen.set(nik, (nikSeen.get(nik) || 0) + 1);
    }
  });

  const employees: EmployeeRecord[] = rawRows.map((raw, index) => {
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    const nik = String(raw.nik || '').trim();
    const nama = String(raw.nama || '').trim();
    const unit = String(raw.unit || raw.departemen || '').trim() || 'IT';
    const subUnit = String(raw.subUnit || '-').trim();
    const jabatan = String(raw.jabatan || '').trim() || 'Pelaksana';
    const status = String(raw.status || raw.statusKaryawan || '').trim() || 'Full Time';
    const bulan = String(raw.bulan || '').trim();
    const tahun = raw.tahun ? String(raw.tahun).trim() : '';
    const nomorRekening = String(raw.nomorRekening || '-').trim();
    const hariKerja = Number(raw.hariKerja) || 22;

    // Check NIK
    if (!nik) {
      validationErrors.push('NIK tidak boleh kosong');
    } else if ((nikSeen.get(nik) || 0) > 1) {
      validationErrors.push(`NIK "${nik}" duplikat ditemukan lebih dari 1 kali dalam data`);
    }

    // Check Nama
    if (!nama || nama.length < 2) {
      validationErrors.push('Nama karyawan tidak valid (minimal 2 karakter)');
    }

    // I. Penghasilan Tetap
    const gajiPokok = Math.max(0, Number(raw.gajiPokok) || 0);

    // II. Tunjangan
    const tunjanganJabatan = Math.max(0, Number(raw.tunjanganJabatan) || 0);
    const tunjanganProfesi = Math.max(0, Number(raw.tunjanganProfesi) || 0);
    const tunjanganKehadiran = Math.max(0, Number(raw.tunjanganKehadiran) || 0);
    const tunjanganTetap = Math.max(0, Number(raw.tunjanganTetap) || 0);
    const tunjanganBpjsKesehatan = Math.max(0, Number(raw.tunjanganBpjsKesehatan) || 0);
    const tunjanganJht = Math.max(0, Number(raw.tunjanganJht) || 0);
    const tunjanganJkk = Math.max(0, Number(raw.tunjanganJkk) || 0);
    const tunjanganJkm = Math.max(0, Number(raw.tunjanganJkm) || 0);
    const tunjanganJp = Math.max(0, Number(raw.tunjanganJp) || 0);
    const bonus = Math.max(0, Number(raw.bonus) || 0);
    const tunjanganTransportMakan = Math.max(0, Number(raw.tunjanganTransportMakan) || 0);

    // III. Jasa Pelayanan
    const jasaPelayanan = Math.max(0, Number(raw.jasaPelayanan) || 0);

    // IV. Lembur / Kompensasi
    const lembur = Math.max(0, Number(raw.lembur) || 0);
    const kompensasiShift = Math.max(0, Number(raw.kompensasiShift) || 0);
    const jasaRujuk = Math.max(0, Number(raw.jasaRujuk) || 0);
    const lainLainPenghasilan = Math.max(0, Number(raw.lainLainPenghasilan) || 0);
    const lemburInsentif = Math.max(0, Number(raw.lemburInsentif) || 0);

    const gajiKotor = Number(raw.gajiKotor) || 0;

    // Potongan
    const iuranBpjsKesehatan = Math.max(0, Number(raw.iuranBpjsKesehatan ?? raw.bpjsKesehatan) || 0);
    const iuranBpjsKetenagakerjaan = Math.max(0, Number(raw.iuranBpjsKetenagakerjaan ?? raw.bpjsKetenagakerjaan) || 0);
    const pinjaman = Math.max(0, Number(raw.pinjaman) || 0);
    const punishmentKeterlambatan = Math.max(0, Number(raw.punishmentKeterlambatan) || 0);
    const kompensasiKetidakhadiran = Math.max(0, Number(raw.kompensasiKetidakhadiran) || 0);
    const pph21 = Math.max(0, Number(raw.pph21) || 0);
    const lainLainPotongan = Math.max(0, Number(raw.lainLainPotongan ?? raw.potonganLain) || 0);
    const totalPotongan = Number(raw.totalPotongan) || 0;

    const gajiBersih = Number(raw.gajiBersih) || 0;

    // Absensi
    const cutiTahunan = Math.max(0, Number(raw.cutiTahunan) || 0);
    const izin = Math.max(0, Number(raw.izin) || 0);
    const izinSakit = Math.max(0, Number(raw.izinSakit) || 0);
    const jumlahMenitTerlambat = Math.max(0, Number(raw.jumlahMenitTerlambat) || 0);
    const tukarShift = Math.max(0, Number(raw.tukarShift) || 0);

    // Mathematical verification
    const calculatedGajiKotor =
      gajiPokok +
      tunjanganJabatan +
      tunjanganProfesi +
      tunjanganKehadiran +
      tunjanganTetap +
      tunjanganBpjsKesehatan +
      tunjanganJht +
      tunjanganJkk +
      tunjanganJkm +
      tunjanganJp +
      bonus +
      tunjanganTransportMakan +
      jasaPelayanan +
      lembur +
      kompensasiShift +
      jasaRujuk +
      lainLainPenghasilan +
      lemburInsentif;

    const calculatedTotalPotongan =
      iuranBpjsKesehatan +
      iuranBpjsKetenagakerjaan +
      pinjaman +
      punishmentKeterlambatan +
      kompensasiKetidakhadiran +
      pph21 +
      lainLainPotongan;

    const calculatedGajiBersih = calculatedGajiKotor - calculatedTotalPotongan;

    let hasMathInconsistency = false;

    // Allow 1 IDR tolerance for rounding if user entered gajiKotor
    if (gajiKotor > 0 && Math.abs(gajiKotor - calculatedGajiKotor) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Penghasilan Kotor di Excel (${gajiKotor.toLocaleString('id-ID')}) tidak sesuai dengan penjumlahan komponen (${calculatedGajiKotor.toLocaleString('id-ID')})`
      );
    }

    if (totalPotongan > 0 && Math.abs(totalPotongan - calculatedTotalPotongan) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Total Potongan di Excel (${totalPotongan.toLocaleString('id-ID')}) tidak sesuai dengan penjumlahan potongan (${calculatedTotalPotongan.toLocaleString('id-ID')})`
      );
    }

    if (gajiBersih > 0 && Math.abs(gajiBersih - calculatedGajiBersih) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Penerimaan Bersih di Excel (${gajiBersih.toLocaleString('id-ID')}) tidak sinkron dengan (Penghasilan Kotor - Total Potongan)`
      );
    }

    // Phone validation
    const rawPhone = raw.nomorWhatsapp || '';
    const { normalized, isValid: isValidPhone } = normalizePhoneNumber(rawPhone);
    if (rawPhone && !isValidPhone) {
      validationErrors.push(`Nomor WhatsApp "${rawPhone}" tidak valid (wajib 10-15 digit format 08xx atau 628xx)`);
    }

    totalErrors += validationErrors.length;
    totalWarnings += validationWarnings.length;

    const pdfFilename = `Slip_Gaji_${nik}_${period}.pdf`;

    return {
      no: raw.no || index + 1,
      nik,
      nama,
      bulan,
      tahun,
      unit,
      subUnit,
      jabatan,
      status,
      nomorRekening,
      departemen: unit,
      statusKaryawan: status,
      hariKerja,

      gajiPokok,
      tunjanganJabatan,
      tunjanganProfesi,
      tunjanganKehadiran,
      tunjanganTetap,
      tunjanganBpjsKesehatan,
      tunjanganJht,
      tunjanganJkk,
      tunjanganJkm,
      tunjanganJp,
      bonus,
      tunjanganTransportMakan,

      jasaPelayanan,
      lembur,
      kompensasiShift,
      jasaRujuk,
      lainLainPenghasilan,
      lemburInsentif,

      gajiKotor: gajiKotor || calculatedGajiKotor,
      calculatedGajiKotor,

      iuranBpjsKesehatan,
      iuranBpjsKetenagakerjaan,
      pinjaman,
      punishmentKeterlambatan,
      kompensasiKetidakhadiran,
      pph21,
      lainLainPotongan,
      bpjsKesehatan: iuranBpjsKesehatan,
      bpjsKetenagakerjaan: iuranBpjsKetenagakerjaan,
      potonganLain: lainLainPotongan,
      totalPotongan: totalPotongan || calculatedTotalPotongan,
      calculatedTotalPotongan,

      gajiBersih: gajiBersih || calculatedGajiBersih,
      calculatedGajiBersih,
      terbilang: terbilang(calculatedGajiBersih),

      cutiTahunan,
      izin,
      izinSakit,
      jumlahMenitTerlambat,
      tukarShift,

      nomorWhatsappRaw: String(rawPhone),
      nomorWhatsapp: normalized || String(rawPhone),
      isValidPhone: isValidPhone || !rawPhone,
      isValid: validationErrors.length === 0,
      validationErrors,
      validationWarnings,
      hasMathInconsistency,
      pdfGenerated: false,
      pdfFilename,
      whatsappStatus: 'Draft'
    };
  });

  return {
    employees,
    allValid: totalErrors === 0 && totalWarnings === 0,
    totalErrors,
    totalWarnings
  };
}
