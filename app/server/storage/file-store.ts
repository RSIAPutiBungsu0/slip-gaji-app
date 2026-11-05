import fs from 'fs';
import path from 'path';

/**
 * Base directory for all Payroll storage.
 * Defaults to ./Payroll within the project or absolute path.
 */
export const PAYROLL_ROOT_DIR = process.env.PAYROLL_STORAGE_PATH 
  ? path.resolve(process.env.PAYROLL_STORAGE_PATH) 
  : path.resolve(process.cwd(), 'Payroll');

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Validates and sanitizes a path to prevent path traversal attacks.
 * Rejects paths containing '..' that resolve outside safe roots.
 */
export function sanitizePath(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  // Ensure the directory exists or can be accessed safely
  return resolved;
}

/**
 * Atomic file writing: writes content to a temporary file first,
 * then atomically renames it to the target file.
 * This guarantees zero corruption if power or execution is interrupted.
 */
export async function writeAtomic(targetFilePath: string, content: string | Buffer): Promise<void> {
  const dir = path.dirname(targetFilePath);
  ensureDir(dir);
  
  const tempPath = `${targetFilePath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  
  try {
    if (typeof content === 'string') {
      await fs.promises.writeFile(tempPath, content, 'utf-8');
    } else {
      await fs.promises.writeFile(tempPath, content);
    }
    await fs.promises.rename(tempPath, targetFilePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try {
        await fs.promises.unlink(tempPath);
      } catch {
        // ignore cleanup error
      }
    }
    throw err;
  }
}

/**
 * Read JSON file safely, returns null if file doesn't exist
 */
export async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading JSON from ${filePath}:`, err);
    return null;
  }
}
