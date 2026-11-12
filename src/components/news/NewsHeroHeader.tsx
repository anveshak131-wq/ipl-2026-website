'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, Flame, MapPin, Radio, Sparkles, Trophy } from 'lucide-react';
import type { News } from '@/types';
import { SEASON_MILESTONES_2027 } from '@/lib/news2027';

export type LeagueScope = 'all' | 'ipl' | 'wpl';

interface NewsHeroHeaderProps {
  leagueScope: LeagueScope;
  onChangeLeagueScope: (scope: LeagueScope) => void;
  counts: { all: number; ipl: number; wpl: number };
  tickerArticles: News[];
  onOpenArticle: (articleId: string) => void;
}

function formatCountdown(targetIso: string, nowMs: number | null): { value: string; unit: string } {
  if (!nowMs) {
    return { value: '2026–27', unit: 'SLATED' };
  }
  const diff = Date.parse(targetIso) - nowMs;
  if (Number.isNaN(diff) || diff <= 0) {
    return { value: 'LIVE', unit: 'ACTIVE' };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) {
    return { value: `${days}d`, unit: `${hours}h left` };
  }
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return { value: `${hours}h`, unit: `${mins}m left` };
}

export default function NewsHeroHeader({
  leagueScope,
  onChangeLeagueScope,
  counts,
  tickerArticles,
  onOpenArticle,
}: NewsHeroHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const scopeTabs: { id: LeagueScope; label: string; sub: string; count: number }[] = [
    { id: 'all', label: 'All 2027', sub: 'IPL + WPL', count: counts.all },
    { id: 'ipl', label: 'IPL 2027', sub: 'Season 20', count: counts.ipl },
    { id: 'wpl', label: 'WPL 2027', sub: 'Season 5', count: counts.wpl },
  ];

  const heroTitle =
    leagueScope === 'wpl'
      ? 'WPL 2027 Season 5 Dispatch'
      : leagueScope === 'ipl'
      ? 'IPL 2027 Off-Season & Auction Wire'
      : 'Season 2027 News & Intelligence Hub';

  const heroSubtitle =
    leagueScope === 'wpl'
      ? 'Official Vadodara & Mumbai fixture tracking, Kochi auction breakthroughs, and Season 5 title storylines.'
      : leagueScope === 'ipl'
      ? 'Pre-retention blockbuster trades, Goa mini-auction purse dynamics, dugout changes, and road to March 2027.'
      : 'Verified 2027 coverage spanning IPL Season 20 retentions & Goa auction alongside WPL Season 5 kickoff.';

  const heroGradient =
    leagueScope === 'wpl'
      ? 'from-indigo-500/20 via-violet-600/10 to-sky-500/15 border-indigo-400/25'
      : leagueScope === 'ipl'
      ? 'from-blue-600/20 via-indigo-600/10 to-amber-500/15 border-blue-400/25'
      : 'from-indigo-600/20 via-violet-500/10 to-sky-500/15 border-white/15';

  const wireItems = tickerArticles.slice(0, 6);

  return (
    <section className="space-y-6">
      {/* Main Hero Banner */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${heroGradient} p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/40 backdrop-blur-xl`}
      >
        {/* Ambient Decorative Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                2027 Editorial Desk
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Reigning Double Holders: Bengaluru
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
              {heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {heroSubtitle}
            </p>
          </div>

          {/* Interactive Spring League Switcher */}
          <div
            role="tablist"
            aria-label="Filter 2027 news by league"
            className="inline-flex self-start lg:self-end items-center gap-1 rounded-2xl border border-white/15 bg-slate-950/75 p-1.5 backdrop-blur-md shadow-inner"
          >
            {scopeTabs.map((tab) => {
              const active = leagueScope === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeLeagueScope(tab.id)}
                  className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="newsLeagueActiveTab"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 32 }
                      }
                      className={`absolute inset-0 rounded-xl border ${
                        tab.id === 'wpl'
                          ? 'bg-gradient-to-r from-indigo-600/80 to-violet-600/80 border-indigo-400/50'
                          : tab.id === 'ipl'
                          ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 border-blue-400/50'
                          : 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 border-amber-300/60'
                      }`}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-bold">{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2027 Key Milestone Countdown Cards */}
        <div className="relative z-10 mt-7 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SEASON_MILESTONES_2027.map((milestone, idx) => {
            const countdown = formatCountdown(milestone.targetIso, nowMs);
            const isHighlightedLeague = leagueScope === milestone.league;
            return (
              <motion.button
                type="button"
                key={milestone.id}
                onClick={() => onChangeLeagueScope(milestone.league)}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * idx, duration: 0.35 }}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                className={`group text-left rounded-2xl border p-4 transition-all bg-slate-950/70 backdrop-blur-md flex items-center justify-between gap-3 ${
                  isHighlightedLeague
                    ? milestone.league === 'wpl'
                      ? 'border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                      : 'border-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        milestone.league === 'wpl'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/35'
                          : 'bg-blue-500/20 text-amber-300 border-blue-400/35'
                      }`}
                    >
                      {milestone.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 truncate">
                      <CalendarClock className="w-3 h-3 shrink-0" />
                      {milestone.dateLabel}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate group-hover:text-amber-200 transition-colors">
                    {milestone.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                    <span className="truncate">{milestone.location}</span>
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center min-w-[68px]">
                  <div className="text-base font-black text-amber-300 leading-none">
                    {countdown.value}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                    {countdown.unit}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Breaking Dispatch Ticker */}
      {wireItems.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-md px-3.5 py-2.5 flex items-center gap-3 overflow-hidden">
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow">
            <Flame className="w-3.5 h-3.5" />
            2027 Wire
          </span>

          <div className="relative flex-1 overflow-hidden">
            <div
              className={`flex items-center gap-6 w-max hover:[animation-play-state:paused] ${
                shouldReduceMotion ? '' : 'animate-[ticker-scroll_42s_linear_infinite]'
              }`}
              style={{
                animationPlayState: shouldReduceMotion ? 'paused' : undefined,
              }}
            >
              {[...wireItems, ...wireItems].map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => onOpenArticle(item.id)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                    {item.league === 'wpl' ? 'WPL' : item.league === 'both' ? '2027' : 'IPL'}
                  </span>
                  <span className="group-hover:underline underline-offset-4">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
