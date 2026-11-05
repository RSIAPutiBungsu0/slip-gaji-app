'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { WhatsAppBatchStatus } from '@/app/types/whatsapp';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  isOpen,
  onClose,
  onFinished
}) => {
  const [batchStatus, setBatchStatus] = useState<WhatsAppBatchStatus | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setBatchStatus(data.status);
            if (!data.status?.isRunning && data.status?.processed > 0) {
              // finished
              onFinished();
            }
          }
        }
      } catch (err) {
        console.error('Error fetching batch status:', err);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, onFinished]);

  if (!isOpen || !batchStatus) return null;

  const total = batchStatus.total || 1;
  const percent = Math.min(100, Math.round((batchStatus.processed / total) * 100));
  const isFinished = !batchStatus.isRunning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {isFinished ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isFinished ? 'Distribusi WhatsApp Selesai' : 'Sedang Mengirim Slip WhatsApp...'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinished 
                  ? `${batchStatus.success} terkirim, ${batchStatus.failed} gagal dari ${batchStatus.total} total`
                  : `Memproses pesan dengan interval rate-limiting aman`}
              </p>
            </div>
          </div>
          {isFinished && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Progress Bar & Percentage */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Progress: {batchStatus.processed} dari {batchStatus.total} Karyawan
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {percent}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Current Processing Employee */}
          {batchStatus.isRunning && batchStatus.currentEmployee && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Mengirim ke: <strong>{batchStatus.currentEmployee}</strong></span>
            </div>
          )}

          {/* Counters Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Target</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{batchStatus.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-600 uppercase font-semibold">Terkirim</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{batchStatus.success}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20">
              <span className="text-[10px] text-rose-600 uppercase font-semibold">Gagal</span>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{batchStatus.failed}</p>
            </div>
          </div>

          {/* Live Activity Log */}
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Riwayat Pengiriman Batch:
            </span>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-[11px]">
              {batchStatus.items.length === 0 ? (
                <div className="p-4 text-center text-slate-400">Menyiapkan antrean pengiriman...</div>
              ) : (
                batchStatus.items.slice().reverse().map((item, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                      {item.status === 'Sent' || item.status === 'Delivered' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.nama}</span>
                      <span className="text-slate-400 font-mono text-[10px]">({item.nik})</span>
                    </div>
                    <div>
                      {item.error ? (
                        <span className="text-rose-600 truncate max-w-[150px] inline-block" title={item.error}>
                          {item.error}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Terkirim</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end">
          {isFinished ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              Tutup & Segarkan Data
            </button>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Mohon jangan tutup jendela ini sampai proses selesai...
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
