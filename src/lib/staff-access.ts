import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface StaffUser { userId: string; email: string; fullName: string | null; }
export interface AccessSettings { issuer: string; audience: string; emails: string[]; }

export function parseAccessSettings(input: { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string; CRM_ADMIN_EMAILS?: string }): AccessSettings | null {
  const host = input.ACCESS_TEAM_DOMAIN?.trim();
  const audience = input.ACCESS_AUD?.trim();
  const emails = input.CRM_ADMIN_EMAILS?.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];
  if (!host || !/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(host) || !audience || !emails.length || emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return null;
  return { issuer: `https://${host}`, audience, emails };
}

const keySets = new Map<string, JWTVerifyGetKey>();

export async function verifyStaffRequest(request: Request, settings: AccessSettings | null, keys?: JWTVerifyGetKey): Promise<StaffUser | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!settings || !token || token.length > 16000) return null;
  try {
    let keySet = keys ?? keySets.get(settings.issuer);
    if (!keySet) {
      keySet = createRemoteJWKSet(new URL(`${settings.issuer}/cdn-cgi/access/certs`));
      keySets.set(settings.issuer, keySet);
    }
    const { payload } = await jwtVerify(token, keySet, {
      issuer: settings.issuer, audience: settings.audience, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
    });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (typeof payload.sub !== 'string' || !payload.sub || !settings.emails.includes(email)) return null;
    return { userId: payload.sub, email, fullName: null };
  } catch {
    return null;
  }
}
