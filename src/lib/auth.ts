import { env } from 'cloudflare:workers';
import { parseAccessSettings, verifyStaffRequest } from './staff-access';

export async function getStaffAccess(request: Request) {
  const settings = parseAccessSettings(env);
  return { configured: Boolean(settings), user: await verifyStaffRequest(request, settings) };
}

export function isSameOriginWrite(request: Request): boolean {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
