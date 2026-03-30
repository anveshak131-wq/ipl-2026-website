'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Clock, MapPin, MessageSquare, RefreshCw, Table2, Trophy, Zap } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ModernTeamLogo from '@/components/ui/ModernTeamLogo';
import GradientText from '@/components/ui/GradientText';
import { useLeague } from '@/contexts/LeagueContext';
import { api } from '@/lib/data';
import type { Match, Player } from '@/types';

type ExtrasRow = {
  hasWide: boolean;
  wideExtraRuns: number;
  hasNoBall: boolean;
  hasByes: boolean;
  byesRuns: number;
  hasLB: boolean;
  lbRuns: number;
};

type WicketRow = {
  hasWicket: boolean;
  wicketType: string;
  wicketTaker: string;
  wicketAssistant?: string;
  outBatter?: 'striker' | 'nonStriker';
};

type LiveScoreTableState = {
  rows: string[][];
  extrasData?: Record<number, ExtrasRow>;
  wicketData?: Record<number, WicketRow>;
  commentaryData?: Record<number, string>;
};

type ScorecardDoc = {
  id?: string;
  draft?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  result?: {
    winner?: string;
    margin?: string;
    manOfTheMatch?: string;
  };
};

type ScorecardResultInfo = {
  scorecardId: string;
  draft: boolean;
  winner: string;
  margin: string;
  manOfTheMatch: string;
};

type LiveTabKey = 'overview' | 'commentary' | 'stats' | 'scorecard';
type CommentaryFilterKey = 'all' | 'wickets' | 'boundaries' | 'extras';

const DEFAULT_EXTRAS: ExtrasRow = {
  hasWide: false,
  wideExtraRuns: 0,
  hasNoBall: false,
  hasByes: false,
  byesRuns: 0,
  hasLB: false,
  lbRuns: 0,
};

const DEFAULT_WICKET: WicketRow = {
  hasWicket: false,
  wicketType: '',
  wicketTaker: '',
  outBatter: 'striker',
};

const OIL_NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const LIVE_SCORE_OIL_THEME = {
  base: 'linear-gradient(155deg, #0b0713 0%, #140b1d 34%, #0b2238 72%, #050a15 100%)',
  hazeA:
    'radial-gradient(85% 70% at 16% 12%, rgba(251,146,60,0.28) 0%, rgba(236,72,153,0.12) 55%, transparent 78%)',
  hazeB:
    'radial-gradient(80% 64% at 86% 86%, rgba(34,211,238,0.22) 0%, rgba(99,102,241,0.12) 55%, transparent 78%)',
  conic:
    'conic-gradient(from 220deg at 50% 35%, rgba(34,211,238,0.10), rgba(168,85,247,0.14), rgba(251,146,60,0.10), rgba(236,72,153,0.10), rgba(99,102,241,0.10), transparent 62%)',
  ring:
    'conic-gradient(from 0deg at 50% 50%, rgba(34,211,238,0.22), rgba(168,85,247,0.22), rgba(251,146,60,0.18), rgba(236,72,153,0.18), rgba(99,102,241,0.22), rgba(34,211,238,0.22))',
  brush:
    'linear-gradient(112deg, rgba(251,146,60,0.18), rgba(168,85,247,0.12), rgba(34,211,238,0.08), rgba(99,102,241,0.05))',
  accentLine: 'linear-gradient(90deg, rgba(34,211,238,0.65), rgba(168,85,247,0.62), rgba(251,146,60,0.6))',
} as const;

const NON_DELIVERY_WICKET_TYPES = new Set([
  'Mankad (Run out at non-striker end)',
  'Timed Out',
  'Retired Hurt',
  'Retired Out',
]);

function isNonDeliveryWicket(wk: WicketRow) {
  return Boolean(wk?.hasWicket && NON_DELIVERY_WICKET_TYPES.has(String(wk.wicketType || '').trim()));
}

function isRetiredHurtEvent(wk: WicketRow) {
  return Boolean(wk?.hasWicket && String(wk.wicketType || '').trim() === 'Retired Hurt');
}

function otherTeamKey(teamKey: 'team1' | 'team2'): 'team1' | 'team2' {
  return teamKey === 'team1' ? 'team2' : 'team1';
}

function parseTimeTo24Hour(timeString: string): { hours: number; minutes: number } | null {
  const clean = String(timeString || '').trim();
  if (!clean) return null;

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

function getMatchStartDate(match: Match): Date | null {
  const parsedTime = parseTimeTo24Hour(match.time);
  if (!parsedTime) {
    const fallback = new Date(match.date);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const hh = String(parsedTime.hours).padStart(2, '0');
  const mm = String(parsedTime.minutes).padStart(2, '0');

  // Match times are stored in IST; interpret them with a +05:30 offset.
  const dt = new Date(`${match.date}T${hh}:${mm}:00+05:30`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function pickDefaultMatchId(matches: Match[], preferredMatchId?: string | null): string {
  if (!Array.isArray(matches) || matches.length === 0) return '';
  if (preferredMatchId && matches.some((m) => m.id === preferredMatchId)) return preferredMatchId;

  const sorted = [...matches].sort((a, b) => {
    const ta = getMatchStartDate(a)?.getTime() ?? 0;
    const tb = getMatchStartDate(b)?.getTime() ?? 0;
    return ta - tb;
  });

  const live = sorted.filter((m) => m.status === 'live');
  if (live.length > 0) return live[0].id;

  const now = Date.now();
  const upcoming = sorted.filter((m) => m.status === 'upcoming' && (getMatchStartDate(m)?.getTime() ?? 0) >= now);
  if (upcoming.length > 0) return upcoming[0].id;

  return sorted[0].id;
}

function getBattingTeamKeyForInnings(match: Match, innings: '1' | '2'): 'team1' | 'team2' {
  const innings1Batting = match.matchState?.innings1?.battingTeam;
  if (innings1Batting === 'team1' || innings1Batting === 'team2') {
    return innings === '1' ? innings1Batting : otherTeamKey(innings1Batting);
  }

  const toss = match.matchState?.toss;
  if (!toss) return 'team1';

  const winner = toss.winner;
  const decision = toss.decision;

  if (decision === 'bat') {
    return innings === '1' ? winner : otherTeamKey(winner);
  }

  return innings === '1' ? otherTeamKey(winner) : winner;
}

function calculateInningsTotals(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
) {
  let batsmanRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let extras = 0;

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    const nonDelivery = isNonDeliveryWicket(wk);

    if (wk.hasWicket && !isRetiredHurtEvent(wk)) wickets += 1;
    if (!ex.hasWide && !ex.hasNoBall && !nonDelivery) legalBalls += 1;

    if (nonDelivery) return;

    const runs = ex.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;
    batsmanRuns += runs;

    if (ex.hasWide) {
      extras += 1 + (ex.wideExtraRuns || 0);
    } else if (ex.hasNoBall) {
      extras += 1;
    }
    if (ex.hasByes && !ex.hasWide) {
      extras += ex.byesRuns || 0;
    }
    if (ex.hasLB && !ex.hasWide) {
      extras += ex.lbRuns || 0;
    }
  });

  const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const teamTotal = batsmanRuns + extras;
  const runRate = legalBalls > 0 ? ((teamTotal / legalBalls) * 6).toFixed(2) : '0.00';

  return { batsmanRuns, extras, wickets, legalBalls, overs, teamTotal, runRate };
}

type ExtrasBreakdown = {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
};

function calculateExtrasBreakdown(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
): ExtrasBreakdown {
  const breakdown: ExtrasBreakdown = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    if (isNonDeliveryWicket(wk)) return;

    if (ex.hasWide) breakdown.wides += 1 + (ex.wideExtraRuns || 0);
    else if (ex.hasNoBall) breakdown.noBalls += 1;

    if (ex.hasByes && !ex.hasWide) breakdown.byes += ex.byesRuns || 0;
    if (ex.hasLB && !ex.hasWide) breakdown.legByes += ex.lbRuns || 0;
  });

  return breakdown;
}

type BattingLeader = {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

function buildBattingLeaders(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
  resolvePlayerName: (value: string) => string,
): BattingLeader[] {
  const map = new Map<string, BattingLeader>();

  const ensure = (playerId: string) => {
    const id = String(playerId || '').trim();
    if (!id) return null;
    const existing = map.get(id);
    if (existing) return existing;
    const created: BattingLeader = {
      playerId: id,
      name: resolvePlayerName(id),
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
    };
    map.set(id, created);
    return created;
  };

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const strikerId = String(row?.[3] || '').trim();
    if (!strikerId) return;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    if (isNonDeliveryWicket(wk)) return;

    const batRuns = ex.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;

    const batter = ensure(strikerId);
    if (!batter) return;

    batter.runs += batRuns;
    if (!ex.hasWide) batter.balls += 1;
    if (batRuns === 4) batter.fours += 1;
    if (batRuns === 6) batter.sixes += 1;
  });

  return Array.from(map.values())
    .filter((p) => p.balls > 0 || p.runs > 0)
    .sort((a, b) => {
      if (b.runs !== a.runs) return b.runs - a.runs;
      if (a.balls !== b.balls) return a.balls - b.balls;
      return a.name.localeCompare(b.name);
    });
}

function getLastRowForInnings(rows: string[][], innings: '1' | '2') {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i]?.[2] || '') === innings) return { row: rows[i], idx: i };
  }
  return null;
}

