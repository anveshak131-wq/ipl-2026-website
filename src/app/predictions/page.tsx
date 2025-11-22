'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';

interface Prediction {
  matchId: string;
  team1WinProbability: number;
  team2WinProbability: number;
  predictedWinner: string;
  confidence: number;
  keyFactors: string[];
  analysis: string;
}

interface TossTeamStat {
  team: string;
  matches: number;
  tossesWon: number;
  tossWinPct?: number;
  wins: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  winPctWhenWinToss?: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
  winPctWhenLoseToss?: number;
  tossImpact: number;
}

interface TossAnalyticsSnapshot {
  datasetKeys: string[];
  totals: {
    totalMatches: number;
  };
  teams: TossTeamStat[];
  perVenue?: Record<string, unknown>;
  generatedAt?: string;
}

interface TossTeamAggregate {
  code: string;
  name: string;
  matches: number;
  wins: number;
  tossesWon: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
}

function mapAnalyticsTeamNameToCode(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;

  if (n.includes('royal challengers')) return 'RCB';
  if (n.includes('mumbai indians')) return 'MI';
  if (n.includes('chennai super kings')) return 'CSK';
  if (n.includes('rajasthan royals')) return 'RR';
  if (n.includes('sunrisers hyderabad')) return 'SRH';
  if (n.includes('gujarat titans')) return 'GT';
  if (n.includes('punjab kings')) return 'PBKS';
  if (n.includes('delhi capitals')) return 'DC';
  if (n.includes('kolkata knight riders')) return 'KKR';
  if (n.includes('lucknow super giants')) return 'LSG';

  return null;
}

function buildTossIndex(snapshot: TossAnalyticsSnapshot | null): Record<string, TossTeamAggregate> {
  const byCode: Record<string, TossTeamAggregate> = {};
  if (!snapshot || !Array.isArray(snapshot.teams)) return byCode;

  for (const t of snapshot.teams) {
    if (!t.team) continue;
    const code = mapAnalyticsTeamNameToCode(t.team);
    if (!code) continue;

    if (!byCode[code]) {
      byCode[code] = {
        code,
        name: t.team,
        matches: 0,
        wins: 0,
        tossesWon: 0,
        matchesWhenWinToss: 0,
        winsWhenWinToss: 0,
        matchesWhenLoseToss: 0,
        winsWhenLoseToss: 0,
      };
    }

    const agg = byCode[code];
    agg.matches += t.matches || 0;
    agg.wins += t.wins || 0;
    agg.tossesWon += t.tossesWon || 0;
    agg.matchesWhenWinToss += t.matchesWhenWinToss || 0;
    agg.winsWhenWinToss += t.winsWhenWinToss || 0;
    agg.matchesWhenLoseToss += t.matchesWhenLoseToss || 0;
    agg.winsWhenLoseToss += t.winsWhenLoseToss || 0;

    // Prefer the latest human-friendly name (e.g. Capitals over Daredevils)
    agg.name = t.team;
  }

  return byCode;
}

function deriveTeamTossProfile(agg?: TossTeamAggregate | null) {
  if (!agg || agg.matches <= 0) {
    return {
      baseWinPct: 0,
      winPctWhenWinToss: 0,
      winPctWhenLoseToss: 0,
      tossImpact: 0,
    };
  }

  const baseWinPct = agg.wins / Math.max(1, agg.matches);
  const winPctWhenWinToss =
    agg.matchesWhenWinToss > 0
      ? agg.winsWhenWinToss / agg.matchesWhenWinToss
      : baseWinPct;
  const winPctWhenLoseToss =
    agg.matchesWhenLoseToss > 0
      ? agg.winsWhenLoseToss / agg.matchesWhenLoseToss
      : baseWinPct;
  const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;

  return { baseWinPct, winPctWhenWinToss, winPctWhenLoseToss, tossImpact };
}

function getTeamCodeFromShortName(shortName: string): string {
  return shortName.trim().toUpperCase();
}

