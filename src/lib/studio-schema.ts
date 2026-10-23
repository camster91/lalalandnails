// Additive, idempotent tables. Production records are never seeded with demo data.
export const studioSchema = [
  `CREATE TABLE IF NOT EXISTS studio_clients (
 id TEXT PRIMARY KEY, version INTEGER NOT NULL, created_at INTEGER NOT NULL, name TEXT NOT NULL,
 phone TEXT UNIQUE, email TEXT UNIQUE, notes TEXT NOT NULL DEFAULT '', preferences TEXT NOT NULL DEFAULT '',
 sensitivities TEXT NOT NULL DEFAULT '', marketing_consent_at INTEGER, photo_consent_at INTEGER, archived_at INTEGER
)`,
  `CREATE TABLE IF NOT EXISTS studio_services (
 id TEXT PRIMARY KEY, version INTEGER NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', price_cents INTEGER CHECK(price_cents>=0), duration INTEGER CHECK(duration>=5),
 buffer INTEGER NOT NULL DEFAULT 0 CHECK(buffer>=0), active INTEGER NOT NULL DEFAULT 0, archived_at INTEGER,
 CHECK(active=0 OR (price_cents IS NOT NULL AND duration IS NOT NULL))
)`,
  `CREATE TABLE IF NOT EXISTS studio_appointments (
 id TEXT PRIMARY KEY, version INTEGER NOT NULL, client_id TEXT NOT NULL REFERENCES studio_clients(id),
 service_id TEXT NOT NULL REFERENCES studio_services(id), lead_id TEXT UNIQUE,
 start_at INTEGER NOT NULL, end_at INTEGER NOT NULL, blocked_until INTEGER NOT NULL,
 service_name TEXT NOT NULL, price_cents INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','completed','cancelled','no-show')),
 CHECK(end_at>start_at AND blocked_until>=end_at)
)`,
  `CREATE INDEX IF NOT EXISTS studio_appointment_start ON studio_appointments(start_at, status)`,
  `CREATE TABLE IF NOT EXISTS studio_blocks (id TEXT PRIMARY KEY, version INTEGER NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL, label TEXT NOT NULL, archived_at INTEGER, CHECK(end_at>start_at))`,
  `CREATE TABLE IF NOT EXISTS studio_waitlist (id TEXT PRIMARY KEY, version INTEGER NOT NULL, client_id TEXT NOT NULL REFERENCES studio_clients(id), service_id TEXT, notes TEXT NOT NULL DEFAULT '', consent_at INTEGER NOT NULL, archived_at INTEGER)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS studio_waitlist_active_client ON studio_waitlist(client_id) WHERE archived_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS studio_payments (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, appointment_id TEXT NOT NULL REFERENCES studio_appointments(id), amount_cents INTEGER NOT NULL CHECK(amount_cents>0), method TEXT NOT NULL CHECK(method IN ('cash','card','etransfer')), reference TEXT NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS studio_activity (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, record_id TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS studio_photos (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, client_id TEXT NOT NULL REFERENCES studio_clients(id), object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', archived_at INTEGER)`,
  ...["INSERT", "UPDATE"].map(
    (
      event,
    ) => `CREATE TRIGGER IF NOT EXISTS studio_appointment_conflict_${event.toLowerCase()} BEFORE ${event} ON studio_appointments WHEN NEW.status != 'cancelled' BEGIN
 SELECT RAISE(ABORT,'studio_overlap') WHERE EXISTS(SELECT 1 FROM studio_appointments a WHERE a.id!=NEW.id AND a.status!='cancelled' AND a.start_at<NEW.blocked_until AND a.blocked_until>NEW.start_at)
 OR EXISTS(SELECT 1 FROM studio_blocks b WHERE b.archived_at IS NULL AND b.start_at<NEW.blocked_until AND b.end_at>NEW.start_at); END`,
  ),
  ...["INSERT", "UPDATE"].map(
    (
      event,
    ) => `CREATE TRIGGER IF NOT EXISTS studio_block_conflict_${event.toLowerCase()} BEFORE ${event} ON studio_blocks WHEN NEW.archived_at IS NULL BEGIN
 SELECT RAISE(ABORT,'studio_overlap') WHERE EXISTS(SELECT 1 FROM studio_appointments a WHERE a.status!='cancelled' AND a.start_at<NEW.end_at AND a.blocked_until>NEW.start_at)
 OR EXISTS(SELECT 1 FROM studio_blocks b WHERE b.id!=NEW.id AND b.archived_at IS NULL AND b.start_at<NEW.end_at AND b.end_at>NEW.start_at); END`,
  ),
];
export async function initializeStudio(db: D1Database) {
  await db.batch(studioSchema.map((sql) => db.prepare(sql)));
}
