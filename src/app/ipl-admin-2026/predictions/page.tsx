'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Match, Poll } from '@/types';
import { Target, Trophy, BarChart3, Users, MessageSquare } from 'lucide-react';

export default function AdminPredictionsPage() {
  const { currentLeague } = useLeague();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch matches
        try {
          const allMatches = await api.getMatches(currentLeague);
          setMatches(Array.isArray(allMatches) ? allMatches : []);
        } catch (matchError) {
          console.error('Error fetching matches:', matchError);
          setMatches([]);
        }
        
        // Fetch predictions based on filter
        if (selectedMatchId) {
          try {
            const matchPredictions = await api.getPredictions({ matchId: selectedMatchId });
            setPredictions(Array.isArray(matchPredictions) ? matchPredictions : []);
          } catch (predError) {
            console.error('Error fetching predictions:', predError);
            setPredictions([]);
          }
          
          try {
            const pollData = await api.getPolls(selectedMatchId);
            if (pollData) {
              setPolls([pollData]);
            } else {
              setPolls([]);
            }
          } catch (pollError) {
            console.error('Error fetching poll:', pollError);
            setPolls([]);
          }
        } else {
          try {
            const allPredictions = await api.getPredictions({ league: currentLeague });
            setPredictions(Array.isArray(allPredictions) ? allPredictions : []);
          } catch (predError) {
            console.error('Error fetching all predictions:', predError);
            setPredictions([]);
          }
        }
      } catch (error: any) {
        console.error('Error in fetchData:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLeague, selectedMatchId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const leaderboard = await api.getLeaderboard();
        if (leaderboard && leaderboard.length > 0) {
          setStats({
            totalPredictions: predictions.length,
            totalUsers: new Set(predictions.map((p) => p.userId)).size,
            topPredictor: leaderboard[0],
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (predictions.length > 0) {
      fetchStats();
    }
  }, [predictions]);

  const upcomingMatches = matches.filter((m) => {
    if (m.status !== 'upcoming') return false;
    const matchDateTime = new Date(`${m.date}T${m.time}`);
    return matchDateTime > new Date();
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Target className="w-8 h-8 text-ipl-gold" />
          Predictions Management
        </h1>
        <p className="text-gray-400">View and manage user predictions and polls</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-6 flex items-center gap-2 text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ipl-gold"></div>
          <span>Loading data...</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Predictions</p>
              <p className="text-2xl font-bold text-white mt-1">{predictions.length}</p>
            </div>
            <Target className="w-8 h-8 text-ipl-gold" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white mt-1">
                {predictions.length > 0 ? new Set(predictions.map((p) => p.userId)).size : 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Polls</p>
              <p className="text-2xl font-bold text-white mt-1">{polls.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Upcoming Matches</p>
              <p className="text-2xl font-bold text-white mt-1">{upcomingMatches.length}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Match Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Match
        </label>
        <select
          value={selectedMatchId || ''}
          onChange={(e) => setSelectedMatchId(e.target.value || null)}
          className="w-full md:w-1/3 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
        >
          <option value="">All Matches</option>
          {upcomingMatches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.team1.shortName} vs {match.team2.shortName} - {match.date}
            </option>
          ))}
        </select>
      </div>

      {/* Predictions List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-ipl-gold" />
          Predictions {selectedMatchId && `(${predictions.length})`}
        </h2>
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No predictions found</p>
            <p className="text-sm mt-2">Predictions will appear here once users start making predictions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.slice(0, 20).map((prediction) => {
              const match = matches.find((m) => m.id === prediction.matchId);
              return (
                <div
                  key={prediction.id}
                  className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {match ? (
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={match.team1.logo}
                            alt={match.team1.shortName}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="text-white font-semibold">
                            {match.team1.shortName} vs {match.team2.shortName}
                          </span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">Match ID: {prediction.matchId}</div>
                      )}
                      <div className="text-sm text-gray-400 mb-2">
                        Predicted Winner:{' '}
                        <span className="text-white font-semibold">
                          {match
                            ? prediction.predictedWinner === 'team1'
                              ? match.team1.shortName
                              : match.team2.shortName
                            : prediction.predictedWinner}
                        </span>
                      </div>
                      {prediction.playerPredictions && (
                        <div className="text-xs text-gray-500 space-y-1">
                          {prediction.playerPredictions.topScorer && (
                            <div>Top Scorer: Selected</div>
                          )}
                          {prediction.playerPredictions.mostWickets && (
                            <div>Most Wickets: Selected</div>
                          )}
                          {prediction.playerPredictions.playerOfMatch && (
                            <div>Player of Match: Selected</div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        User ID: {prediction.userId?.slice(0, 8) || 'unknown'}... | Created:{' '}
                        {prediction.createdAt ? new Date(prediction.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    {prediction.accuracy && (
                      <div className="ml-4 px-3 py-1 bg-ipl-gold/20 text-ipl-gold rounded-lg text-sm font-semibold">
                        {prediction.accuracy.points}/30 pts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {predictions.length > 20 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                Showing 20 of {predictions.length} predictions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Polls List */}
      {polls.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Active Polls
          </h2>
          <div className="space-y-3">
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
              return (
                <div
                  key={poll.id}
                  className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg"
                >
                  <h3 className="text-white font-semibold mb-3">{poll.question}</h3>
                  <div className="space-y-2">
                    {poll.options.map((option) => {
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                      return (
                        <div key={option.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-300 text-sm">{option.text}</span>
                            <span className="text-gray-400 text-sm">
                              {option.votes} votes ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gradient-to-r from-ipl-gold/20 to-ipl-purple/20 border border-ipl-gold/50 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
        <div className="flex gap-3">
          <a
            href="/predictions"
            target="_blank"
            className="px-4 py-2 bg-ipl-gold text-white rounded-lg hover:bg-ipl-gold/90 transition-colors"
          >
            View Public Predictions Page
          </a>
          <a
            href="/predictions"
            target="_blank"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            View Leaderboard
          </a>
        </div>
      </div>
    </div>
  );
}
