'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesData = await api.getMatches();
        setMatches(matchesData.slice(0, 3)); // Show next 3 matches
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Upcoming Matches
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
          <p className="text-gray-300 text-lg">
            Don't miss the exciting clashes between your favorite teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="ipl-card hover:scale-105 transform transition-all duration-300"
            >
              <div className="text-center">
                {/* Match Status */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30">
                    {match.status === 'upcoming' && '📅 Upcoming'}
                    {match.status === 'live' && '🔴 LIVE'}
                    {match.status === 'completed' && '✅ Completed'}
                  </span>
                </div>

                {/* Date and Time */}
                <div className="mb-4">
                  <p className="text-white font-semibold">
                    {formatDate(match.date)}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {match.time} IST
                  </p>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {match.team1.shortName}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {match.team1.shortName}
                    </p>
                  </div>
                  
                  <div className="px-4">
                    <span className="text-gray-400 font-bold text-xl">VS</span>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {match.team2.shortName}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {match.team2.shortName}
                    </p>
                  </div>
                </div>

                {/* Venue */}
                <div className="text-sm text-gray-300 mb-4">
                  📍 {match.venue}
                </div>

                {/* Action Button */}
                <button className="w-full ipl-button text-sm py-2">
                  {match.status === 'upcoming' && 'Set Reminder'}
                  {match.status === 'live' && 'Watch Live'}
                  {match.status === 'completed' && 'View Highlights'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="ipl-button text-lg px-8 py-3">
            View Full Schedule
          </button>
        </div>
      </div>
    </section>
  );
}
