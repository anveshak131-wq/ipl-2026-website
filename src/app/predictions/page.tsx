'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import MatchSelector from '@/components/predictions/MatchSelector';
import PredictionForm from '@/components/predictions/PredictionForm';
import PollCard from '@/components/predictions/PollCard';
import Leaderboard from '@/components/predictions/Leaderboard';
import PredictionHistory from '@/components/predictions/PredictionHistory';
import AccuracyStats from '@/components/predictions/AccuracyStats';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Match, Poll } from '@/types';
import { Target, Trophy, BarChart3, History, TrendingUp } from 'lucide-react';

export default function PredictionsPage() {
  const { currentLeague } = useLeague();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [existingPrediction, setExistingPrediction] = useState<any | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [activeTab, setActiveTab] = useState<'predict' | 'leaderboard' | 'history' | 'stats'>('predict');
  const [user, setUser] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Get current user
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            setUser(JSON.parse(userStr));
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      } finally {
        setPageLoading(false);
      }
    } else {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!selectedMatchId) {
        setSelectedMatch(null);
        setExistingPrediction(null);
        setPoll(null);
        setError(null);
        return;
      }

      try {
        setError(null);
        // Fetch match details
        const matches = await api.getMatches(currentLeague);
        const match = matches.find((m: Match) => m.id === selectedMatchId);
        setSelectedMatch(match || null);

        // Fetch existing prediction if user is logged in
        if (user?.id) {
          try {
            const predictions = await api.getPredictions({
              matchId: selectedMatchId,
              userId: user.id,
            });
            setExistingPrediction(predictions.length > 0 ? predictions[0] : null);
          } catch (predError) {
            console.error('Error fetching predictions:', predError);
            // Don't set error for predictions, just continue
          }
        } else {
          setExistingPrediction(null);
        }

        // Fetch poll
        try {
          const pollData = await api.getPolls(selectedMatchId);
          setPoll(pollData);
        } catch (pollError) {
          console.error('Error fetching poll:', pollError);
          // Don't set error for polls, just continue
        }
      } catch (error: any) {
        console.error('Error fetching match data:', error);
        setError(error.message || 'Failed to load match data');
      }
    };

    fetchMatchData();
  }, [selectedMatchId, currentLeague, user, refreshKey]);

  const handlePredictionSuccess = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab('history');
  };

  const handlePollVote = () => {
    setRefreshKey((k) => k + 1);
  };

  const tabs = [
    { id: 'predict', label: 'Make Prediction', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'history', label: 'My History', icon: History },
    { id: 'stats', label: 'My Stats', icon: TrendingUp },
  ];

  if (pageLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="relative py-16 min-h-screen overflow-hidden section-match-bg">
          <AuroraBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ipl-gold"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative py-16 min-h-screen overflow-hidden section-match-bg">
        <AuroraBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Target className="w-10 h-10 text-ipl-gold" />
              Match Predictions
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Predict match outcomes, player performances, and compete on the leaderboard!
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white shadow-lg shadow-ipl-gold/20'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'predict' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                >
                  {!user?.id ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 mb-4">Please log in to make predictions</p>
                      <a
                        href="/account"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all"
                      >
                        Go to Account
                      </a>
                    </div>
                  ) : (
                    <>
                      <MatchSelector
                        selectedMatchId={selectedMatchId}
                        onSelectMatch={setSelectedMatchId}
                      />
                      {selectedMatch && (
                        <div className="mt-6 pt-6 border-t border-gray-700">
                          <PredictionForm
                            match={selectedMatch}
                            existingPrediction={existingPrediction}
                            onSuccess={handlePredictionSuccess}
                          />
                        </div>
                      )}
                      {poll && selectedMatchId && (
                        <div className="mt-6 pt-6 border-t border-gray-700">
                          <PollCard poll={poll} matchId={selectedMatchId} onVote={handlePollVote} />
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                >
                  <Leaderboard 
                    matchId={selectedMatchId || undefined} 
                    currentUserId={user?.id} 
                  />
                </motion.div>
              )}

              {activeTab === 'history' && user?.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                >
                  <PredictionHistory userId={user.id} />
                </motion.div>
              )}

              {activeTab === 'history' && !user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center py-12"
                >
                  <p className="text-gray-400 mb-4">Please log in to view your prediction history</p>
                  <a
                    href="/account"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all"
                  >
                    Go to Account
                  </a>
                </motion.div>
              )}

              {activeTab === 'stats' && user?.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                >
                  <AccuracyStats userId={user.id} />
                </motion.div>
              )}

              {activeTab === 'stats' && !user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center py-12"
                >
                  <p className="text-gray-400 mb-4">Please log in to view your prediction statistics</p>
                  <a
                    href="/account"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all"
                  >
                    Go to Account
                  </a>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              {user?.id && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-ipl-gold" />
                    Quick Stats
                  </h3>
                  <AccuracyStats userId={user.id} />
                </motion.div>
              )}

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-ipl-gold/20 to-ipl-purple/20 border border-ipl-gold/50 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-ipl-gold">•</span>
                    <span>Predict match winners and player performances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ipl-gold">•</span>
                    <span>Earn points for accurate predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ipl-gold">•</span>
                    <span>Compete on the global leaderboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ipl-gold">•</span>
                    <span>Track your prediction accuracy over time</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-ipl-gold/30">
                  <div className="text-xs text-gray-400">
                    <strong className="text-ipl-gold">Scoring:</strong>
                    <br />
                    Match Winner: 10 pts
                    <br />
                    Top Scorer: 5 pts
                    <br />
                    Most Wickets: 5 pts
                    <br />
                    Player of Match: 10 pts
                    <br />
                    <strong>Total: 30 pts per match</strong>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
