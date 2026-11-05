'use client';

import React, { useState } from 'react';
import { X, Download, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { EmployeeRecord } from '@/app/types/employee';

interface PdfPreviewModalProps {
  employee: EmployeeRecord | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  employee,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!employee) return null;

  const previewUrl = `/api/slips/preview/${employee.nik}?t=${Date.now()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Preview Slip Gaji: {employee.nama}
                <span className="font-mono text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  ({employee.nik})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.pdfFilename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download={employee.pdfFilename}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 dark:bg-slate-900/70 z-10">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Membuat & merender dokumen PDF slip gaji...
              </span>
            </div>
          )}
          <iframe
            src={previewUrl}
            title={`Slip Gaji ${employee.nama}`}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
          />
        </div>

      </div>
    </div>
  );
};
