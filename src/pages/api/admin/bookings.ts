import type { APIRoute } from 'astro';
import { getStaffAccess, privateHeaders } from '../../../lib/auth';
import { parseLeadFilters } from '../../../lib/crm';
import { ensureDatabase, getDb } from '../../../lib/db';
import { listLeads } from '../../../lib/crm-store';

export const GET: APIRoute = async ({ request, url }) => {
  const access = await getStaffAccess(request);
  if (!access.configured || !access.user) return Response.json({ error: access.configured ? 'Unauthorized' : 'Staff access setup required' }, { status: access.configured ? 401 : 503, headers: privateHeaders });
  const filters = parseLeadFilters(url);
  if (!filters) return Response.json({ error: 'Invalid filters' }, { status: 400, headers: privateHeaders });
  try {
    await ensureDatabase();
    return Response.json(await listLeads(filters, getDb()), { headers: privateHeaders });
  } catch {
    return Response.json({ error: 'The CRM is temporarily unavailable.' }, { status: 503, headers: privateHeaders });
  }
};
