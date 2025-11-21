export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (method !== 'GET' && method !== 'PUT') {
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
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const user = JSON.parse(userData);

    if (method === 'GET') {
      const profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName || user.name || user.email,
        favoriteTeamIds: user.favoriteTeamIds || [],
        favoritePlayerIds: user.favoritePlayerIds || [],
      };

      return new Response(JSON.stringify({ profile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // PUT - update favorites / display name
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const updatedUser = { ...user };

    if (typeof body.displayName === 'string') {
      const trimmed = body.displayName.trim();
      if (trimmed) {
        updatedUser.displayName = trimmed.slice(0, 80);
      }
    }

    if (Array.isArray(body.favoriteTeamIds)) {
      updatedUser.favoriteTeamIds = body.favoriteTeamIds.map((v) => String(v));
    }

    if (Array.isArray(body.favoritePlayerIds)) {
      updatedUser.favoritePlayerIds = body.favoritePlayerIds.map((v) => String(v));
    }

    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(updatedUser), {
      expirationTtl: 31536000, // 1 year
    });

    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      displayName: updatedUser.displayName || updatedUser.name || updatedUser.email,
      favoriteTeamIds: updatedUser.favoriteTeamIds || [],
      favoritePlayerIds: updatedUser.favoritePlayerIds || [],
    };

    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
