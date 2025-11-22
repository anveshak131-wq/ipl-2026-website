/**
 * Cloudflare Pages Function for /api/admin/datasets
 * Stores uploaded CSV datasets into Workers KV (admin-only).
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

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

    // List existing datasets or fetch a single dataset by key
    if (method === 'GET') {
      const datasetKey = url.searchParams.get('key');

      if (datasetKey) {
        const safeKey = datasetKey.trim();
        if (!safeKey) {
          return new Response(
            JSON.stringify({ error: 'datasetKey cannot be empty' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }

        const value = await env.SPORTS_KV.get(`dataset:${safeKey}`);
        if (!value) {
          return new Response(
            JSON.stringify({ error: 'Dataset not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }

        try {
          const dataset = JSON.parse(value);
          return new Response(
            JSON.stringify({ dataset }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        } catch {
          return new Response(
            JSON.stringify({ error: 'Malformed dataset in KV' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }
      }

      const list = await env.SPORTS_KV.list({ prefix: 'dataset:' });

      const datasets = [];
      for (const entry of list.keys) {
        try {
          const value = await env.SPORTS_KV.get(entry.name);
          if (!value) continue;
          const parsed = JSON.parse(value);
          datasets.push({
            key: parsed.key || entry.name.replace(/^dataset:/, ''),
            rowCount: parsed.meta?.rowCount,
            uploadedAt: parsed.meta?.uploadedAt,
            uploadedBy: parsed.meta?.uploadedBy,
            seasonRange: parsed.meta?.seasonRange,
            seasonCount: parsed.meta?.seasonCount,
          });
        } catch {
          // Ignore malformed entries
        }
      }

      return new Response(
        JSON.stringify({ datasets }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (method === 'DELETE') {
      const datasetKey = url.searchParams.get('key');
      if (!datasetKey || !datasetKey.trim()) {
        return new Response(
          JSON.stringify({ error: 'datasetKey is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const safeKey = datasetKey.trim();
      await env.SPORTS_KV.delete(`dataset:${safeKey}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const body = await request.json();
    const { datasetKey, headers, rows, meta } = body || {};

    if (!datasetKey || typeof datasetKey !== 'string') {
      return new Response(
        JSON.stringify({ error: 'datasetKey is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: 'headers and rows must be arrays' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const safeKey = datasetKey.trim();
    if (!safeKey) {
      return new Response(
        JSON.stringify({ error: 'datasetKey cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let seasonRange;
    let seasonCount;

    const seasonIndex = headers.indexOf('season');
    if (seasonIndex !== -1) {
      const seasonsSet = new Set();
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        const raw = row[seasonIndex];
        if (raw == null) continue;
        const str = String(raw).trim();
        if (!str) continue;
        seasonsSet.add(str);
      }
      if (seasonsSet.size > 0) {
        const values = Array.from(seasonsSet);
        const numeric = values
          .map((v) => parseInt(v, 10))
          .filter((n) => Number.isFinite(n));
        if (numeric.length > 0) {
          const min = Math.min(...numeric);
          const max = Math.max(...numeric);
          seasonRange = min === max ? String(min) : `${min}-${max}`;
        } else {
          seasonRange = values.join(', ');
        }
        seasonCount = seasonsSet.size;
      }
    }

    const dataset = {
      key: safeKey,
      headers,
      rows,
      meta: {
        ...((meta && typeof meta === 'object') ? meta : {}),
        uploadedBy: email,
        uploadedAt: new Date().toISOString(),
        rowCount: Array.isArray(rows) ? rows.length : 0,
        seasonRange,
        seasonCount,
      },
    };

    await env.SPORTS_KV.put(`dataset:${safeKey}`, JSON.stringify(dataset));

    return new Response(
      JSON.stringify({ success: true, datasetKey: safeKey, rowCount: dataset.meta.rowCount }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Admin dataset save error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
