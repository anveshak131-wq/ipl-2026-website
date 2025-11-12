'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Prediction {
  matchId: string;
  team1WinProbability: number;
  team2WinProbability: number;
  predictedWinner: string;
  confidence: number;
  keyFactors: string[];
  analysis: string;
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchesData = await api.getMatches();
        setMatches(matchesData.filter(m => m.status === 'upcoming'));

        // TODO: Replace with actual AI predictions from API
        const mockPredictions = new Map<string, Prediction>();
        matchesData.forEach((match) => {
          mockPredictions.set(match.id, {
            matchId: match.id,
            team1WinProbability: Math.random() * 100,
            team2WinProbability: Math.random() * 100,
            predictedWinner: Math.random() > 0.5 ? match.team1.shortName : match.team2.shortName,
            confidence: 70 + Math.random() * 25,
            keyFactors: [
              'Recent form',
              'Head-to-head record',
              'Player injuries',
              'Venue conditions',
              'Weather forecast'
            ],
            analysis: `Based on historical data and current form, ${Math.random() > 0.5 ? match.team1.shortName : match.team2.shortName} has a slight edge in this matchup. Key factors include recent performance, player availability, and venue conditions.`
          });
        });
        setPredictions(mockPredictions);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  const selectedPrediction = selectedMatch ? predictions.get(selectedMatch) : null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🤖 AI Match Predictions
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
            <p className="text-gray-300 text-lg">
              AI-powered insights and predictions for upcoming IPL matches
            </p>
          </div>

          {/* Beta Notice */}
          <div className="mb-8 p-4 bg-ipl-purple/20 border border-ipl-purple/30 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-ipl-gold">⚠️ Beta Feature:</span> These predictions are generated using AI models and should be used for entertainment purposes only. Actual match outcomes may vary significantly.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Matches List */}
            <div className="lg:col-span-1">
              <div className="glass-effect rounded-xl p-6 sticky top-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  Upcoming Matches
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match.id)}
                        className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${
                          selectedMatch === match.id
                            ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white'
                            : 'glass-effect text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold mb-1">
                          {match.team1.shortName} vs {match.team2.shortName}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">
                        No upcoming matches
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prediction Details */}
            <div className="lg:col-span-2">
              {selectedPrediction && selectedMatch ? (
                <div className="space-y-6">
                  {/* Match Header */}
                  {matches.find(m => m.id === selectedMatch) && (
                    <div className="glass-effect rounded-xl p-8">
                      {(() => {
                        const match = matches.find(m => m.id === selectedMatch)!;
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <div className="text-center flex-1">
                                <div className="text-3xl font-bold text-white mb-2">
                                  {match.team1.shortName}
                                </div>
                                <p className="text-gray-400 text-sm">
                                  {match.team1.name}
                                </p>
                              </div>

                              <div className="px-6">
                                <div className="text-2xl font-bold text-ipl-gold">
                                  VS
                                </div>
                              </div>

                              <div className="text-center flex-1">
                                <div className="text-3xl font-bold text-white mb-2">
                                  {match.team2.shortName}
                                </div>
                                <p className="text-gray-400 text-sm">
                                  {match.team2.name}
                                </p>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 text-center">
                              <p className="text-gray-400 text-sm mb-2">
                                {new Date(match.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {match.venue}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Win Probability */}
                  <div className="glass-effect rounded-xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6">
                      Win Probability
                    </h3>

                    {(() => {
                      const match = matches.find(m => m.id === selectedMatch)!;
                      return (
                        <div className="space-y-6">
                          {/* Team 1 */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-semibold">
                                {match.team1.shortName}
                              </span>
                              <span className="text-ipl-gold font-bold text-lg">
                                {selectedPrediction.team1WinProbability.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-ipl-purple to-ipl-gold h-full transition-all duration-500"
                                style={{
                                  width: `${selectedPrediction.team1WinProbability}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Team 2 */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-semibold">
                                {match.team2.shortName}
                              </span>
                              <span className="text-ipl-gold font-bold text-lg">
                                {selectedPrediction.team2WinProbability.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-ipl-purple to-ipl-gold h-full transition-all duration-500"
                                style={{
                                  width: `${selectedPrediction.team2WinProbability}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Prediction */}
                  <div className="glass-effect rounded-xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Prediction
                    </h3>

                    <div className="mb-6 p-4 bg-ipl-gold/10 border border-ipl-gold/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">
                            Predicted Winner
                          </p>
                          <p className="text-2xl font-bold text-ipl-gold">
                            {selectedPrediction.predictedWinner}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm mb-1">
                            Confidence
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {selectedPrediction.confidence.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6">
                      {selectedPrediction.analysis}
                    </p>
                  </div>

                  {/* Key Factors */}
                  <div className="glass-effect rounded-xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Key Factors
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPrediction.keyFactors.map((factor, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center space-x-3"
                        >
                          <div className="w-2 h-2 bg-ipl-gold rounded-full" />
                          <span className="text-gray-300 text-sm">
                            {factor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-gray-300">
                      <span className="font-semibold text-red-400">Disclaimer:</span> These predictions are generated by AI and are for entertainment purposes only. They are not guaranteed to be accurate and should not be used for betting or financial decisions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass-effect rounded-xl p-12 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-300 text-lg">
                    Select a match to view AI predictions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
