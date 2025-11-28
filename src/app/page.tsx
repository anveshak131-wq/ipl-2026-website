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
import { useRouter } from "next/navigation";
import { api } from '@/lib/data';
import type { Team, Match, News } from '@/types';

export default function Home() {
  const router = useRouter();
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

    // Load data
    const loadData = async () => {
      try {
        const [teamsData, matchesData, newsData] = await Promise.all([
          api.getTeams(),
          api.getMatches(),
          api.getNews(),
        ]);
        setTeams(teamsData);
        setMatches(matchesData);
        setNews(newsData);

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
  }, []);

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
            <ModernHeroSection />
          </ParallaxSection>
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
                    Iconic Teams
                  </GradientText> of IPL 2026
                </h2>
                <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                  Explore all 10 teams competing in the Indian Premier League with their squads, stats, and more.
                </p>
              </motion.div>
            </div>
            <ModernTeamsShowcase teams={teams} isLoading={isLoading} />
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
            <ScrollTriggeredStats
              stats={[
                { label: 'Total Matches', value: '74', icon: 'cricket-bat', color: 'from-ipl-gold to-yellow-400' },
                { label: 'Teams', value: '10', icon: 'target', color: 'from-blue-500 to-cyan-500' },
                { label: 'Players', value: '500+', icon: 'people', color: 'from-purple-500 to-pink-500' },
                { label: 'Venues', value: '15', icon: 'venue', color: 'from-green-500 to-emerald-500' },
              ]}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Matches Section */}
        <section className="relative py-12 md:py-20 section-gradient rounded-3xl mx-4 md:mx-auto max-w-7xl my-12 md:my-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Upcoming <span className="gradient-text">Matches</span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                Don't miss the most exciting cricket action. Check out upcoming matches and live scores.
              </p>
            </div>
            <ModernMatchesGrid matches={matches} isLoading={isLoading} />
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
            <ModernNewsSection articles={news} isLoading={isLoading} />
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
    </div>
  );
}
