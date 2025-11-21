export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

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

    let email = tokenValue;
    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          email = parsed.email;
        }
      } catch {
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

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (url.pathname === '/api/admin/moderation' && method === 'GET') {
      const matchId = url.searchParams.get('matchId') || 'current';
      const statusFilter = url.searchParams.get('status') || 'pending';
      const limit = parseInt(url.searchParams.get('limit') || '100');

      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      const messages = messagesData ? JSON.parse(messagesData) : [];

      let flagged = messages.filter((m) => m && m.isFlagged);

      if (statusFilter === 'pending') {
        flagged = flagged.filter((m) => m.flagStatus === 'pending');
      } else if (statusFilter === 'safe') {
        flagged = flagged.filter((m) => m.flagStatus === 'safe');
      } else if (statusFilter === 'action_taken') {
        flagged = flagged.filter((m) => m.flagStatus === 'action_taken');
      }

      flagged.sort((a, b) => {
        const aTime = a.flaggedAt ? Date.parse(a.flaggedAt) : Date.parse(a.timestamp || '') || 0;
        const bTime = b.flaggedAt ? Date.parse(b.flaggedAt) : Date.parse(b.timestamp || '') || 0;
        return bTime - aTime;
      });

      const sliced = flagged.slice(0, limit);

      return new Response(JSON.stringify({ messages: sliced, matchId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (url.pathname === '/api/admin/moderation' && method === 'POST') {
      const body = await request.json();
      const matchId = body.matchId || 'current';
      const messageId = body.messageId;
      const action = body.action;

      if (!messageId || !action) {
        return new Response(
          JSON.stringify({ error: 'messageId and action are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];

      const index = messages.findIndex((m) => m && m.id === messageId);
      if (index === -1) {
        return new Response(
          JSON.stringify({ success: false, notFound: true }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const message = messages[index];

      if (action === 'delete') {
        messages = messages.filter((m) => m && m.id !== messageId);

        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800,
        });

        return new Response(JSON.stringify({ success: true, action: 'delete' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (action === 'blockUser') {
        const targetUserId = message.userId;
        if (targetUserId) {
          const userEmail = await env.SPORTS_KV.get(`userId:${targetUserId}`);
          if (userEmail) {
            const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
            if (targetUserData) {
              const targetUser = JSON.parse(targetUserData);
              targetUser.isBlocked = true;
              targetUser.blockedAt = new Date().toISOString();

              await env.SPORTS_KV.put(`user:${userEmail}`, JSON.stringify(targetUser), {
                expirationTtl: 31536000,
              });
            }
          }
        }

        messages[index] = {
          ...message,
          isFlagged: true,
          flagStatus: 'action_taken',
        };

        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800,
        });

        return new Response(JSON.stringify({ success: true, action: 'blockUser' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (action === 'markSafe') {
        messages[index] = {
          ...message,
          isFlagged: false,
          flagStatus: 'safe',
        };

        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800,
        });

        return new Response(JSON.stringify({ success: true, action: 'markSafe' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Unsupported action' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Admin moderation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
