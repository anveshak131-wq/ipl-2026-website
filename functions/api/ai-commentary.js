export async function onRequest(context) {
  const { request } = context;

  // Allow CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json().catch(() => ({}));

    // Accept either names or ids; fall back to generic placeholders
    const striker = body.strikerName || body.strikerId || 'Batsman';
    const nonStriker = body.nonStrikerName || body.nonStrikerId || 'Non-striker';
    const bowler = body.bowlerName || body.bowlerId || 'Bowler';
    const runsRaw = body.runs;
    const outcome = String(body.outcome || '').toLowerCase();
    let runs = 0;
    if (typeof runsRaw === 'number') runs = runsRaw;
    if (typeof runsRaw === 'string' && runsRaw.match(/^\d+$/)) runs = parseInt(runsRaw, 10);

    // Small helper to pluralize
    const plural = (n, s) => (n === 1 ? `${n} ${s}` : `${n} ${s}s`);

    // Build a few varied templates
    const templates = [];

    if (outcome === 'wicket') {
      templates.push(`${bowler} strikes! ${striker} is out — a crucial breakthrough.`);
      templates.push(`WICKET! ${striker} departs, excellent delivery from ${bowler}.`);
      templates.push(`${striker} gone! ${bowler} finds the edge and the catch is taken.`);
    } else if (outcome === 'wide') {
      templates.push(`Wide ball from ${bowler}, an extra to the batting side.`);
      templates.push(`${bowler} bowls down the leg — wide called.`);
    } else if (outcome === 'noball') {
      templates.push(`No-ball by ${bowler}. Free hit to follow.`);
      templates.push(`${bowler} oversteps — that's a no-ball and an extra.`);
    } else if (runs > 0) {
      templates.push(`${striker} to ${bowler}: ${plural(runs, 'run')} — nicely timed.`);
      templates.push(`${striker} flicks it away for ${plural(runs, 'run')}.`);
      templates.push(`${plural(runs, 'run')} taken as ${striker} times it beautifully off ${bowler}.`);
      // include boundary phrasing
      if (runs >= 4) templates.push(`${striker} brings up the boundary! ${plural(runs, 'run')}.`);
      if (runs >= 6) templates.push(`${striker} sends it out of the park — SIX!`);
    } else {
      templates.push(`Good over from ${bowler}. Dot ball — pressure building.`);
      templates.push(`No score from ${striker}; tidy bowling from ${bowler}.`);
      templates.push(`${striker} survives, but leaves the bowler with clever line and length.`);
    }

    // Pick a template deterministically for repeatability
    const idx = Math.abs((String(striker + bowler + outcome).split('').reduce((a,c)=>a+ c.charCodeAt(0), 0))) % templates.length;
    const suggestion = templates[idx] || templates[0];

    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
