function getModerationFlagsForText(text) {
  const normalized = text.trim().toLowerCase();
  const badWords = ['idiot', 'stupid', 'hate'];

  let isFlagged = false;
  let flagReason = null;

  if (badWords.some((word) => normalized.includes(word))) {
    isFlagged = true;
    flagReason = 'bad_language';
  } else if (
    normalized.includes('http://') ||
    normalized.includes('https://') ||
    normalized.includes('www.')
  ) {
    isFlagged = true;
    flagReason = 'spam';
  }

  const flagStatus = isFlagged ? 'pending' : null;
  const flaggedAt = isFlagged ? new Date().toISOString() : null;
  const flagDetails = null;

  return { isFlagged, flagReason, flagStatus, flaggedAt, flagDetails };
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    // Get messages for a match
    if (pathname === '/api/messages' && method === 'GET') {
      const matchId = searchParams.get('matchId') || 'current';
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);

      if (!messagesData) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      let messages = JSON.parse(messagesData);
      messages = messages.slice(
        Math.max(0, messages.length - offset - limit),
        messages.length - offset
      );

      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Post new message
    if (pathname === '/api/messages' && method === 'POST') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
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
      const user = JSON.parse(userData);

      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: 'Your account is blocked' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const { matchId = 'current', text } = await request.json();

      if (!text || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Message cannot be empty' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check message length
      if (text.length > 500) {
        return new Response(
          JSON.stringify({ error: 'Message too long (max 500 chars)' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];

      const moderation = getModerationFlagsForText(text);

      const message = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        matchId,
        ...moderation,
      };

      messages.push(message);

      // Keep only last 1000 messages
      if (messages.length > 1000) {
        messages = messages.slice(-1000);
      }

      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800, // 7 days
      });

      return new Response(JSON.stringify({ success: true, message }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Delete message (admin only)
    if (pathname.startsWith('/api/messages/') && method === 'DELETE') {
      const messageId = pathname.split('/').pop();
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
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
      const user = JSON.parse(userData);

      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const matchId = searchParams.get('matchId') || 'current';
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];

      messages = messages.filter((m) => m.id !== messageId);

      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Messages error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
