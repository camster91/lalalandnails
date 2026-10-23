export interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName: string | null;
}

const ADMIN_USER_IDS = new Set([
  '13b3ce1c-2ea9-47f2-bb97-25d24cb2ab77',
]);

if (import.meta.env.DEV) ADMIN_USER_IDS.add('local_seedy');

export function getAuthenticatedUser(request: Request): AuthenticatedUser | null {
  const userId = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  if (!userId || !email) return null;

  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const encoding = request.headers.get('oai-authenticated-user-full-name-encoding');
  let fullName: string | null = null;

  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try {
      fullName = decodeURIComponent(encodedName);
    } catch {
      fullName = null;
    }
  }

  return { userId, email, fullName };
}

export function getAdminUser(request: Request): AuthenticatedUser | null {
  const user = getAuthenticatedUser(request);
  return user && ADMIN_USER_IDS.has(user.userId) ? user : null;
}

export function adminSignInPath(returnTo = '/admin'): string {
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/admin';
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function isSameOriginWrite(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}
