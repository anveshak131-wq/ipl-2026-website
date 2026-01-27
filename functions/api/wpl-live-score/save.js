// Cloudflare Pages Function API route for saving WPL live score rows to KV
export const onRequestPost = async ({ request, env }) => {
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    const data = await request.json();
    await KV.put('wpl-live-score', JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const onRequestGet = async ({ env }) => {
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    const value = await KV.get('wpl-live-score');
    if (!value) {
      return new Response(JSON.stringify({ rows: [] }), { status: 200 });
    }
    return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
