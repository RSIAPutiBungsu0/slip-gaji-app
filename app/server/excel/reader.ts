import ExcelJS from 'exceljs';
import fs from 'fs';
import { matchHeaderToKey } from './mapper';
import { createExcelBackup } from '../storage/backup-service';
import { logAudit } from '../logger/audit';

export interface ExcelReadResult {
  filePath: string;
  sheets: string[];
  activeSheet: string;
  totalRows: number;
  detectedColumns: Record<string, number>; // key -> column index
  rawRows: any[];
  error?: string;
}

/**
 * Reads and parses an Excel payroll file.
 */
export async function readPayrollExcel(
  filePath: string,
  preferredSheetName?: string,
  performBackup: boolean = true
): Promise<ExcelReadResult> {
  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      sheets: [],
      activeSheet: '',
      totalRows: 0,
      detectedColumns: {},
      rawRows: [],
      error: `File Excel tidak ditemukan pada path: ${filePath}`
    };
  }

  if (performBackup) {
    // Snapshot backup in background
    createExcelBackup(filePath).catch(console.error);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheets = workbook.worksheets.map(w => w.name);
  if (sheets.length === 0) {
    return {
      filePath,
      sheets: [],
      activeSheet: '',
      totalRows: 0,
      detectedColumns: {},
      rawRows: [],
      error: 'File Excel tidak memiliki lembar kerja (worksheet)'
    };
  }

  let worksheet = preferredSheetName ? workbook.getWorksheet(preferredSheetName) : null;
  if (!worksheet) {
    worksheet = workbook.worksheets[0];
  }
  const activeSheet = worksheet.name;

  // Find header row (search rows 1 to 10 for key indicators like NIK or Nama)
  let headerRowIndex = 1;
  let bestHeaderScore = 0;
  let detectedColumns: Record<string, number> = {};

  for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let matchedCount = 0;
    const currentDetected: Record<string, number> = {};

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const cellValue = cell.text || (cell.value ? String(cell.value) : '');
      const matchedKey = matchHeaderToKey(cellValue);
      if (matchedKey && !currentDetected[matchedKey]) {
        currentDetected[matchedKey] = colNumber;
        matchedCount++;
      }
    });

    if (matchedCount > bestHeaderScore) {
      bestHeaderScore = matchedCount;
      headerRowIndex = r;
      detectedColumns = currentDetected;
    }
  }

  // Parse data rows starting after headerRowIndex
  const rawRows: any[] = [];
  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    
    // Check if row has any content
    let hasValue = false;
    const rowObj: Record<string, any> = {};

    for (const [key, colNumber] of Object.entries(detectedColumns)) {
      const cell = row.getCell(colNumber);
      let val = cell.value;
      
      // If cell has formula result
      if (val && typeof val === 'object' && 'result' in val) {
        val = val.result;
      }

      if (val !== null && val !== undefined && val !== '') {
        hasValue = true;
      }
      rowObj[key] = val;
    }

    // Only add if row has at least NIK or Nama
    if (hasValue && (rowObj.nik || rowObj.nama)) {
      rawRows.push(rowObj);
    }
  }

  await logAudit('EXCEL_LOAD', `Membaca ${rawRows.length} baris data dari sheet "${activeSheet}"`, 'SUCCESS');

  return {
    filePath,
    sheets,
    activeSheet,
    totalRows: rawRows.length,
    detectedColumns,
    rawRows
  };
}
