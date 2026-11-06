export interface ColumnMapping {
  key: string;
  synonyms: string[];
}

export const COLUMN_DEFINITIONS: ColumnMapping[] = [
  // Identitas & Header
  { key: 'no', synonyms: ['no', 'nomor', 'no.', 'no slip', 'slip no'] },
  { key: 'nik', synonyms: ['nik', 'no pegawai', 'nomor pegawai', 'id karyawan', 'employee id', 'nip'] },
  { key: 'nama', synonyms: ['nama karyawan', 'nama', 'employee name', 'nama lengkap', 'karyawan'] },
  { key: 'bulan', synonyms: ['bulan', 'month', 'periode bulan'] },
  { key: 'tahun', synonyms: ['tahun', 'year', 'periode tahun'] },
  { key: 'unit', synonyms: ['unit', 'departemen', 'department', 'divisi', 'bagian'] },
  { key: 'subUnit', synonyms: ['sub unit', 'sub unit/bagian', 'sub unit / bagian', 'subunit', 'sub bagian', 'bagian'] },
  { key: 'jabatan', synonyms: ['jabatan', 'position', 'posisi', 'role'] },
  { key: 'status', synonyms: ['status', 'status kepegawaian', 'status karyawan', 'employment status', 'kepegawaian'] },
  { key: 'nomorRekening', synonyms: ['nomor rekening', 'no rekening', 'rekening', 'no rek', 'bank', 'telah ditransfer ke rekening', 'ditransfer ke rekening', 'transfer rekening'] },
  { key: 'hariKerja', synonyms: ['hari kerja', 'kehadiran (hari)', 'work days', 'jml hari', 'presensi'] },

  // I. Penghasilan Tetap
  { key: 'gajiPokok', synonyms: ['gaji pokok', 'gapok', 'penghasilan tetap', 'basic salary', 'gaji dasar'] },

  // II. Tunjangan
  { key: 'tunjanganJabatan', synonyms: ['tunj. jabatan', 'tunjangan jabatan', 'tunj jabatan', 'position allowance'] },
  { key: 'tunjanganProfesi', synonyms: ['tunj. profesi', 'tunjangan profesi', 'tunj profesi', 'profesi'] },
  { key: 'tunjanganKehadiran', synonyms: ['tunj. kehadiran', 'tunjangan kehadiran', 'tunj kehadiran', 'kehadiran allowance'] },
  { key: 'tunjanganTetap', synonyms: ['tunj. tetap', 'tunjangan tetap', 'tunj tetap', 'fixed allowance'] },
  { key: 'tunjanganBpjsKesehatan', synonyms: ['tunj. bpjs kesehatan', 'tunjangan bpjs kesehatan', 'tunj bpjs kes', 'tunjangan bpjs'] },
  { key: 'tunjanganJht', synonyms: ['tunj. jht', 'tunjangan jht', 'tunj jht', 'jht'] },
  { key: 'tunjanganJkk', synonyms: ['tunj. jkk', 'tunjangan jkk', 'tunj jkk', 'jkk'] },
  { key: 'tunjanganJkm', synonyms: ['tunj. jkm', 'tunjangan jkm', 'tunj jkm', 'jkm'] },
  { key: 'tunjanganJp', synonyms: ['tunj. jp', 'tunjangan jp', 'tunj jp', 'jp'] },
  { key: 'bonus', synonyms: ['bonus', 'bonus 2022', 'bonus tahunan', 'insentif tahunan'] },
  { key: 'tunjanganTransportMakan', synonyms: ['tunj. transport & makan', 'tunjangan transport & makan', 'transport & meal'] },

  // III. Jasa Pelayanan
  { key: 'jasaPelayanan', synonyms: ['jasa pelayanan', 'jaspel', 'jasa medis', 'pelayanan'] },

  // IV. Lembur / Kompensasi
  { key: 'lembur', synonyms: ['lembur', 'overtime', 'uang lembur'] },
  { key: 'kompensasiShift', synonyms: ['kompensasi pengganti shift', 'kompensasi shift', 'pengganti shift', 'shift allowance', 'shift'] },
  { key: 'jasaRujuk', synonyms: ['jasa rujuk', 'rujuk', 'insentif rujuk'] },
  { key: 'lainLainPenghasilan', synonyms: ['penghasilan lain-lain', 'penghasilan lain', 'lain-lain (penghasilan)', 'lain-lain penghasilan', 'kompensasi lain'] },
  { key: 'lemburInsentif', synonyms: ['lembur / insentif', 'lembur & insentif'] },

  // Total Penghasilan Kotor
  { key: 'gajiKotor', synonyms: ['penghasilan kotor', 'gaji kotor', 'total gaji kotor', 'total penghasilan kotor', 'bruto', 'total bruto'] },

  // Potongan
  { key: 'iuranBpjsKesehatan', synonyms: ['iuran bpjs kesehatan', 'bpjs kesehatan (1%)', 'bpjs kes (1%)', 'bpjs kesehatan', 'bpjs kes', 'potongan bpjs kes'] },
  { key: 'iuranBpjsKetenagakerjaan', synonyms: ['iuran bpjs ketenagakerjaan', 'bpjs ketenagakerjaan (2%)', 'bpjs tk (2%)', 'bpjs tk', 'bpjs ketenagakerjaan', 'jamsostek'] },
  { key: 'pinjaman', synonyms: ['pinjaman', 'kasbon', 'cicilan', 'koperasi'] },
  { key: 'punishmentKeterlambatan', synonyms: ['punishment keterlambatan', 'punishment terlambat', 'denda keterlambatan', 'keterlambatan', 'denda terlambat'] },
  { key: 'kompensasiKetidakhadiran', synonyms: ['kompensasi ketidakhadiran', 'potongan absen', 'ketidakhadiran', 'alfa', 'mangkir'] },
  { key: 'pph21', synonyms: ['pph 21', 'pph21', 'pajak', 'potongan pph 21', 'tax', 'pph'] },
  { key: 'lainLainPotongan', synonyms: ['potongan lain-lain', 'lain-lain (potongan)', 'potongan lain', 'potongan lainnya', 'lain-lain potongan'] },
  { key: 'totalPotongan', synonyms: ['potongan', 'total potongan', 'jml potongan', 'total deductions'] },

  // Penerimaan Bersih / Gaji Bersih / THP
  { key: 'gajiBersih', synonyms: ['penerimaan bersih', 'gaji bersih (thp)', 'gaji bersih', 'thp', 'take home pay', 'net salary', 'gaji diterima'] },

  // Absensi
  { key: 'cutiTahunan', synonyms: ['cuti tahunan', 'cuti', 'cuti (hari)', 'cuti tahunan (hari)'] },
  { key: 'izin', synonyms: ['izin', 'ijin', 'izin (hari)', 'ijin (hari)'] },
  { key: 'izinSakit', synonyms: ['izin sakit', 'sakit', 'sakit (hari)', 'ijin sakit'] },
  { key: 'jumlahMenitTerlambat', synonyms: ['jumlah menit terlambat', 'menit terlambat', 'terlambat (menit)', 'durasi terlambat'] },
  { key: 'tukarShift', synonyms: ['tukar shift', 'tukar dinas', 'tukar shift (kali)'] },

  // Kontak
  { key: 'nomorWhatsapp', synonyms: ['nomor whatsapp', 'no whatsapp', 'no wa', 'nomor wa', 'whatsapp', 'wa', 'no hp', 'nomor hp', 'telepon', 'phone', 'contact'] }
];

/**
 * Normalizes header string: removes extra spaces, punctuation, lowercase
 */
export function normalizeHeader(header: string): string {
  if (!header) return '';
  return header
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9&% /._-]/gi, '');
}

/**
 * Matches a header string from Excel against our standard keys
 */
export function matchHeaderToKey(header: string): string | null {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;

  // 1. Exact match
  for (const col of COLUMN_DEFINITIONS) {
    for (const syn of col.synonyms) {
      if (normalized === syn.toLowerCase()) {
        return col.key;
      }
    }
  }

  // 2. Secondary fuzzy check
  for (const col of COLUMN_DEFINITIONS) {
    for (const syn of col.synonyms) {
      if (normalized === syn.toLowerCase() || normalized.replace(/[^a-z0-9]/g, '') === syn.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        return col.key;
      }
    }
  }

  // 3. Contains check (prioritizing longer matches)
  for (const col of COLUMN_DEFINITIONS) {
    for (const syn of col.synonyms) {
      if (syn.length >= 4 && (normalized.includes(syn.toLowerCase()) || syn.toLowerCase().includes(normalized))) {
        return col.key;
      }
    }
  }

  return null;
}
