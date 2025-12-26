'use client';

import { Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { Match } from '@/types';

interface PointsSystemDisplayProps {
  matches: Match[];
  league?: 'ipl' | 'wpl';
}

interface TeamPoints {
  teamId: string;
  teamName: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  runsConceded: number;
  oversFaced: number;
  oversBowled: number;
}

export default function PointsSystemDisplay({ matches, league = 'ipl' }: PointsSystemDisplayProps) {
  const calculatePoints = (resultType?: string): number => {
    if (!resultType) return 0;
    switch (resultType) {
      case 'win': return 2;
      case 'tie':
      case 'no-result': return 1;
      case 'loss':
      case 'abandoned': return 0;
      default: return 0;
    }
  };

  const calculateNRR = (
    runsScored: number,
    oversFaced: number,
    runsConceded: number,
    oversBowled: number
  ): number => {
    if (oversFaced === 0 || oversBowled === 0) return 0;
    return (runsScored / oversFaced) - (runsConceded / oversBowled);
  };

  // Calculate team statistics
  const teamStats = new Map<string, TeamPoints>();

  matches.forEach((match) => {
    if (match.status !== 'completed' || !match.resultType) return;

    const team1Id = typeof match.team1 === 'string' ? match.team1 : match.team1.id;
    const team2Id = typeof match.team2 === 'string' ? match.team2 : match.team2.id;
    const team1Name = typeof match.team1 === 'string' ? match.team1 : match.team1.name;
    const team2Name = typeof match.team2 === 'string' ? match.team2 : match.team2.name;

    // Initialize teams if not exists
    if (!teamStats.has(team1Id)) {
      teamStats.set(team1Id, {
        teamId: team1Id,
        teamName: team1Name,
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        noResults: 0,
        points: 0,
        netRunRate: 0,
        runsScored: 0,
        runsConceded: 0,
        oversFaced: 0,
        oversBowled: 0,
      });
    }
    if (!teamStats.has(team2Id)) {
      teamStats.set(team2Id, {
        teamId: team2Id,
        teamName: team2Name,
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        noResults: 0,
        points: 0,
        netRunRate: 0,
        runsScored: 0,
        runsConceded: 0,
        oversFaced: 0,
        oversBowled: 0,
      });
    }

    const team1Stats = teamStats.get(team1Id)!;
    const team2Stats = teamStats.get(team2Id)!;

    // Update match counts
    team1Stats.matches++;
    team2Stats.matches++;

    // Update result counts and points
    if (match.resultType === 'win') {
      // Determine winner from result string or score
      const team1Won = match.result?.includes(team1Name) || 
                      (match.score && match.score.team1.runs > match.score.team2.runs);
      if (team1Won) {
        team1Stats.wins++;
        team1Stats.points += 2;
        team2Stats.losses++;
      } else {
        team2Stats.wins++;
        team2Stats.points += 2;
        team1Stats.losses++;
      }
    } else if (match.resultType === 'tie') {
      team1Stats.ties++;
      team1Stats.points += 1;
      team2Stats.ties++;
      team2Stats.points += 1;
    } else if (match.resultType === 'no-result') {
      team1Stats.noResults++;
      team1Stats.points += 1;
      team2Stats.noResults++;
      team2Stats.points += 1;
    } else if (match.resultType === 'loss') {
      // This shouldn't happen, but handle it
      team1Stats.losses++;
      team2Stats.losses++;
    }

    // Update runs and overs for NRR calculation
    if (match.score) {
      team1Stats.runsScored += match.score.team1.runs;
      team1Stats.runsConceded += match.score.team2.runs;
      team1Stats.oversFaced += match.score.team1.overs;
      team1Stats.oversBowled += match.score.team2.overs;

      team2Stats.runsScored += match.score.team2.runs;
      team2Stats.runsConceded += match.score.team1.runs;
      team2Stats.oversFaced += match.score.team2.overs;
      team2Stats.oversBowled += match.score.team1.overs;
    }
  });

  // Calculate NRR for all teams
  teamStats.forEach((stats) => {
    stats.netRunRate = calculateNRR(
      stats.runsScored,
      stats.oversFaced,
      stats.runsConceded,
      stats.oversBowled
    );
  });

  // Sort by points (descending), then by NRR (descending)
  const sortedTeams = Array.from(teamStats.values()).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.netRunRate - a.netRunRate;
  });

  const colors = league === 'ipl' 
    ? {
        bg: 'bg-slate-800/50',
        border: 'border-slate-700/30',
        accent: 'text-blue-400',
        header: 'bg-slate-700/50',
      }
    : {
        bg: 'bg-purple-900/20',
        border: 'border-purple-700/30',
        accent: 'text-purple-400',
        header: 'bg-purple-700/50',
      };

  return (
    <div className={`${colors.bg} rounded-xl p-6 border-2 ${colors.border} backdrop-blur-xl`}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className={`w-6 h-6 ${colors.accent}`} />
        <h3 className="text-xl font-bold text-white">Points Table</h3>
      </div>

      {sortedTeams.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No completed matches yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${colors.header} border-b border-white/10`}>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Pos</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Team</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">M</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">W</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">L</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">T</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">NR</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Pts</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">NRR</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => (
                <tr
                  key={team.teamId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-bold">{index + 1}</td>
                  <td className="py-3 px-4 text-white font-semibold">{team.teamName}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{team.matches}</td>
                  <td className="py-3 px-4 text-center text-green-400 font-semibold">{team.wins}</td>
                  <td className="py-3 px-4 text-center text-red-400">{team.losses}</td>
                  <td className="py-3 px-4 text-center text-yellow-400">{team.ties}</td>
                  <td className="py-3 px-4 text-center text-gray-400">{team.noResults}</td>
                  <td className="py-3 px-4 text-center text-white font-bold text-lg">{team.points}</td>
                  <td className={`py-3 px-4 text-center font-semibold ${
                    team.netRunRate >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {team.netRunRate.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4" />
          <span className="font-semibold">Points System:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>Win = 2 points</div>
          <div>Tie = 1 point each</div>
          <div>No Result = 1 point each</div>
          <div>Loss = 0 points</div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)</span>
        </div>
      </div>
    </div>
  );
}

