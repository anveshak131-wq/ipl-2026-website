const ADMIN_SESSION_COOKIE = 'sportsup_admin_session';
const OAUTH_STATE_COOKIE = 'sportsup_admin_oauth_state';
const ADMIN_CSRF_HEADER = 'X-CSRF-Token';
const ADMIN_SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const DEFAULT_ADMIN_EMAIL = 'anveshkoganti54@gmail.com';
const DEFAULT_PLAYERS_ADMIN_EMAIL = 'sumanthvallam20@gmail.com';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);
const ADMIN_ROLES = new Set(['super_admin', 'admin', 'players_admin']);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export {
  ADMIN_SESSION_COOKIE,
  OAUTH_STATE_COOKIE,
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  OAUTH_STATE_MAX_AGE_SECONDS,
};

export function getEnvString(env, keys) {
  for (const key of keys) {
    const value = env?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function isProductionEnvironment(env) {
  return getEnvString(env, ['ENVIRONMENT', 'NODE_ENV']).toLowerCase() === 'production';
}

export function isEnvFlagEnabled(env, keys) {
  return TRUE_ENV_VALUES.has(getEnvString(env, keys).toLowerCase());
}

export function isLegacyAdminLoginAllowed(env) {
  if (!isProductionEnvironment(env)) return true;

  return isEnvFlagEnabled(env, [
    'ADMIN_LEGACY_LOGIN_ENABLED',
    'ADMIN_PASSWORD_LOGIN_ENABLED',
    'ADMIN_LEGACY_AUTH_ENABLED',
  ]);
}

export function isLegacyAdminSetupAllowed(env) {
  if (!isProductionEnvironment(env)) return true;

  return isEnvFlagEnabled(env, [
    'ADMIN_LEGACY_SETUP_ENABLED',
    'ADMIN_SETUP_ENABLED',
    'ADMIN_LEGACY_AUTH_ENABLED',
  ]);
}

export function getAllowedAdminEmails(env) {
  const raw = getEnvString(env, ['ADMIN_ALLOWED_EMAILS', 'GOOGLE_ADMIN_ALLOWED_EMAILS']) || DEFAULT_ADMIN_EMAIL;
  const emails = new Set(parseEmailList(raw));

  for (const email of getPlayersAdminEmails(env)) {
    emails.add(email);
  }

  return emails;
}

export function isAllowedAdminEmail(env, email) {
  if (!email) return false;
  return getAllowedAdminEmails(env).has(String(email).toLowerCase());
}

function parseEmailList(raw) {
  return String(raw || '')
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getPlayersAdminEmails(env) {
  const raw =
    getEnvString(env, [
      'ADMIN_PLAYERS_ADMIN_EMAILS',
      'GOOGLE_PLAYERS_ADMIN_EMAILS',
      'PLAYERS_ADMIN_EMAILS',
    ]) || DEFAULT_PLAYERS_ADMIN_EMAIL;

  return new Set(parseEmailList(raw));
}

export function isPlayersAdminEmail(env, email) {
  if (!email) return false;
  return getPlayersAdminEmails(env).has(String(email).toLowerCase());
}

export function getSessionSecret(env) {
  return getEnvString(env, ['ADMIN_SESSION_SECRET', 'GOOGLE_ADMIN_SESSION_SECRET']);
}

export function getGoogleOAuthConfig(env) {
  return {
    clientId: getEnvString(env, ['GOOGLE_CLIENT_ID', 'GOOGLE_ADMIN_CLIENT_ID']),
    clientSecret: getEnvString(env, ['GOOGLE_CLIENT_SECRET', 'GOOGLE_ADMIN_CLIENT_SECRET']),
    sessionSecret: getSessionSecret(env),
  };
}

export function getAdminRole(env) {
  const configured = getEnvString(env, ['ADMIN_DEFAULT_ROLE', 'GOOGLE_ADMIN_ROLE']);
  return ADMIN_ROLES.has(configured) ? configured : 'super_admin';
}

export function getAdminRoleForEmail(env, email, existingRole) {
  if (isPlayersAdminEmail(env, email)) {
    return 'players_admin';
  }

  return ADMIN_ROLES.has(existingRole) ? existingRole : getAdminRole(env);
}

export function getCookieValue(request, name) {
  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (rawName === name) {
      return rawValue.join('=');
    }
  }

  return '';
}

function base64UrlEncodeBytes(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function base64UrlEncode(input) {
  if (typeof input === 'string') {
    return base64UrlEncodeBytes(encoder.encode(input));
  }

  return base64UrlEncodeBytes(new Uint8Array(input));
}

export function base64UrlDecode(value) {
  const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeJsonPart(value) {
  return JSON.parse(decoder.decode(base64UrlDecode(value)));
}

async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  return crypto.subtle.sign('HMAC', key, encoder.encode(message));
}

function fixedTimeEqual(left, right) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

export async function signJson(payload, secret) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(secret, encodedPayload);
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

export async function verifySignedJson(value, secret) {
  if (!value || !secret) return null;

  const [encodedPayload, encodedSignature] = String(value).split('.');
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = new Uint8Array(await hmacSha256(secret, encodedPayload));
  const actualSignature = base64UrlDecode(encodedSignature);

  if (!fixedTimeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  return decodeJsonPart(encodedPayload);
}

export function buildCookie(name, value, options = {}) {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path || '/'}`,
    `SameSite=${options.sameSite || 'Lax'}`,
  ];

  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);

  return parts.join('; ');
}

export function clearCookie(name, path = '/') {
  return buildCookie(name, '', {
    path,
    maxAge: 0,
    sameSite: 'Lax',
  });
}

export function getRequestOrigin(request) {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(request, env) {
  return (
    getEnvString(env, ['GOOGLE_REDIRECT_URI', 'GOOGLE_ADMIN_REDIRECT_URI']) ||
    `${getRequestOrigin(request)}/api/admin/google/callback`
  );
}

export function sanitizeReturnTo(value, fallback = '/ipl-admin-2026/dashboard') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    const parsed = new URL(value, 'https://admin.local');
    const returnTo = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const allowedPrefixes = ['/ipl-admin-2026', '/wpl-admin-2026', '/admin'];

    if (allowedPrefixes.some((prefix) => returnTo === prefix || returnTo.startsWith(`${prefix}/`))) {
      return returnTo;
    }
  } catch {
    // Fall through to the safe fallback.
  }

  return fallback;
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function createOAuthState(request, env, returnTo) {
  const secret = getSessionSecret(env);
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is required');
  }

  const now = Math.floor(Date.now() / 1000);
  const state = {
    nonce: randomToken(24),
    returnTo: sanitizeReturnTo(returnTo),
    iat: now,
    exp: now + OAUTH_STATE_MAX_AGE_SECONDS,
  };

  const signedState = await signJson(state, secret);

  return {
    signedState,
    cookie: buildCookie(OAUTH_STATE_COOKIE, signedState, {
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
      sameSite: 'Lax',
    }),
  };
}

export async function verifyOAuthState(request, env, stateFromQuery) {
  const secret = getSessionSecret(env);
  const stateFromCookie = getCookieValue(request, OAUTH_STATE_COOKIE);

  if (!secret || !stateFromCookie || !stateFromQuery || stateFromCookie !== stateFromQuery) {
    return null;
  }

  const state = await verifySignedJson(stateFromQuery, secret);
  const now = Math.floor(Date.now() / 1000);

  if (!state || typeof state.exp !== 'number' || state.exp <= now) {
    return null;
  }

  return state;
}

export async function createAdminSessionCookie(env, sessionInput) {
  const secret = getSessionSecret(env);
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is required');
  }

  const now = Math.floor(Date.now() / 1000);
  const session = {
    provider: 'google',
    email: String(sessionInput.email || '').toLowerCase(),
    name: sessionInput.name || '',
    picture: sessionInput.picture || '',
    role: getAdminRoleForEmail(env, sessionInput.email, sessionInput.role),
    token: sessionInput.token,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
  };

  const signedSession = await signJson(session, secret);

  return {
    session,
    cookie: buildCookie(ADMIN_SESSION_COOKIE, signedSession, {
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      sameSite: 'Lax',
    }),
  };
}

export async function verifyAdminSession(request, env) {
  const secret = getSessionSecret(env);
  if (!secret) return null;

  const signedSession = getCookieValue(request, ADMIN_SESSION_COOKIE);
  const session = await verifySignedJson(signedSession, secret);
  const now = Math.floor(Date.now() / 1000);

  if (!session || typeof session.exp !== 'number' || session.exp <= now) {
    return null;
  }

  if (!session.email || !session.token || !isAllowedAdminEmail(env, session.email)) {
    return null;
  }

  return {
    ...session,
    role: getAdminRoleForEmail(env, session.email, session.role),
  };
}

export async function createAdminCsrfToken(env, session) {
  const secret = getSessionSecret(env);
  const email = String(session?.email || '').toLowerCase();
  const token = String(session?.token || '');
  const issuedAt = String(session?.iat || '');

  if (!secret || !email || !token) return '';

  const signature = await hmacSha256(secret, `admin-csrf:${email}:${token}:${issuedAt}`);
  return base64UrlEncode(signature);
}

export async function verifyAdminCsrfToken(request, env, session) {
  const providedToken = request.headers.get(ADMIN_CSRF_HEADER) || request.headers.get('x-csrf-token') || '';
  const expectedToken = await createAdminCsrfToken(env, session);

  if (!providedToken || !expectedToken) {
    return false;
  }

  return fixedTimeEqual(encoder.encode(providedToken), encoder.encode(expectedToken));
}

export async function exchangeGoogleCodeForTokens(request, env, code) {
  const { clientId, clientSecret } = getGoogleOAuthConfig(env);

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('code', code);
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', getGoogleRedirectUri(request, env));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error_description || body.error || 'Google token exchange failed');
  }

  return body;
}

export async function verifyGoogleIdToken(idToken, env) {
  const { clientId } = getGoogleOAuthConfig(env);
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is required');
  }

  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Google ID token is malformed');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart(encodedHeader);
  const payload = decodeJsonPart(encodedPayload);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Google ID token uses an unexpected signing key');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new Error('Google ID token is expired');
  }

  if (payload.aud !== clientId) {
    throw new Error('Google ID token audience does not match this app');
  }

  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error('Google ID token issuer is invalid');
  }

  const jwksResponse = await fetch(GOOGLE_JWKS_URL);
  if (!jwksResponse.ok) {
    throw new Error('Unable to fetch Google signing keys');
  }

  const jwks = await jwksResponse.json();
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error('Google signing key was not found');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signatureValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(encodedSignature),
    encoder.encode(`${encodedHeader}.${encodedPayload}`),
  );

  if (!signatureValid) {
    throw new Error('Google ID token signature is invalid');
  }

  if (!payload.email || payload.email_verified !== true) {
    throw new Error('Google account email is not verified');
  }

  if (!isAllowedAdminEmail(env, payload.email)) {
    throw new Error('This Google account is not allowed to access admin');
  }

  return payload;
}

export async function upsertGoogleAdminUser(env, googleUser) {
  if (!env?.SPORTS_KV) {
    throw new Error('SPORTS_KV is required for admin sessions');
  }

  const email = String(googleUser.email || '').toLowerCase();
  const nowIso = new Date().toISOString();
  const token = randomToken(32);
  const existingRaw = await env.SPORTS_KV.get(`user:${email}`);
  let existingUser = {};

  if (existingRaw) {
    try {
      existingUser = JSON.parse(existingRaw);
    } catch {
      existingUser = {};
    }
  }

  if (existingUser.isBlocked) {
    throw new Error('This admin account is blocked');
  }

  const role = getAdminRoleForEmail(env, email, existingUser.role);

  const user = {
    ...existingUser,
    id: existingUser.id || crypto.randomUUID(),
    username: email,
    email,
    name: googleUser.name || existingUser.name || email,
    picture: googleUser.picture || existingUser.picture || '',
    role,
    token,
    authProvider: 'google',
    emailVerified: true,
    lastLogin: nowIso,
    updatedAt: nowIso,
    createdAt: existingUser.createdAt || nowIso,
    isBlocked: false,
  };

  await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
    expirationTtl: 365 * 24 * 60 * 60,
  });

  await env.SPORTS_KV.put(
    `token:${token}`,
    JSON.stringify({
      userId: user.id,
      email,
      role,
      createdAt: nowIso,
      provider: 'google',
    }),
    { expirationTtl: ADMIN_SESSION_MAX_AGE_SECONDS },
  );

  return {
    email,
    name: user.name,
    picture: user.picture,
    role,
    token,
  };
}

export async function revokeAdminSessionToken(env, token) {
  if (env?.SPORTS_KV && token) {
    await env.SPORTS_KV.delete(`token:${token}`);
  }
}

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function htmlError(message, status = 400, headers = {}) {
  const safeMessage = String(message || 'Authentication failed')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Admin sign in failed</title><body style="font-family:system-ui;padding:32px"><h1>Admin sign in failed</h1><p>${safeMessage}</p><p><a href="/api/admin/google/login">Try again</a></p></body>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        ...headers,
      },
    },
  );
}
