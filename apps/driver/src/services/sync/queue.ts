import * as SQLite from 'expo-sqlite';
import type { QueuedItem } from './types';

const DB_NAME = 'trakbin_driver.db';
const TABLE = 'sync_queue';
const MAX = 500;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export async function initQueue(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      idempotency_key TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      enqueued_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
  `);
}

let listeners: Array<() => void> = [];
const subscribe = (cb: () => void) => {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
};
const notify = () => listeners.forEach((l) => { try { l(); } catch {} });

function toItem(r: any): QueuedItem {
  return {
    idempotencyKey: r.idempotency_key,
    type: r.type,
    payload: JSON.parse(r.payload),
    enqueuedAt: r.enqueued_at,
    attempts: r.attempts,
  };
}

export const offlineQueue = {
  async enqueue(item: QueuedItem): Promise<void> {
    const db = await getDb();
    // PRIMARY KEY = dedup (mirrors PWA's some(x => x.idempotencyKey === ...))
    await db.runAsync(
      `INSERT OR IGNORE INTO ${TABLE} (idempotency_key, type, payload, enqueued_at, attempts) VALUES (?, ?, ?, ?, 0)`,
      [item.idempotencyKey, item.type, JSON.stringify(item.payload), item.enqueuedAt]
    );
    // Cap at MAX, drop oldest (mirrors items.slice(-MAX))
    await db.runAsync(
      `DELETE FROM ${TABLE} WHERE rowid NOT IN (SELECT rowid FROM ${TABLE} ORDER BY rowid DESC LIMIT ${MAX})`
    );
    notify();
  },

  async list(): Promise<QueuedItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(`SELECT * FROM ${TABLE} ORDER BY rowid ASC`);
    return rows.map(toItem);
  },

  async size(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(`SELECT COUNT(*) AS n FROM ${TABLE}`);
    return row?.n ?? 0;
  },

  async remove(idempotencyKey: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ${TABLE} WHERE idempotency_key = ?`, [idempotencyKey]);
    notify();
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ${TABLE}`);
    notify();
  },

  subscribe,
};