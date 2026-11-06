import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAppSettings } from '@/app/server/storage/settings-store';

function isLocalHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
}

function tryOpenWithCommand(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, {
        detached: true,
        stdio: 'ignore'
      });
      child.once('error', () => resolve(false));
      child.once('spawn', () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
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
    const resolvedPath = path.isAbsolute(storage.excelPath)
      ? storage.excelPath
      : path.resolve(/*turbopackIgnore: true*/ process.cwd(), storage.excelPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: `File master Excel tidak ditemukan pada path: ${resolvedPath}` },
        { status: 404 }
      );
    }

    const platform = process.platform;
    const isWsl = !!(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
    const hasDisplay = !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

    // 1. Linux / WSL
    if (platform === 'linux') {
      if (isWsl) {
        // Try WSL opener
        const wslOpened = await tryOpenWithCommand('wslview', [resolvedPath]);
        if (wslOpened) {
          return NextResponse.json({
            success: true,
            message: `File master Excel dibuka via WSL: ${path.basename(resolvedPath)}`
          });
        }
      }

      if (hasDisplay) {
        // Try xdg-open (standard Linux desktop)
        let opened = await tryOpenWithCommand('xdg-open', [resolvedPath]);
        if (!opened) {
          // Try gio open (GNOME / modern Linux)
          opened = await tryOpenWithCommand('gio', ['open', resolvedPath]);
        }
        if (!opened) {
          // Try libreoffice directly
          opened = await tryOpenWithCommand('libreoffice', [resolvedPath]);
        }

        if (opened) {
          return NextResponse.json({
            success: true,
            message: `File master Excel dibuka di desktop Linux: ${path.basename(resolvedPath)}`
          });
        }
      }

      return NextResponse.json({
        success: true,
        headless: true,
        message: `File master Excel tersimpan di: ${resolvedPath}`
      });
    }

    // 2. macOS
    if (platform === 'darwin') {
      const opened = await tryOpenWithCommand('open', [resolvedPath]);
      if (opened) {
        return NextResponse.json({
          success: true,
          message: `File master Excel dibuka: ${path.basename(resolvedPath)}`
        });
      }
    }

    // 3. Windows
    if (platform === 'win32') {
      const opened = await tryOpenWithCommand('explorer.exe', [resolvedPath]);
      if (opened) {
        return NextResponse.json({
          success: true,
          message: `File master Excel dibuka di Windows: ${path.basename(resolvedPath)}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `File master Excel tersimpan di: ${resolvedPath}`
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Gagal membuka file master Excel' },
      { status: 500 }
    );
  }
}
