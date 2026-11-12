'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Clock,
  History,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { WPL_FRANCHISE_THEMES } from '@/lib/wpl/scorecardHelpers';
import WplStadiumTrigger from './WplStadiumTrigger';

interface WplScorecardStandbyBannerProps {
  archiveCount: number;
  onOpenArchive: () => void;
}

const WPL_2027_KICKOFF_MS = new Date('2027-01-14T19:30:00+05:30').getTime();

function computeTimeLeft(nowMs: number) {
  const diff = Math.max(0, WPL_2027_KICKOFF_MS - nowMs);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function WplScorecardStandbyBanner({
  archiveCount,
  onOpenArchive,
}: WplScorecardStandbyBannerProps) {
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(Date.now()));

  useEffect(() => {
    setTimeLeft(computeTimeLeft(Date.now()));
    const timer = setInterval(() => {
      setTimeLeft(computeTimeLeft(Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rcbTheme = WPL_FRANCHISE_THEMES['RCB-W'];
  const miTheme = WPL_FRANCHISE_THEMES['MI-W'];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-[#0B1228]/95 via-[#070C1B]/95 to-[#0D152C]/95 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl"
    >
      {/* Subtle Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-amber-500/12 blur-3xl"
      />

      <div className="relative z-10 space-y-8">
        {/* Top Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-black uppercase tracking-[0.16em]">
              <Clock className="w-3.5 h-3.5" />
              Season 5 • Pre-Tournament Standby
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              2027 Scorecards Auto-Publish on Matchday
            </span>
          </div>

          <span className="text-xs font-bold text-slate-400">
            Kickoff: <strong className="text-white">14/01/2027</strong> (7:30 PM IST)
          </span>
        </div>

        {/* Main Message & Countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              WPL 2027 Scorecards Go Live on Opening Night
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              The 2027 Women&apos;s Premier League season gets underway on{' '}
              <strong className="text-white">14 January 2027</strong> across{' '}
              <WplStadiumTrigger venue="Vadodara" showIcon={false} className="text-amber-300 font-bold">
                Vadodara
              </WplStadiumTrigger>{' '}
              and{' '}
              <WplStadiumTrigger venue="Mumbai - CCI" showIcon={false} className="text-sky-300 font-bold">
                Mumbai - CCI
              </WplStadiumTrigger>
              . Complete 2027 batting cards, bowling figures, fall of wickets, partnerships, and Player
              of the Match records will appear here automatically as fixtures are completed.
            </p>

            {/* Quick Season Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {[
                { label: 'Season Window', value: '14 Jan – 7 Feb' },
                { label: 'Total Fixtures', value: '22 Matches' },
                { label: 'Host Venues', value: 'Vadodara & Mumbai' },
                { label: 'Start Time', value: '7:30 PM IST' },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {spec.label}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-0.5">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Countdown + Opening Clash Preview */}
          <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-black uppercase tracking-[0.16em] text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Countdown to Match 1
              </span>
              <span className="text-slate-400 font-semibold">14 Jan 2027</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 text-center">
              {[
                { label: 'DAYS', val: timeLeft.days },
                { label: 'HRS', val: timeLeft.hours },
                { label: 'MIN', val: timeLeft.minutes },
                { label: 'SEC', val: timeLeft.seconds },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-[#0B1226] py-3 px-2"
                >
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {String(val).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-black tracking-widest text-amber-300 mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Season Opener Strip */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="text-sky-300 uppercase tracking-wider">Season Opener</span>
                <WplStadiumTrigger
                  venue="Vadodara"
                  iconClassName="w-3 h-3 text-emerald-300 shrink-0"
                  className="text-slate-300"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={rcbTheme.logo}
                    alt={rcbTheme.name}
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white">RCB-W</div>
                    <div className="text-[10px] text-slate-400 truncate">Reigning Champs</div>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-black tracking-widest text-slate-300">
                  VS
                </span>

                <div className="flex items-center gap-2 min-w-0 text-right">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white">MI-W</div>
                    <div className="text-[10px] text-slate-400 truncate">2x Champions</div>
                  </div>
                  <img
                    src={miTheme.logo}
                    alt={miTheme.name}
                    className="w-8 h-8 object-contain shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/wpl/matches"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              <span>View 2027 Fixtures</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/wpl/teams"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <Users className="w-4 h-4 text-sky-300" />
              <span>Explore WPL Squads</span>
            </Link>
          </div>

          {archiveCount > 0 && (
            <button
              type="button"
              onClick={onOpenArchive}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs sm:text-sm font-bold transition-colors"
            >
              <History className="w-4 h-4 text-amber-300" />
              <span>View 2026 Archive ({archiveCount} Scorecards)</span>
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
