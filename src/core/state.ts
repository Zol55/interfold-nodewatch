import { readFile, writeFile } from 'node:fs/promises';
import type { WatchSnapshot } from './alerts.js';

export async function loadState(path: string): Promise<WatchSnapshot | null> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as WatchSnapshot;
  } catch (err) {
    if (isNodeError(err) && err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function saveState(path: string, state: WatchSnapshot): Promise<void> {
  await writeFile(path, JSON.stringify(state, null, 2), 'utf8');
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
