// Proxy for Cricbuzz Cricket API via RapidAPI
// Exposes a simplified matches list for the world-cricket page.

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method || 'GET';

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.RAPIDAPI_CRICBUZZ_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Cricbuzz RapidAPI key is not configured on the server.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const commonHeaders = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
  };

  async function fetchMatches(path) {
    const upstreamUrl = `https://cricbuzz-cricket.p.rapidapi.com${path}`;
    const res = await fetch(upstreamUrl, {
      headers: commonHeaders,
      cf: {
        cacheTtl: 20,
        cacheEverything: true,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to fetch ${path}: ${res.status} ${text.slice(0, 300)}`);
    }

    return res.json();
  }

  function normaliseMatches(json) {
    const results = [];
    const typeMatches = Array.isArray(json?.typeMatches) ? json.typeMatches : [];

    for (const typeBlock of typeMatches) {
      const matchTypeLabel = typeBlock?.matchType || '';
      const seriesMatches = Array.isArray(typeBlock?.seriesMatches) ? typeBlock.seriesMatches : [];

      for (const seriesMatch of seriesMatches) {
        const wrapper = seriesMatch?.seriesAdWrapper || seriesMatch;
        const seriesName = wrapper?.seriesName || '';
        const games = Array.isArray(wrapper?.matches) ? wrapper.matches : [];

        for (const game of games) {
          const info = game?.matchInfo || {};
          const score = game?.matchScore || {};

          const matchId =
            info?.matchId !== undefined && info?.matchId !== null
              ? String(info.matchId)
              : null;

          if (!matchId) continue;

          const team1 = info?.team1 || {};
          const team2 = info?.team2 || {};

          const team1Short = team1.teamSName || team1.teamName || '';
          const team2Short = team2.teamSName || team2.teamName || '';

          const teams = [];
          if (team1Short) teams.push(team1Short);
          if (team2Short) teams.push(team2Short);

          const teamInfo = [
            {
              name: team1.teamName || undefined,
              shortname: team1.teamSName || undefined,
            },
            {
              name: team2.teamName || undefined,
              shortname: team2.teamSName || undefined,
            },
          ];

          const venueInfo = info?.venueInfo || {};
          const venueParts = [];
          if (venueInfo.ground) venueParts.push(venueInfo.ground);
          if (venueInfo.city) venueParts.push(venueInfo.city);
          if (venueInfo.country) venueParts.push(venueInfo.country);
          const venue = venueParts.join(', ');

          let dateTimeGMT = '';
          const rawStart = info?.startDate;
          const startMs = rawStart !== undefined && rawStart !== null ? Number(rawStart) : NaN;
          if (!Number.isNaN(startMs) && startMs > 0) {
            dateTimeGMT = new Date(startMs).toISOString();
          }

          const status = info?.status || '';
          const matchFormat = info?.matchFormat || info?.matchType || '';

          function formatTeamScore(teamScore) {
            if (!teamScore || typeof teamScore !== 'object') return '';

            const anyScore = teamScore;
            let inngs = anyScore.inngs1 || anyScore.innings1 || null;
            if (!inngs) {
              const keys = Object.keys(anyScore);
              if (keys.length > 0 && typeof anyScore[keys[0]] === 'object') {
                inngs = anyScore[keys[0]];
              }
            }
            if (!inngs) return '';

            const runs = inngs.runs ?? inngs.runsScored;
            const wickets = inngs.wickets ?? inngs.wkts;
            const overs = inngs.overs ?? inngs.oversBowled;

            let s = '';
            if (typeof runs === 'number') s += String(runs);
            if (typeof wickets === 'number') {
              s += s ? `/${wickets}` : String(wickets);
            }
            if (overs !== undefined && overs !== null) {
              s += s ? ` (${overs})` : String(overs);
            }

            return s;
          }

          const team1ScoreStr = formatTeamScore(score?.team1Score);
          const team2ScoreStr = formatTeamScore(score?.team2Score);

          let scoreStr = '';
          if (team1Short && team1ScoreStr) {
            scoreStr += `${team1Short} ${team1ScoreStr}`;
          }
          if (team2Short && team2ScoreStr) {
            scoreStr += scoreStr ? ' vs ' : '';
            scoreStr += `${team2Short} ${team2ScoreStr}`;
          }

          let name = '';
          if (team1Short && team2Short) {
            name = `${team1Short} vs ${team2Short}`;
          } else if (info?.matchDesc) {
            name = info.matchDesc;
          } else if (seriesName) {
            name = seriesName;
          } else {
            name = 'Cricket match';
          }

          results.push({
            id: matchId,
            name,
            status,
            score: scoreStr,
            teams,
            teamInfo,
            venue,
            dateTimeGMT,
            matchType: matchFormat || matchTypeLabel,
            team1ScoreText: team1ScoreStr || '',
            team2ScoreText: team2ScoreStr || '',
            seriesName,
          });
        }
      }
    }

    return results;
  }

  try {
    const [liveJson, upcomingJson, recentJson] = await Promise.all([
      fetchMatches('/matches/v1/live'),
      fetchMatches('/matches/v1/upcoming'),
      fetchMatches('/matches/v1/recent'),
    ]);

    const allMatches = [
      ...normaliseMatches(liveJson),
      ...normaliseMatches(upcomingJson),
      ...normaliseMatches(recentJson),
    ];

    // Deduplicate by id in case the same match appears in multiple buckets
    const seen = new Set();
    const deduped = [];
    for (const m of allMatches) {
      if (!m.id || seen.has(m.id)) continue;
      seen.add(m.id);
      deduped.push(m);
    }

    const responseBody = {
      status: 'success',
      provider: 'cricbuzz',
      source: 'matches-v1',
      count: deduped.length,
      matches: deduped,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error calling Cricbuzz RapidAPI matches endpoints:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error calling Cricbuzz RapidAPI matches endpoints' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
