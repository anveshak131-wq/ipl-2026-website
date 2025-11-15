import crypto from 'node:crypto';

// Encrypt/Decrypt utilities for secure storage
const encryptPassword = (password, salt) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
};

const generateSalt = () => crypto.randomBytes(16).toString('hex');
const generateToken = () => crypto.randomBytes(32).toString('hex');

export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Parse request to determine action
    let action = searchParams.get('action') || 'signin'; // default action
    let body = {};
    
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.json();
        // Infer action from presence of required fields
        if (body.name && body.email && body.password) {
          action = 'signup';
        } else if (body.email && body.password && !body.name) {
          action = 'signin';
        }
      } catch (e) {
        // Body parse error
      }
    }

    // Sign Up
    if (action === 'signup' && method === 'POST') {
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check if user already exists
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Create new user
      const salt = generateSalt();
      const hashedPassword = encryptPassword(password, salt);
      const userId = crypto.randomUUID();
      const token = generateToken();
      const createdAt = new Date().toISOString();

      const userData = {
        id: userId,
        email,
        name,
        salt,
        hashedPassword,
        token,
        createdAt,
        isBlocked: false,
        role: 'user',
      };

      // Store user in KV with 1-year expiration
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(userData), {
        expirationTtl: 31536000,
      });
      await env.SPORTS_KV.put(`token:${token}`, email, {
        expirationTtl: 2592000, // 30 days
      });
      await env.SPORTS_KV.put(`userId:${userId}`, email, {
        expirationTtl: 31536000,
      });

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          token,
          user: { id: userId, email, name },
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders,
          },
        }
      );
    }

    // Sign In
    if (action === 'signin' && method === 'POST') {
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Missing email or password' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const user = JSON.parse(userData);

      // Check if user is blocked
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: 'Your account has been blocked' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Verify password
      const hashedPassword = encryptPassword(password, user.salt);
      if (hashedPassword !== user.hashedPassword) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Generate new token
      const newToken = generateToken();
      user.token = newToken;
      user.lastLogin = new Date().toISOString();

      // Update user with new token
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536000,
      });
      await env.SPORTS_KV.put(`token:${newToken}`, email, {
        expirationTtl: 2592000,
      });

      return new Response(
        JSON.stringify({
          success: true,
          userId: user.id,
          token: newToken,
          user: { id: user.id, email: user.email, name: user.name },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders,
          },
        }
      );
    }

    // Verify Token
    if (action === 'verify' && method === 'GET') {
      const token = searchParams.get('token');
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'No token provided' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const email = await env.SPORTS_KV.get(`token:${token}`);
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);

      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: 'Account blocked' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Sign Out (revoke token)
    if (action === 'signout' && method === 'POST') {
      const { token } = body;
      if (token) {
        await env.SPORTS_KV.delete(`token:${token}`);
      }
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