function computeBatterStats(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
  batterName: string,
) {
  let runs = 0;
  let balls = 0;

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;
    if (String(row?.[3] || '') !== batterName && String(row?.[4] || '') !== batterName) return;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    if (isNonDeliveryWicket(wk)) return;
    const r = ex.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;

    // Only count batter runs on deliveries where they were striker.
    if (String(row?.[3] || '') === batterName) {
      runs += r;
      if (!ex.hasWide) balls += 1;
    }
  });

  return { runs, balls };
}

function computeBowlerStats(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
  bowlerName: string,
) {
  let runsConceded = 0;
  let legalBalls = 0;

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;
    if (String(row?.[5] || '') !== bowlerName) return;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    if (isNonDeliveryWicket(wk)) return;
    const batRuns = ex.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;

    runsConceded += batRuns;
    if (ex.hasWide) runsConceded += 1 + (ex.wideExtraRuns || 0);
    if (ex.hasNoBall) runsConceded += 1;
    if (!ex.hasWide && !ex.hasNoBall) legalBalls += 1;
  });

  const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  return { runs: runsConceded, legalBalls, overs };
}

type ChartPoint = { x: number; y: number };
type InningsChartSeries = {
  overRuns: number[];
  overWickets: number[];
  cumulativePoints: ChartPoint[];
  totalRuns: number;
  legalBalls: number;
};

function computeBallOutcome(row: string[], ex: ExtrasRow, wk: WicketRow) {
  const nonDelivery = isNonDeliveryWicket(wk);
  const wicket = Boolean(wk?.hasWicket && !isRetiredHurtEvent(wk));
  if (nonDelivery) {
    return { batRuns: 0, extrasRuns: 0, totalRuns: 0, legalBall: false, wicket };
  }

  const batRuns = ex.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;

  let extrasRuns = 0;
  if (ex.hasWide) {
    extrasRuns += 1 + (ex.wideExtraRuns || 0);
  } else if (ex.hasNoBall) {
    extrasRuns += 1;
  }
  if (ex.hasByes && !ex.hasWide) extrasRuns += ex.byesRuns || 0;
  if (ex.hasLB && !ex.hasWide) extrasRuns += ex.lbRuns || 0;

  const totalRuns = batRuns + extrasRuns;
  const legalBall = !ex.hasWide && !ex.hasNoBall;

  return { batRuns, extrasRuns, totalRuns, legalBall, wicket };
}

function buildInningsChartSeries(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
): InningsChartSeries {
  const overRuns = Array.from({ length: 20 }, () => 0);
  const overWickets = Array.from({ length: 20 }, () => 0);

  let totalRuns = 0;
  let legalBalls = 0;
  const cumulativePoints: ChartPoint[] = [{ x: 0, y: 0 }];

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const over = Number.parseInt(String(row?.[0] || ''), 10);
    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    const outcome = computeBallOutcome(row, ex, wk);

    totalRuns += outcome.totalRuns;

    if (Number.isFinite(over) && over >= 0 && over < overRuns.length) {
      overRuns[over] += outcome.totalRuns;
      if (outcome.wicket) overWickets[over] += 1;
    }

    if (outcome.legalBall) legalBalls += 1;
    cumulativePoints.push({ x: legalBalls / 6, y: totalRuns });
  });

  return { overRuns, overWickets, cumulativePoints, totalRuns, legalBalls };
}

type CommentaryKind =
  | 'wicket'
  | 'wide'
  | 'no-ball'
  | 'bye'
  | 'leg-bye'
  | 'six'
  | 'four'
  | 'dot'
  | 'runs'
  | 'other';

type CommentaryItem = {
  rowIndex: number;
  innings: '1' | '2';
  over: number;
  ball: number;
  meta: string;
  text: string;
  kind: CommentaryKind;
  resultLabel: string;
  totalRuns: number;
};

function buildCommentaryItemsFromRows(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
  commentaryData: Record<number, string>,
  resolvePlayerName: (value: string) => string,
): CommentaryItem[] {
  const stableHash = (input: string) => {
    // FNV-1a 32-bit
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const pick = (options: string[], seed: string) => {
    if (!Array.isArray(options) || options.length === 0) return '';
    return options[stableHash(seed) % options.length] || options[0];
  };

  const formatRunWord = (n: number) => `${n} ${n === 1 ? 'run' : 'runs'}`;

  const buildFallback = (seed: string, runs: number, ex: ExtrasRow, wk: WicketRow) => {
    if (wk.hasWicket) {
      const takerName = wk.wicketTaker ? resolvePlayerName(wk.wicketTaker) : '';
      const taker = takerName ? `, ${takerName}` : '';
      const type = wk.wicketType ? ` (${wk.wicketType}${taker})` : taker ? ` (${taker.slice(2)})` : '';
      return pick(
        [`Wicket${type}.`, `Gone${type}! Big breakthrough.`, `Wicket falls${type}.`],
        `wicket:${seed}`,
      );
    }

    const lbRuns = ex.hasLB ? ex.lbRuns || 0 : 0;
    const byeRuns = ex.hasByes ? ex.byesRuns || 0 : 0;
    const wideRuns = ex.hasWide ? 1 + (ex.wideExtraRuns || 0) : 0;
    const hasNB = ex.hasNoBall;

    if (wideRuns > 0) {
      return pick(
        [`Wide called. ${formatRunWord(wideRuns)} added.`, `Sprays it wide — ${formatRunWord(wideRuns)}.`, `Down the wrong line, wide. ${formatRunWord(wideRuns)}.`],
        `wide:${seed}`,
      );
    }

    if (hasNB) {
      const base = pick(
        ['No-ball called. Free hit coming up.', 'Oversteps — no-ball. Free hit next.', 'No-ball. Extra run added.'],
        `nb:${seed}`,
      );

      if (lbRuns > 0) return `${base} Plus ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`;
      if (byeRuns > 0) return `${base} Plus ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`;
      if (runs > 0) return `${base} Plus ${formatRunWord(runs)}.`;
      return base;
    }

    if (lbRuns > 0) {
      return pick(
        [`Off the pads, ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`, `Clips the pad and they sneak ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`, `${lbRuns} leg bye${lbRuns === 1 ? '' : 's'} taken.`],
        `lb:${seed}`,
      );
    }

    if (byeRuns > 0) {
      return pick(
        [`Past the keeper, ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`, `${byeRuns} bye${byeRuns === 1 ? '' : 's'} taken.`, `They steal ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`],
        `byes:${seed}`,
      );
    }

    if (runs === 0) {
      return pick(['No run. Tidy delivery.', 'Dot ball. Good pressure.', 'Defended well — no run.'], `dot:${seed}`);
    }

    if (runs === 4) {
      return pick(['Four! Finds the boundary.', 'Cracked away for four.', 'Timed sweetly — four runs.'], `four:${seed}`);
    }

    if (runs === 6) {
      return pick(['Six! Launched into the stands.', 'That is a maximum — six.', 'Sailed over the rope for six.'], `six:${seed}`);
    }

    return pick([`They take ${formatRunWord(runs)}.`, `${formatRunWord(runs)} picked up.`, `Good running — ${formatRunWord(runs)}.`], `runs:${seed}`);
  };

  const ensureOutInDismissal = (batterName: string, text: string) => {
    const batter = String(batterName || '').trim();
    const raw = String(text || '').trim();
    if (!batter || !raw) return raw;

    const rawLower = raw.toLowerCase();
    const batterLower = batter.toLowerCase();
    if (!rawLower.startsWith(batterLower)) return raw;

    const rest = raw.slice(batter.length).trimStart();
    if (!rest) return `${batter} out`;
    if (rest.toLowerCase().startsWith('out')) return raw;
    return `${batter} out ${rest}`;
  };

  const items: CommentaryItem[] = [];

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const overRaw = Number.parseInt(String(row?.[0] || ''), 10);
    const ballRaw = Number.parseInt(String(row?.[1] || ''), 10);
    const over = Number.isFinite(overRaw) ? overRaw : 0;
    const ball = Number.isFinite(ballRaw) ? ballRaw : 0;

    const strikerKey = String(row?.[3] || '').trim();
    const nonStrikerKey = String(row?.[4] || '').trim();
    const bowlerKey = String(row?.[5] || '').trim();

    const striker = resolvePlayerName(strikerKey);
    const nonStriker = resolvePlayerName(nonStrikerKey);
    const bowler = resolvePlayerName(bowlerKey);

    const notes = String(row?.[12] || '').trim();
    const runs = Number.parseInt(String(row?.[6] || ''), 10) || 0;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
    const outcome = computeBallOutcome(row, ex, wk);

    const prefix = over || ball ? `${over}.${ball}` : '';
    const meta = `${prefix} ${bowler || 'Bowler'} to ${striker || 'Batter'}`.trim();

    const fromApi = String((commentaryData || {})[idx] || '').trim();
    const seed = `${innings}:${prefix}:${bowler}:${striker}:${idx}`;
    const bodyRaw = notes || fromApi || buildFallback(seed, runs, ex, wk);

    const outRole =
      wk.wicketType === 'Mankad (Run out at non-striker end)'
        ? 'nonStriker'
        : wk.outBatter === 'nonStriker'
          ? 'nonStriker'
          : 'striker';
    const dismissedName = outRole === 'nonStriker' ? nonStriker : striker;
    const body = wk.hasWicket ? ensureOutInDismissal(dismissedName, bodyRaw) : bodyRaw;

    let kind: CommentaryKind = 'other';
    if (wk.hasWicket) kind = 'wicket';
    else if (ex.hasWide) kind = 'wide';
    else if (ex.hasNoBall) kind = 'no-ball';
    else if (ex.hasLB && (ex.lbRuns || 0) > 0) kind = 'leg-bye';
    else if (ex.hasByes && (ex.byesRuns || 0) > 0) kind = 'bye';
    else if (outcome.batRuns === 6) kind = 'six';
    else if (outcome.batRuns === 4) kind = 'four';
    else if (outcome.batRuns === 0) kind = 'dot';
    else kind = 'runs';

    const wideRuns = ex.hasWide ? 1 + (ex.wideExtraRuns || 0) : 0;
    const resultLabel =
      kind === 'wicket'
        ? 'W'
        : kind === 'wide'
          ? wideRuns === 1
            ? 'WD'
            : `WD+${Math.max(0, wideRuns - 1)}`
          : kind === 'no-ball'
            ? outcome.totalRuns === 1
              ? 'NB'
              : `NB+${Math.max(0, outcome.totalRuns - 1)}`
            : kind === 'leg-bye'
              ? `LB${ex.lbRuns || 0}`
              : kind === 'bye'
                ? `B${ex.byesRuns || 0}`
                : kind === 'six'
                  ? '6'
                  : kind === 'four'
                    ? '4'
                    : kind === 'dot'
                      ? '0'
                      : String(outcome.batRuns || 0);

    items.push({
      rowIndex: idx,
      innings,
      over,
      ball,
      meta,
      text: body,
      kind,
      resultLabel,
      totalRuns: outcome.totalRuns,
    });
  });

  return items;
}

