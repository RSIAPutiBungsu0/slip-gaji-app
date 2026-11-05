import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { getAppSettings } from '@/app/server/storage/settings-store';

function isLocalHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
}

function getFilePaths(filePath: string): { localPath: string; windowsPath: string } | null {
  if (process.env.OS === 'Windows_NT') {
    return { localPath: filePath, windowsPath: filePath };
  }

  if (!process.env.WSL_DISTRO_NAME && !process.env.WSL_INTEROP) return null;

  const windowsPathMatch = /^([a-z]):[\\/](.*)$/i.exec(filePath);
  if (!windowsPathMatch) return null;

  const drive = windowsPathMatch[1].toLowerCase();
  const relativePath = windowsPathMatch[2].replace(/\\/g, '/');
  return {
    localPath: `/mnt/${drive}/${relativePath}`,
    windowsPath: filePath
  };
}

function openWithWindows(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const opener = spawn('explorer.exe', [filePath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });

    opener.once('error', reject);
    opener.once('spawn', () => {
      opener.unref();
      resolve();
    });
  });
}

export async function POST(request: Request) {
  const host = request.headers.get('host') || '';
  const origin = request.headers.get('origin');

  if (!isLocalHost(host) || !origin) {
    return NextResponse.json({ error: 'Fitur ini hanya tersedia dari aplikasi lokal' }, { status: 403 });
  }

  try {
    const originUrl = new URL(origin);
    if (!isLocalHost(originUrl.host) || originUrl.host.toLowerCase() !== host.toLowerCase()) {
      return NextResponse.json({ error: 'Permintaan bukan berasal dari aplikasi lokal' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Origin permintaan tidak valid' }, { status: 403 });
  }

  try {
    const { storage } = await getAppSettings();
    const filePaths = getFilePaths(storage.excelPath);
    if (!filePaths) {
      return NextResponse.json(
        { error: 'Server aplikasi tidak berjalan di Windows atau WSL dengan akses ke Windows Explorer' },
        { status: 501 }
      );
    }

    if (!fs.existsSync(filePaths.localPath)) {
      return NextResponse.json({ error: 'File master Excel tidak ditemukan' }, { status: 404 });
    }

    await openWithWindows(filePaths.windowsPath);

    return NextResponse.json({ success: true, message: 'File master dibuka di aplikasi Windows.' });
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Windows Explorer tidak ditemukan. Jalankan aplikasi langsung di Windows atau aktifkan WSL interop.' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Gagal membuka file master Excel' },
      { status: 500 }
    );
  }
}
