// Cloudflare Pages Function: /api/moderation
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const kv = env.SPORTS_KV || env.MODERATION_KV;
  const KV_KEY = 'live_ops:moderation_queue';
  const RULES_KEY = 'live_ops:moderation_rules';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET: Fetch queue items, rules, or stats
    if (request.method === 'GET') {
      const type = url.searchParams.get('type') || 'queue';
      const severity = url.searchParams.get('severity');

      if (type === 'rules') {
        const rules = kv ? (await kv.get(RULES_KEY, 'json')) || [] : [];
        return new Response(JSON.stringify({ success: true, rules }), { headers: corsHeaders });
      }

      let items = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];
      if (severity && severity !== 'all') {
        items = items.filter(i => i.severity === severity);
      }

      const stats = {
        total: items.length,
        critical: items.filter(i => i.severity === 'critical').length,
        high: items.filter(i => i.severity === 'high').length,
        medium: items.filter(i => i.severity === 'medium').length,
        low: items.filter(i => i.severity === 'low').length,
        pendingReview: items.filter(i => i.status === 'pending').length
      };

      return new Response(JSON.stringify({ success: true, items, stats }), { headers: corsHeaders });
    }

    // POST: Flag new content or report item
    if (request.method === 'POST') {
      const payload = await request.json();
      let items = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];

      const newItem = {
        id: 'mod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: payload.content || '',
        userId: payload.userId || 'anonymous',
        userName: payload.userName || 'Anonymous User',
        matchId: payload.matchId || null,
        severity: payload.severity || 'low',
        matchedRule: payload.matchedRule || 'Manual Flag',
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      items.unshift(newItem);
      if (kv) await kv.put(KV_KEY, JSON.stringify(items));

      return new Response(JSON.stringify({ success: true, item: newItem }), { headers: corsHeaders, status: 201 });
    }

    // PUT: Review item (hide, delete, approve, block user)
    if (request.method === 'PUT') {
      const { id, action, reason, adminId, bulkIds } = await request.json();
      let items = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];

      const targetIds = bulkIds && Array.isArray(bulkIds) ? bulkIds : [id];

      items = items.map(item => {
        if (targetIds.includes(item.id)) {
          return {
            ...item,
            status: action === 'approve' ? 'approved' : 'actioned',
            actionTaken: action,
            actionReason: reason || '',
            reviewedBy: adminId || 'admin',
            reviewedAt: new Date().toISOString()
          };
        }
        return item;
      });

      if (kv) await kv.put(KV_KEY, JSON.stringify(items));
      return new Response(JSON.stringify({ success: true, actionedCount: targetIds.length }), { headers: corsHeaders });
    }

    // DELETE: Purge item
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      let items = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];
      items = items.filter(i => i.id !== id);
      if (kv) await kv.put(KV_KEY, JSON.stringify(items));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: corsHeaders, status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders, status: 500 });
  }
}
