'use client';

import React from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';
import { EmployeeRecord } from '@/app/types/employee';
import { maskPhoneNumber } from '@/app/lib/utils';
import { WhatsAppSendLink } from '@/app/components/whatsapp/WhatsAppSendLink';
import { CopySlipButton } from '@/app/components/payslip/CopySlipButton';

interface SendConfirmModalProps {
  isOpen: boolean;
  targetEmployees: EmployeeRecord[];
  onClose: () => void;
}

export const SendConfirmModal: React.FC<SendConfirmModalProps> = ({
  isOpen,
  targetEmployees,
  onClose
}) => {
  if (!isOpen || targetEmployees.length === 0) return null;

  const total = targetEmployees.length;
  const alreadySentCount = targetEmployees.filter(
    e => e.whatsappStatus === 'Sent' || e.whatsappStatus === 'Delivered' || e.whatsappStatus === 'Read'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kirim Slip via WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Pilih karyawan untuk membuka chat WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl flex items-start gap-3 text-emerald-950 dark:text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">Pesan WhatsApp siap dibuka</p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Tombol membuka chat WhatsApp dengan pesan yang sudah disiapkan. Slip gaji tidak diunduh atau dilampirkan otomatis.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Daftar Penerima ({total} Karyawan):
              </span>
              {alreadySentCount > 0 && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  {alreadySentCount} karyawan pernah ditandai terkirim
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {targetEmployees.map(emp => {
                return (
                  <div key={emp.nik} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white mr-1.5">{emp.nama}</span>
                      <span className="font-mono text-slate-400 text-[10px]">({emp.nik})</span>
                      <div className="text-[10px] text-slate-500">{emp.departemen}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {maskPhoneNumber(emp.nomorWhatsapp || emp.nomorWhatsappRaw)}
                      </span>
                      <div className="mt-1">
                        {emp.whatsappStatus === 'Sent' || emp.whatsappStatus === 'Delivered' || emp.whatsappStatus === 'Read' ? (
                          <span className="text-[10px] text-emerald-600 font-semibold">Sudah Terkirim</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum dikirim</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      <CopySlipButton
                        employee={emp}
                        variant="outline-small"
                      />
                      <WhatsAppSendLink
                        employee={emp}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Send className="h-3 w-3" />
                        Kirim
                      </WhatsAppSendLink>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
