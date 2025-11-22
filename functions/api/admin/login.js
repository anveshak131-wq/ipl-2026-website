/**
 * Cloudflare Pages Function for /api/admin/login
 * Handles admin authentication
 */

import crypto from 'node:crypto';

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

// Mock admin users - matches src/lib/auth.ts
const ADMIN_USERS = {
  admin: {
    id: '1',
    username: 'admin',
    email: 'admin@ipl2026.com',
    role: 'super_admin',
    password: 'admin123'
  },
  manager: {
    id: '2',
    username: 'manager',
    email: 'manager@ipl2026.com',
    role: 'admin',
    password: 'manager123'
  }
};

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

    // First check hardcoded admin users
    const hardcodedUser = ADMIN_USERS[username];
    if (hardcodedUser && hardcodedUser.password === password) {
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

      const token = generateToken(hardcodedUser);

      // Sync hardcoded admin into KV so that /api/auth and KV-protected
      // admin APIs (datasets, analytics, etc.) recognize this session.
      if (env && env.SPORTS_KV) {
        const email = hardcodedUser.email;
        const nowIso = new Date().toISOString();
        let existingUser = null;
        try {
          const raw = await env.SPORTS_KV.get(`user:${email}`);
          if (raw) {
            existingUser = JSON.parse(raw);
          }
        } catch {
          existingUser = null;
        }

        const userRecord = {
          id: existingUser?.id || hardcodedUser.id,
          email,
          name: existingUser?.name || hardcodedUser.username,
          // Preserve any password fields/salt if they existed from setup,
          // but override role, token, and lastLogin.
          salt: existingUser?.salt,
          hashedPassword: existingUser?.hashedPassword,
          token,
          role: hardcodedUser.role,
          isBlocked: existingUser?.isBlocked ?? false,
          createdAt: existingUser?.createdAt || nowIso,
          lastLogin: nowIso,
        };

        // Store/refresh user in KV (1 year TTL, like /api/auth signup)
        await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(userRecord), {
          expirationTtl: 31536000,
        });

        // Map token -> email/role so /api/auth?action=verify and other
        // KV-backed admin APIs can validate this session.
        await env.SPORTS_KV.put(
          `token:${token}`,
          JSON.stringify({
            userId: userRecord.id,
            email,
            role: userRecord.role,
            createdAt: nowIso,
          }),
          {
            expirationTtl: 2592000, // 30 days
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token,
          user: {
            id: hardcodedUser.id,
            username: hardcodedUser.username,
            email: hardcodedUser.email,
            role: hardcodedUser.role
          }
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

    // Then check KV database (for email/password login from /admin/setup)
    if (env && env.SPORTS_KV) {
      // Treat username as email for KV lookup
      const userData = await env.SPORTS_KV.get(`user:${username}`);
      if (userData) {
        const user = JSON.parse(userData);
        
        // Only allow admin role users
        if (user.role === 'admin' && verifyPassword(password, user.salt, user.hashedPassword)) {
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

          // Use the existing token from KV
          const token = user.token;
          
          return new Response(
            JSON.stringify({
              success: true,
              token,
              user: {
                id: user.id,
                username: user.email,
                email: user.email,
                role: user.role
              }
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
