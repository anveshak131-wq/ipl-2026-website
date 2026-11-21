'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Users,
  Compass,
  Radio,
  Download,
} from 'lucide-react';
import { Team } from '@/types';

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

  const milestoneRoadmap = [
    {
      date: '17 Nov 2026 (17/11/2026)',
      title: 'Player Retentions & Trades Finalized',
      detail: '184 players locked in across 10 franchises committing ₹1,002.05 Cr; 66 vacancies left open.',
      status: 'completed',
    },
    {
      date: '16 Dec 2026 (16/12/2026)',
      title: 'IPL 2027 Player Mini-Auction (Goa)',
      detail: '11:00 AM IST @ ITC Grand Goa. Franchises compete with an aggregate ₹297.95 Cr purse for 66 slots.',
      status: 'upcoming',
    },
    {
      date: 'Late Jan / Early Feb 2027',
      title: 'Official BCCI 74-Match Schedule Release',
      detail: 'BCCI and IPL Governing Council announce full fixture schedule, dates, double-headers & venues.',
      status: 'coming_soon',
    },
    {
      date: '14 Mar 2027 (14/03/2027)',
      title: 'IPL 2027 Opening Ceremony & Match 1',
      detail: 'Reigning champions Royal Challengers Bengaluru host the tournament opener @ M. Chinnaswamy Stadium.',
      status: 'target',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Standby & Countdown Banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-[#0B1024]/95 via-[#070B18]/95 to-[#0E1530]/95 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl"
      >
        {/* Ambient glows (No pink, No yellow-cyan) */}
        <div className="absolute top-0 right-1/4 w-[480px] h-[300px] bg-blue-600/[0.08] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[480px] h-[300px] bg-indigo-600/[0.08] blur-[140px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 space-y-8">
          {/* Status Badge & Headline */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>IPL 2027 • 20th Edition • Official Match Centre</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                IPL 2027 Match Schedule{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300">
                  Coming Soon
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                The Board of Control for Cricket in India (BCCI) and the IPL Governing Council will officially unveil the complete 74-match schedule following the Player Mini-Auction on December 16, 2026 in Goa.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="shrink-0 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl space-y-1 text-right sm:text-left lg:text-right">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                Tournament Window (Expected)
              </span>
              <span className="text-lg font-black text-amber-300 block">
                14 March – 16 May 2027
              </span>
              <span className="text-xs text-slate-400 block font-medium">
                (14/03/2027 to 16/05/2027) • 74 Matches
              </span>
            </div>
          </div>

          {/* Live Dynamic Countdown to Season Opening */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  Live Countdown to IPL 2027 Opening Match
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Target: Sunday, 14 March 2027 (14/03/2027) • 19:30 IST
              </span>
            </div>

            {/* Countdown Unit Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 text-center shadow-lg hover:border-indigo-400/40 transition-colors"
                >
                  <span className="block text-3xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="block text-[11px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300 mt-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Pre-Season Progress Meter */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Pre-Season Window: Retentions Finalized</span>
                <span className="text-indigo-300 font-semibold">{progressPercent}% Progress toward Kickoff</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onDownloadKeyDates}
              type="button"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Add 2027 Key Dates to Calendar (.ics)</span>
            </button>

            <button
              onClick={onViewArchive}
              type="button"
              className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-indigo-300" />
              <span>Browse 2026 Season Archive (74 Matches)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Projected Match 01 & Opening Fixture Feature */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B18]/90 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Match 01 • Projected Season Opener</span>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Per IPL Tradition: Defending Champions host inaugural fixture
          </span>
        </div>

        {/* Projected Teams Clash Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          {/* Host / Defending Champions: RCB */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/50 border border-red-500/30 p-2.5 flex items-center justify-center shrink-0">
              <Image
                src="/logos/rcb_logo_2026_animated.svg"
                alt="Royal Challengers Bengaluru Logo"
                width={56}
                height={56}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                  RCB • Hosts
                </span>
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Champions
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">Royal Challengers Bengaluru</h3>
              <p className="text-xs text-slate-400 mt-0.5">Defending IPL Titleholders</p>
            </div>
          </div>

          {/* VS & Schedule Telemetry */}
          <div className="text-center space-y-2 py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30">
              VS
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sunday, 14 March 2027 (14/03/2027)</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>19:30 IST • Toss: 19:00 IST</span>
              </p>
              <p className="text-xs text-slate-300 font-medium flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>M. Chinnaswamy Stadium, Bengaluru</span>
              </p>
            </div>
          </div>

          {/* Opponent: To Be Announced by BCCI */}
          <div className="flex items-center md:justify-end gap-4">
            <div className="text-left md:text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-slate-300 border border-white/15">
                Opponent TBA
              </span>
              <h3 className="text-lg font-black text-white mt-1">Official Opponent TBA</h3>
              <p className="text-xs text-slate-400 mt-0.5">BCCI Fixture Announcement</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/15 p-2.5 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-slate-500" />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          The opening match of every Indian Premier League season is hosted by the defending champions at their primary home venue. Full match fixture confirmations will follow the BCCI announcement in early 2027.
        </p>
      </section>

      {/* Pre-Season Milestone Roadmap */}
      <section className="rounded-3xl border border-white/10 bg-[#070B18]/90 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              IPL 2027 Pre-Season Roadmap & Timeline
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">BCCI Master Timeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestoneRoadmap.map((item, index) => {
            const isDone = item.status === 'completed';
            const isTarget = item.status === 'target';
            return (
              <div
                key={item.title}
                className={`p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                    : isTarget
                    ? 'bg-indigo-500/[0.06] border-indigo-500/35 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${isDone ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : isTarget ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/10 text-slate-300 border-white/15'}">
                    Phase 0{index + 1}
                  </span>
                  {isDone ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
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

                <div className="text-xs font-bold text-slate-300 mb-1">{item.date}</div>
                <h3 className="text-sm font-black text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10 Franchises Showcase for 2027 Season */}
      <section className="rounded-3xl border border-white/10 bg-[#070B18]/90 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              10 Competing Franchises for IPL 2027
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rosters finalized with 184 retained cricketers ahead of Goa mini-auction
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
                className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-400/40 transition-all flex flex-col items-center text-center space-y-2.5"
              >
                <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src={team.logo || '/logos/tba_logo.svg'}
                    alt={`${team.name} Logo`}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
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
      </section>

      {/* Why Schedule is Published in Stages Banner */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          className="shrink-0 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View 2026 Season</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
}
