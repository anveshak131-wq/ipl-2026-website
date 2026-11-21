'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Trophy,
  Shield,
  ArrowRight,
  History,
  CheckCircle2,
  AlertCircle,
  Download,
  Flame,
  Radio,
  Zap,
} from 'lucide-react';
import { Team } from '@/types';
import MatchTeamCrest from './MatchTeamCrest';

interface Ipl2027SeasonStandbyProps {
  teams: Team[];
  onViewArchive: () => void;
  onDownloadKeyDates: () => void;
}

// Official Projected Opening Match: Sunday, 14 March 2027 at 19:30 IST
const IPL_2027_KICKOFF_MS = new Date('2027-03-14T19:30:00+05:30').getTime();
// Pre-season reference start: Nov 17, 2026 retention cutoff
const RETENTION_CUTOFF_MS = new Date('2026-11-17T17:00:00+05:30').getTime();

function computeCountdown(nowMs: number) {
  const diff = Math.max(0, IPL_2027_KICKOFF_MS - nowMs);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isStarted: diff <= 0,
  };
}

export default function Ipl2027SeasonStandby({
  teams,
  onViewArchive,
  onDownloadKeyDates,
}: Ipl2027SeasonStandbyProps) {
  const [countdown, setCountdown] = useState(() => computeCountdown(Date.now()));

  useEffect(() => {
    setCountdown(computeCountdown(Date.now()));
    const timer = setInterval(() => {
      setCountdown(computeCountdown(Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = useMemo(() => {
    const totalSpan = IPL_2027_KICKOFF_MS - RETENTION_CUTOFF_MS;
    const elapsed = Date.now() - RETENTION_CUTOFF_MS;
    const pct = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
    return Math.round(pct);
  }, []);

  // RCB Team Object for Opening Match Arena
  const rcbTeam: Team = useMemo(() => {
    const found = teams.find(
      (t) =>
        t.shortName?.toUpperCase() === 'RCB' ||
        String(t.id) === '1' ||
        t.name?.toLowerCase().includes('royal challengers')
    );
    if (found) return found;
    return {
      id: '1',
      name: 'Royal Challengers Bengaluru',
      shortName: 'RCB',
      logo: '/logos/rcb_logo_premium.svg',
      colors: { primary: '#EC1C24', secondary: '#000000' },
      players: [],
      trophies: [],
      homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru'],
    };
  }, [teams]);

  const milestoneRoadmap = [
    {
      phase: '01',
      date: '17 Nov 2026',
      title: 'Player Retentions Locked',
      detail: '184 players locked in across 10 franchises committing ₹1,002.05 Cr; 66 vacancies left open.',
      status: 'completed',
    },
    {
      phase: '02',
      date: '16 Dec 2026',
      title: 'Player Mini-Auction (Goa)',
      detail: '11:00 AM IST @ ITC Grand Goa. Franchises battle with aggregate ₹297.95 Cr purse for 66 slots.',
      status: 'active',
    },
    {
      phase: '03',
      date: 'Late Jan 2027',
      title: 'Official 74-Match Schedule',
      detail: 'BCCI and IPL Governing Council announce full fixture schedule, dates, double-headers & venues.',
      status: 'upcoming',
    },
    {
      phase: '04',
      date: '14 Mar 2027',
      title: 'Grand Tournament Kickoff',
      detail: 'Reigning champions Royal Challengers Bengaluru host the tournament opener @ Chinnaswamy Stadium.',
      status: 'target',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ── HERO BANNER: STADIUM ATMOSPHERIC SHOWCASE ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[32px] border border-blue-500/25 bg-gradient-to-br from-[#060B1E]/95 via-[#0A122E]/90 to-[#0F1C45]/95 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(2,6,23,0.65)]"
      >
        {/* Dynamic Light Sweeps & Beacons */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[320px] bg-blue-500/[0.12] blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[320px] bg-indigo-500/[0.12] blur-[150px] pointer-events-none rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 space-y-8">
          {/* Badge & Headline */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/35 text-blue-200 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>IPL 2027 • 20th Historic Edition • Official Match Centre</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                IPL 2027 Match Schedule{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-violet-300">
                  Coming Soon
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                The Board of Control for Cricket in India (BCCI) and the IPL Governing Council will unveil the complete 74-match schedule following the Goa Mini-Auction. Track live pre-season milestones and countdown to matchday 1 below.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="shrink-0 p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl space-y-1.5 shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                Official Season Window (Expected)
              </span>
              <span className="text-xl font-black text-amber-300 block tracking-tight">
                14 March – 16 May 2027
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase">
                  74 Matches
                </span>
                <span>12 Host Stadiums • 10 Franchises</span>
              </div>
            </div>
          </div>

          {/* ── LIVE DIGITAL COUNTDOWN ── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-2xl space-y-6 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  Live Countdown to IPL 2027 Opening Match
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kickoff: Sunday, 14 March 2027 • 19:30 IST</span>
              </div>
            </div>

            {/* Countdown Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Days', value: countdown.days, color: '#38bdf8' },
                { label: 'Hours', value: countdown.hours, color: '#818cf8' },
                { label: 'Minutes', value: countdown.minutes, color: '#a78bfa' },
                { label: 'Seconds', value: countdown.seconds, color: '#fbbf24' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/12 text-center shadow-lg hover:border-indigo-400/40 transition-all duration-300"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{ background: item.color }}
                  />
                  <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-white tabular-nums tracking-tight">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="block text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-300 mt-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Pre-Season Progress Meter */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Pre-Season Phase: Retentions Locked & Purser Finalized
                </span>
                <span className="text-indigo-300 font-black">{progressPercent}% to Kickoff</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onDownloadKeyDates}
              type="button"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Add 2027 Key Dates to Calendar (.ics)</span>
            </button>

            <button
              onClick={onViewArchive}
              type="button"
              className="px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <History className="w-4 h-4 text-indigo-300" />
              <span>Browse 2026 Season Archive (74 Matches)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── PROJECTED OPENING MATCH ARENA: REIGNING CHAMPIONS RCB ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-[32px] border border-red-500/30 bg-gradient-to-br from-[#120407]/95 via-[#0A0713]/95 to-[#06091A]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl"
      >
        {/* Ambient Crimson & Gold Stadium Light */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/[0.12] blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/[0.08] blur-[100px] pointer-events-none rounded-full" />

        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500/25 to-amber-500/25 border border-red-500/40 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Match 01 • Tournament Opener</span>
            </div>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-xs text-slate-300 font-medium">
              IPL Tradition: Defending Champions host the opening battle
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-amber-300/90 font-bold">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>M. Chinnaswamy Stadium, Bengaluru</span>
          </div>
        </div>

        {/* ── DUEL CLASH ARENA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center p-6 sm:p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl">
          {/* LEFT: DEFENDING CHAMPIONS RCB */}
          <div className="flex items-center gap-5">
            {/* Guaranteed Pristine Team Crest (NEVER BROKEN) */}
            <MatchTeamCrest
              team={rcbTeam}
              size={76}
              glow={true}
              priority={true}
              className="border-2 border-red-500/40 shadow-[0_0_30px_rgba(220,38,38,0.35)]"
            />

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-600/30 text-red-200 border border-red-500/40 tracking-wider">
                  RCB • Hosts
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 tracking-wider">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Champions
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                Royal Challengers Bengaluru
              </h2>

              <p className="text-xs text-amber-300/80 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Defending IPL Titleholders • 2026 Reigning Crown
              </p>
            </div>
          </div>

          {/* CENTER: VS BEAM & TELEMETRY */}
          <div className="flex flex-col items-center justify-center py-2 px-4 text-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-indigo-600 to-blue-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                VS
              </div>
            </div>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sunday, 14 March 2027</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                19:30 IST • Toss at 19:00 IST
              </p>
            </div>
          </div>

          {/* RIGHT: OPPONENT TBA */}
          <div className="flex items-center lg:justify-end gap-5">
            <div className="min-w-0 space-y-1 text-left lg:text-right order-2 lg:order-1">
              <div className="flex items-center lg:justify-end gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-white/10 text-slate-300 border border-white/20 tracking-wider">
                  Opponent TBA
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Official Opponent TBA
              </h3>

              <p className="text-xs text-slate-400 font-medium">
                BCCI Fixture Announcement in early 2027
              </p>
            </div>

            <div className="w-16 h-16 sm:w-19 sm:h-19 rounded-2xl bg-slate-900/80 border border-white/15 p-3 flex items-center justify-center shrink-0 order-1 lg:order-2 shadow-inner">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Stadium context footer */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <span>M. Chinnaswamy Stadium, Bengaluru, Karnataka (Capacity: 40,000)</span>
          </div>
          <span className="text-slate-500 text-[11px]">
            Fixture slot: Prime-time opening gala & title defense
          </span>
        </div>
      </motion.section>

      {/* ── PRE-SEASON ROADMAP: INTERACTIVE STEPPER ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-[32px] border border-white/10 bg-[#070B18]/90 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                IPL 2027 Pre-Season Roadmap & Key Milestones
              </h2>
              <p className="text-xs text-slate-400">Official BCCI progression towards season kickoff</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold">
            BCCI Master Calendar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestoneRoadmap.map((item) => {
            const isDone = item.status === 'completed';
            const isActive = item.status === 'active';
            const isTarget = item.status === 'target';

            return (
              <div
                key={item.title}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isDone
                    ? 'bg-emerald-500/[0.05] border-emerald-500/30 hover:border-emerald-500/50'
                    : isActive
                    ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : isTarget
                    ? 'bg-indigo-500/[0.08] border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isActive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : isTarget
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-white/10 text-slate-300 border-white/15'
                      }`}
                    >
                      Phase {item.phase}
                    </span>

                    {isDone ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : isActive ? (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Next Milestone
                      </span>
                    ) : isTarget ? (
                      <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Kickoff
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-black text-indigo-300 mb-1">{item.date}</div>
                  <h3 className="text-sm font-black text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── 10 COMPETING FRANCHISES ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-[32px] border border-white/10 bg-[#070B18]/90 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              10 Competing Franchises for IPL 2027
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              184 cricketers retained across all 10 clubs ahead of Goa mini-auction
            </p>
          </div>
          <Link
            href="/teams"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Franchise Hubs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {teams.slice(0, 10).map((team) => {
            const shortName = team.shortName || team.name;
            const homeGround = team.homeGrounds?.[0] || 'Home Ground';

            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-400/40 transition-all duration-300 flex flex-col items-center text-center space-y-3"
              >
                <MatchTeamCrest team={team} size={54} glow={true} />

                <div>
                  <span className="text-xs font-black text-white block group-hover:text-indigo-300 transition-colors">
                    {shortName}
                  </span>
                  <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                    {team.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block line-clamp-1 mt-1">
                    {homeGround.split(',')[0]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.section>

      {/* ── WHY SCHEDULE IS STAGED CALLOUT ── */}
      <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-black text-white">Why isn’t the fixture schedule released yet?</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            The BCCI and IPL Governing Council finalize tournament schedules post mini-auction to coordinate security logistics, state election schedules, broadcast prime-time slots, and venue turnarounds across all 10 cities.
          </p>
        </div>
        <button
          onClick={onViewArchive}
          type="button"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View 2026 Season</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
}
