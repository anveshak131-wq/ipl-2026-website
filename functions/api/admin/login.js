/**
 * Cloudflare Pages Function for /api/admin/login
 * Handles admin authentication
 */

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

export async function onRequestPost(context) {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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

    // Check credentials
    const user = ADMIN_USERS[username];
    if (!user || user.password !== password) {
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
    }

    // Generate token
    const token = generateToken(user);

    // Return success with token
    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
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
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
