'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import ModernHeroSection from '@/components/home/ModernHeroSection';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import BackToTop from '@/components/ui/BackToTop';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match } from '@/types';
import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

export default function WPLHomePage() {
  const router = useRouter();
  const { currentLeague, setCurrentLeague } = useLeague();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl'),
        ]);
        setTeams(teamsData);
        setMatches(matchesData);
      } catch (error) {
        console.error('Failed to fetch WPL data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const liveMatchCount = useMemo(() => matches.filter(m => m.status === 'live').length, [matches]);
  const nextMatch = useMemo(() => {
    const upcoming = matches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [matches]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950">
      <Navbar />
      <AuroraBackground />

      <main className="relative">
        {/* Hero Section with WPL Branding */}
        <AnimatedSection direction="down" delay={0.1}>
          <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                  Women's Premier League
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-white mb-6"
              >
                Welcome to <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>WPL 2026</GradientText>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
              >
                Experience the pinnacle of women's T20 cricket. Follow your favorite teams, 
                track live scores, and stay updated with the latest news and statistics.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link
                  href="/wpl/teams"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Explore Teams
                </Link>
                <Link
                  href="/wpl/matches"
                  className="px-8 py-4 rounded-xl bg-white/10 text-white font-bold border border-purple-500/50 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  View Matches
                </Link>
                <Link
                  href="/wpl/stats"
                  className="px-8 py-4 rounded-xl bg-white/10 text-white font-bold border border-pink-500/50 hover:bg-pink-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  Statistics
                </Link>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Quick Stats */}
        {!isLoading && (
          <AnimatedSection direction="up" delay={0.5}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 px-6 py-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold mb-1">Teams</p>
                  <p className="text-3xl font-black text-white">{teams.length}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 px-6 py-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-pink-300 font-semibold mb-1">Matches</p>
                  <p className="text-3xl font-black text-white">{matches.length}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 px-6 py-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-rose-300 font-semibold mb-1">Live</p>
                  <p className="text-3xl font-black text-white">{liveMatchCount}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 px-6 py-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold mb-1">Next Match</p>
                  <p className="text-lg font-bold text-white">{nextMatch ? 'Soon' : 'TBA'}</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Teams Showcase */}
        {!isLoading && teams.length > 0 && (
          <AnimatedSection direction="up" delay={0.6}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  WPL <GradientText gradient="from-purple-400 to-pink-400" animate>Teams</GradientText>
                </h2>
                <Link
                  href="/wpl/teams"
                  className="text-purple-400 hover:text-pink-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernTeamsShowcase teams={teams.slice(0, 6)} />
            </div>
          </AnimatedSection>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (
          <AnimatedSection direction="up" delay={0.7}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  Upcoming <GradientText gradient="from-pink-400 to-rose-400" animate>Matches</GradientText>
                </h2>
                <Link
                  href="/wpl/matches"
                  className="text-pink-400 hover:text-rose-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernMatchesGrid matches={matches.slice(0, 6)} />
            </div>
          </AnimatedSection>
        )}

        {/* Stats Section */}
        {!isLoading && (
          <AnimatedSection direction="up" delay={0.8}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  League <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>Statistics</GradientText>
                </h2>
                <Link
                  href="/wpl/stats"
                  className="text-purple-400 hover:text-pink-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernStatsSection />
            </div>
          </AnimatedSection>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}

