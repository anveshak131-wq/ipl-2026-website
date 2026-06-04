'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import ModernFeatureShowcase from '@/components/home/ModernFeatureShowcase';
import ConfettiAnimation from '@/components/effects/ConfettiAnimation';
import FloatingBadge from '@/components/effects/FloatingBadge';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import BackToTop from '@/components/ui/BackToTop';
import QuickStatsWidget from '@/components/home/QuickStatsWidget';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { 
  Trophy, 
  ArrowRight, 
  Play, 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap,
  Clock,
  Star,
  Target,
  Activity,
  Radio,
  Sparkles
} from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors } from '@/lib/wplColors';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { formatMatchTime } from '@/lib/timeUtils';
import { getAnimatedLogoPath } from '@/lib/logoUtils';
import PublicLiveMatchStrip from '@/components/live-score/PublicLiveMatchStrip';

export default function WPLHomePage() {
  const router = useRouter();
  const { currentLeague, setCurrentLeague } = useLeague();
  const TARGET_SEASON_YEAR = 2026;
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lastAcceptanceDate, setLastAcceptanceDate] = useState<string | null>(null);
  const [needsReAcceptance, setNeedsReAcceptance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasLiveMatch, setHasLiveMatch] = useState(false);
  
  // Mouse tracking for parallax effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 100 };

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const filterSeasonMatches = (items: Match[]): Match[] =>
    items.filter((match) => getMatchYear(match.date) === TARGET_SEASON_YEAR);
  
  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);
  
  // Calculate derived data
  const liveMatchCount = useMemo(() => (matches?.filter(m => m.status === 'live')?.length || 0), [matches]);
  const nextMatch = useMemo(() => {
    if (!matches || !Array.isArray(matches)) return null;
    const upcoming = matches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [matches]);
  
  const featuredLiveMatch = useMemo(() => {
    return matches.find(m => m.status === 'live') || null;
  }, [matches]);
  
  // Calculate total players from teams
  const totalPlayers = useMemo(() => {
    return teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
  }, [teams]);

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
    
    // Load data for WPL
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData, newsData, playersData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl'),
          api.getNews(),
          api.getPlayers(undefined, 'wpl').catch(() => []), // Fetch players for accurate counts
        ]);
        
        console.log('WPL Home page: Fetched players:', playersData?.length || 0);
        
        // Attach players to teams with improved matching
        const teamsWithPlayers = teamsData
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
            
            const teamPlayers = (playersData || []).filter(player => {
              const normalizedPlayerTeamId = normalizeId(player.teamId);
              const playerTeamIdVariations = [
                String(player.teamId),
                normalizedPlayerTeamId,
                `team${normalizedPlayerTeamId}`,
                String(player.teamId).replace(/^team/i, ''),
                String(player.teamId).toLowerCase(),
                String(player.teamId).toUpperCase()
              ];
              
              // Check if any variation matches
              return teamIdVariations.some(tv => 
                playerTeamIdVariations.some(pv => pv === tv)
              );
            });
            
            if (teamPlayers.length > 0) {
              console.log(`WPL Home page: Matched ${teamPlayers.length} players for team ${team.name} (ID: ${team.id})`);
            } else if (playersData && playersData.length > 0) {
              console.warn(`WPL Home page: No players matched for team ${team.name} (ID: ${team.id}). Sample player teamIds:`, 
                playersData.slice(0, 3).map(p => p.teamId));
            }
            
            return {
              ...team,
              league: team.league || 'wpl', // Ensure league is set for WPL teams
              players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
            };
          });
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'wpl' || item.league === 'both'
        );
        
        setTeams(teamsWithPlayers);
        const seasonMatches = filterSeasonMatches(matchesData);
        setMatches(seasonMatches);
        setNews(filteredNews);

        // Check if there's a live match
        const liveMatch = seasonMatches.some((match) => match.status === 'live');
        if (liveMatch) {
          setHasLiveMatch(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error('Error loading WPL data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up polling to refresh match data every 5 seconds for real-time updates
    const pollInterval = setInterval(() => {
      const loadMatchesOnly = async () => {
        try {
          const matchesData = await api.getMatches('wpl');
          if (matchesData && Array.isArray(matchesData)) {
            const seasonMatches = filterSeasonMatches(matchesData);
            setMatches(seasonMatches);
            const liveMatch = seasonMatches.some((match) => match.status === 'live');
            if (liveMatch && !hasLiveMatch) {
              setHasLiveMatch(true);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
          }
        } catch (error) {
          console.error('Error polling match data:', error);
        }
      };
      loadMatchesOnly();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [hasLiveMatch]);

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
    <div 
      className="min-h-screen overflow-x-hidden"
      style={{
        background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
      }}
    >
      <AuroraBackground />
      <WPLFloatingParticles />
      <Navbar />
      <PublicLiveMatchStrip league="wpl" matches={matches} />

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

      {/* Confetti Animation */}
      <ConfettiAnimation trigger={showConfetti} duration={3000} particleCount={50} />

      {/* Floating Badge */}
      {hasLiveMatch && (
        <FloatingBadge
          text="Live Now"
          icon="🔴"
          color="red"
          position="top-right"
          animated
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
                linear-gradient(rgba(147,51,234,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(147,51,234,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: `translate(${(mousePosition?.x ?? 0) * 0.5}px, ${(mousePosition?.y ?? 0) * 0.5}px)`,
            }}
          />

          {/* Dynamic Gradient Orbs with Mouse Parallax */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{
              x: useSpring(mouseX, springConfig),
              y: useSpring(mouseY, springConfig),
              background: `radial-gradient(circle, ${WPLColors.purpleRGBA[50]}, transparent)`,
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
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{
              x: useSpring(mouseX, springConfig),
              y: useSpring(mouseY, springConfig),
              background: `radial-gradient(circle, ${WPLColors.pinkRGBA[50]}, transparent)`,
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
            className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: `radial-gradient(circle, ${WPLColors.roseRGBA[50]}, transparent)`,
            }}
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
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: [WPLColors.purple, WPLColors.pink, WPLColors.rose][i % 3],
                opacity: 0.3,
              }}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
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
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="space-y-8"
              >
                {/* Premium Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-2xl border shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[30]}, ${WPLColors.pinkRGBA[30]}, ${WPLColors.roseRGBA[30]})`,
                    borderColor: WPLColors.purpleRGBA[40],
                    boxShadow: `0 10px 40px ${WPLColors.purpleRGBA[20]}`,
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: WPLColors.pink }} />
                  </motion.div>
                  <span 
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: WPLColors.textPrimary }}
                  >
                    Women's Premier League
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black leading-[0.85] tracking-tight"
                >
                  <motion.span
                    className="block bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    WPL
                  </motion.span>
                  <motion.span
                    className="block bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    2026
                  </motion.span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="text-xl md:text-2xl lg:text-3xl leading-relaxed max-w-xl"
                  style={{ color: WPLColors.textSecondary }}
                >
                  The pinnacle of women's T20 cricket. Experience the power, passion, and excellence of WPL 2026.
                </motion.p>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="grid grid-cols-3 gap-4 pt-4"
                >
                  {[
                    { label: 'Teams', value: teams.length || '5', color: 'from-purple-500 to-pink-500', delay: 0 },
                    { label: 'Matches', value: matches.length || '22', color: 'from-pink-500 to-rose-500', delay: 0.1 },
                    { label: 'Players', value: totalPlayers > 0 ? totalPlayers : '100+', color: 'from-rose-500 to-purple-500', delay: 0.2 },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.2 + stat.delay, type: "spring" }}
                      whileHover={{ scale: 1.1, y: -5 }}
                      className="group relative overflow-hidden p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer"
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                      <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: WPLColors.textMuted }}>{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/wpl/matches"
                      className="group relative px-10 py-5 rounded-xl text-white font-bold text-lg shadow-2xl transition-all duration-300 overflow-hidden block"
                      style={{
                        background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink})`,
                        boxShadow: `0 10px 40px ${WPLColors.purpleRGBA[50]}, 0 0 60px ${WPLColors.pinkRGBA[30]}`,
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <Play className="w-6 h-6" />
                        View Matches
                      </span>
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${WPLColors.pink}, ${WPLColors.purple})`,
                        }}
                        initial={{ x: '-100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/wpl/teams"
                      className="px-10 py-5 rounded-xl backdrop-blur-xl text-white font-bold text-lg border-2 transition-all duration-300 block"
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = WPLColors.purpleRGBA[20];
                        e.currentTarget.style.borderColor = WPLColors.purpleRGBA[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = WPLColors.purpleRGBA[10];
                        e.currentTarget.style.borderColor = WPLColors.purpleRGBA[30];
                      }}
                    >
                      Explore Teams
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/live-score"
                      className="px-10 py-5 rounded-xl backdrop-blur-xl text-white font-bold text-lg border-2 transition-all duration-300 block"
                      style={{
                        background: WPLColors.pinkRGBA[10],
                        borderColor: WPLColors.pinkRGBA[30],
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = WPLColors.pinkRGBA[20];
                        e.currentTarget.style.borderColor = WPLColors.pinkRGBA[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = WPLColors.pinkRGBA[10];
                        e.currentTarget.style.borderColor = WPLColors.pinkRGBA[30];
                      }}
                    >
                      Live Scores
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right Visual - Enhanced 3D Orb */}
              <motion.div
                initial={{ opacity: 0, x: 100, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                className="relative h-[500px] lg:h-[700px] flex items-center justify-center"
                style={{ perspective: '1000px' }}
              >
                {/* Central Orb */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  }}
                  className="relative w-80 h-80 lg:w-96 lg:h-96"
                  whileHover={{ scale: 1.15 }}
                >
                  {/* Glow Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background: `radial-gradient(circle, ${WPLColors.purpleRGBA[50]}, ${WPLColors.pinkRGBA[50]}, transparent)`,
                    }}
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Main Circle */}
                  <div 
                    className="relative w-full h-full rounded-full backdrop-blur-2xl border-2 flex items-center justify-center shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[20]}, ${WPLColors.roseRGBA[20]})`,
                      borderColor: WPLColors.purpleRGBA[40],
                    }}
                  >
                    <div className="text-center space-y-6">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        <Trophy className="w-28 h-28 mx-auto drop-shadow-2xl" style={{ color: WPLColors.pink }} />
                      </motion.div>
                      <div className="text-5xl font-black" style={{ color: WPLColors.textPrimary }}>WPL</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">2026</div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  {[
                    { top: '10%', right: '10%', text: teams.length || '5', label: 'Teams', delay: 0 },
                    { bottom: '15%', left: '10%', text: matches.length || '22', label: 'Matches', delay: 0.5 },
                    { top: '50%', right: '-5%', text: 'T20', label: 'Format', delay: 1 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, delay: 1.5 + item.delay, type: "spring" }}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      className={`absolute ${item.top || ''} ${item.right || ''} ${item.bottom || ''} ${item.left || ''} p-5 rounded-2xl backdrop-blur-xl border shadow-xl text-center`}
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                    >
                      <div className="text-3xl font-black" style={{ color: WPLColors.purple }}>{item.text}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: WPLColors.textMuted }}>{item.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Scroll Indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div 
              className="w-8 h-14 rounded-full border-2 flex items-start justify-center p-2 backdrop-blur-md cursor-pointer transition-colors"
              style={{
                borderColor: WPLColors.purpleRGBA[30],
                background: WPLColors.purpleRGBA[10],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = WPLColors.purpleRGBA[10];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = WPLColors.purpleRGBA[10];
              }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{
                  background: WPLColors.pink,
                }}
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
                className="relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 p-10 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${WPLColors.roseRGBA[30]}, ${WPLColors.pinkRGBA[30]}, ${WPLColors.roseRGBA[30]})`,
                  borderColor: WPLColors.roseRGBA[40],
                }}
              >
                <motion.div
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                  style={{
                    background: WPLColors.roseRGBA[20],
                  }}
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
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: WPLColors.rose,
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-lg font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Live Match</span>
                    </div>
                    <Link
                      href="/live-score"
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl border text-white font-semibold transition-all hover:scale-105"
                      style={{
                        background: WPLColors.roseRGBA[20],
                        borderColor: WPLColors.roseRGBA[40],
                      }}
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
                      <div className="text-3xl font-black mb-2" style={{ color: WPLColors.textPrimary }}>{featuredLiveMatch.team1.shortName}</div>
                      <div className="text-sm" style={{ color: WPLColors.textSecondary }}>{featuredLiveMatch.team1.name}</div>
                    </motion.div>
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
                    >
                      <div className="text-5xl font-black mb-3" style={{ color: WPLColors.textPrimary }}>VS</div>
                      <div className="text-sm mb-4" style={{ color: WPLColors.textSecondary }}>
                        {formatMatchTime(featuredLiveMatch.time, featuredLiveMatch.date)}
                      </div>
                      {/* Display Toss Information */}
                      {featuredLiveMatch.matchState?.toss && (
                        <motion.div 
                          className="text-xs px-3 py-2 rounded-lg inline-block"
                          style={{
                            background: WPLColors.roseRGBA[30],
                            color: WPLColors.textPrimary,
                          }}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <div className="font-semibold">
                            {featuredLiveMatch.matchState.toss.winner === 'team1' ? featuredLiveMatch.team1.shortName : featuredLiveMatch.team2.shortName} won the toss
                          </div>
                          <div style={{ color: WPLColors.textSecondary }} className="text-xs">
                            chose to {featuredLiveMatch.matchState.toss.decision === 'bat' ? 'bat' : 'bowl'}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                    <motion.div
                      className="text-center md:text-right"
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="text-3xl font-black mb-2" style={{ color: WPLColors.textPrimary }}>{featuredLiveMatch.team2.shortName}</div>
                      <div className="text-sm" style={{ color: WPLColors.textSecondary }}>{featuredLiveMatch.team2.name}</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}
        
        {/* Quick Stats Widget - Enhanced */}
        {!isLoading && (
          <section className="relative py-12 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.5}>
                <QuickStatsWidget matches={matches} />
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* Teams Showcase - Enhanced */}
        {isLoading ? (
          <TeamsSkeleton />
        ) : teams.filter(t => !isPlaceholderTeam(t)).length > 0 ? (
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full backdrop-blur-sm"
                    style={{
                      background: WPLColors.purpleRGBA[20],
                      border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Users className="w-5 h-5" style={{ color: WPLColors.purple }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Elite Franchises</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black" style={{ color: WPLColors.textPrimary }}>
                    WPL <GradientText gradient="from-purple-400 to-pink-400" animate>Teams</GradientText>
                  </h2>
                </div>
                <Link
                  href="/wpl/teams"
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl border transition-all duration-300 hover:scale-105"
                  style={{
                    background: WPLColors.purpleRGBA[10],
                    borderColor: WPLColors.purpleRGBA[30],
                    color: WPLColors.purple,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[20];
                    e.currentTarget.style.color = WPLColors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[10];
                    e.currentTarget.style.color = WPLColors.purple;
                  }}
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              <ModernTeamsShowcase teams={teams.filter(t => !isPlaceholderTeam(t)).slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Matches Grid - Enhanced */}
        {isLoading ? (
          <MatchesSkeleton />
        ) : (
          <section className="relative py-24 overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${WPLColors.gradientStart}1A, transparent, transparent)`,
              }}
            />
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full backdrop-blur-sm"
                    style={{
                      background: WPLColors.pinkRGBA[20],
                      border: `1px solid ${WPLColors.pinkRGBA[30]}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: WPLColors.pink }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Upcoming Fixtures</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black" style={{ color: WPLColors.textPrimary }}>
                    Upcoming <GradientText gradient="from-pink-400 to-rose-400" animate>Matches</GradientText>
                  </h2>
                </div>
                <Link
                  href="/wpl/matches"
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl border transition-all duration-300 hover:scale-105"
                  style={{
                    background: WPLColors.pinkRGBA[10],
                    borderColor: WPLColors.pinkRGBA[30],
                    color: WPLColors.pink,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = WPLColors.pinkRGBA[20];
                    e.currentTarget.style.color = WPLColors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WPLColors.pinkRGBA[10];
                    e.currentTarget.style.color = WPLColors.pink;
                  }}
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              <ModernMatchesGrid matches={matches} />
            </div>
          </section>
        )}

        {/* Stats Section - Enhanced */}
        {!isLoading && (
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full backdrop-blur-sm"
                    style={{
                      background: WPLColors.roseRGBA[20],
                      border: `1px solid ${WPLColors.roseRGBA[30]}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: WPLColors.rose }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Performance Analytics</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black" style={{ color: WPLColors.textPrimary }}>
                    League <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>Statistics</GradientText>
                  </h2>
                </div>
                <Link
                  href="/wpl/stats"
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl border transition-all duration-300 hover:scale-105"
                  style={{
                    background: WPLColors.roseRGBA[10],
                    borderColor: WPLColors.roseRGBA[30],
                    color: WPLColors.rose,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = WPLColors.roseRGBA[20];
                    e.currentTarget.style.color = WPLColors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WPLColors.roseRGBA[10];
                    e.currentTarget.style.color = WPLColors.rose;
                  }}
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              <ModernStatsSection 
                totalMatches={matches.length}
                totalTeams={teams.filter(t => !isPlaceholderTeam(t)).length}
                activePlayers={totalPlayers > 0 ? totalPlayers.toString() : undefined}
              />
            </div>
          </section>
        )}

        {/* News Section - Enhanced */}
        {isLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-24 overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${WPLColors.gradientEnd}1A, transparent, transparent)`,
              }}
            />
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full backdrop-blur-sm"
                    style={{
                      background: WPLColors.purpleRGBA[20],
                      border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="w-5 h-5" style={{ color: WPLColors.purple }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Breaking News</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black" style={{ color: WPLColors.textPrimary }}>
                    Latest <GradientText gradient="from-pink-400 to-purple-400" animate>News</GradientText>
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl border transition-all duration-300 hover:scale-105"
                  style={{
                    background: WPLColors.purpleRGBA[10],
                    borderColor: WPLColors.purpleRGBA[30],
                    color: WPLColors.purple,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[20];
                    e.currentTarget.style.color = WPLColors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[10];
                    e.currentTarget.style.color = WPLColors.purple;
                  }}
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Predictions Panel Section */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 p-10 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.pinkRGBA[20]}, ${WPLColors.roseRGBA[20]}, ${WPLColors.pinkRGBA[20]})`,
                borderColor: WPLColors.pinkRGBA[40],
              }}
            >
              <motion.div
                className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                style={{
                  background: WPLColors.pinkRGBA[20],
                }}
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
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <motion.div
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full backdrop-blur-sm"
                    style={{
                      background: WPLColors.pinkRGBA[30],
                      border: `1px solid ${WPLColors.pinkRGBA[40]}`,
                    }}
                  >
                    <Target className="w-5 h-5" style={{ color: WPLColors.pink }} />
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>Match Predictions</span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: WPLColors.textPrimary }}>
                    Predict & <GradientText gradient="from-pink-400 to-rose-400" animate>Win</GradientText>
                  </h2>
                  <p className="text-lg mb-6 leading-relaxed" style={{ color: WPLColors.textSecondary }}>
                    Test your cricket knowledge! Predict match outcomes, player performances, and compete on the leaderboard. Show off your expertise and climb the rankings.
                  </p>
                  <Link
                    href="/predictions"
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-2xl transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.pink}, ${WPLColors.rose})`,
                      boxShadow: `0 10px 40px ${WPLColors.pinkRGBA[50]}, 0 0 60px ${WPLColors.roseRGBA[30]}`,
                    }}
                  >
                    <Target className="w-6 h-6" />
                    <span>Start Predicting</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Match Winner', icon: Trophy, color: 'from-pink-500 to-rose-500' },
                    { label: 'Top Scorer', icon: Star, color: 'from-rose-500 to-purple-500' },
                    { label: 'Most Wickets', icon: Activity, color: 'from-purple-500 to-pink-500' },
                    { label: 'Player of Match', icon: Target, color: 'from-pink-500 to-rose-500' },
                  ].map((feature, idx) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="p-6 rounded-2xl backdrop-blur-xl border transition-all"
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = WPLColors.purpleRGBA[10];
                        e.currentTarget.style.borderColor = WPLColors.purpleRGBA[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = WPLColors.purpleRGBA[10];
                        e.currentTarget.style.borderColor = WPLColors.purpleRGBA[30];
                      }}
                    >
                      <feature.icon className={`w-8 h-8 mb-3 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
                      <p className="text-sm font-semibold" style={{ color: WPLColors.textPrimary }}>{feature.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Showcase */}
        {!isLoading && (
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ModernFeatureShowcase />
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
