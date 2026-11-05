'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/layout/Navbar';
import { SendConfirmModal } from '../components/whatsapp/SendConfirmModal';
import { EmployeeRecord } from '../types/employee';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Phone, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  Settings,
  HelpCircle
} from 'lucide-react';
import { maskPhoneNumber } from '../lib/utils';
import { WhatsAppSendLink } from '../components/whatsapp/WhatsAppSendLink';
import { CopySlipButton } from '../components/payslip/CopySlipButton';

export default function WhatsAppCenterPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('2026-11');
  const [activeSheet, setActiveSheet] = useState('');
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Send state
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
      showNotification('error', 'Gagal memuat status pengiriman');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sentCount = employees.filter(e => e.whatsappStatus === 'Sent' || e.whatsappStatus === 'Delivered' || e.whatsappStatus === 'Read').length;
  const failedCount = employees.filter(e => e.whatsappStatus === 'Failed').length;
  const pendingCount = employees.length - sentCount - failedCount;

  const filteredEmployees = employees.filter(emp => {
    if (filterStatus === 'SENT') {
      return emp.whatsappStatus === 'Sent' || emp.whatsappStatus === 'Delivered' || emp.whatsappStatus === 'Read';
    }
    if (filterStatus === 'FAILED') return emp.whatsappStatus === 'Failed';
    if (filterStatus === 'PENDING') return emp.whatsappStatus === 'Draft' || emp.whatsappStatus === 'Queued';
    return true;
  });

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
        
        {/* Top Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Tautan WhatsApp</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Kirim Slip Gaji via WhatsApp
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buka chat WhatsApp dengan pesan yang sudah disiapkan. Slip gaji tidak diunduh atau dilampirkan otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const failed = employees.filter(e => e.whatsappStatus === 'Failed');
                if (failed.length > 0) {
                  setTargetEmployees(failed);
                  setIsSendConfirmOpen(true);
                } else {
                  showNotification('success', 'Tidak ada riwayat pengiriman yang berstatus gagal');
                }
              }}
              disabled={failedCount === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-rose-400 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-40 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kirim Ulang yang Gagal ({failedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetEmployees(employees);
                setIsSendConfirmOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Kirim ke Semua Karyawan</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Recipient Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-emerald-950 dark:text-emerald-100 block">
                Periksa Penerima dan Lampiran
              </span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Tautan membuka nomor WhatsApp pada baris karyawan yang sama. Pastikan nama, NIK, dan PDF slip sudah benar sebelum mengirim.
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs hover:underline shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan WhatsApp</span>
          </Link>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Terkirim / Diterima</span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">{sentCount}</div>
              <span className="text-[11px] text-slate-400">Slip sukses terdistribusi</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Belum Dikirim / Antrean</span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-0.5">{pendingCount}</div>
              <span className="text-[11px] text-slate-400">Menunggu jadwal dispatch</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Gagal Terkirim</span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">{failedCount}</div>
              <span className="text-[11px] text-slate-400">Dapat dikirim ulang dengan 1 klik</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Daftar Riwayat WhatsApp Periode {period} ({filteredEmployees.length} Karyawan)
            </span>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="SENT">Terkirim Saja</option>
                <option value="PENDING">Belum Dikirim</option>
                <option value="FAILED">Gagal Saja</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Nama Karyawan</th>
                  <th className="py-3 px-4">Nomor WhatsApp</th>
                  <th className="py-3 px-4">Status Pengiriman</th>
                  <th className="py-3 px-4">Waktu Terkirim</th>
                  <th className="py-3 px-4">Keterangan / Pesan Error</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEmployees.map((emp) => {
                  return (
                  <tr key={emp.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{emp.nik}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {emp.nama}
                      <span className="text-[11px] text-slate-400 font-normal block">{emp.departemen}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{maskPhoneNumber(emp.nomorWhatsapp || emp.nomorWhatsappRaw)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {emp.whatsappStatus === 'Sent' || emp.whatsappStatus === 'Delivered' || emp.whatsappStatus === 'Read' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terkirim
                        </span>
                      ) : emp.whatsappStatus === 'Failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Gagal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Belum Dikirim
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {emp.whatsappSentAt ? new Date(emp.whatsappSentAt).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      {emp.whatsappError ? (
                        <span className="text-rose-600 font-medium">{emp.whatsappError}</span>
                      ) : emp.whatsappMessageId ? (
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px] inline-block" title={emp.whatsappMessageId}>
                          ID: {emp.whatsappMessageId}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <CopySlipButton
                          employee={emp}
                          variant="outline-small"
                          onNotify={showNotification}
                        />
                        <WhatsAppSendLink
                          employee={emp}
                          className="inline-block px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition"
                        >
                          {emp.whatsappStatus === 'Sent' || emp.whatsappStatus === 'Delivered' || emp.whatsappStatus === 'Read' ? 'Kirim Ulang' : 'Kirim WA'}
                        </WhatsAppSendLink>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* Modals */}
      <SendConfirmModal
        isOpen={isSendConfirmOpen}
        targetEmployees={targetEmployees}
        onClose={() => setIsSendConfirmOpen(false)}
      />

    </div>
  );
}
