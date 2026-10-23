import type { APIRoute } from 'astro';
import { getStaffAccess, isSameOriginWrite, privateHeaders } from '../../../lib/auth';
import { getD1 } from '../../../lib/db';
import { feedState, changeFeed } from '../../../lib/studio-feed';
import { studioReady } from './studio';
export const prerender = false;
const json = (data: unknown, status = 200) => Response.json(data, {status,headers:privateHeaders});
const handle: APIRoute = async ({request}) => {
  const access = await getStaffAccess(request);
  if (!access.user) return json({error:'Staff sign-in required.'},401);
  if (request.method === 'POST' && !isSameOriginWrite(request)) return json({error:'Invalid request origin.'},403);
  try {
    await studioReady();
    const current = await feedState(getD1());
    if (request.method === 'GET') return json({enabled:!!current?.token_hash});
    const action = new URL(request.url).searchParams.get('action');
    if (action !== 'rotate' && action !== 'disable') return json({error:'Invalid action.'},400);
    const token = await changeFeed(getD1(),access.user.email,action === 'rotate');
    return json({enabled:!!token,url:token ? `${new URL(request.url).origin}/calendar/${token}.ics` : null});
  } catch { return json({error:'Calendar settings could not be saved. Please try again.'},503); }
};
export const GET = handle;
export const POST = handle;
