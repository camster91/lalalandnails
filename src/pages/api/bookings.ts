import type { APIRoute } from 'astro';
import { bookingRequests } from '../../../db/schema';
import { ensureDatabase, getD1, getDb } from '../../lib/db';

const TIME_PREFERENCES = new Set(['morning', 'afternoon', 'evening', 'flexible']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const input = contentType.includes('application/json')
      ? await request.json() as Record<string, unknown>
      : Object.fromEntries(await request.formData());

    if (String(input.website ?? '').trim()) return json({ ok: true }, 202);

    const name = clean(input.name, 80);
    const email = clean(input.email, 120).toLowerCase();
    const phone = clean(input.phone, 40);
    const preferredDate = clean(input.preferredDate, 10);
    const preferredTime = clean(input.preferredTime, 20);
    const notes = clean(input.notes, 600);
    const consent = input.consent === true || input.consent === 'on' || input.consent === 'true';

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Please enter your name.';
    if (!email && !phone) errors.contact = 'Please provide an email address or phone number.';
    if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Please enter a valid email address.';
    if (!isValidPreferredDate(preferredDate)) errors.preferredDate = 'Choose a date within the next year.';
    if (!TIME_PREFERENCES.has(preferredTime)) errors.preferredTime = 'Choose a time preference.';
    if (!consent) errors.consent = 'Consent is required so La La Land can respond.';

    if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400);

    await ensureDatabase();
    const duplicate = await getD1().prepare(`SELECT id FROM booking_requests
      WHERE created_at > ? AND ((email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?))
      LIMIT 1`).bind(Date.now() - 10 * 60 * 1000, email || '__none__', phone || '__none__').first();

    if (duplicate) {
      return json({ ok: false, message: 'A recent request already uses those contact details. Please wait before trying again.' }, 429);
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    await getDb().insert(bookingRequests).values({
      id,
      createdAt: now,
      updatedAt: now,
      name,
      email: email || null,
      phone: phone || null,
      preferredDate,
      preferredTime,
      notes,
      serviceSlug: 'european-manicure',
      status: 'pending',
      adminNote: '',
      consentAt: now,
    });

    return json({
      ok: true,
      id,
      message: 'Your request has been received. This is not a confirmed appointment; La La Land will contact you using the details provided.',
    }, 201);
  } catch (error) {
    console.error('booking_request_failed', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, message: 'The request could not be sent. Please try again shortly.' }, 500);
  }
};

function clean(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function isValidPreferredDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const candidate = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(candidate.getTime())) return false;
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const end = start + 366 * 24 * 60 * 60 * 1000;
  return candidate.getTime() >= start && candidate.getTime() <= end;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
