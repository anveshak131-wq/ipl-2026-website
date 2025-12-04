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
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { Sparkles, ArrowRight, Play, Calendar, TrendingUp, Users, Zap, Trophy, Star } from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors } from '@/lib/wplColors';
import CountdownTimer from '@/components/ui/CountdownTimer';

export default function WPLHomePage() {
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
  
  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
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
              players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
            };
          });
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'wpl' || item.league === 'both'
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
        console.error('Error loading WPL data:', error);
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
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
      }}
    >
      <AuroraBackground />
      <WPLFloatingParticles />
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
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[40]}, ${WPLColors.pinkRGBA[30]}, ${WPLColors.roseRGBA[40]})`,
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${WPLColors.gradientMid}4D, transparent, ${WPLColors.gradientEnd}4D)`,
              }}
            />
            <motion.div
              className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
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
              style={{
                background: `radial-gradient(circle, ${WPLColors.purpleRGBA[50]}, transparent)`,
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
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
              style={{
                background: `radial-gradient(circle, ${WPLColors.pinkRGBA[50]}, transparent)`,
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${WPLColors.purpleRGBA[20]}, transparent 70%)`,
              }}
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(147,51,234,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(147,51,234,0.1) 1px, transparent 1px)
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
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[15]})`,
                    border: `1px solid ${WPLColors.purpleRGBA[40]}`,
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: WPLColors.pink }} />
                  <span 
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: WPLColors.textPrimary }}
                  >
                    Women's Premier League
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight"
                >
                  <span 
                    className="block bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
                  >
                    WPL
                  </span>
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                    2026
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl leading-relaxed max-w-xl"
                  style={{ color: WPLColors.textSecondary }}
                >
                  The pinnacle of women's T20 cricket. Experience the power, passion, and excellence of WPL 2026.
                </motion.p>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="grid grid-cols-3 gap-4 pt-4"
                >
                  {[
                    { label: 'Teams', value: '5', bgColor: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30], textColor: WPLColors.purple },
                    { label: 'Matches', value: '22', bgColor: WPLColors.pinkRGBA[10], borderColor: WPLColors.pinkRGBA[30], textColor: WPLColors.pink },
                    { label: 'Season', value: '2026', bgColor: WPLColors.roseRGBA[10], borderColor: WPLColors.roseRGBA[30], textColor: WPLColors.rose },
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
                        e.currentTarget.style.borderColor = stat.borderColor.replace('0.3', '0.5');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = stat.borderColor;
                      }}
                    >
                      <div className="text-3xl font-black mb-1" style={{ color: stat.textColor }}>{stat.value}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: WPLColors.textMuted }}>{stat.label}</div>
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
                    href="/wpl/matches"
                    className="group relative px-8 py-4 rounded-xl text-white font-bold text-lg shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink})`,
                      boxShadow: `0 10px 40px ${WPLColors.purpleRGBA[50]}, 0 0 60px ${WPLColors.pinkRGBA[30]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 20px 60px ${WPLColors.purpleRGBA[50]}, 0 0 80px ${WPLColors.pinkRGBA[40]}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 10px 40px ${WPLColors.purpleRGBA[50]}, 0 0 60px ${WPLColors.pinkRGBA[30]}`;
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      View Matches
                    </span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${WPLColors.pink}, ${WPLColors.purple})`,
                      }}
                    />
                  </Link>
                  <Link
                    href="/wpl/teams"
                    className="px-8 py-4 rounded-xl backdrop-blur-xl text-white font-bold text-lg border-2 transition-all duration-300 transform hover:scale-105"
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
                  <div 
                    className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${WPLColors.purpleRGBA[50]}, ${WPLColors.pinkRGBA[50]}, transparent)`,
                    }}
                  />
                  
                  {/* Main Circle */}
                  <div 
                    className="relative w-full h-full rounded-full backdrop-blur-2xl border-2 flex items-center justify-center shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[20]})`,
                      borderColor: WPLColors.purpleRGBA[40],
                    }}
                  >
                    <div className="text-center space-y-4">
                      <Trophy className="w-24 h-24 mx-auto drop-shadow-2xl" style={{ color: WPLColors.pink }} />
                      <div className="text-4xl font-black" style={{ color: WPLColors.textPrimary }}>WPL</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">2026</div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  {[
                    { top: '10%', right: '10%', text: '5', label: 'Teams', delay: 0 },
                    { bottom: '15%', left: '10%', text: '22', label: 'Matches', delay: 0.5 },
                    { top: '50%', right: '-5%', text: 'T20', label: 'Format', delay: 1 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1 + item.delay }}
                      className={`absolute ${item.top || ''} ${item.right || ''} ${item.bottom || ''} ${item.left || ''} p-4 rounded-2xl backdrop-blur-xl shadow-xl text-center`}
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      }}
                    >
                      <div className="text-2xl font-black" style={{ color: WPLColors.purple }}>{item.text}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: WPLColors.textMuted }}>{item.label}</div>
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
            <div 
              className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2"
              style={{
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: WPLColors.pinkRGBA[50],
                }}
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>
        
        {/* Quick Stats Cards - Enhanced with Purple/Pink Accents */}
        {!isLoading && (
          <section className="relative py-12 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.5}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Matches */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl px-6 py-5 backdrop-blur-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.purpleRGBA[10]})`,
                      border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      boxShadow: `0 8px 32px 0 ${WPLColors.purpleRGBA[20]}`,
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 12px 40px 0 ${WPLColors.purpleRGBA[30]}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-6 h-6" style={{ color: WPLColors.purple }} />
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: WPLColors.textAccent }}
                      >
                        Matches
                      </span>
                    </div>
                    <p 
                      className="text-3xl font-black"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      {matches.length}
                    </p>
                  </motion.div>

                  {/* Total Teams */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="rounded-xl px-6 py-5 backdrop-blur-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.pinkRGBA[20]}, ${WPLColors.pinkRGBA[10]})`,
                      border: `1px solid ${WPLColors.pinkRGBA[30]}`,
                      boxShadow: `0 8px 32px 0 ${WPLColors.pinkRGBA[20]}`,
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 12px 40px 0 ${WPLColors.pinkRGBA[30]}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6" style={{ color: WPLColors.pink }} />
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: WPLColors.pink }}
                      >
                        Teams
                      </span>
                    </div>
                    <p 
                      className="text-3xl font-black"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      {teams.length}
                    </p>
                  </motion.div>

                  {/* Live Matches */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="rounded-xl px-6 py-5 backdrop-blur-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.roseRGBA[20]}, ${WPLColors.roseRGBA[10]})`,
                      border: `1px solid ${WPLColors.roseRGBA[30]}`,
                      boxShadow: `0 8px 32px 0 ${WPLColors.roseRGBA[20]}`,
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 12px 40px 0 ${WPLColors.roseRGBA[30]}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Play className="w-6 h-6" style={{ color: WPLColors.rose }} />
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: WPLColors.rose }}
                      >
                        Live
                      </span>
                    </div>
                    <p 
                      className="text-3xl font-black"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      {liveMatchCount}
                    </p>
                  </motion.div>

                  {/* Upcoming Matches */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="rounded-xl px-6 py-5 backdrop-blur-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.violetRGBA[20]}, ${WPLColors.pinkRGBA[10]})`,
                      border: `1px solid ${WPLColors.violetRGBA[30]}`,
                      boxShadow: `0 8px 32px 0 ${WPLColors.violetRGBA[20]}`,
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 12px 40px 0 ${WPLColors.violetRGBA[30]}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6" style={{ color: WPLColors.violet }} />
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: WPLColors.textAccent }}
                      >
                        Upcoming
                      </span>
                    </div>
                    <p 
                      className="text-3xl font-black"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      {matches.filter(m => m.status === 'upcoming').length}
                    </p>
                  </motion.div>
                </div>
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
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Elite Franchises</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      WPL <GradientText gradient="from-purple-400 to-pink-400" animate>Teams</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/wpl/teams"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-white transition-all duration-300"
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
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/30 backdrop-blur-sm">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Upcoming Fixtures</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      Upcoming <GradientText gradient="from-pink-400 to-rose-400" animate>Matches</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/wpl/matches"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:text-white transition-all duration-300"
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
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/30 backdrop-blur-sm">
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Performance Analytics</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      League <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>Statistics</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/wpl/stats"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-white transition-all duration-300"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernStatsSection 
                totalMatches={matches.length}
                totalTeams={teams.length}
                activePlayers="100+"
                fanEngagement="500K+"
              />
            </div>
          </section>
        )}

        {/* News Section */}
        {isLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-950/10 via-transparent to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Breaking News</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white">
                      Latest <GradientText gradient="from-pink-400 to-purple-400" animate>News</GradientText>
                    </h2>
                  </div>
                  <Link
                    href="/news"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-white transition-all duration-300"
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
