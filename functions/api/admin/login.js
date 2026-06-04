/**
 * Cloudflare Pages Function for /api/admin/login
 * Handles admin authentication
 */

import crypto from 'node:crypto';
import { isLegacyAdminLoginAllowed } from '../../_adminAuth.js';

// --- Optional TOTP-based 2FA helpers ---
// Uses an environment-provided Base32 secret (ADMIN_TOTP_SECRET_BASE32)
// and Web Crypto (globalThis.crypto.subtle) to verify a 6-digit TOTP.

// Simple Base32 decoder for RFC 4648 alphabet (A-Z2-7)
function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const c of clean) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function generateTotpCode(secretBase32, timeStep = 30, digits = 6) {
  const webCrypto = globalThis.crypto;
  const keyBytes = base32ToBytes(secretBase32);
  if (!keyBytes.length) return null;

  const epochSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epochSeconds / timeStep);

  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // high 4 bytes remain 0, set low 4 bytes
  view.setUint32(4, counter, false);
  const counterBytes = new Uint8Array(buf);

  const cryptoKey = await webCrypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmac = new Uint8Array(
    await webCrypto.subtle.sign('HMAC', cryptoKey, counterBytes)
  );

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    (hmac[offset + 3]);

  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, '0');
}

async function verifyTotpCode(secretBase32, code, window = 1) {
  if (!secretBase32) return true; // 2FA disabled if no secret configured
  const cleaned = String(code || '').replace(/\s+/g, '');
  if (!cleaned) return false;

  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const baseCounter = Math.floor(epochSeconds / timeStep);

  for (let offset = -window; offset <= window; offset++) {
    const testTime = (baseCounter + offset) * timeStep * 1000;
    const simulatedNow = Date.now;
    // Temporarily override Date.now for generateTotpCode
    try {
      Date.now = () => testTime;
      const expected = await generateTotpCode(secretBase32, timeStep);
      if (expected === cleaned) {
        return true;
      }
    } finally {
      Date.now = simulatedNow;
    }
  }

  return false;
}

// Allowlist for admins who should only access players page
const PLAYERS_ONLY_ADMINS = new Set([
  'sumanthvallam20@gmail.com'
]);

// Password verification for KV users
const verifyPassword = (password, salt, hashedPassword) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex') === hashedPassword;
};

// Simple token generation (in production, use proper JWT)
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  // In production, use proper JWT signing
  return btoa(JSON.stringify(payload));
}

export const onRequest = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (!isLegacyAdminLoginAllowed(env || {})) {
    return new Response(
      JSON.stringify({
        error: 'Legacy admin password login is disabled in production. Use Google admin sign-in.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      }
    );
  }

  // Handle POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { username, password, totp } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const totpSecret = env && env.ADMIN_TOTP_SECRET_BASE32;

    // Check KV database (for email/password login from /admin/setup)
    if (env && env.SPORTS_KV) {
      // Treat username as email for KV lookup
      const userData = await env.SPORTS_KV.get(`user:${username}`);
      if (userData) {
        const user = JSON.parse(userData);
        
        // Only allow admin role users
        if ((user.role === 'admin' || user.role === 'super_admin' || user.role === 'players_admin') && verifyPassword(password, user.salt, user.hashedPassword)) {
          // If TOTP is configured, require a valid 6-digit code
          if (totpSecret) {
            const ok2fa = await verifyTotpCode(totpSecret, totp);
            if (!ok2fa) {
              return new Response(
                JSON.stringify({ error: 'Invalid 2FA code' }),
                {
                  status: 401,
                  headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                  },
                }
              );
            }
          }

          // Ensure there is a valid token mapping in KV for this admin.
          // If the existing token has expired (token:<token> missing), generate
          // a new one and refresh both user and token entries.
          let token = user.token;
          const nowIso = new Date().toISOString();

          if (!token) {
            // Generate a new random token if none stored
            const tokenBuffer = crypto.randomBytes(32);
            token = tokenBuffer.toString('hex');
          }

          const allowListedRole = PLAYERS_ONLY_ADMINS.has(user.email) ? 'players_admin' : user.role;

          const updatedUser = {
            ...user,
            token,
            lastLogin: nowIso,
            role: ['admin', 'super_admin', 'players_admin'].includes(user.role)
              ? user.role
              : allowListedRole,
          };

          // Store/refresh user in KV with 1 year TTL
          await env.SPORTS_KV.put(
            `user:${username}`,
            JSON.stringify(updatedUser),
            {
              expirationTtl: 365 * 24 * 60 * 60,
            }
          );

          // Store/refresh token mapping so /api/auth?action=verify works
          await env.SPORTS_KV.put(
            `token:${token}`,
            JSON.stringify({
              userId: updatedUser.id,
              email: updatedUser.email,
              role: updatedUser.role,
              createdAt: nowIso,
            }),
            {
              expirationTtl: 7 * 24 * 60 * 60,
            }
          );

          return new Response(
            JSON.stringify({
              success: true,
              token,
              user: {
                id: updatedUser.id,
                username: updatedUser.email,
                email: updatedUser.email,
                role: updatedUser.role,
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
      }
    }

    // No match found
    return new Response(
      JSON.stringify({ error: 'Invalid username or password' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};
