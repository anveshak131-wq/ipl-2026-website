'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import BackToTop from '@/components/ui/BackToTop';
import QuickActionBar from '@/components/home/QuickActionBar';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { api } from '@/lib/data';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match, News } from '@/types';
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  Play, 
  TrendingUp, 
  Calendar, 
  Radio, 
  Zap,
  Clock,
  Users,
  Flame,
  Star,
  ChevronRight,
  Target,
  Activity
} from 'lucide-react';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { formatMatchTime } from '@/lib/timeUtils';
import { getAnimatedLogoPath } from '@/lib/logoUtils';

export default function Home() {
  const router = useRouter();
  const { setCurrentLeague } = useLeague();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lastAcceptanceDate, setLastAcceptanceDate] = useState<string | null>(null);
  const [needsReAcceptance, setNeedsReAcceptance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Mouse tracking for parallax effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 100 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  // IPL Data
  const [iplTeams, setIplTeams] = useState<Team[]>([]);
  const [iplMatches, setIplMatches] = useState<Match[]>([]);
  const [iplLoading, setIplLoading] = useState(true);
  
  // WPL Data
  const [wplTeams, setWplTeams] = useState<Team[]>([]);
  const [wplMatches, setWplMatches] = useState<Match[]>([]);
  const [wplLoading, setWplLoading] = useState(true);
  
  // News (shared)
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  
  // Calculate derived data
  const iplLiveMatches = useMemo(() => iplMatches.filter(m => m.status === 'live'), [iplMatches]);
  const wplLiveMatches = useMemo(() => wplMatches.filter(m => m.status === 'live'), [wplMatches]);
  const totalLiveMatches = iplLiveMatches.length + wplLiveMatches.length;
  
  // Calculate total players for each league
  const iplTotalPlayers = useMemo(() => {
    return iplTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
  }, [iplTeams]);
  
  const wplTotalPlayers = useMemo(() => {
    return wplTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
  }, [wplTeams]);
  
  const totalPlayers = iplTotalPlayers + wplTotalPlayers;
  
  const iplNextMatch = useMemo(() => {
    const upcoming = iplMatches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [iplMatches]);
  
  const wplNextMatch = useMemo(() => {
    const upcoming = wplMatches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [wplMatches]);

  const featuredLiveMatch = useMemo(() => {
    const allLive = [...iplLiveMatches, ...wplLiveMatches];
    return allLive[0] || null;
  }, [iplLiveMatches, wplLiveMatches]);

  // Get last completed match for each league
  const iplLastMatch = useMemo(() => {
    const completed = iplMatches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return completed[0] || null;
  }, [iplMatches]);

  const wplLastMatch = useMemo(() => {
    const completed = wplMatches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return completed[0] || null;
  }, [wplMatches]);

  // Get upcoming matches for hover preview
  const iplUpcomingMatches = useMemo(() => {
    return iplMatches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [iplMatches]);

  const wplUpcomingMatches = useMemo(() => {
    return wplMatches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [wplMatches]);

  // State for logo carousel
  const [iplLogoIndex, setIplLogoIndex] = useState(0);
  const [wplLogoIndex, setWplLogoIndex] = useState(0);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPos = (clientX / innerWidth - 0.5) * 100;
      const yPos = (clientY / innerHeight - 0.5) * 100;
      setMousePosition({ x: xPos, y: yPos });
      mouseX.set(xPos);
      mouseY.set(yPos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    setIsHydrated(true);
    
    // Always default to IPL on homepage
    setCurrentLeague('ipl');
    
    // Check if user has accepted terms
    const termsAccepted = localStorage.getItem("terms_accepted");
    const acceptanceDate = localStorage.getItem("terms_accepted_date");
    const acceptedVersion = localStorage.getItem("terms_version");
    
    setLastAcceptanceDate(acceptanceDate);

    if (termsAccepted !== "true") {
      setShowTermsModal(true);
    } else if (acceptedVersion !== "1.1") {
      setNeedsReAcceptance(true);
      setShowTermsModal(true);
    }

    // Helper function to normalize team/player IDs for matching
    const normalizeId = (id: string | number | undefined): string => {
      if (!id) return '';
      const str = String(id).trim();
      const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
      return numMatch ? numMatch[0] : str.toLowerCase();
    };
    
    // Load data for both leagues
    const loadData = async () => {
      try {
        // Load IPL data
        setIplLoading(true);
        const [iplTeamsData, iplMatchesData, iplPlayersData] = await Promise.all([
          api.getTeams('ipl'),
          api.getMatches('ipl'),
          api.getPlayers(undefined, 'ipl').catch(() => []),
        ]);
        
        // Attach players to teams with improved matching
        const iplTeamsWithPlayers = iplTeamsData.map(team => {
          const normalizedTeamId = normalizeId(team.id);
          const teamIdVariations = [
            String(team.id),
            normalizedTeamId,
            `team${normalizedTeamId}`,
            String(team.id).replace(/^team/i, ''),
            String(team.id).toLowerCase(),
            String(team.id).toUpperCase()
          ];
          
          const teamPlayers = (iplPlayersData || []).filter(player => {
            const normalizedPlayerTeamId = normalizeId(player.teamId);
            const playerTeamIdVariations = [
              String(player.teamId),
              normalizedPlayerTeamId,
              `team${normalizedPlayerTeamId}`,
              String(player.teamId).replace(/^team/i, ''),
              String(player.teamId).toLowerCase(),
              String(player.teamId).toUpperCase()
            ];
            
            return teamIdVariations.some(tv => 
              playerTeamIdVariations.some(pv => pv === tv)
            );
          });
          
          return {
            ...team,
            players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
          };
        });
        
        setIplTeams(iplTeamsWithPlayers);
        setIplMatches(iplMatchesData);
        setIplLoading(false);

        // Load WPL data
        setWplLoading(true);
        const [wplTeamsData, wplMatchesData, wplPlayersData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl'),
          api.getPlayers(undefined, 'wpl').catch(() => []),
        ]);
        
        const wplTeamsWithPlayers = wplTeamsData
          .filter(team => !isPlaceholderTeam(team))
          .map(team => {
            const normalizedTeamId = normalizeId(team.id);
            const teamIdVariations = [
              String(team.id),
              normalizedTeamId,
              `team${normalizedTeamId}`,
              String(team.id).replace(/^team/i, ''),
              String(team.id).toLowerCase(),
              String(team.id).toUpperCase()
            ];
            
            const teamPlayers = (wplPlayersData || []).filter(player => {
              const normalizedPlayerTeamId = normalizeId(player.teamId);
              const playerTeamIdVariations = [
                String(player.teamId),
                normalizedPlayerTeamId,
                `team${normalizedPlayerTeamId}`,
                String(player.teamId).replace(/^team/i, ''),
                String(player.teamId).toLowerCase(),
                String(player.teamId).toUpperCase()
              ];
              
              return teamIdVariations.some(tv => 
                playerTeamIdVariations.some(pv => pv === tv)
              );
            });
            
            return {
              ...team,
              players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
            };
          });
        
        setWplTeams(wplTeamsWithPlayers);
        setWplMatches(wplMatchesData);
        setWplLoading(false);

        // Load news
        setNewsLoading(true);
        const newsData = await api.getNews();
        setNews(newsData);
        setNewsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIplLoading(false);
        setWplLoading(false);
        setNewsLoading(false);
      }
    };

    loadData();
  }, [setCurrentLeague]);

  // Auto-rotate team logos carousel
  useEffect(() => {
    const iplFilteredTeams = iplTeams.filter(t => !isPlaceholderTeam(t));
    if (iplFilteredTeams.length > 0) {
      const interval = setInterval(() => {
        setIplLogoIndex((prev) => (prev + 1) % Math.min(iplFilteredTeams.length, 5));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [iplTeams]);

  useEffect(() => {
    const wplFilteredTeams = wplTeams.filter(t => !isPlaceholderTeam(t));
    if (wplFilteredTeams.length > 0) {
      const interval = setInterval(() => {
        setWplLogoIndex((prev) => (prev + 1) % Math.min(wplFilteredTeams.length, 5));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [wplTeams]);

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    const redirectPath = sessionStorage.getItem("terms_redirect_after");
    if (redirectPath && redirectPath !== "/") {
      sessionStorage.removeItem("terms_redirect_after");
      router.push(redirectPath);
    }
  };

  const handleDeclineTerms = () => {
    setShowTermsModal(false);
  };

  const shouldShowModal = isHydrated && showTermsModal;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      <AuroraBackground />
      <Navbar />

      {/* Terms Acceptance Modal */}
      {shouldShowModal && (
        <TermsAcceptanceModal
          isOpen={shouldShowModal}
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
          needsReAcceptance={needsReAcceptance}
          lastAcceptanceDate={lastAcceptanceDate}
        />
      )}

      <main className="relative z-10">
        {/* Enhanced Hero Section with Mouse Parallax */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            }}
          />

          {/* Dynamic Gradient Orbs with Mouse Parallax */}
            <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]"
            style={{
              x: useSpring(mouseX, { damping: 50, stiffness: 100 }),
              y: useSpring(mouseY, { damping: 50, stiffness: 100 }),
            }}
              animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
              duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
            style={{
              x: useSpring(mouseX, { damping: 50, stiffness: 100 }),
              y: useSpring(mouseY, { damping: 50, stiffness: 100 }),
            }}
              animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
              duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
            <motion.div
            className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
              animate={{
                scale: [1, 1.5, 1],
              opacity: [0.15, 0.3, 0.15],
              rotate: [0, 180, 360],
              }}
              transition={{
              duration: 30,
                repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear",
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-8">
              {/* Premium Badge with Glow Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-purple-500/20"
              >
                  <motion.div
                  className="relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <motion.div
                    className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Premier Cricket Leagues 2026
                </span>
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-pink-500/0"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>

              {/* Main Heading with Staggered Animation */}
              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black text-white leading-[0.85] tracking-tight"
                >
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Cricket
                  </motion.span>
                  <motion.span
                    className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    Reimagined
                  </motion.span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
                >
                  Your ultimate destination for{' '}
                  <span className="text-blue-400 font-semibold relative">
                    <span className="relative z-10">IPL</span>
                    <motion.span
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400/30"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 1.2 }}
                    />
                  </span>
                  {' '}and{' '}
                  <span className="text-purple-400 font-semibold relative">
                    <span className="relative z-10">WPL</span>
                    <motion.span
                      className="absolute bottom-0 left-0 right-0 h-1 bg-purple-400/30"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 1.4 }}
                    />
                  </span>
                  . Live scores, real-time stats, breaking news, and everything cricket.
                </motion.p>
              </div>

              {/* Live Match Badge */}
              {featuredLiveMatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1, type: "spring" }}
                  className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 backdrop-blur-2xl border-2 border-red-500/40 shadow-2xl shadow-red-500/20"
                >
                  <motion.div
                    className="w-4 h-4 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-sm font-bold text-red-300 uppercase tracking-wider">
                    Live Now
                  </span>
                  <span className="text-white font-bold text-lg">
                    {featuredLiveMatch.team1.shortName} vs {featuredLiveMatch.team2.shortName}
                  </span>
                  <Link
                    href="/live-score"
                    className="ml-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-semibold transition-all hover:scale-105"
                  >
                    Watch →
                  </Link>
                </motion.div>
              )}

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="flex flex-wrap justify-center gap-6 pt-8"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/live-score"
                    className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 overflow-hidden block"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Play className="w-6 h-6" />
                    Watch Live
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/matches"
                    className="group px-12 py-6 rounded-2xl bg-white/10 backdrop-blur-2xl text-white font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 flex items-center gap-3"
                >
                    View Matches
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
                </motion.div>
              </motion.div>

              {/* Enhanced Quick Stats with Hover Effects */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-12"
              >
                {[
                  { icon: Trophy, label: 'Teams', value: iplTeams.length + wplTeams.length, color: 'from-blue-500 to-cyan-500', delay: 0 },
                  { icon: Calendar, label: 'Matches', value: iplMatches.length + wplMatches.length, color: 'from-purple-500 to-pink-500', delay: 0.1 },
                  { icon: Radio, label: 'Live', value: totalLiveMatches, color: 'from-red-500 to-orange-500', delay: 0.2 },
                  { icon: TrendingUp, label: 'Leagues', value: 2, color: 'from-green-500 to-emerald-500', delay: 0.3 },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.5 + stat.delay, type: "spring" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center cursor-pointer hover:bg-white/10 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <motion.div
                      className="relative z-10"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-white transition-colors" />
                    </motion.div>
                    <motion.p
                      className="text-5xl font-black text-white mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 + stat.delay, type: "spring" }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</p>
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Enhanced Scroll Indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-14 rounded-full border-2 border-white/30 flex items-start justify-center p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <motion.div
                className="w-2 h-2 rounded-full bg-white/70"
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </section>

        {/* Featured Live Match Section - Enhanced */}
        {featuredLiveMatch && (
          <section className="relative py-16 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 backdrop-blur-2xl border-2 border-red-500/40 p-10 shadow-2xl"
              >
                <motion.div
                  className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-4 h-4 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-lg font-bold text-red-300 uppercase tracking-wider">Live Match</span>
                    </div>
                    <Link
                      href="/live-score"
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold transition-all hover:scale-105"
                    >
                      Watch Live
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8 items-center">
                    <motion.div
                      className="text-center md:text-left"
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="text-3xl font-black text-white mb-2">{featuredLiveMatch.team1.shortName}</div>
                      <div className="text-sm text-gray-300">{featuredLiveMatch.team1.name}</div>
                    </motion.div>
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
                    >
                      <div className="text-5xl font-black text-white mb-3">VS</div>
                      <div className="text-sm text-gray-300">
                        {formatMatchTime(featuredLiveMatch.date, featuredLiveMatch.time)}
                      </div>
                    </motion.div>
                    <motion.div
                      className="text-center md:text-right"
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="text-3xl font-black text-white mb-2">{featuredLiveMatch.team2.shortName}</div>
                      <div className="text-sm text-gray-300">{featuredLiveMatch.team2.name}</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* League Selection Cards - Enhanced 3D Design */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm"
              >
                <Target className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Choose Your League</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Experience <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Both Worlds</span>
              </h2>
              <p className="text-gray-400 text-xl">The ultimate cricket experience awaits</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
              {/* IPL Card - Enhanced */}
              <motion.div 
                initial={{ opacity: 0, x: -100, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, type: "spring" }}
                whileHover={{ scale: 1.03, y: -12, rotateY: 5 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/50 via-blue-500/40 to-cyan-500/50 backdrop-blur-2xl border-2 border-blue-500/40 p-10 cursor-pointer shadow-2xl shadow-blue-500/20"
                onClick={() => router.push('/ipl')}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <motion.div
                  className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    x: [0, 50, 0],
                    y: [0, 50, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <motion.div
                        className="relative p-6 rounded-3xl bg-blue-500/40 border-2 border-blue-400/50 backdrop-blur-xl shadow-xl overflow-hidden"
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AnimatePresence mode="wait">
                          {iplTeams.filter(t => !isPlaceholderTeam(t)).slice(0, 5).map((team, idx) => (
                            idx === iplLogoIndex && (
                              <motion.div
                                key={team.id}
                                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                                transition={{ duration: 0.6, type: "spring" }}
                              >
                                <Image
                                  src={getAnimatedLogoPath(team.id, team.shortName, 'ipl')}
                                  alt={team.shortName}
                                  width={50}
                                  height={50}
                                  className="object-contain"
                                />
                              </motion.div>
                            )
                          ))}
                        </AnimatePresence>
                      </motion.div>
                      <div>
                        <h3 className="text-4xl font-black text-white mb-2">Indian Premier League</h3>
                        <p className="text-base text-blue-200 font-bold">IPL 2026</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-blue-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                    </motion.div>
              </div>

                  <p className="text-gray-100 mb-10 leading-relaxed text-lg">
                    The world's biggest T20 cricket league. Experience the thrill, passion, and glory of the men's premier tournament.
                  </p>

                  <div className="grid grid-cols-3 gap-5 mb-8">
                    {[
                      { label: 'Teams', value: iplTeams.filter(t => !isPlaceholderTeam(t)).length },
                      { label: 'Matches', value: iplMatches.length },
                      { label: 'Live', value: iplLiveMatches.length },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all"
                      >
                        <p className="text-5xl font-black text-white mb-2">{stat.value}</p>
                        <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Last Match Result */}
                  {iplLastMatch && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mb-6 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <p className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Last Result
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-semibold ${
                            iplLastMatch.score && iplLastMatch.score.team1.runs > iplLastMatch.score.team2.runs 
                              ? 'text-yellow-400' 
                              : 'text-white'
                          }`}>
                            {iplLastMatch.team1.shortName}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span className={`text-base font-semibold ${
                            iplLastMatch.score && iplLastMatch.score.team2.runs > iplLastMatch.score.team1.runs 
                              ? 'text-yellow-400' 
                              : 'text-white'
                          }`}>
                            {iplLastMatch.team2.shortName}
                          </span>
                        </div>
                        {iplLastMatch.result && (
                          <motion.span
                            className="text-lg text-yellow-400 font-bold"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ✓
                          </motion.span>
                        )}
                </div>
                    </motion.div>
                  )}

                  {iplNextMatch && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mb-8 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Next Match</p>
                          <p className="text-base font-semibold text-white">
                            {iplNextMatch.team1.shortName} vs {iplNextMatch.team2.shortName}
                          </p>
                        </div>
                        <CountdownTimer targetDate={iplNextMatch.date} matchTime={iplNextMatch.time} />
                      </div>
                    </motion.div>
                  )}

                  {/* Hover Preview */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 to-cyan-600/95 backdrop-blur-2xl rounded-3xl p-10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto">
                    <div className="h-full flex flex-col">
                      <h4 className="text-2xl font-black text-white mb-6">Upcoming Matches</h4>
                      <div className="flex-1 space-y-4 overflow-y-auto">
                        {iplUpcomingMatches.length > 0 ? (
                          iplUpcomingMatches.map((match, idx) => (
                            <motion.div
                              key={match.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-semibold text-white">
                                  {match.team1.shortName} vs {match.team2.shortName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Clock className="w-4 h-4" />
                                {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
            </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No upcoming matches</p>
            )}
          </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-blue-200 font-bold text-xl relative z-10 mt-8">
                    <span>Explore IPL</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              {/* WPL Card - Enhanced */}
              <motion.div
                initial={{ opacity: 0, x: 100, rotateY: 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, type: "spring" }}
                whileHover={{ scale: 1.03, y: -12, rotateY: -5 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/50 via-pink-500/40 to-rose-500/50 backdrop-blur-2xl border-2 border-purple-500/40 p-10 cursor-pointer shadow-2xl shadow-purple-500/20"
                onClick={() => router.push('/wpl')}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <motion.div
                  className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -50, 0],
                    y: [0, 50, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <motion.div
                        className="relative p-6 rounded-3xl bg-purple-500/40 border-2 border-purple-400/50 backdrop-blur-xl shadow-xl overflow-hidden"
                        whileHover={{ rotate: [0, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AnimatePresence mode="wait">
                          {wplTeams.filter(t => !isPlaceholderTeam(t)).slice(0, 5).map((team, idx) => (
                            idx === wplLogoIndex && (
                              <motion.img
                                key={team.id}
                                src={getAnimatedLogoPath(team.id, team.shortName, 'wpl')}
                                alt={team.shortName}
                                className="w-12 h-12 object-contain"
                                initial={{ opacity: 0, scale: 0.5, rotate: 180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: -180 }}
                                transition={{ duration: 0.6, type: "spring" }}
                              />
                            )
                          ))}
                        </AnimatePresence>
                      </motion.div>
                      <div>
                        <h3 className="text-4xl font-black text-white mb-2">Women's Premier League</h3>
                        <p className="text-base text-purple-200 font-bold">WPL 2026</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                    </motion.div>
            </div>

                  <p className="text-gray-100 mb-10 leading-relaxed text-lg">
                    The pinnacle of women's T20 cricket. Power, passion, and excellence in every match.
                  </p>

                  <div className="grid grid-cols-3 gap-5 mb-8">
                    {[
                      { label: 'Teams', value: wplTeams.filter(t => !isPlaceholderTeam(t)).length },
                      { label: 'Matches', value: wplMatches.length },
                      { label: 'Live', value: wplLiveMatches.length },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all"
                      >
                        <p className="text-5xl font-black text-white mb-2">{stat.value}</p>
                        <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Last Match Result */}
                  {wplLastMatch && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mb-6 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <p className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Last Result
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-semibold ${
                            wplLastMatch.score && wplLastMatch.score.team1.runs > wplLastMatch.score.team2.runs 
                              ? 'text-yellow-400' 
                              : 'text-white'
                          }`}>
                            {wplLastMatch.team1.shortName}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span className={`text-base font-semibold ${
                            wplLastMatch.score && wplLastMatch.score.team2.runs > wplLastMatch.score.team1.runs 
                              ? 'text-yellow-400' 
                              : 'text-white'
                          }`}>
                            {wplLastMatch.team2.shortName}
                          </span>
                        </div>
                        {wplLastMatch.result && (
                          <motion.span
                            className="text-lg text-yellow-400 font-bold"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {wplNextMatch && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mb-8 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Next Match</p>
                          <p className="text-base font-semibold text-white">
                            {wplNextMatch.team1.shortName} vs {wplNextMatch.team2.shortName}
                          </p>
                        </div>
                        <CountdownTimer targetDate={wplNextMatch.date} matchTime={wplNextMatch.time} />
                      </div>
                    </motion.div>
                  )}

                  {/* Hover Preview */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 to-pink-600/95 backdrop-blur-2xl rounded-3xl p-10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto">
                    <div className="h-full flex flex-col">
                      <h4 className="text-2xl font-black text-white mb-6">Upcoming Matches</h4>
                      <div className="flex-1 space-y-4 overflow-y-auto">
                        {wplUpcomingMatches.length > 0 ? (
                          wplUpcomingMatches.map((match, idx) => (
                            <motion.div
                              key={match.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-semibold text-white">
                                  {match.team1.shortName} vs {match.team2.shortName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Clock className="w-4 h-4" />
                                {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
                </div>
                            </motion.div>
                          ))
            ) : (
                          <p className="text-gray-400 text-sm">No upcoming matches</p>
            )}
          </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-purple-200 font-bold text-xl relative z-10 mt-8">
                    <span>Explore WPL</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Matches Section - Enhanced */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-16"
            >
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Upcoming Matches</span>
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black text-white">
                  Featured <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Matches</span>
              </h2>
            </div>
              <Link
                href="/matches"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300 hover:scale-105"
              >
                View All
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>

            {/* Enhanced Matches Grid */}
            {iplLoading || wplLoading ? (
              <MatchesSkeleton />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...iplMatches.slice(0, 3), ...wplMatches.slice(0, 3)]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 6)
                  .map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: idx * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.05, y: -8 }}
                      className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
                      onClick={() => router.push(match.league === 'wpl' ? '/wpl/matches' : '/matches')}
                    >
                      <motion.div
                        className={`absolute top-0 left-0 w-full h-1 ${
                          match.league === 'ipl' 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="flex items-center justify-between mb-6">
                        <span className={`text-xs font-bold px-4 py-2 rounded-full ${
                          match.league === 'ipl' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {match.league.toUpperCase()}
                        </span>
                        {match.status === 'live' && (
                            <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <motion.div
                              className="w-2.5 h-2.5 bg-red-500 rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-xs font-bold text-red-400">LIVE</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-3xl font-black text-white">{match.team1.shortName}</div>
                        <div className="text-gray-400 text-lg font-bold">VS</div>
                        <div className="text-3xl font-black text-white">{match.team2.shortName}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-2 transition-all" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Teams Showcase Section - Enhanced */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Featured Teams</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Premier <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Teams</span>
              </h2>
              <p className="text-gray-400 text-xl">Meet the champions of both leagues</p>
            </motion.div>

            {/* IPL Teams */}
            {iplLoading ? (
              <TeamsSkeleton />
            ) : iplTeams.filter(t => !isPlaceholderTeam(t)).length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="mb-16"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-white">IPL Teams</h3>
                  <Link
                    href="/teams"
                    className="group text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 hover:gap-4 transition-all"
                  >
                    View All
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
                <ModernTeamsShowcase teams={iplTeams.filter(t => !isPlaceholderTeam(t)).slice(0, 5)} />
              </motion.div>
            ) : null}

            {/* WPL Teams */}
            {wplLoading ? (
              <TeamsSkeleton />
            ) : wplTeams.filter(t => !isPlaceholderTeam(t)).length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-white">WPL Teams</h3>
                  <Link
                    href="/wpl/teams"
                    className="group text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2 hover:gap-4 transition-all"
                  >
                    View All
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
                <ModernTeamsShowcase teams={wplTeams.filter(t => !isPlaceholderTeam(t)).slice(0, 5)} />
              </motion.div>
            ) : null}
          </div>
        </section>

        {/* Stats Section - Enhanced */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">League Statistics</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                League <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</span>
              </h2>
              <p className="text-gray-400 text-xl">Comprehensive insights from both premier leagues</p>
            </motion.div>
            <ModernStatsSection 
              totalMatches={iplMatches.length + wplMatches.length}
              totalTeams={iplTeams.filter(t => !isPlaceholderTeam(t)).length + wplTeams.filter(t => !isPlaceholderTeam(t)).length}
              activePlayers={totalPlayers > 0 ? totalPlayers.toString() : undefined}
            />
          </div>
        </section>

        {/* News Section - Enhanced */}
        {newsLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-between mb-16"
              >
                <div>
                  <motion.div
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-pink-500/20 border border-pink-500/30 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Flame className="w-5 h-5 text-pink-400" />
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Latest News</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black text-white">
                    Breaking <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">News</span>
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-pink-400 transition-all duration-300 hover:scale-105"
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Final CTA Section - Enhanced */}
        <section className="relative py-40 mt-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
          
          {/* Animated background elements */}
            <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              x: [0, -80, 0],
              y: [0, -60, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring" }}
              className="space-y-10"
            >
              <motion.div
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Join The Action</span>
              </motion.div>
              
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-tight">
                Ready to Experience
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Cricket Excellence?
                </span>
              </h2>
              
              <p className="text-gray-300 text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed">
                Join millions of cricket fans following live scores, stats, and all the action from both premier leagues.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/live-score"
                    className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 overflow-hidden block"
                >
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      <Play className="w-7 h-7" />
                    Watch Live Scores
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/matches"
                    className="group px-12 py-6 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-4"
                >
                    View All Matches
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
          </section>
      </main>

      <Footer />
      <BackToTop />
      <QuickActionBar />
    </div>
  );
}
