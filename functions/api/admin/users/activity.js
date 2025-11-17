export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
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

    if (method === 'POST') {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      if (body.action) {
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }

        const dateKey = new Date().toISOString().slice(0, 10);
        const auditKey = `admin:audit:${dateKey}`;
        const existingLogs = await env.SPORTS_KV.get(auditKey);
        let logs = existingLogs ? JSON.parse(existingLogs) : [];

        logs.push({
          timestamp: new Date().toISOString(),
          adminId: user.id,
          adminEmail: user.email,
          adminRole: user.role,
          action: body.action,
          details: body.details || '',
          entityType: body.entityType || null,
          entityId: body.entityId || null,
        });

        if (logs.length > 500) {
          logs = logs.slice(-500);
        }

        await env.SPORTS_KV.put(auditKey, JSON.stringify(logs), {
          expirationTtl: 60 * 60 * 24 * 30,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const matchId = body.matchId || 'current';

      if (user.role === 'admin' || user.role === 'super_admin') {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];

      activeUsers = activeUsers.filter((u) => u.id !== user.id);

      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: new Date().toISOString(),
      });

      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }

      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Admin users activity error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
