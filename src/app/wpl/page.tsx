'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import ConfettiAnimation from '@/components/effects/ConfettiAnimation';
import FloatingBadge from '@/components/effects/FloatingBadge';
import GradientText from '@/components/ui/GradientText';
import BackToTop from '@/components/ui/BackToTop';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import type { Team, Match, News } from '@/types';
import { 
  Trophy, 
  ArrowRight, 
  Play, 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap,
  Star,
  Target,
  Activity,
  Sparkles,
  MapPin,
  BarChart3,
  ShieldCheck,
  Smartphone,
  BellRing
} from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors } from '@/lib/wplColors';
import { formatMatchTime } from '@/lib/timeUtils';
import PublicLiveMatchStrip from '@/components/live-score/PublicLiveMatchStrip';
import WPLSeasonHeader from '@/components/wpl/WPLSeasonHeader';

const TARGET_SEASON_YEAR = 2027;
const HERO_BACKGROUND_IMAGE = '/images/wpl-oil-stadium-hero.webp';

const SEASON_PULSE_CARDS = [
  {
    label: 'Season Window',
    value: 'Jan 9 - Feb 5',
    detail: 'Confirmed 28-day WPL 2027 championship window built for prime-time T20 action.',
    icon: Calendar,
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    label: 'Host Cities',
    value: 'TBA',
    detail: 'Official venues and touring caravan hubs are yet to be confirmed by the BCCI.',
    icon: MapPin,
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    label: 'Tournament Shape',
    value: 'TBA',
    detail: 'Fixture count, layout, and match schedule are pending official announcement.',
    icon: Trophy,
    accent: 'from-amber-300 to-orange-500',
  },
  {
    label: 'Final Story',
    value: 'Awaiting Kickoff',
    detail: 'The 2027 championship narrative begins once the tournament gets underway.',
    icon: Star,
    accent: 'from-pink-400 to-rose-500',
  },
] as const;

const WPL_TOOLS = [
  {
    title: 'Over-by-over scorecards',
    description: 'Follow runs, wickets, extras, partnerships, powerplay pressure, and death-over swings without losing the match context.',
    icon: Zap,
    accent: 'from-amber-300 to-orange-500',
  },
  {
    title: 'Table and NRR signals',
    description: 'Read form, points, net run rate, qualification pressure, and playoff movement in plain cricket language.',
    icon: BarChart3,
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    title: 'Squads and roles',
    description: 'Move from franchise cards to player pages with batting roles, bowling styles, all-rounders, and wicketkeeper context.',
    icon: Users,
    accent: 'from-violet-400 to-fuchsia-500',
  },
  {
    title: 'Prediction checks',
    description: 'Use toss, venue, form, and innings tempo to predict winners, top run-scorers, wicket-takers, and Player of the Match.',
    icon: Target,
    accent: 'from-pink-400 to-rose-500',
  },
  {
    title: 'Match alerts',
    description: 'Keep track of live starts, innings breaks, milestones, collapses, and scorecard updates during busy match nights.',
    icon: BellRing,
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    title: 'Mobile matchday',
    description: 'Use fast touch targets, compact score views, and readable cards whether you are at the ground or following on the move.',
    icon: Smartphone,
    accent: 'from-sky-400 to-indigo-500',
  },
] as const;