function buildCommentaryFromRows(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
  commentaryData: Record<number, string>,
  resolvePlayerName: (value: string) => string,
) {
  const stableHash = (input: string) => {
    // FNV-1a 32-bit
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const pick = (options: string[], seed: string) => {
    if (!Array.isArray(options) || options.length === 0) return '';
    return options[stableHash(seed) % options.length] || options[0];
  };

  const formatRunWord = (n: number) => `${n} ${n === 1 ? 'run' : 'runs'}`;

  const buildFallback = (seed: string, runs: number, ex: ExtrasRow, wk: WicketRow) => {
    if (wk.hasWicket) {
      const takerName = wk.wicketTaker ? resolvePlayerName(wk.wicketTaker) : '';
      const taker = takerName ? `, ${takerName}` : '';
      const type = wk.wicketType ? ` (${wk.wicketType}${taker})` : taker ? ` (${taker.slice(2)})` : '';
      return pick(
        [
          `Wicket${type}.`,
          `Gone${type}! Big breakthrough.`,
          `Wicket falls${type}.`,
        ],
        `wicket:${seed}`,
      );
    }

    const lbRuns = ex.hasLB ? ex.lbRuns || 0 : 0;
    const byeRuns = ex.hasByes ? ex.byesRuns || 0 : 0;
    const wideRuns = ex.hasWide ? 1 + (ex.wideExtraRuns || 0) : 0;
    const hasNB = ex.hasNoBall;

    if (wideRuns > 0) {
      return pick(
        [
          `Wide called. ${formatRunWord(wideRuns)} added.`,
          `Sprays it wide — ${formatRunWord(wideRuns)} to the batting side.`,
          `Down the wrong line, wide. ${formatRunWord(wideRuns)}.`,
        ],
        `wide:${seed}`,
      );
    }

    if (hasNB) {
      const base = pick(
        [
          'No-ball called. Free hit coming up.',
          'Oversteps — no-ball. Free hit next.',
          'No-ball. Extra run added.',
        ],
        `nb:${seed}`,
      );

      if (lbRuns > 0) return `${base} Plus ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`;
      if (byeRuns > 0) return `${base} Plus ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`;
      if (runs > 0) return `${base} Plus ${formatRunWord(runs)}.`;
      return base;
    }

    if (lbRuns > 0) {
      return pick(
        [
          `Off the pads, ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`,
          `Clips the pad and they sneak ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`,
          `${lbRuns} leg bye${lbRuns === 1 ? '' : 's'} taken.`,
        ],
        `lb:${seed}`,
      );
    }

    if (byeRuns > 0) {
      return pick(
        [
          `Past the keeper, ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`,
          `${byeRuns} bye${byeRuns === 1 ? '' : 's'} taken.`,
          `They steal ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`,
        ],
        `byes:${seed}`,
      );
    }

    if (runs === 0) {
      return pick(
        [
          'No run. Tidy delivery.',
          'Dot ball. Good pressure.',
          'Defended well — no run.',
        ],
        `dot:${seed}`,
      );
    }

    if (runs === 4) {
      return pick(
        [
          'Four! Finds the boundary.',
          'Cracked away for four.',
          'Timed sweetly — four runs.',
        ],
        `four:${seed}`,
      );
    }

    if (runs === 6) {
      return pick(
        [
          'Six! Launched into the stands.',
          'That is a maximum — six.',
          'Sailed over the rope for six.',
        ],
        `six:${seed}`,
      );
    }

    return pick(
      [
        `They take ${formatRunWord(runs)}.`,
        `${formatRunWord(runs)} picked up.`,
        `Good running — ${formatRunWord(runs)}.`,
      ],
      `runs:${seed}`,
    );
  };

  const lines: string[] = [];

  const ensureOutInDismissal = (batterName: string, text: string) => {
    const batter = String(batterName || '').trim();
    const raw = String(text || '').trim();
    if (!batter || !raw) return raw;

    const rawLower = raw.toLowerCase();
    const batterLower = batter.toLowerCase();
    if (!rawLower.startsWith(batterLower)) return raw;

    const rest = raw.slice(batter.length).trimStart();
    if (!rest) return `${batter} out`;
    if (rest.toLowerCase().startsWith('out')) return raw;
    return `${batter} out ${rest}`;
  };

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings) return;

    const over = row?.[0] || '';
    const ball = row?.[1] || '';
    const strikerKey = String(row?.[3] || '').trim();
    const nonStrikerKey = String(row?.[4] || '').trim();
    const bowlerKey = String(row?.[5] || '').trim();
    const striker = resolvePlayerName(strikerKey);
    const bowler = resolvePlayerName(bowlerKey);
    const notes = String(row?.[12] || '').trim();
    const runs = Number.parseInt(String(row?.[6] || ''), 10) || 0;

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };

    const prefix = over && ball ? `${over}.${ball}` : '';
    const headerParts: string[] = [];
    if (prefix) headerParts.push(prefix);
    if (bowler || striker) headerParts.push(`${bowler || 'Bowler'} to ${striker || 'Batter'}`);
    const header = headerParts.length ? `${headerParts.join(' ')}: ` : '';

    const fromApi = String((commentaryData || {})[idx] || '').trim();
    const seed = `${innings}:${prefix}:${bowler}:${striker}:${idx}`;
    const bodyRaw = notes || fromApi || buildFallback(seed, runs, ex, wk);
    const outRole =
      wk.wicketType === 'Mankad (Run out at non-striker end)'
        ? 'nonStriker'
        : wk.outBatter === 'nonStriker'
          ? 'nonStriker'
          : 'striker';
    const dismissedName = outRole === 'nonStriker' ? resolvePlayerName(nonStrikerKey) : striker;
    const body = wk.hasWicket ? ensureOutInDismissal(dismissedName, bodyRaw) : bodyRaw;
    const line = `${header}${body}`.trim();
    if (line) lines.push(line);
  });

  return lines;
}

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function RunsByOverChart({
  innings1,
  innings2,
  label1,
  label2,
  color1,
  color2,
  motionEnabled,
}: {
  innings1: InningsChartSeries;
  innings2: InningsChartSeries;
  label1: string;
  label2: string;
  color1: string;
  color2: string;
  motionEnabled: boolean;
}) {
  const maxRuns = Math.max(1, ...innings1.overRuns, ...innings2.overRuns);

  const barFill = (hex: string) =>
    `linear-gradient(180deg, ${hex} 0%, rgba(255,255,255,0.08) 85%, rgba(255,255,255,0.02) 100%)`;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Runs By Over</div>
          <div className="text-white/70 text-sm mt-1">Manhattan chart (both innings)</div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color1 }} />
            {label1}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color2 }} />
            {label2}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-end gap-1.5 h-40">
          {innings1.overRuns.map((_, overIdx) => {
            const r1 = innings1.overRuns[overIdx] || 0;
            const r2 = innings2.overRuns[overIdx] || 0;
            const h1 = clamp01(r1 / maxRuns) * 100;
            const h2 = clamp01(r2 / maxRuns) * 100;

            const w1 = innings1.overWickets[overIdx] || 0;
            const w2 = innings2.overWickets[overIdx] || 0;

            return (
              <div
                key={overIdx}
                className="group relative flex-1 min-w-[10px] h-full flex flex-col items-center justify-end"
                title={`Over ${overIdx}: ${label1} ${r1} (${w1}W), ${label2} ${r2} (${w2}W)`}
              >
                <div className="relative w-full h-[132px] flex items-end justify-center gap-[2px]">
                  <motion.div
                    className="w-[42%] rounded-t-lg border border-white/10"
                    style={{ background: barFill(color1) }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h1}%` }}
                    transition={motionEnabled ? { duration: 0.55, ease: 'easeOut' } : { duration: 0 }}
                  />
                  <motion.div
                    className="w-[42%] rounded-t-lg border border-white/10"
                    style={{ background: barFill(color2) }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h2}%` }}
                    transition={motionEnabled ? { duration: 0.55, ease: 'easeOut', delay: 0.02 } : { duration: 0 }}
                  />

                  {(w1 > 0 || w2 > 0) && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                      {w1 > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.65)]" />
                      )}
                      {w2 > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 shadow-[0_0_12px_rgba(248,113,113,0.55)]" />
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-bold text-white/35 tabular-nums">
                  {overIdx % 2 === 0 ? overIdx : ''}
                </div>

                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-xl border border-white/15 bg-black/70 backdrop-blur-xl px-3 py-2 text-[11px] text-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                    <div className="text-white/60 font-semibold">Over {overIdx}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color1 }} />
                        <span className="font-black">{r1}</span>
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color2 }} />
                        <span className="font-black">{r2}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
          <span>0</span>
          <span>20 overs</span>
        </div>
      </div>
    </div>
  );
}

