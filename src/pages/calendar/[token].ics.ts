import type { APIRoute } from 'astro';
import {studioReady} from '../../lib/studio-db';
import { getD1 } from '../../lib/db';
import { createCalendarFeed, feedState, tokenDigest } from '../../lib/studio-feed';
export const prerender = false;
export const GET: APIRoute = async ({params}) => {
  const headers = {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
  const token = params.token || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response('Not found',{status:404,headers});
  try {
    const db = getD1();
    const state = await feedState(db);
    if (!state?.token_hash || state.token_hash !== await tokenDigest(token)) return new Response('Not found',{status:404,headers});
    await studioReady();
    const result = await db.prepare("SELECT CASE WHEN lead_id IS NULL THEN id ELSE 'request-'||lead_id END id,version,start_at,end_at,status,'appointment' kind FROM studio_appointments UNION ALL SELECT 'request-'||id id,updated_at version,requested_start start_at,requested_end end_at,CASE WHEN status='declined' THEN 'cancelled' ELSE 'tentative' END status,'appointment' kind FROM booking_requests WHERE requested_start IS NOT NULL AND capacity_released=0 UNION ALL SELECT id,version,start_at,end_at,CASE WHEN archived_at IS NULL THEN 'confirmed' ELSE 'cancelled' END status,'block' kind FROM studio_blocks ORDER BY start_at,id").all<{id:string;version:number;start_at:number;end_at:number;status:string;kind:string}>();
    return new Response(createCalendarFeed(result.results),{headers:{...headers,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'inline; filename="lala-land-studio.ics"'}});
  } catch { return new Response('Calendar temporarily unavailable',{status:503,headers}); }
};
