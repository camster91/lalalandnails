import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { bookingRequests } from '../../../../../db/schema';
import { getAdminUser, isSameOriginWrite } from '../../../../lib/auth';
import { ensureDatabase, getDb } from '../../../../lib/db';

const STATUSES = new Set(['pending', 'contacted', 'confirmed', 'declined', 'completed']);

export const POST: APIRoute = async ({ request, params }) => {
  if (!getAdminUser(request)) return new Response('Unauthorized', { status: 401 });
  if (!isSameOriginWrite(request)) return new Response('Invalid request origin', { status: 403 });

  const id = params.id ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Invalid booking ID', { status: 400 });

  const form = await request.formData();
  const action = String(form.get('action') ?? 'update');
  await ensureDatabase();
  const db = getDb();

  if (action === 'delete') {
    await db.delete(bookingRequests).where(eq(bookingRequests.id, id));
    return redirect('/admin');
  }

  const status = String(form.get('status') ?? '');
  if (!STATUSES.has(status)) return new Response('Invalid booking status', { status: 400 });
  const adminNote = String(form.get('adminNote') ?? '').trim().slice(0, 500);

  await db.update(bookingRequests)
    .set({ status, adminNote, updatedAt: Date.now() })
    .where(eq(bookingRequests.id, id));

  return redirect(`/admin?status=${encodeURIComponent(status)}`);
};

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}
