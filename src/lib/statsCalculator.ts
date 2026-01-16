// Statistics Calculator - Calculate player and team stats from scorecards

interface ScorecardData {
  matchId: string;
  league: string;
  matchInfo: {
    team1: { id: number; name: string };
    team2: { id: number; name: string };
  };
  innings: Array<{
    inningsNumber: number;
    battingTeamId: number;
    batting: Array<{
      playerId: string;
      name: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      strikeRate?: number;
      isCaptain?: boolean;
      dismissal?: { type: string; details?: string };
    }>;
    bowling: Array<{
      playerId: string;
      name: string;
      overs: number;
      balls: number;
      runs: number;
      wickets: number;
      maidens: number;
      economyRate?: number;
      isCaptain?: boolean;
    }>;
    totalRuns?: number;
    totalWickets?: number;
    totalOvers?: number;
  }>;
  result?: {
    winner: string;
    margin: string;
    manOfTheMatch?: string;
  };
  draft?: boolean;
}

interface PlayerBattingStats {
  playerId: string;
  playerName: string;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highestScore: number;
  notOuts: number;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
}

interface PlayerBowlingStats {
  playerId: string;
  playerName: string;
  matches: number;
  innings: number;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  bestBowling: string;
  average: number;
  economy: number;
  strikeRate: number;
  fourWickets: number;
  fiveWickets: number;
}

interface TeamStats {
  teamId: number;
  teamName: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  runsScored: number;
  runsConceded: number;
  wicketsTaken: number;
  wicketsLost: number;
  oversFaced: number;
  oversBowled: number;
  netRunRate: number;
}

interface OrangeCap {
  playerId: string;
  playerName: string;
  runs: number;
  matches: number;
  average: number;
  strikeRate: number;
}

interface PurpleCap {
  playerId: string;
  playerName: string;
  wickets: number;
  matches: number;
  economy: number;
  average: number;
}

export class StatsCalculator {
  private scorecards: ScorecardData[];

  constructor(scorecards: ScorecardData[]) {
    // Filter out draft scorecards
    this.scorecards = scorecards.filter(s => !s.draft);
  }

  // Calculate batting statistics for all players
  calculateBattingStats(): PlayerBattingStats[] {
    const battingMap = new Map<string, PlayerBattingStats>();

    this.scorecards.forEach(scorecard => {
      scorecard.innings.forEach(innings => {
        innings.batting.forEach(batter => {
          if (!batter.playerId) return;

          const existing = battingMap.get(batter.playerId) || {
            playerId: batter.playerId,
            playerName: batter.name,
            matches: 0,
            innings: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            highestScore: 0,
            notOuts: 0,
            average: 0,
            strikeRate: 0,
            fifties: 0,
            hundreds: 0,
          };

          existing.innings += 1;
          existing.runs += batter.runs;
          existing.balls += batter.balls;
          existing.fours += batter.fours;
          existing.sixes += batter.sixes;
          existing.highestScore = Math.max(existing.highestScore, batter.runs);

          if (batter.runs >= 50 && batter.runs < 100) existing.fifties += 1;
          if (batter.runs >= 100) existing.hundreds += 1;

          if (!batter.dismissal || batter.dismissal.type === 'not out') {
            existing.notOuts += 1;
          }

          battingMap.set(batter.playerId, existing);
        });
      });
    });

    // Count unique matches per player
    const playerMatches = new Map<string, Set<string>>();
    this.scorecards.forEach(scorecard => {
      scorecard.innings.forEach(innings => {
        innings.batting.forEach(batter => {
          if (!batter.playerId) return;
          if (!playerMatches.has(batter.playerId)) {
            playerMatches.set(batter.playerId, new Set());
          }
          playerMatches.get(batter.playerId)!.add(scorecard.matchId);
        });
      });
    });

    // Calculate averages and strike rates
    const stats = Array.from(battingMap.values()).map(stat => {
      stat.matches = playerMatches.get(stat.playerId)?.size || 0;
      const dismissals = stat.innings - stat.notOuts;
      stat.average = dismissals > 0 ? parseFloat((stat.runs / dismissals).toFixed(2)) : stat.runs;
      stat.strikeRate = stat.balls > 0 ? parseFloat(((stat.runs / stat.balls) * 100).toFixed(2)) : 0;
      return stat;
    });

    return stats.sort((a, b) => b.runs - a.runs);
  }

