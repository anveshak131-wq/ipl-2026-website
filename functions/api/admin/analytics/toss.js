/**
 * Cloudflare Pages Function for /api/admin/analytics/toss
 * Computes toss luck & toss-vs-result analytics from one or more datasets
 * stored in Workers KV.
 */

// Normalise team names so that historical franchises that were renamed are
// aggregated under their current identities.
const normalizeTeamName = (name) => {
  if (!name) return name;
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();

  // Delhi Daredevils -> Delhi Capitals
  if (lower === 'delhi daredevils') {
    return 'Delhi Capitals';
  }

  // Kings XI / Eleven Punjab -> Punjab Kings
  if (lower === 'kings xi punjab' || lower === 'kings eleven punjab') {
    return 'Punjab Kings';
  }

  return trimmed;
};

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let email = tokenValue;
    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          email = parsed.email;
        }
      } catch {
        // fall back to raw tokenValue
      }
    }

    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const { datasetKeys, datasetWeights } = body;

    if (!Array.isArray(datasetKeys) || datasetKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'datasetKeys must be a non-empty array of dataset keys' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const trimmedKeys = datasetKeys
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k);

    if (trimmedKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'datasetKeys must contain at least one non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Optional per-dataset weighting: admins can upweight more recent datasets.
    const rawWeightsByKey = {};
    if (datasetWeights && typeof datasetWeights === 'object') {
      for (const [rawKey, rawVal] of Object.entries(datasetWeights)) {
        if (!rawKey) continue;
        const key = String(rawKey).trim();
        if (!key) continue;
        const num = Number(rawVal);
        if (!Number.isFinite(num) || num <= 0) continue;
        rawWeightsByKey[key] = num;
      }
    }

    // Normalise weights so they sum to 1 across the selected datasetKeys.
    const normalisedWeightsByKey = {};
    let totalWeight = 0;
    for (const key of trimmedKeys) {
      const candidate = Number(rawWeightsByKey[key]);
      const w = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
      normalisedWeightsByKey[key] = w;
      totalWeight += w;
    }

    if (totalWeight > 0) {
      for (const key of trimmedKeys) {
        normalisedWeightsByKey[key] = normalisedWeightsByKey[key] / totalWeight;
      }
    } else {
      const equal = 1 / trimmedKeys.length;
      for (const key of trimmedKeys) {
        normalisedWeightsByKey[key] = equal;
      }
    }

    // Aggregation structures
    const teamStats = new Map();
    const perVenue = new Map(); // key: `${team}||${venue}` -> stats

    let totalMatches = 0;

    const ensureTeamEntry = (teamName) => {
      if (!teamStats.has(teamName)) {
        teamStats.set(teamName, {
          team: teamName,
          matches: 0,
          tossesWon: 0,
          matchesWhenWinToss: 0,
          winsWhenWinToss: 0,
          matchesWhenLoseToss: 0,
          winsWhenLoseToss: 0,
          wins: 0,
        });
      }
      return teamStats.get(teamName);
    };

    const ensureVenueEntry = (teamName, venueName) => {
      const key = `${teamName}||${venueName}`;
      if (!perVenue.has(key)) {
        perVenue.set(key, {
          team: teamName,
          venue: venueName,
          matches: 0,
          matchesWhenWinToss: 0,
          winsWhenWinToss: 0,
          matchesWhenLoseToss: 0,
          winsWhenLoseToss: 0,
        });
      }
      return perVenue.get(key);
    };

    for (const key of trimmedKeys) {
      const value = await env.SPORTS_KV.get(`dataset:${key}`);
      if (!value) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' not found` }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;

      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const idxTeam1 = headers.indexOf('team1');
      const idxTeam2 = headers.indexOf('team2');
      const idxTossWinner = headers.indexOf('toss_winner');
      let idxWinningTeam = headers.indexOf('winning_team');
      if (idxWinningTeam === -1) {
        idxWinningTeam = headers.indexOf('match_winner');
      }
      const idxVenue = headers.indexOf('venue');

      if (idxTeam1 === -1 || idxTeam2 === -1 || idxTossWinner === -1 || idxWinningTeam === -1) {
        return new Response(
          JSON.stringify({
            error:
              `Dataset '${key}' must contain team1, team2, toss_winner, and winning_team or match_winner columns for toss analytics`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const datasetWeight = normalisedWeightsByKey[key] ?? 1 / trimmedKeys.length;

      for (const row of rows) {
        if (!Array.isArray(row)) continue;

        const team1 = normalizeTeamName(row[idxTeam1]);
        const team2 = normalizeTeamName(row[idxTeam2]);
        const tossWinner = normalizeTeamName(row[idxTossWinner]);
        const winningTeam = normalizeTeamName(row[idxWinningTeam]);
        const venue = idxVenue !== -1 ? row[idxVenue] : undefined;

        if (!team1 || !team2) continue;

        // Skip rows with no tossWinner or no winningTeam only for per-result stats
        const hasToss = tossWinner && typeof tossWinner === 'string';
        const hasResult = winningTeam && typeof winningTeam === 'string';

        // Each row is a match between team1 and team2.
        // Keep totalMatches as a raw count, but scale team/venue stats by datasetWeight
        // so newer datasets can have more influence.
        totalMatches++;

        const w = datasetWeight;

        // Ensure entries
        const t1 = ensureTeamEntry(team1);
        const t2 = ensureTeamEntry(team2);
        t1.matches += w;
        t2.matches += w;

        if (hasResult) {
          if (winningTeam === team1) {
            t1.wins += w;
          } else if (winningTeam === team2) {
            t2.wins += w;
          }
        }

        if (hasToss) {
          if (tossWinner === team1) {
            t1.tossesWon += w;
            t1.matchesWhenWinToss += w;
            if (hasResult && winningTeam === team1) {
              t1.winsWhenWinToss += w;
            }
            // team2 lost toss
            t2.matchesWhenLoseToss += w;
            if (hasResult && winningTeam === team2) {
              t2.winsWhenLoseToss += w;
            }
          } else if (tossWinner === team2) {
            t2.tossesWon += w;
            t2.matchesWhenWinToss += w;
            if (hasResult && winningTeam === team2) {
              t2.winsWhenWinToss += w;
            }
            // team1 lost toss
            t1.matchesWhenLoseToss += w;
            if (hasResult && winningTeam === team1) {
              t1.winsWhenLoseToss += w;
            }
          }
        }

        // Per-venue stats (optional)
        if (venue && typeof venue === 'string') {
          const v1 = ensureVenueEntry(team1, venue);
          const v2 = ensureVenueEntry(team2, venue);
          v1.matches += w;
          v2.matches += w;

          if (hasToss) {
            if (tossWinner === team1) {
              v1.matchesWhenWinToss += w;
              if (hasResult && winningTeam === team1) {
                v1.winsWhenWinToss += w;
              }
              v2.matchesWhenLoseToss += w;
              if (hasResult && winningTeam === team2) {
                v2.winsWhenLoseToss += w;
              }
            } else if (tossWinner === team2) {
              v2.matchesWhenWinToss += w;
              if (hasResult && winningTeam === team2) {
                v2.winsWhenWinToss += w;
              }
              v1.matchesWhenLoseToss += w;
              if (hasResult && winningTeam === team1) {
                v1.winsWhenLoseToss += w;
              }
            }
          }
        }
      }
    }

    // Convert maps to arrays and compute percentages
    const teams = Array.from(teamStats.values()).map((t) => {
      const tossWinPct = t.matches > 0 ? t.tossesWon / t.matches : 0;
      const winPctWhenWinToss =
        t.matchesWhenWinToss > 0 ? t.winsWhenWinToss / t.matchesWhenWinToss : 0;
      const winPctWhenLoseToss =
        t.matchesWhenLoseToss > 0 ? t.winsWhenLoseToss / t.matchesWhenLoseToss : 0;
      const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;

      return {
        team: t.team,
        matches: t.matches,
        tossesWon: t.tossesWon,
        tossWinPct,
        wins: t.wins,
        matchesWhenWinToss: t.matchesWhenWinToss,
        winsWhenWinToss: t.winsWhenWinToss,
        winPctWhenWinToss,
        matchesWhenLoseToss: t.matchesWhenLoseToss,
        winsWhenLoseToss: t.winsWhenLoseToss,
        winPctWhenLoseToss,
        tossImpact,
      };
    });

    // Group per-venue stats by team
    const perVenueByTeam = {};
    for (const v of perVenue.values()) {
      if (!perVenueByTeam[v.team]) {
        perVenueByTeam[v.team] = [];
      }
      const winPctWhenWinToss =
        v.matchesWhenWinToss > 0 ? v.winsWhenWinToss / v.matchesWhenWinToss : 0;
      const winPctWhenLoseToss =
        v.matchesWhenLoseToss > 0 ? v.winsWhenLoseToss / v.matchesWhenLoseToss : 0;
      const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;

      perVenueByTeam[v.team].push({
        team: v.team,
        venue: v.venue,
        matches: v.matches,
        matchesWhenWinToss: v.matchesWhenWinToss,
        winsWhenWinToss: v.winsWhenWinToss,
        winPctWhenWinToss,
        matchesWhenLoseToss: v.matchesWhenLoseToss,
        winsWhenLoseToss: v.winsWhenLoseToss,
        winPctWhenLoseToss,
        tossImpact,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        datasetKeys: trimmedKeys,
        totals: {
          totalMatches,
        },
        teams,
        perVenue: perVenueByTeam,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Toss analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
