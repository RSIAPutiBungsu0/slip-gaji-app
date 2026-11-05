'use client';

import React from 'react';
import { 
  Users, 
  Wallet, 
  Receipt, 
  Banknote, 
  FileCheck, 
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { PayrollSummaryKPI } from '@/app/types/employee';
import { formatIDR } from '@/app/lib/utils';

interface MetricCardsProps {
  kpi: PayrollSummaryKPI;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ kpi }) => {
  const cards = [
    {
      title: 'Total Karyawan Aktif',
      value: `${kpi.totalKaryawan} Orang`,
      subtitle: `${kpi.totalInkonsisten > 0 ? `${kpi.totalInkonsisten} perlu perhatian` : 'Semua data valid'}`,
      icon: Users,
      color: 'blue',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Gaji Kotor',
      value: formatIDR(kpi.totalGajiKotor),
      subtitle: 'Akumulasi seluruh penghasilan bruto',
      icon: Wallet,
      color: 'slate',
      borderColor: 'border-slate-500/20',
      bgColor: 'bg-slate-50/50 dark:bg-slate-900/40',
      iconBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
    },
    {
      title: 'Total Pemotongan',
      value: formatIDR(kpi.totalPotongan),
      subtitle: 'BPJS, PPh 21 & potongan lainnya',
      icon: Receipt,
      color: 'amber',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Total Gaji Bersih (THP)',
      value: formatIDR(kpi.totalGajiBersih),
      subtitle: 'Total dana payroll yang disalurkan',
      icon: Banknote,
      color: 'emerald',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      highlight: true
    },
    {
      title: 'Slip Gaji PDF Siap',
      value: `${kpi.totalPdfSiap} / ${kpi.totalKaryawan}`,
      subtitle: `${kpi.totalPdfBelum === 0 ? 'Seluruh PDF tersimpan di disk' : `${kpi.totalPdfBelum} PDF belum dibuat`}`,
      icon: FileCheck,
      color: 'indigo',
      borderColor: 'border-indigo-500/20',
      bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Status WhatsApp',
      value: `${kpi.totalWaTerkirim} Terkirim`,
      subtitle: `${kpi.totalWaGagal > 0 ? `${kpi.totalWaGagal} gagal • ` : ''}${kpi.totalWaPending} antrean`,
      icon: Send,
      color: 'teal',
      borderColor: 'border-teal-500/20',
      bgColor: 'bg-teal-50/50 dark:bg-teal-950/20',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${card.borderColor} ${card.bgColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              card.highlight ? 'ring-2 ring-emerald-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
