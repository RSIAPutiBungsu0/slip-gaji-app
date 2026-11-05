'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle,
  HelpCircle,
  Phone,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { EmployeeRecord, WhatsAppDeliveryStatus } from '@/app/types/employee';
import { formatIDR, maskPhoneNumber } from '@/app/lib/utils';
import { WhatsAppSendLink } from '@/app/components/whatsapp/WhatsAppSendLink';
import { CopySlipButton } from '@/app/components/payslip/CopySlipButton';

interface EmployeeTableProps {
  employees: EmployeeRecord[];
  selectedNiks: string[];
  onSelectNiks: (niks: string[]) => void;
  onViewDetail: (employee: EmployeeRecord) => void;
  onPreviewPdf: (employee: EmployeeRecord) => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  selectedNiks,
  onSelectNiks,
  onViewDetail,
  onPreviewPdf,
  onNotify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [waFilter, setWaFilter] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.departemen) set.add(e.departemen);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = 
        emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = deptFilter === 'ALL' || emp.departemen === deptFilter;
      const matchStatus = statusFilter === 'ALL' || emp.statusKaryawan === statusFilter;
      
      let matchWa = true;
      if (waFilter === 'SENT') {
        matchWa = emp.whatsappStatus === 'Sent' || emp.whatsappStatus === 'Delivered' || emp.whatsappStatus === 'Read';
      } else if (waFilter === 'FAILED') {
        matchWa = emp.whatsappStatus === 'Failed';
      } else if (waFilter === 'PENDING') {
        matchWa = emp.whatsappStatus === 'Draft' || emp.whatsappStatus === 'Queued';
      }

      return matchSearch && matchDept && matchStatus && matchWa;
    });
  }, [employees, searchTerm, deptFilter, statusFilter, waFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Selection handlers
  const isAllVisibleSelected = paginatedEmployees.length > 0 && paginatedEmployees.every(e => selectedNiks.includes(e.nik));

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      const visibleSet = new Set(paginatedEmployees.map(e => e.nik));
      onSelectNiks(selectedNiks.filter(nik => !visibleSet.has(nik)));
    } else {
      const combined = new Set([...selectedNiks, ...paginatedEmployees.map(e => e.nik)]);
      onSelectNiks(Array.from(combined));
    }
  };

  const toggleSelectOne = (nik: string) => {
    if (selectedNiks.includes(nik)) {
      onSelectNiks(selectedNiks.filter(n => n !== nik));
    } else {
      onSelectNiks([...selectedNiks, nik]);
    }
  };

  // Helper badge renderer
  const renderWaStatusBadge = (status: WhatsAppDeliveryStatus, error?: string) => {
    switch (status) {
      case 'Sent':
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Terkirim
          </span>
        );
      case 'Read':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Dibaca
          </span>
        );
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Antrean
          </span>
        );
      case 'Failed':
        return (
          <span
            title={error || 'Pengiriman gagal'}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-help"
          >
            <XCircle className="w-3 h-3 text-rose-600" />
            Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            Belum Kirim
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      
      {/* Controls & Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIK, Nama, atau Jabatan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={waFilter}
              onChange={(e) => {
                setWaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status WA</option>
              <option value="SENT">Terkirim / Dibaca</option>
              <option value="PENDING">Belum Dikirim</option>
              <option value="FAILED">Gagal</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={100}>100 Baris</option>
            </select>
          </div>

        </div>

        {/* Selection Status Bar */}
        {selectedNiks.length > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-lg border border-emerald-500/30 text-xs">
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">
              {selectedNiks.length} karyawan terpilih dari {employees.length} total
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectNiks(employees.map(e => e.nik))}
                className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                Pilih Semua Karyawan
              </button>
              <span className="text-emerald-400">|</span>
              <button
                type="button"
                onClick={() => onSelectNiks([])}
                className="font-medium text-slate-600 dark:text-slate-400 hover:underline"
              >
                Batalkan Pilihan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">NIK</th>
              <th className="py-3 px-4">Nama & Posisi</th>
              <th className="py-3 px-3">Departemen</th>
              <th className="py-3 px-3 text-right">Gaji Bersih (THP)</th>
              <th className="py-3 px-3">Nomor WhatsApp</th>
              <th className="py-3 px-3 text-center">Status PDF</th>
              <th className="py-3 px-3 text-center">Status WA</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada data karyawan yang cocok dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const isSelected = selectedNiks.includes(emp.nik);
                const isWarning = emp.hasMathInconsistency || !emp.isValid;

                return (
                  <tr
                    key={emp.nik}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    } ${isWarning ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}
                  >
                    <td className="py-3 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(emp.nik)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {emp.nik}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {emp.nama}
                            {isWarning && (
                              <span title="Ada selisih formula atau nomor tidak valid">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{emp.jabatan}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {emp.departemen}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatIDR(emp.calculatedGajiBersih)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{maskPhoneNumber(emp.nomorWhatsapp || emp.nomorWhatsappRaw)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {emp.pdfGenerated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <FileCheck className="w-3 h-3 text-indigo-600" />
                          Siap
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum dibuat
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderWaStatusBadge(emp.whatsappStatus, emp.whatsappError)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetail(emp)}
                          title="Lihat Rincian Komponen Gaji"
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPreviewPdf(emp)}
                          title="Preview Slip Gaji PDF"
                          className="p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <CopySlipButton
                          employee={emp}
                          variant="icon"
                          onNotify={onNotify}
                        />
                        <WhatsAppSendLink
                          employee={emp}
                          ariaLabel="Kirim Slip Gaji via WhatsApp"
                          title="Kirim Slip Gaji via WhatsApp dan unduh PDF"
                          className="p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </WhatsAppSendLink>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> sampai{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {Math.min(currentPage * pageSize, filteredEmployees.length)}
          </span>{' '}
          dari <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredEmployees.length}</span> baris
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
