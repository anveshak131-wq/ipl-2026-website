export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const page = url.searchParams.get('page') || url.searchParams.get('slug') || 'legal';
  const key = `legal-page:${page}`;

  try {
    if (method === 'GET') {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: 'KV not configured', content: null }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const stored = await env.SPORTS_KV.get(key, 'json');
      return new Response(
        JSON.stringify({ page, content: stored?.content || null, updatedAt: stored?.updatedAt || null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (method === 'PUT') {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: 'KV not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
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

      // tokenValue may be plain email or JSON
      let email = tokenValue;
      if (tokenValue.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === 'string') {
            email = parsed.email;
          }
        } catch {
          // fall back to raw tokenValue
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
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const body = await request.json();
      const content = typeof body.content === 'string' ? body.content : '';

      const record = {
        page,
        content,
        updatedAt: new Date().toISOString(),
      };

      await env.SPORTS_KV.put(key, JSON.stringify(record));

      return new Response(
        JSON.stringify({ success: true, page, content: record.content, updatedAt: record.updatedAt }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Legal API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
