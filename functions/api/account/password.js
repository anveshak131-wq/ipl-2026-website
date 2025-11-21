import crypto from 'node:crypto';

const encryptPassword = (password, salt) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
};

const generateSalt = () => crypto.randomBytes(16).toString('hex');

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
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

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
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const user = JSON.parse(userData);

    const body = await request.json();
    const { currentPassword, newPassword } = body || {};

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'currentPassword and newPassword are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Verify current password
    const currentHash = encryptPassword(String(currentPassword), user.salt);
    if (currentHash !== user.hashedPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const normalizedNew = String(newPassword).trim();
    if (normalizedNew.length < 12) {
      return new Response(
        JSON.stringify({ error: 'New password must be at least 12 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (COMMON_PASSWORDS.has(normalizedNew.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'New password is too common. Please choose a stronger password.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const newSalt = generateSalt();
    const newHashedPassword = encryptPassword(normalizedNew, newSalt);

    const updatedUser = {
      ...user,
      salt: newSalt,
      hashedPassword: newHashedPassword,
      passwordChangedAt: new Date().toISOString(),
    };

    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(updatedUser), {
      expirationTtl: 31536000,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Password change error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