function buildSvgLinePath(points: ChartPoint[], maxX: number, maxY: number, width = 640, height = 240, pad = 22) {
  if (!Array.isArray(points) || points.length === 0) return '';
  const safeMaxX = maxX > 0 ? maxX : 20;
  const safeMaxY = maxY > 0 ? maxY : 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const toX = (x: number) => pad + (clamp01(x / safeMaxX) * innerW);
  const toY = (y: number) => pad + innerH - (clamp01(y / safeMaxY) * innerH);

  let d = `M ${toX(points[0].x)} ${toY(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${toX(points[i].x)} ${toY(points[i].y)}`;
  }
  return d;
}

function WormChart({
  innings1,
  innings2,
  label1,
  label2,
  color1,
  color2,
  motionEnabled,
}: {
  innings1: InningsChartSeries;
  innings2: InningsChartSeries;
  label1: string;
  label2: string;
  color1: string;
  color2: string;
  motionEnabled: boolean;
}) {
  const width = 640;
  const height = 240;
  const maxX = Math.max(20, ...innings1.cumulativePoints.map((p) => p.x), ...innings2.cumulativePoints.map((p) => p.x));
  const maxY = Math.max(1, ...innings1.cumulativePoints.map((p) => p.y), ...innings2.cumulativePoints.map((p) => p.y));

  const path1 = buildSvgLinePath(innings1.cumulativePoints, maxX, maxY, width, height);
  const path2 = buildSvgLinePath(innings2.cumulativePoints, maxX, maxY, width, height);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Worm</div>
          <div className="text-white/70 text-sm mt-1">Cumulative runs over time</div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color1 }} />
            {label1}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color2 }} />
            {label2}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
          <defs>
            <linearGradient id="wormGradient1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color1} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color1} stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="wormGradient2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color2} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color2} stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* grid */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={22}
              x2={width - 22}
              y1={22 + (height - 44) * t}
              y2={22 + (height - 44) * t}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}
          {[5, 10, 15, 20].map((ov) => (
            <line
              key={ov}
              y1={22}
              y2={height - 22}
              x1={22 + ((width - 44) * ov) / 20}
              x2={22 + ((width - 44) * ov) / 20}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {path1 ? (
            <motion.path
              d={path1}
              fill="none"
              stroke="url(#wormGradient1)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.7 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={motionEnabled ? { duration: 0.9, ease: 'easeOut' } : { duration: 0 }}
              style={{ filter: `drop-shadow(0 0 14px ${color1}55)` }}
            />
          ) : null}
          {path2 ? (
            <motion.path
              d={path2}
              fill="none"
              stroke="url(#wormGradient2)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.7 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={motionEnabled ? { duration: 0.9, ease: 'easeOut', delay: 0.05 } : { duration: 0 }}
              style={{ filter: `drop-shadow(0 0 14px ${color2}55)` }}
            />
          ) : null}
        </svg>

        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
          <span>0 ov</span>
          <span>20 ov</span>
        </div>
      </div>
    </div>
  );
}

export default function LiveScorePage() {
  const { setCurrentLeague } = useLeague();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  const [activeTab, setActiveTab] = useState<LiveTabKey>('overview');
  const [commentaryFilter, setCommentaryFilter] = useState<CommentaryFilterKey>('all');
  const [commentaryOrder, setCommentaryOrder] = useState<'latest' | 'oldest'>('latest');

  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [tableState, setTableState] = useState<LiveScoreTableState>({ rows: [] });
  const [scorecardResultInfo, setScorecardResultInfo] = useState<ScorecardResultInfo | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const resolvePlayerName = useCallback(
    (value: string) => {
      const cleaned = String(value || '').trim();
      if (!cleaned) return '';
      return String(playerById.get(cleaned)?.name || cleaned).trim();
    },
    [playerById],
  );

  // Ensure IPL context on this route.
  useEffect(() => {
    setCurrentLeague('ipl');
  }, [setCurrentLeague]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingMatches(true);
      setError(null);
      try {
        const [matchesData, playersData] = await Promise.all([
          (async () => {
            const resp = await fetch('/api/matches?league=ipl', { cache: 'no-store' });
            if (!resp.ok) return [];
            const data = await resp.json();
            return Array.isArray(data) ? (data as Match[]) : [];
          })(),
          api.getPlayers(undefined, 'ipl'),
        ]);
        if (cancelled) return;

        const sorted = [...(matchesData || [])].sort((a, b) => {
          const ta = getMatchStartDate(a)?.getTime() ?? 0;
          const tb = getMatchStartDate(b)?.getTime() ?? 0;
          return ta - tb;
        });

        const preferredMatchId = searchParams.get('matchId');
        const initialId = pickDefaultMatchId(sorted, preferredMatchId);

        setMatches(sorted);
        setPlayers((playersData || []) as Player[]);
        setSelectedMatchId((prev) => prev || initialId);
      } catch (e) {
        console.error('[Live Score] Failed to load matches:', e);
        setError('Failed to load matches.');
      } finally {
        if (!cancelled) setIsLoadingMatches(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId],
  );

  useEffect(() => {
    setScorecardResultInfo(null);
    setActiveTab('overview');
    setCommentaryFilter('all');
    setCommentaryOrder('latest');
  }, [selectedMatchId]);

  const fetchLiveRows = useCallback(async (matchId: string) => {
    const resp = await fetch(`/api/ipl-live-score/save?matchId=${encodeURIComponent(matchId)}&withCommentary=1`, {
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error(`Failed to fetch live score rows (${resp.status})`);
    const data = await resp.json();

    if (Array.isArray(data?.rows)) {
      return {
        rows: data.rows as string[][],
        extrasData: (data.extrasData || {}) as Record<number, ExtrasRow>,
        wicketData: (data.wicketData || {}) as Record<number, WicketRow>,
        commentaryData: (data.commentaryData || {}) as Record<number, string>,
      };
    }

    if (Array.isArray(data)) {
      return { rows: data as string[][], extrasData: {}, wicketData: {}, commentaryData: {} };
    }

    return { rows: [], extrasData: {}, wicketData: {}, commentaryData: {} };
  }, []);

  const fetchMatchFresh = useCallback(async (matchId: string) => {
    const resp = await fetch(`/api/matches?league=ipl&id=${encodeURIComponent(matchId)}`, { cache: 'no-store' });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data && typeof data === 'object' ? (data as Match) : null;
  }, []);

  const fetchScorecardsForMatch = useCallback(async (matchId: string) => {
    const resp = await fetch(`/api/scorecards?matchId=${encodeURIComponent(matchId)}&league=ipl`, {
      cache: 'no-store',
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? (data as ScorecardDoc[]) : [];
  }, []);

  const pickBestScorecardResultInfo = useCallback((scorecards: ScorecardDoc[]) => {
    const list = Array.isArray(scorecards) ? scorecards : [];
    const normalize = (sc: ScorecardDoc) => ({
      ...sc,
      draft: Boolean(sc?.draft),
      result: {
        winner: String(sc?.result?.winner || '').trim(),
        margin: String(sc?.result?.margin || '').trim(),
        manOfTheMatch: String(sc?.result?.manOfTheMatch || '').trim(),
      },
    });

    const withResult = list.map(normalize).filter((sc) => Boolean(sc.result?.winner));
    if (withResult.length === 0) return null;

    const published = withResult.find((sc) => sc.draft === false);
    const best = published || withResult[0];
    const id = String(best?.id || '').trim();

    return {
      scorecardId: id || 'scorecard',
      draft: Boolean(best?.draft),
      winner: best.result?.winner || '',
      margin: best.result?.margin || '',
      manOfTheMatch: best.result?.manOfTheMatch || '',
    } satisfies ScorecardResultInfo;
  }, []);

  const refresh = useCallback(async (mode: 'auto' | 'manual' = 'auto') => {
    if (!selectedMatchId) return;

    const firstLoad = lastFetchAt === null;
    if (firstLoad) setIsLoadingScore(true);
    if (!firstLoad && mode === 'manual') setIsRefreshing(true);

    setError(null);
    try {
      const [next, freshMatch, scorecards] = await Promise.all([
        fetchLiveRows(selectedMatchId),
        fetchMatchFresh(selectedMatchId),
        fetchScorecardsForMatch(selectedMatchId),
      ]);

      setTableState(next);
      if (freshMatch) {
        setMatches((prev) => prev.map((m) => (m.id === freshMatch.id ? freshMatch : m)));
      }
      const bestResultInfo = pickBestScorecardResultInfo(scorecards);
      setScorecardResultInfo(bestResultInfo);
      setLastFetchAt(Date.now());
    } catch (e) {
      console.error('[Live Score] Failed to load live rows:', e);
      setError('Failed to load live score data.');
    } finally {
      if (firstLoad) setIsLoadingScore(false);
      if (!firstLoad && mode === 'manual') setIsRefreshing(false);
    }
  }, [
    fetchLiveRows,
    fetchMatchFresh,
    fetchScorecardsForMatch,
    lastFetchAt,
    pickBestScorecardResultInfo,
    selectedMatchId,
  ]);

  useEffect(() => {
    if (!selectedMatchId) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await refresh('auto');
    };

    tick();
    const interval = setInterval(tick, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh, selectedMatchId]);

  const computedResultText = useMemo(() => {
    if (!selectedMatch) return '';

    const fromMatch = String(selectedMatch.result || '').trim();
    if (fromMatch) return fromMatch;

    const winnerRaw = String(scorecardResultInfo?.winner || '').trim();
    if (!winnerRaw) return '';

    const margin = String(scorecardResultInfo?.margin || '').trim();
    const lower = winnerRaw.toLowerCase();

    if (lower === 'no result' || lower === 'abandoned' || lower === 'match abandoned') {
      return margin ? `No result • ${margin}` : 'No result';
    }
    if (lower === 'match tied' || lower === 'tie') {
      return margin ? `Match tied • ${margin}` : 'Match tied';
    }

    const team1Name = String(selectedMatch.team1?.name || '').trim();
    const team2Name = String(selectedMatch.team2?.name || '').trim();
    const team1Short = String(selectedMatch.team1?.shortName || team1Name).trim() || 'Team 1';
    const team2Short = String(selectedMatch.team2?.shortName || team2Name).trim() || 'Team 2';

    const winner =
      winnerRaw === team1Name ? team1Short : winnerRaw === team2Name ? team2Short : winnerRaw;

    return margin ? `${winner} won by ${margin}` : `${winner} won`;
  }, [scorecardResultInfo, selectedMatch]);

  const isMatchComplete = useMemo(() => {
    if (!selectedMatch) return false;
    if (selectedMatch.status === 'completed') return true;
    if (selectedMatch.matchState?.currentState === 'complete') return true;
    return Boolean(computedResultText);
  }, [computedResultText, selectedMatch]);

  const derived = useMemo(() => {
    if (!selectedMatch) return null;

    const rows = Array.isArray(tableState.rows) ? tableState.rows : [];
    const extrasData = (tableState.extrasData || {}) as Record<number, ExtrasRow>;
    const wicketData = (tableState.wicketData || {}) as Record<number, WicketRow>;
    const commentaryData = (tableState.commentaryData || {}) as Record<number, string>;

    const innings1 = calculateInningsTotals(rows, extrasData, wicketData, '1');
    const innings2 = calculateInningsTotals(rows, extrasData, wicketData, '2');
    const innings1ExtrasBreakdown = calculateExtrasBreakdown(rows, extrasData, wicketData, '1');
    const innings2ExtrasBreakdown = calculateExtrasBreakdown(rows, extrasData, wicketData, '2');
    const innings1BattingLeaders = buildBattingLeaders(rows, extrasData, wicketData, '1', resolvePlayerName);
    const innings2BattingLeaders = buildBattingLeaders(rows, extrasData, wicketData, '2', resolvePlayerName);

    const innings1BattingKey = getBattingTeamKeyForInnings(selectedMatch, '1');
    const team1Totals = innings1BattingKey === 'team1' ? innings1 : innings2;
    const team2Totals = innings1BattingKey === 'team1' ? innings2 : innings1;

    const hasInnings2 = rows.some((r) => String(r?.[2] || '') === '2');
    const currentInnings: '1' | '2' = hasInnings2 ? '2' : '1';
    const battingTeamKey = getBattingTeamKeyForInnings(selectedMatch, currentInnings);

    const last = getLastRowForInnings(rows, currentInnings);
    const strikerKey = String(last?.row?.[3] || '').trim();
    const nonStrikerKey = String(last?.row?.[4] || '').trim();
    const bowlerKey = String(last?.row?.[5] || '').trim();

    const striker = strikerKey
      ? { id: strikerKey, name: resolvePlayerName(strikerKey), ...computeBatterStats(rows, extrasData, wicketData, currentInnings, strikerKey) }
      : { id: '', name: '', runs: 0, balls: 0 };

    const nonStriker = nonStrikerKey
      ? { id: nonStrikerKey, name: resolvePlayerName(nonStrikerKey), ...computeBatterStats(rows, extrasData, wicketData, currentInnings, nonStrikerKey) }
      : { id: '', name: '', runs: 0, balls: 0 };

    const bowler = bowlerKey
      ? { id: bowlerKey, name: resolvePlayerName(bowlerKey), ...computeBowlerStats(rows, extrasData, wicketData, currentInnings, bowlerKey) }
      : { id: '', name: '', runs: 0, legalBalls: 0, overs: '0.0' };

    const innings1Commentary = buildCommentaryItemsFromRows(
      rows,
      extrasData,
      wicketData,
      '1',
      commentaryData,
      resolvePlayerName,
    );
    const innings2Commentary = buildCommentaryItemsFromRows(
      rows,
      extrasData,
      wicketData,
      '2',
      commentaryData,
      resolvePlayerName,
    );

    const lastSix = (currentInnings === '1' ? innings1Commentary : innings2Commentary).slice(-6);

    const innings1Series = buildInningsChartSeries(rows, extrasData, wicketData, '1');
    const innings2Series = buildInningsChartSeries(rows, extrasData, wicketData, '2');

    const isChase = currentInnings === '2' && (innings2.legalBalls > 0 || hasInnings2);
    const target = isChase ? innings1.teamTotal + 1 : null;
    const remainingBalls = isChase ? Math.max(0, 120 - innings2.legalBalls) : null;
    const needed = isChase && target !== null ? Math.max(0, target - innings2.teamTotal) : null;
    const requiredRate =
      isChase && needed !== null && remainingBalls !== null && remainingBalls > 0
        ? ((needed / remainingBalls) * 6).toFixed(2)
        : null;

    return {
      rowsCount: rows.length,
      currentInnings,
      battingTeamKey,
      innings1BattingKey,
      innings1,
      innings2,
      innings1ExtrasBreakdown,
      innings2ExtrasBreakdown,
      innings1BattingLeaders,
      innings2BattingLeaders,
      team1Totals,
      team2Totals,
      striker,
      nonStriker,
      bowler,
      innings1Commentary,
      innings2Commentary,
      lastSix,
      innings1Series,
      innings2Series,
      target,
      remainingBalls,
      needed,
      requiredRate,
    };
  }, [resolvePlayerName, selectedMatch, tableState]);

  const matchStart = useMemo(() => (selectedMatch ? getMatchStartDate(selectedMatch) : null), [selectedMatch]);
  const matchCenterHref = useMemo(() => {
    if (!selectedMatch) return null;
    const encodedId = encodeURIComponent(selectedMatch.id);
    const params = new URLSearchParams({ league: 'ipl', date: selectedMatch.date, team1Id: selectedMatch.team1.id, team2Id: selectedMatch.team2.id });
    return `/matches/${encodedId}?${params.toString()}`;
  }, [selectedMatch]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Oil-canvas background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: LIVE_SCORE_OIL_THEME.base }} />
        <div className="absolute inset-0" style={{ background: LIVE_SCORE_OIL_THEME.hazeA, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0" style={{ background: LIVE_SCORE_OIL_THEME.hazeB, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0 opacity-[0.16]" style={{ background: LIVE_SCORE_OIL_THEME.conic, mixBlendMode: 'screen' }} />

        <motion.div
          className="absolute left-1/2 top-1/2 w-[1100px] h-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-3xl"
          style={{ background: LIVE_SCORE_OIL_THEME.ring, mixBlendMode: 'screen' }}
          animate={motionEnabled ? { rotate: [0, 360] } : { rotate: 0 }}
          transition={motionEnabled ? { duration: 55, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        />

        <motion.div
          className="absolute -top-28 left-[-14%] w-[72%] h-[38%] rounded-[120px] blur-2xl opacity-80"
          style={{ background: LIVE_SCORE_OIL_THEME.brush, transform: 'rotate(-10deg)' }}
          animate={motionEnabled ? { x: [0, 12, 0], y: [0, -10, 0] } : { x: 0, y: 0 }}
          transition={motionEnabled ? { duration: 22, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
        />
        <motion.div
          className="absolute -bottom-24 right-[-12%] w-[70%] h-[36%] rounded-[120px] blur-2xl opacity-70"
          style={{ background: LIVE_SCORE_OIL_THEME.brush, transform: 'rotate(8deg)' }}
          animate={motionEnabled ? { x: [0, -12, 0], y: [0, 10, 0] } : { x: 0, y: 0 }}
          transition={motionEnabled ? { duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } : { duration: 0 }}
        />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'soft-light',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.26) 62%, rgba(2,6,23,0.62) 100%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: OIL_NOISE_BG, mixBlendMode: 'overlay' }} />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] opacity-80" style={{ background: LIVE_SCORE_OIL_THEME.accentLine }} />

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                IPL{' '}
                <GradientText gradient="from-cyan-300 via-purple-300 to-amber-300" animate={motionEnabled}>
                  Live Score
                </GradientText>
              </h1>
              <p className="text-white/70 mt-2 leading-relaxed max-w-xl">
                Live ball-by-ball, running scores, and key match moments — refreshed every few seconds.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refresh('manual')}
                disabled={!selectedMatchId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-60 border border-white/15 text-white text-sm font-semibold transition-colors"
                title="Refresh now"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {lastFetchAt && (
                <div className="text-xs text-white/60 whitespace-nowrap">
                  Updated {new Date(lastFetchAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
            <div>
              <label className="block text-xs font-black text-white/70 uppercase tracking-[0.22em] mb-2">
                Select match
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                disabled={isLoadingMatches || matches.length === 0}
                className="w-full px-4 py-3 rounded-2xl bg-black/30 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-white/25 disabled:opacity-60"
              >
                {isLoadingMatches ? (
                  <option value="">Loading matches…</option>
                ) : matches.length === 0 ? (
                  <option value="">No matches yet</option>
                ) : null}

                <optgroup label="Live">
                  {matches
                    .filter((m) => m.status === 'live')
                    .map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0b0f1a]">
                        {m.team1.shortName} vs {m.team2.shortName} • {m.date} {m.time}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Upcoming">
                  {matches
                    .filter((m) => m.status === 'upcoming')
                    .map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0b0f1a]">
                        {m.team1.shortName} vs {m.team2.shortName} • {m.date} {m.time}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Completed">
                  {matches
                    .filter((m) => m.status === 'completed')
                    .map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0b0f1a]">
                        {m.team1.shortName} vs {m.team2.shortName} • {m.date}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {selectedMatch ? (
              <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
                    Match info
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-white/70">
                    <span
                      className={`inline-flex items-center gap-2 ${
                        !isMatchComplete && selectedMatch.status === 'live' ? 'text-emerald-200' : 'text-white/70'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !isMatchComplete && selectedMatch.status === 'live'
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-white/30'
                        }`}
                      />
                      <span className="capitalize">{isMatchComplete ? 'completed' : selectedMatch.status}</span>
                    </span>
                  </div>
                </div>

                {computedResultText && (
                  <div className="mt-3 inline-flex items-start gap-2 text-amber-200/90">
                    <Trophy className="w-4 h-4 mt-[1px]" />
                    <span className="text-sm font-semibold leading-snug">{computedResultText}</span>
                  </div>
                )}

                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/60" />
                    <span className="min-w-0 truncate">{selectedMatch.venue}</span>
                  </div>
                  {matchStart && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/60" />
                      <span>{matchStart.toLocaleString()}</span>
                    </div>
                  )}
                  {matchCenterHref && (
                    <Link
                      href={matchCenterHref}
                      prefetch={false}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 hover:text-cyan-100 transition-colors"
                    >
                      Open match center →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Select a match to see the live score.
              </div>
            )}
          </div>
        </motion.div>

        {isLoadingMatches ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-3xl p-6 bg-black/25 border border-white/10 text-white/80 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
            No IPL matches found yet.
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-100 mb-6">
                {error}
              </div>
            )}

            {isLoadingScore || !selectedMatch || !derived ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {computedResultText && (
                  <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-amber-500/10 p-5 md:p-6 mb-6">
                    <div
                      className="absolute inset-x-0 top-0 h-[2px] opacity-70"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(251,191,36,0.85), rgba(34,211,238,0.45), rgba(168,85,247,0.55))',
                      }}
                    />
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-100/80 mb-2">
                      Match Result
                    </div>
                    <div className="text-white text-lg md:text-xl font-black tracking-tight">{computedResultText}</div>
                    {scorecardResultInfo?.manOfTheMatch ? (
                      <div className="text-sm text-white/70 mt-1">
                        Man of the Match:{' '}
                        <span className="text-white font-semibold">{scorecardResultInfo.manOfTheMatch}</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Sticky mini scoreboard + tabs */}
                <div className="sticky top-16 md:top-20 z-40 mb-6">
                  <div className="rounded-3xl border border-white/15 bg-black/35 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/80 font-black">{selectedMatch.team1.shortName}</span>
                        <span className="text-white font-black tabular-nums">
                          {derived.team1Totals.teamTotal}/{derived.team1Totals.wickets}
                        </span>
                        <span className="text-white/30 font-black">vs</span>
                        <span className="text-white/80 font-black">{selectedMatch.team2.shortName}</span>
                        <span className="text-white font-black tabular-nums">
                          {derived.team2Totals.teamTotal}/{derived.team2Totals.wickets}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 sm:text-right">
                        {computedResultText
                          ? computedResultText
                          : isMatchComplete
                            ? 'Completed'
                            : `Innings ${derived.currentInnings}`}
                      </div>
                    </div>

                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'overview', label: 'Overview', icon: Zap },
                          { key: 'commentary', label: 'Commentary', icon: MessageSquare },
                          { key: 'stats', label: 'Stats', icon: BarChart3 },
                          { key: 'scorecard', label: 'Scorecard', icon: Table2 },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.key;
                          return (
                            <motion.button
                              key={tab.key}
                              type="button"
                              onClick={() => setActiveTab(tab.key as LiveTabKey)}
                              whileHover={motionEnabled ? { y: -2 } : {}}
                              whileTap={motionEnabled ? { scale: 0.98 } : {}}
                              className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-sm font-black transition-colors ${
                                isActive
                                  ? 'text-white border-white/20'
                                  : 'text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="live-score-tab-indicator"
                                  className="absolute inset-0 rounded-2xl bg-white/10 border border-white/15"
                                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                />
                              )}
                              <span className="relative z-10 inline-flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {tab.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'overview' ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <motion.div
                          className={`relative overflow-hidden rounded-3xl p-5 md:p-6 border backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] ${
                            !isMatchComplete && derived.battingTeamKey === 'team1'
                              ? 'bg-cyan-500/10 border-cyan-300/30'
                              : 'bg-black/25 border-white/10'
                          }`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-[2px] opacity-70"
                            style={{
                              background: `linear-gradient(90deg, ${selectedMatch.team1?.colors?.primary || '#22d3ee'}, ${
                                selectedMatch.team1?.colors?.secondary || '#a855f7'
                              })`,
                            }}
                          />
                          <div className="flex items-center gap-4">
                            <ModernTeamLogo
                              teamId={selectedMatch.team1.id}
                              shortName={selectedMatch.team1.shortName}
                              league="ipl"
                              size={56}
                              showHover={false}
                            />
                            <div className="flex-1">
                              <div className="text-white/70 text-xs font-semibold">{selectedMatch.team1.name}</div>
                              <div className="text-white text-3xl md:text-4xl font-black tracking-tight">
                                {derived.team1Totals.teamTotal}/{derived.team1Totals.wickets}
                              </div>
                              <div className="text-white/70 text-sm">
                                {derived.team1Totals.overs} ov • RR {derived.team1Totals.runRate}
                              </div>
                              {!isMatchComplete && derived.battingTeamKey === 'team1' && derived.lastSix.length > 0 ? (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  {derived.lastSix.map((item) => {
                                    const kind = item.kind;
                                    const chip =
                                      kind === 'wicket'
                                        ? 'bg-red-500/25 border-red-400/35 text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.35)]'
                                        : kind === 'six' || kind === 'four'
                                          ? 'bg-cyan-500/20 border-cyan-300/25 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                                          : kind === 'wide'
                                            ? 'bg-purple-500/20 border-purple-300/25 text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.22)]'
                                            : kind === 'no-ball'
                                              ? 'bg-amber-500/20 border-amber-300/25 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.22)]'
                                              : 'bg-white/10 border-white/15 text-white/90';

                                    return (
                                      <span
                                        key={`${item.rowIndex}-${item.meta}`}
                                        className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-2xl border text-[11px] font-black tracking-widest ${chip}`}
                                        title={item.meta}
                                      >
                                        {item.resultLabel}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                            {!isMatchComplete && derived.battingTeamKey === 'team1' && (
                              <div className="text-[11px] font-black uppercase tracking-widest text-cyan-100 bg-cyan-500/15 border border-cyan-300/25 px-2.5 py-1 rounded-full">
                                Batting now
                              </div>
                            )}
                          </div>
                        </motion.div>

                        <motion.div
                          className={`relative overflow-hidden rounded-3xl p-5 md:p-6 border backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] ${
                            !isMatchComplete && derived.battingTeamKey === 'team2'
                              ? 'bg-cyan-500/10 border-cyan-300/30'
                              : 'bg-black/25 border-white/10'
                          }`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.06 }}
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-[2px] opacity-70"
                            style={{
                              background: `linear-gradient(90deg, ${selectedMatch.team2?.colors?.primary || '#22d3ee'}, ${
                                selectedMatch.team2?.colors?.secondary || '#a855f7'
                              })`,
                            }}
                          />
                          <div className="flex items-center gap-4">
                            <ModernTeamLogo
                              teamId={selectedMatch.team2.id}
                              shortName={selectedMatch.team2.shortName}
                              league="ipl"
                              size={56}
                              showHover={false}
                            />
                            <div className="flex-1">
                              <div className="text-white/70 text-xs font-semibold">{selectedMatch.team2.name}</div>
                              <div className="text-white text-3xl md:text-4xl font-black tracking-tight">
                                {derived.team2Totals.teamTotal}/{derived.team2Totals.wickets}
                              </div>
                              <div className="text-white/70 text-sm">
                                {derived.team2Totals.overs} ov • RR {derived.team2Totals.runRate}
                              </div>
                              {!isMatchComplete && derived.battingTeamKey === 'team2' && derived.lastSix.length > 0 ? (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  {derived.lastSix.map((item) => {
                                    const kind = item.kind;
                                    const chip =
                                      kind === 'wicket'
                                        ? 'bg-red-500/25 border-red-400/35 text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.35)]'
                                        : kind === 'six' || kind === 'four'
                                          ? 'bg-cyan-500/20 border-cyan-300/25 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                                          : kind === 'wide'
                                            ? 'bg-purple-500/20 border-purple-300/25 text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.22)]'
                                            : kind === 'no-ball'
                                              ? 'bg-amber-500/20 border-amber-300/25 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.22)]'
                                              : 'bg-white/10 border-white/15 text-white/90';

                                    return (
                                      <span
                                        key={`${item.rowIndex}-${item.meta}`}
                                        className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-2xl border text-[11px] font-black tracking-widest ${chip}`}
                                        title={item.meta}
                                      >
                                        {item.resultLabel}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                            {!isMatchComplete && derived.battingTeamKey === 'team2' && (
                              <div className="text-[11px] font-black uppercase tracking-widest text-cyan-100 bg-cyan-500/15 border border-cyan-300/25 px-2.5 py-1 rounded-full">
                                Batting now
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">
                            Current
                          </div>
                          {isMatchComplete ? (
                            <div className="text-sm text-white/60">Match completed.</div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70 text-sm">Striker</span>
                                <div className="text-white font-semibold text-sm text-right">
                                  {derived.striker.name || '—'}{' '}
                                  {derived.striker.name ? (
                                    <span className="text-white/70 font-medium">
                                      {derived.striker.runs}({derived.striker.balls})
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70 text-sm">Non-striker</span>
                                <div className="text-white font-semibold text-sm text-right">
                                  {derived.nonStriker.name || '—'}{' '}
                                  {derived.nonStriker.name ? (
                                    <span className="text-white/70 font-medium">
                                      {derived.nonStriker.runs}({derived.nonStriker.balls})
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70 text-sm">Bowler</span>
                                <div className="text-white font-semibold text-sm text-right">
                                  {derived.bowler.name || '—'}{' '}
                                  {derived.bowler.name ? (
                                    <span className="text-white/70 font-medium">
                                      {derived.bowler.runs} runs • {derived.bowler.overs} ov
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">
                            Innings
                          </div>
                          <div className="text-white text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-white/70">Current</span>
                              <span className="font-semibold">Innings {derived.currentInnings}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl p-3 bg-black/25 border border-white/10">
                                <div className="text-xs text-white/60 font-semibold mb-1">1st inns</div>
                                <div className="text-white font-black">
                                  {derived.innings1.teamTotal}/{derived.innings1.wickets}
                                </div>
                                <div className="text-xs text-white/60">{derived.innings1.overs} ov</div>
                              </div>
                              <div className="rounded-2xl p-3 bg-black/25 border border-white/10">
                                <div className="text-xs text-white/60 font-semibold mb-1">2nd inns</div>
                                <div className="text-white font-black">
                                  {derived.innings2.teamTotal}/{derived.innings2.wickets}
                                </div>
                                <div className="text-xs text-white/60">{derived.innings2.overs} ov</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">
                            Chase
                          </div>
                          {isMatchComplete ? (
                            <div className="text-sm text-white/60">Final scores locked in.</div>
                          ) : derived.target ? (
                            <div className="space-y-3 text-sm text-white">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70">Target</span>
                                <span className="font-semibold">{derived.target}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70">Needed</span>
                                <span className="font-semibold">{derived.needed}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70">Balls left</span>
                                <span className="font-semibold">{derived.remainingBalls}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-white/70">Req RR</span>
                                <span className="font-semibold">{derived.requiredRate ?? '—'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-white/60">
                              Chase metrics appear once the 2nd innings starts.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'commentary' ? (
                    <motion.div
                      key="commentary"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                              Ball-by-ball
                            </div>
                            <div className="text-white/70 text-sm mt-1">Every delivery from both innings.</div>
                          </div>
                          <div className="text-xs text-white/60">{derived.rowsCount} entries</div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'all', label: 'All' },
                              { key: 'wickets', label: 'Wickets' },
                              { key: 'boundaries', label: '4s/6s' },
                              { key: 'extras', label: 'Extras' },
                            ].map((filter) => {
                              const isActive = commentaryFilter === filter.key;
                              return (
                                <button
                                  key={filter.key}
                                  type="button"
                                  onClick={() => setCommentaryFilter(filter.key as CommentaryFilterKey)}
                                  className={`px-3 py-1.5 rounded-2xl text-xs font-black border transition-colors ${
                                    isActive
                                      ? 'text-white border-white/20 bg-white/10'
                                      : 'text-white/70 border-white/10 bg-black/20 hover:border-white/20 hover:text-white'
                                  }`}
                                >
                                  {filter.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2">
                            {[
                              { key: 'latest', label: 'Latest' },
                              { key: 'oldest', label: 'Oldest' },
                            ].map((opt) => {
                              const isActive = commentaryOrder === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => setCommentaryOrder(opt.key as 'latest' | 'oldest')}
                                  className={`px-3 py-1.5 rounded-2xl text-xs font-black border transition-colors ${
                                    isActive
                                      ? 'text-white border-white/20 bg-white/10'
                                      : 'text-white/70 border-white/10 bg-black/20 hover:border-white/20 hover:text-white'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {derived.innings1Commentary.length === 0 && derived.innings2Commentary.length === 0 ? (
                          <div className="text-white/60 text-sm">
                            No ball-by-ball updates yet. Once the scorer saves deliveries, they will appear here.
                          </div>
                        ) : (
                          (() => {
                            const latestFirst = commentaryOrder === 'latest';
                            const matchesFilter = (item: CommentaryItem) => {
                              if (commentaryFilter === 'all') return true;
                              if (commentaryFilter === 'wickets') return item.kind === 'wicket';
                              if (commentaryFilter === 'boundaries') return item.kind === 'four' || item.kind === 'six';
                              if (commentaryFilter === 'extras') {
                                return (
                                  item.kind === 'wide' ||
                                  item.kind === 'no-ball' ||
                                  item.kind === 'bye' ||
                                  item.kind === 'leg-bye'
                                );
                              }
                              return true;
                            };

                            const groupByOver = (items: CommentaryItem[], series: InningsChartSeries) => {
                              const filtered = items.filter(matchesFilter);
                              const map = new Map<number, CommentaryItem[]>();
                              filtered.forEach((item) => {
                                const key = Number.isFinite(item.over) ? item.over : 0;
                                const list = map.get(key) || [];
                                list.push(item);
                                map.set(key, list);
                              });

                              const overs = Array.from(map.keys()).sort((a, b) => (latestFirst ? b - a : a - b));
                              return overs.map((over) => {
                                const list = (map.get(over) || []).slice().sort((a, b) => a.rowIndex - b.rowIndex);
                                if (latestFirst) list.reverse();
                                return {
                                  over,
                                  runs: series.overRuns[over] || 0,
                                  wickets: series.overWickets[over] || 0,
                                  items: list,
                                };
                              });
                            };

                            const styleForKind = (kind: CommentaryKind) => {
                              if (kind === 'wicket') return { pill: 'bg-red-500/20 border-red-400/35 text-red-100', card: 'border-red-400/20 bg-red-500/10' };
                              if (kind === 'six' || kind === 'four') return { pill: 'bg-cyan-500/20 border-cyan-300/25 text-cyan-100', card: 'border-cyan-300/20 bg-cyan-500/10' };
                              if (kind === 'wide') return { pill: 'bg-purple-500/20 border-purple-300/25 text-purple-100', card: 'border-purple-300/20 bg-purple-500/10' };
                              if (kind === 'no-ball') return { pill: 'bg-amber-500/20 border-amber-300/25 text-amber-100', card: 'border-amber-300/20 bg-amber-500/10' };
                              if (kind === 'bye' || kind === 'leg-bye') return { pill: 'bg-slate-500/20 border-slate-300/20 text-slate-100', card: 'border-slate-300/15 bg-slate-500/10' };
                              if (kind === 'dot') return { pill: 'bg-white/10 border-white/15 text-white', card: 'border-white/10 bg-black/20' };
                              return { pill: 'bg-white/10 border-white/15 text-white', card: 'border-white/10 bg-black/20' };
                            };

                            const renderOverBlock = (group: { over: number; runs: number; wickets: number; items: CommentaryItem[] }) => (
                              <div key={`over-${group.over}`} className="rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                                  <div className="text-sm font-black text-white">Over {group.over}</div>
                                  <div className="text-xs text-white/60 tabular-nums">
                                    {group.runs} runs • {group.wickets}W
                                  </div>
                                </div>
                                <ul className="p-3 space-y-2">
                                  {group.items.map((item) => {
                                    const style = styleForKind(item.kind);
                                    return (
                                      <motion.li
                                        key={`${item.rowIndex}-${item.meta}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={motionEnabled ? { duration: 0.22, ease: 'easeOut' } : { duration: 0 }}
                                        className={`rounded-2xl border ${style.card} px-3.5 py-3`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div
                                            className={`shrink-0 mt-0.5 w-12 h-9 rounded-2xl border ${style.pill} flex items-center justify-center text-[11px] font-black tracking-widest`}
                                          >
                                            {item.resultLabel}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] text-white/55 font-semibold truncate">
                                              {item.meta}
                                            </div>
                                            <div className="text-white/90 text-sm leading-relaxed mt-1">
                                              {item.text}
                                            </div>
                                          </div>
                                          <div className="text-[11px] text-white/45 tabular-nums mt-1">
                                            +{item.totalRuns}
                                          </div>
                                        </div>
                                      </motion.li>
                                    );
                                  })}
                                </ul>
                              </div>
                            );

                            const innings1Groups = groupByOver(derived.innings1Commentary, derived.innings1Series);
                            const innings2Groups = groupByOver(derived.innings2Commentary, derived.innings2Series);

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="text-xs font-black text-white/70 uppercase tracking-widest">
                                      Innings 1
                                    </div>
                                    <div className="text-xs text-white/60">
                                      {derived.innings1Commentary.filter(matchesFilter).length} balls
                                    </div>
                                  </div>
                                  {innings1Groups.length === 0 ? (
                                    <div className="text-sm text-white/60">No deliveries for this filter.</div>
                                  ) : (
                                    <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
                                      {innings1Groups.map(renderOverBlock)}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="text-xs font-black text-white/70 uppercase tracking-widest">
                                      Innings 2
                                    </div>
                                    <div className="text-xs text-white/60">
                                      {derived.innings2Commentary.filter(matchesFilter).length} balls
                                    </div>
                                  </div>
                                  {derived.innings2Commentary.length === 0 ? (
                                    <div className="text-sm text-white/60">2nd innings hasn&apos;t started yet.</div>
                                  ) : innings2Groups.length === 0 ? (
                                    <div className="text-sm text-white/60">No deliveries for this filter.</div>
                                  ) : (
                                    <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
                                      {innings2Groups.map(renderOverBlock)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </motion.div>
                  ) : activeTab === 'stats' ? (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.28 }}
                    >
                      {(() => {
                        const innings1Team = derived.innings1BattingKey === 'team1' ? selectedMatch.team1 : selectedMatch.team2;
                        const innings2Team = derived.innings1BattingKey === 'team1' ? selectedMatch.team2 : selectedMatch.team1;
                        const label1 = innings1Team?.shortName || 'Innings 1';
                        const label2 = innings2Team?.shortName || 'Innings 2';
                        const color1 = innings1Team?.colors?.primary || '#22d3ee';
                        const color2 = innings2Team?.colors?.primary || '#a855f7';

                        const currentRR = Number.parseFloat(String(derived.innings2.runRate || '0')) || 0;
                        const requiredRR = derived.requiredRate ? Number.parseFloat(String(derived.requiredRate)) || 0 : 0;
                        const rrMax = Math.max(currentRR, requiredRR, 0.01);
                        const currentPct = clamp01(currentRR / rrMax) * 100;
                        const requiredPct = clamp01(requiredRR / rrMax) * 100;
                        const rrDelta = currentRR - requiredRR;
                        const rrHint =
                          derived.requiredRate && derived.currentInnings === '2'
                            ? rrDelta >= 0
                              ? `Ahead by ${rrDelta.toFixed(2)}`
                              : `Behind by ${Math.abs(rrDelta).toFixed(2)}`
                            : '';

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <RunsByOverChart
                                innings1={derived.innings1Series}
                                innings2={derived.innings2Series}
                                label1={label1}
                                label2={label2}
                                color1={color1}
                                color2={color2}
                                motionEnabled={motionEnabled}
                              />
                              <WormChart
                                innings1={derived.innings1Series}
                                innings2={derived.innings2Series}
                                label1={label1}
                                label2={label2}
                                color1={color1}
                                color2={color2}
                                motionEnabled={motionEnabled}
                              />
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6">
                              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                                    Momentum
                                  </div>
                                  <div className="text-white/70 text-sm mt-1">
                                    Current run rate vs required (when chasing)
                                  </div>
                                </div>
                                {rrHint ? (
                                  <div className="text-sm font-black text-white">{rrHint}</div>
                                ) : (
                                  <div className="text-sm text-white/50">—</div>
                                )}
                              </div>

                              {derived.requiredRate && derived.currentInnings === '2' ? (
                                <div className="mt-5 space-y-3">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                      <div className="text-xs text-white/60 font-semibold">Current RR</div>
                                      <div className="text-white font-black tabular-nums mt-1">{currentRR.toFixed(2)}</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                      <div className="text-xs text-white/60 font-semibold">Required RR</div>
                                      <div className="text-white font-black tabular-nums mt-1">{requiredRR.toFixed(2)}</div>
                                    </div>
                                  </div>

                                  <div className="rounded-full h-3 bg-white/10 overflow-hidden border border-white/10">
                                    <div className="relative h-full">
                                      <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{
                                          width: `${currentPct}%`,
                                          background: `linear-gradient(90deg, ${color2}, ${color1})`,
                                          boxShadow: `0 0 18px ${color1}55`,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${currentPct}%` }}
                                        transition={motionEnabled ? { duration: 0.7, ease: 'easeOut' } : { duration: 0 }}
                                      />
                                      <div
                                        className="absolute inset-y-0 left-0 border-r border-white/30"
                                        style={{ width: `${requiredPct}%` }}
                                        title="Required RR marker"
                                      />
                                    </div>
                                  </div>
                                  <div className="text-xs text-white/50">
                                    The marker shows the required RR; the glow shows the current RR.
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-5 text-sm text-white/60">
                                  Momentum activates once the chase begins.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="scorecard"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.28 }}
                    >
                      {(() => {
                        const innings1Team =
                          derived.innings1BattingKey === 'team1' ? selectedMatch.team1 : selectedMatch.team2;
                        const innings2Team =
                          derived.innings1BattingKey === 'team1' ? selectedMatch.team2 : selectedMatch.team1;

                        const ex1 = derived.innings1ExtrasBreakdown;
                        const ex2 = derived.innings2ExtrasBreakdown;
                        const extras1 = (ex1?.wides || 0) + (ex1?.noBalls || 0) + (ex1?.byes || 0) + (ex1?.legByes || 0);
                        const extras2 = (ex2?.wides || 0) + (ex2?.noBalls || 0) + (ex2?.byes || 0) + (ex2?.legByes || 0);

                        const renderBattingTable = (leaders: BattingLeader[]) => {
                          const list = Array.isArray(leaders) ? leaders : [];
                          if (list.length === 0) {
                            return <div className="text-sm text-white/60 p-4">No batting entries yet.</div>;
                          }

                          return (
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                              <table className="w-full text-sm">
                                <thead className="bg-white/5">
                                  <tr>
                                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60">
                                      Batter
                                    </th>
                                    <th className="text-right px-3 py-3 text-xs font-black uppercase tracking-widest text-white/60">
                                      R
                                    </th>
                                    <th className="text-right px-3 py-3 text-xs font-black uppercase tracking-widest text-white/60">
                                      B
                                    </th>
                                    <th className="text-right px-3 py-3 text-xs font-black uppercase tracking-widest text-white/60">
                                      4s
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60">
                                      6s
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                  {list.slice(0, 11).map((b) => (
                                    <tr key={b.playerId} className="hover:bg-white/5 transition-colors">
                                      <td className="px-4 py-3 text-white/90 font-semibold">{b.name}</td>
                                      <td className="px-3 py-3 text-right text-white font-black tabular-nums">{b.runs}</td>
                                      <td className="px-3 py-3 text-right text-white/80 font-semibold tabular-nums">{b.balls}</td>
                                      <td className="px-3 py-3 text-right text-white/70 font-semibold tabular-nums">{b.fours}</td>
                                      <td className="px-4 py-3 text-right text-white/70 font-semibold tabular-nums">{b.sixes}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                                      Innings 1 • {innings1Team?.shortName || 'Team'}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1">
                                      {derived.innings1.overs} ov • Extras {extras1}{' '}
                                      <span className="text-white/40">
                                        (WD {ex1.wides}, NB {ex1.noBalls}, B {ex1.byes}, LB {ex1.legByes})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-white text-2xl font-black tabular-nums">
                                    {derived.innings1.teamTotal}/{derived.innings1.wickets}
                                  </div>
                                </div>

                                <div className="mt-5">
                                  {renderBattingTable(derived.innings1BattingLeaders)}
                                </div>
                              </div>

                              <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                                      Innings 2 • {innings2Team?.shortName || 'Team'}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1">
                                      {derived.innings2.overs} ov • Extras {extras2}{' '}
                                      <span className="text-white/40">
                                        (WD {ex2.wides}, NB {ex2.noBalls}, B {ex2.byes}, LB {ex2.legByes})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-white text-2xl font-black tabular-nums">
                                    {derived.innings2.teamTotal}/{derived.innings2.wickets}
                                  </div>
                                </div>

                                <div className="mt-5">
                                  {derived.innings2BattingLeaders.length === 0 ? (
                                    <div className="text-sm text-white/60 p-4 rounded-2xl border border-white/10 bg-black/20">
                                      2nd innings hasn&apos;t started yet.
                                    </div>
                                  ) : (
                                    renderBattingTable(derived.innings2BattingLeaders)
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.35)] p-5 md:p-6 text-sm text-white/60">
                              Bowling and dismissal details can be derived too, but they require extra wicket-attribution rules.
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
