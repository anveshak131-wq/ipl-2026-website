/**
 * Cloudflare Pages Function for /api/content
 * Handles GET, POST, PUT, DELETE for content management
 */

// Helper: parse JSON body
async function getBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return null;
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Helper: basic admin token check (presence of Bearer token)
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// KV namespace (bound by wrangler.toml)
const kv = globalThis.IPL_CACHE;

const KV_KEY = 'ipl:content';
const CONTENT_CACHE_TTL = 300;

export const onRequest = async (context) => {
  const { request, env } = context;
  const kvNamespace = env.IPL_CACHE || kv;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // GET - fetch all content
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      const league = url.searchParams.get('league');

      const cached = await kvNamespace.get(KV_KEY, { cacheTtl: CONTENT_CACHE_TTL });
      let content = cached ? JSON.parse(cached) : [];

      // Ensure all content has league property (migration for existing data)
      content = content.map(c => ({
        ...c,
        league: c.league || 'ipl' // Default to 'ipl' if missing
      }));

      if (type) {
        content = content.filter(c => c.type === type);
      }

      // Filter by league if specified
      if (league && (league === 'ipl' || league === 'wpl')) {
        content = content.filter(c => {
          const contentLeague = c.league || 'ipl';
          return contentLeague === league;
        });
      }

      return new Response(JSON.stringify(content), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // POST - create new content (admin only)
    if (request.method === 'POST') {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const body = await getBody(request);

      if (!body || !body.title || !body.type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: title, type' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];

      const newContent = {
        ...body,
        league: body.league || 'ipl', // Default to 'ipl' if not specified
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      content.push(newContent);
      await kvNamespace.put(KV_KEY, JSON.stringify(content));

      // Best-effort admin audit log
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get('authorization') || '';
        await fetch(`${origin}/api/admin/users/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: 'create_content',
            details: `Created ${newContent.type} \"${newContent.title}\"`,
            entityType: newContent.type,
            entityId: newContent.id,
          }),
        });
      } catch (err) {
        console.error('Failed to write admin audit log (create_content):', err);
      }

      return new Response(
        JSON.stringify({
          message: 'Content created successfully',
          content: newContent,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // PUT - update content (admin only)
    if (request.method === 'PUT') {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const body = await getBody(request);

      if (!body || !body.id) {
        return new Response(
          JSON.stringify({ error: 'Content ID is required' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];

      const updated = content.map(c =>
        c.id === body.id
          ? { 
              ...c, 
              ...body, 
              league: body.league || c.league || 'ipl', // Preserve or set league
              updatedAt: new Date().toISOString() 
            }
          : c
      );

      await kvNamespace.put(KV_KEY, JSON.stringify(updated));

      // Best-effort admin audit log
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get('authorization') || '';
        const updatedItem = updated.find(c => c.id === body.id) || null;
        await fetch(`${origin}/api/admin/users/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: 'update_content',
            details: updatedItem
              ? `Updated ${updatedItem.type} \"${updatedItem.title}\"`
              : `Updated content ${body.id}`,
            entityType: updatedItem?.type || null,
            entityId: body.id,
          }),
        });
      } catch (err) {
        console.error('Failed to write admin audit log (update_content):', err);
      }

      return new Response(
        JSON.stringify({
          message: 'Content updated successfully',
          content: { ...body, updatedAt: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // DELETE - remove content (admin only)
    if (request.method === 'DELETE') {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Content ID is required' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];

      const toDelete = content.find(c => c.id === id) || null;
      const updated = content.filter(c => c.id !== id);
      await kvNamespace.put(KV_KEY, JSON.stringify(updated));

      // Best-effort admin audit log
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get('authorization') || '';
        await fetch(`${origin}/api/admin/users/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: 'delete_content',
            details: toDelete
              ? `Deleted ${toDelete.type} \"${toDelete.title}\"`
              : `Deleted content ${id}`,
            entityType: toDelete?.type || null,
            entityId: id,
          }),
        });
      } catch (err) {
        console.error('Failed to write admin audit log (delete_content):', err);
      }

      return new Response(
        JSON.stringify({ message: 'Content deleted successfully' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};
