export async function initializeDatabase(d1: D1Database): Promise<void> {

  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS booking_requests (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      contact_method TEXT,
      follow_up_date TEXT,
      archived_at INTEGER,
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
    d1.prepare(`CREATE TABLE IF NOT EXISTS booking_request_details (
      request_id TEXT PRIMARY KEY NOT NULL REFERENCES booking_requests(id),
      selection_json TEXT NOT NULL,
      inspiration_links_json TEXT NOT NULL DEFAULT '[]'
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS booking_inspiration (
      id TEXT PRIMARY KEY NOT NULL,
      request_id TEXT NOT NULL REFERENCES booking_requests(id),
      mime TEXT NOT NULL CHECK(mime IN ('image/jpeg','image/png')),
      image BLOB NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    d1.prepare('CREATE INDEX IF NOT EXISTS booking_inspiration_request ON booking_inspiration(request_id)'),
    d1.prepare(`CREATE TABLE IF NOT EXISTS chat_rate_limits (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL
    )`),
    d1.prepare(`CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_expires
      ON chat_rate_limits(expires_at)`),
  ]);

  // Additive migration: preserve all existing enquiry records.
  for (const [name, type] of [['contact_method', 'TEXT'], ['follow_up_date', 'TEXT'], ['archived_at', 'INTEGER'], ['lead_source', 'TEXT'], ['requested_start','INTEGER'], ['requested_end','INTEGER'], ['requested_day_start','INTEGER'], ['requested_day_end','INTEGER'], ['capacity_released','INTEGER NOT NULL DEFAULT 0']]) {
    const columns = await d1.prepare('PRAGMA table_info(booking_requests)').all<{ name: string }>();
    if (columns.results.some((column) => column.name === name)) continue;
    try {
      await d1.prepare(`ALTER TABLE booking_requests ADD COLUMN ${name} ${type}`).run();
    } catch (error) {
      const current = await d1.prepare('PRAGMA table_info(booking_requests)').all<{ name: string }>();
      if (!current.results.some((column) => column.name === name)) throw error;
    }
  }
  await d1.prepare('CREATE INDEX IF NOT EXISTS idx_booking_follow_up ON booking_requests(archived_at, follow_up_date)').run();
}
