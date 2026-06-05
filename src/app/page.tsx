'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
import IplChampionHighlight from '@/components/champions/IplChampionHighlight';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { api } from '@/lib/data';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match, News } from '@/types';
import { 
  Trophy, 
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

const OIL_NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
const HERO_STADIUM_BG = '/images/cricket-oil-stadium-hero.png';

type HeroLightStreak = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: string;
  rotate: string;
  delay: number;
};

const HERO_LIGHT_STREAKS: HeroLightStreak[] = [
  { top: '16%', left: '-8%', width: '34rem', rotate: '-9deg', delay: 0 },
  { top: '30%', right: '-10%', width: '30rem', rotate: '14deg', delay: 0.4 },
  { bottom: '18%', left: '8%', width: '20rem', rotate: '4deg', delay: 0.8 },
];

const HERO_QUICK_LINKS = [
  { label: 'Points Table', href: '/ipl/points-table' },
  { label: 'Orange Cap', href: '/stats' },
  { label: 'Purple Cap', href: '/stats' },
  { label: 'Teams', href: '/teams' },
] as const;

const LEAGUE_OIL_THEMES = {
  ipl: {
    base: 'linear-gradient(155deg, #070b17 0%, #0c142b 42%, #071a2e 74%, #05060d 100%)',
    hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(34,211,238,0.26) 0%, rgba(59,130,246,0.10) 55%, transparent 80%)',
    hazeB: 'radial-gradient(74% 66% at 88% 88%, rgba(251,191,36,0.20) 0%, rgba(168,85,247,0.08) 55%, transparent 80%)',
    brush: 'linear-gradient(112deg, rgba(34,211,238,0.18), rgba(59,130,246,0.09), rgba(251,191,36,0.05))',
    orbA: 'radial-gradient(circle at 30% 25%, rgba(34,211,238,0.22), transparent 70%)',
    orbB: 'radial-gradient(circle at 78% 70%, rgba(251,191,36,0.16), transparent 72%)',
    conic: 'conic-gradient(from 210deg at 55% 50%, rgba(34,211,238,0.18), rgba(59,130,246,0.14), rgba(251,191,36,0.12), rgba(34,211,238,0.18))',
    borderRgb: '34,211,238',
    accentLine:
      'linear-gradient(90deg, transparent, rgba(34,211,238,0.9), rgba(59,130,246,0.9), rgba(251,191,36,0.88), transparent)',
  },
  wpl: {
    base: 'linear-gradient(155deg, #10071d 0%, #1c0b2d 38%, #142244 72%, #0a172f 100%)',
    hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(236,72,153,0.26) 0%, rgba(168,85,247,0.10) 55%, transparent 80%)',
    hazeB: 'radial-gradient(75% 66% at 88% 88%, rgba(34,211,238,0.20) 0%, rgba(56,189,248,0.08) 55%, transparent 80%)',
    brush: 'linear-gradient(112deg, rgba(236,72,153,0.18), rgba(168,85,247,0.09), rgba(34,211,238,0.05))',
    orbA: 'radial-gradient(circle at 26% 22%, rgba(236,72,153,0.22), transparent 70%)',
    orbB: 'radial-gradient(circle at 78% 74%, rgba(34,211,238,0.14), transparent 72%)',
    conic: 'conic-gradient(from 210deg at 55% 50%, rgba(236,72,153,0.18), rgba(168,85,247,0.14), rgba(34,211,238,0.12), rgba(236,72,153,0.18))',
    borderRgb: '236,72,153',
    accentLine:
      'linear-gradient(90deg, transparent, rgba(236,72,153,0.9), rgba(168,85,247,0.9), rgba(34,211,238,0.88), transparent)',
  },
} as const;

const HOME_OIL_THEME = {
  base: 'linear-gradient(155deg, #070b17 0%, #0c142b 40%, #0b1f2a 72%, #05060d 100%)',
  hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.08) 55%, transparent 80%)',
  hazeB: 'radial-gradient(74% 66% at 88% 88%, rgba(34,211,238,0.18) 0%, rgba(251,191,36,0.07) 55%, transparent 80%)',
  brush: 'linear-gradient(112deg, rgba(236,72,153,0.16), rgba(34,211,238,0.08), rgba(251,191,36,0.05))',
  orbA: 'radial-gradient(circle at 32% 28%, rgba(236,72,153,0.22), transparent 70%)',
  orbB: 'radial-gradient(circle at 78% 68%, rgba(34,211,238,0.18), transparent 72%)',
  conic: 'conic-gradient(from 210deg at 55% 50%, rgba(236,72,153,0.18), rgba(34,211,238,0.14), rgba(251,191,36,0.10), rgba(236,72,153,0.18))',
} as const;

