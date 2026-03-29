/**
 * API handler for syncing scorecard stats to player profiles
 * POST /api/scorecard-sync
 * 
 * Body: {
 *   scorecardId: string,
 *   league: 'ipl' | 'wpl',
 *   matchId: string,
 *   playerStats: {
 *     playerId: string,
 *     playerName: string,
 *     batting?: { runs, balls, fours, sixes, dismissalType },
 *     bowling?: { wickets, overs, balls, runs, maidens, wides, noBalls }
 *   }[]
 * }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    // Verify admin token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { scorecardId, league = 'ipl', matchId, playerStats = [], force = false } = data;

    if (!scorecardId || !playerStats || playerStats.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedLeague = league === 'wpl' ? 'wpl' : 'ipl';

    const normalizePlayerLeague = (player) => {
      const explicit = String(player?.league || '').trim().toLowerCase();
      if (explicit === 'ipl' || explicit === 'wpl') return explicit;
      const teamId = String(player?.teamId || '').trim();
      if (['11', '12', '13', '14', '15'].includes(teamId)) return 'wpl';
      return 'ipl';
    };

    const syncKey = `scorecardSync:${scorecardId}`;
    let alreadySyncedPlayerIds = new Set();
    if (!force) {
      try {
        const existing = await env.IPL_CACHE.get(syncKey, 'json');
        if (existing && typeof existing === 'object') {
          const ids = Array.isArray(existing.playerIds) ? existing.playerIds.map(String) : [];
          alreadySyncedPlayerIds = new Set(ids.filter(Boolean));
        }
      } catch (e) {
        // If the sync marker is corrupted, ignore and proceed.
        console.warn('[Scorecard Sync] Failed to read sync marker:', e);
      }
    }

    const incomingPlayerStats = Array.isArray(playerStats) ? playerStats : [];
    const pendingPlayerStats = incomingPlayerStats.filter((p) => {
      const id = String(p?.playerId || '').trim();
      if (!id) return false;
      if (force) return true;
      return !alreadySyncedPlayerIds.has(id);
    });

    if (!force && pendingPlayerStats.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Already synced for this scorecard',
          scorecardId,
          matchId,
          updatedCount: 0,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = Array.isArray(playersData) ? playersData : [];

    console.log(`[Scorecard Sync] Processing ${playerStats.length} players for match ${matchId}`);

    const updatedPlayers = [];
    const errors = [];

    // Process each player's stats
    for (const playerStat of pendingPlayerStats) {
      try {
        const playerId = String(playerStat.playerId || '').trim();
        if (!playerId) {
          console.warn('[Scorecard Sync] Skipping player with no ID');
          continue;
        }

        let playerIndex = players.findIndex(
          (p) => String(p?.id || '').trim() === playerId && normalizePlayerLeague(p) === normalizedLeague
        );
        if (playerIndex === -1) {
          const byId = players
            .map((p, index) => ({ p, index }))
            .filter(({ p }) => String(p?.id || '').trim() === playerId);
          if (byId.length === 1) {
            playerIndex = byId[0].index;
          }
        }

        if (playerIndex === -1) {
          console.warn(`[Scorecard Sync] Player ${playerId} not found in players list`);
          errors.push({
            playerId,
            error: 'Player not found in /api/players dataset',
          });
          continue;
        }

        const player = players[playerIndex];
        const currentStats = player?.stats || {};

        // Calculate new stats
        const updatedStats = calculatePlayerStatsUpdates(currentStats, playerStat);

        // Update player with new stats
        players[playerIndex] = {
          ...player,
          stats: updatedStats,
          updatedAt: new Date().toISOString(),
          lastSyncScorecard: scorecardId,
        };
        
        console.log(`[Scorecard Sync] Updated player ${playerId}:`, {
          batting: !!playerStat.batting,
          bowling: !!playerStat.bowling,
          runs: updatedStats.runs,
          wickets: updatedStats.wickets
        });

        updatedPlayers.push({
          playerId,
          playerName: playerStat.playerName,
          batting: !!playerStat.batting,
          bowling: !!playerStat.bowling,
          stats: {
            runs: updatedStats.runs,
            wickets: updatedStats.wickets,
            battingAverage: updatedStats.battingAverage,
            bowlingAverage: updatedStats.bowlingAverage
          }
        });
      } catch (error) {
        console.error(`[Scorecard Sync] Error updating player ${playerStat.playerId}:`, error);
        errors.push({
          playerId: playerStat.playerId,
          error: String(error)
        });
      }
    }

    if (updatedPlayers.length > 0) {
      await env.IPL_CACHE.put('players', JSON.stringify(players));
    }

    // Write sync marker to avoid double-counting on repeated publishes/saves.
    // Store the playerIds updated so partial retries don't double count.
    if (!force) {
      try {
        const existing = await env.IPL_CACHE.get(syncKey, 'json');
        const existingIds = Array.isArray(existing?.playerIds) ? existing.playerIds.map(String) : [];
        const nextIds = new Set([...existingIds, ...updatedPlayers.map((p) => String(p.playerId || '').trim())]);
        const nextIdList = Array.from(nextIds).filter(Boolean);
        const marker = {
          scorecardId,
          matchId,
          league: normalizedLeague,
          playerIds: nextIdList,
          updatedCount: nextIdList.length,
          syncedAt: new Date().toISOString(),
        };
        await env.IPL_CACHE.put(syncKey, JSON.stringify(marker));
      } catch (e) {
        console.warn('[Scorecard Sync] Failed to write sync marker:', e);
      }
    }

    console.log(`[Scorecard Sync] Completed: ${updatedPlayers.length} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      scorecardId,
      matchId,
      skipped: false,
      updatedCount: updatedPlayers.length,
      details: updatedPlayers,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[Scorecard Sync] Server error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Helper: Calculate updated player stats from scorecard performance
 */
