'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Match } from '@/types';

interface LiveScoreData {
  matchId: string;
  team1: { name: string; runs: number; wickets: number; overs: number };
  team2: { name: string; runs: number; wickets: number; overs: number };
  currentBatter: { name: string; runs: number; balls: number };
  currentBowler: { name: string; runs: number; balls: number };
  commentary: string[];
  status: string;
  lastUpdated: string;
  innings?: number;
  battingTeam?: 'team1' | 'team2';
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'bowl';
  };
  resultText?: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function LiveScorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [liveScoresByMatch, setLiveScoresByMatch] = useState<Record<string, LiveScoreData>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authFormData, setAuthFormData] = useState({ email: '', password: '', name: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track user activity for admin engagement page
  const trackUserActivity = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/admin/users/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId: 'current' }),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user]);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch matches and live scores, and determine which matches should show live panels
  useEffect(() => {
    let isCancelled = false;

    const getMatchDateTime = (match: Match) => {
      // Combine date and time; assume IST (UTC+5:30) for IPL fixtures
      // Example date: '2026-03-23', time: '19:30'
      try {
        return new Date(`${match.date}T${match.time}:00+05:30`);
      } catch {
        return new Date(match.date);
      }
    };

    const isInLiveWindow = (match: Match) => {
      const start = getMatchDateTime(match);
      const now = new Date();

      // Start showing 60 minutes before scheduled time
      const preWindow = new Date(start.getTime() - 60 * 60 * 1000);
      // Keep visible for 4 hours after start to cover the match
      const postWindow = new Date(start.getTime() + 4 * 60 * 60 * 1000);

      // Always show if backend marks it as live
      if (match.status === 'live') return true;

      return now >= preWindow && now <= postWindow;
    };

    const fetchMatchesAndScores = async () => {
      try {
        const matchesRes = await fetch('/api/matches');
        if (!matchesRes.ok) {
          throw new Error('Failed to load fixtures');
        }
        const allMatches: Match[] = await matchesRes.json();
        if (isCancelled) return;

        setMatches(allMatches);

        // Filter matches that should be visible on live score page
        const eligible = allMatches.filter((m) => isInLiveWindow(m));
        setActiveMatches(eligible);

        if (eligible.length === 0) {
          setIsLiveLoading(false);
          return;
        }

        // Fetch live score for each eligible match by its ID
        const scoreEntries: [string, LiveScoreData][] = [];

        await Promise.all(
          eligible.map(async (match) => {
            try {
              const res = await fetch(`/api/live-score?matchId=${encodeURIComponent(match.id)}`);
              if (!res.ok) return;
              const score: LiveScoreData = await res.json();

              // Override team names from fixtures so they always match schedule
              const mergedScore: LiveScoreData = {
                ...score,
                matchId: match.id,
                team1: {
                  ...score.team1,
                  name: match.team1.shortName || match.team1.name,
                },
                team2: {
                  ...score.team2,
                  name: match.team2.shortName || match.team2.name,
                },
              };

              scoreEntries.push([match.id, mergedScore]);
            } catch (err) {
              console.error('Error fetching live score for match', match.id, err);
            }
          })
        );

        if (isCancelled) return;

        setLiveScoresByMatch((prev) => {
          const next: Record<string, LiveScoreData> = { ...prev };
          for (const [id, score] of scoreEntries) {
            next[id] = score;
          }
          return next;
        });
      } catch (error) {
        console.error('Error loading live fixtures/scores:', error);
      } finally {
        if (!isCancelled) {
          setIsLiveLoading(false);
        }
      }
    };

    fetchMatchesAndScores();
    const interval = setInterval(fetchMatchesAndScores, 5000); // keep in sync with admin updates

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Fetch messages (only if user is logged in)
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=current&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Track user activity periodically when logged in
  useEffect(() => {
    if (!user) return;

    // Track activity immediately on login
    trackUserActivity();

    // Then track every 30 seconds while on the page
    const interval = setInterval(() => {
      trackUserActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, trackUserActivity]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user) {
      return;
    }

    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: 'current',
          text: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Track activity when message is sent
        await trackUserActivity();
        // Scroll to bottom after message is sent
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Always POST to /api/auth; the server infers signup vs signin from body fields
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'signin'
          ? { email: authFormData.email, password: authFormData.password }
          : authFormData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        setShowAuthModal(false);
        setAuthFormData({ email: '', password: '', name: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Error during authentication');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    setUser(null);
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-ipl-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Score Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
              <h1 className="text-3xl font-bold text-white mb-8">Live Score</h1>

              {isLiveLoading ? (
                <div className="space-y-8 animate-pulse">
                  {/* Loading skeleton */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-6 h-32"></div>
                    <div className="bg-slate-700/30 rounded-lg p-6 h-32"></div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-6 h-24"></div>
                  <div className="bg-slate-700/30 rounded-lg p-6 h-40"></div>
                </div>
              ) : activeMatches.length > 0 ? (
                <div className="space-y-10">
                  {activeMatches.map((match) => {
                    const liveScore = liveScoresByMatch[match.id];

                    return (
                      <div
                        key={match.id}
                        className="space-y-6 border border-white/5 rounded-2xl p-6 bg-slate-900/40"
                      >
                        {/* Match header from fixtures */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-400">
                              {match.venue}
                            </p>
                            <h2 className="text-xl font-bold text-white">
                              {match.team1.shortName} vs {match.team2.shortName}
                            </h2>
                            <p className="text-sm text-gray-400">
                              {match.date} · {match.time}
                            </p>
                            {liveScore && (
                              <div className="mt-1 space-y-1">
                                {typeof liveScore.innings === 'number' && (
                                  <p className="text-xs text-gray-400">
                                    {liveScore.innings === 1 ? '1st innings' : '2nd innings'} –{' '}
                                    {liveScore.battingTeam === 'team2' ? liveScore.team2.name : liveScore.team1.name} batting
                                  </p>
                                )}
                                {liveScore.toss && (
                                  <p className="text-xs text-gray-500">
                                    Toss: {liveScore.toss.winner === 'team2' ? liveScore.team2.name : liveScore.team1.name}{' '}
                                    won the toss and chose to {liveScore.toss.decision === 'bat' ? 'bat' : 'bowl'}.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/40">
                            {liveScore?.status === 'Completed' ? 'Match Result' : 'Live Score'}
                          </span>
                        </div>

                        {liveScore ? (
                          <div className="space-y-6">
                            {/* Result banner when match is completed */}
                            {liveScore.status === 'Completed' && liveScore.resultText && (
                              <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-1">Result</p>
                                <p className="text-sm text-emerald-100 font-medium">{liveScore.resultText}</p>
                              </div>
                            )}

                            {/* Score Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Team 1 */}
                              <div className="bg-gradient-to-br from-red-900/20 to-red-600/20 border border-red-500/30 rounded-lg p-6">
                                <h3 className="text-xl font-bold text-white mb-4">{liveScore.team1.name}</h3>
                                <div className="space-y-2">
                                  <div className="text-4xl font-bold text-ipl-gold">
                                    {liveScore.team1.runs}/{liveScore.team1.wickets}
                                  </div>
                                  <div className="text-gray-300">Overs: {liveScore.team1.overs}</div>
                                </div>
                              </div>

                              {/* Team 2 */}
                              <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-6">
                                <h3 className="text-xl font-bold text-white mb-4">{liveScore.team2.name}</h3>
                                <div className="space-y-2">
                                  <div className="text-4xl font-bold text-ipl-gold">
                                    {liveScore.team2.runs}/{liveScore.team2.wickets}
                                  </div>
                                  <div className="text-gray-300">Overs: {liveScore.team2.overs}</div>
                                </div>
                              </div>
                            </div>

                            {/* Current Players */}
                            <div className="bg-slate-700/30 rounded-lg p-6 border border-white/5">
                              <h3 className="text-lg font-bold text-white mb-4">Current Match</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-gray-400 text-sm">Batter</p>
                                  <p className="text-white font-semibold">{liveScore.currentBatter.name || '-'}</p>
                                  <p className="text-ipl-gold text-sm">
                                    {liveScore.currentBatter.runs} ({liveScore.currentBatter.balls})
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Bowler</p>
                                  <p className="text-white font-semibold">{liveScore.currentBowler.name || '-'}</p>
                                  <p className="text-ipl-gold text-sm">
                                    {liveScore.currentBowler.runs} ({liveScore.currentBowler.balls})
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Commentary */}
                            <div className="bg-slate-700/30 rounded-lg p-6 border border-white/5">
                              <h3 className="text-lg font-bold text-white mb-4">Commentary</h3>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {liveScore.commentary && liveScore.commentary.length > 0 ? (
                                  liveScore.commentary.map((comment, idx) => (
                                    <div
                                      key={idx}
                                      className="text-gray-300 text-sm border-l-2 border-ipl-gold pl-3 py-1"
                                    >
                                      {comment}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-400">No commentary yet</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">Live score data is not available yet for this match.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/30 border border-white/10 mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Live Match</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    There are currently no live matches. Check back soon or view upcoming matches in the schedule.
                  </p>
                  <a
                    href="/matches"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ipl-gold hover:bg-ipl-gold/90 text-slate-900 font-bold rounded-lg transition-colors"
                  >
                    View Schedule
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Live Chat</h2>
                {user && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    {user.name}
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex flex-col flex-grow">
                  {/* Messages */}
                  <div className="flex-grow overflow-y-auto mb-4 space-y-3 bg-slate-900/30 rounded-lg p-3">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-ipl-gold">{msg.userName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-300 mt-1">{msg.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No messages yet. Be the first!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your comment..."
                      maxLength={500}
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ipl-gold"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !newMessage.trim()}
                      className="w-full px-3 py-2 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSendingMessage ? 'Sending...' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Sign in to join the conversation!</p>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('signin');
                      }}
                      className="mb-2 w-full px-4 py-2 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-semibold rounded-lg transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('signup');
                      }}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={authFormData.name}
                  onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authFormData.email}
                onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
              />
              <input
                type="password"
                placeholder="Password"
                value={authFormData.password}
                onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
              />

              <button
                type="submit"
                className="w-full px-4 py-2 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-semibold rounded-lg transition-colors"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-ipl-gold hover:text-ipl-gold/80 text-sm"
              >
                {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
