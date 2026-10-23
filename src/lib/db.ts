import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { initializeDatabase } from './db-schema';

let schemaReady: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) throw new Error('The booking database is unavailable.');
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export function ensureDatabase(): Promise<void> {
  schemaReady ??= initializeDatabase(getD1()).catch((error) => { schemaReady = null; throw error; });
  return schemaReady;
}
