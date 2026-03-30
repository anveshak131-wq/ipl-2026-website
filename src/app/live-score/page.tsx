'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, MapPin, RefreshCw, Trophy } from 'lucide-react';

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
    'radial-gradient(85% 70% at 16% 12%, rgba(251,146,60,0.22) 0%, rgba(236,72,153,0.09) 55%, transparent 78%)',
  hazeB:
    'radial-gradient(80% 64% at 86% 86%, rgba(34,211,238,0.18) 0%, rgba(99,102,241,0.10) 55%, transparent 78%)',
  conic:
    'conic-gradient(from 220deg at 50% 35%, rgba(34,211,238,0.10), rgba(168,85,247,0.14), rgba(251,146,60,0.10), rgba(236,72,153,0.10), rgba(99,102,241,0.10), transparent 62%)',
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

export default function LiveScorePage() {
  const { setCurrentLeague } = useLeague();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

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

    const innings1Feed = buildCommentaryFromRows(rows, extrasData, wicketData, '1', commentaryData, resolvePlayerName);
    const innings2Feed = buildCommentaryFromRows(rows, extrasData, wicketData, '2', commentaryData, resolvePlayerName);

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
      innings1,
      innings2,
      team1Totals,
      team2Totals,
      striker,
      nonStriker,
      bowler,
      innings1Feed,
      innings2Feed,
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
                          'linear-gradient(90deg, rgba(251,191,36,0.7), rgba(34,211,238,0.35), rgba(168,85,247,0.45))',
                      }}
                    />
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-100/80 mb-2">
                      Match Result
                    </div>
                    <div className="text-white text-lg font-black tracking-tight">{computedResultText}</div>
                    {scorecardResultInfo?.manOfTheMatch ? (
                      <div className="text-sm text-white/70 mt-1">
                        Man of the Match:{' '}
                        <span className="text-white font-semibold">{scorecardResultInfo.manOfTheMatch}</span>
                      </div>
                    ) : null}
                  </div>
                )}

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
                      </div>
                      {!isMatchComplete && derived.battingTeamKey === 'team2' && (
                        <div className="text-[11px] font-black uppercase tracking-widest text-cyan-100 bg-cyan-500/15 border border-cyan-300/25 px-2.5 py-1 rounded-full">
                          Batting now
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">Current</div>
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
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">Innings</div>
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
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 mb-4">Chase</div>
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

                <div className="rounded-3xl p-5 md:p-6 bg-black/25 backdrop-blur-xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Ball-by-ball</div>
                      <div className="text-white/70 text-sm mt-1">Every delivery from both innings.</div>
                    </div>
                    <div className="text-xs text-white/60">{derived.rowsCount} entries</div>
                  </div>

                  {derived.innings1Feed.length === 0 && derived.innings2Feed.length === 0 ? (
                    <div className="text-white/60 text-sm">
                      No ball-by-ball updates yet. Once the scorer saves deliveries, they will appear here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-xs font-black text-white/70 uppercase tracking-widest">Innings 1</div>
                          <div className="text-xs text-white/60">{derived.innings1Feed.length} balls</div>
                        </div>
                        {derived.innings1Feed.length === 0 ? (
                          <div className="text-sm text-white/60">No deliveries yet.</div>
                        ) : (
                          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            {derived.innings1Feed.map((line, idx) => {
                              const parts = line.split(': ');
                              const meta = parts.length > 1 ? parts[0] : '';
                              const body = parts.length > 1 ? parts.slice(1).join(': ') : line;
                              const lower = body.toLowerCase();
                              const isWicket = lower.includes(' out ') || lower.includes('wicket');
                              const isWide = lower.includes('wide');
                              const isNoBall = lower.includes('no-ball') || lower.includes('noball');
                              const accent = isWicket
                                ? 'border-red-400/35 bg-red-500/10'
                                : isWide
                                  ? 'border-purple-300/25 bg-purple-500/10'
                                  : isNoBall
                                    ? 'border-amber-300/25 bg-amber-500/10'
                                    : 'border-white/10 bg-black/20';

                              return (
                                <li
                                  key={`inn1-${idx}-${line.slice(0, 18)}`}
                                  className={`text-white/90 text-sm leading-relaxed rounded-2xl px-3.5 py-3 border ${accent}`}
                                >
                                  {meta ? (
                                    <div className="text-[11px] text-white/60 font-semibold mb-1">{meta}</div>
                                  ) : null}
                                  <div className="text-white/90">{body}</div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-xs font-black text-white/70 uppercase tracking-widest">Innings 2</div>
                          <div className="text-xs text-white/60">{derived.innings2Feed.length} balls</div>
                        </div>
                        {derived.innings2Feed.length === 0 ? (
                          <div className="text-sm text-white/60">2nd innings hasn&apos;t started yet.</div>
                        ) : (
                          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            {derived.innings2Feed.map((line, idx) => {
                              const parts = line.split(': ');
                              const meta = parts.length > 1 ? parts[0] : '';
                              const body = parts.length > 1 ? parts.slice(1).join(': ') : line;
                              const lower = body.toLowerCase();
                              const isWicket = lower.includes(' out ') || lower.includes('wicket');
                              const isWide = lower.includes('wide');
                              const isNoBall = lower.includes('no-ball') || lower.includes('noball');
                              const accent = isWicket
                                ? 'border-red-400/35 bg-red-500/10'
                                : isWide
                                  ? 'border-purple-300/25 bg-purple-500/10'
                                  : isNoBall
                                    ? 'border-amber-300/25 bg-amber-500/10'
                                    : 'border-white/10 bg-black/20';

                              return (
                                <li
                                  key={`inn2-${idx}-${line.slice(0, 18)}`}
                                  className={`text-white/90 text-sm leading-relaxed rounded-2xl px-3.5 py-3 border ${accent}`}
                                >
                                  {meta ? (
                                    <div className="text-[11px] text-white/60 font-semibold mb-1">{meta}</div>
                                  ) : null}
                                  <div className="text-white/90">{body}</div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
