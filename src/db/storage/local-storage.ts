import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import trimStart from 'lodash/trimStart';

const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const LOCAL_STORAGE_DIR = path.resolve(process.env.AUDIO_STORAGE_LOCAL_PATH || 'local/tmp/audio');

function ensureInStorageDir(targetPath: string) {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(LOCAL_STORAGE_DIR + path.sep)) {
    throw new Error('Access outside of storage directory is not allowed');
  }
}

async function ensureDirExists(dir: string) {
  ensureInStorageDir(dir);
  if (!fs.existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function uploadFile(filePath: string, destination: string): Promise<void> {
  destination = trimStart(destination, '/');
  const destPath = path.join(LOCAL_STORAGE_DIR, destination);
  ensureInStorageDir(destPath);
  await ensureDirExists(path.dirname(destPath));
  await copyFile(filePath, destPath);
}

export async function downloadFile(srcFilename: string, destFilename: string): Promise<void> {
  destFilename = trimStart(destFilename, '/');
  const srcPath = path.join(LOCAL_STORAGE_DIR, srcFilename);
  ensureInStorageDir(srcPath);
  await ensureDirExists(path.dirname(destFilename));
  await copyFile(srcPath, destFilename);
}

export async function deleteFile(filename: string): Promise<void> {
  filename = trimStart(filename, '/');
  const filePath = path.join(LOCAL_STORAGE_DIR, filename);
  ensureInStorageDir(filePath);
  if (fs.existsSync(filePath)) {
    await unlink(filePath);
  }
}

export async function listFiles(prefix = ''): Promise<string[]> {
  prefix = trimStart(prefix, '/');
  const dirPath = path.join(LOCAL_STORAGE_DIR, prefix);
  ensureInStorageDir(dirPath);
  if (!fs.existsSync(dirPath)) return [];
  const files: string[] = [];
  async function walk(currentPath: string, relPath: string) {
    const items = await readdir(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const itemRelPath = path.join(relPath, item);
      const itemStat = await stat(itemPath);
      if (itemStat.isDirectory()) {
        await walk(itemPath, itemRelPath);
      } else {
        files.push(itemRelPath.replace(/\\/g, '/'));
      }
    }
  }
  await walk(dirPath, prefix);
  return files;
}

export async function exists(filename: string): Promise<boolean> {
  filename = trimStart(filename, '/');
  const filePath = path.join(LOCAL_STORAGE_DIR, filename);
  ensureInStorageDir(filePath);
  return fs.existsSync(filePath);
}