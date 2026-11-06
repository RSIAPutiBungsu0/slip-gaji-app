import { ImageResponse } from 'next/og';
import React from 'react';
import path from 'path';
import fs from 'fs';
import { EmployeeRecord } from '@/app/types/employee';
import { CompanySettings } from '@/app/types/config';
import { formatPeriodLabel } from './generator';
import { PAYROLL_ROOT_DIR, ensureDir, writeAtomic } from '../storage/file-store';
import { formatIDR } from '../payroll/calculator';

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string | null {
  if (cachedLogoBase64 !== null) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-rsia.png');
    if (fs.existsSync(logoPath)) {
      const data = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${data.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.error('Failed to load logo-rsia.png:', err);
  }
  return null;
}

export interface GenerateImageOptions {
  employee: EmployeeRecord;
  company: CompanySettings;
  period: string;
  periodLabel?: string;
  saveToDisk?: boolean;
}

/**
 * Generates an official, high-resolution payslip image in PNG format
 * matching RSIA PUTI BUNGSU official template.
 */
export async function generatePayslipImage(options: GenerateImageOptions): Promise<Buffer> {
  const { employee, company, period, saveToDisk = true } = options;

  const bulan = (employee.bulan || (period.split('-')[1] ? [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ][parseInt(period.split('-')[1], 10) - 1] : 'OKTOBER')).toUpperCase();

  const tahun = employee.tahun || (period.split('-')[0] || '2026');
  const dateStr = `${company.signerCity || 'Bandarjaya'}, 1-${bulan.slice(0, 3)}-${String(tahun).slice(-2)}`;
  const logoBase64 = getLogoBase64();

  const formatVal = (num: number) => {
    return num > 0 ? formatIDR(num).replace('Rp ', '') : '-';
  };

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '24px 32px',
          color: '#0f172a',
          fontFamily: 'sans-serif'
        }}
      >
        {/* 1. Header (Kop Surat RSIA PUTI BUNGSU) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            paddingBottom: '14px',
            borderBottom: '2px solid #0f172a'
          }}
        >
          {/* Logo RSIA */}
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px'
            }}
          >
            {logoBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoBase64}
                alt="Logo"
                width={60}
                height={60}
                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
              />
            ) : null}
          </div>

          {/* Centered Name and Address */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, color: '#581c87', letterSpacing: '0.5px' }}>
              {company.companyName || 'RSIA PUTI BUNGSU'}
            </div>
            <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: '#581c87', marginTop: 3 }}>
              {company.companyAddress || 'Jl. Raden Intan, Bandar Jaya Timur, Terbanggi Besar,'}
            </div>
            <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: '#581c87', marginTop: 1 }}>
              Lampung Tengah 34163
            </div>
          </div>
        </div>

        {/* 2. Title & Metadata */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ display: 'flex', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            SLIP GAJI
          </div>
        </div>

        {/* Metadata info in 2 columns */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '6px', fontSize: 12 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '48%' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: '120px', color: '#0f172a' }}>Bulan</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex', fontWeight: 700 }}>{bulan}</span>
            </div>
            <div style={{ display: 'flex', marginTop: '3px' }}>
              <span style={{ display: 'flex', width: '120px', color: '#0f172a' }}>Tahun</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex', fontWeight: 700 }}>{String(tahun)}</span>
            </div>
            <div style={{ display: 'flex', marginTop: '3px' }}>
              <span style={{ display: 'flex', width: '120px', color: '#0f172a' }}>Unit</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex' }}>{employee.unit || employee.departemen || '-'}</span>
            </div>
            <div style={{ display: 'flex', marginTop: '3px' }}>
              <span style={{ display: 'flex', width: '120px', color: '#0f172a' }}>Sub Unit/Bagian</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex' }}>{employee.subUnit || '-'}</span>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '48%' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', width: '90px', color: '#0f172a' }}>Nama</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex', fontWeight: 700 }}>{employee.nama}</span>
            </div>
            <div style={{ display: 'flex', marginTop: '3px' }}>
              <span style={{ display: 'flex', width: '90px', color: '#0f172a' }}>Jabatan</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex' }}>{employee.jabatan || '-'}</span>
            </div>
            <div style={{ display: 'flex', marginTop: '3px' }}>
              <span style={{ display: 'flex', width: '90px', color: '#0f172a' }}>Status</span>
              <span style={{ display: 'flex', width: '15px' }}>:</span>
              <span style={{ display: 'flex' }}>{employee.status || employee.statusKaryawan || 'Full Time'}</span>
            </div>
          </div>
        </div>

        {/* 3. Divider before main columns */}
        <div style={{ display: 'flex', width: '100%', height: '1.5px', backgroundColor: '#0f172a', margin: '8px 0' }} />

        {/* 4. Two Columns: PENGHASILAN vs POTONGAN */}
        <div style={{ display: 'flex', width: '100%', gap: '30px' }}>
          {/* Left Column: PENGHASILAN */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 800, fontSize: 13, marginBottom: '6px' }}>
              PENGHASILAN
            </div>

            {/* I. PENGHASILAN TETAP */}
            <div style={{ display: 'flex', fontWeight: 700, marginTop: '2px' }}>I. PENGHASILAN TETAP</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Gaji Pokok</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.gajiPokok)}</span>
              </div>
            </div>

            {/* II. TUNJANGAN */}
            <div style={{ display: 'flex', fontWeight: 700, marginTop: '4px' }}>II. TUNJANGAN</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Jabatan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganJabatan)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Profesi</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganProfesi)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Kehadiran</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganKehadiran)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Tetap</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganTetap)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>BPJS Kesehatan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganBpjsKesehatan)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>JHT</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganJht)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>JKK</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganJkk)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>JKM</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganJkm)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>JP</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.tunjanganJp)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Bonus 2022</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.bonus)}</span>
              </div>
            </div>

            {/* III. JASA PELAYANAN */}
            <div style={{ display: 'flex', fontWeight: 700, marginTop: '4px' }}>III. JASA PELAYANAN</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Jasa Pelayanan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.jasaPelayanan)}</span>
              </div>
            </div>

            {/* IV. LEMBUR/KOMPENSASI */}
            <div style={{ display: 'flex', fontWeight: 700, marginTop: '4px' }}>IV. LEMBUR/KOMPENSASI</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Lembur</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.lembur)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Kompensasi Pengganti Shift</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.kompensasiShift)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Jasa Rujuk</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.jasaRujuk)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', marginTop: '1px' }}>
              <span>Lain-Lain</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.lainLainPenghasilan)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: POTONGAN & ABSENSI */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 800, fontSize: 13, marginBottom: '6px' }}>
              POTONGAN
            </div>

            {/* Lowered by 1 line under POTONGAN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px' }}>
              <span>Iuran BPJS Kesehatan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.iuranBpjsKesehatan)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>Iuran BPJS Ketenagakerjaan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.iuranBpjsKetenagakerjaan)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>Pinjaman</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.pinjaman)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>Punishment Keterlambatan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.punishmentKeterlambatan)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>Kompensasi Ketidakhadiran</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.kompensasiKetidakhadiran)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>PPH 21</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.pph21)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span>Lain-lain</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>:</span>
                <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.lainLainPotongan)}</span>
              </div>
            </div>

            {/* Total Potongan Box */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>POTONGAN</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.calculatedTotalPotongan)}</span>
                </div>
              </div>
            </div>

            {/* --Absensi-- Section with Light Grey BG like Penerimaan Bersih */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '16px',
                backgroundColor: '#e2e8f0',
                borderTop: '1px solid #0f172a',
                borderBottom: '1px solid #0f172a',
                padding: '6px 8px'
              }}
            >
              <div style={{ display: 'flex', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                --Absensi--
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginTop: '1px' }}>
                <span>Cuti Tahunan</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{employee.cutiTahunan}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginTop: '1px' }}>
                <span>Izin</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{employee.izin}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginTop: '1px' }}>
                <span>Izin Sakit</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{employee.izinSakit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginTop: '1px' }}>
                <span>Jumlah Menit Terlambat</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{employee.jumlahMenitTerlambat}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginTop: '1px' }}>
                <span>Tukar Shift</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>:</span>
                  <span style={{ width: '85px', textAlign: 'right' }}>{employee.tukarShift}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Bottom Totals Section */}
        <div style={{ display: 'flex', width: '100%', height: '1.5px', backgroundColor: '#0f172a', margin: '8px 0 4px 0' }} />

        {/* Penghasilan Kotor Row */}
        <div style={{ display: 'flex', width: '50%', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
          <span>PENGHASILAN KOTOR</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span>:</span>
            <span style={{ width: '85px', textAlign: 'right' }}>{formatVal(employee.calculatedGajiKotor)}</span>
          </div>
        </div>

        {/* 6. PENERIMAAN BERSIH Highlight Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #0f172a',
            borderBottom: '1px solid #0f172a',
            padding: '8px 12px',
            marginTop: '8px',
            fontSize: 14,
            fontWeight: 800
          }}
        >
          <span>PENERIMAAN BERSIH</span>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>:</span>
            <span>{formatIDR(employee.calculatedGajiBersih)}</span>
          </div>
        </div>

        {/* 7. Terbilang, Rekening, & Signer Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: 11 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '60%' }}>
            <span style={{ display: 'flex', fontStyle: 'italic', fontWeight: 600 }}>
              {employee.terbilang.toLowerCase()}
            </span>
            <span style={{ display: 'flex', marginTop: '2px' }}>
              {`Telah ditransfer ke rekening: ${employee.nomorRekening || '-'}`}
            </span>
          </div>
          {/* Signer on Right (Right-aligned, lowered by 2 lines) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', marginTop: '18px' }}>
            <span>{dateStr}</span>
            <span style={{ marginTop: '38px', fontWeight: 600 }}>
              {company.signerName || 'dr. Puteri Rahimi Halim MARS'}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 820,
      height: 980
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
