'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AuditLogEntry } from '../types/whatsapp';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    const matchStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const matchSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Kepatuhan & Audit Trail Lokal: Payroll/logs/audit.log</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Catatan Aktivitas Sistem & Audit Log
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Merekam setiap aktivitas baca Excel, pembuatan snapshot backup, generate PDF, dan pengiriman pesan WhatsApp secara kronologis.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Segarkan Log</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aksi, detail, atau pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                  <th className="py-3 px-3 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-40">Aksi</th>
                  <th className="py-3 px-3 w-36">Pengguna</th>
                  <th className="py-3 px-4">Detail Peristiwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                      Belum ada catatan aktivitas yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SUCCESS
                          </span>
                        ) : log.status === 'WARNING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            WARNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            ERROR
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-sans text-xs break-all">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
