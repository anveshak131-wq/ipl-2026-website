'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import ModernHeroSection from '@/components/home/ModernHeroSection';
import ModernTeamsShowcase from '@/components/home/ModernTeamsShowcase';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import ModernNewsSection from '@/components/home/ModernNewsSection';
import ModernStatsSection from '@/components/home/ModernStatsSection';
import ModernFeatureShowcase from '@/components/home/ModernFeatureShowcase';
import ScrollTriggeredStats from '@/components/home/ScrollTriggeredStats';
import ParallaxSection from '@/components/effects/ParallaxSection';
import ConfettiAnimation from '@/components/effects/ConfettiAnimation';
import FloatingBadge from '@/components/effects/FloatingBadge';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import BackToTop from '@/components/ui/BackToTop';
import QuickStatsWidget from '@/components/home/QuickStatsWidget';
import QuickFilters from '@/components/home/QuickFilters';
import TrendingNews from '@/components/home/TrendingNews';
import { TeamsSkeleton, MatchesSkeleton, NewsSkeleton, StatsSkeleton } from '@/components/home/HomePageSkeletons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';
import { Trophy } from 'lucide-react';

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
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  
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
  
  // Personalized content based on favorite teams
  const personalizedMatches = useMemo(() => {
    if (favoriteTeams.length === 0) return matches;
    return matches.filter(m => 
      favoriteTeams.includes(m.team1.id) || favoriteTeams.includes(m.team2.id)
    );
  }, [matches, favoriteTeams]);
  
  const personalizedNews = useMemo(() => {
    if (favoriteTeams.length === 0) return news;
    return news;
  }, [news, favoriteTeams]);

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

    // Load favorite teams from localStorage
    const savedFavorites = localStorage.getItem('favoriteTeams');
    if (savedFavorites) {
      try {
        setFavoriteTeams(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorite teams:', e);
      }
    }

    // Load data for IPL
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('Loading IPL data');
        const [teamsData, matchesData, newsData] = await Promise.all([
          api.getTeams('ipl'),
          api.getMatches('ipl'),
          api.getNews(),
        ]);
        
        // Filter news by league
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === 'ipl' || item.league === 'both'
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
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
        {/* Modern Hero Section with IPL Branding */}
        <section className="relative overflow-hidden">
          <ParallaxSection speed={0.5}>
            <div className="relative min-h-screen flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
              <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
              
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
                <AnimatedSection direction="down" delay={0.1}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                  >
                    <Trophy className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                      Indian Premier League
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-6 leading-tight"
                  >
                    IPL <GradientText gradient="from-blue-400 via-cyan-400 to-indigo-400" animate>2026</GradientText>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
                  >
                    The world's biggest T20 cricket league. Experience the thrill, passion, and glory of IPL 2026.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-4"
                  >
                    <Link
                      href="/teams"
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
                    >
                      Explore Teams
                    </Link>
                    <Link
                      href="/matches"
                      className="px-8 py-4 rounded-xl bg-white/10 text-white font-bold border border-blue-500/50 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
                    >
                      View Matches
                    </Link>
                    <Link
                      href="/live-score"
                      className="px-8 py-4 rounded-xl bg-white/10 text-white font-bold border border-cyan-500/50 hover:bg-cyan-500/20 transition-all duration-300 transform hover:scale-105"
                    >
                      Live Scores
                    </Link>
                  </motion.div>
                </AnimatedSection>
              </div>
            </div>
          </ParallaxSection>
        </section>
        
        {/* Quick Stats Widget */}
        {!isLoading && (
          <AnimatedSection direction="up" delay={0.5}>
            <QuickStatsWidget 
              matches={matches}
            />
          </AnimatedSection>
        )}

        {/* Teams Showcase */}
        {isLoading ? (
          <TeamsSkeleton />
        ) : teams.length > 0 ? (
          <AnimatedSection direction="up" delay={0.6}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  IPL <GradientText gradient="from-blue-400 to-cyan-400" animate>Teams</GradientText>
                </h2>
                <Link
                  href="/teams"
                  className="text-blue-400 hover:text-cyan-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernTeamsShowcase teams={teams.slice(0, 6)} />
            </div>
          </AnimatedSection>
        ) : null}

        {/* Matches Grid */}
        {isLoading ? (
          <MatchesSkeleton />
        ) : matches.length > 0 ? (
          <AnimatedSection direction="up" delay={0.7}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  Upcoming <GradientText gradient="from-cyan-400 to-blue-400" animate>Matches</GradientText>
                </h2>
                <Link
                  href="/matches"
                  className="text-cyan-400 hover:text-blue-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernMatchesGrid matches={matches.slice(0, 6)} />
            </div>
          </AnimatedSection>
        ) : null}

        {/* Stats Section */}
        {!isLoading && (
          <AnimatedSection direction="up" delay={0.8}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  League <GradientText gradient="from-blue-400 via-cyan-400 to-indigo-400" animate>Statistics</GradientText>
                </h2>
                <Link
                  href="/stats"
                  className="text-blue-400 hover:text-cyan-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernStatsSection />
            </div>
          </AnimatedSection>
        )}

        {/* News Section */}
        {isLoading ? (
          <NewsSkeleton />
        ) : news.length > 0 ? (
          <AnimatedSection direction="up" delay={0.9}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  Latest <GradientText gradient="from-indigo-400 to-blue-400" animate>News</GradientText>
                </h2>
                <Link
                  href="/news"
                  className="text-indigo-400 hover:text-blue-400 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>
              <ModernNewsSection news={news.slice(0, 6)} />
            </div>
          </AnimatedSection>
        ) : null}

        {/* Feature Showcase */}
        {!isLoading && (
          <AnimatedSection direction="up" delay={1.0}>
            <ModernFeatureShowcase />
          </AnimatedSection>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}

