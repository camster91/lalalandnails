import type { APIRoute } from 'astro';
import { getStaffAccess, isSameOriginWrite, privateHeaders } from '../../../../lib/auth';
import { parseLeadUpdate } from '../../../../lib/crm';
import { ensureDatabase, getDb } from '../../../../lib/db';
import { updateLead } from '../../../../lib/crm-store';

const update: APIRoute = async ({ request, params }) => {
  const access = await getStaffAccess(request);
  const json = (body: unknown, status: number) => Response.json(body, { status, headers: privateHeaders });
  if (!access.configured || !access.user) return json({ error: access.configured ? 'Unauthorized' : 'Staff access setup required' }, access.configured ? 401 : 503);
  if (!isSameOriginWrite(request)) return json({ error: 'Invalid request origin' }, 403);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id ?? '')) return json({ error: 'Invalid enquiry ID' }, 400);
  try {
    const isJson = request.headers.get('content-type')?.includes('application/json');
    const raw = isJson ? await request.json() : Object.fromEntries(await request.formData());
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return json({ error: 'Invalid update' }, 400);
    const input = parseLeadUpdate(raw as Record<string, unknown>);
    if (!input) return json({ error: 'Invalid update. Check the status, date, note length and record version.' }, 400);
    await ensureDatabase();
    const changed = await updateLead(params.id!, input, getDb());
    if (!changed) return json({ error: 'This enquiry changed or no longer exists. Refresh the inbox before saving again.' }, 409);
    if (isJson) return json({ ok: true, ...changed }, 200);
    return new Response(null, { status: 303, headers: { ...privateHeaders, Location: input.action === 'archive' ? '/admin?view=archived&saved=1' : '/admin?saved=1' } });
  } catch (error) {
    return json({ error: error instanceof SyntaxError || error instanceof TypeError ? 'Invalid request body' : 'The update could not be saved. Please retry.' }, error instanceof SyntaxError || error instanceof TypeError ? 400 : 503);
  }
};

export const POST = update;
export const PATCH = update;
