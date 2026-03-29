'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, Clock, MapPin, RefreshCw } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ModernTeamLogo from '@/components/ui/ModernTeamLogo';
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [tableState, setTableState] = useState<LiveScoreTableState>({ rows: [] });
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
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
          api.getMatches('ipl'),
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

  const refresh = useCallback(async () => {
    if (!selectedMatchId) return;

    const firstLoad = lastFetchAt === null;
    if (firstLoad) setIsLoadingScore(true);

    setError(null);
    try {
      const next = await fetchLiveRows(selectedMatchId);
      setTableState(next);
      setLastFetchAt(Date.now());
    } catch (e) {
      console.error('[Live Score] Failed to load live rows:', e);
      setError('Failed to load live score data.');
    } finally {
      if (firstLoad) setIsLoadingScore(false);
    }
  }, [fetchLiveRows, lastFetchAt, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await refresh();
    };

    tick();
    const interval = setInterval(tick, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh, selectedMatchId]);

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
      <AuroraBackground />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              IPL Live Score
            </h1>
            <p className="text-white/70 mt-2">
              Ball-by-ball updates powered by the IPL scorer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-colors"
              title="Refresh now"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {lastFetchAt && (
              <div className="text-xs text-white/60 whitespace-nowrap">
                Updated {new Date(lastFetchAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {isLoadingMatches ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-white/80">
            No IPL matches found yet.
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4 md:p-5 bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-white/70 mb-2">Select match</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
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

                {selectedMatch && (
                  <div className="flex flex-col gap-2 text-sm text-white/70 md:items-end">
                    <div className="inline-flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="capitalize">{selectedMatch.status}</span>
                    </div>
                    {matchStart && (
                      <div className="inline-flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{matchStart.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="max-w-[32ch] truncate">{selectedMatch.venue}</span>
                    </div>
                    {matchCenterHref && (
                      <Link
                        href={matchCenterHref}
                        className="text-xs font-semibold text-blue-200 hover:text-blue-100 transition-colors"
                      >
                        Open match center →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-200 mb-6">
                {error}
              </div>
            )}

            {isLoadingScore || !selectedMatch || !derived ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div
                    className={`rounded-2xl p-5 border backdrop-blur-xl ${
                      derived.battingTeamKey === 'team1'
                        ? 'bg-blue-500/10 border-blue-400/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
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
                        <div className="text-white text-3xl font-black tracking-tight">
                          {derived.team1Totals.teamTotal}/{derived.team1Totals.wickets}
                        </div>
                        <div className="text-white/70 text-sm">
                          {derived.team1Totals.overs} ov • RR {derived.team1Totals.runRate}
                        </div>
                      </div>
                      {derived.battingTeamKey === 'team1' && (
                        <div className="text-[11px] font-bold text-blue-200 bg-blue-500/15 border border-blue-400/20 px-2 py-1 rounded-lg">
                          Batting
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-5 border backdrop-blur-xl ${
                      derived.battingTeamKey === 'team2'
                        ? 'bg-blue-500/10 border-blue-400/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
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
                        <div className="text-white text-3xl font-black tracking-tight">
                          {derived.team2Totals.teamTotal}/{derived.team2Totals.wickets}
                        </div>
                        <div className="text-white/70 text-sm">
                          {derived.team2Totals.overs} ov • RR {derived.team2Totals.runRate}
                        </div>
                      </div>
                      {derived.battingTeamKey === 'team2' && (
                        <div className="text-[11px] font-bold text-blue-200 bg-blue-500/15 border border-blue-400/20 px-2 py-1 rounded-lg">
                          Batting
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="text-xs font-semibold text-white/70 mb-3">Current</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white/70 text-sm">Striker</div>
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
                        <div className="text-white/70 text-sm">Non-striker</div>
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
                        <div className="text-white/70 text-sm">Bowler</div>
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
                  </div>

                  <div className="rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="text-xs font-semibold text-white/70 mb-3">Innings</div>
                    <div className="text-white text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/70">Current</span>
                        <span className="font-semibold">Innings {derived.currentInnings}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3 bg-black/20 border border-white/10">
                          <div className="text-xs text-white/60 font-semibold mb-1">1st inns</div>
                          <div className="text-white font-bold">
                            {derived.innings1.teamTotal}/{derived.innings1.wickets}
                          </div>
                          <div className="text-xs text-white/60">{derived.innings1.overs} ov</div>
                        </div>
                        <div className="rounded-xl p-3 bg-black/20 border border-white/10">
                          <div className="text-xs text-white/60 font-semibold mb-1">2nd inns</div>
                          <div className="text-white font-bold">
                            {derived.innings2.teamTotal}/{derived.innings2.wickets}
                          </div>
                          <div className="text-xs text-white/60">{derived.innings2.overs} ov</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="text-xs font-semibold text-white/70 mb-3">Chase</div>
                    {derived.target ? (
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

                <div className="rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="text-xs font-semibold text-white/70">Ball-by-ball</div>
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
                          <div className="text-xs font-semibold text-white/70">Innings 1</div>
                          <div className="text-xs text-white/60">{derived.innings1Feed.length} balls</div>
                        </div>
                        {derived.innings1Feed.length === 0 ? (
                          <div className="text-sm text-white/60">No deliveries yet.</div>
                        ) : (
                          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            {derived.innings1Feed.map((line, idx) => (
                              <li
                                key={`inn1-${idx}-${line.slice(0, 18)}`}
                                className="text-white/90 text-sm leading-relaxed rounded-xl px-3 py-2 bg-black/20 border border-white/10"
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-xs font-semibold text-white/70">Innings 2</div>
                          <div className="text-xs text-white/60">{derived.innings2Feed.length} balls</div>
                        </div>
                        {derived.innings2Feed.length === 0 ? (
                          <div className="text-sm text-white/60">
                            2nd innings hasn&apos;t started yet.
                          </div>
                        ) : (
                          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            {derived.innings2Feed.map((line, idx) => (
                              <li
                                key={`inn2-${idx}-${line.slice(0, 18)}`}
                                className="text-white/90 text-sm leading-relaxed rounded-xl px-3 py-2 bg-black/20 border border-white/10"
                              >
                                {line}
                              </li>
                            ))}
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
