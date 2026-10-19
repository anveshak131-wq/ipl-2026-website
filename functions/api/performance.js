// Cloudflare Pages Function: /api/performance
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const kv = env.SPORTS_KV || env.IPL_CACHE;
  const METRICS_KEY = 'live_ops:perf_metrics';
  const ALERTS_KEY = 'live_ops:perf_alerts';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET: Retrieve metrics, statistics & active alerts
    if (request.method === 'GET') {
      const format = url.searchParams.get('format');
      const metrics = kv ? (await kv.get(METRICS_KEY, 'json')) || [] : [];
      const alerts = kv ? (await kv.get(ALERTS_KEY, 'json')) || [] : [];

      if (format === 'csv') {
        const csvHeader = 'name,value,timestamp\n';
        const csvRows = metrics.map(m => `${m.name},${m.value},${m.timestamp}`).join('\n');
        return new Response(csvHeader + csvRows, {
          headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="metrics.csv"' }
        });
      }

      // Compute statistics (p95, p99, avg, min, max)
      const stats = {};
      const grouped = metrics.reduce((acc, m) => {
        acc[m.name] = acc[m.name] || [];
        acc[m.name].push(m.value);
        return acc;
      }, {});

      for (const [name, values] of Object.entries(grouped)) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        stats[name] = {
          count: sorted.length,
          avg: Math.round(sum / sorted.length),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
          p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1]
        };
      }

      return new Response(JSON.stringify({
        success: true,
        stats,
        alerts: alerts.filter(a => !a.resolved),
        resolvedAlerts: alerts.filter(a => a.resolved),
        activeConnections: stats.activeConnections?.max || 42,
        uptime: process.uptime ? process.uptime() : 86400
      }), { headers: corsHeaders });
    }

    // POST: Record new metrics or threshold alert
    if (request.method === 'POST') {
      const payload = await request.json(); // { name, value }
      let metrics = kv ? (await kv.get(METRICS_KEY, 'json')) || [] : [];
      let alerts = kv ? (await kv.get(ALERTS_KEY, 'json')) || [] : [];

      const metric = {
        name: payload.name,
        value: Number(payload.value),
        timestamp: new Date().toISOString()
      };

      metrics.push(metric);
      if (metrics.length > 500) metrics = metrics.slice(-500); // Ring buffer

      // Check threshold rules
      if (payload.name === 'messageLatency' && payload.value > 300) {
        alerts.unshift({
          id: 'alt_' + Date.now(),
          metric: payload.name,
          value: payload.value,
          threshold: 300,
          severity: payload.value > 600 ? 'critical' : 'high',
          message: `Latency exceeded threshold: ${payload.value}ms`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (kv) {
        await kv.put(METRICS_KEY, JSON.stringify(metrics));
        await kv.put(ALERTS_KEY, JSON.stringify(alerts));
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // PUT: Resolve alert
    if (request.method === 'PUT') {
      const { alertId } = await request.json();
      let alerts = kv ? (await kv.get(ALERTS_KEY, 'json')) || [] : [];
      alerts = alerts.map(a => a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a);
      if (kv) await kv.put(ALERTS_KEY, JSON.stringify(alerts));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: corsHeaders, status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders, status: 500 });
  }
}
