'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Sparkles } from 'lucide-react';
import { EmployeeRecord } from '@/app/types/employee';

interface IntegrityBannerProps {
  isAllConsistent: boolean;
  totalErrors: number;
  totalWarnings: number;
  employees: EmployeeRecord[];
}

export const IntegrityBanner: React.FC<IntegrityBannerProps> = ({
  isAllConsistent,
  totalErrors,
  totalWarnings,
  employees
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const flaggedEmployees = employees.filter(
    e => !e.isValid || e.hasMathInconsistency || e.validationErrors.length > 0 || e.validationWarnings.length > 0
  );

  if (isAllConsistent && totalErrors === 0 && totalWarnings === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
              Integritas Data Master Payroll Terverifikasi (100% Konsisten)
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Tidak ada NIK duplikat, seluruh nomor WhatsApp berformat valid (628...), dan formula matematika (Gaji Kotor, Potongan & THP) sinkron.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
          <Sparkles className="w-3 h-3" />
          Siap Distribusi
        </span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-amber-950 dark:text-amber-200 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
              Peringatan Integritas Data Ditemukan
              <span className="text-[11px] font-semibold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                {flaggedEmployees.length} Karyawan Perlu Ditinjau
              </span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Ditemukan selisih pembulatan formula atau format nomor telepon yang tidak standar pada file Excel. Sistem secara aman menandai baris ini untuk mencegah salah distribusi.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold bg-amber-200/80 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 transition flex items-center gap-1.5 shrink-0"
        >
          <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Rincian'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-amber-300/60 dark:border-amber-700/60 space-y-2">
          {flaggedEmployees.map((emp) => (
            <div
              key={emp.nik}
              className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-300/50 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {emp.nik}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{emp.nama}</span>
                <span className="text-slate-500">({emp.departemen})</span>
              </div>
              <div className="space-y-1 text-right">
                {emp.validationErrors.map((err, i) => (
                  <div key={i} className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                    • {err}
                  </div>
                ))}
                {emp.validationWarnings.map((warn, i) => (
                  <div key={i} className="text-amber-700 dark:text-amber-300 text-[11px]">
                    • {warn}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
