'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Calendar, Clock, Flame, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WPLSeasonHeaderProps {
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
}

export default function WPLSeasonHeader({ selectedSeason, onSeasonChange }: WPLSeasonHeaderProps) {
  // Target: January 9, 2027 (WPL 2027 Confirmed Season Window Start)
  const targetDate = new Date('2027-01-09T19:30:00+05:30').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="space-y-4 mb-6">
      {/* Season Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-lg">
          <button
            type="button"
            onClick={() => onSeasonChange(2027)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              selectedSeason === 2027
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.3)]'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>2027 Season</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              Upcoming
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSeasonChange(2026)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              selectedSeason === 2026
                ? 'bg-white/20 text-white shadow-inner'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>2026 Archive</span>
          </button>
        </div>

        {/* Retentions Link */}
        <Link
          href="/wpl/teams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 transition-colors"
        >
          <span>View 2027 Squads & Retentions</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Season Banner */}
      {selectedSeason === 2027 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0d1222]/95 via-[#080b15]/95 to-[#0d1424]/95 p-5 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Locked Window • Jan 9 – Feb 5, 2027
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Road to WPL 2027 Kickoff
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-300 max-w-xl">
                A compact 28-day season window running January 9 through February 5, 2027. Franchise retention lists and auction movements will finalize the 2027 title race.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="grid grid-cols-4 gap-2 text-center shrink-0">
              {[
                { label: 'DAYS', val: timeLeft.days },
                { label: 'HRS', val: timeLeft.hours },
                { label: 'MIN', val: timeLeft.minutes },
                { label: 'SEC', val: timeLeft.seconds }
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 min-w-[58px]"
                >
                  <span className="block text-lg sm:text-2xl font-black text-white">
                    {String(val).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] font-bold tracking-widest text-amber-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-200">
              Viewing archived <strong>WPL 2026</strong> season data, final scorecards, and standings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSeasonChange(2027)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shrink-0"
          >
            Switch to 2027
          </button>
        </div>
      )}
    </div>
  );
}
