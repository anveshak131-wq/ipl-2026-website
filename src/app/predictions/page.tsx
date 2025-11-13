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

      <main className="relative py-16 section-hero-bg min-h-screen">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-ipl-purple/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
                🤖 AI PREDICTIONS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              AI Match <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Predictions</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Intelligent match analysis and AI-powered win probability predictions for upcoming IPL fixtures
            </p>
          </div>

          {/* Beta Notice */}
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-ipl-purple/20 to-ipl-gold/20 border border-ipl-gold/30">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-ipl-gold">⚠️ Beta Feature:</span> These predictions are AI-generated insights for entertainment purposes. Actual match outcomes may vary significantly.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Matches List */}
            <div className="lg:col-span-1">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  📅 Upcoming Matches
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match.id)}
                        className={`w-full p-4 rounded-lg transition-all duration-300 text-left ${
                          selectedMatch === match.id
                            ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white shadow-lg shadow-ipl-purple/20 transform scale-105'
                            : 'bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-ipl-gold/50 hover:bg-white/20'
                        }`}
                      >
                        <div className="font-bold mb-1 text-sm">
                          {match.team1.shortName} <span className="text-xs mx-1">vs</span> {match.team2.shortName}
                        </div>
                        <div className="text-xs opacity-75 flex items-center">
                          📅 {new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8">
                      {/* Animated background on hover */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
                      </div>

                      {(() => {
                        const match = matches.find(m => m.id === selectedMatch)!;
                        return (
                          <div className="relative">
                            <div className="flex items-center justify-between mb-6">
                              <div className="text-center flex-1">
                                <div className="text-3xl font-black text-white mb-2">
                                  {match.team1.shortName}
                                </div>
                                <p className="text-gray-400 text-sm font-semibold">
                                  {match.team1.name}
                                </p>
                              </div>

                              <div className="px-6">
                                <div className="text-2xl font-bold text-ipl-gold">
                                  VS
                                </div>
                              </div>

                              <div className="text-center flex-1">
                                <div className="text-3xl font-black text-white mb-2">
                                  {match.team2.shortName}
                                </div>
                                <p className="text-gray-400 text-sm font-semibold">
                                  {match.team2.name}
                                </p>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 text-center space-y-1">
                              <p className="text-gray-300 font-semibold">
                                📅 {new Date(match.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-gray-400 text-sm">
                                📍 {match.venue}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Win Probability */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8">
                    <h3 className="text-2xl font-black text-white mb-8">
                      📊 Win Probability
                    </h3>

                    {(() => {
                      const match = matches.find(m => m.id === selectedMatch)!;
                      return (
                        <div className="space-y-8">
                          {/* Team 1 */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-bold text-lg">
                                {match.team1.shortName}
                              </span>
                              <span className="text-ipl-gold font-black text-2xl">
                                {selectedPrediction.team1WinProbability.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/20">
                              <div
                                className="bg-gradient-to-r from-ipl-purple to-ipl-gold h-full transition-all duration-500 rounded-full shadow-lg shadow-ipl-purple/50"
                                style={{
                                  width: `${selectedPrediction.team1WinProbability}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Team 2 */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white font-bold text-lg">
                                {match.team2.shortName}
                              </span>
                              <span className="text-ipl-gold font-black text-2xl">
                                {selectedPrediction.team2WinProbability.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/20">
                              <div
                                className="bg-gradient-to-r from-ipl-gold to-ipl-purple h-full transition-all duration-500 rounded-full shadow-lg shadow-ipl-gold/50"
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
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8">
                    <h3 className="text-2xl font-black text-white mb-6">
                      🎯 Prediction
                    </h3>

                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-ipl-gold/20 to-ipl-purple/20 border border-ipl-gold/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-semibold mb-2">
                            Predicted Winner
                          </p>
                          <p className="text-3xl font-black text-ipl-gold">
                            {selectedPrediction.predictedWinner}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm font-semibold mb-2">
                            Confidence Level
                          </p>
                          <p className="text-3xl font-black text-white">
                            {selectedPrediction.confidence.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-base">
                      {selectedPrediction.analysis}
                    </p>
                  </div>

                  {/* Key Factors */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8">
                    <h3 className="text-2xl font-black text-white mb-6">
                      🔍 Key Factors
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPrediction.keyFactors.map((factor, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:border-ipl-gold/50 transition-all duration-300 flex items-center space-x-3 group cursor-pointer hover:bg-white/15"
                        >
                          <div className="w-3 h-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-full group-hover:scale-150 transition-transform duration-300" />
                          <span className="text-gray-300 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                            {factor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <span className="font-bold text-red-400">⚠️ Disclaimer:</span> These predictions are AI-generated and are for entertainment purposes only. They are not guaranteed to be accurate and should not be used for betting or financial decisions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-12 text-center">
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
                  <p className="text-gray-300 text-lg font-semibold">
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
