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
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import BackToTop from '@/components/ui/BackToTop';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { Trophy, Sparkles, ArrowRight, Zap, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lastAcceptanceDate, setLastAcceptanceDate] = useState<string | null>(null);
  const [needsReAcceptance, setNeedsReAcceptance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
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
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasLiveMatch, setHasLiveMatch] = useState(false);
  
  // Calculate derived data
  const iplLiveMatches = useMemo(() => iplMatches.filter(m => m.status === 'live').length, [iplMatches]);
  const wplLiveMatches = useMemo(() => wplMatches.filter(m => m.status === 'live').length, [wplMatches]);
  const totalLiveMatches = iplLiveMatches + wplLiveMatches;
  
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

    // Load data for both leagues
    const loadData = async () => {
      try {
        // Load IPL data
        setIplLoading(true);
        const [iplTeamsData, iplMatchesData] = await Promise.all([
          api.getTeams('ipl'),
          api.getMatches('ipl'),
        ]);
        setIplTeams(iplTeamsData);
        setIplMatches(iplMatchesData);
        setIplLoading(false);

        // Load WPL data
        setWplLoading(true);
        const [wplTeamsData, wplMatchesData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl'),
        ]);
        setWplTeams(wplTeamsData);
        setWplMatches(wplMatchesData);
        setWplLoading(false);

        // Load news
        setNewsLoading(true);
        const newsData = await api.getNews();
        setNews(newsData);
        setNewsLoading(false);

        // Check for live matches
        const hasLive = iplMatchesData.some(m => m.status === 'live') || 
                       wplMatchesData.some(m => m.status === 'live');
        if (hasLive) {
          setHasLiveMatch(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIplLoading(false);
        setWplLoading(false);
        setNewsLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
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
        {/* Hero Section - Dual League Showcase */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-600/20 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-600/20 via-transparent to-transparent" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
            <AnimatedSection direction="down" delay={0.1}>
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                >
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Cricket Premier Leagues 2026
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-6 leading-tight"
                >
                  Experience <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>Cricket</GradientText>
                  <br />
                  <span className="text-5xl md:text-7xl lg:text-8xl">Like Never Before</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12"
                >
                  Follow both the Indian Premier League and Women's Premier League. 
                  Live scores, stats, news, and everything cricket in one place.
                </motion.p>
              </div>
            </AnimatedSection>

            {/* Dual League Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* IPL Card */}
              <AnimatedSection direction="left" delay={0.4}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 backdrop-blur-sm p-8 cursor-pointer"
                  onClick={() => router.push('/ipl')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                        <Trophy className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Indian Premier League</h3>
                        <p className="text-sm text-blue-300">IPL 2026</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6">
                      The world's biggest T20 cricket league. Experience the thrill, passion, and glory.
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{iplTeams.length}</p>
                        <p className="text-xs text-gray-400">Teams</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{iplMatches.length}</p>
                        <p className="text-xs text-gray-400">Matches</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{iplLiveMatches}</p>
                        <p className="text-xs text-gray-400">Live</p>
                      </div>
                    </div>

                    <Link
                      href="/ipl"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                    >
                      Explore IPL
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatedSection>

              {/* WPL Card */}
              <AnimatedSection direction="right" delay={0.5}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/10 border border-purple-500/30 backdrop-blur-sm p-8 cursor-pointer"
                  onClick={() => router.push('/wpl')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Women's Premier League</h3>
                        <p className="text-sm text-purple-300">WPL 2026</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6">
                      The pinnacle of women's T20 cricket. Power, passion, and excellence.
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{wplTeams.length}</p>
                        <p className="text-xs text-gray-400">Teams</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{wplMatches.length}</p>
                        <p className="text-xs text-gray-400">Matches</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{wplLiveMatches}</p>
                        <p className="text-xs text-gray-400">Live</p>
                      </div>
                    </div>

                    <Link
                      href="/wpl"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                    >
                      Explore WPL
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatedSection>
            </div>

            {/* Quick Stats Bar */}
            <AnimatedSection direction="up" delay={0.6}>
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">{iplTeams.length + wplTeams.length}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Teams</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">{iplMatches.length + wplMatches.length}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Matches</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">{totalLiveMatches}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Live Now</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">2</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Leagues</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* IPL Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <Trophy className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Indian Premier League</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white">
                    IPL <GradientText gradient="from-blue-400 to-cyan-400" animate>2026</GradientText>
                  </h2>
                </div>
                <Link
                  href="/ipl"
                  className="text-blue-400 hover:text-cyan-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* IPL Teams */}
            {iplLoading ? (
              <TeamsSkeleton />
            ) : iplTeams.length > 0 ? (
              <AnimatedSection direction="up" delay={0.3}>
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-white mb-6">Featured Teams</h3>
                  <ModernTeamsShowcase teams={iplTeams.slice(0, 5)} />
                </div>
              </AnimatedSection>
            ) : null}

            {/* IPL Matches */}
            {iplLoading ? (
              <MatchesSkeleton />
            ) : iplMatches.length > 0 ? (
              <AnimatedSection direction="up" delay={0.4}>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Upcoming Matches</h3>
                  <ModernMatchesGrid matches={iplMatches.slice(0, 3)} />
                </div>
              </AnimatedSection>
            ) : null}
          </div>
        </section>

        {/* WPL Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Women's Premier League</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white">
                    WPL <GradientText gradient="from-purple-400 to-pink-400" animate>2026</GradientText>
                  </h2>
                </div>
                <Link
                  href="/wpl"
                  className="text-purple-400 hover:text-pink-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* WPL Teams */}
            {wplLoading ? (
              <TeamsSkeleton />
            ) : wplTeams.length > 0 ? (
              <AnimatedSection direction="up" delay={0.3}>
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-white mb-6">Featured Teams</h3>
                  <ModernTeamsShowcase teams={wplTeams.slice(0, 5)} />
                </div>
              </AnimatedSection>
            ) : null}

            {/* WPL Matches */}
            {wplLoading ? (
              <MatchesSkeleton />
            ) : wplMatches.length > 0 ? (
              <AnimatedSection direction="up" delay={0.4}>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Upcoming Matches</h3>
                  <ModernMatchesGrid matches={wplMatches.slice(0, 3)} />
                </div>
              </AnimatedSection>
            ) : null}
          </div>
        </section>

        {/* Combined Stats Section */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  League <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>Statistics</GradientText>
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Comprehensive statistics and insights from both premier leagues
                </p>
              </div>
            </AnimatedSection>
            <ModernStatsSection />
          </div>
        </section>

        {/* News Section */}
        {newsLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-4xl md:text-5xl font-black text-white">
                    Latest <GradientText gradient="from-blue-400 to-purple-400" animate>News</GradientText>
                  </h2>
                  <Link
                    href="/news"
                    className="text-blue-400 hover:text-purple-400 font-semibold flex items-center gap-2 transition-colors"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </AnimatedSection>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Feature Showcase */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ModernFeatureShowcase />
          </div>
        </section>

        {/* CTA Section */}
        <AnimatedSection direction="up" delay={0.3}>
          <section className="relative py-24 mt-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-black text-white mb-6"
              >
                Ready to Experience <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>Cricket</GradientText>?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
              >
                Join millions of cricket fans following live scores, stats, and all the action from both leagues.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/live-score"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Watch Live Scores
                </Link>
                <Link
                  href="/matches"
                  className="px-8 py-4 rounded-xl bg-white/10 text-white font-bold border border-purple-500/50 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  View All Matches
                </Link>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
