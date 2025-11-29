'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '../ui/LoadingSpinner';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { formatMatchTime } from '@/lib/timeUtils';

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
    <section className="relative py-20 section-match-bg">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ipl-gold/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ipl-purple/5 rounded-full blur-3xl -z-10" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-ipl-gold/10 px-4 py-2 rounded-full border border-ipl-gold/30 mb-4">
            <span className="w-2 h-2 bg-ipl-gold rounded-full" />
            <span className="text-sm font-semibold text-ipl-gold">Featured Matches</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Upcoming Fixtures
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience the most thrilling cricket matchups. Don't miss any action!
          </p>
        </div>

        {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {matches.map((match) => (
            <div
              key={match.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
              </div>

              <div className="relative p-6 md:p-8 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    match.status === 'upcoming' 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : match.status === 'live'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {match.status === 'upcoming' && <><CustomEmoji type="target" size={16} /> Upcoming</>}
                    {match.status === 'live' && '🔴 Live Now'}
                    {match.status === 'completed' && '✅ Finished'}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ipl-gold">
                      {new Date(match.date).getDate()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(match.date).toLocaleString('en-US', { month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-300">
                    <CustomEmoji type="calendar" size={14} /> {formatDate(match.date)}
                  </p>
                  <p className="text-lg font-bold text-white">
                    🕐 {formatMatchTime(match.time, match.date)}
                  </p>
                </div>

                {/* Match Card Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Teams */}
                <div className="space-y-4">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group/team hover:bg-white/10 transition-all">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{backgroundColor: match.team1.colors.primary}}>
                        {match.team1.shortName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{match.team1.shortName}</p>
                        <p className="text-xs text-gray-400 truncate">{match.team1.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center py-2">
                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                    <span className="px-4 font-bold text-ipl-gold text-sm">VS</span>
                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group/team hover:bg-white/10 transition-all">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{backgroundColor: match.team2.colors.primary}}>
                        {match.team2.shortName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{match.team2.shortName}</p>
                        <p className="text-xs text-gray-400 truncate">{match.team2.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-1">📍 Venue</p>
                  <p className="text-sm font-medium text-white line-clamp-2">
                    {match.venue}
                  </p>
                </div>

                {/* View Button - Premium Design */}
                <button className="group w-full mt-4 py-3.5 rounded-xl relative overflow-hidden font-bold text-sm uppercase tracking-wide transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
                    boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
                    border: '2px solid rgba(124, 58, 237, 0.5)',
                    color: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)';
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(124, 58, 237, 0.6), transparent)',
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    View Details
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No matches scheduled yet.</p>
          </div>
        )}

        {/* View All Button - Premium Design */}
        <div className="text-center mt-12">
          <a 
            href="/matches" 
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-xl relative overflow-hidden font-bold text-base transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
              boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              color: '#000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 165, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)';
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6), transparent)',
              }}
            />
            
            <span className="relative z-10 flex items-center gap-2 font-black tracking-tight">
              View Full Schedule
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
