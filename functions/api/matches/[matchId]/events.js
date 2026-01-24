/**
 * POST /api/matches/:matchId/events
 * Accepts a single event payload, validates sequence/limits, appends to KV, and returns canonical event + innings summary
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return true;
}

function isLegalDelivery(eventType) {
  return !(eventType === 'wide' || eventType === 'no-ball');
}

function makeEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2,8)}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    // pathname: /api/matches/{matchId}/events
    const parts = url.pathname.split('/').filter(Boolean);
    const matchIdIndex = parts.indexOf('matches') + 1;
    const matchId = parts[matchIdIndex];

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Missing matchId in path' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await request.json();

    // Required: inningsNumber, over, ball, eventType
    const { inningsNumber, over, ball, batterId, bowlerId, eventType } = body;
    if (!inningsNumber || over == null || ball == null || !eventType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: inningsNumber, over, ball, eventType' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load existing events for this match from KV
    const kvKey = `match_events_${matchId}`;
    let events = await env.IPL_CACHE.get(kvKey, 'json');
    if (!events) events = [];

    // Compute innings-specific aggregates
    const inningsEvents = events.filter(e => e.inningsNumber === inningsNumber);
    const legalBalls = inningsEvents.filter(e => isLegalDelivery(e.eventType)).length;
    const wickets = inningsEvents.filter(e => e.eventType === 'wicket').length;

    // Determine if incoming event is legal
    const incomingIsLegal = isLegalDelivery(eventType);

    // If incoming event would add a legal ball beyond 20 overs (120 legal balls), reject
    const MAX_LEGAL_BALLS = 20 * 6;
    if (incomingIsLegal && (legalBalls + 1) > MAX_LEGAL_BALLS) {
      return new Response(JSON.stringify({ error: 'Innings already has maximum legal balls (20 overs)' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If incoming event would cause wickets > 10, reject
    const incomingIsWicket = eventType === 'wicket';
    if (incomingIsWicket && (wickets + 1) > 10) {
      return new Response(JSON.stringify({ error: 'Innings already has 10 wickets' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build canonical event
    const eventId = makeEventId();
    const serverTimestamp = new Date().toISOString();
    const canonical = {
      eventId,
      sequence: (events.length > 0 ? Math.max(...events.map(e => e.sequence || 0)) : 0) + 1,
      inningsNumber,
      over: Number(over),
      ball: Number(ball),
      batterId: body.batterId || null,
      bowlerId: body.bowlerId || null,
      eventType,
      runs: Number(body.runs || 0),
      extras: body.extras || null,
      dismissal: body.dismissal || null,
      operatorId: body.operatorId || null,
      clientTimestamp: body.clientTimestamp || null,
      serverTimestamp
    };

    // Append and persist
    events.push(canonical);
    await env.IPL_CACHE.put(kvKey, JSON.stringify(events));

    // Recalculate innings summary
    const updatedInningsEvents = events.filter(e => e.inningsNumber === inningsNumber);
    const totalRuns = updatedInningsEvents.reduce((s, e) => s + (Number(e.runs || 0)), 0);
    const totalWickets = updatedInningsEvents.filter(e => e.eventType === 'wicket').length;
    const totalLegalBalls = updatedInningsEvents.filter(e => isLegalDelivery(e.eventType)).length;
    const oversComplete = Math.floor(totalLegalBalls / 6);
    const ballsRemaining = totalLegalBalls % 6;
    const totalOversStr = `${oversComplete}.${ballsRemaining}`;

    // Determine next expected over/ball (based on legal balls)
    let nextExpected = null;
    let inningsComplete = false;
    if (totalLegalBalls >= MAX_LEGAL_BALLS || totalWickets >= 10) {
      inningsComplete = true;
      nextExpected = null;
    } else {
      const nextLegalBallNumber = totalLegalBalls + 1; // 1-based
      const nextOver = Math.floor((nextLegalBallNumber - 1) / 6) + 1; // over number starting 1
      const nextBall = ((nextLegalBallNumber - 1) % 6) + 1;
      nextExpected = { over: nextOver, ball: nextBall };
    }

    return new Response(JSON.stringify({ event: canonical, inningsSummary: { inningsNumber, totalRuns, totalWickets, totalLegalBalls, totalOvers: totalOversStr, inningsComplete }, nextExpected }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('events API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
