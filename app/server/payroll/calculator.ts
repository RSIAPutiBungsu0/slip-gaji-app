/**
 * Format a number into Indonesian Rupiah currency string.
 * Example: 8000000 -> "Rp 8.000.000"
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Format number with dot thousand separator.
 * Example: 8000000 -> "8.000.000"
 */
export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0';
  }
  return Math.round(amount).toLocaleString('id-ID');
}

/**
 * Convert number to Indonesian "Terbilang" (words).
 * Example: 10710000 -> "Sepuluh Juta Tujuh Ratus Sepuluh Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return 'Nol Rupiah';
  
  const bilangan = Math.abs(Math.floor(n));
  if (bilangan === 0) return 'Nol Rupiah';

  const satuan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function konversi(angka: number): string {
    if (angka < 12) {
      return satuan[angka];
    } else if (angka < 20) {
      return konversi(angka - 10) + ' Belas';
    } else if (angka < 100) {
      const puluh = Math.floor(angka / 10);
      const sisa = angka % 10;
      return konversi(puluh) + ' Puluh' + (sisa ? ' ' + konversi(sisa) : '');
    } else if (angka < 200) {
      return 'Seratus' + (angka - 100 ? ' ' + konversi(angka - 100) : '');
    } else if (angka < 1000) {
      const ratus = Math.floor(angka / 100);
      const sisa = angka % 100;
      return konversi(ratus) + ' Ratus' + (sisa ? ' ' + konversi(sisa) : '');
    } else if (angka < 2000) {
      return 'Seribu' + (angka - 1000 ? ' ' + konversi(angka - 1000) : '');
    } else if (angka < 1000000) {
      const ribu = Math.floor(angka / 1000);
      const sisa = angka % 1000;
      return konversi(ribu) + ' Ribu' + (sisa ? ' ' + konversi(sisa) : '');
    } else if (angka < 1000000000) {
      const juta = Math.floor(angka / 1000000);
      const sisa = angka % 1000000;
      return konversi(juta) + ' Juta' + (sisa ? ' ' + konversi(sisa) : '');
    } else if (angka < 1000000000000) {
      const milyar = Math.floor(angka / 1000000000);
      const sisa = angka % 1000000000;
      return konversi(milyar) + ' Milyar' + (sisa ? ' ' + konversi(sisa) : '');
    } else {
      const triliun = Math.floor(angka / 1000000000000);
      const sisa = angka % 1000000000000;
      return konversi(triliun) + ' Triliun' + (sisa ? ' ' + konversi(sisa) : '');
    }
  }

  const hasil = konversi(bilangan).trim() + ' Rupiah';
  return (n < 0 ? 'Minus ' : '') + hasil;
}
