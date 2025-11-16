/**
 * Cloudflare Pages Function for /api/admin/login
 * Handles admin authentication
 */

import crypto from 'node:crypto';

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
    const { username, password } = body;

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

    // First check hardcoded admin users
    const hardcodedUser = ADMIN_USERS[username];
    if (hardcodedUser && hardcodedUser.password === password) {
      const token = generateToken(hardcodedUser);
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
