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
                            className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text" 
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

