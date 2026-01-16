'use client';

import { useState, useEffect } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import { Trophy, TrendingUp, Award, Users, BarChart3, Target } from 'lucide-react';
import type { 
  PlayerBattingStats, 
  PlayerBowlingStats, 
  TeamStats, 
  OrangeCap, 
  PurpleCap 
} from '@/lib/statsCalculator';

export default function WPLStatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'batting' | 'bowling'>('overview');
  const [battingStats, setBattingStats] = useState<PlayerBattingStats[]>([]);
  const [bowlingStats, setBowlingStats] = useState<PlayerBowlingStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [orangeCap, setOrangeCap] = useState<OrangeCap | null>(null);
  const [purpleCap, setPurpleCap] = useState<PurpleCap | null>(null);

  useEffect(() => {
    console.log('WPL Stats page mounted, calling fetchStats...');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log('fetchStats called - starting...');
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching from /api/stats?league=wpl&type=all');
      const response = await fetch('/api/stats?league=wpl&type=all');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log the full response for debugging
      console.log('Stats API Response:', data);
      
      // Don't treat "No published scorecards" as an error - it's just an empty state
      // The API returns empty arrays in this case, which is fine
      setBattingStats(data.battingStats || []);
      setBowlingStats(data.bowlingStats || []);
      setTeamStats(data.teamStats || []);
      setOrangeCap(data.orangeCap);
      setPurpleCap(data.purpleCap);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
      console.log('fetchStats complete');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <WPLAdminSidebarNew />
      <div className="lg:ml-64 p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">WPL Statistics Dashboard</h1>
              <p className="text-gray-300">Auto-calculated from published scorecards</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BarChart3 size={20} />
              {loading ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Orange Cap */}
            {orangeCap && (
              <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/40 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-500/30 rounded-lg">
                    <Trophy className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-orange-400">Orange Cap</h3>
                    <p className="text-sm text-gray-300">Most Runs</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{orangeCap.playerName}</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{orangeCap.runs}</div>
                      <div className="text-xs text-gray-400">Runs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{orangeCap.average}</div>
                      <div className="text-xs text-gray-400">Average</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{orangeCap.strikeRate}</div>
                      <div className="text-xs text-gray-400">SR</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purple Cap */}
            {purpleCap && (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-500/30 rounded-lg">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-400">Purple Cap</h3>
                    <p className="text-sm text-gray-300">Most Wickets</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{purpleCap.playerName}</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{purpleCap.wickets}</div>
                      <div className="text-xs text-gray-400">Wickets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{purpleCap.economy}</div>
                      <div className="text-xs text-gray-400">Economy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{purpleCap.average}</div>
                      <div className="text-xs text-gray-400">Average</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'batting', label: 'Batting Stats', icon: TrendingUp },
            { key: 'bowling', label: 'Bowling Stats', icon: Target },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Calculating statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-6 text-center">
            <p className="text-red-300 font-semibold mb-2">Error loading statistics</p>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition"
            >
              Retry
            </button>
          </div>
        ) : battingStats.length === 0 && bowlingStats.length === 0 && teamStats.length === 0 ? (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Statistics Available</h3>
            <p className="text-gray-300 mb-4">
              Statistics will appear once you publish scorecards from the Scorecard admin page.
            </p>
            <a
              href="/wpl-admin-2026/scorecard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
            >
              Go to Scorecard Admin
            </a>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Batsmen */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-orange-400" />
                    Top 5 Run Scorers
                  </h3>
                  {battingStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <TrendingUp className="mx-auto mb-3 text-gray-600" size={48} />
                      <p className="font-semibold">No batting stats available yet.</p>
                      <p className="text-sm mt-2">Publish scorecards from the Scorecard Admin page to see stats.</p>
                      <a
                        href="/wpl-admin-2026/scorecard"
                        className="inline-block mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition"
                      >
                        Go to Scorecard Admin
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {battingStats.slice(0, 5).map((player, idx) => (
                        <div key={player.playerId} className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${
                              idx === 0 ? 'text-yellow-400' : 
                              idx === 1 ? 'text-gray-300' : 
                              idx === 2 ? 'text-orange-400' : 
                              'text-purple-400'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{player.playerName}</div>
                              <div className="text-sm text-gray-400">{player.matches} matches</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-orange-400">{player.runs}</div>
                            <div className="text-xs text-gray-400">Avg: {player.average} • SR: {player.strikeRate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top 5 Bowlers */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="text-purple-400" />
                    Top 5 Wicket Takers
                  </h3>
                  {bowlingStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="mx-auto mb-3 text-gray-600" size={48} />
                      <p className="font-semibold">No bowling stats available yet.</p>
                      <p className="text-sm mt-2">Publish scorecards from the Scorecard Admin page to see stats.</p>
                      <a
                        href="/wpl-admin-2026/scorecard"
                        className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                      >
                        Go to Scorecard Admin
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bowlingStats.slice(0, 5).map((player, idx) => (
                        <div key={player.playerId} className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${
                              idx === 0 ? 'text-yellow-400' : 
                              idx === 1 ? 'text-gray-300' : 
                              idx === 2 ? 'text-orange-400' : 
                              'text-pink-400'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{player.playerName}</div>
                              <div className="text-sm text-gray-400">{player.matches} matches</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-purple-400">{player.wickets}</div>
                            <div className="text-xs text-gray-400">Econ: {player.economy} • Avg: {player.average}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batting Stats Tab */}
            {activeTab === 'batting' && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20 text-gray-300">
                      <th className="text-left p-3">Rank</th>
                      <th className="text-left p-3">Player</th>
                      <th className="text-center p-3">Mat</th>
                      <th className="text-center p-3">Inns</th>
                      <th className="text-center p-3">Runs</th>
                      <th className="text-center p-3">HS</th>
                      <th className="text-center p-3">Avg</th>
                      <th className="text-center p-3">SR</th>
                      <th className="text-center p-3">50s</th>
                      <th className="text-center p-3">100s</th>
                      <th className="text-center p-3">4s</th>
                      <th className="text-center p-3">6s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {battingStats.map((player, idx) => (
                      <tr key={player.playerId} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 font-bold text-purple-400">#{idx + 1}</td>
                        <td className="p-3 font-semibold text-white">{player.playerName}</td>
                        <td className="p-3 text-center text-gray-300">{player.matches}</td>
                        <td className="p-3 text-center text-gray-300">{player.innings}</td>
                        <td className="p-3 text-center font-bold text-orange-400">{player.runs}</td>
                        <td className="p-3 text-center text-gray-300">{player.highestScore}</td>
                        <td className="p-3 text-center text-gray-300">{player.average}</td>
                        <td className="p-3 text-center text-gray-300">{player.strikeRate}</td>
                        <td className="p-3 text-center text-gray-300">{player.fifties}</td>
                        <td className="p-3 text-center text-gray-300">{player.hundreds}</td>
                        <td className="p-3 text-center text-gray-300">{player.fours}</td>
                        <td className="p-3 text-center text-gray-300">{player.sixes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bowling Stats Tab */}
            {activeTab === 'bowling' && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20 text-gray-300">
                      <th className="text-left p-3">Rank</th>
                      <th className="text-left p-3">Player</th>
                      <th className="text-center p-3">Mat</th>
                      <th className="text-center p-3">Inns</th>
                      <th className="text-center p-3">Wkts</th>
                      <th className="text-center p-3">Best</th>
                      <th className="text-center p-3">Avg</th>
                      <th className="text-center p-3">Econ</th>
                      <th className="text-center p-3">SR</th>
                      <th className="text-center p-3">4W</th>
                      <th className="text-center p-3">5W</th>
                      <th className="text-center p-3">Maidens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlingStats.map((player, idx) => (
                      <tr key={player.playerId} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 font-bold text-pink-400">#{idx + 1}</td>
                        <td className="p-3 font-semibold text-white">{player.playerName}</td>
                        <td className="p-3 text-center text-gray-300">{player.matches}</td>
                        <td className="p-3 text-center text-gray-300">{player.innings}</td>
                        <td className="p-3 text-center font-bold text-purple-400">{player.wickets}</td>
                        <td className="p-3 text-center text-gray-300">{player.bestBowling}</td>
                        <td className="p-3 text-center text-gray-300">{player.average}</td>
                        <td className="p-3 text-center text-gray-300">{player.economy}</td>
                        <td className="p-3 text-center text-gray-300">{player.strikeRate}</td>
                        <td className="p-3 text-center text-gray-300">{player.fourWickets}</td>
                        <td className="p-3 text-center text-gray-300">{player.fiveWickets}</td>
                        <td className="p-3 text-center text-gray-300">{player.maidens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}

        {/* Note about Points Table */}
        <div className="mt-6 bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            💡 <strong>Points Table:</strong> For the editable points table, please visit the{' '}
            <a href="/wpl-admin-2026/points-table" className="underline hover:text-blue-100">
              Points Table Admin page
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
