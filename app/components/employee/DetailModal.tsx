'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
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
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{employee.nama}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-normal">
                {employee.status || employee.statusKaryawan}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Slip No: {employee.no || '-'} • NIK: {employee.nik} • Unit: {employee.unit || employee.departemen} • Jabatan: {employee.jabatan}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sub Unit / Bagian</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.subUnit || '-'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Transfer Rekening</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={employee.nomorRekening || '-'}>
                {employee.nomorRekening || '-'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">WhatsApp</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.nomorWhatsapp || employee.nomorWhatsappRaw || '-'}
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
              <div className="bg-emerald-800 text-white px-3.5 py-2 font-bold border-b border-emerald-900 flex justify-between">
                <span>PENGHASILAN</span>
                <span>NOMINAL</span>
              </div>
              <div className="p-3.5 space-y-2">
                {/* I. Penghasilan Tetap */}
                <div className="font-bold text-slate-900 dark:text-white border-b pb-1">I. PENGHASILAN TETAP</div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Gaji Pokok</span>
                  <span className="font-semibold">{formatIDR(employee.gajiPokok)}</span>
                </div>

                {/* II. Tunjangan */}
                <div className="font-bold text-slate-900 dark:text-white border-b pb-1 pt-1.5">II. TUNJANGAN</div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Jabatan</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJabatan)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Profesi</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganProfesi)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Kehadiran</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganKehadiran)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Tetap</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganTetap)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">BPJS Kesehatan</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganBpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">JHT</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJht)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">JKK</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJkk)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">JKM</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJkm)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">JP</span>
                  <span className="font-semibold">{formatIDR(employee.tunjanganJp)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Bonus 2022</span>
                  <span className="font-semibold">{formatIDR(employee.bonus)}</span>
                </div>

                {/* III. Jasa Pelayanan */}
                <div className="font-bold text-slate-900 dark:text-white border-b pb-1 pt-1.5">III. JASA PELAYANAN</div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Jasa Pelayanan</span>
                  <span className="font-semibold">{formatIDR(employee.jasaPelayanan)}</span>
                </div>

                {/* IV. Lembur / Kompensasi */}
                <div className="font-bold text-slate-900 dark:text-white border-b pb-1 pt-1.5">IV. LEMBUR/KOMPENSASI</div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Lembur</span>
                  <span className="font-semibold">{formatIDR(employee.lembur)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Kompensasi Pengganti Shift</span>
                  <span className="font-semibold">{formatIDR(employee.kompensasiShift)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Jasa Rujuk</span>
                  <span className="font-semibold">{formatIDR(employee.jasaRujuk)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-slate-600 dark:text-slate-400">Lain-Lain</span>
                  <span className="font-semibold">{formatIDR(employee.lainLainPenghasilan)}</span>
                </div>

                {/* Total Penghasilan Kotor */}
                <div className="pt-2.5 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white text-xs bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg">
                  <span>PENGHASILAN KOTOR</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{formatIDR(employee.calculatedGajiKotor)}</span>
                </div>
              </div>
            </div>

            {/* Right: Deductions & Absensi */}
            <div className="space-y-4">
              {/* Deductions */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-rose-800 text-white px-3.5 py-2 font-bold border-b border-rose-900 flex justify-between">
                  <span>POTONGAN</span>
                  <span>NOMINAL</span>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Iuran BPJS Kesehatan</span>
                    <span className="font-semibold">{formatIDR(employee.iuranBpjsKesehatan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Iuran BPJS Ketenagakerjaan</span>
                    <span className="font-semibold">{formatIDR(employee.iuranBpjsKetenagakerjaan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Pinjaman</span>
                    <span className="font-semibold">{formatIDR(employee.pinjaman)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Punishment Keterlambatan</span>
                    <span className="font-semibold">{formatIDR(employee.punishmentKeterlambatan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Kompensasi Ketidakhadiran</span>
                    <span className="font-semibold">{formatIDR(employee.kompensasiKetidakhadiran)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">PPH 21</span>
                    <span className="font-semibold">{formatIDR(employee.pph21)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Lain-lain</span>
                    <span className="font-semibold">{formatIDR(employee.lainLainPotongan)}</span>
                  </div>
                  <div className="pt-2.5 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-bold text-rose-700 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">
                    <span>TOTAL POTONGAN</span>
                    <span>{formatIDR(employee.calculatedTotalPotongan)}</span>
                  </div>
                </div>
              </div>

              {/* Absensi */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-700 text-white px-3.5 py-1.5 font-bold border-b border-slate-800 text-[11px]">
                  DATA ABSENSI
                </div>
                <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Cuti Tahunan:</span>
                    <span className="font-bold">{employee.cutiTahunan} Hari</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Izin:</span>
                    <span className="font-bold">{employee.izin} Hari</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Izin Sakit:</span>
                    <span className="font-bold">{employee.izinSakit} Hari</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Terlambat:</span>
                    <span className="font-bold">{employee.jumlahMenitTerlambat} Menit</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 col-span-2">
                    <span className="text-slate-500">Tukar Shift:</span>
                    <span className="font-bold">{employee.tukarShift} Kali</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Net Pay (THP) Card */}
          <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-400 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                PENERIMAAN BERSIH
              </span>
              <div className="text-xs text-slate-700 dark:text-slate-300 italic mt-0.5">
                Terbilang: {employee.terbilang.toLowerCase()}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
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
