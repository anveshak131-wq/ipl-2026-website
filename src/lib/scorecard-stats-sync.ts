/**
 * Auto-sync utility: syncs player stats from published scorecards to player profiles
 * Called whenever a scorecard is published
 */

export interface ScorecardStats {
  playerId: string;
  playerName: string;
  batting?: {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    dismissalType?: string; // 'not-out' or other dismissal types
  };
  bowling?: {
    wickets: number;
    overs: number;
    balls: number;
    runs: number;
    maidens?: number;
    wides?: number;
    noBalls?: number;
  };
}

/**
 * Extract player stats from a scorecard
 */
export function extractPlayerStatsFromScorecard(scorecard: any): ScorecardStats[] {
  const playerStats: { [playerId: string]: ScorecardStats } = {};

  if (!scorecard?.innings || !Array.isArray(scorecard.innings)) {
    return [];
  }

  // Process all innings
  scorecard.innings.forEach((innings: any) => {
    // Process batting stats
    if (Array.isArray(innings.batting)) {
      innings.batting.forEach((batter: any) => {
        const playerId = String(batter.playerId || batter.id || '');
        if (!playerId) return;

        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            playerName: batter.name || ''
          };
        }

        playerStats[playerId].batting = {
          runs: batter.runs || 0,
          balls: batter.balls || 0,
          fours: batter.fours || 0,
          sixes: batter.sixes || 0,
          dismissalType: batter.dismissal?.type || undefined
        };
      });
    }

    // Process bowling stats
    if (Array.isArray(innings.bowling)) {
      innings.bowling.forEach((bowler: any) => {
        const playerId = String(bowler.playerId || bowler.id || '');
        if (!playerId) return;

        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            playerName: bowler.name || ''
          };
        }

        playerStats[playerId].bowling = {
          wickets: bowler.wickets || 0,
          overs: parseFloat(String(bowler.overs || 0)),
          balls: (bowler.balls || 0),
          runs: bowler.runs || 0,
          maidens: bowler.maidens || 0,
          wides: bowler.wides || 0,
          noBalls: bowler.noBalls || 0
        };
      });
    }
  });

  return Object.values(playerStats);
}

/**
 * Calculate aggregated stats to update player profile
 * This increments the player's career stats
 */
