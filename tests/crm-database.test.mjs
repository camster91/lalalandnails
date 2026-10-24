import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
import { initializeDatabase } from '../src/lib/db-schema.ts';
import { listLeads, updateLead } from '../src/lib/crm-store.ts';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  const prepare = (sql, params = []) => ({
    bind: (...args) => prepare(sql, args),
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    raw: async () => { const stmt = sqlite.prepare(sql); stmt.setReturnArrays(true); return stmt.all(...params); },
    run: async () => ({ success: true, meta: sqlite.prepare(sql).run(...params) }),
  });
  const d1 = { prepare, batch: async (statements) => { sqlite.exec('BEGIN'); try { const out = []; for (const stmt of statements) out.push(await stmt.run()); sqlite.exec('COMMIT'); return out; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
  return { sqlite, d1, db: drizzle(d1, { schema }) };
}

test('migration preserves old enquiries, adds nullable CRM fields, and can run twice', async () => {
  const { sqlite, d1 } = database();
  sqlite.exec(`CREATE TABLE booking_requests (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, preferred_date TEXT NOT NULL, preferred_time TEXT NOT NULL, service_slug TEXT NOT NULL DEFAULT 'european-manicure', notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT NOT NULL DEFAULT '', consent_at INTEGER NOT NULL);
  INSERT INTO booking_requests (id,created_at,updated_at,name,preferred_date,preferred_time,consent_at) VALUES ('old',1,1,'Existing enquiry','','',1)`);
  await initializeDatabase(d1);
  await initializeDatabase(d1);
  const row = sqlite.prepare('SELECT * FROM booking_requests').get();
  assert.equal(row.name, 'Existing enquiry');
  for(const column of ['contact_method','follow_up_date','archived_at','lead_source']) assert.equal(row[column], null);
  sqlite.close();
});

test('search, pagination, archive/restore and stale-write checks operate on persisted records', async () => {
  const { sqlite, d1, db } = database();
  await initializeDatabase(d1);
  const rows = Array.from({ length: 28 }, (_, index) => ({ id: String(index), createdAt: index + 1, updatedAt: index + 1, name: index === 0 ? 'A literal % customer' : 'Client ' + index, phone: '416555' + String(index).padStart(4,'0'), preferredDate: '', preferredTime: '', consentAt: 1 }));
  await db.insert(schema.bookingRequests).values(rows);
  const active = { q: '', status: null, view: 'active', page: 1 };
  const first = await listLeads(active, db);
  assert.equal(first.total, 28); assert.equal(first.records.length, 25);
  const second = await listLeads({ ...active, page: 2 }, db);
  assert.equal(second.records.length, 3);
  assert.equal((await listLeads({ ...active, q: '%' }, db)).total, 1);
  const changed = await updateLead('0', { action: 'update', updatedAt: 1, status: 'contacted', adminNote: 'Discuss colour', followUpDate: '2026-01-01' }, db);
  assert.ok(changed);
  assert.equal(await updateLead('0', { action: 'archive', updatedAt: 1 }, db), null);
  assert.equal((await listLeads({ ...active, view: 'due' }, db)).records[0].adminNote, 'Discuss colour');
  const archived = await updateLead('0', { action: 'archive', updatedAt: changed.updatedAt }, db);
  assert.equal((await listLeads(active, db)).total, 27);
  assert.equal((await listLeads({ ...active, view: 'archived' }, db)).total, 1);
  await updateLead('0', { action: 'restore', updatedAt: archived.updatedAt }, db);
  assert.equal((await listLeads(active, db)).total, 28);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM booking_requests').get().n, 28);
  sqlite.close();
});
