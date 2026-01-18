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
          <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CustomEmoji type="checkmark" size={22} />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Finished Matches
            </span>
          </h4>
          <div className="space-y-4">
            {completedMatches.map((match, index) => {
              const opponent = match.team1.id === team.id ? match.team2 : match.team1;
              const isHome = match.venue && team.homeGrounds?.some(ground => match.venue.includes(ground));

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 group shadow-xl hover:shadow-emerald-500/20"
                >
                  {/* Success gradient bar on left */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600"></div>
                  
                  <div className="p-6">
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Completed</span>
                        </div>
                        <div className="text-sm font-medium text-slate-400">
                          {new Date(match.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Score Display - Side by Side */}
                    <div className="mb-5 p-5 bg-slate-900/50 rounded-xl border border-slate-700/30">
                      <div className="grid grid-cols-3 gap-4 items-center">
                        {/* Team 1 */}
                        <div className="text-center">
                          <div className={`text-lg font-bold mb-2 ${match.team1.id === team.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {match.team1.shortName || match.team1.name}
                          </div>
                          <div className="text-3xl font-black text-white tracking-tight">
                            {match.team1Score || 'N/A'}
                          </div>
                        </div>
                        
                        {/* VS Divider */}
                        <div className="flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-400">VS</span>
                          </div>
                        </div>
                        
                        {/* Team 2 */}
                        <div className="text-center">
                          <div className={`text-lg font-bold mb-2 ${match.team2.id === team.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {match.team2.shortName || match.team2.name}
                          </div>
                          <div className="text-3xl font-black text-white tracking-tight">
                            {match.team2Score || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Result */}
                    {match.result && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-emerald-500/15 border border-emerald-500/30 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CustomEmoji type="trophy" size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Result</div>
                            <div className="text-base font-bold text-white leading-relaxed">
                              {match.result}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Venue */}
                    {match.venue && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 px-3 py-2 bg-slate-800/50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">{match.venue}</span>
                      </div>
                    )}

                    {/* View Scorecard Button */}
                    {onViewScorecard && (
                      <motion.button
                        onClick={() => onViewScorecard(match.id)}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative w-full py-3.5 px-6 rounded-2xl overflow-hidden group"
                      >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500 transition-all duration-500"></div>
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                        
                        {/* Button content */}
                        <div className="relative flex items-center justify-center gap-2.5">
                          {/* Icon container with rotation animation */}
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-6 h-6 flex items-center justify-center"
                          >
                            <svg 
                              className="w-6 h-6 text-white drop-shadow-lg" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2.5} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                              />
                            </svg>
                          </motion.div>
                          
                          {/* Text with letter spacing */}
                          <span className="text-base font-bold text-white tracking-wide drop-shadow-lg">
                            View Scorecard
                          </span>
                          
                          {/* Arrow with slide animation */}
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <svg 
                              className="w-5 h-5 text-white drop-shadow-lg" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2.5} 
                                d="M13 7l5 5m0 0l-5 5m5-5H6" 
                              />
                            </svg>
                          </motion.div>
                        </div>
                        
                        {/* Bottom glow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-blue-400/50 blur-lg group-hover:h-2 group-hover:bg-blue-300/70 transition-all duration-300"></div>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

