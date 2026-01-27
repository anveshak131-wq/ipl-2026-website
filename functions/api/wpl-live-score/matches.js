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
    // Return only id and name for dropdown as 'TEAM1 vs TEAM2'
    const result = Array.isArray(matches)
      ? matches.map(m => {
          let team1 = m.team1 && (m.team1.shortName || m.team1.name || 'Team1');
          let team2 = m.team2 && (m.team2.shortName || m.team2.name || 'Team2');
          // fallback if not present
          if (!team1) team1 = 'Team1';
          if (!team2) team2 = 'Team2';
          return {
            id: m.id,
            name: `${team1} vs ${team2}`
          };
        })
      : [];
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}