function buildPredictionFromToss(
  match: Match,
  tossIndex: Record<string, TossTeamAggregate>,
): Prediction {
  const code1 = getTeamCodeFromShortName(match.team1.shortName);
  const code2 = getTeamCodeFromShortName(match.team2.shortName);

  const agg1 = tossIndex[code1];
  const agg2 = tossIndex[code2];

  const profile1 = deriveTeamTossProfile(agg1);
  const profile2 = deriveTeamTossProfile(agg2);

  // Base probabilities from overall win percentage
  let base1 = profile1.baseWinPct;
  let base2 = profile2.baseWinPct;

  if (base1 === 0 && base2 === 0) {
    base1 = 0.5;
    base2 = 0.5;
  }

  let p1 = base1;
  let p2 = base2;

  const sumBase = p1 + p2;
  if (sumBase > 0) {
    p1 /= sumBase;
    p2 /= sumBase;
  } else {
    p1 = 0.5;
    p2 = 0.5;
  }

  // Incorporate how strongly each team is affected by the toss
  const k = 0.25; // small weight so toss impact nudges, not dominates
  p1 += k * profile1.tossImpact;
  p2 += k * profile2.tossImpact;

  // Renormalize and clamp
  const sum = p1 + p2;
  if (sum > 0) {
    p1 /= sum;
    p2 /= sum;
  }

  const clamp = (v: number) => Math.min(0.95, Math.max(0.05, v));
  p1 = clamp(p1);
  p2 = clamp(p2);

  const predictedWinner =
    p1 > p2 ? match.team1.shortName : match.team2.shortName;

  const diff = Math.abs(p1 - p2);
  const confidence = 60 + diff * 40; // 60–100 based on separation

  const keyFactors: string[] = [];

  if (agg1 && agg1.matches > 0) {
    keyFactors.push(
      `${match.team1.shortName} estimated win rate: ${(profile1.baseWinPct * 100).toFixed(1)}%`,
    );
    keyFactors.push(
      `Toss impact: winning the toss tends to give ${match.team1.shortName} a noticeable edge in results.`,
    );
  }

  if (agg2 && agg2.matches > 0) {
    keyFactors.push(
      `${match.team2.shortName} estimated win rate: ${(profile2.baseWinPct * 100).toFixed(1)}%`,
    );
    keyFactors.push(
      `Toss impact: winning the toss tends to give ${match.team2.shortName} a noticeable edge in results.`,
    );
  }

  if (!keyFactors.length) {
    keyFactors.push(
      'Limited information available for this matchup; win probabilities are kept close to 50–50.',
    );
  }

  const strongerTeamName =
    p1 > p2 ? match.team1.shortName : match.team2.shortName;
  const weakerTeamName =
    p1 > p2 ? match.team2.shortName : match.team1.shortName;

  const analysis =
    agg1 || agg2
      ? `Our prediction gives ${strongerTeamName} a slight edge over ${weakerTeamName}. It blends team performance indicators with how strongly the toss tends to influence their results to estimate these probabilities: ${(p1 * 100).toFixed(1)}% for ${match.team1.shortName} and ${(p2 * 100).toFixed(1)}% for ${match.team2.shortName}.`
      : `With limited information for this particular matchup, the contest is treated as almost perfectly balanced, keeping win probabilities close to 50–50 for both sides.`;

  return {
    matchId: match.id,
    team1WinProbability: p1 * 100,
    team2WinProbability: p2 * 100,
    predictedWinner,
    confidence,
    keyFactors,
    analysis,
  };
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, settingsData] = await Promise.all([
          api.getMatches(),
          api.getSettings().catch(() => ({})),
        ]);

        const upcoming = matchesData.filter((m) => m.status === 'upcoming');
        setMatches(upcoming);

        let tossSnapshot: TossAnalyticsSnapshot | null = null;
        if (settingsData && (settingsData as any).publishedStats?.tossAnalytics) {
          tossSnapshot = (settingsData as any).publishedStats
            .tossAnalytics as TossAnalyticsSnapshot;
        }

        const tossIndex = buildTossIndex(tossSnapshot);

        const nextPredictions = new Map<string, Prediction>();
        upcoming.forEach((match) => {
          const prediction = buildPredictionFromToss(match, tossIndex);
          nextPredictions.set(match.id, prediction);
        });

        setPredictions(nextPredictions);
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

      <main className="relative py-16 min-h-screen overflow-hidden">
        <AuroraBackground />
        
        {/* Floating Animated Orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-ipl-blue-light/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 left-20 w-80 h-80 bg-ipl-gold/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-ipl-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                <Icon name="target" size={16} /> AI PREDICTIONS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight hover:scale-[1.02] transition-transform duration-300">
              AI Match <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Predictions</span>
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
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="cricket" size={20} /> Upcoming Matches
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match.id)}
                        className={`w-full p-4 rounded-lg transition-all duration-300 text-left ${
                          selectedMatch === match.id
                            ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-lg shadow-ipl-purple/30 transform scale-105'
                            : 'bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-ipl-gold/50 hover:bg-white/20 hover:scale-105'
                        }`}
                      >
                        <div className="font-bold mb-1 text-sm">
                          {match.team1.shortName} <span className="text-xs mx-1">vs</span> {match.team2.shortName}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-2">
                      <Icon name="stats" size={24} /> Win Probability
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
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Icon name="target" size={24} /> Prediction
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
