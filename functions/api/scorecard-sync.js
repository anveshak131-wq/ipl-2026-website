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

    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = Array.isArray(playersData) ? playersData : [];

    console.log(`[Scorecard Sync] Processing ${playerStats.length} players for match ${matchId}`);

    const updatedPlayers = [];
    const backfilledPlayers = [];
    const errors = [];

    // Process each player's stats
    for (const playerStat of incomingPlayerStats) {
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

        const isAlreadySynced = !force && alreadySyncedPlayerIds.has(playerId);

        // Calculate new stats. If already synced, only backfill missing bowling balls derived from overs.
        const updatedStats = isAlreadySynced
          ? calculatePlayerStatsBackfillUpdates(currentStats, playerStat)
          : calculatePlayerStatsUpdates(currentStats, playerStat);

        if (!updatedStats) {
          continue;
        }

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

        const record = {
          playerId,
          playerName: playerStat.playerName,
          batting: !!playerStat.batting,
          bowling: !!playerStat.bowling,
          backfilled: isAlreadySynced,
          stats: {
            runs: updatedStats.runs,
            wickets: updatedStats.wickets,
            balls: updatedStats.balls,
            overs: updatedStats.overs,
            battingAverage: updatedStats.battingAverage,
            bowlingAverage: updatedStats.bowlingAverage,
            economy: updatedStats.economy,
          }
        };

        if (isAlreadySynced) backfilledPlayers.push(record);
        else updatedPlayers.push(record);
      } catch (error) {
        console.error(`[Scorecard Sync] Error updating player ${playerStat.playerId}:`, error);
        errors.push({
          playerId: playerStat.playerId,
          error: String(error)
        });
      }
    }

    if (updatedPlayers.length > 0 || backfilledPlayers.length > 0) {
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

    const didAnyUpdate = updatedPlayers.length > 0 || backfilledPlayers.length > 0;
    if (!force && !didAnyUpdate) {
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

    console.log(
      `[Scorecard Sync] Completed: ${updatedPlayers.length} updated, ${backfilledPlayers.length} backfilled, ${errors.length} errors`
    );

    return new Response(JSON.stringify({
      success: true,
      scorecardId,
      matchId,
      skipped: false,
      updatedCount: updatedPlayers.length + backfilledPlayers.length,
      details: [...updatedPlayers, ...backfilledPlayers],
      backfilledCount: backfilledPlayers.length,
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
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Convert overs to balls.
// Supports cricket notation (e.g. 4.2 = 4 overs + 2 balls) and true decimal overs (e.g. 4.3333).
const oversToBalls = (oversValue) => {
  if (oversValue === null || oversValue === undefined) return 0;
  const numeric = Number(oversValue);
  if (Number.isFinite(numeric)) {
    if (Number.isInteger(numeric)) return Math.max(0, numeric * 6);
    const wholeOvers = Math.floor(numeric);
    const fractional = numeric - wholeOvers;
    const ballsByNotation = Math.round(fractional * 10);
    const looksLikeNotation = Math.abs(fractional * 10 - ballsByNotation) < 1e-6;
    if (looksLikeNotation) return Math.max(0, wholeOvers * 6 + ballsByNotation);
    return Math.max(0, Math.round(numeric * 6));
  }

  const str = String(oversValue || '').trim();
  if (!str) return 0;
  const match = str.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return 0;
  const wholeOvers = parseInt(match[1], 10) || 0;
  const ballsPart = match[2] ? parseInt(match[2], 10) || 0 : 0;
  return Math.max(0, wholeOvers * 6 + ballsPart);
};

const formatOversFromBalls = (balls) => {
  const totalBalls = toNumber(balls);
  if (totalBalls <= 0) return '0.0';
  const overs = Math.floor(totalBalls / 6);
  const rem = totalBalls % 6;
  return `${overs}.${rem}`;
};

function calculatePlayerStatsUpdates(currentStats, scorecardStats) {
  const updates = { ...currentStats };

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

    // Ensure we keep "balls bowled" as the canonical store; convert overs to balls when needed.
    // If older data has overs but missing balls, migrate overs->balls in-place (no double-count).
    let existingBalls = toNumber(updates.balls);
    if (existingBalls === 0) {
      const derivedFromOvers = oversToBalls(updates.overs);
      if (derivedFromOvers > 0) {
        existingBalls = derivedFromOvers;
        updates.balls = derivedFromOvers;
      }
    }

    const matchBallsRaw = toNumber(bowling.balls);
    const matchBalls = matchBallsRaw > 0 ? matchBallsRaw : oversToBalls(bowling.overs);
    updates.balls = existingBalls + matchBalls;
    updates.overs = formatOversFromBalls(updates.balls);
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

    const totalBalls = toNumber(updates.balls);
    if (totalBalls > 0) {
      updates.economy = ((toNumber(updates.runsConceded) * 6) / totalBalls).toFixed(2);
      if (toNumber(updates.wickets) > 0) {
        updates.bowlingStrikeRate = (totalBalls / toNumber(updates.wickets)).toFixed(2);
      }
    }
  }

  return updates;
}

/**
 * Helper: Backfill missing bowling balls after a scorecard was already synced (prevents double counting).
 */
function calculatePlayerStatsBackfillUpdates(currentStats, scorecardStats) {
  const updates = { ...currentStats };

  const hasBowling = Boolean(scorecardStats?.bowling);
  if (!hasBowling) return null;

  const currentBalls = toNumber(updates.balls);
  const derivedFromExistingOvers = oversToBalls(updates.overs);

  const matchBallsRaw = toNumber(scorecardStats?.bowling?.balls);
  const matchBalls = matchBallsRaw > 0 ? matchBallsRaw : oversToBalls(scorecardStats?.bowling?.overs);

  let nextBalls = currentBalls;
  if (derivedFromExistingOvers > nextBalls) nextBalls = derivedFromExistingOvers;
  if (nextBalls === 0 && matchBalls > 0) nextBalls = matchBalls;

  if (nextBalls === currentBalls) return null;

  updates.balls = nextBalls;
  updates.overs = formatOversFromBalls(nextBalls);

  const wickets = toNumber(updates.wickets);
  const runsConceded = toNumber(updates.runsConceded);

  if (nextBalls > 0) {
    updates.economy = ((runsConceded * 6) / nextBalls).toFixed(2);
    if (wickets > 0) {
      updates.bowlingStrikeRate = (nextBalls / wickets).toFixed(2);
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
