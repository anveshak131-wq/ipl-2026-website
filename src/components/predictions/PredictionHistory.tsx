'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import type { Prediction, Match } from '@/types';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface PredictionHistoryProps {
  userId: string;
}

export default function PredictionHistory({ userId }: PredictionHistoryProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userPredictions = await api.getPredictions({ userId });
        setPredictions(userPredictions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));

        // Fetch matches for context
        const allMatches = await api.getMatches();
        const matchMap: Record<string, Match> = {};
        allMatches.forEach((m: Match) => {
          matchMap[m.id] = m;
        });
        setMatches(matchMap);
      } catch (error) {
        console.error('Error fetching prediction history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>No predictions yet</p>
        <p className="text-sm mt-2">Start making predictions to see your history!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Your Prediction History</h3>
      <div className="space-y-3">
        {predictions.map((prediction) => {
          const match = matches[prediction.matchId];
          const hasAccuracy = prediction.accuracy !== undefined;
          const points = prediction.accuracy?.points || 0;
          const isPerfect = points === 30;

          return (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {match ? (
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={match.team1.logo}
                        alt={match.team1.shortName}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-white font-semibold">{match.team1.shortName}</span>
                      <span className="text-gray-400">vs</span>
                      <img
                        src={match.team2.logo}
                        alt={match.team2.shortName}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-white font-semibold">{match.team2.shortName}</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Match data unavailable</div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(prediction.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {hasAccuracy && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                    isPerfect
                      ? 'bg-green-500/20 text-green-400'
                      : points >= 20
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {isPerfect ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="font-semibold">{points}/30</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Predicted Winner:</span>
                  {match && (
                    <span className="text-white font-semibold">
                      {prediction.predictedWinner === 'team1' ? match.team1.shortName : match.team2.shortName}
                    </span>
                  )}
                  {hasAccuracy && (
                    <span className={prediction.accuracy?.matchWinner ? 'text-green-400' : 'text-red-400'}>
                      {prediction.accuracy?.matchWinner ? '✓' : '✗'}
                    </span>
                  )}
                </div>

                {prediction.playerPredictions && (
                  <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                    {prediction.playerPredictions.topScorer && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Top Scorer:</span>
                        <span className="text-white">Selected</span>
                        {hasAccuracy && (
                          <span className={prediction.accuracy?.topScorer ? 'text-green-400' : 'text-red-400'}>
                            {prediction.accuracy?.topScorer ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    )}
                    {prediction.playerPredictions.mostWickets && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Most Wickets:</span>
                        <span className="text-white">Selected</span>
                        {hasAccuracy && (
                          <span className={prediction.accuracy?.mostWickets ? 'text-green-400' : 'text-red-400'}>
                            {prediction.accuracy?.mostWickets ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    )}
                    {prediction.playerPredictions.playerOfMatch && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Player of Match:</span>
                        <span className="text-white">Selected</span>
                        {hasAccuracy && (
                          <span className={prediction.accuracy?.playerOfMatch ? 'text-green-400' : 'text-red-400'}>
                            {prediction.accuracy?.playerOfMatch ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!hasAccuracy && match && match.status === 'upcoming' && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Match pending</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

