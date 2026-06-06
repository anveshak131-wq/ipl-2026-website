'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import ModernFeatureShowcase from '@/components/home/ModernFeatureShowcase';
import ConfettiAnimation from '@/components/effects/ConfettiAnimation';
import FloatingBadge from '@/components/effects/FloatingBadge';
import IplChampionHighlight from '@/components/champions/IplChampionHighlight';
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
import { 
  Trophy, 
  ArrowRight, 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap,
  Clock,
  Target,
  Activity,
  Radio,
  BarChart3,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { formatMatchTime } from '@/lib/timeUtils';
import PublicLiveMatchStrip from '@/components/live-score/PublicLiveMatchStrip';

export default function IPLHomePage() {
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
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const prefersReducedMotion = useReducedMotion();

  const heroParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${8 + ((index * 23) % 84)}%`,
        top: `${12 + ((index * 31) % 72)}%`,
        delay: (index % 6) * 0.35,
        duration: 4.4 + (index % 5) * 0.6,
      })),
    []
  );

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const filterSeasonMatches = (items: Match[]): Match[] =>
    items.filter((match) => getMatchYear(match.date) === TARGET_SEASON_YEAR);

  const getMatchTimestamp = (match: Match): number => {
    const parsed = new Date(match.date);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  const formatPlayoffLabel = (match?: Match | null): string => {
    if (!match?.playoffType) return 'League fixture';
    const labels: Record<NonNullable<Match['playoffType']>, string> = {
      qualifier1: 'Qualifier 1',
      eliminator: 'Eliminator',
      qualifier2: 'Qualifier 2',
      final: 'Final',
    };
    return labels[match.playoffType] || 'Playoff';
  };
  
  // Set league to IPL when page loads
  useEffect(() => {
    if (currentLeague !== 'ipl') {
      setCurrentLeague('ipl');
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
    if (!matches || !Array.isArray(matches)) return null;
    return matches.find(m => m.status === 'live') || null;
  }, [matches]);

  const latestCompletedMatch = useMemo(() => {
    if (!matches || !Array.isArray(matches)) return null;
    return [...matches]
      .filter((match) => match.status === 'completed')
      .sort((a, b) => getMatchTimestamp(b) - getMatchTimestamp(a))[0] || null;
  }, [matches]);

  const heroMatch = featuredLiveMatch || nextMatch || latestCompletedMatch;
  const heroMatchLabel = featuredLiveMatch ? 'Live score' : nextMatch ? 'Next fixture' : 'Latest result';
  const heroMatchHref = featuredLiveMatch
    ? '/live-score?league=ipl'
    : heroMatch
      ? `/matches/${encodeURIComponent(String(heroMatch.id))}?league=ipl`
      : '/matches';
  const heroMatchDateLabel = heroMatch ? formatMatchTime(heroMatch.time, heroMatch.date) : 'Schedule updating';
  const heroMatchVenue = heroMatch?.venue || 'Venue details to be confirmed';
  const heroScoreRows = heroMatch
    ? [
        {
          team: heroMatch.team1.shortName,
          name: heroMatch.team1.name,
          score: heroMatch.team1Score || (heroMatch.score?.team1 ? `${heroMatch.score.team1.runs}/${heroMatch.score.team1.wickets}` : 'Innings pending'),
        },
        {
          team: heroMatch.team2.shortName,
          name: heroMatch.team2.name,
          score: heroMatch.team2Score || (heroMatch.score?.team2 ? `${heroMatch.score.team2.runs}/${heroMatch.score.team2.wickets}` : 'Innings pending'),
        },
      ]
    : [];
  
  // Calculate total players from teams
  const totalPlayers = useMemo(() => {
    return teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
  }, [teams]);

  const heroStats = useMemo(
    () => [
      {
        label: 'Franchises',
        value: teams.filter((team) => !isPlaceholderTeam(team)).length || 10,
        detail: 'city-based squads',
        color: 'from-[#f4b44d] to-[#e06d2f]',
      },
      {
        label: 'Fixtures',
        value: matches.length || 74,
        detail: 'league and playoffs',
        color: 'from-[#48c6b7] to-[#2d7f86]',
      },
      {
        label: 'Squad Players',
        value: totalPlayers > 0 ? totalPlayers : '250+',
        detail: 'registered players',
        color: 'from-[#c75fd4] to-[#5b6ee1]',
      },
    ],
    [matches.length, teams, totalPlayers]
  );

  const matchCentreLinks = [
    { label: 'Live scorecard', href: '/live-score?league=ipl', icon: Radio },
    { label: 'Points table', href: '/ipl/points-table', icon: BarChart3 },
    { label: 'Fixtures', href: '/matches', icon: Calendar },
    { label: 'Teams', href: '/teams', icon: Users },
  ];

  const heroInsights = [
    { label: 'Orange Cap', value: 'Most runs', icon: Target },
    { label: 'Purple Cap', value: 'Most wickets', icon: ShieldCheck },
    { label: 'NRR Watch', value: 'Playoff race', icon: Activity },
  ];

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
    
    // Load data for IPL
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData, newsData, playersData] = await Promise.all([
          api.getTeams('ipl'),
          api.getMatches('ipl'),
          api.getNews(),
          api.getPlayers(undefined, 'ipl').catch(() => []),
        ]);
        
        // Attach players to teams with improved matching
        const teamsWithPlayers = teamsData.map(team => {
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
            
            return teamIdVariations.some(tv => 
              playerTeamIdVariations.some(pv => pv === tv)
            );
          });
          
          return {
            ...team,
            league: team.league || 'ipl',
            players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
          };
        });
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'ipl' || item.league === 'both'
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
        console.error('Error loading IPL data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up polling to refresh match data every 5 seconds for real-time updates
    const pollInterval = setInterval(() => {
      const loadMatchesOnly = async () => {
        try {
          const matchesData = await api.getMatches('ipl');
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
    <div className="min-h-screen overflow-x-hidden bg-[#050607] text-white">
      <Navbar />
      <PublicLiveMatchStrip league="ipl" matches={matches} />

      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-[#030706]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#030716_0%,#092017_44%,#030706_100%)]" />
        <div className="absolute inset-x-[-8%] top-[86px] h-16 rotate-[-1deg] bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.34),rgba(34,197,94,0.30),rgba(14,165,233,0.26),rgba(190,24,93,0.22),transparent)] blur-sm" />
        <div className="absolute inset-x-[-12%] top-[132px] h-px bg-[linear-gradient(90deg,transparent,rgba(251,191,36,0.92),rgba(45,212,191,0.86),rgba(129,140,248,0.70),transparent)]" />
        <div className="absolute inset-x-[-18%] bottom-[13%] h-20 rotate-[1.5deg] bg-[linear-gradient(90deg,transparent,rgba(20,184,166,0.26),rgba(245,158,11,0.26),rgba(225,29,72,0.18),transparent)] blur-xl" />
        <div className="absolute left-1/2 top-[18%] h-[66vh] w-[116vw] -translate-x-1/2 rounded-[50%] border border-emerald-200/20 bg-[radial-gradient(ellipse_at_center,rgba(38,140,79,0.42)_0%,rgba(16,103,66,0.36)_36%,rgba(8,62,43,0.20)_68%,transparent_100%)] shadow-[inset_0_0_120px_rgba(52,211,153,0.18),0_0_90px_rgba(16,185,129,0.10)] [mask-image:linear-gradient(180deg,transparent_0%,black_12%,black_82%,transparent_100%)]" />
        <div className="absolute left-1/2 top-[36%] h-[230px] w-[min(820px,78vw)] -translate-x-1/2 -rotate-2 rounded-[34px] border border-amber-100/25 bg-[linear-gradient(90deg,rgba(126,78,28,0.42),rgba(241,200,107,0.52)_48%,rgba(104,68,24,0.40))] shadow-[0_0_90px_rgba(245,158,11,0.18)]" />
        <div className="absolute left-1/2 top-[36%] h-[230px] w-[min(820px,78vw)] -translate-x-1/2 -rotate-2 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_1px,transparent_1px,transparent_54px)] opacity-50" />
        <div className="absolute left-1/2 top-[39%] h-[300px] w-[min(1120px,94vw)] -translate-x-1/2 rounded-[50%] border-t border-emerald-100/25" />
        <div className="absolute left-[8%] top-[24%] h-[1px] w-[24%] bg-[linear-gradient(90deg,transparent,rgba(251,191,36,0.34),transparent)]" />
        <div className="absolute right-[8%] top-[29%] h-[1px] w-[26%] bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.34),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '96px 96px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-soft-light"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,6,0.10)_0%,rgba(3,7,6,0.18)_46%,#030706_100%)]" />
      </div>

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
        <section className="relative overflow-hidden pt-12 pb-12 sm:pt-14 lg:pt-16 lg:pb-16">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[52%] top-[8%] h-[520px] w-[980px] -translate-x-1/2 -rotate-3 rounded-[50%] border border-emerald-100/20 bg-[radial-gradient(ellipse_at_center,rgba(36,145,82,0.42)_0%,rgba(15,93,62,0.32)_44%,rgba(4,28,23,0.10)_72%,transparent_100%)] shadow-[inset_0_0_120px_rgba(110,231,183,0.16),0_0_80px_rgba(34,197,94,0.10)] [mask-image:linear-gradient(90deg,transparent_0%,black_14%,black_86%,transparent_100%)]" />
            <div className="absolute left-[52%] top-[38%] h-32 w-[540px] -translate-x-1/2 -rotate-3 rounded-[28px] border border-amber-100/25 bg-[linear-gradient(90deg,rgba(113,63,18,0.55),rgba(251,191,36,0.48)_50%,rgba(120,53,15,0.50))] shadow-[0_0_70px_rgba(245,158,11,0.18)]" />
            <div className="absolute left-[52%] top-[38%] h-32 w-[540px] -translate-x-1/2 -rotate-3 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0px,rgba(255,255,255,0.18)_1px,transparent_1px,transparent_48px)] opacity-50" />
            <div className="absolute left-[52%] top-[47%] h-[220px] w-[760px] -translate-x-1/2 rounded-[50%] border-t border-emerald-100/25" />
            <div className="absolute right-[2%] top-[4%] h-[420px] w-[360px] bg-[linear-gradient(120deg,rgba(125,211,252,0.18),rgba(45,212,191,0.10)_45%,transparent_70%)] [clip-path:polygon(52%_0,100%_0,62%_100%,0_100%)]" />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              transform: `translate(${(mousePosition?.x ?? 0) * 0.12}px, ${(mousePosition?.y ?? 0) * 0.12}px)`,
            }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-[-10%] top-24 h-28 w-[120%] -rotate-3 bg-[linear-gradient(90deg,transparent,rgba(231,118,47,0.20),rgba(40,164,160,0.16),transparent)] blur-2xl"
            style={{ x: springX, y: springY }}
            animate={prefersReducedMotion ? undefined : { opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute bottom-8 right-[-8%] h-20 w-[80%] rotate-2 bg-[linear-gradient(90deg,transparent,rgba(143,78,168,0.18),rgba(244,180,77,0.16),transparent)] blur-2xl"
            animate={prefersReducedMotion ? undefined : { x: [0, -18, 0], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {heroParticles.map((particle, index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              className="absolute h-px w-8 bg-[#f4c46f]/30"
              style={{ left: particle.left, top: particle.top }}
              animate={prefersReducedMotion ? undefined : { x: [0, 34, 0], opacity: [0, 0.8, 0] }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(390px,520px)] lg:gap-14">
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 26 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-[#d59a52]/30 bg-[#120d08]/60 px-4 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6c56b,#c65d2c)] text-[#1d1007]">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-[#f5d7a3]">
                    Indian Premier League Match Centre
                  </span>
                </div>

                <motion.h1
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 34 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl font-black leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
                >
                  <span className="block text-[#fff4de] drop-shadow-[0_12px_36px_rgba(0,0,0,0.58)]">IPL</span>
                  <span className="block bg-[linear-gradient(100deg,#f4b44d_0%,#e66f2f_36%,#35b3a8_70%,#b06ad6_100%)] bg-clip-text text-transparent">
                    2026
                  </span>
                </motion.h1>

                <motion.p
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.18 }}
                  className="max-w-2xl text-base leading-8 text-[#e8dfcf] sm:text-lg lg:text-xl"
                >
                  Follow every IPL over with live scorecards, fixtures, results, table movement, NRR pressure, and the Orange Cap and Purple Cap races in one cricket-first hub.
                </motion.p>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.28 }}
                  className="flex flex-wrap gap-2.5"
                >
                  {heroInsights.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-[#eadbc3] backdrop-blur-md"
                    >
                      <item.icon className="h-4 w-4 text-[#f1bb62]" />
                      <span>{item.label}</span>
                      <span className="text-[#8fc9c3]">{item.value}</span>
                    </span>
                  ))}
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 22 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.36 }}
                  className="max-w-2xl"
                >
                  <IplChampionHighlight variant="hero" />
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 22 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.44 }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  {heroStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                      transition={{ duration: 0.22 }}
                      className="group relative min-h-[116px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1010]/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                      <div className="relative z-10">
                        <div className="text-3xl font-black text-[#fff4df]">{stat.value}</div>
                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[#f2be70]">{stat.label}</div>
                        <div className="mt-1 text-sm text-[#beb4a4]">{stat.detail}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 22 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.54 }}
                  className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"
                >
                  {matchCentreLinks.map((link, index) => {
                    const isPrimary = index === 0;
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={`group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all duration-300 ${
                          isPrimary
                            ? 'bg-[linear-gradient(135deg,#f4b44d,#e66f2f)] text-[#1d1007] shadow-[0_18px_48px_rgba(230,111,47,0.30)] hover:shadow-[0_20px_58px_rgba(230,111,47,0.42)]'
                            : 'border border-white/10 bg-white/[0.06] text-[#f3eadb] backdrop-blur-xl hover:border-[#d59a52]/40 hover:bg-white/[0.10]'
                        }`}
                      >
                        <link.icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              </motion.div>

              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 34, rotateX: 4 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="relative lg:pt-14"
              >
                <div className="relative overflow-hidden rounded-[28px] border border-[#d59a52]/25 bg-[linear-gradient(145deg,rgba(10,14,14,0.88),rgba(24,22,18,0.78),rgba(12,36,39,0.72))] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-6">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#f4c46f,#45b8ad,transparent)]" />
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-10 h-52 w-52 border border-[#f4c46f]/20"
                    animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-24 bottom-10 h-40 w-72 rotate-[-12deg] bg-[linear-gradient(90deg,transparent,rgba(69,184,173,0.14),transparent)] blur-2xl"
                    animate={prefersReducedMotion ? undefined : { x: [0, 18, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#45b8ad]/25 bg-[#123536]/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9be1d8]">
                        <Radio className="h-3.5 w-3.5" />
                        {heroMatchLabel}
                      </div>
                      <h2 className="mt-4 text-2xl font-black tracking-tight text-[#fff4df] sm:text-3xl">
                        {heroMatch ? `${heroMatch.team1.shortName} vs ${heroMatch.team2.shortName}` : 'IPL schedule'}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#cbbfaa]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#f2be70]" />
                          {heroMatchDateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#45b8ad]" />
                          {heroMatchVenue}
                        </span>
                      </div>
                    </div>
                    <div className="hidden min-w-[92px] rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3 text-center sm:block">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a9dad4]">{formatPlayoffLabel(heroMatch)}</div>
                      <div className="mt-1 text-2xl font-black text-[#f4c46f]">{liveMatchCount}</div>
                      <div className="text-[11px] text-[#b9aa96]">live now</div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <div className="grid grid-cols-[1fr_auto] items-center border-b border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#a9dad4]">
                      <span>Scorecard</span>
                      <span>Runs</span>
                    </div>
                    {heroScoreRows.length > 0 ? (
                      heroScoreRows.map((row) => (
                        <div key={row.team} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[0.08] px-4 py-4 last:border-b-0">
                          <div className="min-w-0">
                            <div className="text-lg font-black text-[#fff4df]">{row.team}</div>
                            <div className="truncate text-xs text-[#a99f91]">{row.name}</div>
                          </div>
                          <div className="text-right text-lg font-black text-[#f4c46f]">{row.score}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-[#cbbfaa]">Fixtures and scorecards are being refreshed.</div>
                    )}
                  </div>

                  {heroMatch?.result && (
                    <p className="relative z-10 mt-4 rounded-2xl border border-[#f4c46f]/20 bg-[#2b1b09]/40 px-4 py-3 text-sm font-semibold leading-6 text-[#f3dfbd]">
                      {heroMatch.result}
                    </p>
                  )}

                  <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
                    {heroInsights.map((item) => (
                      <div key={item.label} className="min-h-[92px] rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                        <item.icon className="h-5 w-5 text-[#f2be70]" />
                        <div className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#f5d7a3]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#8fc9c3]">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={heroMatchHref}
                    className="relative z-10 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-4 py-3 text-sm font-black text-[#fff4df] transition-all duration-300 hover:bg-white/[0.12]"
                  >
                    Open match centre
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
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
                      <div className="text-sm text-gray-300 mb-4">
                        {formatMatchTime(featuredLiveMatch.time, featuredLiveMatch.date)}
                      </div>
                      {/* Display Toss Information */}
                      {featuredLiveMatch.matchState?.toss && (
                        <motion.div 
                          className="text-xs px-3 py-2 rounded-lg inline-block"
                          style={{
                            background: 'rgba(219, 39, 119, 0.2)',
                            color: '#FDB4D9',
                          }}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <div className="font-semibold">
                            {featuredLiveMatch.matchState.toss.winner === 'team1' ? featuredLiveMatch.team1.shortName : featuredLiveMatch.team2.shortName} won the toss
                          </div>
                          <div className="text-xs text-gray-300">
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
                      <div className="text-3xl font-black text-white mb-2">{featuredLiveMatch.team2.shortName}</div>
                      <div className="text-sm text-gray-300">{featuredLiveMatch.team2.name}</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}
        
        {/* Quick Stats Widget - Enhanced */}
        {!isLoading && (
          <section className="relative -mt-8 py-10">
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
                className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
              >
                  <div>
                  <motion.div
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d59a52]/30 bg-[#2b1b09]/40 px-5 py-2.5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Users className="h-5 w-5 text-[#f2be70]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f5d7a3]">IPL Franchises</span>
                  </motion.div>
                  <h2 className="text-4xl font-black text-white md:text-6xl">
                      Franchise <GradientText gradient="from-[#f4b44d] via-[#e66f2f] to-[#45b8ad]" animate>Squads</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/teams"
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#d59a52]/30 bg-white/[0.055] px-6 py-3 text-sm font-black text-[#f5d7a3] transition-all duration-300 hover:bg-white/[0.10]"
                  >
                    All teams
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
          <section className="relative overflow-hidden py-24">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(69,184,173,0.08),transparent)]" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
              >
                  <div>
                  <motion.div
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#45b8ad]/30 bg-[#123536]/40 px-5 py-2.5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Calendar className="h-5 w-5 text-[#8edfd6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#aee9e3]">Fixtures & Results</span>
                  </motion.div>
                  <h2 className="text-4xl font-black text-white md:text-6xl">
                      Matchday <GradientText gradient="from-[#45b8ad] via-[#f4b44d] to-[#e66f2f]" animate>Scorecards</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/matches"
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#45b8ad]/30 bg-white/[0.055] px-6 py-3 text-sm font-black text-[#aee9e3] transition-all duration-300 hover:bg-white/[0.10]"
                  >
                    Full fixture list
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
                className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
              >
                  <div>
                  <motion.div
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b06ad6]/30 bg-[#271532]/40 px-5 py-2.5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <TrendingUp className="h-5 w-5 text-[#d69dea]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#dfc2eb]">Orange Cap, Purple Cap & NRR</span>
                  </motion.div>
                  <h2 className="text-4xl font-black text-white md:text-6xl">
                      Season <GradientText gradient="from-[#f4b44d] via-[#b06ad6] to-[#45b8ad]" animate>Numbers</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/stats"
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#b06ad6]/30 bg-white/[0.055] px-6 py-3 text-sm font-black text-[#dfc2eb] transition-all duration-300 hover:bg-white/[0.10]"
                  >
                    Stats hub
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
          <section className="relative overflow-hidden py-24">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(176,106,214,0.08),transparent)]" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
              >
                  <div>
                  <motion.div
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e66f2f]/30 bg-[#2d1309]/40 px-5 py-2.5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="h-5 w-5 text-[#f4b44d]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f5d7a3]">IPL Newsroom</span>
                  </motion.div>
                  <h2 className="text-4xl font-black text-white md:text-6xl">
                      Latest <GradientText gradient="from-[#e66f2f] via-[#f4b44d] to-[#45b8ad]" animate>IPL Stories</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/news"
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#e66f2f]/30 bg-white/[0.055] px-6 py-3 text-sm font-black text-[#f5d7a3] transition-all duration-300 hover:bg-white/[0.10]"
                  >
                    News archive
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
              </motion.div>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Feature Showcase - Enhanced */}
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