export default function WPLHomePage() {
  const router = useRouter();
  const { currentLeague, setCurrentLeague } = useLeague();
  const prefersReducedMotion = useReducedMotion();
  const [selectedSeason, setSelectedSeason] = useState<number>(2027);
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
  
  // Mouse tracking for subtle parallax effects.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 100 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const filterSeasonMatches = (items: Match[]): Match[] =>
    items.filter((match) => getMatchYear(match.date) === selectedSeason);
  
  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);
  
  // Calculate derived data
  const upcomingMatchCount = useMemo(() => matches.filter((match) => match.status === 'upcoming').length, [matches]);
  const completedMatchCount = useMemo(() => matches.filter((match) => match.status === 'completed').length, [matches]);
  const matchGridInitialFilter = upcomingMatchCount > 0 ? 'upcoming' : completedMatchCount > 0 ? 'completed' : 'all';
  const matchesSectionTitle = upcomingMatchCount > 0 ? 'Upcoming Matches' : completedMatchCount > 0 ? 'Season Results' : 'Match Schedule';
  const matchesSectionKicker = upcomingMatchCount > 0 ? 'Upcoming Fixtures' : completedMatchCount > 0 ? 'Scorecards & Results' : 'Fixtures';
  const matchesSectionCopy = upcomingMatchCount > 0
    ? 'Follow upcoming toss times, venues, squad news, and live scorecard links for the next WPL fixtures.'
    : completedMatchCount > 0
    ? 'Review completed WPL 2027 fixtures with scorecards, results, venues, and match context.'
    : 'WPL fixtures will appear here as soon as they are added to the schedule.';

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
        {/* WPL oil-paint hero */}
        <section className="relative overflow-hidden pt-8 pb-8 md:pt-10 md:pb-10">
          <motion.div
            className="absolute inset-0 -z-30 bg-cover bg-center md:bg-[center_right]"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(5,8,22,0.98) 0%, rgba(5,8,22,0.82) 42%, rgba(5,8,22,0.36) 72%, rgba(5,8,22,0.78) 100%), url('${HERO_BACKGROUND_IMAGE}')`,
            }}
            animate={prefersReducedMotion ? undefined : { scale: [1.02, 1.06, 1.02] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 -z-20 opacity-[0.16]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 7px)',
              mixBlendMode: 'soft-light',
            }}
          />
          <motion.div
            className="absolute left-[-14%] top-[18%] -z-10 h-24 w-[78%] -rotate-6 blur-2xl"
            style={{
              x: springX,
              y: springY,
              background: 'linear-gradient(90deg, rgba(34,211,238,0.20), rgba(236,72,153,0.18), rgba(251,191,36,0.10), transparent)',
            }}
            animate={prefersReducedMotion ? undefined : { opacity: [0.35, 0.62, 0.35] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-20%] bottom-[10%] -z-10 h-32 w-[70%] rotate-[-10deg] blur-2xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.18), rgba(124,58,237,0.16), rgba(16,185,129,0.08))',
            }}
            animate={prefersReducedMotion ? undefined : { x: [0, -18, 0], opacity: [0.28, 0.58, 0.28] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, type: 'spring', stiffness: 90 }}
                className="max-w-3xl"
              >
                <WPLSeasonHeader
                  selectedSeason={selectedSeason}
                  onSeasonChange={setSelectedSeason}
                />
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.08] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.32)]"
                >
                  <Sparkles className="w-5 h-5" style={{ color: WPLColors.pink }} />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                    Women's Premier League Season Hub
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.18, type: 'spring', stiffness: 90 }}
                  className="mt-5 text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-black leading-none tracking-normal"
                >
                  <span className="block bg-gradient-to-r from-white via-cyan-100 to-pink-100 bg-clip-text text-transparent">
                    WPL
                  </span>
                  <span className="block bg-gradient-to-r from-pink-300 via-violet-300 to-amber-200 bg-clip-text text-transparent">
                    {selectedSeason}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.28 }}
                  className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-slate-100"
                >
                  Follow the Women's Premier League with completed scorecards, squad stories, standings, predictions, and matchday context from the league stage to the final.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.62 }}
                  className="mt-6 flex flex-wrap gap-3"
                >
                  <Link
                    href="/wpl/matches"
                    className="group inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black text-white shadow-[0_18px_60px_rgba(236,72,153,0.28)] transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(135deg, ${WPLColors.pink}, ${WPLColors.violet})` }}
                  >
                    <Play className="w-4 h-4" />
                    View WPL Scorecards
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/wpl/teams"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-black text-white backdrop-blur-2xl transition-colors duration-300 hover:bg-white/[0.14]"
                  >
                    <Users className="w-4 h-4" />
                    Explore Squads
                  </Link>
                  <Link
                    href="/live-score?league=wpl"
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/[0.08] px-5 py-3 text-sm font-black text-cyan-50 backdrop-blur-2xl transition-colors duration-300 hover:bg-cyan-300/[0.14]"
                  >
                    <Activity className="w-4 h-4" />
                    Live Center
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.22, type: 'spring', stiffness: 90 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-lg bg-gradient-to-br from-pink-500/18 via-cyan-400/10 to-amber-300/10 blur-xl" />
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/58 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
                  <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: `url('${HERO_BACKGROUND_IMAGE}')`, backgroundSize: 'cover', backgroundPosition: 'center right' }} />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/78 to-slate-950/95" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-200">Season Snapshot</p>
                        <h2 className="mt-2 text-2xl font-black text-white">WPL 2027 Season Preview</h2>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08]">
                        <Trophy className="h-6 w-6 text-amber-200" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {SEASON_PULSE_CARDS.slice(0, 3).map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="grid grid-cols-[44px_1fr] gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${item.accent} text-slate-950`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                              <p className="mt-1 font-black text-white">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-lg border border-pink-300/20 bg-pink-300/[0.08] p-4">
                      <div className="flex items-center gap-2 text-pink-100">
                        <Star className="h-4 w-4" />
                        <p className="text-xs font-black uppercase tracking-[0.16em]">Final Storyline</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-white">RCB-W chased 204</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-200">
                        Bengaluru beat Delhi Capitals by six wickets in Vadodara, turning the final into a high-scoring chase.
                      </p>
                    </div>
                  </div>
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
                className="relative overflow-hidden rounded-lg backdrop-blur-2xl border p-10 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${WPLColors.roseRGBA[30]}, ${WPLColors.pinkRGBA[30]}, ${WPLColors.roseRGBA[30]})`,
                  borderColor: WPLColors.roseRGBA[40],
                }}
              >
                <motion.div
                  className="absolute -right-28 top-8 h-28 w-[70%] rotate-6 blur-2xl"
                  style={{
                    background: WPLColors.roseRGBA[20],
                  }}
                  animate={{
                    x: [0, -16, 0],
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
                      href="/live-score?league=wpl"
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
        
        {/* Season pulse */}
        <section className="relative py-8 md:-mt-12 md:pt-8 md:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SEASON_PULSE_CARDS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                    className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/50 p-5 backdrop-blur-2xl"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.accent} text-slate-950`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                        <p className="mt-1 text-lg font-black text-white">{item.value}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-lg backdrop-blur-sm"
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-lg backdrop-blur-sm"
                    style={{
                      background: WPLColors.pinkRGBA[20],
                      border: `1px solid ${WPLColors.pinkRGBA[30]}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: WPLColors.pink }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: WPLColors.textPrimary }}>{matchesSectionKicker}</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black leading-none" style={{ color: WPLColors.textPrimary }}>
                    {matchesSectionTitle.split(' ')[0]}{' '}
                    <GradientText gradient="from-pink-400 to-rose-400" animate>
                      {matchesSectionTitle.split(' ').slice(1).join(' ') || 'Fixtures'}
                    </GradientText>
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                    {matchesSectionCopy}
                  </p>
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
              <ModernMatchesGrid matches={matches} initialFilter={matchGridInitialFilter} />
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-lg backdrop-blur-sm"
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-lg backdrop-blur-sm"
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
              className="relative overflow-hidden rounded-lg backdrop-blur-2xl border p-10 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.pinkRGBA[20]}, ${WPLColors.roseRGBA[20]}, ${WPLColors.pinkRGBA[20]})`,
                borderColor: WPLColors.pinkRGBA[40],
              }}
            >
              <motion.div
                className="absolute -right-28 top-8 h-28 w-[70%] rotate-6 blur-2xl"
                style={{
                  background: WPLColors.pinkRGBA[20],
                }}
                animate={{
                  x: [0, -16, 0],
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
                    className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-lg backdrop-blur-sm"
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
                    Use toss calls, venue conditions, powerplay starts, death-over form, and player roles to make sharper WPL predictions and climb the leaderboard.
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
                    { label: 'Top Run-Scorer', icon: Star, color: 'from-rose-500 to-purple-500' },
                    { label: 'Most Wickets', icon: Activity, color: 'from-purple-500 to-pink-500' },
                    { label: 'Player of the Match', icon: Target, color: 'from-pink-500 to-rose-500' },
                  ].map((feature, idx) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="p-6 rounded-lg backdrop-blur-xl border transition-all"
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

        {/* WPL tools showcase */}
        {!isLoading && (
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="mb-12 text-center"
              >
                <div
                  className="mx-auto mb-5 inline-flex items-center gap-2 rounded-lg px-5 py-3"
                  style={{
                    background: WPLColors.blueRGBA[15],
                    border: `1px solid ${WPLColors.blueRGBA[30]}`,
                  }}
                >
                  <ShieldCheck className="h-5 w-5" style={{ color: WPLColors.active }} />
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-white">WPL Matchday Tools</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  Built for Women's <GradientText gradient="from-cyan-300 via-pink-300 to-amber-200" animate>T20 Cricket</GradientText>
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
                  Everything on this page is organized for the way WPL matches move: fast starts, middle-over matchups, death-over pressure, and table-changing results.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {WPL_TOOLS.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      key={tool.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -5 }}
                      className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/46 p-6 backdrop-blur-2xl"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tool.accent}`} />
                      <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-slate-950 transition-transform duration-300 group-hover:scale-105`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-black text-white">{tool.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{tool.description}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/live-score?league=wpl"
                  className="group inline-flex items-center gap-3 rounded-lg px-7 py-4 text-base font-black text-slate-950 transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${WPLColors.active}, ${WPLColors.textAccent})` }}
                >
                  Open WPL Live Scorecard
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
