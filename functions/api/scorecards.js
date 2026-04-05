/**
 * Cloudflare Pages Function for scorecards API base route
 * Handles GET (list all) and POST (create new) operations
 * Individual scorecard operations are handled by [id].js
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CACHE_TTL_SECONDS = 30;

const IPL_TEAM_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '16', '17', '18', '19', '20']);
const WPL_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);

function normalizeLeague(value) {
  return value === 'ipl' || value === 'wpl' ? value : null;
}

function inferLeagueFromScorecard(scorecard) {
  const explicit = normalizeLeague(scorecard?.league);

  const team1Id = String(scorecard?.matchInfo?.team1?.id ?? scorecard?.matchInfo?.team1Id ?? '');
  const team2Id = String(scorecard?.matchInfo?.team2?.id ?? scorecard?.matchInfo?.team2Id ?? '');

  let teamBased = null;
  if (WPL_TEAM_IDS.has(team1Id) || WPL_TEAM_IDS.has(team2Id)) teamBased = 'wpl';
  if (IPL_TEAM_IDS.has(team1Id) || IPL_TEAM_IDS.has(team2Id)) teamBased = teamBased || 'ipl';

  // If the stored league conflicts with team IDs, trust team IDs.
  if (explicit && teamBased && explicit !== teamBased) return teamBased;
  if (explicit) return explicit;
  if (teamBased) return teamBased;

  const team1Name = String(scorecard?.matchInfo?.team1?.name || '').toLowerCase();
  const team2Name = String(scorecard?.matchInfo?.team2?.name || '').toLowerCase();
  if (team1Name.includes('(wpl)') || team2Name.includes('(wpl)')) return 'wpl';

  return null;
}

function getScorecardTimestamp(scorecard) {
  const candidates = [scorecard?.updatedAt, scorecard?.publishedAt, scorecard?.createdAt];
  for (const value of candidates) {
    const t = new Date(value).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

// Helper: basic admin token check (presence of Bearer token)
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Helper: generate unique ID
function generateId() {
  return `scorecard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const hasAuth = Boolean(request.headers.get('authorization') || request.headers.get('Authorization'));
    const bypassCache = request.headers.get('cache-control')?.includes('no-cache') || url.searchParams.get('nocache') === '1';
    const shouldCache = request.method === 'GET' && !hasAuth && !bypassCache;
    const cache = shouldCache && typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = cache ? new Request(request.url, request) : null;

    if (cache && cacheKey) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    }

    const maybeCache = (response) => {
      if (cache && cacheKey && response && response.ok) {
        response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
        if (context.waitUntil) {
          context.waitUntil(cache.put(cacheKey, response.clone()));
        } else {
          cache.put(cacheKey, response.clone());
        }
      }
      return response;
    };

    const isMatchQuery = url.searchParams.has('matchId');
    const matchId = url.searchParams.get('matchId');
    const leagueParam = normalizeLeague(url.searchParams.get('league'));

    // GET scorecard(s)
    if (request.method === 'GET') {
      if (isMatchQuery && matchId) {
        // Get all scorecards for a specific match
        const list = await env.IPL_CACHE.list({ prefix: 'scorecard_' });
        let scorecards = [];
        
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            if (scorecard.matchId === matchId) {
              scorecards.push(scorecard);
            }
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }

        if (leagueParam) {
          scorecards = scorecards.filter((sc) => inferLeagueFromScorecard(sc) === leagueParam);
        }

        scorecards.sort((a, b) => getScorecardTimestamp(b) - getScorecardTimestamp(a));
        
        return maybeCache(
          new Response(JSON.stringify(scorecards), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        );
      } else {
        // Get all scorecards
        const list = await env.IPL_CACHE.list({ prefix: 'scorecard_' });
        let scorecards = [];
        
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            scorecards.push(scorecard);
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }

        if (leagueParam) {
          scorecards = scorecards.filter((sc) => inferLeagueFromScorecard(sc) === leagueParam);
        }

        scorecards.sort((a, b) => getScorecardTimestamp(b) - getScorecardTimestamp(a));
        
        return maybeCache(
          new Response(JSON.stringify(scorecards), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        );
      }
    }

    // POST new scorecard
    if (request.method === 'POST') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await request.json();
      
      // Validate required fields
      if (!data.matchId || !data.league || !data.matchInfo || !data.innings) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const scorecardId = generateId();
      const scorecard = {
        id: scorecardId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draft: true // Default to draft mode
      };

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(scorecard)
      );

      return new Response(JSON.stringify(scorecard), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scorecard API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
