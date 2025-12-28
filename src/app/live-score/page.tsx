"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Emoji, { EmojiName } from '@/components/emoji/Emoji';
import EmojiPicker from '@/components/emoji/EmojiPicker';
import type { Match } from '@/types';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors, getWPLGradient, getWPLGlassmorphism } from '@/lib/wplColors';
import AuroraBackground from '@/components/ui/AuroraBackground';
import ModernTeamLogo from '@/components/ui/ModernTeamLogo';
import { 
  HelpCircle, 
  BookOpen, 
  Radio, 
  TrendingUp, 
  Clock, 
  MapPin,
  Users,
  MessageCircle,
  Send,
  LogOut,
  Trash2,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';

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

const getPasswordStrength = (password: string) => {
  if (!password) {
    return { label: '', score: 0 };
  }

  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Weak', score };
  if (score === 2 || score === 3) return { label: 'Medium', score };
  return { label: 'Strong', score };
};

const EMOJI_CODE_MAP: Record<string, EmojiName> = {
  fire: 'fire',
  clap: 'clap',
  rocket: 'rocket',
  heart: 'heart',
  wow: 'wow',
  thumbs_up: 'thumbs_up',
};

const renderMessageTextWithEmojis = (text: string) => {
  if (!text) return null;
  const parts: Array<string | { key: string; emoji: EmojiName }> = [];
  const regex = /:(fire|clap|rocket|heart|wow|thumbs_up):/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const code = match[1];
    const emojiName = EMOJI_CODE_MAP[code];
    if (emojiName) {
      parts.push({ key: `${match.index}-${code}`, emoji: emojiName });
    } else {
      parts.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <Emoji key={part.key || index} name={part.emoji} size={18} className="mx-0.5" />
        ),
      )}
    </>
  );
};

