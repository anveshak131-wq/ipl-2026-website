'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      <Navbar />
      
      <main className="relative py-16 section-match-bg min-h-screen">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ipl-purple/10 rounded-full blur-3xl -z-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
                🏏 MATCH SCHEDULE
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              IPL 2026 <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Fixtures</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Live scores, upcoming matches, and detailed fixtures for the entire IPL 2026 season
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-start mb-12 overflow-x-auto">
            <div className="inline-flex space-x-2 p-1 rounded-xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/10">
              {[
                { key: 'all', label: '📊 All Matches' },
                { key: 'upcoming', label: '⏰ Upcoming' },
                { key: 'live', label: '🔴 Live' },
                { key: 'completed', label: '✅ Completed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white shadow-lg shadow-ipl-purple/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
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
