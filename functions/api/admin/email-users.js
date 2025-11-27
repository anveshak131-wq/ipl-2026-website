export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let emailFromToken = tokenValue;
    let roleFromToken = 'user';

    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          emailFromToken = parsed.email;
        }
        if (parsed && typeof parsed.role === 'string') {
          roleFromToken = parsed.role;
        }
      } catch (e) {
        // fall back to raw tokenValue
      }
    }

    const adminUserData = await env.SPORTS_KV.get(`user:${emailFromToken}`);
    if (!adminUserData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const adminUser = JSON.parse(adminUserData);
    const effectiveRole = adminUser.role || roleFromToken;

    if (effectiveRole !== 'admin' && effectiveRole !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (method === 'GET') {
      let indexRaw = await env.SPORTS_KV.get('users-index');
      let emails = [];

      if (indexRaw) {
        try {
          emails = JSON.parse(indexRaw) || [];
        } catch (e) {
          emails = [];
        }
      }

      if (!Array.isArray(emails)) {
        emails = [];
      }

      const total = emails.length;
      const limitParam = searchParams.get('limit');
      const offsetParam = searchParams.get('offset');
      const limit = Number.isNaN(parseInt(limitParam || '', 10)) ? 200 : parseInt(limitParam || '200', 10);
      const offset = Number.isNaN(parseInt(offsetParam || '', 10)) ? 0 : parseInt(offsetParam || '0', 10);

      const slice = emails.slice(offset, offset + limit);
      const users = [];

      for (const email of slice) {
        try {
          const userData = await env.SPORTS_KV.get(`user:${email}`);
          if (!userData) continue;
          const user = JSON.parse(userData);
          users.push({
            id: user.id,
            email: user.email,
            name: user.name,
            termsAccepted: !!user.termsAccepted,
            emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
            favoriteTeamIds: Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds : [],
            unsubscribedAt: user.unsubscribedAt || null,
            unsubscribeReason: user.unsubscribeReason || null,
            timezone: user.timezone || null,
            lastLogin: user.lastLogin || null,
          });
        } catch (e) {
          // skip invalid user
        }
      }

      return new Response(
        JSON.stringify({ users, total, offset, limit }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (method === 'PUT') {
      const body = await request.json();
      const { email, emailNotificationsEnabled, favoriteTeamIds } = body || {};

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Missing email' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const user = JSON.parse(userData);

      if (typeof emailNotificationsEnabled === 'boolean') {
        user.emailNotificationsEnabled = emailNotificationsEnabled;
        if (emailNotificationsEnabled) {
          delete user.unsubscribedAt;
          delete user.unsubscribeReason;
        } else {
          user.unsubscribedAt = user.unsubscribedAt || new Date().toISOString();
          user.unsubscribeReason = user.unsubscribeReason || 'admin-toggle';
        }
      }

      if (Array.isArray(favoriteTeamIds)) {
        user.favoriteTeamIds = favoriteTeamIds.map((v) => String(v));
      }

      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536000,
      });

      const responseUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        termsAccepted: !!user.termsAccepted,
        emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
        favoriteTeamIds: Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds : [],
        unsubscribedAt: user.unsubscribedAt || null,
        unsubscribeReason: user.unsubscribeReason || null,
      };

      return new Response(
        JSON.stringify({ success: true, user: responseUser }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Admin email users error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
