'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { EmployeeTable } from '../components/employee/EmployeeTable';
import { DetailModal } from '../components/employee/DetailModal';
import { PdfPreviewModal } from '../components/payslip/PdfPreviewModal';
import { SendConfirmModal } from '../components/whatsapp/SendConfirmModal';
import { EmployeeRecord } from '../types/employee';
import { Users, Send, Download, RefreshCw, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('2026-11');
  const [activeSheet, setActiveSheet] = useState('');
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedNiks, setSelectedNiks] = useState<string[]>([]);
  
  // Modals
  const [detailEmployee, setDetailEmployee] = useState<EmployeeRecord | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<EmployeeRecord | null>(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [targetEmployees, setTargetEmployees] = useState<EmployeeRecord[]>([]);
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
      showNotification('error', 'Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      <Navbar
        activePeriod={period}
        activeSheet={activeSheet}
        onRefresh={loadData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600" />
              Data Karyawan & Master Payroll
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola daftar penerima gaji dan buka tautan WhatsApp individual maupun kelompok. Lampirkan PDF slip secara manual sebelum mengirim.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedNiks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const targets = employees.filter(e => selectedNiks.includes(e.nik));
                  setTargetEmployees(targets);
                  setIsSendConfirmOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA ({selectedNiks.length} Terpilih)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setTargetEmployees(employees);
                setIsSendConfirmOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition border border-slate-700"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kirim ke Semua Karyawan</span>
            </button>
          </div>
        </div>

        <EmployeeTable
          employees={employees}
          selectedNiks={selectedNiks}
          onSelectNiks={setSelectedNiks}
          onViewDetail={(emp) => setDetailEmployee(emp)}
          onPreviewPdf={(emp) => setPreviewEmployee(emp)}
          onNotify={showNotification}
        />

      </main>

      {/* Modals */}
      <DetailModal
        employee={detailEmployee}
        onClose={() => setDetailEmployee(null)}
        onPreviewPdf={(emp) => setPreviewEmployee(emp)}
        onNotify={showNotification}
      />

      <PdfPreviewModal
        employee={previewEmployee}
        onClose={() => setPreviewEmployee(null)}
      />

      <SendConfirmModal
        isOpen={isSendConfirmOpen}
        targetEmployees={targetEmployees}
        onClose={() => setIsSendConfirmOpen(false)}
      />

    </div>
  );
}
