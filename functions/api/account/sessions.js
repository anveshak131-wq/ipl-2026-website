export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'GET' && method !== 'POST') {
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
        // fall back to tokenValue as-is
      }
    }

    if (method === 'GET') {
      const result = await env.SPORTS_KV.list({ prefix: 'token:' });
      const sessions = [];

      for (const key of result.keys) {
        const value = await env.SPORTS_KV.get(key.name);
        if (!value) continue;

        let valueEmail = value;
        if (value.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed.email === 'string') {
              valueEmail = parsed.email;
            }
          } catch {
            // ignore parse errors
          }
        }

        if (valueEmail === email) {
          sessions.push({ id: key.name.replace('token:', '') });
        }
      }

      return new Response(
        JSON.stringify({ sessions }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // POST - revoke all sessions for this user
    const result = await env.SPORTS_KV.list({ prefix: 'token:' });
    for (const key of result.keys) {
      const value = await env.SPORTS_KV.get(key.name);
      if (!value) continue;

      let valueEmail = value;
      if (value.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed.email === 'string') {
            valueEmail = parsed.email;
          }
        } catch {
          // ignore parse errors
        }
      }

      if (valueEmail === email) {
        await env.SPORTS_KV.delete(key.name);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Sessions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
