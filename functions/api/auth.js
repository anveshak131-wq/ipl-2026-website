import crypto from 'node:crypto';

// Encrypt/Decrypt utilities for secure storage
const encryptPassword = (password, salt) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
};

const generateSalt = () => crypto.randomBytes(16).toString('hex');
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Very common passwords to block at signup (case-insensitive)
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  '123456',
  '123456789',
  '12345678',
  'qwerty',
  '111111',
  'abc123',
  'letmein',
  'iloveyou',
]);

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
      const { email, password, name, turnstileToken } = body;

      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Optional Cloudflare Turnstile verification for human check
      const secretKey = env.TURNSTILE_SECRET_KEY;
      if (secretKey && turnstileToken) {
        try {
          const formData = new URLSearchParams();
          formData.append('secret', secretKey);
          formData.append('response', String(turnstileToken));
          const ip = request.headers.get('CF-Connecting-IP');
          if (ip) {
            formData.append('remoteip', ip);
          }

          const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
          });

          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            return new Response(
              JSON.stringify({ error: 'Human verification failed. Please try again.' }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
        } catch (e) {
          console.error('Turnstile verification error:', e);
          return new Response(
            JSON.stringify({ error: 'Unable to verify human check. Please try again.' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      } else if (secretKey && !turnstileToken) {
        // If Turnstile is configured but no token provided, reject signup
        return new Response(
          JSON.stringify({ error: 'Human verification is required to create an account.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const normalizedPassword = String(password).trim();

      if (normalizedPassword.length < 12) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 12 characters long' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (COMMON_PASSWORDS.has(normalizedPassword.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: 'Password is too common. Please choose a stronger password.' }),
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
      const hashedPassword = encryptPassword(normalizedPassword, salt);
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

      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // tokenValue may be a plain email (from /api/auth) or JSON (from /api/admin/setup)
      let email = tokenValue;
      if (tokenValue.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === 'string') {
            email = parsed.email;
          }
        } catch {
          // fall back to using tokenValue directly
        }
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

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
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            role: user.role || 'user' // Include role field
          },
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
