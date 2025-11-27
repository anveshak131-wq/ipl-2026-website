"use client";

import { useEffect, useState } from "react";
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

      <main className="relative z-10">
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden">
          <ModernHeroSection />
        </section>

        {/* Divider */}
        <div className="relative my-12 md:my-20 mx-4 md:mx-auto max-w-7xl">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        </div>

        {/* Teams Section */}
        <section className="relative py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                <span className="gradient-text">Iconic Teams</span> of IPL 2026
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
                Explore all 10 teams competing in the Indian Premier League with their squads, stats, and more.
              </p>
            </div>
          </div>
          <ModernTeamsShowcase teams={teams} isLoading={isLoading} />
        </section>

        {/* Statistics Section */}
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
            <ModernStatsSection />
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
        <section className="relative py-16 md:py-24 mt-12 md:mt-20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Experience <span className="gradient-text">IPL 2026</span>?
            </h2>
            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Join millions of cricket fans following live scores, stats, and all the action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/live-score" className="btn-primary inline-block">
                Watch Live Scores
              </Link>
              <Link href="/teams" className="btn-secondary inline-block">
                Explore Teams
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