  // Calculate bowling statistics for all players
  calculateBowlingStats(): PlayerBowlingStats[] {
    const bowlingMap = new Map<string, PlayerBowlingStats>();

    this.scorecards.forEach(scorecard => {
      scorecard.innings.forEach(innings => {
        innings.bowling.forEach(bowler => {
          if (!bowler.playerId) return;

          const existing = bowlingMap.get(bowler.playerId) || {
            playerId: bowler.playerId,
            playerName: bowler.name,
            matches: 0,
            innings: 0,
            overs: 0,
            balls: 0,
            runs: 0,
            wickets: 0,
            maidens: 0,
            bestBowling: '0/0',
            average: 0,
            economy: 0,
            strikeRate: 0,
            fourWickets: 0,
            fiveWickets: 0,
          };

          existing.innings += 1;
          existing.overs += bowler.overs;
          existing.balls += bowler.balls + (bowler.overs * 6);
          existing.runs += bowler.runs;
          existing.wickets += bowler.wickets;
          existing.maidens += bowler.maidens;

          if (bowler.wickets >= 4 && bowler.wickets < 5) existing.fourWickets += 1;
          if (bowler.wickets >= 5) existing.fiveWickets += 1;

          // Update best bowling figures
          const [currentWkts, currentRuns] = existing.bestBowling.split('/').map(Number);
          if (bowler.wickets > currentWkts || (bowler.wickets === currentWkts && bowler.runs < currentRuns)) {
            existing.bestBowling = `${bowler.wickets}/${bowler.runs}`;
          }

          bowlingMap.set(bowler.playerId, existing);
        });
      });
    });

    // Count unique matches per player
    const playerMatches = new Map<string, Set<string>>();
    this.scorecards.forEach(scorecard => {
      scorecard.innings.forEach(innings => {
        innings.bowling.forEach(bowler => {
          if (!bowler.playerId) return;
          if (!playerMatches.has(bowler.playerId)) {
            playerMatches.set(bowler.playerId, new Set());
          }
          playerMatches.get(bowler.playerId)!.add(scorecard.matchId);
        });
      });
    });

    // Calculate averages, economy rates, and strike rates
    const stats = Array.from(bowlingMap.values()).map(stat => {
      stat.matches = playerMatches.get(stat.playerId)?.size || 0;
      stat.average = stat.wickets > 0 ? parseFloat((stat.runs / stat.wickets).toFixed(2)) : 0;
      const totalOvers = stat.overs + (stat.balls / 6);
      stat.economy = totalOvers > 0 ? parseFloat((stat.runs / totalOvers).toFixed(2)) : 0;
      stat.strikeRate = stat.wickets > 0 ? parseFloat((stat.balls / stat.wickets).toFixed(2)) : 0;
      return stat;
    });

    return stats.sort((a, b) => b.wickets - a.wickets);
  }

