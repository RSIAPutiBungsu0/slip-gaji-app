import { ImageResponse } from 'next/og';
import React from 'react';
import path from 'path';
import { EmployeeRecord } from '@/app/types/employee';
import { CompanySettings } from '@/app/types/config';
import { formatPeriodLabel } from './generator';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic } from '../storage/file-store';
import { formatIDR } from '../payroll/calculator';

export interface GenerateImageOptions {
  employee: EmployeeRecord;
  company: CompanySettings;
  period: string;
  periodLabel?: string;
  saveToDisk?: boolean;
}

/**
 * Generates an official, high-resolution payslip image in PNG format.
 * Returns the PNG as a Buffer.
 */
export async function generatePayslipImage(options: GenerateImageOptions): Promise<Buffer> {
  const { employee, company, period, saveToDisk = true } = options;
  const periodLabel = options.periodLabel || formatPeriodLabel(period);

  const earnings = [
    { label: 'Gaji Pokok', val: employee.gajiPokok },
    { label: 'Tunjangan Jabatan', val: employee.tunjanganJabatan },
    { label: 'Tunj. Transport & Makan', val: employee.tunjanganTransportMakan },
    { label: 'Lembur / Insentif', val: employee.lemburInsentif }
  ];

  const deductions = [
    { label: 'BPJS Kesehatan (1%)', val: employee.bpjsKesehatan },
    { label: 'BPJS Ketenagakerjaan (2%)', val: employee.bpjsKetenagakerjaan },
    { label: 'PPh 21', val: employee.pph21 },
    { label: 'Potongan Lain', val: employee.potonganLain }
  ];

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '28px 32px',
          color: '#0f172a',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e293b',
            borderRadius: '10px 10px 0 0',
            padding: '18px 22px',
            borderBottom: '4px solid #10b981'
          }}
        >
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
            {company.companyName.toUpperCase()}
          </div>
          <div style={{ display: 'flex', fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
            {company.companyAddress}
          </div>
          <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {`Telp: ${company.companyPhone}  |  Email: ${company.companyEmail}`}
          </div>
        </div>

        {/* Title & Period Banner */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 14,
            marginBottom: 12
          }}
        >
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
            SLIP GAJI KARYAWAN
          </div>
          <div style={{ display: 'flex', fontSize: 13, color: '#475569', marginTop: 2, fontWeight: 500 }}>
            {`Periode: ${periodLabel}`}
          </div>
        </div>

        {/* Employee Info Grid */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 18px',
            fontSize: 12,
            marginBottom: 14
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', width: '50%', gap: 5 }}>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 110, color: '#64748b', fontWeight: 600 }}>NIK</span>
              <span style={{ display: 'flex', color: '#0f172a', fontWeight: 600 }}>{`: ${employee.nik}`}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 110, color: '#64748b', fontWeight: 600 }}>Nama Karyawan</span>
              <span style={{ display: 'flex', color: '#0f172a', fontWeight: 700 }}>{`: ${employee.nama}`}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 110, color: '#64748b', fontWeight: 600 }}>Jabatan / Unit</span>
              <span style={{ display: 'flex', color: '#0f172a' }}>{`: ${employee.jabatan}`}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '50%', gap: 5 }}>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 130, color: '#64748b', fontWeight: 600 }}>Status Kepegawaian</span>
              <span style={{ display: 'flex', color: '#0f172a' }}>{`: ${employee.statusKaryawan}`}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 130, color: '#64748b', fontWeight: 600 }}>Departemen</span>
              <span style={{ display: 'flex', color: '#0f172a' }}>{`: ${employee.departemen}`}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: 130, color: '#64748b', fontWeight: 600 }}>Hari Kerja</span>
              <span style={{ display: 'flex', color: '#0f172a' }}>{`: ${employee.hariKerja} Hari`}</span>
            </div>
          </div>
        </div>

        {/* Two columns: Earnings & Deductions */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {/* Earnings Column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <span style={{ display: 'flex' }}>RINCIAN PENGHASILAN</span>
              <span style={{ display: 'flex' }}>NOMINAL</span>
            </div>
            {earnings.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  fontSize: 11,
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ display: 'flex', color: '#334155' }}>{item.label}</span>
                <span style={{ display: 'flex', color: '#0f172a', fontWeight: 600 }}>{formatIDR(item.val)}</span>
              </div>
            ))}
            {/* Total Kotor Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: '#f1f5f9',
                borderTop: '1px solid #cbd5e1',
                color: '#0f172a'
              }}
            >
              <span style={{ display: 'flex' }}>TOTAL GAJI KOTOR</span>
              <span style={{ display: 'flex' }}>{formatIDR(employee.calculatedGajiKotor)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <span style={{ display: 'flex' }}>RINCIAN PEMOTONGAN</span>
              <span style={{ display: 'flex' }}>NOMINAL</span>
            </div>
            {deductions.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  fontSize: 11,
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ display: 'flex', color: '#334155' }}>{item.label}</span>
                <span style={{ display: 'flex', color: '#0f172a', fontWeight: 600 }}>{formatIDR(item.val)}</span>
              </div>
            ))}
            {/* Total Potongan Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: '#fef2f2',
                borderTop: '1px solid #fecaca',
                color: '#991b1b'
              }}
            >
              <span style={{ display: 'flex' }}>TOTAL POTONGAN</span>
              <span style={{ display: 'flex' }}>{formatIDR(employee.calculatedTotalPotongan)}</span>
            </div>
          </div>
        </div>

        {/* Take Home Pay Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #10b981',
            borderRadius: 8,
            padding: '12px 18px',
            marginBottom: 16
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#065f46' }}>
              GAJI BERSIH (TAKE HOME PAY)
            </span>
            <span style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: '#047857' }}>
              {formatIDR(employee.calculatedGajiBersih)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              fontStyle: 'italic',
              color: '#334155',
              marginTop: 4
            }}
          >
            {`Terbilang: ${employee.terbilang}`}
          </div>
        </div>

        {/* Footer & Signer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', fontSize: 10, fontStyle: 'italic', color: '#64748b' }}>
              * Dokumen ini diterbitkan secara otomatis dan sah tanpa tanda tangan basah.
            </div>
            <div style={{ display: 'flex', fontSize: 10, color: '#94a3b8' }}>
              Dicetak otomatis oleh Sistem Payroll
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 11,
              color: '#1e293b'
            }}
          >
            <div style={{ display: 'flex' }}>{`${company.signerCity}, ${periodLabel}`}</div>
            <div style={{ display: 'flex', fontSize: 10, color: '#64748b', marginTop: 2 }}>{company.signerTitle}</div>
            <div style={{ display: 'flex', marginTop: 36, fontWeight: 700, borderBottom: '1px solid #1e293b', paddingBottom: 2 }}>
              {`( ${company.signerName} )`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 820,
      height: 720
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (saveToDisk) {
    const imageFilename = employee.pdfFilename.replace(/\.pdf$/i, '.png');
    const slipsDir = path.join(PAYROLL_ROOT_DIR, 'slips', period);
    ensureDir(slipsDir);
    const imagePath = path.join(slipsDir, imageFilename);
    await writeAtomic(imagePath, buffer);
  }

  return buffer;
}