export default function LiveScorePage() {
  const router = useRouter();
  const { currentLeague, isWPL } = useLeague();
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
  const [expandedCommentary, setExpandedCommentary] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const passwordStrength = getPasswordStrength(authFormData.password);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  // League-aware styling
  const leagueColors = isWPL ? {
    primary: WPLColors.purple,
    secondary: WPLColors.pink,
    accent: WPLColors.violet,
    gradient: getWPLGradient('to-br'),
    glass: getWPLGlassmorphism('purple', 20),
    textPrimary: WPLColors.textPrimary,
    textSecondary: WPLColors.textSecondary,
  } : {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg, #1E3A8A, #3B82F6, #F59E0B)',
    glass: {
      background: 'rgba(30, 64, 175, 0.2)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
    },
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0',
  };

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

  useEffect(() => {
    if (!turnstileReady || !showAuthModal || authMode !== 'signup') return;
    if (typeof window === 'undefined') return;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    const anyWindow = window as any;
    if (!anyWindow.turnstile) return;
    const container = document.getElementById('turnstile-container');
    if (!container) return;
    container.innerHTML = '';
    anyWindow.turnstile.render('#turnstile-container', {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'error-callback': () => setTurnstileToken(null),
    } as any);
  }, [turnstileReady, showAuthModal, authMode]);

  useEffect(() => {
    let isCancelled = false;
    const getMatchDateTime = (match: Match) => {
      try {
        return new Date(`${match.date}T${match.time}:00+05:30`);
      } catch {
        return new Date(match.date);
      }
    };
    const isInLiveWindow = (match: Match) => {
      const start = getMatchDateTime(match);
      const now = new Date();
      const preWindow = new Date(start.getTime() - 60 * 60 * 1000);
      const postWindow = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      if (match.status === 'live') return true;
      return now >= preWindow && now <= postWindow;
    };
    const fetchMatchesAndScores = async () => {
      try {
        const matchesRes = await fetch('/api/matches');
        if (!matchesRes.ok) throw new Error('Failed to load fixtures');
        const allMatches: Match[] = await matchesRes.json();
        if (isCancelled) return;
        setMatches(allMatches);
        const eligible = allMatches.filter((m) => isInLiveWindow(m));
        setActiveMatches(eligible);
        if (eligible.length === 0) {
          setIsLiveLoading(false);
          return;
        }
        const scoreEntries: [string, LiveScoreData][] = [];
        await Promise.all(
          eligible.map(async (match) => {
            try {
              const res = await fetch(`/api/live-score?matchId=${encodeURIComponent(match.id)}`);
              if (!res.ok) return;
              const score: LiveScoreData = await res.json();
              const mergedScore: LiveScoreData = {
                ...score,
                matchId: match.id,
                team1: { ...score.team1, name: match.team1.shortName || match.team1.name },
                team2: { ...score.team2, name: match.team2.shortName || match.team2.name },
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
    const interval = setInterval(fetchMatchesAndScores, 5000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

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
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    trackUserActivity();
    const interval = setInterval(() => trackUserActivity(), 30000);
    return () => clearInterval(interval);
  }, [user, trackUserActivity]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId: 'current', text: newMessage }),
      });
      if (response.ok) {
        setNewMessage('');
        await trackUserActivity();
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (!authFormData.password || authFormData.password.length < 12) {
        alert('Password must be at least 12 characters long.');
        return;
      }
      if (!turnstileToken) {
        alert('Please complete the human verification before creating an account.');
        return;
      }
    }
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          authMode === 'signin'
            ? { email: authFormData.email, password: authFormData.password }
            : { ...authFormData, turnstileToken },
        ),
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      'This will delete your account and anonymize your chat messages. This cannot be undone. Do you want to continue?'
    );
    if (!confirmed) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('You are not logged in.');
      return;
    }
    try {
      const response = await fetch('/api/account?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        setUser(null);
        setMessages([]);
        router.push('/');
      } else {
        const error = await response.json().catch(() => null);
        alert(error?.error || 'Failed to delete account. Please try again.');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      alert('An error occurred while deleting your account. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isWPL ? getWPLGradient('to-b') : 'linear-gradient(to bottom, #0F172A, #1E3A8A)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-t-transparent"
          style={{ borderColor: isWPL ? WPLColors.purple : '#3B82F6' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isWPL ? getWPLGradient('to-b') : 'linear-gradient(to bottom, #0F172A, #1E3A8A, #0F172A)' }}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />
      <Navbar />
      <AuroraBackground />

      <main className="flex-grow relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 rounded-2xl"
              style={{
                background: isWPL ? WPLColors.purpleRGBA[20] : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${isWPL ? WPLColors.purple : '#3B82F6'}`,
              }}
            >
              <Radio className="w-6 h-6" style={{ color: isWPL ? WPLColors.purple : '#3B82F6' }} />
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                    Live Score
              </h1>
              <p className="text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Real-time match updates
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Score Section */}
          <div className="lg:col-span-2 space-y-6">
              {isLiveLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="rounded-3xl p-8"
                    style={leagueColors.glass}
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-white/10 rounded-lg w-3/4"></div>
                  <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-white/10 rounded-xl"></div>
                        <div className="h-32 bg-white/10 rounded-xl"></div>
                  </div>
                    </div>
                  </motion.div>
                ))}
                </div>
              ) : activeMatches.length > 0 ? (
              <AnimatePresence>
                {activeMatches.map((match, index) => {
                    const liveScore = liveScoresByMatch[match.id];
                  const isLive = liveScore?.status !== 'Completed';

                    return (
                    <motion.div
                        key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
                      style={leagueColors.glass}
                    >
                      {/* Animated background gradient */}
                      <motion.div
                        className="absolute inset-0 opacity-20"
                        animate={{
                          background: isWPL 
                            ? `radial-gradient(circle at ${50 + Math.sin(Date.now() / 2000) * 20}% ${50 + Math.cos(Date.now() / 2000) * 20}%, ${WPLColors.purple}, transparent)`
                            : `radial-gradient(circle at ${50 + Math.sin(Date.now() / 2000) * 20}% ${50 + Math.cos(Date.now() / 2000) * 20}%, #3B82F6, transparent)`,
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />

                      {/* Match Header */}
                      <div className="relative z-10 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">{match.venue}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                              {match.team1.shortName} vs {match.team2.shortName}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{match.date} · {match.time}</span>
                            </div>
                            {liveScore && (
                              <div className="mt-3 space-y-1">
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
                          <motion.div
                            animate={isLive ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
                            className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                            style={{
                              background: isLive 
                                ? (isWPL ? WPLColors.pinkRGBA[20] : 'rgba(239, 68, 68, 0.2)')
                                : (isWPL ? WPLColors.violetRGBA[20] : 'rgba(34, 197, 94, 0.2)'),
                              border: `1px solid ${isLive 
                                ? (isWPL ? WPLColors.pink : '#EF4444')
                                : (isWPL ? WPLColors.violet : '#22C55E')}`,
                              color: isLive 
                                ? (isWPL ? WPLColors.pink : '#EF4444')
                                : (isWPL ? WPLColors.violet : '#22C55E'),
                            }}
                          >
                            {isLive ? (
                              <>
                                <motion.div
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: isWPL ? WPLColors.pink : '#EF4444' }}
                                />
                                LIVE
                              </>
                            ) : (
                              <>
                                <Trophy className="w-3 h-3" />
                                COMPLETED
                              </>
                            )}
                          </motion.div>
                        </div>

                        {/* Result Banner */}
                        {liveScore?.status === 'Completed' && liveScore.resultText && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl p-4 mb-4"
                            style={{
                              background: isWPL ? WPLColors.violetRGBA[20] : 'rgba(34, 197, 94, 0.2)',
                              border: `1px solid ${isWPL ? WPLColors.violet : '#22C55E'}`,
                            }}
                          >
                            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: isWPL ? WPLColors.violet : '#22C55E' }}>
                              Result
                            </p>
                            <p className="text-sm font-semibold text-white">{liveScore.resultText}</p>
                          </motion.div>
                        )}
                      </div>

                      {liveScore ? (
                        <div className="relative z-10 space-y-6">
                            {/* Score Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { team: liveScore.team1, matchTeam: match.team1, isBatting: liveScore.battingTeam === 'team1' },
                              { team: liveScore.team2, matchTeam: match.team2, isBatting: liveScore.battingTeam === 'team2' },
                            ].map(({ team, matchTeam, isBatting }, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="rounded-2xl p-6 relative overflow-hidden"
                                style={{
                                  background: isBatting
                                    ? (isWPL ? `linear-gradient(135deg, ${WPLColors.purpleRGBA[30]}, ${WPLColors.pinkRGBA[20]})` : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))')
                                    : (isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.1)'),
                                  border: `2px solid ${isBatting 
                                    ? (isWPL ? WPLColors.purple : '#3B82F6')
                                    : (isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)')}`,
                                }}
                              >
                                {isBatting && (
                              <motion.div
                                    className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
                                    style={{
                                      background: isWPL ? WPLColors.pinkRGBA[30] : 'rgba(239, 68, 68, 0.3)',
                                      color: isWPL ? WPLColors.pink : '#EF4444',
                                    }}
                                    animate={{ opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    BATTING
                                  </motion.div>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                  <ModernTeamLogo
                                    teamId={matchTeam.id}
                                    shortName={matchTeam.shortName || matchTeam.name}
                                    league={currentLeague}
                                    size={48}
                                  />
                                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                </div>
                                <motion.div 
                                  key={`${team.runs}-${team.wickets}`}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-2"
                                >
                                  <div className="text-5xl font-black" style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}>
                                    {team.runs}<span className="text-3xl">/{team.wickets}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-gray-300">
                                    <span className="flex items-center gap-1">
                                      <Zap className="w-4 h-4" />
                                      {team.overs} overs
                                    </span>
                                  </div>
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Current Players */}
                              <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl p-6"
                            style={{
                              background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.1)',
                              border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                            }}
                          >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5" style={{ color: isWPL ? WPLColors.purple : '#3B82F6' }} />
                              Current Players
                            </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                <p className="text-xs text-gray-400 mb-1">Batter</p>
                                  <p className="text-white font-semibold">{liveScore.currentBatter.name || '-'}</p>
                                <p className="text-sm mt-1" style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}>
                                    {liveScore.currentBatter.runs} ({liveScore.currentBatter.balls})
                                  </p>
                                </div>
                                <div>
                                <p className="text-xs text-gray-400 mb-1">Bowler</p>
                                  <p className="text-white font-semibold">{liveScore.currentBowler.name || '-'}</p>
                                <p className="text-sm mt-1" style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}>
                                    {liveScore.currentBowler.runs} ({liveScore.currentBowler.balls})
                                  </p>
                                </div>
                              </div>
                          </motion.div>

                            {/* Commentary */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-2xl p-6"
                            style={{
                              background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.1)',
                              border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                            }}
                          >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <MessageCircle className="w-5 h-5" style={{ color: isWPL ? WPLColors.purple : '#3B82F6' }} />
                              Commentary
                            </h3>
                              {liveScore.commentary && liveScore.commentary.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(expandedCommentary[match.id] ? liveScore.commentary : liveScore.commentary.slice(0, 8)).map((comment, idx) => (
                                  <motion.div
                                      key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="text-gray-300 text-sm pl-4 py-2 border-l-2 rounded-r"
                                    style={{ borderColor: isWPL ? WPLColors.purple : '#F59E0B' }}
                                    >
                                      {comment}
                                  </motion.div>
                                  ))}
                                  {liveScore.commentary.length > 8 && (
                                    <button
                                      type="button"
                                    onClick={() => setExpandedCommentary((prev) => ({ ...prev, [match.id]: !prev[match.id] }))}
                                    className="mt-2 text-xs font-semibold hover:underline"
                                    style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}
                                    >
                                      {expandedCommentary[match.id] ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-400">No commentary yet</p>
                              )}
                          </motion.div>

                          {/* Rules Help */}
                          <div className="flex items-center justify-between p-4 rounded-xl" style={{
                            background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.1)',
                          }}>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <HelpCircle className="w-4 h-4" />
                              <span>Need help understanding the rules?</span>
                            </div>
                            <Link
                              href="/rules"
                              className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                              style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}
                            >
                              <BookOpen className="w-4 h-4" />
                              View Rules
                            </Link>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">Live score data is not available yet for this match.</p>
                        )}
                    </motion.div>
                    );
                  })}
              </AnimatePresence>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 rounded-3xl"
                style={leagueColors.glass}
                >
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                  style={{
                    background: isWPL ? WPLColors.purpleRGBA[20] : 'rgba(59, 130, 246, 0.2)',
                    border: `1px solid ${isWPL ? WPLColors.purple : '#3B82F6'}`,
                  }}
                  >
                  <Trophy className="w-10 h-10 text-gray-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">No Live Match</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    There are currently no live matches. Check back soon or view upcoming matches in the schedule.
                  </p>
                <Link
                    href="/matches"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{
                    background: isWPL ? WPLColors.purple : '#F59E0B',
                    color: '#FFFFFF',
                  }}
                  >
                    View Schedule
                  <TrendingUp className="w-4 h-4" />
                </Link>
                </motion.div>
              )}
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-6 h-[600px] flex flex-col"
              style={leagueColors.glass}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" style={{ color: isWPL ? WPLColors.purple : '#3B82F6' }} />
                  Live Chat
                </h2>
                {user && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{
                    background: isWPL ? WPLColors.pinkRGBA[20] : 'rgba(34, 197, 94, 0.2)',
                    color: isWPL ? WPLColors.pink : '#22C55E',
                    border: `1px solid ${isWPL ? WPLColors.pink : '#22C55E'}`,
                  }}>
                    {user.name}
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex flex-col flex-grow">
                  <div className="flex-grow overflow-y-auto mb-4 space-y-3 rounded-xl p-3" style={{
                    background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.1)',
                  }}>
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold" style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}>
                              {msg.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-300 mt-1 break-words">
                            {renderMessageTextWithEmojis(msg.text)}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No messages yet. Be the first!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <EmojiPicker
                      onSelect={(code) => setNewMessage((prev) => (prev ? `${prev} ${code}`.trim() : code))}
                    />
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your comment..."
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition-all"
                      style={{
                        background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.2)',
                        border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !newMessage.trim()}
                      className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      style={{
                        background: isWPL ? WPLColors.purple : '#F59E0B',
                        color: '#FFFFFF',
                      }}
                    >
                      {isSendingMessage ? 'Sending...' : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                        className="px-3 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                        style={{
                          background: isWPL ? WPLColors.roseRGBA[20] : 'rgba(239, 68, 68, 0.2)',
                          color: isWPL ? WPLColors.rose : '#EF4444',
                          border: `1px solid ${isWPL ? WPLColors.rose : '#EF4444'}`,
                        }}
                      >
                        <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                        className="px-3 py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-1"
                        style={{
                          background: isWPL ? WPLColors.roseRGBA[10] : 'rgba(127, 29, 29, 0.2)',
                          color: isWPL ? WPLColors.rose : '#DC2626',
                          border: `1px solid ${isWPL ? WPLColors.roseRGBA[30] : 'rgba(220, 38, 38, 0.3)'}`,
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                    </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Sign in to join the conversation!</p>
                    <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('signin');
                      }}
                        className="w-full px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                        style={{
                          background: isWPL ? WPLColors.purple : '#F59E0B',
                          color: '#FFFFFF',
                        }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('signup');
                      }}
                        className="w-full px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                        style={{
                          background: isWPL ? WPLColors.purpleRGBA[20] : 'rgba(30, 64, 175, 0.2)',
                          color: isWPL ? WPLColors.purple : '#3B82F6',
                          border: `1px solid ${isWPL ? WPLColors.purple : '#3B82F6'}`,
                        }}
                    >
                      Create Account
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
      {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-3xl shadow-2xl p-8"
              style={leagueColors.glass}
            >
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
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                    style={{
                      background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.2)',
                      border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                    }}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authFormData.email}
                onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{
                    background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.2)',
                    border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                  }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authFormData.password}
                onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                required
                minLength={12}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{
                    background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.2)',
                    border: `1px solid ${isWPL ? WPLColors.purpleRGBA[30] : 'rgba(59, 130, 246, 0.3)'}`,
                  }}
                />
              {authMode === 'signup' && authFormData.password && (
                  <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Password strength</span>
                      <span className={passwordStrength.label === 'Weak' ? 'text-red-400' : passwordStrength.label === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'}>
                      {passwordStrength.label}
                    </span>
                  </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isWPL ? WPLColors.purpleRGBA[10] : 'rgba(30, 64, 175, 0.2)' }}>
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.label === 'Weak' ? 'bg-red-500' : passwordStrength.label === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Use at least 12 characters with a mix of letters, numbers, and symbols.
                  </p>
                </div>
              )}
              {authMode === 'signup' && (
                <div className="mt-3 space-y-1">
                  <div id="turnstile-container" className="flex justify-center" />
                  <p className="text-[11px] text-gray-500 text-center">
                    This quick check helps keep the live chat free from bots and spam.
                  </p>
                </div>
              )}
              <button
                type="submit"
                  className="w-full px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{
                    background: isWPL ? WPLColors.purple : '#F59E0B',
                    color: '#FFFFFF',
                  }}
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: isWPL ? WPLColors.purple : '#F59E0B' }}
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
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
