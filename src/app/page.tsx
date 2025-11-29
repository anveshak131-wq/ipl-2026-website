"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Team, Match, News } from '@/types';
import { useMemo } from 'react';

export default function Home() {
  const router = useRouter();
  const { currentLeague } = useLeague();
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
    // Filter news related to favorite teams (simplified - would need team info in news)
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
      // Show modal on first visit
      setShowTermsModal(true);
    } else if (acceptedVersion !== "1.1") {
      // Show modal if version has been updated
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

    // Load data based on current league
    const loadData = async () => {
      try {
        const [teamsData, matchesData, newsData] = await Promise.all([
          api.getTeams(currentLeague),
          api.getMatches(currentLeague),
          api.getNews(),
        ]);
        
        // Filter news by league (news can be 'ipl', 'wpl', or 'both')
        const filteredNews = newsData.filter(item => 
          !item.league || item.league === currentLeague || item.league === 'both'
        );
        
        setTeams(teamsData);
        setMatches(matchesData);
        setNews(filteredNews);

        // Check if there's a live match
        const liveMatch = matchesData.some((match) => match.status === 'live');
        if (liveMatch) {
          setHasLiveMatch(true);
          setShowConfetti(true);
          // Auto-hide confetti after 3 seconds
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentLeague]); // Re-fetch when league changes

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    // Redirect to intended route if there is one
    const redirectPath = sessionStorage.getItem("terms_redirect_after");
    if (redirectPath && redirectPath !== "/") {
      sessionStorage.removeItem("terms_redirect_after");
      router.push(redirectPath);
    }
  };

  const handleDeclineTerms = () => {
    // User declined, don't show modal again but they can't access other pages
    setShowTermsModal(false);
  };

  // Only render modal after hydration
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

      {/* Confetti Animation - triggers on live match */}
      <ConfettiAnimation trigger={showConfetti} duration={3000} particleCount={50} />

      {/* Floating Badge - shows when there's a live match */}
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
        {/* Modern Hero Section with Parallax */}
        <section className="relative overflow-hidden">
          <ParallaxSection speed={0.5}>
            <ModernHeroSection 
              nextMatch={nextMatch}
              liveMatchCount={liveMatchCount}
            />
          </ParallaxSection>
        </section>
        
        {/* Quick Stats Widget */}
        <section className="relative py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <QuickStatsWidget matches={matches} isLoading={isLoading} />
          </div>
        </section>
        
        {/* Quick Filters */}
        <section className="relative py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <QuickFilters matches={matches} />
          </div>
        </section>

        {/* Divider */}
        <div className="relative my-12 md:my-20 mx-4 md:mx-auto max-w-7xl">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        </div>

        {/* Teams Section */}
        <AnimatedSection direction="up" delay={0.2}>
          <section className="relative py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                  <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>
                    {favoriteTeams.length > 0 ? 'Your Favorite Teams' : 'Iconic Teams'}
                  </GradientText> of IPL 2026
                </h2>
                <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                  {favoriteTeams.length > 0 
                    ? 'Your favorite teams and all others competing in the Indian Premier League.'
                    : 'Explore all 10 teams competing in the Indian Premier League with their squads, stats, and more.'
                  }
                </p>
              </motion.div>
            </div>
            {isLoading ? (
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                <TeamsSkeleton />
              </div>
            ) : (
              <ModernTeamsShowcase teams={teams} isLoading={false} />
            )}
          </section>
        </AnimatedSection>

        {/* Statistics Section with Scroll Trigger */}
        <section className="relative py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                <span className="gradient-text">Key Statistics</span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                Discover the numbers behind IPL 2026.
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {isLoading ? (
              <StatsSkeleton />
            ) : (
              <ScrollTriggeredStats
                stats={[
                  { label: 'Total Matches', value: '74', icon: 'cricket-bat', color: 'from-ipl-gold to-yellow-400' },
                  { label: 'Teams', value: '10', icon: 'target', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Players', value: '500+', icon: 'people', color: 'from-purple-500 to-pink-500' },
                  { label: 'Venues', value: '15', icon: 'venue', color: 'from-green-500 to-emerald-500' },
                ]}
                isLoading={false}
              />
            )}
          </div>
        </section>

        {/* Matches Section */}
        <section className="relative py-12 md:py-20 section-gradient rounded-3xl mx-4 md:mx-auto max-w-7xl my-12 md:my-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                {favoriteTeams.length > 0 ? 'Your ' : ''}Upcoming <span className="gradient-text">Matches</span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                {favoriteTeams.length > 0 
                  ? 'Matches featuring your favorite teams and more exciting cricket action.'
                  : "Don't miss the most exciting cricket action. Check out upcoming matches and live scores."
                }
              </p>
            </div>
            {isLoading ? (
              <MatchesSkeleton />
            ) : (
              <ModernMatchesGrid matches={favoriteTeams.length > 0 ? personalizedMatches : matches} isLoading={false} />
            )}
          </div>
        </section>
        
        {/* Trending News Section */}
        <section className="relative py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <TrendingNews articles={news} isLoading={isLoading} />
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <ModernFeatureShowcase />
          </div>
        </section>

        {/* News Section */}
        <section className="relative py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Latest <span className="gradient-text">News</span> & Updates
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                Stay updated with the latest news, highlights, and stories from the IPL.
              </p>
            </div>
            {isLoading ? (
              <NewsSkeleton />
            ) : (
              <ModernNewsSection articles={personalizedNews} isLoading={false} />
            )}
          </div>
        </section>

        {/* CTA Section */}
        <AnimatedSection direction="up" delay={0.3}>
          <section className="relative py-16 md:py-24 mt-12 md:mt-20">
            <motion.div 
              className="max-w-4xl mx-auto px-4 md:px-6 text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <motion.h2 
                className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Ready to Experience <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>IPL 2026</GradientText>?
              </motion.h2>
              <motion.p 
                className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Join millions of cricket fans following live scores, stats, and all the action.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/live-score" className="btn-primary inline-block">
                    Watch Live Scores
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/teams" className="btn-secondary inline-block">
                    Explore Teams
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </section>
        </AnimatedSection>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
