'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { PdfPreviewModal } from '../components/payslip/PdfPreviewModal';
import { EmployeeRecord } from '../types/employee';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Archive, 
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { formatIDR } from '../lib/utils';

export default function SlipsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('2026-11');
  const [activeSheet, setActiveSheet] = useState('');
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [previewEmployee, setPreviewEmployee] = useState<EmployeeRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/excel/data');
      const data = await res.json();
      if (res.ok) {
        setPeriod(data.period);
        setActiveSheet(data.activeSheet || '');
        setEmployees(data.employees || []);
      }
    } catch {
      showNotification('error', 'Gagal memuat data slip');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/slips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Berhasil membuat ${data.successCount} slip gaji PDF ke folder penyimpanan lokal.`);
        loadData();
      } else {
        showNotification('error', data.error || 'Gagal generate PDF');
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan sistem');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalSiap = employees.filter(e => e.pdfGenerated).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      <Navbar activePeriod={period} activeSheet={activeSheet} onRefresh={loadData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Page Header & Stats Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <FolderOpen className="w-4 h-4" />
              <span>Penyimpanan Lokal: Payroll/slips/{period}/</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Manajemen Slip Gaji & Ekspor Arsip ZIP
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dokumen PDF slip gaji dibuat secara deterministik dengan format standar instansi, terbilang Rupiah, dan siap diunduh secara massal.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={isGenerating || employees.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>{isGenerating ? 'Membuat PDF...' : 'Buat / Perbarui Semua PDF'}</span>
            </button>

            <a
              href="/api/slips/download-zip"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Archive className="w-4 h-4" />
              <span>Unduh Arsip ZIP ({period})</span>
            </a>
          </div>
        </div>

        {/* Status Counter Card */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {totalSiap}
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {totalSiap} dari {employees.length} File PDF Slip Siap di Folder Lokal
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                File PDF yang belum dibuat otomatis akan di-generate seketika saat di-preview, dikirim ke WhatsApp, atau di-download dalam ZIP.
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
            Format: Slip_Gaji_NIK_{period}.pdf
          </span>
        </div>

        {/* Slips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {employees.map((emp) => (
            <div
              key={emp.nik}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">{emp.nama}</h3>
                    <p className="text-[11px] text-slate-500">NIK: {emp.nik} • {emp.departemen}</p>
                  </div>
                </div>
                {emp.pdfGenerated ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Auto-generate
                  </span>
                )}
              </div>

              <div className="space-y-1.5 py-2 border-t border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gaji Kotor:</span>
                  <span className="font-medium">{formatIDR(emp.calculatedGajiKotor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Potongan:</span>
                  <span className="font-medium text-rose-600">{formatIDR(emp.calculatedTotalPotongan)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                  <span>THP (Gaji Bersih):</span>
                  <span>{formatIDR(emp.calculatedGajiBersih)}</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]" title={emp.pdfFilename}>
                  {emp.pdfFilename}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewEmployee(emp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <a
                    href={`/api/slips/preview/${emp.nik}`}
                    download={emp.pdfFilename}
                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition"
                    title="Unduh PDF ini"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* PDF Modal */}
      <PdfPreviewModal
        employee={previewEmployee}
        onClose={() => setPreviewEmployee(null)}
      />

    </div>
  );
}
