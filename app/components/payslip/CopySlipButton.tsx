'use client';

import React, { useState } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { EmployeeRecord } from '@/app/types/employee';

export interface CopySlipButtonProps {
  employee: EmployeeRecord;
  variant?: 'icon' | 'button' | 'small' | 'outline-small';
  className?: string;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const CopySlipButton: React.FC<CopySlipButtonProps> = ({
  employee,
  variant = 'icon',
  className = '',
  onNotify
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCopying) return;

    setIsCopying(true);

    try {
      // 1. Fetch slip image from API
      const res = await fetch(`/api/slips/image/${employee.nik}`);
      if (!res.ok) {
        throw new Error('Gagal memproses file slip gaji');
      }
      const blob = await res.blob();

      // 2. Attempt copying to system clipboard
      let isClipboardSuccess = false;
      if (typeof window !== 'undefined' && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          isClipboardSuccess = true;
        } catch (clipboardError) {
          console.warn('Direct clipboard.write failed, proceeding with fallback download:', clipboardError);
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      if (isClipboardSuccess) {
        const message = `Slip gaji ${employee.nama} berhasil disalin ke clipboard! Buka WhatsApp lalu tekan Ctrl+V (Paste).`;
        if (onNotify) {
          onNotify('success', message);
        }
      } else {
        // Fallback: Trigger direct download so the file is immediately on user's machine
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Slip_Gaji_${employee.nik}_${employee.nama.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const message = `Slip gaji ${employee.nama} berhasil diunduh otomatis. Anda dapat melampirkannya langsung di chat WhatsApp.`;
        if (onNotify) {
          onNotify('success', message);
        }
      }
    } catch (err) {
      console.error('Error copying slip:', err);
      const errMsg = (err as Error).message || 'Gagal menyalin slip gaji';
      if (onNotify) {
        onNotify('error', errMsg);
      }
    } finally {
      setIsCopying(false);
    }
  };

  // Variant: Icon only (for EmployeeTable)
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        disabled={isCopying}
        title={copied ? 'Tersalin ke clipboard! (Ctrl+V di WhatsApp)' : 'Salin Slip Gaji (Gambar siap paste ke WhatsApp)'}
        aria-label="Salin Slip Gaji"
        className={
          className ||
          `p-1.5 rounded-md transition relative group ${
            copied
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              : 'hover:bg-sky-100 dark:hover:bg-sky-950 text-sky-600 dark:text-sky-400'
          }`
        }
      >
        {isCopying ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
        ) : copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  // Variant: Full button (for DetailModal)
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        disabled={isCopying}
        title="Salin gambar slip gaji ke clipboard untuk di-paste langsung ke chat WhatsApp"
        className={
          className ||
          `px-4 py-2 text-xs font-semibold rounded-lg text-white transition shadow-sm flex items-center gap-1.5 ${
            copied
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-sky-600 hover:bg-sky-500'
          }`
        }
      >
        {isCopying ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Menyalin Slip...</span>
          </>
        ) : copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Slip Tersalin! (Ctrl+V)</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Slip Gaji</span>
          </>
        )}
      </button>
    );
  }

  // Variant: Outline Small / Small (for WhatsApp page & SendConfirmModal)
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={isCopying}
      title="Salin gambar slip gaji ke clipboard"
      className={
        className ||
        `inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
          copied
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            : 'bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
        }`
      }
    >
      {isCopying ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          <span>Menyalin...</span>
        </>
      ) : copied ? (
        <>
          <Check className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Tersalin!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 shrink-0" />
          <span>Salin</span>
        </>
      )}
    </button>
  );
};

