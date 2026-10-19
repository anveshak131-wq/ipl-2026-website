// Cloudflare Pages Function: /api/incidents
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const kv = env.SPORTS_KV || env.IPL_CACHE;
  const KV_KEY = 'live_ops:incidents';

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
    // GET: List incidents with filters & statistics
    if (request.method === 'GET') {
      const status = url.searchParams.get('status');
      const severity = url.searchParams.get('severity');
      let incidents = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];

      if (status && status !== 'all') {
        incidents = incidents.filter(i => i.status === status);
      }
      if (severity && severity !== 'all') {
        incidents = incidents.filter(i => i.severity === severity);
      }

      const stats = {
        total: incidents.length,
        open: incidents.filter(i => i.status === 'open').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        closed: incidents.filter(i => i.status === 'closed').length
      };

      return new Response(JSON.stringify({ success: true, incidents, stats }), { headers: corsHeaders });
    }

    // POST: Create incident or add comment
    if (request.method === 'POST') {
      const payload = await request.json();
      let incidents = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];

      if (payload.action === 'comment') {
        incidents = incidents.map(inc => {
          if (inc.id === payload.incidentId) {
            const comments = inc.comments || [];
            comments.push({
              id: 'c_' + Date.now(),
              author: payload.author || 'Admin',
              text: payload.text,
              timestamp: new Date().toISOString()
            });
            return { ...inc, comments };
          }
          return inc;
        });
        if (kv) await kv.put(KV_KEY, JSON.stringify(incidents));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      const newIncident = {
        id: 'INC-' + (incidents.length + 101),
        title: payload.title || 'Untitled Incident',
        description: payload.description || '',
        category: payload.category || 'performance',
        severity: payload.severity || 'medium',
        status: 'open',
        createdBy: payload.createdBy || 'Operations Lead',
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'open', timestamp: new Date().toISOString(), note: 'Incident created' }
        ],
        comments: []
      };

      incidents.unshift(newIncident);
      if (kv) await kv.put(KV_KEY, JSON.stringify(incidents));
      return new Response(JSON.stringify({ success: true, incident: newIncident }), { headers: corsHeaders, status: 201 });
    }

    // PUT: Update status, root cause, or resolution
    if (request.method === 'PUT') {
      const { id, status, rootCause, resolution, adminId } = await request.json();
      let incidents = kv ? (await kv.get(KV_KEY, 'json')) || [] : [];

      incidents = incidents.map(inc => {
        if (inc.id === id) {
          const timeline = inc.timeline || [];
          if (status && status !== inc.status) {
            timeline.push({
              status,
              updatedBy: adminId || 'admin',
              timestamp: new Date().toISOString(),
              note: `Status changed to ${status}`
            });
          }
          return {
            ...inc,
            ...(status && { status }),
            ...(rootCause && { rootCause }),
            ...(resolution && { resolution }),
            timeline,
            updatedAt: new Date().toISOString()
          };
        }
        return inc;
      });

      if (kv) await kv.put(KV_KEY, JSON.stringify(incidents));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: corsHeaders, status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders, status: 500 });
  }
}
