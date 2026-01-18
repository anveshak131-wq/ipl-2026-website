'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';
import CountdownTimer from '@/components/ui/CountdownTimer';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface UpcomingFixturesWidgetProps {
  team: Team;
  matches?: Match[];
  onViewScorecard?: (matchId: string) => void;
}

export default function UpcomingFixturesWidget({ team, matches: providedMatches, onViewScorecard }: UpcomingFixturesWidgetProps) {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(!providedMatches);

  useEffect(() => {
    if (providedMatches) {
      // Separate matches into upcoming and completed
      const upcoming = providedMatches
        .filter((m) => m.status === 'upcoming')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      
      const completed = providedMatches
        .filter((m) => m.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setUpcomingMatches(upcoming);
      setCompletedMatches(completed);
    } else {
      const fetchMatches = async () => {
        try {
          const allMatches = await api.getMatches();
          const teamMatches = allMatches.filter((m) => m.team1.id === team.id || m.team2.id === team.id);
          
          const upcoming = teamMatches
            .filter((m) => m.status === 'upcoming')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
          
          const completed = teamMatches
            .filter((m) => m.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          
          setUpcomingMatches(upcoming);
          setCompletedMatches(completed);
        } catch (error) {
          console.error('Error fetching matches:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMatches();
    }
  }, [team.id, providedMatches]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Fixtures */}
      <div>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Fixtures
        </h4>
        {upcomingMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming fixtures scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match, index) => {
              const opponent = match.team1.id === team.id ? match.team2 : match.team1;
              const isHome = match.venue && team.homeGrounds?.some(ground => match.venue.includes(ground));

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="relative p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 group"
                >
                  <Link href={`/matches#${match.id}`} className="block">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{team.shortName}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-bold text-white">{opponent.shortName}</span>
                          </div>
                          {isHome && (
                            <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              Home Match
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(match.date).toLocaleDateString()}</span>
                      </div>
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[150px]">{match.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                      <CountdownTimer targetDate={match.date} matchTime={match.time} className="text-xs" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Finished Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CustomEmoji type="checkmark" size={20} />
            Finished Matches
          </h4>
          <div className="space-y-3">
            {completedMatches.map((match, index) => {
              const opponent = match.team1.id === team.id ? match.team2 : match.team1;
              const isHome = match.venue && team.homeGrounds?.some(ground => match.venue.includes(ground));

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="relative p-4 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/10 backdrop-blur-md border border-green-500/30 hover:border-green-500/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CustomEmoji type="checkmark" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{team.shortName}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-bold text-white">{opponent.shortName}</span>
                        </div>
                        {match.result && (
                          <div className="text-xs text-green-400 mt-1 line-clamp-1">
                            {match.result}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(match.date).toLocaleDateString()}</span>
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{match.venue}</span>
                      </div>
                    )}
                  </div>

                  {onViewScorecard && (
                    <button
                      onClick={() => onViewScorecard(match.id)}
                      className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <span>📊</span>
                      View Scorecard
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

