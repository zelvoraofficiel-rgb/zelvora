import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { LocalDb } from '@/lib/types';

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'local-db.json');
const emptyDb = (): LocalDb => ({ users: [], organizations: [], stores: [], products: [], customers: [], orders: [], notifications: [] });
let writeQueue = Promise.resolve();

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  try { await readFile(dbFile, 'utf8'); } catch { await writeFile(dbFile, JSON.stringify(emptyDb(), null, 2), 'utf8'); }
}

export async function readDb(): Promise<LocalDb> {
  await ensureDb();
  const raw = await readFile(dbFile, 'utf8');
  return JSON.parse(raw) as LocalDb;
}

/** Development adapter only. Production must use the PostgreSQL/Prisma adapter. */
export async function mutateDb<T>(mutator: (db: LocalDb) => T | Promise<T>): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    result = await mutator(db);
    const temp = `${dbFile}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
    await rename(temp, dbFile);
  });
  await writeQueue;
  return result;
}

export const id = () => randomUUID();
export const now = () => new Date().toISOString();

export function slugify(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'boutique';
}

export function uniqueSlug(existing: string[], preferred: string) {
  const base = slugify(preferred);
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}
