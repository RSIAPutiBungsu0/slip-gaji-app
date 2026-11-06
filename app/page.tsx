'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  FileText, 
  Send, 
  Download, 
  RefreshCw, 
  Upload, 
  FileCheck, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { MetricCards } from './components/dashboard/MetricCards';
import { IntegrityBanner } from './components/dashboard/IntegrityBanner';
import { EmployeeTable } from './components/employee/EmployeeTable';
import { DetailModal } from './components/employee/DetailModal';
import { PdfPreviewModal } from './components/payslip/PdfPreviewModal';
import { SendConfirmModal } from './components/whatsapp/SendConfirmModal';
import { EmployeeRecord, PayrollSummaryKPI } from './types/employee';
import { formatIDR } from './lib/utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('2026-11');
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [kpi, setKpi] = useState<PayrollSummaryKPI>({
    totalKaryawan: 0,
    totalGajiKotor: 0,
    totalPotongan: 0,
    totalGajiBersih: 0,
    totalPdfSiap: 0,
    totalPdfBelum: 0,
    totalWaTerkirim: 0,
    totalWaPending: 0,
    totalWaGagal: 0,
    totalInkonsisten: 0,
    isAllConsistent: true
  });
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalWarnings, setTotalWarnings] = useState(0);
  const [excelPath, setExcelPath] = useState('');

  // Modals state
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<EmployeeRecord | null>(null);
  const [previewPdfEmployee, setPreviewPdfEmployee] = useState<EmployeeRecord | null>(null);
  const [selectedNiks, setSelectedNiks] = useState<string[]>([]);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [targetSendEmployees, setTargetSendEmployees] = useState<EmployeeRecord[]>([]);
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async (sheetName?: string) => {
    try {
      const url = sheetName ? `/api/excel/data?sheet=${encodeURIComponent(sheetName)}` : '/api/excel/data';
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setPeriod(data.period);
        setSheets(data.sheets || []);
        setActiveSheet(data.activeSheet || '');
        setEmployees(data.employees || []);
        setKpi(data.kpi);
        setTotalErrors(data.totalErrors || 0);
        setTotalWarnings(data.totalWarnings || 0);
        setExcelPath(data.filePath || '');
      } else {
        showNotification('error', data.error || 'Gagal memuat data');
      }
    } catch (err) {
      showNotification('error', 'Terjadi kesalahan jaringan saat memuat data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/excel/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: activeSheet })
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
        setKpi(data.kpi);
        setTotalErrors(data.totalErrors || 0);
        setTotalWarnings(data.totalWarnings || 0);
        showNotification('success', 'File Excel berhasil dimuat ulang dan dicadangkan!');
      } else {
        showNotification('error', data.error || 'Gagal memuat ulang');
      }
    } catch {
      showNotification('error', 'Gagal menghubungi server');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenExcel = async () => {
    try {
      const res = await fetch('/api/excel/open', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', data.message || 'File master Excel berhasil dibuka.');
      } else {
        showNotification('error', data.error || 'Gagal membuka file master Excel');
      }
    } catch {
      showNotification('error', 'Gagal menghubungi server untuk membuka file Excel');
    }
  };

  // Generate All PDFs
  const handleGenerateAllPdfs = async () => {
    setIsGeneratingPdfs(true);
    try {
      const res = await fetch('/api/slips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // all
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Berhasil membuat ${data.successCount} dokumen PDF slip gaji ke folder Payroll/slips/${period}/`);
        loadData(activeSheet);
      } else {
        showNotification('error', data.error || 'Gagal generate PDF');
      }
    } catch {
      showNotification('error', 'Gagal generate PDF');
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Start sending
  const triggerSend = (targets: EmployeeRecord[]) => {
    setTargetSendEmployees(targets);
    setIsSendConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-medium text-slate-300">
          Memuat Sistem Payroll & Membaca Data Master Excel...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activePeriod={period}
        activeSheet={activeSheet}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Control Bar: Active Sheet Selector & Master File Location */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">File Master Aktif:</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {excelPath || './Payroll/data/payroll.xlsx'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Database-Free: Seluruh formula dan perhitungan gaji dihitung langsung dari Excel.
              </p>
            </div>
          </div>

          {/* Worksheet Selector */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {sheets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Pilih Sheet:</span>
                <select
                  value={activeSheet}
                  onChange={(e) => {
                    setActiveSheet(e.target.value);
                    loadData(e.target.value);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sheets.map(sheet => (
                    <option key={sheet} value={sheet}>{sheet}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenExcel}
              title="Buka file master yang tersimpan di komputer ini"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Buka File Excel
            </button>
          </div>
        </div>

        {/* Data Integrity Banner */}
        <IntegrityBanner
          isAllConsistent={kpi.isAllConsistent}
          totalErrors={totalErrors}
          totalWarnings={totalWarnings}
          employees={employees}
        />

        {/* 6 KPI Cards */}
        <MetricCards kpi={kpi} />

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Aksi Cepat Tim Finance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Generate All PDFs */}
            <button
              type="button"
              onClick={handleGenerateAllPdfs}
              disabled={isGeneratingPdfs || employees.length === 0}
              className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                  {isGeneratingPdfs ? 'Sedang Membuat PDF...' : 'Buat Semua PDF Slip'}
                </span>
                <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400 mt-0.5 block">
                  {kpi.totalPdfSiap} dari {kpi.totalKaryawan} siap di disk
                </span>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
            </button>

            {/* Bulk Send WhatsApp */}
            <button
              type="button"
              onClick={() => triggerSend(employees)}
              disabled={employees.length === 0}
              className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-left transition flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100 block">
                  Kirim WhatsApp Massal
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  Buka tautan WhatsApp untuk {employees.length} karyawan
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4" />
              </div>
            </button>

            {/* Download ZIP Archive */}
            <a
              href="/api/slips/download-zip"
              className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Unduh Arsip ZIP
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Paket seluruh slip dalam 1 file .zip
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
            </a>

            {/* Retry Failed WhatsApp */}
            <button
              type="button"
              onClick={() => {
                const failed = employees.filter(e => e.whatsappStatus === 'Failed');
                if (failed.length > 0) triggerSend(failed);
                else showNotification('success', 'Tidak ada pengiriman berstatus gagal.');
              }}
              disabled={kpi.totalWaGagal === 0}
              className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition flex items-center justify-between group disabled:opacity-40"
            >
              <div>
                <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                  Kirim Ulang yang Gagal
                </span>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 block">
                  {kpi.totalWaGagal} pengiriman gagal
                </span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
            </button>

          </div>
        </div>

        {/* Employee Table Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Karyawan & Status Distribusi Slip Gaji
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan centang kotak untuk membuka tautan WhatsApp beberapa karyawan, atau tombol aksi di sisi kanan. Lampirkan PDF secara manual sebelum mengirim.
              </p>
            </div>

            {selectedNiks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const selectedEmps = employees.filter(e => selectedNiks.includes(e.nik));
                  triggerSend(selectedEmps);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim {selectedNiks.length} Terpilih</span>
              </button>
            )}
          </div>

          <EmployeeTable
            employees={employees}
            selectedNiks={selectedNiks}
            onSelectNiks={setSelectedNiks}
            onViewDetail={(emp) => setSelectedEmployeeDetail(emp)}
            onPreviewPdf={(emp) => setPreviewPdfEmployee(emp)}
            onNotify={showNotification}
          />
        </div>

      </main>

      {/* Modals */}
      <DetailModal
        employee={selectedEmployeeDetail}
        onClose={() => setSelectedEmployeeDetail(null)}
        onPreviewPdf={(emp) => setPreviewPdfEmployee(emp)}
        onNotify={showNotification}
      />

      <PdfPreviewModal
        employee={previewPdfEmployee}
        onClose={() => setPreviewPdfEmployee(null)}
      />

      <SendConfirmModal
        isOpen={isSendConfirmOpen}
        targetEmployees={targetSendEmployees}
        onClose={() => setIsSendConfirmOpen(false)}
      />

    </div>
  );
}
