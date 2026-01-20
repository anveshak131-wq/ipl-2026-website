"use client";

import { motion } from 'framer-motion';
import { Match } from '@/types';
"use client";

import { motion } from 'framer-motion';
import { Match } from '@/types';
import { getMatchResult } from '@/lib/matchUtils';

interface FormGuideProps {
  matches: Match[];
  teamId: string;
  primaryColor?: string;
}

export default function FormGuide({ matches, teamId }: FormGuideProps) {
  const recentMatches = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .reverse();

  if (recentMatches.length === 0) return null;

  const wins = recentMatches.filter((m) => getMatchResult(m, teamId) === 'win').length;
  const winPercentage = (wins / recentMatches.length) * 100;

  const calculateStreak = () => {
    const all = matches
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (all.length === 0) return { type: 'none', count: 0 } as const;
    const first = getMatchResult(all[0], teamId);
    if (first === 'nr' || first === 'unknown') return { type: 'none', count: 0 } as const;
    let streak = 1;
    for (let i = 1; i < all.length; i++) {
      const r = getMatchResult(all[i], teamId);
      if (r === first) streak++; else break;
    }
    return { type: first, count: streak } as const;
  };

  const streak = calculateStreak();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-300 font-semibold">Form</div>
              <div className="text-xs text-gray-400">Last {recentMatches.length} matches</div>
            </div>
            <div className="text-xs text-gray-400">{recentMatches.length}</div>
          </div>

          <div className="flex items-center gap-3">
            {recentMatches.map((match) => {
              const result = getMatchResult(match, teamId);
              const opponent = match.team1.id === teamId ? match.team2 : match.team1;
              return (
                <div key={match.id} className="relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      result === 'win' ? 'bg-green-500 text-white' : result === 'loss' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                    }`}
                    title={`${new Date(match.date).toLocaleDateString()} • vs ${opponent.shortName}`}
                    style={{ boxShadow: result === 'win' ? '0 6px 18px rgba(16,185,129,0.18)' : result === 'loss' ? '0 6px 18px rgba(239,68,68,0.18)' : '0 6px 18px rgba(107,114,128,0.12)'}}
                  >
                    {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'NR'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/10 flex items-center gap-4">
          <div className="w-20 h-20 flex items-center justify-center relative">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-700" d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" fill="none" strokeWidth="2.8" stroke="currentColor" opacity="0.12" />
              <path
                d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831"
                fill="none"
                strokeWidth="2.8"
                strokeLinecap="round"
                stroke="url(#gradWin)"
                strokeDasharray={`${Math.min(Math.max(winPercentage, 0), 100)} 100`} 
              />
              <defs>
                <linearGradient id="gradWin" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-sm font-black text-white">{Math.round(winPercentage)}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-300 font-semibold">Season Win Rate</div>
            <div className="text-xs text-gray-400 mt-1">Based on last {recentMatches.length} completed matches</div>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-gray-300 font-semibold">Streak</div>
              <div className="text-xs text-gray-400">Current run</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${streak.type === 'win' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : streak.type === 'loss' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-700/10 text-gray-300 border border-white/5'}`}>
              {streak.type === 'win' ? 'Winning' : streak.type === 'loss' ? 'Losing' : '—'}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black ${streak.type === 'win' ? 'bg-green-400 text-white shadow-lg' : streak.type === 'loss' ? 'bg-red-400 text-white shadow-lg' : 'bg-gray-600 text-white'}`}>
              {streak.count}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{streak.count} match{streak.count !== 1 ? 'es' : ''}</div>
              <div className="text-xs text-gray-400">{streak.type === 'win' ? 'Current win streak' : streak.type === 'loss' ? 'Current loss streak' : 'No streak'}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
