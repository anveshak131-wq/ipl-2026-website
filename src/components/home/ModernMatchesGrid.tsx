'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import AnimatedCard from '@/components/ui/AnimatedCard';
import type { Match } from '@/types';

interface ModernMatchesGridProps {
  matches: Match[];
  isLoading?: boolean;
}

export default function ModernMatchesGrid({ matches, isLoading = false }: ModernMatchesGridProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  useEffect(() => {
    const now = new Date();
    let filtered = matches;

    if (selectedFilter === 'upcoming') {
      filtered = matches.filter((m) => new Date(m.date) > now);
    } else if (selectedFilter === 'completed') {
      filtered = matches.filter((m) => m.status === 'completed');
    } else if (selectedFilter === 'live') {
      filtered = matches.filter((m) => m.status === 'live');
    }

    setFilteredMatches(filtered);
  }, [selectedFilter, matches]);

  const filters: Array<'all' | 'upcoming' | 'live' | 'completed'> = ['all', 'upcoming', 'live', 'completed'];

  return (
    <div className="space-y-8">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              selectedFilter === filter
                ? 'bg-gradient-to-r from-ipl-gold to-yellow-400 text-black shadow-lg shadow-ipl-gold/50'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Matches grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No matches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match, idx) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <AnimatedCard delay={idx} hover="lift" className="h-full p-6 cursor-pointer group">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      match.status === 'live'
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : match.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {match.status === 'live' ? '🔴 LIVE' : match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                  </span>
                </div>

                {/* Teams */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Team 1</p>
                      <p className="font-bold text-white group-hover:text-ipl-gold transition-colors">
                        {match.team1.shortName}
                      </p>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-xs text-gray-500">vs</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-400 mb-1">Team 2</p>
                      <p className="font-bold text-white group-hover:text-ipl-gold transition-colors">
                        {match.team2.shortName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-400 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-ipl-gold" />
                    <span>{match.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ipl-gold" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ipl-gold" />
                    <span>{match.time}</span>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-ipl-gold/0 to-ipl-gold/0 group-hover:from-ipl-gold/5 group-hover:to-ipl-gold/10 transition-all duration-300 pointer-events-none" />
              </AnimatedCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