function calculatePlayerStatsUpdates(currentStats, scorecardStats) {
  const updates = { ...currentStats };
  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  let matchCounted = false;
  const ensureMatchCounted = () => {
    if (matchCounted) return;
    updates.matches = toNumber(updates.matches) + 1;
    matchCounted = true;
  };

  // Update batting stats
  if (scorecardStats.batting) {
    const batting = scorecardStats.batting;
    
    ensureMatchCounted();
    updates.runs = toNumber(updates.runs) + toNumber(batting.runs);
    
    const battingInnings = toNumber(updates.battingInnings) + 1;
    updates.battingInnings = battingInnings;

    if (scorecardStats.batting.dismissalType === 'not-out' || scorecardStats.batting.dismissalType === 'retired-hurt') {
      updates.notOuts = toNumber(updates.notOuts) + 1;
    }

    updates.ballsFaced = toNumber(updates.ballsFaced) + toNumber(batting.balls);
    updates.fours = toNumber(updates.fours) + toNumber(batting.fours);
    updates.sixes = toNumber(updates.sixes) + toNumber(batting.sixes);

    if (batting.runs >= 50 && batting.runs < 100) {
      updates.fifties = toNumber(updates.fifties) + 1;
    }
    if (batting.runs >= 100) {
      updates.hundreds = toNumber(updates.hundreds) + 1;
      updates.fifties = toNumber(updates.fifties) + 1;
    }

    const highest = parseInt(String(updates.highest || 0), 10);
    if (batting.runs > highest) {
      updates.highest = batting.runs;
    }

    const dismissals = battingInnings - toNumber(updates.notOuts);
    if (dismissals > 0) {
      updates.battingAverage = (updates.runs / dismissals).toFixed(2);
    }

    if (toNumber(updates.ballsFaced) > 0) {
      updates.battingStrikeRate = ((toNumber(updates.runs) / toNumber(updates.ballsFaced)) * 100).toFixed(2);
    }
  }

  // Update bowling stats
  if (scorecardStats.bowling) {
    const bowling = scorecardStats.bowling;
    
    ensureMatchCounted();
    updates.wickets = toNumber(updates.wickets) + toNumber(bowling.wickets);
    
    const bowlingInnings = toNumber(updates.bowlingInnings) + 1;
    updates.bowlingInnings = bowlingInnings;

    const oversValue = parseFloat(String(bowling.overs || 0));
    updates.overs = (parseFloat(String(updates.overs || 0)) + oversValue).toFixed(1);
    updates.runsConceded = toNumber(updates.runsConceded) + toNumber(bowling.runs);

    updates.maidens = toNumber(updates.maidens) + toNumber(bowling.maidens);
    updates.wides = toNumber(updates.wides) + toNumber(bowling.wides);
    updates.noBalls = toNumber(updates.noBalls) + toNumber(bowling.noBalls);

    if (bowling.wickets >= 5) {
      updates.fiveWickets = toNumber(updates.fiveWickets) + 1;
    }

    const currentBest = updates.bestBowling || '0/0';
    const currentWickets = parseInt(currentBest.split('/')[0], 10);
    const bestRuns = parseInt(currentBest.split('/')[1], 10);
    
    if (bowling.wickets > currentWickets || (bowling.wickets === currentWickets && bowling.runs < bestRuns)) {
      updates.bestBowling = `${bowling.wickets}/${bowling.runs}`;
    }

    const bowlingInningsCount = updates.bowlingInnings || 1;
    if (updates.wickets > 0 && bowlingInningsCount > 0) {
      updates.bowlingAverage = (updates.runsConceded / updates.wickets).toFixed(2);
    }

    const oversFloat = parseFloat(String(updates.overs || 0));
    if (oversFloat > 0) {
      updates.economy = ((updates.runsConceded || 0) / oversFloat).toFixed(2);
    }
  }

  return updates;
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
