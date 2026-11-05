'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AppSettings } from '../types/config';
import { 
  Settings, 
  Building2, 
  Send, 
  FolderCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Monitor,
  Terminal,
  Key,
  ShieldCheck,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string; isSimulation?: boolean } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        showNotification('error', 'Gagal memuat pengaturan aplikasi');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Pengaturan aplikasi berhasil disimpan!');
      } else {
        showNotification('error', data.error || 'Gagal menyimpan pengaturan');
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan sistem saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!settings) return;
    setTestingWa(true);
    setWaTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: settings.whatsapp })
      });
      const data = await res.json();
      setWaTestResult({
        success: data.success,
        message: data.message || data.error || 'Tes koneksi selesai',
        isSimulation: data.isSimulation
      });
    } catch {
      setWaTestResult({
        success: false,
        message: 'Gagal menghubungi endpoint tes WhatsApp'
      });
    } finally {
      setTestingWa(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-medium text-slate-300">Memuat Pengaturan...</span>
      </div>
    );
  }

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

      <Navbar activePeriod={settings.activePeriod} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-emerald-600" />
              Pengaturan Sistem & Konfigurasi WhatsApp API
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Atur identitas instansi untuk kop slip gaji PDF, konfigurasi kredensial Meta WhatsApp Cloud API, dan panduan zero-CLI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Profil Perusahaan & Kop Slip Gaji */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Profil Perusahaan & Penandatangan Slip Gaji PDF</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Perusahaan / Instansi:
                </label>
                <input
                  type="text"
                  value={settings.company.companyName}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, companyName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Alamat Lengkap Kantor:
                </label>
                <input
                  type="text"
                  value={settings.company.companyAddress}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, companyAddress: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nomor Telepon Kantor:
                </label>
                <input
                  type="text"
                  value={settings.company.companyPhone}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, companyPhone: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Email Finance / Payroll:
                </label>
                <input
                  type="email"
                  value={settings.company.companyEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, companyEmail: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Penandatangan (Finance Manager):
                </label>
                <input
                  type="text"
                  value={settings.company.signerName}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, signerName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Jabatan Penandatangan:
                </label>
                <input
                  type="text"
                  value={settings.company.signerTitle}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, signerTitle: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Kota Penerbitan Slip:
                </label>
                <input
                  type="text"
                  value={settings.company.signerCity}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, signerCity: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Periode Aktif Default (YYYY-MM):
                </label>
                <input
                  type="text"
                  value={settings.activePeriod}
                  onChange={(e) => setSettings({
                    ...settings,
                    activePeriod: e.target.value
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Meta WhatsApp Cloud API Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>Meta WhatsApp Cloud API (Graph API v20.0)</span>
              </div>
              
              {/* Simulation Mode Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={settings.whatsapp.simulationMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, simulationMode: e.target.checked }
                  })}
                  className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mode Simulasi Aktif
                </span>
              </label>
            </div>

            {settings.whatsapp.simulationMode && (
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/30 text-teal-900 dark:text-teal-200 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Mode Simulasi sedang aktif:</strong> Pengiriman pesan disimulasikan secara aman tanpa kuota Meta API terpakai. Semua pengiriman berhasil dicatat ke riwayat JSON lokal dan log audit. Anda dapat menonaktifkan mode ini kapan saja untuk mengirim via WhatsApp resmi.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Phone Number ID (Meta):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 104829104829104"
                  value={settings.whatsapp.phoneNumberId}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, phoneNumberId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  WhatsApp Business Account (WABA) ID:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 204910294019284"
                  value={settings.whatsapp.wabaId}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, wabaId: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Meta System User Permanent Access Token:</span>
                  <span className="text-[11px] font-normal text-slate-400">Tersimpan aman server-side di file config lokal</span>
                </label>
                <input
                  type="password"
                  placeholder="EAABw..."
                  value={settings.whatsapp.accessToken}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, accessToken: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Template Name (Document Message):
                </label>
                <input
                  type="text"
                  value={settings.whatsapp.templateName}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, templateName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testingWa}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition"
                >
                  <Send className={`w-3.5 h-3.5 ${testingWa ? 'animate-spin text-emerald-500' : ''}`} />
                  <span>{testingWa ? 'Mengetes Koneksi...' : 'Uji Koneksi WhatsApp API'}</span>
                </button>
              </div>
            </div>

            {waTestResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                waTestResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}>
                {waTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{waTestResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 3: Jalur Penyimpanan Lokal */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
              <FolderCheck className="w-5 h-5 text-indigo-600" />
              <span>Jalur Folder Penyimpanan Lokal (Local Storage Paths)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block font-sans text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Lokasi File Master Excel:
                </label>
                <input
                  type="text"
                  value={settings.storage.excelPath}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, excelPath: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-sans text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Folder Arsip Slip Gaji (PDF):
                </label>
                <input
                  type="text"
                  value={settings.storage.slipsPath}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, slipsPath: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Panduan Operasional Tanpa Terminal (Zero-CLI) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
              <Monitor className="w-5 h-5 text-teal-600" />
              <span>Panduan Staf Finance: Zero-CLI & Desktop Shortcut</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              <p>
                Sesuai prinsip <strong>Zero-CLI Operation</strong> pada PRD, tim Finance tidak perlu membuka terminal atau menjalankan perintah teknis:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Shortcut Desktop:</strong> Buat shortcut pada desktop dengan URL <code>http://localhost:3000</code>. Staf Finance cukup klik 2x icon shortcut tersebut.
                </li>
                <li>
                  <strong>Auto-Start Windows / Server:</strong> Tambahkan perintah <code>npm run dev</code> atau <code>docker compose up -d</code> pada Windows Task Scheduler / systemd agar otomatis aktif saat komputer kantor dinyalakan.
                </li>
                <li>
                  <strong>Backup Otomatis:</strong> Setiap file Excel dimuat atau diunggah, salinan cadangan tersimpan di <code>Payroll/backup/</code>.
                </li>
              </ul>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
}
