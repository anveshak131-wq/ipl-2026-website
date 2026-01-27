// GET /api/wpl-live-score/matches: return list of matches from KV (key: matches-list)
export async function onRequestGet(context) {
  const { request } = context;
  // Proxy to the main matches API for WPL matches
  const url = new URL(request.url);
  const origin = url.origin || '';
  try {
    // Fetch matches from the main matches API (WPL only)
    const resp = await fetch(`${origin}/api/matches?league=wpl`);
    if (!resp.ok) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    const matches = await resp.json();
    // Return only id and name for dropdown
    const result = Array.isArray(matches)
      ? matches.map(m => ({ id: m.id, name: m.name || m.matchNumber || m.id }))
      : [];
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}
