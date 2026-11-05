export interface ColumnMapping {
  key: string;
  synonyms: string[];
}

export const COLUMN_DEFINITIONS: ColumnMapping[] = [
  { key: 'no', synonyms: ['no', 'nomor', 'no.'] },
  { key: 'nik', synonyms: ['nik', 'no pegawai', 'nomor pegawai', 'id karyawan', 'employee id', 'nip'] },
  { key: 'nama', synonyms: ['nama karyawan', 'nama', 'employee name', 'nama lengkap', 'karyawan'] },
  { key: 'departemen', synonyms: ['departemen', 'department', 'divisi', 'unit', 'bagian'] },
  { key: 'jabatan', synonyms: ['jabatan', 'position', 'posisi', 'role'] },
  { key: 'statusKaryawan', synonyms: ['status karyawan', 'status', 'employment status', 'kepegawaian'] },
  { key: 'hariKerja', synonyms: ['hari kerja', 'kehadiran', 'work days', 'jml hari', 'presensi'] },
  { key: 'gajiPokok', synonyms: ['gaji pokok', 'gapok', 'basic salary', 'gaji dasar'] },
  { key: 'tunjanganJabatan', synonyms: ['tunj. jabatan', 'tunjangan jabatan', 'tunj jabatan', 'position allowance'] },
  { key: 'tunjanganTransportMakan', synonyms: ['tunj. transport & makan', 'tunjangan transport & makan', 'tunjangan transport dan makan', 'transport & meal', 'transport & makan', 'uang transport', 'uang makan'] },
  { key: 'lemburInsentif', synonyms: ['lembur / insentif', 'lembur & insentif', 'lembur', 'insentif', 'overtime', 'bonus'] },
  { key: 'gajiKotor', synonyms: ['gaji kotor', 'total gaji kotor', 'gross salary', 'penghasilan kotor', 'bruto', 'total bruto'] },
  { key: 'bpjsKesehatan', synonyms: ['bpjs kes (1%)', 'bpjs kesehatan (1%)', 'bpjs kes', 'bpjs kesehatan', 'bpjs kes 1%'] },
  { key: 'bpjsKetenagakerjaan', synonyms: ['bpjs tk (2%)', 'bpjs ketenagakerjaan (2%)', 'bpjs tk', 'bpjs ketenagakerjaan', 'bpjs tk 2%', 'jamsostek'] },
  { key: 'pph21', synonyms: ['pph 21', 'pph21', 'pajak', 'potongan pph 21', 'tax', 'pph'] },
  { key: 'potonganLain', synonyms: ['potongan lain', 'potongan lainnya', 'kasbon', 'pinjaman', 'other deductions'] },
  { key: 'totalPotongan', synonyms: ['total potongan', 'jml potongan', 'total deductions'] },
  { key: 'gajiBersih', synonyms: ['gaji bersih (thp)', 'gaji bersih', 'thp', 'take home pay', 'net salary', 'gaji diterima'] },
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

  for (const col of COLUMN_DEFINITIONS) {
    for (const syn of col.synonyms) {
      if (normalized === syn.toLowerCase()) {
        return col.key;
      }
    }
  }

  // Secondary fuzzy/contains check
  for (const col of COLUMN_DEFINITIONS) {
    for (const syn of col.synonyms) {
      if (normalized.includes(syn.toLowerCase()) || syn.toLowerCase().includes(normalized)) {
        return col.key;
      }
    }
  }

  return null;
}
