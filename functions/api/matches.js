// Cloudflare Pages Function for Matches API (IPL & WPL Isolated, Zero External Imports)

const DEFAULT_WPL_2027_MATCHES = [
  { id: 'wpl-2027-m01', matchNumber: 1, dayNumber: 1, dayOfWeek: 'Thu', date: '2027-01-14', displayDate: '14 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m02', matchNumber: 2, dayNumber: 2, dayOfWeek: 'Fri', date: '2027-01-15', displayDate: '15 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m03', matchNumber: 3, dayNumber: 3, dayOfWeek: 'Sat', date: '2027-01-16', displayDate: '16 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m04', matchNumber: 4, dayNumber: 4, dayOfWeek: 'Sun', date: '2027-01-17', displayDate: '17 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m05', matchNumber: 5, dayNumber: 5, dayOfWeek: 'Mon', date: '2027-01-18', displayDate: '18 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m06', matchNumber: 6, dayNumber: 6, dayOfWeek: 'Tue', date: '2027-01-19', displayDate: '19 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m07', matchNumber: 7, dayNumber: 7, dayOfWeek: 'Wed', date: '2027-01-20', displayDate: '20 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m08', matchNumber: 8, dayNumber: 8, dayOfWeek: 'Thu', date: '2027-01-21', displayDate: '21 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m09', matchNumber: 9, dayNumber: 9, dayOfWeek: 'Fri', date: '2027-01-22', displayDate: '22 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m10', matchNumber: 10, dayNumber: 10, dayOfWeek: 'Sat', date: '2027-01-23', displayDate: '23 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m11', matchNumber: 11, dayNumber: 11, dayOfWeek: 'Sun', date: '2027-01-24', displayDate: '24 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m12', matchNumber: 12, dayNumber: 13, dayOfWeek: 'Tue', date: '2027-01-26', displayDate: '26 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m13', matchNumber: 13, dayNumber: 14, dayOfWeek: 'Wed', date: '2027-01-27', displayDate: '27 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m14', matchNumber: 14, dayNumber: 15, dayOfWeek: 'Thu', date: '2027-01-28', displayDate: '28 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m15', matchNumber: 15, dayNumber: 16, dayOfWeek: 'Fri', date: '2027-01-29', displayDate: '29 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m16', matchNumber: 16, dayNumber: 17, dayOfWeek: 'Sat', date: '2027-01-30', displayDate: '30 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m17', matchNumber: 17, dayNumber: 18, dayOfWeek: 'Sun', date: '2027-01-31', displayDate: '31 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m18', matchNumber: 18, dayNumber: 19, dayOfWeek: 'Mon', date: '2027-02-01', displayDate: '01 Feb 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m19', matchNumber: 19, dayNumber: 20, dayOfWeek: 'Tue', date: '2027-02-02', displayDate: '02 Feb 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m20', matchNumber: 20, dayNumber: 21, dayOfWeek: 'Wed', date: '2027-02-03', displayDate: '03 Feb 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m21', matchNumber: 21, dayNumber: 23, dayOfWeek: 'Fri', date: '2027-02-05', displayDate: '05 Feb 2027', time: '7:30 PM', homeTeam: 'TBD (Eliminator Team 1)', homeTeamId: 'tbd', homeShort: 'TBD', awayTeam: 'TBD (Eliminator Team 2)', awayTeamId: 'tbd', awayShort: 'TBD', venue: 'Mumbai - CCI', stage: 'Eliminator', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m22', matchNumber: 22, dayNumber: 25, dayOfWeek: 'Sun', date: '2027-02-07', displayDate: '07 Feb 2027', time: '7:30 PM', homeTeam: 'Table Topper (TBD)', homeTeamId: 'tbd', homeShort: 'TBD', awayTeam: 'Eliminator Winner (TBD)', awayTeamId: 'tbd', awayShort: 'TBD', venue: 'Mumbai - CCI', stage: 'Final', status: 'upcoming', league: 'wpl' }
];

function getLeague(request, body) {
  const url = new URL(request.url);
  const qLeague = url.searchParams.get('league');
  if (qLeague) return qLeague.toLowerCase();
  if (body && body.league) return String(body.league).toLowerCase();
  const referer = request.headers.get('referer') || '';
  if (referer.toLowerCase().includes('/wpl')) return 'wpl';
  return 'ipl';
}

function getKvKeys(league) {
  return league === 'wpl'
    ? { sportsKey: 'matches:wpl', cacheKey: 'matches:wpl' }
    : { sportsKey: 'matches:ipl', cacheKey: 'matches' };
}

async function readMatchesFromKv(env, league) {
  const { sportsKey, cacheKey } = getKvKeys(league);
  let list = null;
  if (env?.SPORTS_KV) {
    list = await env.SPORTS_KV.get(sportsKey, 'json').catch(() => null);
  }
  if (!Array.isArray(list) && env?.IPL_CACHE) {
    list = await env.IPL_CACHE.get(cacheKey, 'json').catch(() => null);
  }
  if (!Array.isArray(list)) {
    list = league === 'wpl' ? DEFAULT_WPL_2027_MATCHES : [];
  }
  return list;
}

async function writeMatchesToKv(env, league, matches) {
  const { sportsKey, cacheKey } = getKvKeys(league);
  const payload = JSON.stringify(matches);
  if (env?.SPORTS_KV) {
    await env.SPORTS_KV.put(sportsKey, payload).catch(() => {});
  }
  if (env?.IPL_CACHE) {
    await env.IPL_CACHE.put(cacheKey, payload).catch(() => {});
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      const league = getLeague(request, null);
      const matches = await readMatchesFromKv(env, league);
      return new Response(JSON.stringify(matches), { status: 200, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({}));
    const league = getLeague(request, body);
    let currentMatches = await readMatchesFromKv(env, league);

    if (method === 'POST') {
      if (body.action === 'bulk_replace' && Array.isArray(body.matches)) {
        currentMatches = body.matches.map((m, idx) => ({
          ...m,
          id: m.id || `${league}-2027-m${String(m.matchNumber || idx + 1).padStart(2, '0')}`,
          league
        }));
        await writeMatchesToKv(env, league, currentMatches);
        return new Response(JSON.stringify({ success: true, count: currentMatches.length, matches: currentMatches }), {
          status: 200,
          headers: corsHeaders
        });
      }

      const newMatch = {
        ...body,
        id: body.id || `${league}-2027-m${String(body.matchNumber || currentMatches.length + 1).padStart(2, '0')}-${Date.now()}`,
        league
      };
      currentMatches.push(newMatch);
      await writeMatchesToKv(env, league, currentMatches);
      return new Response(JSON.stringify({ success: true, match: newMatch, matches: currentMatches }), {
        status: 201,
        headers: corsHeaders
      });
    }

    if (method === 'PUT') {
      if (body.action === 'bulk_replace' && Array.isArray(body.matches)) {
        currentMatches = body.matches.map((m, idx) => ({
          ...m,
          id: m.id || `${league}-2027-m${String(m.matchNumber || idx + 1).padStart(2, '0')}`,
          league
        }));
        await writeMatchesToKv(env, league, currentMatches);
        return new Response(JSON.stringify({ success: true, matches: currentMatches }), {
          status: 200,
          headers: corsHeaders
        });
      }

      const targetId = String(body.id || '');
      const idx = currentMatches.findIndex(m => String(m.id) === targetId);
      if (idx !== -1) {
        currentMatches[idx] = { ...currentMatches[idx], ...body, id: currentMatches[idx].id, league };
      } else {
        currentMatches.push({ ...body, id: targetId || `${league}-${Date.now()}`, league });
      }
      await writeMatchesToKv(env, league, currentMatches);
      return new Response(JSON.stringify({ success: true, match: body, matches: currentMatches }), {
        status: 200,
        headers: corsHeaders
      });
    }

    if (method === 'DELETE') {
      const url = new URL(request.url);
      const idParam = url.searchParams.get('id') || body.id;
      if (body.action === 'clear_all' || url.searchParams.get('clearAll') === 'true') {
        currentMatches = [];
      } else if (idParam) {
        currentMatches = currentMatches.filter(m => String(m.id) !== String(idParam));
      }
      await writeMatchesToKv(env, league, currentMatches);
      return new Response(JSON.stringify({ success: true, matches: currentMatches }), {
        status: 200,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: corsHeaders });
  }
}
