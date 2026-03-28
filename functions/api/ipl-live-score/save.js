// GET /api/ipl-live-score/save: return table data (optionally per match)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    // Support ?matchId=... for per-match table data
    const matchId = url.searchParams.get('matchId') || '';
    const key = matchId ? `ipl-live-score-${matchId}` : 'ipl-live-score';
    const value = await KV.get(key);
    if (!value) {
      return new Response(JSON.stringify({ rows: [] }), { status: 200 });
    }
    return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// Cloudflare Pages Function API route for saving IPL live score rows to KV
export const onRequestPost = async ({ request, env }) => {
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId') || '';
    const key = matchId ? `ipl-live-score-${matchId}` : 'ipl-live-score';
    const data = await request.json();
    await KV.put(key, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

