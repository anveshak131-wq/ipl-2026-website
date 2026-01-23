// Simple AI-like commentary generator for live admin
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { matchId, event } = body || {};

    // Basic validation
    if (!event) {
      return new Response(JSON.stringify({ error: 'Missing event' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Attempt to use provider if configured (stub - not calling any real provider)
    // Fallback: generate a templated commentary
    const { type, runs, batterId, bowlerId, inning, over, ball, tone } = event;

    // Small utility to build a short phrase
    const runPart = (t) => {
      if (t === 'W') return 'WICKET!';
      if (t === 'NB' || String(t).startsWith('NB')) return 'No-ball';
      if (t === 'WD' || String(t).startsWith('WD')) return 'Wide';
      if (t === '1B' || String(t).endsWith('B')) return 'Bye';
      return String(t);
    };

    const short = runPart(type);
    const delivered = `Over ${over}.${ball}: ${short}`;

    // Tone adaptation
    let prefix = '';
    if (tone === 'excited') prefix = 'WOW — ';
    if (tone === 'analytical') prefix = 'STAT: ';

    // Use batter/bowler IDs if provided -- try to resolve to real player names from KV
    let batter = 'the batter';
    let bowler = 'the bowler';
    try {
      const playersData = await env.IPL_CACHE.get('players', 'json') || [];
      const findPlayer = (id, teamId) => {
        const matches = (playersData || []).filter(pl => String(pl.id) === String(id));
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        // Prefer a player who matches the batting team when possible
        if (teamId) {
          const byTeam = matches.find(pl => String(pl.teamId) === String(teamId));
          if (byTeam) return byTeam;
        }
        return matches[0];
      };

      if (batterId) {
        const p = findPlayer(batterId, body.battingTeamId);
        batter = p ? `${p.name}` : `Batter ${batterId}`;
      }
      if (bowlerId) {
        // If multiple players have same id, prefer a bowler who is NOT in the batting team (if provided)
        const matchesForBowler = (playersData || []).filter(pl => String(pl.id) === String(bowlerId));
        let chosenBowler = null;
        if (matchesForBowler.length === 1) chosenBowler = matchesForBowler[0];
        else if (body.battingTeamId) {
          chosenBowler = matchesForBowler.find(pl => String(pl.teamId) !== String(body.battingTeamId)) || matchesForBowler[0];
        } else {
          chosenBowler = matchesForBowler[0];
        }
        bowler = chosenBowler ? `${chosenBowler.name}` : `Bowler ${bowlerId}`;
      }
    } catch (err) {
      // If KV lookup fails, fall back to IDs
      if (batterId) batter = `Batter ${batterId}`;
      if (bowlerId) bowler = `Bowler ${bowlerId}`;
    }

    // Include batting team if provided
    const battingInfo = body.battingTeamName ? ` Batting: ${body.battingTeamName}.` : '';

    let suggestion = `${prefix}${delivered} — ${batter} vs ${bowler}.${battingInfo}`;

    // Add some extra text for big events
    if (String(type) === '6') {
      suggestion += ' Huge hit — six over the ropes!';
    } else if (String(type) === '4') {
      suggestion += ' Classic boundary — four runs.';
    } else if (String(type) === 'W') {
      suggestion += ' The batter is out — excellent delivery.';
    } else if (String(type).startsWith('NB') || String(type).startsWith('WD')) {
      suggestion += ' Extra runs and a free hit to follow.';
    }

    // Limit suggestion to 300 chars
    suggestion = suggestion.substring(0, 300);

    return new Response(JSON.stringify({ suggestion }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal error', message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
