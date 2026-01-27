// GET /api/wpl-live-score/matches: return list of matches from KV (key: matches-list)
export async function onRequestGet(context) {
  const { env } = context;
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    const value = await KV.get('matches-list');
    if (!value) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
