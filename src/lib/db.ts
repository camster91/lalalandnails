import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';

let schemaReady: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) throw new Error('The booking database is unavailable.');
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export function ensureDatabase(): Promise<void> {
  schemaReady ??= initializeDatabase();
  return schemaReady;
}

async function initializeDatabase(): Promise<void> {
  const d1 = getD1();

  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS booking_requests (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      service_slug TEXT NOT NULL DEFAULT 'european-manicure',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'declined', 'completed')),
      admin_note TEXT NOT NULL DEFAULT '',
      consent_at INTEGER NOT NULL
    )`),
    d1.prepare(`CREATE INDEX IF NOT EXISTS idx_booking_requests_status_created
      ON booking_requests(status, created_at)`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS chat_rate_limits (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL
    )`),
    d1.prepare(`CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_expires
      ON chat_rate_limits(expires_at)`),
  ]);
}
