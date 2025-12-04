'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import ModernFeatureShowcase from '@/components/home/ModernFeatureShowcase';
import ParallaxSection from '@/components/effects/ParallaxSection';
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
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { Trophy, ArrowRight, Play, Calendar, TrendingUp, Users, Zap } from 'lucide-react';

export default function IPLHomePage() {
  const router = useRouter();
  const { currentLeague, setCurrentLeague } = useLeague();
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
  
  // Set league to IPL when page loads
  useEffect(() => {
    if (currentLeague !== 'ipl') {
      setCurrentLeague('ipl');
    }
  }, [currentLeague, setCurrentLeague]);
  
  // Calculate derived data
  const liveMatchCount = useMemo(() => matches.filter(m => m.status === 'live').length, [matches]);
  const nextMatch = useMemo(() => {
    const upcoming = matches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [matches]);
  
  // Calculate total players from teams
  const totalPlayers = useMemo(() => {
    return teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
  }, [teams]);

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
          api.getPlayers(undefined, 'ipl').catch(() => []), // Fetch players for accurate counts
        ]);
        
        console.log('IPL Home page: Fetched players:', playersData?.length || 0);
        
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
            
            // Check if any variation matches
            return teamIdVariations.some(tv => 
              playerTeamIdVariations.some(pv => pv === tv)
            );
          });
          
          if (teamPlayers.length > 0) {
            console.log(`IPL Home page: Matched ${teamPlayers.length} players for team ${team.name} (ID: ${team.id})`);
          } else if (playersData && playersData.length > 0) {
            console.warn(`IPL Home page: No players matched for team ${team.name} (ID: ${team.id}). Sample player teamIds:`, 
              playersData.slice(0, 3).map(p => p.teamId));
          }
          
          return {
            ...team,
            players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
          };
        });
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'ipl' || item.league === 'both'
        );
        
        setTeams(teamsWithPlayers);
        setMatches(matchesData);
        setNews(filteredNews);

        // Check if there's a live match
        const liveMatch = matchesData.some((match) => match.status === 'live');
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
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950">
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
        {/* Premium Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-indigo-950/40 to-cyan-950/50" />
            <motion.div
              className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.6, 0.3],
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3],
                x: [0, -80, 0],
                y: [0, -40, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                }}
              />
            </div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-500/10 backdrop-blur-xl border border-blue-400/30 shadow-2xl"
                >
                  <Trophy className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Indian Premier League
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight"
                >
                  <span className="block bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                    IPL
                  </span>
                  <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                    2026
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-xl"
                >
                  The world's biggest T20 cricket league. Experience the thrill, passion, and glory of IPL 2026.
                </motion.p>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="grid grid-cols-3 gap-4 pt-4"
                >
                  {[
                    { label: 'Teams', value: '10', bgColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(96, 165, 250, 0.2)', textColor: '#60A5FA' },
                    { label: 'Matches', value: '74', bgColor: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(34, 211, 238, 0.2)', textColor: '#22D3EE' },
                    { label: 'Cities', value: '12', bgColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(129, 140, 248, 0.2)', textColor: '#818CF8' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className="group relative overflow-hidden p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: stat.bgColor,
                        border: `1px solid ${stat.borderColor}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = stat.borderColor.replace('0.2', '0.4');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = stat.borderColor;
                      }}
                    >
                      <div className="text-3xl font-black mb-1" style={{ color: stat.textColor }}>{stat.value}</div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <Link
                    href="/live-score"
                    className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Live Scores
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    href="/teams"
                    className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    Explore Teams
                  </Link>
                  <Link
                    href="/matches"
                    className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border-2 border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    View Matches
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right Visual */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative h-[500px] lg:h-[600px] flex items-center justify-center"
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
                >
                  {/* Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-cyan-500/40 to-indigo-500/40 blur-3xl animate-pulse" />
                  
                  {/* Main Circle */}
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-600/30 via-cyan-600/30 to-indigo-600/30 backdrop-blur-2xl border-2 border-blue-400/30 flex items-center justify-center shadow-2xl">
                    <div className="text-center space-y-4">
                      <Trophy className="w-24 h-24 mx-auto text-yellow-400 drop-shadow-2xl" />
                      <div className="text-4xl font-black text-white">IPL</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">2026</div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  {[
                    { top: '10%', right: '10%', text: '10', label: 'Teams', delay: 0 },
                    { bottom: '15%', left: '10%', text: '74', label: 'Matches', delay: 0.5 },
                    { top: '50%', right: '-5%', text: '12', label: 'Cities', delay: 1 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1 + item.delay }}
                      className={`absolute ${item.top || ''} ${item.right || ''} ${item.bottom || ''} ${item.left || ''} p-4 rounded-2xl bg-blue-500/10 backdrop-blur-xl border border-blue-400/30 shadow-xl text-center`}
                    >
                      <div className="text-2xl font-black text-blue-400">{item.text}</div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-blue-500/30 flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-blue-400/50"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>
        
        {/* Quick Stats Widget */}
        {!isLoading && (
          <section className="relative py-12 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.5}>
                <QuickStatsWidget matches={matches} />
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* Teams Showcase */}
        {isLoading ? (
          <TeamsSkeleton />
        ) : teams.length > 0 ? (
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Elite Franchises</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      IPL <GradientText gradient="from-blue-400 to-cyan-400" animate>Teams</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/teams"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernTeamsShowcase teams={teams.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Matches Grid */}
        {isLoading ? (
          <MatchesSkeleton />
        ) : matches.length > 0 ? (
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Upcoming Fixtures</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      Upcoming <GradientText gradient="from-cyan-400 to-blue-400" animate>Matches</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/matches"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-white transition-all duration-300"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernMatchesGrid matches={matches.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Stats Section */}
        {!isLoading && (
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-sm">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Performance Analytics</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      League <GradientText gradient="from-blue-400 via-cyan-400 to-indigo-400" animate>Statistics</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/stats"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-white transition-all duration-300"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernStatsSection 
                totalMatches={matches.length}
                totalTeams={teams.length}
                activePlayers={totalPlayers > 0 ? totalPlayers.toString() : undefined}
              />
            </div>
          </section>
        )}

        {/* News Section */}
        {isLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 via-transparent to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Breaking News</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      Latest <GradientText gradient="from-indigo-400 to-blue-400" animate>News</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/news"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

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
