// Cloudflare Pages Function for Matches API (IPL & WPL Isolated)
import fallbackMatches from '../data/matches.json';

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
    list = league === 'wpl' ? [] : (Array.isArray(fallbackMatches) ? fallbackMatches : []);
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
