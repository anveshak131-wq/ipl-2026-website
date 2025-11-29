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
import { Sparkles, ArrowRight, Play, Calendar, TrendingUp, Users, Zap } from 'lucide-react';

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

    // Load data for WPL
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData, newsData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl'),
          api.getNews(),
        ]);
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'wpl' || item.league === 'both'
        );
        
        setTeams(teamsData);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950">
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
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <ParallaxSection speed={0.5}>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-pink-600/30 to-rose-600/40" />
              <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.15),transparent_50%)]" />
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <AnimatedSection direction="down" delay={0.1}>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-purple-500/30 shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    Women's Premier League
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-6 leading-tight"
                >
                  WPL <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>2026</GradientText>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                  The pinnacle of women's T20 cricket. Experience the power, passion, and excellence of WPL 2026.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <Link
                    href="/live-score"
                    className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Live Scores
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    href="/wpl/teams"
                    className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold text-lg border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    Explore Teams
                  </Link>
                  <Link
                    href="/wpl/matches"
                    className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold text-lg border-2 border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    View Matches
                  </Link>
                </motion.div>
              </AnimatedSection>
            </div>
          </ParallaxSection>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-purple-500/30 flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-purple-400/50"
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
              <ModernStatsSection />
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
