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
import QuickStatsWidget from '@/components/home/QuickStatsWidget';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { Trophy, Sparkles, ArrowRight, Zap, Play, TrendingUp, Calendar, Radio } from 'lucide-react';

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
        {/* Hero Section - Premium Design */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-pink-600/30" />
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
              >
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Cricket Premier Leagues 2026
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight"
              >
                Experience Cricket
                <br />
                <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>
                  Like Never Before
                </GradientText>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
              >
                Your ultimate destination for IPL and WPL. Live scores, real-time stats, breaking news, and everything cricket.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4 pt-4"
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
                  href="/matches"
                  className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  View Matches
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white/50"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>

        {/* League Selection Cards - Premium Design */}
        <section className="relative py-20 -mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* IPL Card */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/30 via-blue-500/20 to-cyan-500/30 backdrop-blur-xl border border-blue-500/30 p-8 cursor-pointer shadow-2xl"
                onClick={() => router.push('/ipl')}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm">
                        <Trophy className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white mb-1">Indian Premier League</h3>
                        <p className="text-sm text-blue-300 font-semibold">IPL 2026</p>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    The world's biggest T20 cricket league. Experience the thrill, passion, and glory.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{iplTeams.length}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Teams</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{iplMatches.length}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Matches</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{iplLiveMatches}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Live</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <span>Explore IPL</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>

              {/* WPL Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-rose-500/30 backdrop-blur-xl border border-purple-500/30 p-8 cursor-pointer shadow-2xl"
                onClick={() => router.push('/wpl')}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-400/30 backdrop-blur-sm">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white mb-1">Women's Premier League</h3>
                        <p className="text-sm text-purple-300 font-semibold">WPL 2026</p>
                      </div>
            </div>
                    <ArrowRight className="w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
              </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    The pinnacle of women's T20 cricket. Power, passion, and excellence.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{wplTeams.length}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Teams</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{wplMatches.length}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Matches</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white mb-1">{wplLiveMatches}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Live</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-purple-400 font-semibold">
                    <span>Explore WPL</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Teams', value: iplTeams.length + wplTeams.length, icon: Trophy, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Total Matches', value: iplMatches.length + wplMatches.length, icon: Calendar, color: 'from-purple-500 to-pink-500' },
                  { label: 'Live Now', value: totalLiveMatches, icon: Radio, color: 'from-red-500 to-orange-500' },
                  { label: 'Leagues', value: 2, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 text-center group hover:bg-white/10 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <stat.icon className="w-6 h-6 mx-auto mb-3 text-gray-400 group-hover:text-white transition-colors" />
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
          </div>
            </motion.div>
          </div>
        </section>

        {/* IPL Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <Trophy className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Indian Premier League</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white">
                    IPL <GradientText gradient="from-blue-400 to-cyan-400" animate>2026</GradientText>
              </h2>
                </div>
                <Link
                  href="/ipl"
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300"
                >
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  <ModernTeamsShowcase teams={iplTeams.filter(team => !isPlaceholderTeam(team)).slice(0, 5)} />
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
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Women's Premier League</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white">
                    WPL <GradientText gradient="from-purple-400 to-pink-400" animate>2026</GradientText>
                  </h2>
                </div>
                <Link
                  href="/wpl"
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-white transition-all duration-300"
                >
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  <ModernTeamsShowcase teams={wplTeams.filter(team => !isPlaceholderTeam(team)).slice(0, 5)} />
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
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection direction="up" delay={0.2}>
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
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
          <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection direction="up" delay={0.2}>
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-4xl md:text-6xl font-black text-white">
                    Latest <GradientText gradient="from-blue-400 to-purple-400" animate>News</GradientText>
              </h2>
                  <Link
                    href="/news"
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-blue-400 transition-all duration-300"
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
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ModernFeatureShowcase />
          </div>
        </section>

        {/* CTA Section */}
        <AnimatedSection direction="up" delay={0.3}>
          <section className="relative py-32 mt-12">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-black text-white mb-6"
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
                  className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
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
