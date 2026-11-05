'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, User, Briefcase, Building, Phone, Calendar } from 'lucide-react';
import { EmployeeRecord } from '@/app/types/employee';
import { formatIDR } from '@/app/lib/utils';
import { WhatsAppSendLink } from '@/app/components/whatsapp/WhatsAppSendLink';
import { CopySlipButton } from '@/app/components/payslip/CopySlipButton';

interface DetailModalProps {
  employee: EmployeeRecord | null;
  onClose: () => void;
  onPreviewPdf: (emp: EmployeeRecord) => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  employee,
  onClose,
  onPreviewPdf,
  onNotify
}) => {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                NIK: {employee.nik}
              </span>
              <span className="text-xs text-slate-500">• {employee.statusKaryawan}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {employee.nama}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {employee.jabatan} — {employee.departemen}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Kehadiran</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{employee.hariKerja} Hari</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">WhatsApp</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.nomorWhatsapp || employee.nomorWhatsappRaw}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Validasi Phone</span>
              <p className="mt-0.5">
                {employee.isValidPhone ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Format Salah
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Status PDF</span>
              <p className="mt-0.5">
                {employee.pdfGenerated ? (
                  <span className="text-indigo-600 font-semibold">Siap di Disk</span>
                ) : (
                  <span className="text-slate-400">Belum dibuat</span>
                )}
              </p>
            </div>
          </div>

          {/* Warnings if any */}
          {(employee.validationErrors.length > 0 || employee.validationWarnings.length > 0) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Catatan Inkonsistensi Data:
              </div>
              {employee.validationErrors.map((err, i) => (
                <p key={i} className="text-rose-600 dark:text-rose-400 text-[11px]">• {err}</p>
              ))}
              {employee.validationWarnings.map((warn, i) => (
                <p key={i} className="text-amber-700 dark:text-amber-300 text-[11px]">• {warn}</p>
              ))}
            </div>
          )}

          {/* 2-Column Earnings vs Deductions Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Earnings */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                PENGHASILAN (EARNINGS)
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Gaji Pokok</span>
                  <span className="font-semibold">{formatIDR(employee.gajiPokok)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tunjangan Jabatan</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJabatan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tunj. Transport & Makan</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganTransportMakan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Lembur / Insentif</span>
                  <span className="font-semibold">{formatIDR(employee.lemburInsentif)}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>TOTAL GAJI KOTOR</span>
                  <span>{formatIDR(employee.calculatedGajiKotor)}</span>
                </div>
              </div>
            </div>

            {/* Right: Deductions */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                PEMOTONGAN (DEDUCTIONS)
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">BPJS Kesehatan (1%)</span>
                  <span className="font-semibold">{formatIDR(employee.bpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">BPJS TK (2%)</span>
                  <span className="font-semibold">{formatIDR(employee.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">PPh 21</span>
                  <span className="font-semibold">{formatIDR(employee.pph21)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Potongan Lain</span>
                  <span className="font-semibold">{formatIDR(employee.potonganLain)}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-rose-700 dark:text-rose-400">
                  <span>TOTAL POTONGAN</span>
                  <span>{formatIDR(employee.calculatedTotalPotongan)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Net Pay (THP) Card */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                GAJI BERSIH (TAKE HOME PAY)
              </span>
              <div className="text-xs text-slate-600 dark:text-slate-300 italic mt-0.5">
                Terbilang: {employee.terbilang}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {formatIDR(employee.calculatedGajiBersih)}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onPreviewPdf(employee);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            Preview Slip PDF
          </button>
          <CopySlipButton
            employee={employee}
            variant="button"
            onNotify={onNotify}
          />
          <WhatsAppSendLink
            employee={employee}
            title="Buka WhatsApp"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            Kirim WhatsApp
          </WhatsAppSendLink>
        </div>

      </div>
    </div>
  );
};
