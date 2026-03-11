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
      {/* Upcoming Fixtures - Premium Design */}
      <div className="relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-3xl -z-10" />
        
        {/* Section Header */}
        <motion.div 
          className="mb-6 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with gradient background */}
              <motion.div
                className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar className="w-7 h-7 text-white drop-shadow-lg" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 opacity-50 blur-xl -z-10" />
              </motion.div>
              
              {/* Title with gradient */}
              <div>
                <h4 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                  Upcoming Fixtures
                </h4>
                <p className="text-sm text-gray-400 font-medium mt-1">Next matches on schedule</p>
              </div>
            </div>
            
            {/* Match count badge */}
            {upcomingMatches.length > 0 && (
              <motion.div
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: ['0 10px 30px rgba(59, 130, 246, 0.3)', '0 10px 40px rgba(99, 102, 241, 0.5)', '0 10px 30px rgba(59, 130, 246, 0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-white font-bold text-lg">{upcomingMatches.length}</span>
              </motion.div>
            )}
          </div>
          
          {/* Decorative line */}
          <motion.div 
            className="h-1 w-32 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mt-4 shadow-lg"
            animate={{ 
              width: ['128px', '160px', '128px'],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {upcomingMatches.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            </motion.div>
            <p className="text-xl font-bold text-gray-400">No upcoming fixtures scheduled</p>
            <p className="text-sm text-gray-500 mt-2">Check back soon for new matches</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map((match, index) => {
              const opponent = match.team1.id === team.id ? match.team2 : match.team1;
              const isHome = match.venue && team.homeGrounds?.some(ground => match.venue.includes(ground));

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="group relative"
                >
                  <Link href={`/matches#${match.id}`} className="block">
                    {/* Card with gradient border */}
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
                      
                      {/* Animated background on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-indigo-600/10 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Shimmer effect on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        style={{ skewX: '-20deg' }}
                      />
                      
                      <div className="relative z-10">
                        {/* Match header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {/* Teams */}
                            <div className="flex items-center gap-3 mb-3">
                              <motion.div 
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30"
                                whileHover={{ scale: 1.05 }}
                              >
                                <span className="font-black text-xl text-white tracking-tight">{team.shortName}</span>
                              </motion.div>
                              
                              <motion.div
                                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600"
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <span className="font-bold text-sm text-gray-300">VS</span>
                              </motion.div>
                              
                              <motion.div 
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30"
                                whileHover={{ scale: 1.05 }}
                              >
                                <span className="font-black text-xl text-white tracking-tight">{opponent.shortName}</span>
                              </motion.div>
                            </div>
                            
                            {/* Home badge */}
                            {isHome && (
                              <motion.div 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                              >
                                <MapPin className="w-3.5 h-3.5 text-white" />
                                <span className="text-xs font-bold text-white tracking-wide">HOME</span>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Arrow icon */}
                          <motion.div
                            className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30"
                            whileHover={{ x: 5, scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ArrowRight className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        </div>

                        {/* Match details */}
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-gray-200">
                              {new Date(match.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          
                          {match.venue && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 flex-1 min-w-0">
                              <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-300 truncate">{match.venue}</span>
                            </div>
                          )}
                        </div>

                        {/* Countdown timer */}
                        <div className="pt-4 border-t border-slate-700/50">
                          <CountdownTimer 
                            targetDate={match.date} 
                            matchTime={match.time}
                            variant="panel"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Finished Matches (compact horizontal cards) */}
      {completedMatches.length > 0 && (
        <div>
          <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
              <CustomEmoji type="checkmark" size={18} />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Finished Matches
            </span>
          </h4>

          <div className="-mx-4 px-4 overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {completedMatches.map((match, index) => {
                const opponent = match.team1.id === team.id ? match.team2 : match.team1;
                const isHome = match.venue && team.homeGrounds?.some(ground => match.venue.includes(ground));

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ translateY: -6 }}
                    className="min-w-[300px] max-w-xs bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/40 rounded-2xl p-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-800/50 text-slate-300">COMPLETED</div>
                        <div className="text-xs text-gray-400">{new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div className="text-xs text-gray-400">{isHome ? 'Home' : 'Away'}</div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {match.team1.logo ? (
                            <img src={match.team1.logo} alt={match.team1.shortName} className="w-10 h-10 rounded-md object-contain" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-slate-700" />
                          )}
                          <div>
                            <div className={`text-sm font-bold ${match.team1.id === team.id ? 'text-emerald-300' : 'text-gray-200'}`}>{match.team1.shortName || match.team1.name}</div>
                            <div className="text-xs text-gray-400">{match.team1Score || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-sm text-gray-300 font-bold">VS</div>

                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div>
                            <div className={`text-sm font-bold ${match.team2.id === team.id ? 'text-emerald-300' : 'text-gray-200'}`}>{match.team2.shortName || match.team2.name}</div>
                            <div className="text-xs text-gray-400">{match.team2Score || '—'}</div>
                          </div>
                          {match.team2.logo ? (
                            <img src={match.team2.logo} alt={match.team2.shortName} className="w-10 h-10 rounded-md object-contain" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-slate-700" />
                          )}
                        </div>
                      </div>
                    </div>

                    {match.result && (
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm">
                          <CustomEmoji type="trophy" size={14} />
                          <span className="font-semibold text-white truncate">{match.result}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-400 truncate">{match.venue}</div>
                      {onViewScorecard ? (
                        <button
                          onClick={() => onViewScorecard(match.id)}
                          className="px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                          Scorecard
                        </button>
                      ) : (
                        <a href={`/matches#${match.id}`} className="px-3 py-1.5 rounded-md bg-white/5 text-white text-sm font-semibold">Details</a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

