'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Radio, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Clock,
  MapPin,
  Trophy
} from 'lucide-react';
import StadiumNightCanvas from '@/components/wpl/StadiumNightCanvas';
import type { Match } from '@/types';

interface ModernMatchesGridProps {
  matches: Match[];
  isLoading?: boolean;
  selectedFilter?: 'all' | 'upcoming' | 'live' | 'completed';
}

export default function ModernMatchesGrid({
  matches = [],
  isLoading = false,
  selectedFilter: initialFilter = 'all',
}: ModernMatchesGridProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>(initialFilter);

  const upcomingCount = matches.filter(m => m.status === 'upcoming').length;
  const liveCount = matches.filter(m => m.status === 'live').length;
  const completedCount = matches.filter(m => m.status === 'completed').length;

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const filterTabs = [
    { id: 'all', label: 'All', count: matches.length, icon: Layers },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount, icon: Calendar },
    { id: 'live', label: 'Live Now', count: liveCount, icon: Radio },
    { id: 'completed', label: 'Completed', count: completedCount, icon: CheckCircle2 },
  ] as const;

  return (
    <div className="relative py-8">
      {/* Interactive Broadcast Filter Bar */}
      <div className="flex flex-col items-center mb-10">
        <div className="inline-flex p-1.5 rounded-2xl bg-[#090d1a]/80 border border-white/10 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2.5 ${
                  isSelected 
                    ? 'text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.45)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : tab.id === 'live' && liveCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3.5 text-xs text-slate-400/90 font-medium tracking-wide">
          Fixtures and start times synchronize automatically upon official league release.
        </p>
      </div>

      {/* Match Cards or Broadcast Empty Radar Stage */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-3xl border border-white/5 bg-[#090d18]/60 backdrop-blur-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Elevated Broadcast Empty State Radar HUD */
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0f20]/80 via-[#070b16]/90 to-[#04060d] p-10 sm:p-14 backdrop-blur-2xl overflow-hidden text-center shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)]">
          {/* Internal Stadium Spotlight Aura */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-amber-500/[0.06] blur-3xl pointer-events-none" />

          {/* Animated Stadium Radar Centerpiece */}
          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
            <div className="relative mb-6">
              {/* Radar concentric pulse rings */}
              <div className="absolute -inset-4 rounded-full border border-sky-400/20 animate-ping opacity-30" />
              <div className="absolute -inset-8 rounded-full border border-amber-400/15 animate-pulse opacity-20" />
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 p-4 flex items-center justify-center shadow-xl backdrop-blur-xl">
                <Clock className="w-8 h-8 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {filter === 'upcoming'
                ? 'No Upcoming Fixtures Right Now'
                : filter === 'live'
                ? 'No Live Match in Progress'
                : filter === 'completed'
                ? 'No Completed Matches Yet'
                : 'Official Schedule Awaiting Release'}
            </h3>

            <p className="mt-3 text-sm text-slate-300/80 leading-relaxed max-w-md">
              {filter === 'upcoming'
                ? 'New fixtures and toss timings will appear as soon as BCCI publishes the calendar.'
                : filter === 'live'
                ? 'When matchday play begins, real-time ball-by-ball telemetry will activate here.'
                : filter === 'completed'
                ? 'Archived scorecards and player milestones will populate once matches wrap.'
                : 'Official tournament fixtures and match schedules are scheduled for release ahead of the season window.'}
            </p>

            {matches.length > 0 && (
              <div className="mt-8">
                <Link
                  href="/wpl/matches"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-amber-400/50 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-amber-500/20"
                >
                  <span>View Full Schedule</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Real Matches Render Here */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match) => (
              <Link key={match.id} href={`/wpl/matches/${match.id}`} className="group">
                <div className="h-full p-6 rounded-3xl bg-[#090d1a]/80 border border-white/10 hover:border-amber-400/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>{match.date}</span>
                    <span className="font-bold text-amber-300 uppercase">{match.venue}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-white font-black text-lg">
                      <span>{match.team1?.name || 'Team 1'}</span>
                      <span className="text-amber-300 font-mono">{match.team1Score || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-white font-black text-lg">
                      <span>{match.team2?.name || 'Team 2'}</span>
                      <span className="text-amber-300 font-mono">{match.team2Score || '-'}</span>
                    </div>
                  </div>
                  {match.result && (
                    <div className="mt-4 pt-3 border-t border-white/5 text-xs font-semibold text-slate-300">
                      {match.result}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
