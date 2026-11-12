'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Newspaper,
  Radio,
  ShieldCheck,
  Table2,
  Trophy,
  Users,
} from 'lucide-react';
import type { League, Match } from '@/types';
import {
  formatISTTodayLabel,
  getCountdownSegments,
  getMatchStartDate,
} from '@/lib/matchDay';

interface LiveScoreStandbyViewProps {
  league: League;
  nextUpcomingMatch: Match | null;
  totalSeasonFixtures: number;
}

const IPL_2027_MILESTONES = [
  {
    label: 'IPL 2027 Retention Lock',
    sublabel: '₹157 Cr Purse Ceiling • BCCI Submission Window',
    dateLabel: '17 Nov 2026',
    iso: '2026-11-17T11:30:00.000Z',
    location: 'Mumbai • BCCI',
  },
  {
    label: 'IPL 2027 Goa Mini-Auction',
    sublabel: 'Final Cycle Mini-Auction Before 2028 Mega-Reset',
    dateLabel: '16 Dec 2026',
    iso: '2026-12-16T09:00:00.000Z',
    location: 'ITC Grand Goa',
  },
  {
    label: 'IPL 2027 Season Opener',
    sublabel: 'Tentative Championship Window (Mar 10 – May 15, 2027)',
    dateLabel: '10 Mar 2027',
    iso: '2027-03-10T14:00:00.000Z',
    location: 'India Venues (Tentative)',
  },
];

export default function LiveScoreStandbyView({
  league,
  nextUpcomingMatch,
  totalSeasonFixtures,
}: LiveScoreStandbyViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const isWpl = league === 'wpl';
  const todayLabel = nowMs ? formatISTTodayLabel(nowMs) : 'IST Schedule Check';

  const activeIplMilestone =
    IPL_2027_MILESTONES.find((m) => !nowMs || Date.parse(m.iso) > nowMs) ||
    IPL_2027_MILESTONES[IPL_2027_MILESTONES.length - 1];

  const targetIso = isWpl
    ? nextUpcomingMatch
      ? (getMatchStartDate(nextUpcomingMatch)?.toISOString() ?? '2027-01-14T14:00:00.000Z')
      : '2027-01-14T14:00:00.000Z'
    : activeIplMilestone.iso;

  const countdown = getCountdownSegments(targetIso, nowMs);

  const nextMatchDateText =
    isWpl && nextUpcomingMatch
      ? new Intl.DateTimeFormat('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        }).format(getMatchStartDate(nextUpcomingMatch) || new Date('2027-01-14T14:00:00.000Z')) + ' IST'
      : isWpl
      ? '14 Jan 2027 • 7:30 PM IST'
      : activeIplMilestone.dateLabel;

  const scheduleHref = isWpl ? '/wpl/matches' : '/matches';
  const teamsHref = isWpl ? '/wpl/teams' : '/teams';
  const pointsHref = isWpl ? '/wpl/points-table' : '/ipl/points-table';
  const newsHref = `/news?league=${league}`;

  const accentBorder = isWpl ? 'border-indigo-400/30' : 'border-cyan-400/30';
  const accentGlow = isWpl
    ? 'bg-gradient-to-br from-indigo-500/15 via-slate-950/85 to-violet-900/20'
    : 'bg-gradient-to-br from-blue-600/15 via-slate-950/85 to-amber-500/10';

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Main Standby Panel */}
      <div
        className={`relative overflow-hidden rounded-3xl border ${accentBorder} ${accentGlow} p-6 sm:p-10 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.45)]`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-28 right-0 h-72 w-72 rounded-full blur-3xl ${
            isWpl ? 'bg-indigo-500/15' : 'bg-cyan-500/15'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          {/* Today Date + Standby Status Strip */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black uppercase tracking-wider ${
                isWpl
                  ? 'border-indigo-400/35 bg-indigo-500/15 text-indigo-200'
                  : 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              No Match Today • Matchday Standby
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-slate-300">
              <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
              {todayLabel} (IST)
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {isWpl
                ? 'WPL Live Scoring Activates on Match Day'
                : 'No Live IPL Fixtures Today'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {isWpl
                ? 'No WPL match is scheduled today. Matchday scorecards, live batting & bowling strips, commentary, and chase telemetry remain hidden until opening matchday on January 14, 2027.'
                : 'IPL matchday scoreboards and ball-by-ball feeds appear only when fixtures are live or scheduled today. Track IPL 2027 retentions, trades, and Goa mini-auction coverage in the meantime.'}
            </p>
          </div>

          {/* Ticking Countdown Strip */}
          <div className="w-full rounded-2xl border border-white/15 bg-slate-950/75 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-black uppercase tracking-[0.18em] text-amber-300">
                {isWpl ? 'Countdown to Next Matchday' : activeIplMilestone.label}
              </span>
              <span className="font-semibold text-slate-300 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {nextMatchDateText}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Mins', value: countdown.minutes },
                { label: 'Secs', value: countdown.seconds },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className="rounded-xl border border-white/10 bg-white/[0.04] py-3 px-2 text-center"
                >
                  <div className="text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
                    {slot.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                    {slot.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {isWpl
                  ? nextUpcomingMatch?.venue || 'Vadodara & Brabourne Stadium, Mumbai'
                  : activeIplMilestone.location}
              </span>
              {!isWpl && (
                <span>• {activeIplMilestone.sublabel}</span>
              )}
              {isWpl && totalSeasonFixtures > 0 && (
                <span>• {totalSeasonFixtures} Season 5 fixtures queued for Jan 14 – Feb 7, 2027</span>
              )}
            </div>
          </div>

          {/* Key Info Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isWpl ? 'text-indigo-300' : 'text-amber-300'
                }`}
              >
                {isWpl ? 'Season 5 Window' : 'Key Dates'}
              </span>
              <span className="text-sm font-black text-white mt-1 block">
                {isWpl ? 'Jan 14 – Feb 7, 2027' : 'Nov 17 Retentions • Dec 16 Auction'}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {isWpl ? 'All 22 fixtures at 7:30 PM IST' : 'Goa Mini-Auction before Mar–May window'}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 block">
                Live Activation Rule
              </span>
              <span className="text-sm font-black text-white mt-1 block">
                Matchday Automatic Unlock
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Scoreboard &amp; commentary appear only on scheduled match days
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                Reigning Holders
              </span>
              <span className="text-sm font-black text-white mt-1 block flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {isWpl ? 'RCB-W (2-Time Champions)' : 'RCB (Back-to-Back Champions)'}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {isWpl ? 'Openers vs MI-W on Jan 14' : 'Aiming for historic three-peat in 2027'}
              </span>
            </div>
          </div>

          {/* Exploration CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={scheduleHref}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg ${
                isWpl
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>{isWpl ? 'WPL 2027 Schedule' : 'Match Archive & Fixtures'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={teamsHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all"
            >
              <Users className="w-4 h-4" />
              <span>2027 Squads</span>
            </Link>

            <Link
              href={pointsHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all"
            >
              <Table2 className="w-4 h-4" />
              <span>Points Table</span>
            </Link>

            <Link
              href={newsHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all"
            >
              <Newspaper className="w-4 h-4" />
              <span>2027 News Hub</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              No stale or future pre-match placeholder scores are displayed before matchday.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
