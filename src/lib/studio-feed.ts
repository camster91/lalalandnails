export const feedSchema = `CREATE TABLE IF NOT EXISTS studio_calendar_feed (id INTEGER PRIMARY KEY CHECK(id=1), token_hash TEXT, updated_at INTEGER NOT NULL)`;
export function createFeedToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}
export async function tokenDigest(token: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
}
type FeedEvent = {id: string; version: number; start_at: number; end_at: number; status: string; kind?: string};
const stamp = (n: number) => new Date(n).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
export function createCalendarFeed(events: FeedEvent[]): string {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//La La Land Nail Hub//Studio Calendar//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:La La Land Nail Hub','X-WR-TIMEZONE:America/Toronto','REFRESH-INTERVAL;VALUE=DURATION:PT1H'];
  for (const e of events) {
    // IDs are internal UUIDs. Never interpolate client data, labels or private notes.
    const id = e.id.replace(/[^a-zA-Z0-9-]/g, '');
    lines.push('BEGIN:VEVENT', `UID:${e.kind === 'block' ? 'block-' : ''}${id}@lalalandnails.ca`, `DTSTAMP:${stamp(e.version)}`, `LAST-MODIFIED:${stamp(e.version)}`, `SEQUENCE:${Math.floor(e.version / 1000)}`, `DTSTART:${stamp(e.start_at)}`, `DTEND:${stamp(e.end_at)}`, `SUMMARY:${e.kind === 'block' ? 'Studio unavailable' : 'La La Land Nail Hub appointment'}`, `STATUS:${e.status === 'cancelled' ? 'CANCELLED' : e.status === 'tentative' ? 'TENTATIVE' : 'CONFIRMED'}`, 'TRANSP:OPAQUE','END:VEVENT');
  }
  return [...lines, 'END:VCALENDAR', ''].join('\r\n');
}
export async function feedState(db: D1Database) {
  await db.prepare(feedSchema).run();
  return db.prepare('SELECT token_hash, updated_at FROM studio_calendar_feed WHERE id=1').first<{token_hash: string|null; updated_at: number}>();
}
export async function changeFeed(db: D1Database, actor: string, enabled: boolean) {
  const token = enabled ? createFeedToken() : null;
  const digest = token ? await tokenDigest(token) : null;
  const now = Date.now();
  await db.batch([
    db.prepare('INSERT INTO studio_calendar_feed(id,token_hash,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash,updated_at=excluded.updated_at').bind(digest,now),
    db.prepare('INSERT INTO studio_activity(id,created_at,actor,action,record_id) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),now,actor,enabled?'calendar.feed.rotate':'calendar.feed.disable','calendar-feed'),
  ]);
  return token;
}
