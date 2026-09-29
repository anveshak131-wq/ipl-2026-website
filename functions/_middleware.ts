import {
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_COOKIE,
  getEnvString,
  getCookieValue,
  isLegacyAdminLoginAllowed,
  isLegacyAdminSetupAllowed,
  sanitizeReturnTo,
  verifyAdminCsrfToken,
  verifyAdminSession,
} from './_adminAuth.js';

/**
 * Cloudflare Pages Middleware
 *
 * Protects unified admin surfaces under `/ops` with Google OAuth admin session.
 *
 * Required production environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - ADMIN_SESSION_SECRET
 * - ADMIN_ALLOWED_EMAILS=anveshkoganti54@gmail.com
 * - ADMIN_PLAYERS_ADMIN_EMAILS=anvesh.ak.131@gmail.com
 */

// Legacy/predictable URLs to immediately reject with 404
const LEGACY_SCAN_PROBES = [
  '/ipl-admin-2026',
  '/wpl-admin-2026',
  '/admin',
  '/admin-2026',
] as const;

// New protected route boundaries
const PROTECTED_PREFIXES = [
  '/ops',
  '/api/admin',
] as const;

const PUBLIC_ADMIN_API_GET_PATHS = [
  '/api/admin/google/login',
  '/api/admin/google/callback',
  '/api/admin/logout',
] as const;

const ADMIN_WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE']);

// Updated players admin restrictions under /ops
const PLAYERS_ADMIN_ALLOWED_PAGE_PATHS = new Set([
  '/ops/ipl/players',
  '/ops/ipl/batting-stats',
  '/ops/ipl/bowling-stats',
]);

const PLAYERS_ADMIN_ALLOWED_API_PATHS = new Set([
  '/api/admin/session',
  '/api/admin/logout',
]);

function isLegacyProbe(pathname: string): boolean {
  return LEGACY_SCAN_PROBES.some((probe) => pathname === probe || pathname.startsWith(`${probe}/`));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicAdminApiPath(pathname: string, method: string): boolean {
  return method === 'GET' && PUBLIC_ADMIN_API_GET_PATHS.some((path) => pathname === path);
}

function isLegacyAdminApiPostPath(pathname: string, method: string): boolean {
  return method === 'POST' && (pathname === '/api/admin/login' || pathname === '/api/admin/setup');
}

function isAllowedLegacyAdminApiPath(pathname: string, env: Record<string, unknown>): boolean {
  if (pathname === '/api/admin/login') {
    return isLegacyAdminLoginAllowed(env);
  }

  if (pathname === '/api/admin/setup') {
    return isLegacyAdminSetupAllowed(env);
  }

  return false;
}

function legacyAdminApiDisabledMessage(pathname: string): string {
  if (pathname === '/api/admin/login') {
    return 'Legacy admin password login is disabled in production. Use Google admin sign-in.';
  }

  return 'Legacy admin setup is disabled in production. Enable it explicitly only for a controlled setup window.';
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

function notFoundResponse(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
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

function isPlayersAdminSession(session: any): boolean {
  return session?.role === 'players_admin';
}

function isAllowedPlayersAdminPath(pathname: string): boolean {
  return PLAYERS_ADMIN_ALLOWED_PAGE_PATHS.has(pathname);
}

function isAllowedPlayersAdminApiPath(pathname: string): boolean {
  return PLAYERS_ADMIN_ALLOWED_API_PATHS.has(pathname);
}

function redirectPlayersAdminToAllowedPage(url: URL): Response {
  const allowedUrl = new URL('/ops/ipl/players', url.origin);
  return Response.redirect(allowedUrl.toString(), 302);
}

export const onRequest = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const safeEnv = env || {};

  // 1. Immediately drop and 404 any scanner targeting old known admin paths
  if (isLegacyProbe(url.pathname)) {
    return notFoundResponse();
  }

  // 2. Allow non-protected paths (homepage, live scores, teams, matches)
  if (!isProtectedPath(url.pathname)) {
    const hasBearerAuth = Boolean(request.headers.get("authorization")?.startsWith("Bearer "));
    if (isApiRequest(url) && isAdminWriteRequest(request) && hasAdminSessionCookie(request) && !hasBearerAuth) {
      const session = await verifyAdminSession(request, safeEnv);

      if (session && !(await verifyAdminCsrfToken(request, safeEnv, session))) {
        return forbiddenJson(`Missing or invalid ${ADMIN_CSRF_HEADER}`);
      }
    }

    return context.next();
  }

  // 3. Allow public authentication endpoints
  if (isPublicAdminApiPath(url.pathname, request.method)) {
    return context.next();
  }

  // 4. Handle legacy admin APIs
  if (isLegacyAdminApiPostPath(url.pathname, request.method)) {
    if (isAllowedLegacyAdminApiPath(url.pathname, safeEnv)) {
      return context.next();
    }

    return forbiddenJson(legacyAdminApiDisabledMessage(url.pathname));
  }

  // 5. Check local dev bypass
  if (shouldBypassAdminAuthForLocalDev(safeEnv, url)) {
    return context.next();
  }

  // 6. Verify Google Admin Session
  const session = await verifyAdminSession(request, safeEnv);

  if (!session) {
    if (!isApiRequest(url) && wantsHtml(request)) {
      return redirectToGoogleLogin(request, url);
    }

    return unauthorizedJson('Google admin sign-in required');
  }

  // 7. Enforce CSRF token on write operations
  if (isApiRequest(url) && isAdminWriteRequest(request) && !(await verifyAdminCsrfToken(request, safeEnv, session))) {
    return forbiddenJson(`Missing or invalid ${ADMIN_CSRF_HEADER}`);
  }

  // 8. Enforce Players Admin role boundaries
  if (isPlayersAdminSession(session)) {
    if (isApiRequest(url)) {
      if (!isAllowedPlayersAdminApiPath(url.pathname)) {
        return forbiddenJson('This admin account can only access IPL Players, Batting Stats, and Bowling Stats.');
      }
    } else if (!isAllowedPlayersAdminPath(url.pathname)) {
      if (wantsHtml(request)) {
        return redirectPlayersAdminToAllowedPage(url);
      }

      return forbiddenJson('This admin account can only access IPL Players, Batting Stats, and Bowling Stats.');
    }
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
