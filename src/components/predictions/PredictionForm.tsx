'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Match, Player } from '@/types';
import { Target, Trophy, Award, Zap } from 'lucide-react';

interface PredictionFormProps {
  match: Match | null;
  existingPrediction?: any;
  onSuccess: () => void;
}

export default function PredictionForm({ match, existingPrediction, onSuccess }: PredictionFormProps) {
  const { currentLeague } = useLeague();
  const [predictedWinner, setPredictedWinner] = useState<'team1' | 'team2' | null>(
    existingPrediction?.predictedWinner || null
  );
  const [topScorer, setTopScorer] = useState<string>(existingPrediction?.playerPredictions?.topScorer || '');
  const [mostWickets, setMostWickets] = useState<string>(existingPrediction?.playerPredictions?.mostWickets || '');
  const [playerOfMatch, setPlayerOfMatch] = useState<string>(existingPrediction?.playerPredictions?.playerOfMatch || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const fetchPlayers = async () => {
        try {
          const team1Players = await api.getPlayers(match.team1.id, currentLeague);
          const team2Players = await api.getPlayers(match.team2.id, currentLeague);
          setPlayers([...team1Players, ...team2Players]);
        } catch (error) {
          console.error('Error fetching players:', error);
        }
      };
      fetchPlayers();
    }
  }, [match, currentLeague]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!match || !predictedWinner) {
      setError('Please select a predicted winner');
      return;
    }

    setSubmitting(true);

    try {
      const predictionData = {
        matchId: match.id,
        predictedWinner,
        playerPredictions: {
          ...(topScorer && { topScorer }),
          ...(mostWickets && { mostWickets }),
          ...(playerOfMatch && { playerOfMatch }),
        },
        league: currentLeague,
      };

      if (existingPrediction) {
        // For updates, send all current values (not just changed ones)
        // This ensures the API receives complete data
        const updateData = {
          predictedWinner,
          playerPredictions: {
            ...(topScorer && { topScorer }),
            ...(mostWickets && { mostWickets }),
            ...(playerOfMatch && { playerOfMatch }),
          },
        };
        
        await api.updatePrediction(existingPrediction.id, updateData);
      } else {
        await api.createPrediction(predictionData);
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to save prediction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Please select a match to make predictions</p>
      </div>
    );
  }

  const team1Players = players.filter((p) => p.teamId === match.team1.id);
  const team2Players = players.filter((p) => p.teamId === match.team2.id);
  const allPlayers = [...team1Players, ...team2Players];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Match Winner Prediction */}
      <div>
        <label className="flex items-center gap-2 text-white font-semibold mb-3">
          <Trophy className="w-5 h-5 text-ipl-gold" />
          Who will win?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            type="button"
            onClick={() => setPredictedWinner('team1')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              predictedWinner === 'team1'
                ? 'border-ipl-gold bg-ipl-gold/20 shadow-lg shadow-ipl-gold/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={match.team1.logo}
                alt={match.team1.shortName}
                className="w-12 h-12 object-contain"
              />
              <div>
                <div className="font-semibold text-white">{match.team1.shortName}</div>
                <div className="text-sm text-gray-400">{match.team1.name}</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setPredictedWinner('team2')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              predictedWinner === 'team2'
                ? 'border-ipl-gold bg-ipl-gold/20 shadow-lg shadow-ipl-gold/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={match.team2.logo}
                alt={match.team2.shortName}
                className="w-12 h-12 object-contain"
              />
              <div>
                <div className="font-semibold text-white">{match.team2.shortName}</div>
                <div className="text-sm text-gray-400">{match.team2.name}</div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Player Predictions */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-ipl-gold" />
          Player Predictions (Optional)
        </h3>

        {/* Top Scorer */}
        <div>
          <label htmlFor="top-scorer" className="block text-sm text-gray-300 mb-2">Top Scorer</label>
          <select
            id="top-scorer"
            name="top-scorer"
            value={topScorer}
            onChange={(e) => setTopScorer(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
          >
            <option value="">Select player...</option>
            {allPlayers
              .filter((p) => p.role === 'Batsman' || p.role === 'All-rounder' || p.role === 'Wicket-keeper')
              .map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.teamId === match.team1.id ? match.team1.shortName : match.team2.shortName})
                </option>
              ))}
          </select>
        </div>

        {/* Most Wickets */}
        <div>
          <label htmlFor="most-wickets" className="block text-sm text-gray-300 mb-2">Most Wickets</label>
          <select
            id="most-wickets"
            name="most-wickets"
            value={mostWickets}
            onChange={(e) => setMostWickets(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
          >
            <option value="">Select player...</option>
            {allPlayers
              .filter((p) => p.role === 'Bowler' || p.role === 'All-rounder')
              .map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.teamId === match.team1.id ? match.team1.shortName : match.team2.shortName})
                </option>
              ))}
          </select>
        </div>

        {/* Player of the Match */}
        <div>
          <label htmlFor="player-of-match" className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-ipl-gold" />
            Player of the Match
          </label>
          <select
            id="player-of-match"
            name="player-of-match"
            value={playerOfMatch}
            onChange={(e) => setPlayerOfMatch(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
          >
            <option value="">Select player...</option>
            {allPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.teamId === match.team1.id ? match.team1.shortName : match.team2.shortName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={submitting || !predictedWinner}
        whileHover={{ scale: submitting ? 1 : 1.02 }}
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          submitting || !predictedWinner
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white hover:from-ipl-gold/90 hover:to-ipl-purple/90 shadow-lg shadow-ipl-gold/20'
        }`}
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>{existingPrediction ? 'Update Prediction' : 'Submit Prediction'}</span>
          </>
        )}
      </motion.button>
    </form>
  );
}