  // Calculate team statistics
  calculateTeamStats(): TeamStats[] {
    const teamMap = new Map<number, TeamStats>();

    this.scorecards.forEach(scorecard => {
      const team1Id = scorecard.matchInfo.team1.id;
      const team2Id = scorecard.matchInfo.team2.id;
      const team1Name = scorecard.matchInfo.team1.name;
      const team2Name = scorecard.matchInfo.team2.name;

      // Initialize teams
      if (!teamMap.has(team1Id)) {
        teamMap.set(team1Id, {
          teamId: team1Id,
          teamName: team1Name,
          matches: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          noResults: 0,
          points: 0,
          runsScored: 0,
          runsConceded: 0,
          wicketsTaken: 0,
          wicketsLost: 0,
          oversFaced: 0,
          oversBowled: 0,
          netRunRate: 0,
        });
      }
      if (!teamMap.has(team2Id)) {
        teamMap.set(team2Id, {
          teamId: team2Id,
          teamName: team2Name,
          matches: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          noResults: 0,
          points: 0,
          runsScored: 0,
          runsConceded: 0,
          wicketsTaken: 0,
          wicketsLost: 0,
          oversFaced: 0,
          oversBowled: 0,
          netRunRate: 0,
        });
      }

      const team1Stats = teamMap.get(team1Id)!;
      const team2Stats = teamMap.get(team2Id)!;

      team1Stats.matches += 1;
      team2Stats.matches += 1;

      // Process innings data
      scorecard.innings.forEach(innings => {
        const battingTeamId = innings.battingTeamId;
        const bowlingTeamId = battingTeamId === team1Id ? team2Id : team1Id;

        const battingTeam = teamMap.get(battingTeamId)!;
        const bowlingTeam = teamMap.get(bowlingTeamId)!;

        // Update batting team stats
        battingTeam.runsScored += innings.totalRuns || 0;
        battingTeam.wicketsLost += innings.totalWickets || 0;
        battingTeam.oversFaced += innings.totalOvers || 0;

        // Update bowling team stats
        bowlingTeam.runsConceded += innings.totalRuns || 0;
        bowlingTeam.wicketsTaken += innings.totalWickets || 0;
        bowlingTeam.oversBowled += innings.totalOvers || 0;
      });

      // Determine winner and update points
      if (scorecard.result) {
        const winner = scorecard.result.winner;
        if (winner.includes(team1Name)) {
          team1Stats.wins += 1;
          team1Stats.points += 2;
          team2Stats.losses += 1;
        } else if (winner.includes(team2Name)) {
          team2Stats.wins += 1;
          team2Stats.points += 2;
          team1Stats.losses += 1;
        } else if (winner.toLowerCase().includes('tie')) {
          team1Stats.ties += 1;
          team1Stats.points += 1;
          team2Stats.ties += 1;
          team2Stats.points += 1;
        }
      }
    });

    // Calculate Net Run Rate
    const stats = Array.from(teamMap.values()).map(stat => {
      if (stat.oversFaced > 0 && stat.oversBowled > 0) {
        const runRate = stat.runsScored / stat.oversFaced;
        const concededRate = stat.runsConceded / stat.oversBowled;
        stat.netRunRate = parseFloat((runRate - concededRate).toFixed(3));
      }
      return stat;
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.netRunRate - a.netRunRate;
    });
  }

  // Get Orange Cap (highest run scorer)
  getOrangeCap(): OrangeCap | null {
    const battingStats = this.calculateBattingStats();
    if (battingStats.length === 0) return null;

    const top = battingStats[0];
    return {
      playerId: top.playerId,
      playerName: top.playerName,
      runs: top.runs,
      matches: top.matches,
      average: top.average,
      strikeRate: top.strikeRate,
    };
  }

  // Get Purple Cap (highest wicket taker)
  getPurpleCap(): PurpleCap | null {
    const bowlingStats = this.calculateBowlingStats();
    if (bowlingStats.length === 0) return null;

    const top = bowlingStats[0];
    return {
      playerId: top.playerId,
      playerName: top.playerName,
      wickets: top.wickets,
      matches: top.matches,
      economy: top.economy,
      average: top.average,
    };
  }

  // Get top N batsmen
  getTopBatsmen(limit: number = 10): PlayerBattingStats[] {
    return this.calculateBattingStats().slice(0, limit);
  }

  // Get top N bowlers
  getTopBowlers(limit: number = 10): PlayerBowlingStats[] {
    return this.calculateBowlingStats().slice(0, limit);
  }
}

export type {
  ScorecardData,
  PlayerBattingStats,
  PlayerBowlingStats,
  TeamStats,
  OrangeCap,
  PurpleCap,
};
