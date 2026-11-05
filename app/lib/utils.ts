import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  // Format e.g. 62812****7890
  const prefix = phone.substring(0, 5);
  const suffix = phone.substring(phone.length - 4);
  return `${prefix}****${suffix}`;
}

export function getWhatsAppSendUrl(phone: string): string | null {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (!/^628\d{8,12}$/.test(normalizedPhone)) return null;

  const message = 'Halo, berikut lampiran slip gaji Anda.';
  return `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
}
