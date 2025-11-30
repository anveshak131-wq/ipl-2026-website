'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import BackToTop from '@/components/ui/BackToTop';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton } from '@/components/home/HomePageSkeletons';
import { api } from '@/lib/data';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
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
  ChevronRight
} from 'lucide-react';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { formatMatchTime } from '@/lib/timeUtils';

export default function Home() {
  const router = useRouter();
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
  
  // Calculate derived data
  const iplLiveMatches = useMemo(() => iplMatches.filter(m => m.status === 'live'), [iplMatches]);
  const wplLiveMatches = useMemo(() => wplMatches.filter(m => m.status === 'live'), [wplMatches]);
  const totalLiveMatches = iplLiveMatches.length + wplLiveMatches.length;
  
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
        {/* Modern Hero Section */}
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
          {/* Dynamic Background Effects */}
          <div className="absolute inset-0">
            {/* Animated Gradient Mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-purple-600/10 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-600/20 via-rose-600/10 to-transparent" />
            
            {/* Floating Orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
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
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
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
            <motion.div
              className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-8">
              {/* Premium Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="relative">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <motion.div
                    className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-50"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Premier Cricket Leagues 2026
                </span>
              </motion.div>

              {/* Main Heading with Split Design */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9]"
                >
                  <span className="block">Cricket</span>
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                    Reimagined
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light"
                >
                  Your ultimate destination for <span className="text-blue-400 font-semibold">IPL</span> and <span className="text-purple-400 font-semibold">WPL</span>. 
                  Live scores, real-time stats, breaking news, and everything cricket.
                </motion.p>
              </div>

              {/* Live Match Badge - If there's a live match */}
              {featuredLiveMatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/30 shadow-xl"
                >
                  <motion.div
                    className="w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-sm font-bold text-red-400 uppercase tracking-wider">
                    Live Now
                  </span>
                  <span className="text-white font-semibold">
                    {featuredLiveMatch.team1.shortName} vs {featuredLiveMatch.team2.shortName}
                  </span>
                </motion.div>
              )}

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4 pt-6"
              >
                <Link
                  href="/live-score"
                  className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-105 overflow-hidden"
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
                </Link>
                <Link
                  href="/matches"
                  className="group px-10 py-5 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center gap-3">
                    View Matches
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8"
              >
                {[
                  { icon: Trophy, label: 'Teams', value: iplTeams.length + wplTeams.length, color: 'from-blue-500 to-cyan-500' },
                  { icon: Calendar, label: 'Matches', value: iplMatches.length + wplMatches.length, color: 'from-purple-500 to-pink-500' },
                  { icon: Radio, label: 'Live', value: totalLiveMatches, color: 'from-red-500 to-orange-500' },
                  { icon: TrendingUp, label: 'Leagues', value: 2, color: 'from-green-500 to-emerald-500' },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + idx * 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 text-center group hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <stat.icon className="w-7 h-7 mx-auto mb-3 text-gray-400 group-hover:text-white transition-colors" />
                    <p className="text-4xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2 backdrop-blur-sm bg-white/5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white/70"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>

        {/* Featured Live Match Section */}
        {featuredLiveMatch && (
          <section className="relative py-12 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-xl border-2 border-red-500/30 p-8 shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-3 h-3 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Match</span>
                    </div>
                    <Link
                      href="/live-score"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold transition-all"
                    >
                      Watch Live
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 items-center">
                    <div className="text-center md:text-left">
                      <div className="text-2xl font-black text-white mb-2">{featuredLiveMatch.team1.shortName}</div>
                      <div className="text-sm text-gray-400">{featuredLiveMatch.team1.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-white mb-2">VS</div>
                      <div className="text-sm text-gray-400">
                        {formatMatchTime(featuredLiveMatch.date, featuredLiveMatch.time)}
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="text-2xl font-black text-white mb-2">{featuredLiveMatch.team2.shortName}</div>
                      <div className="text-sm text-gray-400">{featuredLiveMatch.team2.name}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* League Selection Cards - Modern Design */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Choose Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">League</span>
              </h2>
              <p className="text-gray-400 text-lg">Experience the best of both worlds</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* IPL Card */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/40 via-blue-500/30 to-cyan-500/40 backdrop-blur-xl border-2 border-blue-500/30 p-8 cursor-pointer shadow-2xl"
                onClick={() => router.push('/ipl')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-5 rounded-2xl bg-blue-500/30 border border-blue-400/40 backdrop-blur-sm shadow-lg">
                        <Trophy className="w-10 h-10 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white mb-1">Indian Premier League</h3>
                        <p className="text-sm text-blue-300 font-bold">IPL 2026</p>
                      </div>
                    </div>
                    <ArrowRight className="w-7 h-7 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                  </div>

                  <p className="text-gray-200 mb-8 leading-relaxed text-lg">
                    The world's biggest T20 cricket league. Experience the thrill, passion, and glory of the men's premier tournament.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{iplTeams.filter(t => !isPlaceholderTeam(t)).length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Teams</p>
                    </div>
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{iplMatches.length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Matches</p>
                    </div>
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{iplLiveMatches.length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Live</p>
                    </div>
                  </div>

                  {iplNextMatch && (
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Next Match</p>
                          <p className="text-sm font-semibold text-white">
                            {iplNextMatch.team1.shortName} vs {iplNextMatch.team2.shortName}
                          </p>
                        </div>
                        <CountdownTimer targetDate={iplNextMatch.date} matchTime={iplNextMatch.time} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-blue-300 font-bold text-lg">
                    <span>Explore IPL</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>

              {/* WPL Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-rose-500/40 backdrop-blur-xl border-2 border-purple-500/30 p-8 cursor-pointer shadow-2xl"
                onClick={() => router.push('/wpl')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-5 rounded-2xl bg-purple-500/30 border border-purple-400/40 backdrop-blur-sm shadow-lg">
                        <Sparkles className="w-10 h-10 text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white mb-1">Women's Premier League</h3>
                        <p className="text-sm text-purple-300 font-bold">WPL 2026</p>
                      </div>
                    </div>
                    <ArrowRight className="w-7 h-7 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                  </div>

                  <p className="text-gray-200 mb-8 leading-relaxed text-lg">
                    The pinnacle of women's T20 cricket. Power, passion, and excellence in every match.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{wplTeams.filter(t => !isPlaceholderTeam(t)).length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Teams</p>
                    </div>
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{wplMatches.length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Matches</p>
                    </div>
                    <div className="text-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-4xl font-black text-white mb-2">{wplLiveMatches.length}</p>
                      <p className="text-xs text-gray-300 uppercase tracking-wide font-semibold">Live</p>
                    </div>
                  </div>

                  {wplNextMatch && (
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Next Match</p>
                          <p className="text-sm font-semibold text-white">
                            {wplNextMatch.team1.shortName} vs {wplNextMatch.team2.shortName}
                          </p>
                        </div>
                        <CountdownTimer targetDate={wplNextMatch.date} matchTime={wplNextMatch.time} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-purple-300 font-bold text-lg">
                    <span>Explore WPL</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Matches Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-12"
            >
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Upcoming Matches</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white">
                  Featured <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Matches</span>
                </h2>
              </div>
              <Link
                href="/matches"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-white transition-all duration-300"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Combined Matches Grid */}
            {iplLoading || wplLoading ? (
              <MatchesSkeleton />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...iplMatches.slice(0, 3), ...wplMatches.slice(0, 3)]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 6)
                  .map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(match.league === 'wpl' ? '/wpl/matches' : '/matches')}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          match.league === 'ipl' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {match.league.toUpperCase()}
                        </span>
                        {match.status === 'live' && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                            <motion.div
                              className="w-2 h-2 bg-red-500 rounded-full"
                              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-xs font-bold text-red-400">LIVE</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-black text-white">{match.team1.shortName}</div>
                        <div className="text-gray-400 text-sm">VS</div>
                        <div className="text-2xl font-black text-white">{match.team2.shortName}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {match.time && match.date ? formatMatchTime(match.time, match.date) : 'TBD'}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Teams Showcase Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Featured Teams</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                Premier <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Teams</span>
              </h2>
              <p className="text-gray-400 text-lg">Meet the champions of both leagues</p>
            </motion.div>

            {/* IPL Teams */}
            {iplLoading ? (
              <TeamsSkeleton />
            ) : iplTeams.filter(t => !isPlaceholderTeam(t)).length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">IPL Teams</h3>
                  <Link
                    href="/teams"
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
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
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">WPL Teams</h3>
                  <Link
                    href="/wpl/teams"
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <ModernTeamsShowcase teams={wplTeams.filter(t => !isPlaceholderTeam(t)).slice(0, 5)} />
              </motion.div>
            ) : null}
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                League <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</span>
              </h2>
              <p className="text-gray-400 text-lg">Comprehensive insights from both premier leagues</p>
            </motion.div>
            <ModernStatsSection />
          </div>
        </section>

        {/* News Section */}
        {newsLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <section className="relative py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-between mb-12"
              >
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/30 backdrop-blur-sm">
                    <Flame className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Latest News</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white">
                    Breaking <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">News</span>
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-pink-400 transition-all duration-300"
                >
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <ModernNewsSection articles={news.slice(0, 6)} />
            </div>
          </section>
        ) : null}

        {/* Final CTA Section */}
        <section className="relative py-32 mt-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Join The Action</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                Ready to Experience
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Cricket Excellence?
                </span>
              </h2>
              
              <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
                Join millions of cricket fans following live scores, stats, and all the action from both premier leagues.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/live-score"
                  className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Play className="w-6 h-6" />
                    Watch Live Scores
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
                <Link
                  href="/matches"
                  className="group px-10 py-5 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    View All Matches
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