export function calculatePlayerStatsUpdates(
  currentStats: any,
  scorecardStats: ScorecardStats
) {
  const updates: any = {
    ...currentStats
  };

  // Update batting stats
  if (scorecardStats.batting) {
    const batting = scorecardStats.batting;
    
    // Increment batting innings
    updates.matches = (updates.matches || 0) + 1;
    updates.runs = (updates.runs || 0) + batting.runs;
    
    // Track batting innings count
    const battingInnings = (updates.battingInnings || 0) + 1;
    updates.battingInnings = battingInnings;

    // Track not-outs
    if (scorecardStats.batting.dismissalType === 'not-out') {
      updates.notOuts = (updates.notOuts || 0) + 1;
    }

    // Track balls faced
    updates.ballsFaced = (updates.ballsFaced || 0) + batting.balls;

    // Track boundaries
    updates.fours = (updates.fours || 0) + batting.fours;
    updates.sixes = (updates.sixes || 0) + batting.sixes;

    // Track milestones
    if (batting.runs >= 50 && batting.runs < 100) {
      updates.fifties = (updates.fifties || 0) + 1;
    }
    if (batting.runs >= 100) {
      updates.hundreds = (updates.hundreds || 0) + 1;
      updates.fifties = (updates.fifties || 0) + 1; // Centuries also count as fifties
    }

    // Update highest score (keep the highest single innings)
    const highest = parseInt(String(updates.highest || 0), 10);
    if (batting.runs > highest) {
      updates.highest = batting.runs;
    }

    // Recalculate batting average
    const dismissals = battingInnings - (updates.notOuts || 0);
    if (dismissals > 0) {
      updates.battingAverage = (updates.runs / dismissals).toFixed(2);
    }

    // Recalculate strike rate
    if (updates.ballsFaced > 0) {
      updates.battingStrikeRate = ((updates.runs / updates.ballsFaced) * 100).toFixed(2);
    }
  }

  // Update bowling stats
  if (scorecardStats.bowling) {
    const bowling = scorecardStats.bowling;
    
    updates.wickets = (updates.wickets || 0) + bowling.wickets;
    
    // Track bowling innings
    const bowlingInnings = (updates.bowlingInnings || 0) + 1;
    updates.bowlingInnings = bowlingInnings;

    // Track overs and runs conceded
    updates.overs = (parseFloat(String(updates.overs || 0)) + bowling.overs).toFixed(1);
    updates.runsConceded = (updates.runsConceded || 0) + bowling.runs;

    // Track maidens
    updates.maidens = (updates.maidens || 0) + (bowling.maidens || 0);

    // Track extras
    updates.wides = (updates.wides || 0) + (bowling.wides || 0);
    updates.noBalls = (updates.noBalls || 0) + (bowling.noBalls || 0);

    // Track bowling milestones (5+ wickets)
    if (bowling.wickets >= 5) {
      updates.fiveWickets = (updates.fiveWickets || 0) + 1;
    }

    // Update best bowling figures
    const currentBest = updates.bestBowling || '0/0';
    const currentWickets = parseInt(currentBest.split('/')[0], 10);
    const bestRuns = parseInt(currentBest.split('/')[1], 10);
    
    if (bowling.wickets > currentWickets || (bowling.wickets === currentWickets && bowling.runs < bestRuns)) {
      updates.bestBowling = `${bowling.wickets}/${bowling.runs}`;
    }

    // Recalculate bowling average
    const bowlingInningsCount = updates.bowlingInnings || 1;
    if (updates.wickets > 0 && bowlingInningsCount > 0) {
      updates.bowlingAverage = (updates.runsConceded / updates.wickets).toFixed(2);
    }

    // Recalculate economy rate
    const oversFloat = parseFloat(String(updates.overs || 0));
    if (oversFloat > 0) {
      updates.economy = ((updates.runsConceded || 0) / oversFloat).toFixed(2);
    }
  }

  return updates;
}

/**
 * Sync scorecard data to player stats
 * Called from frontend when scorecard is published
 */
export async function syncScorecardToPlayers(scorecard: any, authToken?: string): Promise<any> {
  try {
    if (!scorecard?.id || scorecard.draft !== false) {
      console.log('📊 Sync: Skipping - scorecard not published or no ID');
      return { skipped: true, reason: 'Not published' };
    }

    const playerStatsList = extractPlayerStatsFromScorecard(scorecard);
    console.log('📊 Sync: Extracted stats for', playerStatsList.length, 'players');

    if (playerStatsList.length === 0) {
      return { skipped: true, reason: 'No player stats found' };
    }

    // Get auth token if not provided
    const token = authToken || localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    if (!token) {
      console.warn('⚠️ Sync: No auth token available, skipping player stats sync');
      return { skipped: true, reason: 'No auth token' };
    }

    // Call backend sync API
    const response = await fetch('/api/scorecard-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        scorecardId: scorecard.id,
        league: scorecard.league || 'ipl',
        matchId: scorecard.matchId,
        playerStats: playerStatsList
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('⚠️ Sync: API error', error);
      // Don't throw - sync failure shouldn't block scorecard save
      return { success: false, error: error.error || 'Sync API error' };
    }

    const result = await response.json();
    console.log('✅ Sync: Updated stats for', result.updatedCount || 0, 'players');
    
    return { success: true, updatedCount: result.updatedCount, details: result.details };
  } catch (error) {
    console.error('⚠️ Sync: Error syncing scorecard to players', error);
    // Don't throw - sync failure shouldn't block scorecard save
    return { success: false, error: String(error) };
  }
}
