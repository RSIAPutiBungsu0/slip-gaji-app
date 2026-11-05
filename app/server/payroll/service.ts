import path from 'path';
import { readPayrollExcel } from '../excel/reader';
import { validatePayrollDataset } from './validator';
import { getAppSettings } from '../storage/settings-store';
import { getPeriodHistory } from '../storage/history-store';
import { checkPdfExists } from '../pdf/generator';
import { EmployeeRecord, PayrollSummaryKPI } from '@/app/types/employee';
import { initializeDefaultExcelFiles } from '../excel/template-generator';

export interface FullPayrollPayload {
  period: string;
  sheets: string[];
  activeSheet: string;
  employees: EmployeeRecord[];
  kpi: PayrollSummaryKPI;
  hasErrors: boolean;
  hasWarnings: boolean;
  totalErrors: number;
  totalWarnings: number;
  filePath: string;
}

/**
 * Loads and compiles the complete payroll dataset for the active period.
 */
export async function getFullPayrollData(preferredSheet?: string): Promise<FullPayrollPayload> {
  // Ensure default sample files exist if first time
  await initializeDefaultExcelFiles();

  const settings = await getAppSettings();
  const period = settings.activePeriod || '2026-11';
  const targetSheet = preferredSheet || settings.activeSheet;

  const excelResult = await readPayrollExcel(settings.storage.excelPath, targetSheet, false);
  
  if (excelResult.error || excelResult.rawRows.length === 0) {
    return {
      period,
      sheets: excelResult.sheets,
      activeSheet: excelResult.activeSheet,
      employees: [],
      kpi: {
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
      },
      hasErrors: !!excelResult.error,
      hasWarnings: false,
      totalErrors: excelResult.error ? 1 : 0,
      totalWarnings: 0,
      filePath: settings.storage.excelPath
    };
  }

  // Validate dataset
  const validation = validatePayrollDataset(excelResult.rawRows, period);
  const history = await getPeriodHistory(period);

  // Enhance employees with disk PDF status and WhatsApp history status
  let totalPdfSiap = 0;
  let totalWaTerkirim = 0;
  let totalWaPending = 0;
  let totalWaGagal = 0;
  let totalInkonsisten = 0;
  let totalGajiKotor = 0;
  let totalPotongan = 0;
  let totalGajiBersih = 0;

  const enhancedEmployees: EmployeeRecord[] = validation.employees.map(emp => {
    const isPdfReady = checkPdfExists(period, emp.pdfFilename);
    if (isPdfReady) totalPdfSiap++;

    const historyRecord = history.records[emp.nik];
    let waStatus = emp.whatsappStatus;
    let waError: string | undefined;
    let waSentAt: string | undefined;
    let waMessageId: string | undefined;

    if (historyRecord) {
      waStatus = historyRecord.status;
      waError = historyRecord.error;
      waSentAt = historyRecord.sentAt;
      waMessageId = historyRecord.messageId;
    }

    if (waStatus === 'Sent' || waStatus === 'Delivered' || waStatus === 'Read') {
      totalWaTerkirim++;
    } else if (waStatus === 'Failed') {
      totalWaGagal++;
    } else {
      totalWaPending++;
    }

    if (emp.hasMathInconsistency || !emp.isValid) {
      totalInkonsisten++;
    }

    totalGajiKotor += emp.calculatedGajiKotor;
    totalPotongan += emp.calculatedTotalPotongan;
    totalGajiBersih += emp.calculatedGajiBersih;

    return {
      ...emp,
      pdfGenerated: isPdfReady,
      whatsappStatus: waStatus,
      whatsappError: waError,
      whatsappSentAt: waSentAt,
      whatsappMessageId: waMessageId
    };
  });

  const kpi: PayrollSummaryKPI = {
    totalKaryawan: enhancedEmployees.length,
    totalGajiKotor,
    totalPotongan,
    totalGajiBersih,
    totalPdfSiap,
    totalPdfBelum: enhancedEmployees.length - totalPdfSiap,
    totalWaTerkirim,
    totalWaPending,
    totalWaGagal,
    totalInkonsisten,
    isAllConsistent: totalInkonsisten === 0 && validation.totalErrors === 0
  };

  return {
    period,
    sheets: excelResult.sheets,
    activeSheet: excelResult.activeSheet,
    employees: enhancedEmployees,
    kpi,
    hasErrors: validation.totalErrors > 0,
    hasWarnings: validation.totalWarnings > 0,
    totalErrors: validation.totalErrors,
    totalWarnings: validation.totalWarnings,
    filePath: settings.storage.excelPath
  };
}
