'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock, Layers3, MapPin, Radio, Target, ArrowRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SocialShare from '@/components/ui/SocialShare';
import CountdownTimer from '@/components/ui/CountdownTimer';
import type { Match } from '@/types';

interface ModernMatchesGridProps {
  matches: Match[];
  isLoading?: boolean;
  initialFilter?: FilterKey;
}

type FilterKey = 'all' | 'upcoming' | 'live' | 'completed';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function parseTimeTo24Hour(timeString: string): { hours: number; minutes: number } | null {
  const clean = timeString.trim();

  // Supports 24h format: "19:30"
  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1], 10);
    const minutes = parseInt(hhmmMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  // Supports 12h format: "7:30 PM"
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  return null;
}

function getMatchStartTimestampUTC(match: Match): number | null {
  try {
    const [yearStr, monthStr, dayStr] = match.date.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const parsedTime = parseTimeTo24Hour(match.time);

    if (!year || !month || !day || !parsedTime) return null;

    // Match times are stored in IST; convert IST to UTC for comparisons.
    const istTimestamp = Date.UTC(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0);
    return istTimestamp - IST_OFFSET_MS;
  } catch {
    return null;
  }
}

function formatDateLabel(dateString: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return dateString;

    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

function formatIstTimeLabel(timeString: string): string {
  const parsed = parseTimeTo24Hour(timeString);
  if (!parsed) return timeString;
  const hours12 = parsed.hours % 12 || 12;
  const ampm = parsed.hours >= 12 ? 'PM' : 'AM';
  return `${hours12}:${String(parsed.minutes).padStart(2, '0')} ${ampm} IST`;
}

function getLeagueListHref(league: 'ipl' | 'wpl') {
  return league === 'wpl' ? '/wpl/matches' : '/matches';
}

function buildMatchDetailsHref(match: Match): string {
  const league = match.league === 'wpl' ? 'wpl' : 'ipl';
  const basePath = league === 'wpl' ? `/wpl/matches/${encodeURIComponent(String(match.id))}` : `/matches/${encodeURIComponent(String(match.id))}`;

  const params = new URLSearchParams();
  params.set('league', league);
  if (match.date) params.set('date', match.date);
  if (match.team1?.id != null) params.set('team1Id', String(match.team1.id));
  if (match.team2?.id != null) params.set('team2Id', String(match.team2.id));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function getTeamLogoSrc(team: Match['team1']): string | null {
  const src = team?.logo;
  if (!src) return null;
  if (typeof src !== 'string') return null;
  if (!src.startsWith('/')) return null;
  return src;
}

export default function ModernMatchesGrid({ matches, isLoading = false, initialFilter = 'upcoming' }: ModernMatchesGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const leagueHint = useMemo<'ipl' | 'wpl'>(() => {
    const fromMatches = matches.find((m) => m?.league)?.league;
    if (fromMatches === 'wpl') return 'wpl';
    if (fromMatches === 'ipl') return 'ipl';
    return pathname?.startsWith('/wpl') ? 'wpl' : 'ipl';
  }, [matches, pathname]);

  const oilTheme = useMemo(() => {
    if (leagueHint === 'wpl') {
      return {
        accentStrong:
          'linear-gradient(135deg, rgba(236,72,153,1) 0%, rgba(168,85,247,1) 48%, rgba(34,211,238,1) 100%)',
        accentSoft:
          'linear-gradient(135deg, rgba(236,72,153,0.22) 0%, rgba(168,85,247,0.14) 48%, rgba(34,211,238,0.10) 100%)',
        orbA: 'radial-gradient(70% 70% at 20% 20%, rgba(236,72,153,0.28) 0%, transparent 72%)',
        orbB: 'radial-gradient(70% 70% at 85% 75%, rgba(34,211,238,0.16) 0%, transparent 72%)',
        glow: 'rgba(236,72,153,0.25)',
      } as const;
    }

    return {
      accentStrong:
        'linear-gradient(135deg, rgba(251,191,36,1) 0%, rgba(168,85,247,1) 48%, rgba(34,211,238,1) 100%)',
      accentSoft:
        'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(168,85,247,0.14) 48%, rgba(34,211,238,0.10) 100%)',
      orbA: 'radial-gradient(70% 70% at 20% 20%, rgba(251,191,36,0.24) 0%, transparent 72%)',
      orbB: 'radial-gradient(70% 70% at 85% 75%, rgba(34,211,238,0.16) 0%, transparent 72%)',
      glow: 'rgba(251,191,36,0.25)',
    } as const;
  }, [leagueHint]);

  const viewAllHref = useMemo(() => getLeagueListHref(leagueHint), [leagueHint]);

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>(initialFilter);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [nowTick, setNowTick] = useState(0);
  const itemsPerPage = 6;

  // Keep the "upcoming" filter accurate even if match status lags behind the clock.
  useEffect(() => {
    const interval = window.setInterval(() => setNowTick((value) => value + 1), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(itemsPerPage);
  }, [selectedFilter]);

  useEffect(() => {
    setSelectedFilter(initialFilter);
  }, [initialFilter]);

  const filterCounts = useMemo(() => {
    const now = Date.now();
    const isUpcomingFuture = (match: Match) => {
      if (match.status !== 'upcoming') return false;
      const start = getMatchStartTimestampUTC(match);
      return start ? start > now : new Date(match.date).getTime() > now;
    };

    return {
      upcoming: matches.filter(isUpcomingFuture).length,
      live: matches.filter((m) => m.status === 'live').length,
      completed: matches.filter((m) => m.status === 'completed').length,
      all: matches.length,
    } as const;
  }, [matches, nowTick]);

  useEffect(() => {
    const now = Date.now();
    let filtered: Match[] = [];

    const sortAsc = (items: Match[]) =>
      [...items].sort((a, b) => (getMatchStartTimestampUTC(a) ?? 0) - (getMatchStartTimestampUTC(b) ?? 0));
    const sortDesc = (items: Match[]) =>
      [...items].sort((a, b) => (getMatchStartTimestampUTC(b) ?? 0) - (getMatchStartTimestampUTC(a) ?? 0));

    if (selectedFilter === 'upcoming') {
      filtered = sortAsc(
        matches.filter((m) => {
          if (m.status !== 'upcoming') return false;
          const start = getMatchStartTimestampUTC(m);
          return start ? start > now : new Date(m.date).getTime() > now;
        })
      );
    } else if (selectedFilter === 'live') {
      filtered = sortAsc(matches.filter((m) => m.status === 'live'));
    } else if (selectedFilter === 'completed') {
      filtered = sortDesc(matches.filter((m) => m.status === 'completed'));
    } else {
      const statusOrder: Record<Match['status'], number> = {
        live: 0,
        upcoming: 1,
        completed: 2,
        cancelled: 3,
      };

      filtered = [...matches].sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        const aStart = getMatchStartTimestampUTC(a) ?? 0;
        const bStart = getMatchStartTimestampUTC(b) ?? 0;
        if (a.status === 'completed') {
          return bStart - aStart;
        }
        return aStart - bStart;
      });
    }

    setFilteredMatches(filtered);
  }, [selectedFilter, matches, nowTick]);

  const filters = useMemo(
    () =>
      [
        { key: 'upcoming', label: 'Upcoming', icon: Target, count: filterCounts.upcoming },
        { key: 'live', label: 'Live', icon: Radio, count: filterCounts.live },
        { key: 'completed', label: 'Completed', icon: CheckCircle2, count: filterCounts.completed },
        { key: 'all', label: 'All', icon: Layers3, count: filterCounts.all },
      ] as const,
    [filterCounts]
  );

  return (
    <div className="relative space-y-8">
      {/* Oil-canvas accents */}
      <div className="absolute -inset-6 -z-10 overflow-hidden rounded-[32px]">
        <motion.div
          className="absolute -top-10 -left-36 h-32 w-[720px] -rotate-6 blur-2xl opacity-90"
          style={{ background: oilTheme.orbA }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [0, 14, 0],
                  y: [0, -10, 0],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-12 -right-36 h-32 w-[720px] rotate-6 blur-2xl opacity-80"
          style={{ background: oilTheme.orbB }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [0, -16, 0],
                  y: [0, 12, 0],
                }
          }
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px)',
            mixBlendMode: 'soft-light',
          }}
        />
      </div>

      {/* Filter bar */}
      <div className="relative mx-auto w-full max-w-3xl">
        <div
          className="relative p-1.5 rounded-lg border border-white/10 bg-black/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset` }}
        >
          <div className="grid grid-cols-4 gap-1">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className="relative px-3 py-2.5 rounded-md overflow-hidden transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="matches-filter-pill"
                      className="absolute inset-0 rounded-md"
                      style={{
                        background: oilTheme.accentSoft,
                        boxShadow: `0 10px 40px ${oilTheme.glow}`,
                      }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/5 border border-white/10">
                      <Icon
                        className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`}
                      />
                    </span>
                    <span className={`hidden sm:inline text-sm font-black tracking-normal ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {filter.label}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-slate-100 tabular-nums">
                      {filter.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-slate-400/90 font-medium">
          Fixtures and start times synchronize automatically upon official league release.
        </div>
      </div>

      {/* Matches grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="relative h-80 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden"
            >
              <motion.div
                className="absolute -inset-y-10 -inset-x-16 rotate-12"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }}
                animate={prefersReducedMotion ? undefined : { x: ['-60%', '160%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
              />
            </div>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="relative text-center py-14 px-6 rounded-lg border border-white/10 bg-black/25 backdrop-blur-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-70" style={{ background: oilTheme.accentSoft }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/70" />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="mx-auto mb-5 w-14 h-14 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-xl md:text-2xl font-black text-white tracking-normal">
              {selectedFilter === 'upcoming'
                ? 'No upcoming fixtures right now'
                : selectedFilter === 'live'
                ? 'No live match at the moment'
                : selectedFilter === 'completed'
                ? 'No completed matches yet'
                : 'No fixtures available'}
            </p>
            <p className="mt-2 text-sm text-slate-200/80">
              {selectedFilter === 'upcoming'
                ? 'New fixtures will appear here as soon as they’re added.'
                : selectedFilter === 'live'
                ? 'When play starts, this tab lights up automatically.'
                : selectedFilter === 'completed'
                ? 'Results show here after matches are marked completed.'
                : 'Official season schedule and match timings are awaiting release.'}
            </p>

            {matches.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href={viewAllHref}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-amber-400/40 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg"
                >
                  <span>View Full Schedule</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMatches.slice(0, displayCount).map((match, idx) => {
                const href = buildMatchDetailsHref(match);
                const listHref = getLeagueListHref(match.league === 'wpl' ? 'wpl' : 'ipl');

                const badgeClass =
                  match.status === 'live'
                    ? 'bg-red-500/15 text-red-200 border-red-500/30'
                    : match.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                    : match.status === 'cancelled'
                    ? 'bg-slate-500/15 text-slate-200 border-slate-500/30'
                    : 'bg-cyan-500/15 text-cyan-100 border-cyan-500/30';

                const badgeLabel =
                  match.status === 'live'
                    ? 'LIVE'
                    : match.status === 'completed'
                    ? 'COMPLETED'
                    : match.status === 'cancelled'
                    ? 'CANCELLED'
                    : 'UPCOMING';

                const team1Logo = getTeamLogoSrc(match.team1);
                const team2Logo = getTeamLogoSrc(match.team2);

                return (
                  <motion.div
                    key={`${match.league || 'ipl'}-${match.id}`}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.35,
                      delay: prefersReducedMotion ? 0 : Math.min(idx * 0.03, 0.18),
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    className="h-full"
                  >
                    <motion.div
                      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className="group relative h-full rounded-lg p-[1px]"
                      style={{ background: oilTheme.accentSoft }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open match details: ${match.team1.shortName} vs ${match.team2.shortName}`}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                    >
                      <div className="relative h-full rounded-lg bg-[rgba(2,6,23,0.62)] backdrop-blur-2xl border border-white/10 p-6 overflow-hidden">
                        {/* Oil shine sweep */}
                        <div
                          className="absolute -inset-x-24 -top-28 h-40 rotate-12 opacity-0 group-hover:opacity-100 translate-x-[-140%] group-hover:translate-x-[140%] transition-all duration-1000"
                          style={{
                            background:
                              'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(255,255,255,0.06), transparent)',
                          }}
                        />
                        {/* Subtle inner glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background:
                              'radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,0.10) 0%, transparent 70%)',
                            mixBlendMode: 'soft-light',
                          }}
                        />

                        {/* Top row: status + share */}
                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${badgeClass}`}
                          >
                            {match.status === 'live' ? (
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
                              </span>
                            ) : null}
                            {badgeLabel}
                          </span>

                          <div
                            className="relative z-10"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <SocialShare
                              url={`${listHref}#${match.id}`}
                              title={`${match.team1.shortName} vs ${match.team2.shortName}`}
                              description={`${match.venue} - ${match.date}`}
                            />
                          </div>
                        </div>

                        {/* Countdown (upcoming only) */}
                        {match.status === 'upcoming' && (
                          <div className="relative z-10 mt-4">
                            <CountdownTimer
                              targetDate={match.date}
                              matchTime={match.time}
                              variant="panel"
                              className="w-full"
                            />
                          </div>
                        )}

                        {/* Teams */}
                        <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="relative w-12 h-12 rounded-lg border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center"
                              style={{ boxShadow: `0 14px 40px rgba(0,0,0,0.35)` }}
                            >
                              {team1Logo ? (
                                <img src={team1Logo} alt={match.team1.name} className="w-full h-full object-contain p-2" loading="lazy" />
                              ) : (
                                <span className="text-sm font-black text-white">{match.team1.shortName}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-black text-lg tracking-normal truncate">
                                {match.team1.shortName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{match.team1.name}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-black text-slate-200">
                              VS
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              {(match.league || leagueHint).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 min-w-0 justify-end text-right">
                            <div className="min-w-0">
                              <p className="text-white font-black text-lg tracking-normal truncate">
                                {match.team2.shortName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{match.team2.name}</p>
                            </div>
                            <div
                              className="relative w-12 h-12 rounded-lg border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center"
                              style={{ boxShadow: `0 14px 40px rgba(0,0,0,0.35)` }}
                            >
                              {team2Logo ? (
                                <img src={team2Logo} alt={match.team2.name} className="w-full h-full object-contain p-2" loading="lazy" />
                              ) : (
                                <span className="text-sm font-black text-white">{match.team2.shortName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="relative z-10 mt-5 space-y-2 text-sm text-slate-300/85 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-white/70" />
                            <span className="font-semibold text-slate-100">{formatDateLabel(match.date)}</span>
                            <span className="text-slate-500">•</span>
                            <Clock className="w-4 h-4 text-white/70" />
                            <span className="font-semibold text-slate-100">{formatIstTimeLabel(match.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-white/70" />
                            <span className="truncate">{match.venue}</span>
                          </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-400 truncate">
                            {match.status === 'completed' && match.result ? match.result : 'Tap to view details'}
                          </p>
                          <div className="inline-flex items-center gap-2 text-[11px] font-black text-white/80 group-hover:text-white transition-colors">
                            Details
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Load More Button */}
          {filteredMatches.length > displayCount && (
            <div className="text-center mt-8">
              <motion.button
                onClick={() => setDisplayCount(displayCount + itemsPerPage)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-8 py-3 rounded-lg text-white font-black tracking-normal border border-white/10 overflow-hidden"
                style={{
                  background: oilTheme.accentSoft,
                  boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 12px 40px ${oilTheme.glow}`,
                }}
              >
                <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: oilTheme.accentStrong }} />
                <span className="relative z-10">
                Load More ({filteredMatches.length - displayCount} remaining)
                </span>
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