export default function Home() {
  const router = useRouter();
  const { setCurrentLeague } = useLeague();
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  const makeLeagueCardShadows = (borderRgb: string) => ({
    base: `0 0 0 1px rgba(${borderRgb},0.45), 0 0 44px rgba(${borderRgb},0.12), 0 24px 80px rgba(0,0,0,0.72)`,
    hover: `0 0 0 1px rgba(${borderRgb},0.70), 0 0 90px rgba(${borderRgb},0.18), 0 38px 110px rgba(0,0,0,0.84)`,
  });

  const iplOil = LEAGUE_OIL_THEMES.ipl;
  const wplOil = LEAGUE_OIL_THEMES.wpl;
  const iplCardShadows = makeLeagueCardShadows(iplOil.borderRgb);
  const wplCardShadows = makeLeagueCardShadows(wplOil.borderRgb);

  const openLeague = (league: 'ipl' | 'wpl') => {
    setCurrentLeague(league);
    router.push(league === 'ipl' ? '/ipl' : '/wpl');
  };
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lastAcceptanceDate, setLastAcceptanceDate] = useState<string | null>(null);
  const [needsReAcceptance, setNeedsReAcceptance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Mouse tracking for parallax effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
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

  const featuredLiveOil = featuredLiveMatch?.league === 'wpl' ? wplOil : iplOil;
  const featuredLiveShadows = featuredLiveMatch?.league === 'wpl' ? wplCardShadows : iplCardShadows;

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
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    if (iplFilteredTeams.length === 0) return undefined;

    const interval = setInterval(() => {
      setIplLogoIndex((prev) => (prev + 1) % Math.min(iplFilteredTeams.length, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, [iplTeams]);

  useEffect(() => {
    const wplFilteredTeams = wplTeams.filter(t => !isPlaceholderTeam(t));
    if (wplFilteredTeams.length === 0) return undefined;

    const interval = setInterval(() => {
      setWplLogoIndex((prev) => (prev + 1) % Math.min(wplFilteredTeams.length, 5));
    }, 3000);

    return () => clearInterval(interval);
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
	        {/* Hero Section */}
	        <section className="relative min-h-[calc(100svh-5rem)] flex items-center justify-center overflow-hidden">
	          <div className="absolute inset-0 pointer-events-none" style={{ background: HOME_OIL_THEME.base }} />
	          <Image
	            src={HERO_STADIUM_BG}
	            alt=""
	            fill
	            priority
	            sizes="100vw"
	            className="absolute inset-0 object-cover object-center opacity-85"
	          />
	          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.68)_42%,rgba(2,6,23,0.36)_74%,rgba(2,6,23,0.66)_100%)]" />
	          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(2,6,23,0.40)_0%,rgba(2,6,23,0.10)_46%,rgba(2,6,23,0.90)_100%)]" />
	          <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />

	          {HERO_LIGHT_STREAKS.map((streak, idx) => (
	            <motion.div
	              key={`hero-streak-${idx}`}
	              className="absolute hidden h-[2px] pointer-events-none bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent md:block"
	              style={{
	                top: streak.top,
	                bottom: streak.bottom,
	                left: streak.left,
	                right: streak.right,
	                width: streak.width,
	                transform: `rotate(${streak.rotate})`,
	              }}
	              animate={motionEnabled ? { opacity: [0.18, 0.56, 0.18], x: [0, 18, 0] } : { opacity: 0.26 }}
	              transition={motionEnabled ? { duration: 6, delay: streak.delay, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
	            />
	          ))}

	          {/* Animated Grid Background */}
	          <div 
	            className="absolute inset-0 hidden opacity-[0.035] pointer-events-none md:block"
	            style={{
	              backgroundImage: `
	                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
	                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
	              `,
	              backgroundSize: '60px 60px',
	              transform: `translate(${(mousePosition?.x ?? 0) * 0.5}px, ${(mousePosition?.y ?? 0) * 0.5}px)`,
	              mixBlendMode: 'soft-light',
	            }}
	          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-5xl space-y-7 text-center md:text-left">
              {/* Premium Badge with Glow Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
	                className="relative inline-flex items-center gap-3 overflow-hidden rounded-lg border border-cyan-200/25 bg-slate-950/35 px-5 py-3 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl"
	              >
	                  <motion.div
	                  className="relative"
	                  animate={motionEnabled ? { rotate: [0, 360] } : { rotate: 0 }}
	                  transition={motionEnabled ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0 }}
	                >
	                  <Zap className="w-5 h-5 text-amber-300" />
	                  <motion.div
	                    className="absolute inset-0 rounded-full bg-amber-300 blur-xl opacity-35"
	                    animate={motionEnabled ? { scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] } : { scale: 1, opacity: 0.35 }}
	                    transition={motionEnabled ? { duration: 2.4, repeat: Infinity } : { duration: 0 }}
	                  />
	                </motion.div>
	                <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-50">
	                  IPL & WPL 2026 live cricket hub
	                </span>
	                <motion.div
	                  className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
	                  animate={motionEnabled ? { x: ['-120%', '760%'] } : { x: '-120%' }}
	                  transition={motionEnabled ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
	                />
	              </motion.div>

              {/* Main Heading with Staggered Animation */}
              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
	                  className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.96] tracking-tight drop-shadow-2xl"
	                >
	                  <motion.span
	                    className="block"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
	                    IPL 2026
	                  </motion.span>
	                  <motion.span
	                    className="block bg-gradient-to-r from-cyan-200 via-emerald-200 to-amber-200 bg-clip-text text-transparent"
	                    initial={{ opacity: 0, y: 18 }}
	                    animate={{ opacity: 1, y: 0 }}
	                    transition={{ duration: 0.8, delay: 0.6 }}
	                  >
	                    Match Centre
	                  </motion.span>
	                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
	                  className="mx-auto max-w-3xl text-lg md:mx-0 md:text-xl lg:text-2xl text-slate-100/90 leading-relaxed font-medium"
	                >
	                  Follow every over with live scores, fixtures, results, points table movement, squads, match reports, and the{' '}
	                  <span className="text-amber-200 font-black relative">
	                    <span className="relative z-10">IPL</span>
	                    <motion.span
	                      className="absolute bottom-0 left-0 right-0 h-1 bg-amber-300/35"
	                      initial={{ scaleX: 0 }}
	                      animate={{ scaleX: 1 }}
	                      transition={{ duration: 0.8, delay: 1.2 }}
	                    />
	                  </span>
	                  {' '}Orange Cap and Purple Cap races.
	                  <span className="ml-2 text-cyan-200 font-black relative">
	                    <span className="relative z-10">WPL coverage included.</span>
	                    <motion.span
	                      className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-300/30"
	                      initial={{ scaleX: 0 }}
	                      animate={{ scaleX: 1 }}
	                      transition={{ duration: 0.8, delay: 1.4 }}
	                    />
	                  </span>
	                </motion.p>
	              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.95 }}
              >
                <IplChampionHighlight
                  variant="compact"
	                  align="left"
	                  className="mx-auto max-w-4xl md:mx-0"
	                />
	              </motion.div>

              {/* Live Match Badge */}
              {featuredLiveMatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1, type: "spring" }}
	                  className="inline-flex flex-wrap items-center gap-3 rounded-lg border border-red-400/35 bg-red-950/35 px-5 py-3 shadow-2xl shadow-red-950/20 backdrop-blur-2xl"
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
	                    Open scorecard
	                  </Link>
	                </motion.div>
	              )}

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
	                className="flex flex-wrap justify-center gap-4 pt-3 md:justify-start"
	              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/live-score"
	                    className="group relative block overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-cyan-950/40 transition-all duration-300 hover:shadow-cyan-700/35"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Play className="w-6 h-6" />
	                    Open Live Score
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
	                    className="group flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-7 py-4 text-base font-black text-white backdrop-blur-2xl transition-all duration-300 hover:border-white/40 hover:bg-white/20"
	                >
	                    View Fixtures
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
	              </motion.div>

	              <motion.div
	                initial={{ opacity: 0, y: 24 }}
	                animate={{ opacity: 1, y: 0 }}
	                transition={{ duration: 0.7, delay: 1.3 }}
	                className="flex flex-wrap justify-center gap-3 md:justify-start"
	              >
	                {HERO_QUICK_LINKS.map((item) => (
	                  <Link
	                    key={item.label}
	                    href={item.href}
	                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/35 px-4 py-2 text-sm font-bold text-slate-100 backdrop-blur-xl transition-colors hover:border-cyan-200/45 hover:bg-white/10"
	                  >
	                    {item.label}
	                    <ChevronRight className="h-4 w-4 text-cyan-200" />
	                  </Link>
	                ))}
	              </motion.div>
              </motion.div>

              {/* Enhanced Quick Stats with Hover Effects */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
	                className="grid max-w-4xl grid-cols-2 gap-3 pt-4 md:grid-cols-4"
	              >
	                {[
	                  { icon: Trophy, label: 'Franchises', value: iplTeams.length + wplTeams.length, color: 'from-cyan-500 to-blue-500', delay: 0 },
	                  { icon: Calendar, label: 'Fixtures', value: iplMatches.length + wplMatches.length, color: 'from-emerald-500 to-cyan-500', delay: 0.1 },
	                  { icon: Radio, label: 'Live Now', value: totalLiveMatches, color: 'from-red-500 to-orange-500', delay: 0.2 },
	                  { icon: TrendingUp, label: 'League Hubs', value: 2, color: 'from-amber-500 to-pink-500', delay: 0.3 },
	                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.5 + stat.delay, type: "spring" }}
                    whileHover={{ scale: 1.05, y: -5 }}
	                    className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/35 p-4 text-left backdrop-blur-xl transition-all duration-300 hover:bg-white/10"
	                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <motion.div
                      className="relative z-10"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
	                      <stat.icon className="mb-3 h-5 w-5 text-cyan-100/80 transition-colors group-hover:text-white" />
                    </motion.div>
                    <motion.p
	                      className="mb-1 text-3xl font-black text-white md:text-4xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 + stat.delay, type: "spring" }}
                    >
                      {stat.value}
                    </motion.p>
	                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">{stat.label}</p>
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
                className="relative overflow-hidden rounded-3xl border border-white/10 p-10 shadow-2xl"
                style={{ background: featuredLiveOil.base, boxShadow: featuredLiveShadows.base, isolation: 'isolate' }}
              >
                {/* Oil-canvas layers */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: featuredLiveOil.hazeA, mixBlendMode: 'screen' }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: featuredLiveOil.hazeB, mixBlendMode: 'screen' }} />
                <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{ background: featuredLiveOil.conic, mixBlendMode: 'screen' }} />
                <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.72) 100%)' }}
                />
                <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-80" style={{ background: featuredLiveOil.accentLine }} />

                <motion.div
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(248,113,113,0.32) 0%, rgba(239,68,68,0.10) 45%, transparent 72%)',
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
                      Watch Live Score
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
                        {formatMatchTime(featuredLiveMatch.time, featuredLiveMatch.date)}
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

        {/* League Selection Cards - Oil Canvas Design */}
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
                <span className="text-sm font-bold text-white uppercase tracking-wider">Choose Your Competition</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                IPL and WPL <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">Match Hubs</span>
              </h2>
              <p className="text-gray-300 text-xl">Jump into fixtures, squads, results, scorecards, and leaderboard races.</p>
            </motion.div>

	            <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
	              {/* IPL Card - Oil Canvas */}
	              <motion.div 
	                initial={{ opacity: 0, x: -100, rotateY: -15 }}
	                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
	                viewport={{ once: true, margin: "-100px" }}
	                transition={{ duration: 0.8, type: "spring" }}
	                whileHover={motionEnabled ? { y: -12, scale: 1.02, boxShadow: iplCardShadows.hover } : { y: -6 }}
		                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600/50 via-blue-500/40 to-cyan-500/50 backdrop-blur-2xl border-2 border-blue-500/40 p-8 md:p-10 cursor-pointer shadow-2xl shadow-blue-500/20 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
	                onClick={() => openLeague('ipl')}
	                onKeyDown={(event) => {
	                  if (event.key === 'Enter' || event.key === ' ') {
	                    event.preventDefault();
	                    openLeague('ipl');
	                  }
	                }}
	                role="link"
	                tabIndex={0}
	                aria-label="Explore IPL"
	                style={{ perspective: '1000px', background: iplOil.base, boxShadow: iplCardShadows.base, isolation: 'isolate' }}
	              >
	                {/* Oil-canvas layers */}
	                <div className="absolute inset-0 pointer-events-none" style={{ background: iplOil.hazeA, mixBlendMode: 'screen' }} />
	                <div className="absolute inset-0 pointer-events-none" style={{ background: iplOil.hazeB, mixBlendMode: 'screen' }} />
	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.16]"
	                  style={{ background: iplOil.conic, mixBlendMode: 'screen' }}
	                />

	                <motion.div
	                  className="absolute -top-32 left-[-14%] w-[72%] h-[36%] rounded-[120px] blur-2xl opacity-80 pointer-events-none"
	                  style={{ background: iplOil.brush, transform: 'rotate(-8deg)' }}
	                  animate={motionEnabled ? { x: [0, 10, 0], y: [0, -8, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 18, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -bottom-28 right-[-12%] w-[70%] h-[34%] rounded-[120px] blur-2xl opacity-70 pointer-events-none"
	                  style={{ background: iplOil.brush, transform: 'rotate(9deg)' }}
	                  animate={motionEnabled ? { x: [0, -10, 0], y: [0, 8, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -top-24 right-[-12%] h-72 w-72 rounded-full blur-3xl pointer-events-none"
	                  style={{ background: iplOil.orbA }}
	                  animate={motionEnabled ? { y: [0, -18, 0], x: [0, 12, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 11, ease: 'easeInOut', repeat: Infinity } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -bottom-24 left-[-12%] h-80 w-80 rounded-full blur-3xl pointer-events-none"
	                  style={{ background: iplOil.orbB }}
	                  animate={motionEnabled ? { y: [0, 16, 0], x: [0, -10, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 12, ease: 'easeInOut', repeat: Infinity, delay: 0.5 } : { duration: 0 }}
	                />

	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
	                  style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }}
	                />
	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.08]"
	                  style={{
	                    backgroundImage:
	                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
	                    mixBlendMode: 'soft-light',
	                  }}
	                />
	                <div
	                  className="absolute inset-0 pointer-events-none"
	                  style={{
	                    background:
	                      'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.28) 62%, rgba(2,6,23,0.74) 100%)',
	                  }}
	                />

	                <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-90" style={{ background: iplOil.accentLine }} />
	                <div
	                  className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
	                  style={{
	                    background:
	                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.05) 100%)',
	                  }}
	                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
	                    <div className="flex items-center gap-5">
	                      <motion.div
	                        className="relative p-6 rounded-3xl bg-black/25 border border-white/15 backdrop-blur-xl shadow-xl overflow-hidden"
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
	                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">Indian Premier League</h3>
	                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-300/25 text-cyan-100 text-[11px] font-black tracking-[0.22em] uppercase">
	                          IPL 2026
	                        </div>
	                      </div>
	                    </div>
	                    <ArrowRight className="w-8 h-8 text-blue-200/80 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
	                  </div>

	                  <p className="text-slate-100/90 mb-9 leading-relaxed text-lg">
	                    Track the men&apos;s IPL season with live scores, fixtures, points table movement, NRR swings, squads, Orange Cap, Purple Cap, and match results.
	                  </p>

	                  <div className="grid grid-cols-3 gap-4 mb-8">
	                    {[
	                      { label: 'Teams', value: iplTeams.filter((t) => !isPlaceholderTeam(t)).length, icon: Users },
	                      { label: 'Matches', value: iplMatches.length, icon: Calendar },
	                      { label: 'Live', value: iplLiveMatches.length, icon: Radio },
	                    ].map((stat, idx) => {
	                      const Icon = stat.icon;
	                      return (
	                        <motion.div
	                          key={stat.label}
	                          initial={{ opacity: 0, y: 16 }}
	                          whileInView={{ opacity: 1, y: 0 }}
	                          viewport={{ once: true }}
	                          transition={{ duration: 0.5, delay: idx * 0.08 }}
	                          whileHover={motionEnabled ? { y: -6, scale: 1.03 } : { y: -2 }}
	                          className="relative overflow-hidden text-center p-5 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: iplOil.accentLine }} />
	                          <Icon className="w-4 h-4 text-cyan-100/80 mx-auto mb-3" />
	                          <p className="text-4xl md:text-5xl font-black text-white tabular-nums">{stat.value}</p>
	                          <p className="mt-1 text-[11px] text-white/70 uppercase tracking-widest font-bold">{stat.label}</p>
	                        </motion.div>
	                      );
	                    })}
	                  </div>

	                  {(iplLastMatch || iplNextMatch) && (
	                    <div className="grid gap-4 mb-8 sm:grid-cols-2">
	                      {/* Last Match Result */}
	                      {iplLastMatch && (
	                        <motion.div
	                          initial={{ opacity: 0 }}
	                          whileInView={{ opacity: 1 }}
	                          viewport={{ once: true }}
	                          className="relative overflow-hidden rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl p-5"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: iplOil.accentLine }} />
	                          <p className="text-[11px] text-white/70 uppercase tracking-[0.22em] font-black mb-3 flex items-center gap-2">
	                            <Trophy className="w-4 h-4 text-white/60" />
	                            Last Result
	                          </p>
	                          <div className="flex items-center justify-between gap-3">
	                            <div className="flex items-center gap-2 text-lg font-black text-white">
	                              <span
	                                className={
	                                  iplLastMatch.score && iplLastMatch.score.team1.runs > iplLastMatch.score.team2.runs
	                                    ? 'text-amber-300'
	                                    : 'text-white'
	                                }
	                              >
	                                {iplLastMatch.team1.shortName}
	                              </span>
	                              <span className="text-white/40">vs</span>
	                              <span
	                                className={
	                                  iplLastMatch.score && iplLastMatch.score.team2.runs > iplLastMatch.score.team1.runs
	                                    ? 'text-amber-300'
	                                    : 'text-white'
	                                }
	                              >
	                                {iplLastMatch.team2.shortName}
	                              </span>
	                            </div>
	                            {iplLastMatch.result && (
	                              <motion.span
	                                className="text-base text-amber-300 font-black"
	                                animate={motionEnabled ? { scale: [1, 1.15, 1] } : { scale: 1 }}
	                                transition={motionEnabled ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
	                              >
	                                ✓
	                              </motion.span>
	                            )}
	                          </div>
	                          {iplLastMatch.result && (
	                            <p className="mt-2 text-xs text-white/60 leading-relaxed">{iplLastMatch.result}</p>
	                          )}
	                        </motion.div>
	                      )}

	                      {/* Next Match */}
	                      {iplNextMatch && (
	                        <motion.div
	                          initial={{ opacity: 0 }}
	                          whileInView={{ opacity: 1 }}
	                          viewport={{ once: true }}
	                          className="relative overflow-hidden rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl p-5"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: iplOil.accentLine }} />
	                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	                            <div className="min-w-0">
	                              <p className="text-[11px] text-white/70 uppercase tracking-[0.22em] font-black mb-2 flex items-center gap-2">
	                                <Activity className="w-4 h-4 text-white/60" />
	                                Next Match
	                              </p>
	                              <p className="text-lg font-black text-white truncate">
	                                {iplNextMatch.team1.shortName} <span className="text-white/40">vs</span>{' '}
	                                {iplNextMatch.team2.shortName}
	                              </p>
	                              <p className="mt-1 text-xs text-white/60 flex items-center gap-2">
	                                <Clock className="w-3.5 h-3.5" />
	                                {iplNextMatch.time && iplNextMatch.date ? formatMatchTime(iplNextMatch.time, iplNextMatch.date) : 'TBD'}
	                              </p>
	                            </div>
	                            <div className="w-full sm:w-[240px]">
	                              <CountdownTimer
	                                targetDate={iplNextMatch.date}
	                                matchTime={iplNextMatch.time}
	                                variant="panel"
	                              />
	                            </div>
	                          </div>
	                        </motion.div>
	                      )}
	                    </div>
	                  )}

	                  {/* Hover Preview */}
	                  <div className="absolute inset-0 rounded-3xl p-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
	                    <div className="absolute inset-0" style={{ background: iplOil.base }} />
	                    <div className="absolute inset-0" style={{ background: iplOil.hazeA, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0" style={{ background: iplOil.hazeB, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0 opacity-[0.16]" style={{ background: iplOil.conic, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />
	                    <div
	                      className="absolute inset-0"
	                      style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.76) 100%)' }}
	                    />

	                    <div className="relative z-10 h-full flex flex-col">
	                      <h4 className="text-2xl font-black text-white mb-6">Upcoming Matches</h4>
	                      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
	                        {iplUpcomingMatches.length > 0 ? (
	                          iplUpcomingMatches.map((match, idx) => (
	                            <motion.div
	                              key={match.id}
	                              initial={{ opacity: 0, x: -20 }}
	                              animate={{ opacity: 1, x: 0 }}
	                              transition={{ duration: 0.3, delay: idx * 0.08 }}
	                              whileHover={motionEnabled ? { y: -4 } : { y: -1 }}
	                              className="relative overflow-hidden p-4 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-colors"
	                            >
	                              <div className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: iplOil.accentLine }} />
	                              <div className="flex items-center justify-between gap-3">
	                                <span className="text-base font-bold text-white">
	                                  {match.team1.shortName} <span className="text-white/40">vs</span> {match.team2.shortName}
	                                </span>
	                                <ChevronRight className="w-5 h-5 text-white/50" />
	                              </div>
	                              <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
	                                <Clock className="w-4 h-4" />
	                                {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
	                              </div>
	                            </motion.div>
	                          ))
	                        ) : (
	                          <p className="text-white/60 text-sm">No upcoming matches</p>
	                        )}
	                      </div>
	                      <div className="mt-6 inline-flex items-center gap-2 text-cyan-100/90 text-sm font-black tracking-[0.22em] uppercase">
	                        Explore IPL
	                        <ArrowRight className="w-5 h-5" />
	                      </div>
	                    </div>
	                  </div>

	                  <div className="relative z-10 mt-8 inline-flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-black tracking-[0.22em] uppercase text-cyan-100/90 transition-colors group-hover:bg-white/10">
	                    <span>Explore IPL</span>
	                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
	                  </div>
                </div>
              </motion.div>

	              {/* WPL Card - Oil Canvas */}
	              <motion.div
	                initial={{ opacity: 0, x: 100, rotateY: 15 }}
	                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
	                viewport={{ once: true, margin: "-100px" }}
	                transition={{ duration: 0.8, type: "spring" }}
	                whileHover={motionEnabled ? { y: -12, scale: 1.02, boxShadow: wplCardShadows.hover } : { y: -6 }}
	                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/50 via-pink-500/40 to-rose-500/50 backdrop-blur-2xl border-2 border-purple-500/40 p-8 md:p-10 cursor-pointer shadow-2xl shadow-purple-500/20 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/40"
	                onClick={() => openLeague('wpl')}
	                onKeyDown={(event) => {
	                  if (event.key === 'Enter' || event.key === ' ') {
	                    event.preventDefault();
	                    openLeague('wpl');
	                  }
	                }}
	                role="link"
	                tabIndex={0}
	                aria-label="Explore WPL"
	                style={{ perspective: '1000px', background: wplOil.base, boxShadow: wplCardShadows.base, isolation: 'isolate' }}
	              >
	                {/* Oil-canvas layers */}
	                <div className="absolute inset-0 pointer-events-none" style={{ background: wplOil.hazeA, mixBlendMode: 'screen' }} />
	                <div className="absolute inset-0 pointer-events-none" style={{ background: wplOil.hazeB, mixBlendMode: 'screen' }} />
	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.16]"
	                  style={{ background: wplOil.conic, mixBlendMode: 'screen' }}
	                />

	                <motion.div
	                  className="absolute -top-32 left-[-14%] w-[72%] h-[36%] rounded-[120px] blur-2xl opacity-80 pointer-events-none"
	                  style={{ background: wplOil.brush, transform: 'rotate(-8deg)' }}
	                  animate={motionEnabled ? { x: [0, 10, 0], y: [0, -8, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 18, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -bottom-28 right-[-12%] w-[70%] h-[34%] rounded-[120px] blur-2xl opacity-70 pointer-events-none"
	                  style={{ background: wplOil.brush, transform: 'rotate(9deg)' }}
	                  animate={motionEnabled ? { x: [0, -10, 0], y: [0, 8, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -top-24 right-[-12%] h-72 w-72 rounded-full blur-3xl pointer-events-none"
	                  style={{ background: wplOil.orbA }}
	                  animate={motionEnabled ? { y: [0, -18, 0], x: [0, 12, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 11, ease: 'easeInOut', repeat: Infinity } : { duration: 0 }}
	                />
	                <motion.div
	                  className="absolute -bottom-24 left-[-12%] h-80 w-80 rounded-full blur-3xl pointer-events-none"
	                  style={{ background: wplOil.orbB }}
	                  animate={motionEnabled ? { y: [0, 16, 0], x: [0, -10, 0] } : { x: 0, y: 0 }}
	                  transition={motionEnabled ? { duration: 12, ease: 'easeInOut', repeat: Infinity, delay: 0.5 } : { duration: 0 }}
	                />

	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
	                  style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }}
	                />
	                <div
	                  className="absolute inset-0 pointer-events-none opacity-[0.08]"
	                  style={{
	                    backgroundImage:
	                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
	                    mixBlendMode: 'soft-light',
	                  }}
	                />
	                <div
	                  className="absolute inset-0 pointer-events-none"
	                  style={{
	                    background:
	                      'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.28) 62%, rgba(2,6,23,0.74) 100%)',
	                  }}
	                />

	                <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-90" style={{ background: wplOil.accentLine }} />
	                <div
	                  className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
	                  style={{
	                    background:
	                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.05) 100%)',
	                  }}
	                />
                
                <div className="relative z-10">
	                  <div className="flex items-start justify-between mb-8">
	                    <div className="flex items-center gap-5">
	                      <motion.div
	                        className="relative p-6 rounded-3xl bg-black/25 border border-white/15 backdrop-blur-xl shadow-xl overflow-hidden"
	                        whileHover={{ rotate: [0, 10, -10, 0], scale: 1.1 }}
	                        transition={{ duration: 0.5 }}
	                      >
	                        <AnimatePresence mode="wait">
	                          {wplTeams.filter((t) => !isPlaceholderTeam(t)).slice(0, 5).map((team, idx) => (
	                            idx === wplLogoIndex && (
	                              <motion.div
	                                key={team.id}
	                                initial={{ opacity: 0, scale: 0.5, rotate: 180 }}
	                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
	                                exit={{ opacity: 0, scale: 0.5, rotate: -180 }}
	                                transition={{ duration: 0.6, type: "spring" }}
	                              >
	                                <Image
	                                  src={getAnimatedLogoPath(team.id, team.shortName, 'wpl')}
	                                  alt={team.shortName}
	                                  width={48}
	                                  height={48}
	                                  className="object-contain"
	                                />
	                              </motion.div>
	                            )
	                          ))}
	                        </AnimatePresence>
	                      </motion.div>
	                      <div>
	                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">Women's Premier League</h3>
	                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-300/25 text-pink-100 text-[11px] font-black tracking-[0.22em] uppercase">
	                          WPL 2026
	                        </div>
	                      </div>
	                    </div>
	                    <ArrowRight className="w-8 h-8 text-pink-200/80 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
	                  </div>

	                  <p className="text-slate-100/90 mb-9 leading-relaxed text-lg">
	                    Follow women&apos;s T20 cricket with fixtures, live scores, squad depth, player leaderboards, result summaries, and title-race context.
	                  </p>

	                  <div className="grid grid-cols-3 gap-4 mb-8">
	                    {[
	                      { label: 'Teams', value: wplTeams.filter((t) => !isPlaceholderTeam(t)).length, icon: Users },
	                      { label: 'Matches', value: wplMatches.length, icon: Calendar },
	                      { label: 'Live', value: wplLiveMatches.length, icon: Radio },
	                    ].map((stat, idx) => {
	                      const Icon = stat.icon;
	                      return (
	                        <motion.div
	                          key={stat.label}
	                          initial={{ opacity: 0, y: 16 }}
	                          whileInView={{ opacity: 1, y: 0 }}
	                          viewport={{ once: true }}
	                          transition={{ duration: 0.5, delay: idx * 0.08 }}
	                          whileHover={motionEnabled ? { y: -6, scale: 1.03 } : { y: -2 }}
	                          className="relative overflow-hidden text-center p-5 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: wplOil.accentLine }} />
	                          <Icon className="w-4 h-4 text-pink-100/80 mx-auto mb-3" />
	                          <p className="text-4xl md:text-5xl font-black text-white tabular-nums">{stat.value}</p>
	                          <p className="mt-1 text-[11px] text-white/70 uppercase tracking-widest font-bold">{stat.label}</p>
	                        </motion.div>
	                      );
	                    })}
	                  </div>

	                  {(wplLastMatch || wplNextMatch) && (
	                    <div className="grid gap-4 mb-8 sm:grid-cols-2">
	                      {/* Last Match Result */}
	                      {wplLastMatch && (
	                        <motion.div
	                          initial={{ opacity: 0 }}
	                          whileInView={{ opacity: 1 }}
	                          viewport={{ once: true }}
	                          className="relative overflow-hidden rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl p-5"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: wplOil.accentLine }} />
	                          <p className="text-[11px] text-white/70 uppercase tracking-[0.22em] font-black mb-3 flex items-center gap-2">
	                            <Trophy className="w-4 h-4 text-white/60" />
	                            Last Result
	                          </p>
	                          <div className="flex items-center justify-between gap-3">
	                            <div className="flex items-center gap-2 text-lg font-black text-white">
	                              <span
	                                className={
	                                  wplLastMatch.score && wplLastMatch.score.team1.runs > wplLastMatch.score.team2.runs
	                                    ? 'text-amber-300'
	                                    : 'text-white'
	                                }
	                              >
	                                {wplLastMatch.team1.shortName}
	                              </span>
	                              <span className="text-white/40">vs</span>
	                              <span
	                                className={
	                                  wplLastMatch.score && wplLastMatch.score.team2.runs > wplLastMatch.score.team1.runs
	                                    ? 'text-amber-300'
	                                    : 'text-white'
	                                }
	                              >
	                                {wplLastMatch.team2.shortName}
	                              </span>
	                            </div>
	                            {wplLastMatch.result && (
	                              <motion.span
	                                className="text-base text-amber-300 font-black"
	                                animate={motionEnabled ? { scale: [1, 1.15, 1] } : { scale: 1 }}
	                                transition={motionEnabled ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
	                              >
	                                ✓
	                              </motion.span>
	                            )}
	                          </div>
	                          {wplLastMatch.result && (
	                            <p className="mt-2 text-xs text-white/60 leading-relaxed">{wplLastMatch.result}</p>
	                          )}
	                        </motion.div>
	                      )}

	                      {/* Next Match */}
	                      {wplNextMatch && (
	                        <motion.div
	                          initial={{ opacity: 0 }}
	                          whileInView={{ opacity: 1 }}
	                          viewport={{ once: true }}
	                          className="relative overflow-hidden rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl p-5"
	                        >
	                          <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: wplOil.accentLine }} />
	                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	                            <div className="min-w-0">
	                              <p className="text-[11px] text-white/70 uppercase tracking-[0.22em] font-black mb-2 flex items-center gap-2">
	                                <Activity className="w-4 h-4 text-white/60" />
	                                Next Match
	                              </p>
	                              <p className="text-lg font-black text-white truncate">
	                                {wplNextMatch.team1.shortName} <span className="text-white/40">vs</span>{' '}
	                                {wplNextMatch.team2.shortName}
	                              </p>
	                              <p className="mt-1 text-xs text-white/60 flex items-center gap-2">
	                                <Clock className="w-3.5 h-3.5" />
	                                {wplNextMatch.time && wplNextMatch.date ? formatMatchTime(wplNextMatch.time, wplNextMatch.date) : 'TBD'}
	                              </p>
	                            </div>
	                            <div className="w-full sm:w-[240px]">
	                              <CountdownTimer
	                                targetDate={wplNextMatch.date}
	                                matchTime={wplNextMatch.time}
	                                variant="panel"
	                              />
	                            </div>
	                          </div>
	                        </motion.div>
	                      )}
	                    </div>
	                  )}

	                  {/* Hover Preview */}
	                  <div className="absolute inset-0 rounded-3xl p-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
	                    <div className="absolute inset-0" style={{ background: wplOil.base }} />
	                    <div className="absolute inset-0" style={{ background: wplOil.hazeA, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0" style={{ background: wplOil.hazeB, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0 opacity-[0.16]" style={{ background: wplOil.conic, mixBlendMode: 'screen' }} />
	                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />
	                    <div
	                      className="absolute inset-0"
	                      style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.76) 100%)' }}
	                    />

	                    <div className="relative z-10 h-full flex flex-col">
	                      <h4 className="text-2xl font-black text-white mb-6">Upcoming Matches</h4>
	                      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
	                        {wplUpcomingMatches.length > 0 ? (
	                          wplUpcomingMatches.map((match, idx) => (
	                            <motion.div
	                              key={match.id}
	                              initial={{ opacity: 0, x: 20 }}
	                              animate={{ opacity: 1, x: 0 }}
	                              transition={{ duration: 0.3, delay: idx * 0.08 }}
	                              whileHover={motionEnabled ? { y: -4 } : { y: -1 }}
	                              className="relative overflow-hidden p-4 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-colors"
	                            >
	                              <div className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: wplOil.accentLine }} />
	                              <div className="flex items-center justify-between gap-3">
	                                <span className="text-base font-bold text-white">
	                                  {match.team1.shortName} <span className="text-white/40">vs</span> {match.team2.shortName}
	                                </span>
	                                <ChevronRight className="w-5 h-5 text-white/50" />
	                              </div>
	                              <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
	                                <Clock className="w-4 h-4" />
	                                {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
	                              </div>
	                            </motion.div>
	                          ))
	                        ) : (
	                          <p className="text-white/60 text-sm">No upcoming matches</p>
	                        )}
	                      </div>
	                      <div className="mt-6 inline-flex items-center gap-2 text-pink-100/90 text-sm font-black tracking-[0.22em] uppercase">
	                        Explore WPL
	                        <ArrowRight className="w-5 h-5" />
	                      </div>
	                    </div>
	                  </div>

	                  <div className="relative z-10 mt-8 inline-flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-black tracking-[0.22em] uppercase text-pink-100/90 transition-colors group-hover:bg-white/10">
	                    <span>Explore WPL</span>
	                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
	                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Predictions Panel Section */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-cyan-500/20 backdrop-blur-2xl border-2 border-amber-400/35 p-8 md:p-10 shadow-2xl"
            >
              <motion.div
                className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 border border-yellow-400/40 backdrop-blur-sm"
                  >
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-200 uppercase tracking-wider">Match Predictions</span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Read the Match <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">Before It Turns</span>
                  </h2>
                  <p className="text-gray-200 text-lg mb-6 leading-relaxed">
                    Make cricket calls on the toss, powerplay tempo, top scorer, strike bowler, and Player of the Match. Compare your picks with the leaderboard after every fixture.
                  </p>
                  <Link
                    href="/predictions"
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70 transition-all hover:scale-105"
                  >
                    <Target className="w-6 h-6" />
                    <span>Make Predictions</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Match Winner', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
                    { label: 'Powerplay Runs', icon: Zap, color: 'from-emerald-500 to-cyan-500' },
                    { label: 'Top Wicket Taker', icon: Activity, color: 'from-red-500 to-pink-500' },
                    { label: 'Player of Match', icon: Target, color: 'from-pink-500 to-purple-500' },
                  ].map((feature, idx) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <feature.icon className={`w-8 h-8 mb-3 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
                      <p className="text-sm font-semibold text-white">{feature.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
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
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Fixtures & Results</span>
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black text-white">
                  Matchday <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-300 bg-clip-text text-transparent">Fixtures</span>
              </h2>
            </div>
              <Link
                href="/matches"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300 hover:scale-105"
              >
                View Schedule
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
	                  .map((match, idx) => {
	                    const matchOil = match.league === 'wpl' ? wplOil : iplOil;
	                    const matchShadows = match.league === 'wpl' ? wplCardShadows : iplCardShadows;
	                    const leagueLabel = match.league === 'wpl' ? 'WPL' : 'IPL';

	                    return (
	                      <motion.div
	                        key={match.id}
	                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
	                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
	                        viewport={{ once: true, margin: "-50px" }}
	                        transition={{ duration: 0.6, delay: idx * 0.1, type: "spring" }}
	                        whileHover={motionEnabled ? { y: -10, scale: 1.03, boxShadow: matchShadows.hover } : { y: -6 }}
	                        className="group relative overflow-hidden rounded-lg border border-white/10 p-6 md:p-8 cursor-pointer shadow-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
	                        onClick={() => router.push(match.league === 'wpl' ? '/wpl/matches' : '/matches')}
	                        role="link"
	                        tabIndex={0}
	                        aria-label={`Open ${leagueLabel} matches`}
	                        style={{ background: matchOil.base, boxShadow: matchShadows.base, isolation: 'isolate' }}
	                      >
	                        {/* Oil layers */}
	                        <div className="absolute inset-0 pointer-events-none" style={{ background: matchOil.hazeA, mixBlendMode: 'screen' }} />
	                        <div className="absolute inset-0 pointer-events-none" style={{ background: matchOil.hazeB, mixBlendMode: 'screen' }} />
	                        <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{ background: matchOil.conic, mixBlendMode: 'screen' }} />
	                        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />
	                        <div
	                          className="absolute inset-0 pointer-events-none"
	                          style={{
	                            background:
	                              'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.22) 62%, rgba(2,6,23,0.68) 100%)',
	                          }}
	                        />
	                        <div
	                          className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none opacity-90"
	                          style={{ background: matchOil.accentLine }}
	                        />
	                        <div
	                          className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
	                          style={{
	                            background:
	                              'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.05) 100%)',
	                          }}
	                        />

	                        <div className="relative z-10">
	                          <div className="flex items-center justify-between mb-6">
	                            <span className="text-[11px] font-black px-4 py-2 rounded-full bg-black/25 text-white/90 border border-white/10 tracking-[0.18em] uppercase">
	                              {leagueLabel}
	                            </span>
	                            {match.status === 'live' && (
	                              <motion.div
	                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30"
	                                animate={motionEnabled ? { scale: [1, 1.08, 1] } : { scale: 1 }}
	                                transition={motionEnabled ? { duration: 2, repeat: Infinity } : { duration: 0 }}
	                              >
	                                <motion.div
	                                  className="w-2.5 h-2.5 bg-red-500 rounded-full"
	                                  animate={motionEnabled ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : { scale: 1, opacity: 1 }}
	                                  transition={motionEnabled ? { duration: 1.5, repeat: Infinity } : { duration: 0 }}
	                                />
	                                <span className="text-[11px] font-black tracking-widest text-red-200">LIVE</span>
	                              </motion.div>
	                            )}
	                          </div>

	                          <div className="flex items-center justify-between mb-6">
	                            <div className="text-3xl font-black text-white">{match.team1.shortName}</div>
	                            <div className="text-white/50 text-lg font-black tracking-widest">VS</div>
	                            <div className="text-3xl font-black text-white">{match.team2.shortName}</div>
	                          </div>

	                          <div className="flex items-center justify-between text-sm text-white/65">
	                            <div className="flex items-center gap-2">
	                              <Clock className="w-4 h-4" />
	                              {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
	                            </div>
	                            <motion.div
	                              animate={motionEnabled ? { x: [0, 5, 0] } : { x: 0 }}
	                              transition={motionEnabled ? { duration: 2, repeat: Infinity } : { duration: 0 }}
	                            >
	                              <ChevronRight className="w-6 h-6 text-white/45 group-hover:text-white group-hover:translate-x-2 transition-all" />
	                            </motion.div>
	                          </div>
	                        </div>
	                      </motion.div>
	                    );
	                  })}
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
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Franchise Hubs</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Squads, Form, and <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">Team News</span>
              </h2>
              <p className="text-gray-300 text-xl">Explore franchise rosters, home venues, recent form, and player depth.</p>
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
                <span className="text-xs font-bold text-white uppercase tracking-wider">Score Intelligence</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Numbers That <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">Shape the Table</span>
              </h2>
              <p className="text-gray-300 text-xl">Track runs, wickets, NRR, team form, and live match momentum.</p>
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
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Match Reports & News</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black text-white">
                    Cricket <span className="bg-gradient-to-r from-pink-300 via-amber-200 to-cyan-300 bg-clip-text text-transparent">Storylines</span>
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
                <span className="text-sm font-bold text-white uppercase tracking-wider">Stay Close to Every Over</span>
              </motion.div>
              
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-tight">
                Follow Scores,
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Tables, and Form.
                </span>
              </h2>
              
              <p className="text-gray-300 text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed">
                Keep IPL and WPL fixtures, live scorecards, player leaderboards, team news, and match reports in one cricket-first dashboard.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/live-score"
                    className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 overflow-hidden block"
                >
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      <Play className="w-7 h-7" />
                    Open Live Scores
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
                    View Fixtures
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
