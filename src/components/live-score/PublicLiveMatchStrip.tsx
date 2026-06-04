'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, Clock, Radio, Trophy, Zap } from 'lucide-react';

import { leagueDesign, motionPresets } from '@/lib/leagueDesign';
import type { League, Match } from '@/types';

interface PublicLiveMatchStripProps {
  league: League;
  matches: Match[];
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function parseTimeTo24Hour(timeString: string): { hours: number; minutes: number } | null {
  const clean = String(timeString || '').trim();
  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);

  if (hhmmMatch) {
    const hours = Number.parseInt(hhmmMatch[1], 10);
    const minutes = Number.parseInt(hhmmMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number.parseInt(ampmMatch[1], 10);
    const minutes = Number.parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  return null;
}

function getMatchStartTimestampUTC(match: Match): number {
  const [yearStr, monthStr, dayStr] = String(match.date || '').split('-');
  const parsedTime = parseTimeTo24Hour(match.time);
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day || !parsedTime) {
    const fallback = new Date(match.date).getTime();
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  const istTimestamp = Date.UTC(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0);
  return istTimestamp - IST_OFFSET_MS;
}

function formatDateTime(match: Match): string {
  const start = getMatchStartTimestampUTC(match);
  if (!start) return `${match.date} • ${match.time}`;

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(start));
}

function formatStartsIn(start: number, now: number): string {
  const diff = start - now;
  if (diff <= 0) return 'Starting soon';

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${Math.max(minutes, 1)}m`;
}

function getTeamScore(match: Match, side: 'team1' | 'team2'): string {
  const scoreText = side === 'team1' ? match.team1Score : match.team2Score;
  if (scoreText) return scoreText;

  const score = match.score?.[side];
  if (!score) return '';
  return `${score.runs}/${score.wickets} (${score.overs})`;
}

function getTeamLogo(team: Match['team1']) {
  if (typeof team.logo === 'string' && team.logo.startsWith('/')) return team.logo;
  return '';
}

export default function PublicLiveMatchStrip({ league, matches }: PublicLiveMatchStripProps) {
  const prefersReducedMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const theme = leagueDesign[league].public;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const featuredMatch = useMemo(() => {
    const leagueMatches = matches.filter((match) => (match.league || league) === league);
    const live = leagueMatches.find((match) => match.status === 'live');
    if (live) return live;

    const upcoming = leagueMatches
      .filter((match) => match.status === 'upcoming')
      .sort((a, b) => getMatchStartTimestampUTC(a) - getMatchStartTimestampUTC(b))[0];
    if (upcoming) return upcoming;

    return leagueMatches
      .filter((match) => match.status === 'completed')
      .sort((a, b) => getMatchStartTimestampUTC(b) - getMatchStartTimestampUTC(a))[0] || null;
  }, [league, matches]);

  if (!featuredMatch) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={motionPresets.panelReveal}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="sticky top-16 md:top-20 z-40 px-3 sm:px-4 pt-3 pointer-events-none"
      >
        <Link
          href={`/live-score?league=${league}`}
          className="group pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 sm:px-4"
          style={{
            background: `linear-gradient(135deg, ${theme.surfaceStrong}, ${theme.surface}), ${theme.softGradient}`,
            borderColor: theme.border,
            boxShadow: `0 18px 55px rgba(0,0,0,0.35), 0 0 45px ${theme.glow}`,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
            style={{ background: theme.softGradient, borderColor: theme.border }}
          >
            <Trophy className="h-5 w-5" style={{ color: theme.accent }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                style={{ color: theme.text, background: theme.softGradient }}
              >
                {theme.shortName} Center
              </span>
              <span className="hidden text-xs font-semibold sm:inline" style={{ color: theme.muted }}>
                Live scores, fixtures, scorecards, and match status
              </span>
            </div>
            <div className="mt-1 truncate text-sm font-black sm:text-base" style={{ color: theme.text }}>
              Open the match center for the latest {theme.shortName} updates
            </div>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:translate-x-1"
            style={{ background: theme.softGradient, color: theme.text }}
            aria-hidden="true"
          >
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </motion.div>
    );
  }

  const isLive = featuredMatch.status === 'live';
  const isCompleted = featuredMatch.status === 'completed';
  const start = getMatchStartTimestampUTC(featuredMatch);
  const href = `/live-score?league=${league}&matchId=${encodeURIComponent(String(featuredMatch.id))}`;
  const team1Logo = getTeamLogo(featuredMatch.team1);
  const team2Logo = getTeamLogo(featuredMatch.team2);
  const team1Score = getTeamScore(featuredMatch, 'team1');
  const team2Score = getTeamScore(featuredMatch, 'team2');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionPresets.panelReveal}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="sticky top-16 md:top-20 z-40 px-3 sm:px-4 pt-3 pointer-events-none"
    >
      <Link
        href={href}
        className="group pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 sm:px-4"
        style={{
          background: `linear-gradient(135deg, ${theme.surfaceStrong}, ${theme.surface}), ${theme.softGradient}`,
          borderColor: theme.border,
          boxShadow: `0 18px 55px rgba(0,0,0,0.35), 0 0 45px ${theme.glow}`,
        }}
      >
        <div
          className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border sm:flex"
          style={{ background: theme.softGradient, borderColor: theme.border }}
        >
          {isLive ? (
            <motion.span
              animate={prefersReducedMotion ? undefined : motionPresets.livePulse}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Radio className="h-5 w-5" style={{ color: theme.danger }} />
            </motion.span>
          ) : (
            <Trophy className="h-5 w-5" style={{ color: theme.accent }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
              style={{
                color: isLive ? '#FFFFFF' : theme.text,
                background: isLive ? theme.liveGradient : theme.softGradient,
                boxShadow: isLive ? `0 0 22px ${theme.glow}` : undefined,
              }}
            >
              {isLive ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              ) : (
                <CalendarDays className="h-3 w-3" />
              )}
              {isLive ? 'Live Now' : isCompleted ? `Latest ${theme.shortName}` : `Next ${theme.shortName}`}
            </span>
            <span className="hidden text-xs font-semibold sm:inline" style={{ color: theme.muted }}>
              {isLive
                ? 'Ball-by-ball updates are active'
                : isCompleted
                ? 'Final scorecard and match summary'
                : `${formatStartsIn(start, now)} to start`}
            </span>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {team1Logo ? (
                <img src={team1Logo} alt="" className="h-7 w-7 rounded-lg object-contain" loading="lazy" />
              ) : null}
              <span className="truncate text-sm font-black sm:text-base" style={{ color: theme.text }}>
                {featuredMatch.team1.shortName}
              </span>
              {team1Score ? (
                <motion.span
                  key={team1Score}
                  initial={prefersReducedMotion ? undefined : motionPresets.scoreFlip.initial}
                  animate={prefersReducedMotion ? undefined : motionPresets.scoreFlip.animate}
                  className="hidden text-sm font-black tabular-nums sm:inline"
                  style={{ color: theme.accent }}
                >
                  {team1Score}
                </motion.span>
              ) : null}
            </div>

            <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black" style={{ borderColor: theme.border, color: theme.muted }}>
              VS
            </span>

            <div className="flex min-w-0 items-center gap-2">
              {team2Logo ? (
                <img src={team2Logo} alt="" className="h-7 w-7 rounded-lg object-contain" loading="lazy" />
              ) : null}
              <span className="truncate text-sm font-black sm:text-base" style={{ color: theme.text }}>
                {featuredMatch.team2.shortName}
              </span>
              {team2Score ? (
                <motion.span
                  key={team2Score}
                  initial={prefersReducedMotion ? undefined : motionPresets.scoreFlip.initial}
                  animate={prefersReducedMotion ? undefined : motionPresets.scoreFlip.animate}
                  className="hidden text-sm font-black tabular-nums sm:inline"
                  style={{ color: theme.accent }}
                >
                  {team2Score}
                </motion.span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden min-w-[180px] flex-col items-end text-right lg:flex">
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: theme.muted }}>
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(featuredMatch)}
          </span>
          <span className="mt-1 max-w-[220px] truncate text-xs" style={{ color: theme.muted }}>
            {featuredMatch.venue}
          </span>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:translate-x-1"
          style={{ background: theme.softGradient, color: theme.text }}
          aria-hidden="true"
        >
          {isLive ? <Zap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </div>
      </Link>
    </motion.div>
  );
}
