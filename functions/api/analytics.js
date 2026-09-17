const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_VISITORS_PER_DAY = 5000;
const MAX_ROUTES_PER_DAY = 100;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePath(value) {
  const path = String(value || '/').trim() || '/';
  if (!path.startsWith('/')) return '/';
  return path.slice(0, 160);
}

function normalizeLeague(value) {
  return value === 'ipl' || value === 'wpl' ? value : 'unknown';
}

function normalizeSurface(path) {
  return path.startsWith('/ipl-admin-2026') || path.startsWith('/wpl-admin-2026') || path.startsWith('/admin')
    ? 'admin'
    : 'public';
}

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!env?.SPORTS_KV) {
    return json({ error: 'KV not configured' }, 500);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const path = normalizePath(body.path);
    const visitorId = String(body.visitorId || '').trim().slice(0, 96);
    const league = normalizeLeague(body.league);
    const surface = normalizeSurface(path);

    const now = new Date();
    const dateKey = getTodayKey();
    const hourKey = String(now.getUTCHours()).padStart(2, '0');
    const kvKey = `traffic:${dateKey}`;

    const existing = await env.SPORTS_KV.get(kvKey);
    let traffic = existing
      ? JSON.parse(existing)
      : {
          date: dateKey,
          pageViews: 0,
          publicPageViews: 0,
          adminPageViews: 0,
          visitors: {},
          hourly: {},
          routes: {},
          leagues: {},
          surfaces: { public: 0, admin: 0 },
          lastUpdated: now.toISOString(),
        };

    traffic.pageViews = Number(traffic.pageViews || 0) + 1;
    traffic.publicPageViews = Number(traffic.publicPageViews || 0) + (surface === 'public' ? 1 : 0);
    traffic.adminPageViews = Number(traffic.adminPageViews || 0) + (surface === 'admin' ? 1 : 0);
    traffic.hourly = traffic.hourly || {};
    traffic.routes = traffic.routes || {};
    traffic.leagues = traffic.leagues || {};
    traffic.surfaces = traffic.surfaces || { public: 0, admin: 0 };
    traffic.visitors = traffic.visitors || {};

    traffic.hourly[hourKey] = Number(traffic.hourly[hourKey] || 0) + 1;
    traffic.routes[path] = Number(traffic.routes[path] || 0) + 1;
    traffic.leagues[league] = Number(traffic.leagues[league] || 0) + 1;
    traffic.surfaces[surface] = Number(traffic.surfaces[surface] || 0) + 1;
    traffic.lastUpdated = now.toISOString();

    if (visitorId) {
      traffic.visitors[visitorId] = now.toISOString();
    }

    const routeEntries = Object.entries(traffic.routes)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, MAX_ROUTES_PER_DAY);
    traffic.routes = Object.fromEntries(routeEntries);

    const visitorEntries = Object.entries(traffic.visitors)
      .sort((a, b) => new Date(String(b[1])).getTime() - new Date(String(a[1])).getTime())
      .slice(0, MAX_VISITORS_PER_DAY);
    traffic.visitors = Object.fromEntries(visitorEntries);
    traffic.uniqueVisitors = visitorEntries.length;

    await env.SPORTS_KV.put(kvKey, JSON.stringify(traffic), {
      expirationTtl: 60 * 60 * 24 * 45,
    });

    return json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return json({ error: 'Failed to record analytics event' }, 500);
  }
};
