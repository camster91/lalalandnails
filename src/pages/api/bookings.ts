import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bookingRequests } from '../../../db/schema';
import { ensureDatabase, getD1, getDb } from '../../lib/db';

const CONTACT_METHODS = new Set(['call', 'text']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const input = contentType.includes('application/json')
      ? await request.json() as Record<string, unknown>
      : Object.fromEntries(await request.formData());

    if (String(input.website ?? '').trim()) return json({ ok: true }, 202);

    const name = clean(input.name, 80);
    const phone = clean(input.phone, 40);
    const contactMethod = clean(input.contactMethod, 10);
    const notes = clean(input.notes, 600);
    const consent = input.consent === true || input.consent === 'on' || input.consent === 'true';

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Please enter your name.';
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) errors.phone = 'Please enter a valid phone number.';
    if (!CONTACT_METHODS.has(contactMethod)) errors.contactMethod = 'Choose a call or text back.';
    if (!consent) errors.consent = 'Consent is required so La La Land can respond.';

    if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400);

    await ensureDatabase();
    const duplicate = await getD1().prepare(`SELECT id FROM booking_requests
      WHERE created_at > ? AND ((email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?))
      LIMIT 1`).bind(Date.now() - 10 * 60 * 1000, '__none__', phone).first();

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
      email: null,
      phone: phone || null,
      contactMethod,
      preferredDate: '',
      preferredTime: '',
      notes,
      serviceSlug: 'european-manicure',
      status: 'pending',
      adminNote: '',
      consentAt: now,
    });

    // Save the request first so an email outage cannot lose a client's enquiry.
    try {
      if (!env.BOOKING_EMAIL) throw new Error('Email binding unavailable');
      await env.BOOKING_EMAIL.send({
        from: { email: 'requests@lalalandnails.ca', name: 'La La Land Nail Hub' },
        to: 'bianca@ashbi.ca',
        subject: `New La La Land ${contactMethod === 'text' ? 'text' : 'call'}-back request`,
        text: [
          'A client has requested a European manicure appointment.',
          '',
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Reply by: ${contactMethod === 'text' ? 'Text message' : 'Phone call'}`,
          `Message: ${notes || 'No message provided.'}`,
          '',
          `Request ID: ${id}`,
          'Please contact the client to discuss availability and confirm the details.',
        ].join('\n'),
      });
    } catch {
      console.error('booking_email_failed', { requestId: id });
    }

    return json({
      ok: true,
      id,
      message: `Thanks! Bianca will ${contactMethod === 'text' ? 'text' : 'call'} you to discuss your appointment. Your appointment is confirmed after you agree on the details.`,
    }, 201);
  } catch (error) {
    console.error('booking_request_failed', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, message: 'The request could not be sent. Please try again shortly.' }, 500);
  }
};

function clean(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
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
