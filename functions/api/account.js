export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const action = url.searchParams.get('action') || 'delete';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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
    if (method === 'DELETE' && action === 'delete') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer', '').trim();

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
      const userId = user.id;

      // Anonymize this user's messages across all matches
      try {
        const listResult = await env.SPORTS_KV.list({ prefix: 'messages:' });
        for (const key of listResult.keys) {
          const messagesData = await env.SPORTS_KV.get(key.name);
          if (!messagesData) continue;

          let messages;
          try {
            messages = JSON.parse(messagesData);
          } catch {
            continue;
          }

          let changed = false;
          const anonymizedMessages = messages.map((m) => {
            if (m && m.userId === userId) {
              changed = true;
              return {
                ...m,
                userId: `deleted_${userId}`,
                userName: 'Deleted user',
              };
            }
            return m;
          });

          if (changed) {
            await env.SPORTS_KV.put(key.name, JSON.stringify(anonymizedMessages), {
              // keep original TTL semantics for messages (7 days)
              expirationTtl: 604800,
            });
          }
        }
      } catch (e) {
        console.error('Error anonymizing messages for user', userId, e);
        // Do not fail deletion just because anonymization partially failed
      }

      // Delete user records
      await env.SPORTS_KV.delete(`user:${email}`);
      if (userId) {
        await env.SPORTS_KV.delete(`userId:${userId}`);
      }

      // Delete all tokens associated with this email
      try {
        const tokenList = await env.SPORTS_KV.list({ prefix: 'token:' });
        for (const key of tokenList.keys) {
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
      } catch (e) {
        console.error('Error cleaning up tokens for user', email, e);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            // Clear auth cookie if present
            'Set-Cookie': 'auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
            ...corsHeaders,
          },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Account error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
