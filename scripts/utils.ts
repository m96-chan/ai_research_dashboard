import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const DATA_DIR = new URL('../src/data/', import.meta.url).pathname;

export function saveJson(filename: string, data: unknown): void {
  const path = `${DATA_DIR}${filename}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ Saved ${filename}`);
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export function isoNow(): string {
  return new Date().toISOString();
}
