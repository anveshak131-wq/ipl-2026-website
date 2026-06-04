import {
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_COOKIE,
  getEnvString,
  getCookieValue,
  sanitizeReturnTo,
  verifyAdminCsrfToken,
  verifyAdminSession,
} from './_adminAuth.js';

/**
 * Cloudflare Pages Middleware
 *
 * Protects admin surfaces with the app's Google OAuth admin session.
 *
 * Required production environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - ADMIN_SESSION_SECRET
 * - ADMIN_ALLOWED_EMAILS=anveshkoganti54@gmail.com
 */

const PROTECTED_PREFIXES = [
  '/ipl-admin-2026',
  '/wpl-admin-2026',
  '/admin',
  '/api/admin',
] as const;

const PUBLIC_ADMIN_API_GET_PATHS = [
  '/api/admin/google/login',
  '/api/admin/google/callback',
  '/api/admin/logout',
] as const;

const ADMIN_WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE']);

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicAdminApiPath(pathname: string, method: string): boolean {
  return method === 'GET' && PUBLIC_ADMIN_API_GET_PATHS.some((path) => pathname === path);
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function shouldBypassAdminAuthForLocalDev(env: Record<string, unknown>, url: URL): boolean {
  const environment = getEnvString(env, ['ENVIRONMENT', 'NODE_ENV']).toLowerCase();
  const disabled = getEnvString(env, ['ADMIN_AUTH_DISABLED', 'GOOGLE_ADMIN_AUTH_DISABLED']).toLowerCase() === 'true';
  const localBypass = getEnvString(env, ['ADMIN_AUTH_LOCAL_BYPASS', 'GOOGLE_ADMIN_AUTH_LOCAL_BYPASS']);

  if (environment === 'production') {
    return false;
  }

  if (disabled) {
    return true;
  }

  if (isLocalHost(url.hostname) && localBypass.toLowerCase() !== 'false') {
    return true;
  }

  return false;
}

function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/');
}

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('Accept') || request.headers.get('accept') || '';
  return accept.includes('text/html') || accept.includes('*/*');
}

function unauthorizedJson(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function forbiddenJson(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function isAdminWriteRequest(request: Request): boolean {
  return ADMIN_WRITE_METHODS.has(request.method.toUpperCase());
}

function hasAdminSessionCookie(request: Request): boolean {
  return Boolean(getCookieValue(request, ADMIN_SESSION_COOKIE));
}

function redirectToGoogleLogin(request: Request, url: URL): Response {
  const loginUrl = new URL('/api/admin/google/login', url.origin);
  loginUrl.searchParams.set('return_to', sanitizeReturnTo(`${url.pathname}${url.search}${url.hash}`));

  return Response.redirect(loginUrl.toString(), 302);
}

function requestWithAdminHeaders(request: Request, session: any): Request {
  const headers = new Headers(request.headers);

  headers.set('Authorization', `Bearer ${session.token}`);
  headers.set('X-Admin-Email', session.email || '');
  headers.set('X-Admin-Role', session.role || 'admin');
  headers.set('X-Admin-Auth-Provider', 'google');

  return new Request(request, { headers });
}

export const onRequest = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const safeEnv = env || {};

  if (!isProtectedPath(url.pathname)) {
    if (isApiRequest(url) && isAdminWriteRequest(request) && hasAdminSessionCookie(request)) {
      const session = await verifyAdminSession(request, safeEnv);

      if (session && !(await verifyAdminCsrfToken(request, safeEnv, session))) {
        return forbiddenJson(`Missing or invalid ${ADMIN_CSRF_HEADER}`);
      }
    }

    return context.next();
  }

  if (isPublicAdminApiPath(url.pathname, request.method)) {
    return context.next();
  }

  if (shouldBypassAdminAuthForLocalDev(safeEnv, url)) {
    return context.next();
  }

  const session = await verifyAdminSession(request, safeEnv);

  if (!session) {
    if (!isApiRequest(url) && wantsHtml(request)) {
      return redirectToGoogleLogin(request, url);
    }

    return unauthorizedJson('Google admin sign-in required');
  }

  if (isApiRequest(url) && isAdminWriteRequest(request) && !(await verifyAdminCsrfToken(request, safeEnv, session))) {
    return forbiddenJson(`Missing or invalid ${ADMIN_CSRF_HEADER}`);
  }

  if (isApiRequest(url)) {
    const adminRequest = requestWithAdminHeaders(request, session);
    return context.next(adminRequest);
  }

  context.data = {
    ...(context.data || {}),
    adminSession: session,
  };

  return context.next();
};
