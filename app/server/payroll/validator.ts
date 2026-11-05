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
  departemen: z.string().min(1, 'Departemen wajib diisi'),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
  statusKaryawan: z.string().optional().default('Tetap'),
  hariKerja: z.coerce.number().optional().default(22),
  
  gajiPokok: z.coerce.number().min(0, 'Gaji pokok harus >= 0'),
  tunjanganJabatan: z.coerce.number().optional().default(0),
  tunjanganTransportMakan: z.coerce.number().optional().default(0),
  lemburInsentif: z.coerce.number().optional().default(0),
  gajiKotor: z.coerce.number().min(0, 'Gaji kotor harus >= 0'),
  
  bpjsKesehatan: z.coerce.number().optional().default(0),
  bpjsKetenagakerjaan: z.coerce.number().optional().default(0),
  pph21: z.coerce.number().optional().default(0),
  potonganLain: z.coerce.number().optional().default(0),
  totalPotongan: z.coerce.number().min(0, 'Total potongan harus >= 0'),
  
  gajiBersih: z.coerce.number().min(0, 'Gaji bersih harus >= 0'),
  nomorWhatsapp: z.union([z.string(), z.number()]).transform(v => String(v))
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
  rawRows.forEach((row, idx) => {
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
    const departemen = String(raw.departemen || '').trim() || 'Umum';
    const jabatan = String(raw.jabatan || '').trim() || 'Staf';
    const statusKaryawan = String(raw.statusKaryawan || '').trim() || 'Tetap';
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

    // Numbers
    const gajiPokok = Math.max(0, Number(raw.gajiPokok) || 0);
    const tunjanganJabatan = Math.max(0, Number(raw.tunjanganJabatan) || 0);
    const tunjanganTransportMakan = Math.max(0, Number(raw.tunjanganTransportMakan) || 0);
    const lemburInsentif = Math.max(0, Number(raw.lemburInsentif) || 0);
    const gajiKotor = Number(raw.gajiKotor) || 0;

    const bpjsKesehatan = Math.max(0, Number(raw.bpjsKesehatan) || 0);
    const bpjsKetenagakerjaan = Math.max(0, Number(raw.bpjsKetenagakerjaan) || 0);
    const pph21 = Math.max(0, Number(raw.pph21) || 0);
    const potonganLain = Math.max(0, Number(raw.potonganLain) || 0);
    const totalPotongan = Number(raw.totalPotongan) || 0;

    const gajiBersih = Number(raw.gajiBersih) || 0;

    // Mathematical verification
    const calculatedGajiKotor = gajiPokok + tunjanganJabatan + tunjanganTransportMakan + lemburInsentif;
    const calculatedTotalPotongan = bpjsKesehatan + bpjsKetenagakerjaan + pph21 + potonganLain;
    const calculatedGajiBersih = calculatedGajiKotor - calculatedTotalPotongan;

    let hasMathInconsistency = false;

    // Allow 1 IDR tolerance for rounding
    if (Math.abs(gajiKotor - calculatedGajiKotor) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Gaji Kotor di Excel (${gajiKotor.toLocaleString('id-ID')}) tidak sesuai dengan penjumlahan komponen (${calculatedGajiKotor.toLocaleString('id-ID')})`
      );
    }

    if (Math.abs(totalPotongan - calculatedTotalPotongan) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Total Potongan di Excel (${totalPotongan.toLocaleString('id-ID')}) tidak sesuai dengan penjumlahan potongan (${calculatedTotalPotongan.toLocaleString('id-ID')})`
      );
    }

    if (Math.abs(gajiBersih - (gajiKotor - totalPotongan)) > 1) {
      hasMathInconsistency = true;
      validationWarnings.push(
        `Gaji Bersih / THP di Excel (${gajiBersih.toLocaleString('id-ID')}) tidak sinkron dengan (Gaji Kotor - Total Potongan)`
      );
    }

    // Phone validation
    const rawPhone = raw.nomorWhatsapp || '';
    const { normalized, isValid: isValidPhone } = normalizePhoneNumber(rawPhone);
    if (!isValidPhone) {
      validationErrors.push(`Nomor WhatsApp "${rawPhone}" tidak valid (wajib 10-15 digit dengan format 08xx atau 628xx)`);
    }

    totalErrors += validationErrors.length;
    totalWarnings += validationWarnings.length;

    const pdfFilename = `Slip_Gaji_${nik}_${period}.pdf`;

    return {
      no: raw.no || index + 1,
      nik,
      nama,
      departemen,
      jabatan,
      statusKaryawan,
      hariKerja,
      gajiPokok,
      tunjanganJabatan,
      tunjanganTransportMakan,
      lemburInsentif,
      gajiKotor,
      calculatedGajiKotor,
      bpjsKesehatan,
      bpjsKetenagakerjaan,
      pph21,
      potonganLain,
      totalPotongan,
      calculatedTotalPotongan,
      gajiBersih,
      calculatedGajiBersih,
      terbilang: terbilang(calculatedGajiBersih),
      nomorWhatsappRaw: String(rawPhone),
      nomorWhatsapp: normalized,
      isValidPhone,
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
