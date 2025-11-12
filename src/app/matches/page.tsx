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
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Match Schedule
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
            <p className="text-gray-300 text-lg">
              Complete IPL 2026 match schedule with live scores and fixtures
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-8">
            <div className="glass-effect rounded-lg p-1 inline-flex">
              {[
                { key: 'all', label: 'All Matches' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'live', label: 'Live' },
                { key: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white'
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
              <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-300 text-lg">
                  No {filter} matches found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try selecting a different filter
                </p>
              </div>
            </div>
          )}

          {/* TODO: Add pagination for more matches */}
          {filteredMatches.length > 0 && (
            <div className="text-center mt-12">
              <button className="ipl-button text-lg px-8 py-3">
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
