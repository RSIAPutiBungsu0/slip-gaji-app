'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  FileText, 
  Send, 
  Settings, 
  FileSpreadsheet, 
  RefreshCw, 
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface NavbarProps {
  activePeriod?: string;
  activeSheet?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePeriod = '2026-11',
  activeSheet = 'Payroll Nov 2026',
  onRefresh,
  isRefreshing = false
}) => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Building2 },
    { href: '/employees', label: 'Data Karyawan & Payroll', icon: Users },
    { href: '/slips', label: 'Slip Gaji & Arsip ZIP', icon: FileText },
    { href: '/whatsapp', label: 'Distribusi WhatsApp', icon: Send },
    { href: '/audit', label: 'Audit Log', icon: ClipboardList },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    Sistem Payroll
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Local-First
                  </span>
                </div>
                <p className="text-xs text-slate-400 -mt-0.5">Excel & WhatsApp Payslip Distribution</p>
              </div>
            </Link>
          </div>

          {/* Center: Period and Active Sheet Status Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Periode:</span>
            <span className="text-xs font-bold text-emerald-400 bg-slate-900/70 px-2 py-0.5 rounded-md border border-slate-700">
              {activePeriod}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400 truncate max-w-[140px]" title={activeSheet}>
              Sheet: <strong className="text-slate-200">{activeSheet}</strong>
            </span>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Muat Ulang Excel & Buat Backup Otomatis"
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden sm:inline">Refresh Excel</span>
              </button>
            )}

            <a
              href="/api/excel/template?type=sample"
              download
              title="Unduh Contoh Master Excel Payroll"
              className="hidden md:flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Template</span>
            </a>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
