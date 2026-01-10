'use client';

import { useState, useEffect } from 'react';

interface Batter {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: { type: string };
}

interface Bowler {
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  economyRate: number;
}

interface Innings {
  battingTeamId: number;
  batting: Batter[];
  bowling: Bowler[];
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
}

interface Scorecard {
  matchInfo: {
    team1: { id: number; name: string };
    team2: { id: number; name: string };
    venue: string;
    date: string;
    toss?: { winner: string; decision: string };
  };
  innings: Innings[];
  result?: { winner: string; margin: string; manOfTheMatch?: string };
}

export default function ScorecardPage({ params }: { params: { matchId: string } }) {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  useEffect(() => {
    fetchScorecard();
  }, []);

  const fetchScorecard = async () => {
    try {
      const res = await fetch(`/api/scorecards?matchId=${params.matchId}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setScorecard(data[0]);
      }
    } catch (err) {
      console.error('Error fetching scorecard:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Scorecard Not Found</p>
          <p className="text-gray-400">This scorecard has not been published yet.</p>
        </div>
      </div>
    );
  }

  const getStrikeRateColor = (sr: number) => {
    if (sr >= 130) return 'text-green-400';
    if (sr >= 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTeamNameForInning = (teamId: number) => {
    return teamId === scorecard.matchInfo.team1.id
      ? scorecard.matchInfo.team1.name
      : scorecard.matchInfo.team2.name;
  };

  const getOpponentNameForInning = (teamId: number) => {
    return teamId === scorecard.matchInfo.team1.id
      ? scorecard.matchInfo.team2.name
      : scorecard.matchInfo.team1.name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {scorecard.matchInfo.team1.name} vs {scorecard.matchInfo.team2.name}
          </h1>
          <p className="text-gray-400">
            {scorecard.matchInfo.venue} • {scorecard.matchInfo.date}
          </p>
        </div>

        {/* Score Summary */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">{scorecard.matchInfo.team1.name}</h2>
              <div className="text-5xl md:text-6xl font-bold text-blue-200 mb-2">
                {scorecard.innings[0]?.totalRuns || 0}/{scorecard.innings[0]?.totalWickets || 0}
              </div>
              <p className="text-gray-300">({scorecard.innings[0]?.totalOvers || 0} overs)</p>
            </div>

            {/* Team 2 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">{scorecard.matchInfo.team2.name}</h2>
              <div className="text-5xl md:text-6xl font-bold text-purple-200 mb-2">
                {scorecard.innings[1]?.totalRuns || 0}/{scorecard.innings[1]?.totalWickets || 0}
              </div>
              <p className="text-gray-300">({scorecard.innings[1]?.totalOvers || 0} overs)</p>
            </div>
          </div>

          {/* Result */}
          {scorecard.result && (
            <div className="mt-8 pt-8 border-t border-gray-600 text-center">
              <p className="text-xl text-green-300 font-bold">
                🏆 {scorecard.result.winner} won {scorecard.result.margin}
              </p>
              {scorecard.result.manOfTheMatch && (
                <p className="text-sm text-yellow-300 mt-2">
                  ⭐ Man of the Match: {scorecard.result.manOfTheMatch}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Innings Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            {scorecard.innings.map((inning, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx as 0 | 1)}
                className={`px-6 py-3 rounded-t font-semibold transition ${
                  activeTab === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {getTeamNameForInning(inning.battingTeamId)} Innings
              </button>
            ))}
          </div>

          {/* Active Innings */}
          <div className="space-y-8">
            {/* Batting Scorecard */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold">
                  {getTeamNameForInning(scorecard.innings[activeTab].battingTeamId)} Batting
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700 border-b border-gray-600">
                      <th className="text-left p-4 font-semibold">Batter</th>
                      <th className="text-center p-4 font-semibold">Runs</th>
                      <th className="text-center p-4 font-semibold">Balls</th>
                      <th className="text-center p-4 font-semibold">4s</th>
                      <th className="text-center p-4 font-semibold">6s</th>
                      <th className="text-center p-4 font-semibold">SR</th>
                      <th className="text-left p-4 font-semibold">Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.innings[activeTab].batting.map((batter, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-gray-600 ${
                          idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        } hover:bg-gray-700 transition`}
                      >
                        <td className="p-4">
                          <span className="font-semibold">{batter.name}</span>
                          {batter.dismissal?.type === 'not-out' && (
                            <span className="text-xs text-gray-400 ml-2">*</span>
                          )}
                        </td>
                        <td className="text-center p-4 font-bold text-lg">{batter.runs}</td>
                        <td className="text-center p-4">{batter.balls}</td>
                        <td className="text-center p-4 text-cyan-400">{batter.fours}</td>
                        <td className="text-center p-4 text-yellow-400 font-semibold">
                          {batter.sixes > 0 ? batter.sixes : '-'}
                        </td>
                        <td className={`text-center p-4 font-bold ${getStrikeRateColor(batter.strikeRate)}`}>
                          {batter.strikeRate}
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {batter.dismissal?.type === 'not-out' ? (
                            <span className="text-green-400">not out</span>
                          ) : (
                            batter.dismissal?.type || '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extras Summary */}
              <div className="bg-gray-750 p-4 border-t border-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Wides:</span>
                    <span className="ml-2 font-semibold">{scorecard.innings[activeTab].extras.wides}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">No Balls:</span>
                    <span className="ml-2 font-semibold">{scorecard.innings[activeTab].extras.noBalls}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Byes:</span>
                    <span className="ml-2 font-semibold">{scorecard.innings[activeTab].extras.byes}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Leg Byes:</span>
                    <span className="ml-2 font-semibold">{scorecard.innings[activeTab].extras.legByes}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-600 text-right">
                  <p className="text-lg font-bold">
                    Total: <span className="text-blue-300">{scorecard.innings[activeTab].totalRuns}</span> /{' '}
                    <span className="text-red-300">{scorecard.innings[activeTab].totalWickets}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bowling Scorecard */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold">
                  {getOpponentNameForInning(scorecard.innings[activeTab].battingTeamId)} Bowling
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700 border-b border-gray-600">
                      <th className="text-left p-4 font-semibold">Bowler</th>
                      <th className="text-center p-4 font-semibold">Overs</th>
                      <th className="text-center p-4 font-semibold">Runs</th>
                      <th className="text-center p-4 font-semibold">Wickets</th>
                      <th className="text-center p-4 font-semibold">Economy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.innings[activeTab].bowling.map((bowler, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-gray-600 ${
                          idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        } hover:bg-gray-700 transition`}
                      >
                        <td className="p-4">
                          <span className="font-semibold">{bowler.name}</span>
                        </td>
                        <td className="text-center p-4">
                          {bowler.overs}.{bowler.balls}
                        </td>
                        <td className="text-center p-4">{bowler.runs}</td>
                        <td className="text-center p-4 font-bold text-green-400 text-lg">
                          {bowler.wickets}
                        </td>
                        <td className="text-center p-4 font-semibold text-orange-400">
                          {bowler.economyRate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Match Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Venue:</span>
                <p className="font-semibold text-gray-100">{scorecard.matchInfo.venue}</p>
              </div>
              <div>
                <span className="text-gray-400">Date:</span>
                <p className="font-semibold text-gray-100">{scorecard.matchInfo.date}</p>
              </div>
              {scorecard.matchInfo.toss && (
                <div>
                  <span className="text-gray-400">Toss:</span>
                  <p className="font-semibold text-gray-100">
                    {scorecard.matchInfo.toss.winner} won, chose to {scorecard.matchInfo.toss.decision}
                  </p>
                </div>
              )}
            </div>
          </div>

          {scorecard.result?.manOfTheMatch && (
            <div className="bg-gradient-to-br from-yellow-900 to-orange-900 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">🏆 Awards</h3>
              <div>
                <span className="text-gray-300">Man of the Match:</span>
                <p className="font-bold text-yellow-300 text-xl">{scorecard.result.manOfTheMatch}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
