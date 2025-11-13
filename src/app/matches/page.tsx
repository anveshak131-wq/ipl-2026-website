'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesData = await api.getMatches();
        setMatches(matchesData);
        setFilteredMatches(matchesData);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.status === filter));
    }
  }, [filter, matches]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Navbar />
      
      <main className="relative py-16 min-h-screen">
        {/* Floating orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-ipl-blue-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-ipl-gold/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-ipl-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                <Icon name="cricket" size={16} /> MATCH SCHEDULE
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight hover:scale-[1.02] transition-transform duration-300">
              IPL 2026 <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Fixtures</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
              Live scores, upcoming matches, and detailed fixtures for the entire IPL 2026 season
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-start mb-12 overflow-x-auto animate-fade-in">
            <div className="inline-flex space-x-2 p-1 rounded-xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
              {[
                { key: 'all', label: 'All Matches', icon: 'stats' as const },
                { key: 'upcoming', label: 'Upcoming', icon: 'target' as const },
                { key: 'live', label: 'Live', icon: 'cricket' as const },
                { key: 'completed', label: 'Completed', icon: 'trophy' as const }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 hover:scale-105 ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-lg shadow-ipl-purple/30 scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matches Grid */}
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-300 text-lg font-semibold">
                  No {filter} matches found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try selecting a different filter
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredMatches.length > 0 && (
            <div className="text-center mt-12">
              <button onClick={() => alert('Loading more matches...')} className="bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
                Load More Matches
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
