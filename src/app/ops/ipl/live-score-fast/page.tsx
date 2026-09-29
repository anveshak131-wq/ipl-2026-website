'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/data';
import {
  filterMatchesBySeason,
  getAvailableSeasonYears,
  getPreferredMatch,
  getPreferredSeasonYear,
  getMatchSeasonYear,
  sortMatchesForAdmin,
} from '@/lib/adminMatchSeason';
import { ensureIplPlayoffMatchesForSeason } from '@/lib/iplAdminPlayoffSync';
import type { Match, Player } from '@/types';
import {
  Activity,
  Clock3,
  Download,
  FileText,
  Gauge,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Trophy,
  UploadCloud,
  Zap,
} from 'lucide-react';

const LEAGUE = 'ipl' as const;
const MAX_OVERS = 20;
const MAX_LEGAL_BALLS = MAX_OVERS * 6;

const HEADERS = [
  'Over',
  'Ball',
  'Innings',
  'Striker',
  'Non-Striker',
  'Bowler',
  'Runs',
  'Wide',
  'No Ball',
  'Byes',
  'LB',
  'Wicket',
  'Notes',
];

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

type TeamKey = 'team1' | 'team2';

type PlayerOption = {
  id: string;
  name: string;
};

type ImpactForm = {
  inId: string;
  outId: string;
  moment: string;
  overBall: string;
};

type WicketOutBatter = 'striker' | 'nonStriker';

type WicketRow = {
  hasWicket: boolean;
  wicketType: string;
  wicketTaker: string;
  wicketAssistant: string;
  outBatter: WicketOutBatter;
};

type ExtrasRow = {
  hasWide: boolean;
  wideExtraRuns: number; // extra runs beyond the mandatory +1 wide
  hasNoBall: boolean; // mandatory +1 no-ball
  hasByes: boolean;
  byesRuns: number;
  hasLB: boolean;
  lbRuns: number;
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
  wicketAssistant: '',
  outBatter: 'striker',
};

const ADVISORY_REASONS = ['Rain', 'Wet outfield', 'Bad light', 'Safety', 'Technical'];

// Common wicket modes as seen in modern scorecards
const WICKET_TYPES = [
  'Bowled',
  'Caught',
  'LBW',
  'Run Out',
  'Stumped',
  'Hit Wicket',
  'Caught & Bowled',
  'Obstructing the Field',
  'Hit the Ball Twice',
  'Retired Hurt',
  'Retired Out',
  'Timed Out',
  'Mankad (Run out at non-striker end)',
];

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

const NO_BALL_ALLOWED_WICKETS = new Set(['Hit the Ball Twice', 'Obstructing the Field', 'Run Out']);
const WIDE_ALLOWED_WICKETS = new Set(['Hit Wicket', 'Obstructing the Field', 'Run Out', 'Stumped']);

const getAllowedWicketTypesForExtras = (extras: ExtrasRow) => {
  if (extras.hasNoBall) return WICKET_TYPES.filter((t) => NO_BALL_ALLOWED_WICKETS.has(t));
  if (extras.hasWide) return WICKET_TYPES.filter((t) => WIDE_ALLOWED_WICKETS.has(t));
  return WICKET_TYPES;
};

const computeBallTotals = (runs: number, extras: ExtrasRow) => {
  const batRuns = extras.hasWide || extras.hasByes || extras.hasLB ? 0 : runs;
  const byeRuns = extras.hasByes ? extras.byesRuns : 0;
  const legByeRuns = extras.hasLB ? extras.lbRuns : 0;
  const wideExtraRuns = extras.hasWide ? extras.wideExtraRuns : 0;
  const penaltyRuns = (extras.hasNoBall ? 1 : 0) + (extras.hasWide ? 1 : 0);
  const extrasRuns = penaltyRuns + byeRuns + legByeRuns + wideExtraRuns;
  const completedRuns = extras.hasWide
    ? wideExtraRuns
    : extras.hasByes
      ? byeRuns
      : extras.hasLB
        ? legByeRuns
        : runs;

  return {
    batRuns,
    extrasRuns,
    totalRuns: batRuns + extrasRuns,
    completedRuns,
  };
};

const IMPACT_MOMENTS = [
  'Before Start of Innings',
  'Innings Break',
  'End of Over',
  'Fall of Wicket',
  'Batter Retired',
  'Injury Replacement (Mid-Over)',
];

const DEFAULT_IMPACT_FORM: ImpactForm = {
  inId: '',
  outId: '',
  moment: 'End of Over',
  overBall: '',
};

function normalizeTeamId(value: string | number | undefined) {
  let str = String(value ?? '').trim();
  if (!str) return '';
  if (str.startsWith('Team ')) str = str.replace('Team ', '');
  if (str.toLowerCase().startsWith('team')) str = str.replace(/^team/i, '');
  return str.trim();
}

function uniqStrings(list: string[]) {
  return Array.from(new Set(list.map((s) => String(s || '').trim()).filter(Boolean)));
}

function otherTeamKey(teamKey: 'team1' | 'team2'): 'team1' | 'team2' {
  return teamKey === 'team1' ? 'team2' : 'team1';
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeIdArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function isIndianNationality(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'india' || normalized === 'indian' || normalized === 'ind';
}

const sanitizeOverBallInput = (value: string) => value.replace(/[^0-9]/g, '');

const formatPlayerOptionLabel = (
  name: string,
  extras: { isCaptain?: boolean; isImpactIn?: boolean; isImpactOut?: boolean }
) => {
  const parts = [name];
  const tags: string[] = [];
  if (extras.isCaptain) tags.push('C');
  if (extras.isImpactIn) tags.push('IP');
  if (extras.isImpactOut) tags.push('OUT');
  if (tags.length) parts.push(`(${tags.join(', ')})`);
  return parts.join(' ');
};

const normalizePlayerSelectionInput = (value: string, options: PlayerOption[]) => {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '';
  if (options.some((opt) => opt.id === cleaned)) return cleaned;

  const normalized = cleaned.toLowerCase();
  const exactMatches = options.filter((opt) => String(opt.name || '').trim().toLowerCase() === normalized);
  return exactMatches.length === 1 ? exactMatches[0].id : cleaned;
};

const getTeamPlayerDatalistId = (matchId: string, teamKey: TeamKey) =>
  `ipl-live-score-fast-${matchId || 'match'}-${teamKey}-players`;

const getResultPlayerDatalistId = (matchId: string) =>
  `ipl-live-score-fast-${matchId || 'match'}-result-players`;

const fieldClass =
  'oil-field px-3 py-2 text-sm disabled:opacity-60';

const compactFieldClass =
  'oil-field rounded-lg px-2 py-1 disabled:opacity-60';

const actionButtonClass =
  'oil-btn-secondary px-4 py-2 text-sm disabled:opacity-50';

const primaryButtonClass =
  'oil-btn-primary px-4 py-2 text-sm disabled:opacity-50';

const warmButtonClass =
  'oil-btn-warm px-4 py-2 text-sm disabled:opacity-50';

const dangerButtonClass =
  'oil-btn-danger px-4 py-2 text-sm disabled:opacity-50';

const scoreTableInputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white placeholder-white/30 transition focus:border-[#d7a85b] focus:outline-none focus:ring-2 focus:ring-[#d7a85b]/20';

const scoreTableSelectClass =
  'w-full rounded-lg border border-white/10 bg-[#07110f] px-2 py-1 text-white transition focus:border-[#d7a85b] focus:outline-none focus:ring-2 focus:ring-[#d7a85b]/20';

const scoreTableCheckboxClass =
  'rounded border-white/20 bg-[#07110f] text-[#d7a85b] focus:ring-[#d7a85b]/30';

const getStatusText = (status: SaveStatus, idle = 'Ready') => {
  if (status === 'saving') return 'Saving...';
  if (status === 'success') return 'Saved';
  if (status === 'error') return 'Needs attention';
  return idle;
};

const getStatusClass = (status: SaveStatus) => {
  if (status === 'saving') return 'border-[#d7a85b]/40 bg-[#d7a85b]/10 text-[#ffd58d]';
  if (status === 'success') return 'border-[#4cc39a]/40 bg-[#4cc39a]/10 text-[#9cf2c8]';
  if (status === 'error') return 'border-[#e5655f]/40 bg-[#e5655f]/10 text-[#ffaaa5]';
  return 'border-white/10 bg-white/10 text-white/60';
};

const formatRunRate = (totalRuns: number, legalBalls: number) =>
  legalBalls > 0 ? (totalRuns / (legalBalls / 6)).toFixed(2) : '0.00';

const formatBallCount = (legalBalls: number) => `${Math.min(MAX_LEGAL_BALLS, legalBalls)}/${MAX_LEGAL_BALLS} balls`;

const getInningsPhase = (legalBalls: number, complete: boolean) => {
  if (complete || legalBalls >= MAX_LEGAL_BALLS) return 'Innings complete';
  if (legalBalls < 36) return 'Powerplay';
  if (legalBalls < 90) return 'Middle overs';
  return 'Death overs';
};

export default function IPLAdminLiveScoreTablePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);

  const [rows, setRows] = useState<string[][]>([]);
  const [extrasData, setExtrasData] = useState<Record<number, ExtrasRow>>({});
  const [wicketData, setWicketData] = useState<Record<number, WicketRow>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [scorecardId, setScorecardId] = useState<string>('');
  const [resultWinner, setResultWinner] = useState<string>('');
  const [resultMargin, setResultMargin] = useState<string>('');
  const [resultManOfTheMatch, setResultManOfTheMatch] = useState<string>('');
  const [resultStatus, setResultStatus] = useState<SaveStatus>('idle');
  const [resultLoading, setResultLoading] = useState(false);
  const [advisoryNote, setAdvisoryNote] = useState<string>('');
  const [advisoryOvers, setAdvisoryOvers] = useState<string>('');
  const [advisoryDls, setAdvisoryDls] = useState<boolean>(false);
  const [advisoryStatus, setAdvisoryStatus] = useState<SaveStatus>('idle');
  const [advisoryReason, setAdvisoryReason] = useState<string>('');
  const [scorecardSyncStatus, setScorecardSyncStatus] = useState<SaveStatus>('idle');
  const [impactForms, setImpactForms] = useState<Record<TeamKey, ImpactForm>>({
    team1: { ...DEFAULT_IMPACT_FORM },
    team2: { ...DEFAULT_IMPACT_FORM },
  });
  const [impactSaveStatus, setImpactSaveStatus] = useState<Record<TeamKey, SaveStatus>>({
    team1: 'idle',
    team2: 'idle',
  });
  const [fastInnings, setFastInnings] = useState<'1' | '2'>('1');
  const [fastStrikerId, setFastStrikerId] = useState<string>('');
  const [fastNonStrikerId, setFastNonStrikerId] = useState<string>('');
  const [fastBowlerId, setFastBowlerId] = useState<string>('');
  const [fastRuns, setFastRuns] = useState<number>(0);
  const [fastExtras, setFastExtras] = useState<ExtrasRow>({ ...DEFAULT_EXTRAS });
  const [fastWicket, setFastWicket] = useState<WicketRow>({ ...DEFAULT_WICKET });
  const [fastNotes, setFastNotes] = useState<string>('');
  const [fastOverrideOver, setFastOverrideOver] = useState<string>('');
  const [fastOverrideBall, setFastOverrideBall] = useState<string>('');
  const [autoSwapStrike, setAutoSwapStrike] = useState(true);
  const playoffSyncAttemptedRef = useRef<Record<number, boolean>>({});

  const selectedMatchFromList = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );
  const selectedMatch = matchDetails || selectedMatchFromList;
  const availableSeasonYears = useMemo(() => getAvailableSeasonYears(matches), [matches]);
  const visibleMatches = useMemo(
    () => sortMatchesForAdmin(filterMatchesBySeason(matches, seasonYear)),
    [matches, seasonYear]
  );

  // Reset Impact Player forms when switching matches
  useEffect(() => {
    if (!selectedMatch) return;
    const extractIds = (value: any) => ({
      inId: String(value?.impact || value?.playerId || '').trim(),
      outId: String(value?.original || '').trim(),
    });
    const t1 = extractIds((selectedMatch as any)?.impactPlayer?.team1);
    const t2 = extractIds((selectedMatch as any)?.impactPlayer?.team2);
    setImpactForms({
      team1: { ...DEFAULT_IMPACT_FORM, inId: t1.inId, outId: t1.outId },
      team2: { ...DEFAULT_IMPACT_FORM, inId: t2.inId, outId: t2.outId },
    });
    setImpactSaveStatus({ team1: 'idle', team2: 'idle' });
  }, [selectedMatch?.id]);

  const playerById = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const resolvePlayerName = (value: string) => {
    const cleaned = String(value || '').trim();
    if (!cleaned) return '';
    return String(playerById.get(cleaned)?.name || cleaned).trim();
  };

  const matchCaptains = useMemo<Record<TeamKey, { id: string; name: string }>>(() => {
    const team1Id = String(selectedMatch?.captains?.team1 || '').trim();
    const team2Id = String(selectedMatch?.captains?.team2 || '').trim();
    const resolveName = (id: string) => (id ? String(playerById.get(id)?.name || id).trim() : '');

    return {
      team1: { id: team1Id, name: resolveName(team1Id) },
      team2: { id: team2Id, name: resolveName(team2Id) },
    };
  }, [playerById, selectedMatch]);

  const storageKeyPrefix = useMemo(() => {
    if (!selectedMatchId) return '';
    return `ipl-live-score:${selectedMatchId}`;
  }, [selectedMatchId]);

  // Load matches + players
  useEffect(() => {
    (async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches(LEAGUE, { includeAll: true, nocache: true }),
          api.getPlayers(undefined, LEAGUE),
        ]);

        const nextMatches = (matchesData || []) as Match[];
        setMatches(nextMatches);
        setPlayers((playersData || []) as Player[]);
        setSeasonYear((prev) => {
          if (prev !== null && nextMatches.some((match) => getMatchSeasonYear(match) === prev)) {
            return prev;
          }
          return getPreferredSeasonYear(nextMatches) ?? null;
        });
      } catch (error) {
        console.error('[IPL Live Score Table] Failed to load matches/players:', error);
      }
    })();
  }, []);

  useEffect(() => {
    setSelectedMatchId((prev) => {
      if (prev && visibleMatches.some((match) => match.id === prev)) return prev;
      return getPreferredMatch(visibleMatches)?.id || '';
    });
  }, [visibleMatches]);

  useEffect(() => {
    if (seasonYear === null) return;
    if (playoffSyncAttemptedRef.current[seasonYear]) return;
    if (!matches.some((match) => getMatchSeasonYear(match) === seasonYear)) return;

    playoffSyncAttemptedRef.current[seasonYear] = true;
    let cancelled = false;

    (async () => {
      try {
        const result = await ensureIplPlayoffMatchesForSeason(seasonYear, matches);
        if (!cancelled && result.created > 0) {
          setMatches(result.matches);
        }
      } catch (error) {
        console.error('[Live Score Fast] Failed to auto-create IPL playoff matches:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matches, seasonYear]);

  // Load match details + saved table state for the selected match
  useEffect(() => {
    if (!selectedMatchId) {
      setMatchDetails(null);
      setAdvisoryNote('');
      setAdvisoryOvers('');
      setAdvisoryDls(false);
      setAdvisoryReason('');
      setAdvisoryStatus('idle');
      return;
    }

    (async () => {
      // 1) Try KV (shared/persisted)
      try {
        const resp = await fetch(`/api/ipl-live-score/save?matchId=${encodeURIComponent(selectedMatchId)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.rows)) setRows(data.rows);
          else if (Array.isArray(data)) setRows(data);
          else setRows([]);

          if (data?.extrasData && typeof data.extrasData === 'object') setExtrasData(data.extrasData);
          else setExtrasData({});

          if (data?.wicketData && typeof data.wicketData === 'object') setWicketData(data.wicketData);
          else setWicketData({});
        }
      } catch (error) {
        console.error('[IPL Live Score Table] Failed to load KV table state:', error);
      }

      // 2) Local (fast fallback if KV is empty)
      try {
        const localRows = safeJsonParse<string[][]>(localStorage.getItem(`${storageKeyPrefix}:rows`));
        const localExtras = safeJsonParse<Record<number, ExtrasRow>>(
          localStorage.getItem(`${storageKeyPrefix}:extrasData`)
        );
        const localWickets = safeJsonParse<Record<number, WicketRow>>(
          localStorage.getItem(`${storageKeyPrefix}:wicketData`)
        );

        setRows((prev) => (prev.length ? prev : localRows || []));
        setExtrasData((prev) => (Object.keys(prev).length ? prev : localExtras || {}));
        setWicketData((prev) => (Object.keys(prev).length ? prev : localWickets || {}));
      } catch {}

      // 3) Fetch authoritative match details (Playing XI + Impact Player + Toss)
      try {
        const matchResp = await fetch(`/api/matches?league=${LEAGUE}&id=${encodeURIComponent(selectedMatchId)}&includeAll=true`);
        if (matchResp.ok) {
          const matchData = (await matchResp.json()) as Match;
          setMatchDetails(matchData);
          const nextNote = String(matchData?.statusNote || '').trim();
          const inferredReason =
            ADVISORY_REASONS.find((reason) => nextNote.toLowerCase().includes(reason.toLowerCase())) || '';

          setAdvisoryNote(nextNote);
          setAdvisoryOvers(
            Number.isFinite(Number(matchData?.reducedOversTo)) && Number(matchData?.reducedOversTo) > 0
              ? String(matchData.reducedOversTo)
              : ''
          );
          setAdvisoryDls(Boolean(matchData?.dlsApplied));
          setAdvisoryReason(inferredReason);
          setAdvisoryStatus('idle');
        } else {
          setMatchDetails(null);
        }
      } catch {
        setMatchDetails(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  // Load match result from scorecards for the selected match
  useEffect(() => {
    if (!selectedMatchId) {
      setScorecardId('');
      setResultWinner('');
      setResultMargin('');
      setResultManOfTheMatch('');
      setResultStatus('idle');
      return;
    }

    (async () => {
      setResultLoading(true);
      try {
        const resp = await fetch(
          `/api/scorecards?matchId=${encodeURIComponent(selectedMatchId)}&league=${encodeURIComponent(LEAGUE)}`
        );
        if (!resp.ok) throw new Error('Failed to load scorecards');
        const scorecards = await resp.json();
        const sc = Array.isArray(scorecards) ? scorecards[0] : null;

        setScorecardId(String(sc?.id || '').trim());
        setResultWinner(String(sc?.result?.winner || '').trim());
        setResultMargin(String(sc?.result?.margin || '').trim());
        setResultManOfTheMatch(String(sc?.result?.manOfTheMatch || '').trim());
        setResultStatus('idle');
      } catch (error) {
        console.error('[IPL Live Score Table] Failed to load scorecard result:', error);
        setScorecardId('');
        setResultWinner('');
        setResultMargin('');
        setResultManOfTheMatch('');
        setResultStatus('idle');
      } finally {
        setResultLoading(false);
      }
    })();
  }, [selectedMatchId]);

  // Persist locally as the user edits (per match)
  useEffect(() => {
    if (!storageKeyPrefix) return;
    try {
      localStorage.setItem(`${storageKeyPrefix}:rows`, JSON.stringify(rows));
    } catch {}
  }, [rows, storageKeyPrefix]);

  useEffect(() => {
    if (!storageKeyPrefix) return;
    try {
      localStorage.setItem(`${storageKeyPrefix}:extrasData`, JSON.stringify(extrasData));
    } catch {}
  }, [extrasData, storageKeyPrefix]);

  useEffect(() => {
    if (!storageKeyPrefix) return;
    try {
      localStorage.setItem(`${storageKeyPrefix}:wicketData`, JSON.stringify(wicketData));
    } catch {}
  }, [wicketData, storageKeyPrefix]);

  const teamIds = useMemo(() => {
    const team1Id = normalizeTeamId(selectedMatch?.team1?.id);
    const team2Id = normalizeTeamId(selectedMatch?.team2?.id);
    return { team1Id, team2Id };
  }, [selectedMatch]);

  const squads = useMemo(() => {
    if (!selectedMatch) return { team1: [] as Player[], team2: [] as Player[] };
    const team1Id = teamIds.team1Id;
    const team2Id = teamIds.team2Id;

    const team1 = players.filter((p) => normalizeTeamId(p.teamId) === team1Id && (p.league || LEAGUE) === LEAGUE);
    const team2 = players.filter((p) => normalizeTeamId(p.teamId) === team2Id && (p.league || LEAGUE) === LEAGUE);
    return { team1, team2 };
  }, [players, selectedMatch, teamIds.team1Id, teamIds.team2Id]);

  const playing11Names = useMemo(() => {
    const team1Ids = selectedMatch?.playing11?.team1 || [];
    const team2Ids = selectedMatch?.playing11?.team2 || [];

    const team1 = team1Ids
      .map((id) => playerById.get(String(id))?.name)
      .filter(Boolean) as string[];
    const team2 = team2Ids
      .map((id) => playerById.get(String(id))?.name)
      .filter(Boolean) as string[];

    return { team1: uniqStrings(team1), team2: uniqStrings(team2) };
  }, [playerById, selectedMatch]);

  const impactPlayerInfo = useMemo(() => {
    const extract = (value: any) => {
      const impactId = String(value?.impact || value?.playerId || '').trim();
      const originalId = String(value?.original || '').trim();
      const impactName = impactId ? String(playerById.get(impactId)?.name || impactId).trim() : '';
      const originalName = originalId ? String(playerById.get(originalId)?.name || originalId).trim() : '';
      const substitutionTime = String(value?.substitutionTime || '').trim();
      const substitutedAt = typeof value?.substitutedAt === 'number' ? value.substitutedAt : undefined;
      return {
        impactId,
        impactName,
        originalId,
        originalName,
        substitutionTime,
        substitutedAt,
      };
    };

    return {
      team1: extract((selectedMatch as any)?.impactPlayer?.team1),
      team2: extract((selectedMatch as any)?.impactPlayer?.team2),
    };
  }, [playerById, selectedMatch]);

  const impactSubstituteIds = useMemo(() => {
    const team1 = normalizeIdArray((selectedMatch as any)?.impactSubstitutes?.team1);
    const team2 = normalizeIdArray((selectedMatch as any)?.impactSubstitutes?.team2);
    return { team1: Array.from(new Set(team1)), team2: Array.from(new Set(team2)) };
  }, [selectedMatch]);

  const hasPlaying11 = Boolean(playing11Names.team1.length) && Boolean(playing11Names.team2.length);
  const matchToss = selectedMatch?.matchState?.toss;

  const getBattingTeamKeyForInnings = (innings: '1' | '2'): 'team1' | 'team2' => {
    if (!matchToss) return 'team1';
    const winner = matchToss.winner;
    const decision = matchToss.decision;
    if (decision === 'bat') {
      return innings === '1' ? winner : otherTeamKey(winner);
    }
    return innings === '1' ? otherTeamKey(winner) : winner;
  };

  const getTeamPlayerOptions = (teamKey: 'team1' | 'team2') => {
    const impact = teamKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;

    const fromXIIds = normalizeIdArray((selectedMatch as any)?.playing11?.[teamKey]);
    const fromSquadIds = (teamKey === 'team1' ? squads.team1 : squads.team2).map((p) => String(p.id || '').trim()).filter(Boolean);

    const baseIds = (fromXIIds.length ? fromXIIds : fromSquadIds).slice();
    if (impact?.impactId) baseIds.push(String(impact.impactId));
    if (impact?.originalId) baseIds.push(String(impact.originalId));

    const uniqueIds = Array.from(new Set(baseIds.map(String).map((s) => s.trim()).filter(Boolean)));
    return uniqueIds.map((id) => ({ id, name: resolvePlayerName(id) }));
  };

  const resultPlayerNames = useMemo(
    () => uniqStrings([...squads.team1.map((p) => p.name), ...squads.team2.map((p) => p.name)]),
    [squads.team1, squads.team2]
  );

  const fastBattingKey = getBattingTeamKeyForInnings(fastInnings);
  const fastBowlingKey = otherTeamKey(fastBattingKey);
  const fastBattingOptions = getTeamPlayerOptions(fastBattingKey);
  const fastBowlingOptions = getTeamPlayerOptions(fastBowlingKey);

  useEffect(() => {
    if (!selectedMatch) return;
    const battingIds = fastBattingOptions.map((opt) => opt.id);
    const bowlingIds = fastBowlingOptions.map((opt) => opt.id);
    const nextStriker = !fastStrikerId
      ? battingIds[0] || ''
      : battingIds.includes(fastStrikerId)
        ? fastStrikerId
        : playerById.has(fastStrikerId)
          ? battingIds[0] || ''
          : fastStrikerId;
    const nextNonStriker = !fastNonStrikerId
      ? battingIds[1] || battingIds[0] || ''
      : battingIds.includes(fastNonStrikerId)
        ? fastNonStrikerId
        : playerById.has(fastNonStrikerId)
          ? battingIds[1] || battingIds[0] || ''
          : fastNonStrikerId;
    const nextBowler = !fastBowlerId
      ? bowlingIds[0] || ''
      : bowlingIds.includes(fastBowlerId)
        ? fastBowlerId
        : playerById.has(fastBowlerId)
          ? bowlingIds[0] || ''
          : fastBowlerId;

    if (nextStriker !== fastStrikerId) setFastStrikerId(nextStriker);
    if (nextNonStriker !== fastNonStrikerId) setFastNonStrikerId(nextNonStriker);
    if (nextBowler !== fastBowlerId) setFastBowlerId(nextBowler);
  }, [
    selectedMatch,
    selectedMatchId,
    fastInnings,
    fastBattingOptions,
    fastBowlingOptions,
    fastStrikerId,
    fastNonStrikerId,
    fastBowlerId,
    playerById,
  ]);

  const fastTotals = useMemo(
    () => computeBallTotals(fastRuns, fastExtras),
    [fastRuns, fastExtras]
  );

  const didMigratePlayerIdsRef = useRef<Record<string, boolean>>({});

  // One-time best-effort migration: convert legacy name-stored rows to player IDs (when unambiguous).
  useEffect(() => {
    if (!selectedMatchId) return;
    if (!selectedMatch) return;
    if (didMigratePlayerIdsRef.current[selectedMatchId]) return;
    if (!players.length) return;
    if (rows.length === 0 && Object.keys(wicketData).length === 0) return;

    const normalize = (value: string) => String(value || '').trim().toLowerCase();
    const resolveIdFromLegacy = (value: string, options: PlayerOption[]) => {
      const cleaned = String(value || '').trim();
      if (!cleaned) return '';
      if (options.some((opt) => opt.id === cleaned)) return cleaned;

      const matches = options.filter((opt) => normalize(opt.name) === normalize(cleaned));
      return matches.length === 1 ? matches[0].id : cleaned;
    };

    let rowsChanged = false;
    let wicketsChanged = false;

    const nextRows = rows.map((r) => (Array.isArray(r) ? [...r] : []));
    const nextWicketData: Record<number, WicketRow> = { ...wicketData };

    for (let idx = 0; idx < nextRows.length; idx++) {
      const row = nextRows[idx];
      const innings = (String(row?.[2] || '1') as '1' | '2') || '1';
      const battingKey = getBattingTeamKeyForInnings(innings);
      const bowlingKey = otherTeamKey(battingKey);

      const battingOptions = getTeamPlayerOptions(battingKey);
      const bowlingOptions = getTeamPlayerOptions(bowlingKey);

      const striker = String(row?.[3] || '');
      const nonStriker = String(row?.[4] || '');
      const bowler = String(row?.[5] || '');

      const nextStriker = resolveIdFromLegacy(striker, battingOptions);
      const nextNonStriker = resolveIdFromLegacy(nonStriker, battingOptions);
      const nextBowler = resolveIdFromLegacy(bowler, bowlingOptions);

      if (nextStriker !== striker) {
        row[3] = nextStriker;
        rowsChanged = true;
      }
      if (nextNonStriker !== nonStriker) {
        row[4] = nextNonStriker;
        rowsChanged = true;
      }
      if (nextBowler !== bowler) {
        row[5] = nextBowler;
        rowsChanged = true;
      }

      const wkRaw = wicketData[idx];
      if (!wkRaw || typeof wkRaw !== 'object') continue;

      const wkCurrent = { ...DEFAULT_WICKET, ...(wkRaw || {}) };
      let wkNext = wkCurrent;

      if (wkCurrent.wicketType === 'Mankad (Run out at non-striker end)') {
        if (wkCurrent.outBatter !== 'nonStriker') wkNext = { ...wkNext, outBatter: 'nonStriker' };
        const bowlerId = String(row?.[5] || '').trim();
        if (bowlerId && wkNext.wicketTaker !== bowlerId) wkNext = { ...wkNext, wicketTaker: bowlerId };
      } else if (wkCurrent.wicketType !== 'Run Out' && wkCurrent.wicketType !== 'Obstructing the Field') {
        if (wkCurrent.outBatter !== 'striker') wkNext = { ...wkNext, outBatter: 'striker' };
      }

      if (wkNext.wicketType === 'Caught & Bowled') {
        const bowlerId = String(row?.[5] || '').trim();
        if (bowlerId && wkNext.wicketTaker !== bowlerId) wkNext = { ...wkNext, wicketTaker: bowlerId };
      }

      if (wkNext.wicketTaker) {
        const currentTaker = String(wkNext.wicketTaker);
        const nextTaker = resolveIdFromLegacy(currentTaker, bowlingOptions);
        if (nextTaker !== currentTaker) wkNext = { ...wkNext, wicketTaker: nextTaker };
      }

      if (wkNext.wicketAssistant) {
        const currentAssistant = String(wkNext.wicketAssistant);
        const nextAssistant = resolveIdFromLegacy(currentAssistant, bowlingOptions);
        if (nextAssistant !== currentAssistant) wkNext = { ...wkNext, wicketAssistant: nextAssistant };
      }

      const didChangeWk =
        wkNext.hasWicket !== wkCurrent.hasWicket ||
        wkNext.wicketType !== wkCurrent.wicketType ||
        wkNext.wicketTaker !== wkCurrent.wicketTaker ||
        wkNext.wicketAssistant !== wkCurrent.wicketAssistant ||
        wkNext.outBatter !== wkCurrent.outBatter;

      if (didChangeWk) {
        nextWicketData[idx] = wkNext;
        wicketsChanged = true;
      }

      const desc = generateWicketDescription(wkNext);
      if (desc && String(row?.[11] || '') !== desc) {
        row[11] = desc;
        rowsChanged = true;
      }
    }

    if (rowsChanged) setRows(nextRows);
    if (wicketsChanged) setWicketData(nextWicketData);

    didMigratePlayerIdsRef.current[selectedMatchId] = true;
  }, [selectedMatchId, selectedMatch, players.length, rows, wicketData]);

  const updateImpactForm = (teamKey: TeamKey, patch: Partial<ImpactForm>) => {
    setImpactForms((prev) => ({
      ...prev,
      [teamKey]: { ...prev[teamKey], ...patch },
    }));
  };

  const buildImpactSubstitutionTime = (moment: string, overBall: string) => {
    const cleaned = String(overBall || '').trim();
    return cleaned ? `${moment} (${cleaned})` : moment;
  };

  const saveImpactPlayer = async (teamKey: TeamKey) => {
    try {
      if (!selectedMatch) return;

      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Admin token missing. Please login again.');
        return;
      }

      const form = impactForms[teamKey];
      const inId = String(form.inId || '').trim();
      const outId = String(form.outId || '').trim();
      const moment = String(form.moment || '').trim() || DEFAULT_IMPACT_FORM.moment;

      const nominees = impactSubstituteIds[teamKey] || [];
      const playingXI = normalizeIdArray((selectedMatch as any)?.playing11?.[teamKey]);

      if (!nominees.length) {
        alert('No Impact substitutes found. Please set 5 substitutes in Playing 11 first.');
        return;
      }
      if (!playingXI.length) {
        alert('Playing 11 not found for this match. Please set Playing 11 first.');
        return;
      }
      if (!inId || !outId) {
        alert('Select both Impact IN and Player OUT.');
        return;
      }
      if (inId === outId) {
        alert('Impact IN and Player OUT cannot be the same player.');
        return;
      }
      if (!nominees.includes(inId)) {
        alert('Impact IN must be one of the 5 nominated substitutes.');
        return;
      }
      if (!playingXI.includes(outId)) {
        alert('Player OUT must be from the Playing 11.');
        return;
      }

      setImpactSaveStatus((prev) => ({ ...prev, [teamKey]: 'saving' }));

      const substitutionTime = buildImpactSubstitutionTime(moment, form.overBall);
      const existingImpact = (selectedMatch as any)?.impactPlayer || {};
      const nextImpactPlayer = {
        team1: teamKey === 'team1'
          ? { original: outId, impact: inId, substitutionTime, substitutedAt: Date.now() }
          : (existingImpact.team1 ?? null),
        team2: teamKey === 'team2'
          ? { original: outId, impact: inId, substitutionTime, substitutedAt: Date.now() }
          : (existingImpact.team2 ?? null),
      };

      const resp = await fetch(`/api/matches?id=${encodeURIComponent(selectedMatch.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedMatch.id,
          impactPlayer: nextImpactPlayer,
        }),
      });

      if (!resp.ok) throw new Error('Failed to save Impact Player');
      const updated = (await resp.json()) as Match;

      setMatchDetails(updated);
      setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

      setImpactSaveStatus((prev) => ({ ...prev, [teamKey]: 'success' }));
      setTimeout(() => setImpactSaveStatus((prev) => ({ ...prev, [teamKey]: 'idle' })), 2000);
    } catch (e) {
      console.error('[IPL Live Score Table] Impact Player save error:', e);
      setImpactSaveStatus((prev) => ({ ...prev, [teamKey]: 'error' }));
      setTimeout(() => setImpactSaveStatus((prev) => ({ ...prev, [teamKey]: 'idle' })), 3000);
    }
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      if (!next[rowIndex]) return prev;
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const generateWicketDescription = (data: WicketRow) => {
    if (!data.hasWicket) return '';
    const type = data.wicketType || 'Wicket';
    const takerName = data.wicketTaker ? resolvePlayerName(String(data.wicketTaker)) : '';
    const assistantName = data.wicketAssistant ? resolvePlayerName(String(data.wicketAssistant)) : '';
    const takerCombined = [takerName, assistantName].filter(Boolean).join(' / ');
    const taker = takerCombined ? ` - ${takerCombined}` : '';

    const needsOutBatter =
      type === 'Run Out' || type === 'Obstructing the Field' || type === 'Mankad (Run out at non-striker end)';
    const outTag = needsOutBatter
      ? ` (${type === 'Mankad (Run out at non-striker end)' ? 'Non-striker' : data.outBatter === 'nonStriker' ? 'Non-striker' : 'Striker'})`
      : '';

    return `${type}${outTag}${taker}`.trim();
  };

  const setExtrasForRow = (rowIndex: number, patch: Partial<ExtrasRow>) => {
    setExtrasData((prev) => {
      const current = { ...DEFAULT_EXTRAS, ...(prev[rowIndex] || {}) };
      const nextRow = { ...current, ...patch };
      return { ...prev, [rowIndex]: nextRow };
    });
  };

  const setWicketForRow = (rowIndex: number, patch: Partial<WicketRow>) => {
    setWicketData((prev) => {
      const current = { ...DEFAULT_WICKET, ...(prev[rowIndex] || {}) };
      const nextRow = { ...current, ...patch };
      return { ...prev, [rowIndex]: nextRow };
    });
  };

  const onExtrasChange = (rowIndex: number, field: keyof ExtrasRow, value: boolean | number) => {
    const current = { ...DEFAULT_EXTRAS, ...(extrasData[rowIndex] || {}) };
    const next: ExtrasRow = { ...current, [field]: value } as ExtrasRow;

    if (field === 'hasWide' && value === true) next.hasNoBall = false;
    if (field === 'hasNoBall' && value === true) next.hasWide = false;

    if ((field === 'hasWide' && value === false) || next.hasWide === false) {
      next.wideExtraRuns = 0;
    }
    if (field === 'hasByes' && value === false) next.byesRuns = 0;
    if (field === 'hasLB' && value === false) next.lbRuns = 0;

    setExtrasForRow(rowIndex, next);

    const wideTotal = next.hasWide ? 1 + (next.wideExtraRuns || 0) : '';
    const noBallTotal = next.hasNoBall ? 1 : '';
    const byesTotal = next.hasByes ? String(next.byesRuns || 0) : '';
    const lbTotal = next.hasLB ? String(next.lbRuns || 0) : '';

    updateCell(rowIndex, 7, wideTotal ? String(wideTotal) : '');
    updateCell(rowIndex, 8, noBallTotal ? String(noBallTotal) : '');
    updateCell(rowIndex, 9, byesTotal);
    updateCell(rowIndex, 10, lbTotal);

    const wk = { ...DEFAULT_WICKET, ...(wicketData[rowIndex] || {}) };
    if (wk.hasWicket && wk.wicketType) {
      const allowed = next.hasNoBall
        ? ['Hit the Ball Twice', 'Obstructing the Field', 'Run Out']
        : next.hasWide
          ? ['Hit Wicket', 'Obstructing the Field', 'Run Out', 'Stumped']
          : null;

      if (allowed && !allowed.includes(wk.wicketType)) {
        const cleared: WicketRow = { ...wk, wicketType: '', wicketTaker: '', wicketAssistant: '', outBatter: 'striker' };
        setWicketForRow(rowIndex, cleared);
        updateCell(rowIndex, 11, generateWicketDescription(cleared));
      }
    }
  };

  const onWicketChange = (rowIndex: number, field: keyof WicketRow, value: boolean | string) => {
    const current = { ...DEFAULT_WICKET, ...(wicketData[rowIndex] || {}) };
    const next: WicketRow = { ...current, [field]: value } as WicketRow;

    if (field === 'hasWicket' && value === false) {
      next.wicketType = '';
      next.wicketTaker = '';
      next.wicketAssistant = '';
      next.outBatter = 'striker';
    }

    if (field === 'wicketType') {
      const type = String(value || '').trim();

      if (type === 'Mankad (Run out at non-striker end)') {
        next.outBatter = 'nonStriker';
        const bowlerId = String(rows?.[rowIndex]?.[5] || '').trim();
        if (bowlerId) next.wicketTaker = bowlerId;
      } else if (type === 'Run Out' || type === 'Obstructing the Field') {
        next.outBatter = next.outBatter === 'nonStriker' ? 'nonStriker' : 'striker';
      } else {
        next.outBatter = 'striker';
      }

      const takerNotUsed =
        type === 'Bowled' ||
        type === 'LBW' ||
        type === 'Hit Wicket' ||
        type === 'Timed Out' ||
        type === 'Retired Hurt' ||
        type === 'Retired Out';

      if (takerNotUsed) {
        next.wicketTaker = '';
        next.wicketAssistant = '';
      }

      if (type === 'Caught & Bowled') {
        const bowlerId = String(rows?.[rowIndex]?.[5] || '').trim();
        next.wicketTaker = bowlerId || '';
        next.wicketAssistant = '';
      }

      const assistantUsed = type === 'Run Out' || type === 'Obstructing the Field';
      if (!assistantUsed) next.wicketAssistant = '';
    }

    setWicketForRow(rowIndex, next);

    const desc = generateWicketDescription(next);
    updateCell(rowIndex, 11, desc);
  };

  const countLegalBallsInInnings = (innings: '1' | '2') => {
    let balls = 0;
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      if (String(row?.[2] || '') !== innings) continue;
      if (balls >= MAX_LEGAL_BALLS) break;
      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
      if (!ex.hasWide && !ex.hasNoBall && !isNonDeliveryWicket(wk)) balls += 1;
    }
    return balls;
  };

  const getNextBallForInnings = (innings: '1' | '2') => {
    const legalBalls = countLegalBallsInInnings(innings);
    if (legalBalls >= MAX_LEGAL_BALLS) {
      return { over: String(MAX_OVERS), ball: '0', isComplete: true };
    }
    const over = Math.floor(legalBalls / 6);
    const ball = (legalBalls % 6) + 1;
    return { over: String(over), ball: String(ball), isComplete: false };
  };

  const fastNextBall = useMemo(
    () => getNextBallForInnings(fastInnings),
    [fastInnings, rows, extrasData, wicketData]
  );
  const fastInningsComplete = fastNextBall.isComplete;
  const innings1Complete = useMemo(
    () => countLegalBallsInInnings('1') >= MAX_LEGAL_BALLS,
    [rows, extrasData, wicketData]
  );
  const innings2Complete = useMemo(
    () => countLegalBallsInInnings('2') >= MAX_LEGAL_BALLS,
    [rows, extrasData, wicketData]
  );

  const getLastRowForInnings = (innings: '1' | '2') => {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i]?.[2] || '') === innings) return { row: rows[i], index: i };
    }
    return null;
  };

  const addRowToInnings = (inningsNumber: 1 | 2) => {
    const innings = String(inningsNumber) as '1' | '2';
    const newRow = Array(HEADERS.length).fill('');
    const nextBall = getNextBallForInnings(innings);
    if (nextBall.isComplete) return;
    newRow[0] = nextBall.over;
    newRow[1] = nextBall.ball;
    newRow[2] = innings;

    const last = getLastRowForInnings(innings);
    if (last?.row) {
      newRow[3] = last.row[3] || '';
      newRow[4] = last.row[4] || '';
      newRow[5] = last.row[5] || '';
    }

    setRows((prev) => [...prev, newRow]);
  };

  const resetFastInputs = () => {
    setFastRuns(0);
    setFastExtras({ ...DEFAULT_EXTRAS });
    setFastWicket({ ...DEFAULT_WICKET });
    setFastNotes('');
    setFastOverrideOver('');
    setFastOverrideBall('');
  };

  useEffect(() => {
    setFastStrikerId('');
    setFastNonStrikerId('');
    setFastBowlerId('');
    setFastRuns(0);
    setFastExtras({ ...DEFAULT_EXTRAS });
    setFastWicket({ ...DEFAULT_WICKET });
    setFastNotes('');
    setFastOverrideOver('');
    setFastOverrideBall('');
  }, [selectedMatchId]);

  const toggleFastWide = () => {
    setFastExtras((prev) => {
      const next = { ...prev, hasWide: !prev.hasWide };
      if (next.hasWide) {
        next.hasNoBall = false;
        next.hasByes = false;
        next.hasLB = false;
        next.byesRuns = 0;
        next.lbRuns = 0;
      } else {
        next.wideExtraRuns = 0;
      }
      return next;
    });
    setFastRuns(0);
    setFastWicket((prev) => ({ ...prev, wicketType: '' }));
  };

  const toggleFastWicket = () => {
    setFastWicket((prev) =>
      prev.hasWicket ? { ...DEFAULT_WICKET } : { ...prev, hasWicket: true }
    );
  };

  const toggleFastNoBall = () => {
    const nextHasNoBall = !fastExtras.hasNoBall;
    setFastExtras((prev) => {
      const next = { ...prev, hasNoBall: nextHasNoBall };
      if (next.hasNoBall) {
        next.hasWide = false;
        next.wideExtraRuns = 0;
      }
      return next;
    });
    if (nextHasNoBall && fastWicket.wicketType && !NO_BALL_ALLOWED_WICKETS.has(fastWicket.wicketType)) {
      setFastWicket((prev) => ({ ...prev, wicketType: '', wicketTaker: '', wicketAssistant: '', outBatter: 'striker' }));
    }
  };

  const toggleFastByes = () => {
    setFastExtras((prev) => {
      const next = { ...prev, hasByes: !prev.hasByes };
      if (next.hasByes) {
        next.hasWide = false;
        next.hasLB = false;
        next.wideExtraRuns = 0;
        next.lbRuns = 0;
      } else {
        next.byesRuns = 0;
      }
      return next;
    });
    setFastRuns(0);
  };

  const toggleFastLegByes = () => {
    setFastExtras((prev) => {
      const next = { ...prev, hasLB: !prev.hasLB };
      if (next.hasLB) {
        next.hasWide = false;
        next.hasByes = false;
        next.wideExtraRuns = 0;
        next.byesRuns = 0;
      } else {
        next.lbRuns = 0;
      }
      return next;
    });
    setFastRuns(0);
  };

  const applyFastWicketType = (type: string) => {
    setFastWicket((prev) => {
      const next: WicketRow = { ...prev, wicketType: type };
      if (!type) {
        next.outBatter = 'striker';
        next.wicketTaker = '';
        next.wicketAssistant = '';
        return next;
      }

      if (type === 'Mankad (Run out at non-striker end)') {
        next.outBatter = 'nonStriker';
        next.wicketTaker = fastBowlerId || '';
        next.wicketAssistant = '';
      } else if (type === 'Run Out' || type === 'Obstructing the Field') {
        next.outBatter = next.outBatter === 'nonStriker' ? 'nonStriker' : 'striker';
      } else {
        next.outBatter = 'striker';
      }

      const takerNotUsed =
        type === 'Bowled' ||
        type === 'LBW' ||
        type === 'Hit Wicket' ||
        type === 'Timed Out' ||
        type === 'Retired Hurt' ||
        type === 'Retired Out';

      if (takerNotUsed) {
        next.wicketTaker = '';
        next.wicketAssistant = '';
      }

      if (type === 'Caught & Bowled') {
        next.wicketTaker = fastBowlerId || '';
        next.wicketAssistant = '';
      }

      const assistantUsed = type === 'Run Out' || type === 'Obstructing the Field';
      if (!assistantUsed) next.wicketAssistant = '';

      return next;
    });
  };

  const appendFastBall = (override?: {
    runs?: number;
    extras?: ExtrasRow;
    wicket?: WicketRow;
    notes?: string;
  }) => {
    if (!selectedMatchId) return;
    if (!fastStrikerId || !fastNonStrikerId || !fastBowlerId) return;
    const effectiveRuns = override?.runs ?? fastRuns;
    const effectiveExtras = override?.extras ?? fastExtras;
    const effectiveWicket = override?.wicket ?? fastWicket;
    const effectiveNotes = override?.notes ?? fastNotes;

    const innings = fastInnings;
    const nextBall = getNextBallForInnings(innings);
    if (nextBall.isComplete) return;
    const newRow = Array(HEADERS.length).fill('');
    const manualOver = fastOverrideOver.trim();
    const manualBall = fastOverrideBall.trim();
    newRow[0] = manualOver || nextBall.over;
    newRow[1] = manualBall || nextBall.ball;
    newRow[2] = innings;
    newRow[3] = fastStrikerId;
    newRow[4] = fastNonStrikerId;
    newRow[5] = fastBowlerId;

    const sanitizedRuns =
      effectiveExtras.hasWide || effectiveExtras.hasByes || effectiveExtras.hasLB ? 0 : effectiveRuns;
    newRow[6] = String(sanitizedRuns);

    const wideTotal = effectiveExtras.hasWide ? 1 + (effectiveExtras.wideExtraRuns || 0) : '';
    const noBallTotal = effectiveExtras.hasNoBall ? 1 : '';
    const byesTotal = effectiveExtras.hasByes ? String(effectiveExtras.byesRuns || 0) : '';
    const lbTotal = effectiveExtras.hasLB ? String(effectiveExtras.lbRuns || 0) : '';

    newRow[7] = wideTotal ? String(wideTotal) : '';
    newRow[8] = noBallTotal ? String(noBallTotal) : '';
    newRow[9] = byesTotal;
    newRow[10] = lbTotal;

    const wicketRow = { ...DEFAULT_WICKET, ...effectiveWicket };
    if (wicketRow.hasWicket && wicketRow.wicketType) {
      const allowed = getAllowedWicketTypesForExtras(effectiveExtras);
      if (!allowed.includes(wicketRow.wicketType)) {
        wicketRow.wicketType = '';
        wicketRow.wicketTaker = '';
        wicketRow.wicketAssistant = '';
        wicketRow.outBatter = 'striker';
      }
    }
    newRow[11] = generateWicketDescription(wicketRow);
    newRow[12] = effectiveNotes;

    const newIndex = rows.length;
    setRows((prev) => [...prev, newRow]);
    setExtrasData((prev) => ({ ...prev, [newIndex]: { ...DEFAULT_EXTRAS, ...effectiveExtras } }));
    setWicketData((prev) => ({ ...prev, [newIndex]: wicketRow }));

    // Enhanced Strike Rotation Logic (Odd runs + Over end)
    if (autoSwapStrike && !wicketRow.hasWicket && !isNonDeliveryWicket(wicketRow)) {
      const completedRuns = computeBallTotals(sanitizedRuns, effectiveExtras).completedRuns;
      const isOddRuns = completedRuns % 2 === 1;
      const isLegalBall = !effectiveExtras.hasWide && !effectiveExtras.hasNoBall;
      const currentBallNum = Number(String(newRow[1] || '0').trim());
      const isOverComplete = isLegalBall && currentBallNum === 6;

      const shouldSwap = isOverComplete ? !isOddRuns : isOddRuns;

      if (shouldSwap) {
        setFastStrikerId(fastNonStrikerId);
        setFastNonStrikerId(fastStrikerId);
      }
    }

    resetFastInputs();
  };

  const reindexSparseRecord = <T,>(record: Record<number, T>, removedIndex: number) => {
    const next: Record<number, T> = {};
    Object.entries(record).forEach(([k, v]) => {
      const oldIndex = Number(k);
      if (!Number.isFinite(oldIndex)) return;
      if (oldIndex === removedIndex) return;
      const newIndex = oldIndex < removedIndex ? oldIndex : oldIndex - 1;
      next[newIndex] = v;
    });
    return next;
  };

  const removeRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setExtrasData((prev) => reindexSparseRecord(prev, rowIndex));
    setWicketData((prev) => reindexSparseRecord(prev, rowIndex));
  };

  const undoLastBall = () => {
    if (!rows.length) return;
    removeRow(rows.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }

      if (event.key >= '0' && event.key <= '6') {
        event.preventDefault();
        appendFastBall({
          runs: Number(event.key),
          extras: { ...DEFAULT_EXTRAS },
          wicket: { ...DEFAULT_WICKET },
          notes: '',
        });
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'w') {
        event.preventDefault();
        toggleFastWicket();
        return;
      }
      if (key === 'd') {
        event.preventDefault();
        toggleFastWide();
        return;
      }
      if (key === 'n') {
        event.preventDefault();
        toggleFastNoBall();
        return;
      }
      if (key === 'b') {
        event.preventDefault();
        toggleFastByes();
        return;
      }
      if (key === 'l') {
        event.preventDefault();
        toggleFastLegByes();
        return;
      }
      if (key === 's') {
        event.preventDefault();
        setFastStrikerId(fastNonStrikerId);
        setFastNonStrikerId(fastStrikerId);
        return;
      }
      if (key === 'u') {
        event.preventDefault();
        undoLastBall();
        return;
      }
      if (key === 'c') {
        event.preventDefault();
        resetFastInputs();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        appendFastBall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    appendFastBall,
    toggleFastWicket,
    toggleFastWide,
    toggleFastNoBall,
    toggleFastByes,
    toggleFastLegByes,
    undoLastBall,
    resetFastInputs,
    fastStrikerId,
    fastNonStrikerId,
  ]);

  const calculateInningsTotals = (innings: '1' | '2') => {
    let batsmanRuns = 0;
    let wides = 0;
    let noBalls = 0;
    let byes = 0;
    let legByes = 0;
    let wickets = 0;
    let legalBalls = 0;
    let extras = 0;

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      if (String(row?.[2] || '') !== innings) continue;
      if (legalBalls >= MAX_LEGAL_BALLS) break;

      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
      const nonDelivery = isNonDeliveryWicket(wk);

      if (wk.hasWicket && !isRetiredHurtEvent(wk)) wickets += 1;

      if (!ex.hasWide && !ex.hasNoBall && !nonDelivery) {
        legalBalls += 1;
      }

      if (nonDelivery) continue;

      const runs = ex.hasWide ? 0 : parseInt(String(row?.[6] || ''), 10) || 0;
      batsmanRuns += runs;

      if (ex.hasWide) {
        wides += 1;
        const wideRuns = 1 + (ex.wideExtraRuns || 0);
        extras += wideRuns;
      }

      if (ex.hasNoBall) {
        noBalls += 1;
        extras += 1;
      }

      if (ex.hasByes && !ex.hasWide) {
        const r = ex.byesRuns || 0;
        byes += r;
        extras += r;
      }

      if (ex.hasLB && !ex.hasWide) {
        const r = ex.lbRuns || 0;
        legByes += r;
        extras += r;
      }
    }

    const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
    const teamTotal = batsmanRuns + extras;
    return { batsmanRuns, wides, noBalls, byes, legByes, wickets, legalBalls, overs, extras, teamTotal };
  };

  const exportCSV = () => {
    const headerLine = HEADERS.join(',');
    const normalizeRowForExport = (r: string[]) => {
      const next = HEADERS.map((_, idx) => String(r?.[idx] ?? ''));
      next[3] = resolvePlayerName(next[3]);
      next[4] = resolvePlayerName(next[4]);
      next[5] = resolvePlayerName(next[5]);
      return next;
    };

    const body = rows
      .map((r) => normalizeRowForExport(r).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = [headerLine, body].filter(Boolean).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipl_live_score_${selectedMatchId || 'match'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!selectedMatch) {
      alert('Select a match first.');
      return;
    }

    if (pdfGenerating) return;
    setPdfGenerating(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 12;
      const marginTop = 10;
      const marginBottom = 10;

      type RGB = readonly [number, number, number];
      const palette = {
        bg: [13, 20, 27] as RGB,
        panel: [25, 38, 46] as RGB,
        panelSoft: [33, 50, 60] as RGB,
        accent: [60, 110, 113] as RGB,
        accentSoft: [176, 138, 82] as RGB,
        danger: [203, 97, 92] as RGB,
        text: [235, 238, 240] as RGB,
        muted: [160, 171, 178] as RGB,
        grid: [49, 68, 78] as RGB,
      } as const;

      const setFill = (color: RGB) => doc.setFillColor(color[0], color[1], color[2]);
      const setText = (color: RGB) => doc.setTextColor(color[0], color[1], color[2]);
      const setDraw = (color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const mix = (from: RGB, to: RGB, t: number): RGB => ([
        Math.round(lerp(from[0], to[0], t)),
        Math.round(lerp(from[1], to[1], t)),
        Math.round(lerp(from[2], to[2], t)),
      ] as const);

      const drawBackground = (variant: 'cover' | 'table') => {
        const steps = 18;
        const top = variant === 'cover' ? mix(palette.panel, palette.bg, 0.15) : mix(palette.panel, palette.bg, 0.35);
        const bottom = palette.bg;
        for (let i = 0; i < steps; i++) {
          const t = i / Math.max(1, steps - 1);
          setFill(mix(top, bottom, t));
          const y = (pageHeight * i) / steps;
          const h = pageHeight / steps + 0.2;
          doc.rect(0, y, pageWidth, h, 'F');
        }

        setFill(palette.accent);
        doc.circle(24, 22, 9, 'F');
        setFill(palette.accentSoft);
        doc.circle(pageWidth - 26, 18, 7, 'F');
        doc.circle(pageWidth - 52, 32, 12, 'F');
      };

      const drawCard = (x: number, y: number, w: number, h: number, fill: RGB = palette.panel) => {
        doc.setLineWidth(0.25);
        setFill(fill);
        doc.roundedRect(x, y, w, h, 6, 6, 'F');
        setDraw(palette.grid);
        doc.roundedRect(x, y, w, h, 6, 6, 'S');
      };

      const fitText = (text: string, maxWidth: number) => {
        const clean = String(text || '').replace(/\s+/g, ' ').trim();
        if (!clean) return '-';
        if (doc.getTextWidth(clean) <= maxWidth) return clean;
        let s = clean;
        while (s.length > 0 && doc.getTextWidth(`${s}…`) > maxWidth) s = s.slice(0, -1);
        return s ? `${s}…` : '';
      };

      const drawSectionLabel = (label: string, x: number, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        setText(palette.accentSoft);
        doc.text(label.toUpperCase(), x, y);
      };

      const team1Label = selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1';
      const team2Label = selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2';
      const title = `${team1Label} vs ${team2Label}`;

      const formatDateLine = () => {
        const datePart = String(selectedMatch.date || '').split('T')[0] || String(selectedMatch.date || '');
        return `${datePart} ${selectedMatch.time || ''}`.trim();
      };

      const tossLine = (() => {
        if (!matchToss) return 'Not set';
        const winnerName = matchToss.winner === 'team1' ? team1Label : team2Label;
        return `${winnerName} chose ${matchToss.decision}`;
      })();

      const captainsLine =
        (matchCaptains.team1.name || matchCaptains.team2.name)
          ? `${matchCaptains.team1.name || '-'} / ${matchCaptains.team2.name || '-'}`
          : 'Not set';

      const playingXiLine = hasPlaying11 ? 'Set' : 'Not set';

      const impactUsedLine =
        (impactPlayerInfo.team1.impactName || impactPlayerInfo.team2.impactName)
          ? `${impactPlayerInfo.team1.impactName || '-'} / ${impactPlayerInfo.team2.impactName || '-'}`
          : 'Not set';

      const parseImpactMoment = (substitutionTime: string) => {
        const raw = String(substitutionTime || '').trim();
        const match = raw.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (match) return { moment: match[1].trim(), overBall: match[2].trim() };
        return { moment: raw, overBall: '' };
      };

      const formatPlayerName = (playerId: string) => {
        const id = String(playerId || '').trim();
        if (!id) return '';
        const player = playerById.get(id);
        const name = String(player?.name || id).trim();
        const isOverseas = player?.nationality ? !isIndianNationality(player.nationality) : false;
        return isOverseas ? `${name} (OS)` : name;
      };

      const formatPlayingXI = (teamKey: TeamKey) => {
        const ids = normalizeIdArray((selectedMatch as any)?.playing11?.[teamKey]);
        const captainId = matchCaptains[teamKey].id;
        const names = ids.map((id) => {
          const base = formatPlayerName(String(id));
          if (captainId && String(id) === captainId && base) return `${base} (C)`;
          return base;
        });
        return names.filter(Boolean).join(', ');
      };

      const formatNominees = (teamKey: TeamKey) => {
        const nominees = normalizeIdArray((selectedMatch as any)?.impactSubstitutes?.[teamKey]).slice(0, 5);
        return nominees.map((id) => formatPlayerName(String(id))).filter(Boolean).join(', ');
      };

      const formatImpactBlock = (teamKey: TeamKey) => {
        const impact = teamKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;
        const status = impact.impactName ? 'Used' : 'Not used';
        const moment = parseImpactMoment(impact.substitutionTime || '');
        const currentLine = impact.impactName
          ? `Current: ${impact.impactName} for ${impact.originalName || '-'} • ${impact.substitutionTime || ''}`.trim()
          : 'Current: —';

        const lines = [
          status,
          `Nominees: ${formatNominees(teamKey) || '-'}`,
          `Playing XI: ${formatPlayingXI(teamKey) || '-'}`,
          currentLine,
          '',
          `Impact IN: ${impact.impactName || '-'}`,
          `Player OUT: ${impact.originalName || '-'}`,
          `When: ${moment.moment || '-'}`,
          `Over.Ball: ${moment.overBall || '-'}`,
        ];

        return lines.join('\n');
      };

      drawBackground('cover');

      const contentW = pageWidth - marginX * 2;
      const gap = 8;

      const headerX = marginX;
      const headerY = marginTop;
      const headerW = contentW;
      const headerH = 34;
      drawCard(headerX, headerY, headerW, headerH, palette.panel);

      setFill(palette.accent);
      doc.circle(headerX + 18, headerY + 18, 10, 'F');
      setFill(palette.accentSoft);
      doc.circle(headerX + headerW - 18, headerY + 12, 6, 'F');
      doc.circle(headerX + headerW - 36, headerY + 26, 12, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setText(palette.muted);
      doc.text('IPL 2026 • Live Score Export', headerX + 34, headerY + 9);
      doc.text(
        fitText(`${formatDateLine() || '-'} • ${selectedMatch.venue || '-'}`, headerW - 70),
        headerX + headerW - 10,
        headerY + 9,
        { align: 'right' },
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      setText(palette.text);
      doc.text(fitText(title, headerW - 40), pageWidth / 2, headerY + 20, { align: 'center' });

      setFill(palette.accent);
      doc.rect(headerX + 10, headerY + headerH - 5, headerW - 20, 1, 'F');

      const topRowY = headerY + headerH + 8;
      const topCardH = 52;
      const colW = (contentW - gap) / 2;

      const detailsX = marginX;
      const detailsY = topRowY;
      drawCard(detailsX, detailsY, colW, topCardH, palette.panelSoft);
      drawSectionLabel('Match Details', detailsX + 10, detailsY + 12);

      const drawInfoRow = (label: string, value: string, rowY: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        setText(palette.muted);
        doc.text(`${label}:`, detailsX + 10, rowY);
        doc.setFont('helvetica', 'normal');
        setText(palette.text);
        doc.text(fitText(value, colW - 44), detailsX + 34, rowY);
      };

      let dy = detailsY + 22;
      const rowStep = 6.2;
      drawInfoRow('Venue', selectedMatch.venue || '-', dy);
      dy += rowStep;
      drawInfoRow('Toss', tossLine, dy);
      dy += rowStep;
      drawInfoRow('Captains', captainsLine, dy);
      dy += rowStep;
      drawInfoRow('Playing XI', playingXiLine, dy);
      dy += rowStep;
      drawInfoRow('Impact', impactUsedLine, dy);

      const scoreX = marginX + colW + gap;
      const scoreY = topRowY;
      drawCard(scoreX, scoreY, colW, topCardH, palette.panelSoft);
      drawSectionLabel('Score Snapshot', scoreX + 10, scoreY + 12);

      const drawScoreBlock = (
        blockY: number,
        label: string,
        teamName: string,
        totals: { teamTotal: number; wickets: number; overs: string; extras: number; wides: number; noBalls: number },
      ) => {
        const x = scoreX + 10;
        const w = colW - 20;
        const h = 18;
        setFill(palette.bg);
        doc.roundedRect(x, blockY, w, h, 4, 4, 'F');
        setDraw(palette.grid);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, blockY, w, h, 4, 4, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        setText(palette.muted);
        doc.text(fitText(`${label} — ${teamName || '-'}`, w - 46), x + 6, blockY + 6.8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        setText(palette.accentSoft);
        doc.text(`${totals.teamTotal}/${totals.wickets}`, x + w - 6, blockY + 8.4, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setText(palette.text);
        doc.text(
          fitText(`Overs ${totals.overs} • Extras ${totals.extras} • W ${totals.wides} • NB ${totals.noBalls}`, w - 12),
          x + 6,
          blockY + 15,
        );
      };

      drawScoreBlock(scoreY + 18, 'Innings 1', String(innings1BattingName || ''), inn1);
      drawScoreBlock(scoreY + 38, 'Innings 2', String(innings2BattingName || ''), inn2);

      const impactX = marginX;
      const impactY = topRowY + topCardH + 8;
      const impactW = contentW;
      const impactH = pageHeight - impactY - marginBottom;
      drawCard(impactX, impactY, impactW, impactH, palette.panel);
      drawSectionLabel('Impact Player', impactX + 10, impactY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setText(palette.muted);
      doc.text(
        fitText('Impact IN must be from the 5 nominated subs; OUT must be from the Playing XI.', impactW - 96),
        impactX + impactW - 10,
        impactY + 12,
        { align: 'right' },
      );

      autoTable(doc, {
        startY: impactY + 16,
        margin: { left: marginX + 10, right: marginX + 10, bottom: marginBottom },
        head: [[team1Label, team2Label]],
        body: [[formatImpactBlock('team1'), formatImpactBlock('team2')]],
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.6,
          cellPadding: { top: 3.4, right: 3.4, bottom: 3.4, left: 3.4 },
          valign: 'top',
          textColor: [palette.text[0], palette.text[1], palette.text[2]],
          fillColor: [palette.bg[0], palette.bg[1], palette.bg[2]],
          lineColor: [palette.grid[0], palette.grid[1], palette.grid[2]],
          lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [palette.accent[0], palette.accent[1], palette.accent[2]],
          textColor: [palette.text[0], palette.text[1], palette.text[2]],
          fontStyle: 'bold',
          fontSize: 9.4,
        },
        willDrawPage: (data) => {
          if (data.pageNumber === 1) return;
          drawBackground('cover');
          const barX = marginX;
          const barY = marginTop;
          const barW = pageWidth - marginX * 2;
          const barH = 22;
          drawCard(barX, barY, barW, barH, palette.panel);
          setFill(palette.accent);
          doc.rect(barX + 10, barY + barH - 4, barW - 20, 0.9, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          setText(palette.text);
          doc.text(fitText('Impact Player (continued)', barW - 120), barX + 10, barY + 13);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          setText(palette.muted);
          doc.text(fitText(title, barW - 40), barX + barW - 10, barY + 13, { align: 'right' });
        },
      });

      doc.addPage();

      const normalizeRowForPdf = (r: string[]) => {
        const next = HEADERS.map((_, idx) => String(r?.[idx] ?? ''));
        next[3] = resolvePlayerName(next[3]);
        next[4] = resolvePlayerName(next[4]);
        next[5] = resolvePlayerName(next[5]);
        return next;
      };

      const innings1Rows = rows.filter((r) => String(r?.[2] || '') === '1').map((r) => normalizeRowForPdf(r));
      const innings2Rows = rows.filter((r) => String(r?.[2] || '') === '2').map((r) => normalizeRowForPdf(r));

      const renderInningsTable = (
        inningsLabel: string,
        battingName: string,
        totals: { teamTotal: number; wickets: number; overs: string; extras: number },
        bodyRows: string[][],
      ) => {
        const barX = marginX;
        const barY = marginTop;
        const barW = pageWidth - marginX * 2;
        const barH = 22;
        const tableStartY = barY + barH + 8;

        autoTable(doc, {
          startY: tableStartY,
          margin: { left: marginX + 4, right: marginX + 4, top: tableStartY, bottom: marginBottom + 6 },
          head: [HEADERS],
          body: bodyRows,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 7,
            cellPadding: { top: 2.0, right: 1.8, bottom: 2.0, left: 1.8 },
            valign: 'middle',
            textColor: [palette.text[0], palette.text[1], palette.text[2]],
            fillColor: [palette.bg[0], palette.bg[1], palette.bg[2]],
            lineColor: [palette.grid[0], palette.grid[1], palette.grid[2]],
            lineWidth: 0.2,
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: [palette.accent[0], palette.accent[1], palette.accent[2]],
            textColor: [palette.text[0], palette.text[1], palette.text[2]],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            cellPadding: { top: 2.2, right: 1.8, bottom: 2.2, left: 1.8 },
          },
          alternateRowStyles: {
            fillColor: [palette.panel[0], palette.panel[1], palette.panel[2]],
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 12, halign: 'center' },
            6: { cellWidth: 10, halign: 'center' },
            7: { cellWidth: 10, halign: 'center' },
            8: { cellWidth: 12, halign: 'center' },
            9: { cellWidth: 10, halign: 'center' },
            10: { cellWidth: 10, halign: 'center' },
          },
          didParseCell: (data) => {
            if (data.section !== 'body') return;
            const col = data.column.index;
            const cellText = String(data.cell.raw ?? '').trim();
            const wicketCol = HEADERS.indexOf('Wicket');
            const wideCol = HEADERS.indexOf('Wide');
            const noBallCol = HEADERS.indexOf('No Ball');

            if (col === wicketCol && cellText) {
              (data.cell.styles as any).textColor = [palette.danger[0], palette.danger[1], palette.danger[2]];
              (data.cell.styles as any).fontStyle = 'bold';
            }

            if ((col === wideCol || col === noBallCol) && Number(cellText || 0) > 0) {
              (data.cell.styles as any).textColor = [palette.accentSoft[0], palette.accentSoft[1], palette.accentSoft[2]];
              (data.cell.styles as any).fontStyle = 'bold';
            }
          },
          willDrawPage: () => {
            drawBackground('table');

            drawCard(barX, barY, barW, barH, palette.panel);
            setFill(palette.accent);
            doc.rect(barX + 10, barY + barH - 4, barW - 20, 0.9, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            setText(palette.text);
            doc.text(fitText(`${inningsLabel}${battingName ? ` — ${battingName}` : ''}`, barW - 120), barX + 10, barY + 13);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.6);
            setText(palette.muted);
            doc.text(
              fitText(`${totals.teamTotal}/${totals.wickets} • ${totals.overs} ov • Extras ${totals.extras}`, barW - 120),
              barX + 10,
              barY + 18.6,
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            setText(palette.text);
            doc.text(fitText(title, barW - 20), barX + barW - 10, barY + 13, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.8);
            setText(palette.muted);
            doc.text(fitText('Ball-by-ball (including extras & wicket notes)', barW - 20), barX + barW - 10, barY + 18.6, { align: 'right' });

            const cardX = marginX;
            const cardY = tableStartY - 4;
            const cardW = pageWidth - marginX * 2;
            const cardH = pageHeight - cardY - marginBottom;
            drawCard(cardX, cardY, cardW, cardH, palette.panelSoft);
          },
        });
      };

      renderInningsTable('Innings 1', String(innings1BattingName || ''), inn1, innings1Rows);

      doc.addPage();
      renderInningsTable('Innings 2', String(innings2BattingName || ''), inn2, innings2Rows);

      const totalPages = (doc as any).internal?.getNumberOfPages?.() ? (doc as any).internal.getNumberOfPages() : (doc.internal as any).pages.length - 1;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.6);
        setText(palette.muted);
        doc.setLineWidth(0.2);
        setDraw(palette.grid);
        doc.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);
        doc.text(fitText(title, pageWidth - marginX * 2 - 70), marginX, pageHeight - 4);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 4, { align: 'right' });
      }

      doc.save(`ipl_live_score_${selectedMatchId || selectedMatch.id}.pdf`);
    } catch (err) {
      console.error('[IPL Live Score Table] PDF export failed:', err);
      alert('PDF export failed.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const buildCommentaryFromRows = (innings: '1' | '2') => {
    const lastRows: Array<{ row: string[]; idx: number }> = [];
    for (let i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i]?.[2] || '') !== innings) continue;
      lastRows.push({ row: rows[i], idx: i });
      if (lastRows.length >= 10) break;
    }
    return lastRows
      .reverse()
      .map(({ row, idx }) => {
        const over = row[0] || '';
        const ball = row[1] || '';
        const striker = resolvePlayerName(row[3] || '');
        const bowler = resolvePlayerName(row[5] || '');
        const runs = parseInt(String(row[6] || ''), 10) || 0;
        const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
        const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };

        const parts: string[] = [];
        const prefix = over && ball ? `${over}.${ball}` : '';
        if (prefix) parts.push(prefix);
        if (bowler || striker) parts.push(`${bowler || 'Bowler'} to ${striker || 'Batter'}`);

        if (wk.hasWicket) {
          parts.push(`WICKET${wk.wicketType ? ` (${wk.wicketType})` : ''}`);
        }

        if (ex.hasWide) {
          const wideRuns = 1 + (ex.wideExtraRuns || 0);
          parts.push(`Wide (${wideRuns})`);
        } else if (ex.hasNoBall) {
          parts.push('No-ball (+1)');
        }

        if (ex.hasByes) parts.push(`Byes (${ex.byesRuns || 0})`);
        if (ex.hasLB) parts.push(`LB (${ex.lbRuns || 0})`);

        if (!ex.hasWide) parts.push(`${runs} run${runs === 1 ? '' : 's'}`);

        const notes = row[12] || '';
        if (notes) parts.push(notes);
        return parts.filter(Boolean).join(' • ');
      })
      .filter(Boolean);
  };

  const computeBatterStats = (innings: '1' | '2', batterName: string) => {
    let runs = 0;
    let balls = 0;
    let legalBalls = 0;
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      if (String(row?.[2] || '') !== innings) continue;
      if (legalBalls >= MAX_LEGAL_BALLS) break;

      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
      const nonDelivery = isNonDeliveryWicket(wk);

      if (!nonDelivery && String(row?.[3] || '') === batterName) {
        const r = ex.hasWide ? 0 : parseInt(String(row?.[6] || ''), 10) || 0;
        runs += r;
        if (!ex.hasWide) balls += 1;
      }

      if (!ex.hasWide && !ex.hasNoBall && !nonDelivery) legalBalls += 1;
    }
    return { runs, balls };
  };

  const computeBowlerStats = (innings: '1' | '2', bowlerName: string) => {
    let runsConceded = 0;
    let balls = 0;
    let inningsLegalBalls = 0;
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      if (String(row?.[2] || '') !== innings) continue;
      if (inningsLegalBalls >= MAX_LEGAL_BALLS) break;

      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
      if (isNonDeliveryWicket(wk)) continue;

      if (String(row?.[5] || '') === bowlerName) {
        const batRuns = ex.hasWide ? 0 : parseInt(String(row?.[6] || ''), 10) || 0;
        runsConceded += batRuns;

        if (ex.hasWide) runsConceded += 1 + (ex.wideExtraRuns || 0);
        if (ex.hasNoBall) runsConceded += 1;

        if (!ex.hasWide && !ex.hasNoBall) balls += 1;
      }

      if (!ex.hasWide && !ex.hasNoBall) inningsLegalBalls += 1;
    }
    return { runs: runsConceded, balls };
  };

  const buildLiveScorePayload = () => {
    if (!selectedMatch) return null;

    const innings1 = calculateInningsTotals('1');
    const innings2 = calculateInningsTotals('2');

    const innings1BattingKey = getBattingTeamKeyForInnings('1');
    const team1Totals = innings1BattingKey === 'team1' ? innings1 : innings2;
    const team2Totals = innings1BattingKey === 'team1' ? innings2 : innings1;

    const currentInnings: '1' | '2' = innings2.legalBalls > 0 || rows.some((r) => String(r?.[2] || '') === '2') ? '2' : '1';
    const battingTeamKey = getBattingTeamKeyForInnings(currentInnings);

    const last = getLastRowForInnings(currentInnings);
    const currentBatterId = String(last?.row?.[3] || '').trim();
    const currentBowlerId = String(last?.row?.[5] || '').trim();
    const currentBatterName = currentBatterId ? resolvePlayerName(currentBatterId) : '';
    const currentBowlerName = currentBowlerId ? resolvePlayerName(currentBowlerId) : '';

    const batterStats = currentBatterId ? computeBatterStats(currentInnings, currentBatterId) : { runs: 0, balls: 0 };
    const bowlerStats = currentBowlerId ? computeBowlerStats(currentInnings, currentBowlerId) : { runs: 0, balls: 0 };

    return {
      matchId: selectedMatch.id,
      scoreUpdate: {
        team1: {
          name: selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1',
          runs: team1Totals.teamTotal,
          wickets: team1Totals.wickets,
          overs: parseFloat(team1Totals.overs),
        },
        team2: {
          name: selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2',
          runs: team2Totals.teamTotal,
          wickets: team2Totals.wickets,
          overs: parseFloat(team2Totals.overs),
        },
        currentBatter: {
          name: currentBatterName,
          runs: batterStats.runs,
          balls: batterStats.balls,
        },
        currentBowler: {
          name: currentBowlerName,
          runs: bowlerStats.runs,
          balls: bowlerStats.balls,
        },
        commentary: buildCommentaryFromRows(currentInnings),
        status: 'Live',
        innings: Number(currentInnings),
        battingTeam: battingTeamKey,
        toss: matchToss ? { winner: matchToss.winner, decision: matchToss.decision } : undefined,
        playing11: selectedMatch.playing11,
        impactPlayer: selectedMatch.impactPlayer,
      },
    };
  };

  const toTeamIdNumber = (value: string | number | undefined) => {
    if (typeof value === 'number') return value;
    const n = parseInt(String(value || 0), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const createScorecardIfMissing = async (token: string) => {
    if (!selectedMatch) throw new Error('Match not selected');

    const team1Id = toTeamIdNumber(selectedMatch.team1?.id);
    const team2Id = toTeamIdNumber(selectedMatch.team2?.id);

    const innings1BattingKey = getBattingTeamKeyForInnings('1');
    const innings1BattingTeamId = innings1BattingKey === 'team1' ? team1Id : team2Id;
    const innings2BattingTeamId = innings1BattingKey === 'team1' ? team2Id : team1Id;

    const tossWinnerName = matchToss
      ? matchToss.winner === 'team1'
        ? selectedMatch.team1?.name
        : selectedMatch.team2?.name
      : '';

    const payload = {
      matchId: selectedMatch.id,
      league: LEAGUE,
      matchInfo: {
        matchId: selectedMatch.id,
        team1: {
          id: team1Id,
          name: selectedMatch.team1?.name,
          shortName: selectedMatch.team1?.shortName,
        },
        team2: {
          id: team2Id,
          name: selectedMatch.team2?.name,
          shortName: selectedMatch.team2?.shortName,
        },
        venue: selectedMatch.venue,
        date: selectedMatch.date,
        time: selectedMatch.time,
        toss: { winner: tossWinnerName || '', decision: matchToss?.decision || '' },
        status: selectedMatch.status,
      },
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: innings1BattingTeamId,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0,
          fallOfWickets: [],
          powerplays: {
            mandatory: { overs: '', runs: 0 },
            optional: { overs: '', runs: 0 },
          },
          partnerships: [],
        },
        {
          inningsNumber: 2,
          battingTeamId: innings2BattingTeamId,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0,
          fallOfWickets: [],
          powerplays: {
            mandatory: { overs: '', runs: 0 },
            optional: { overs: '', runs: 0 },
          },
          partnerships: [],
        },
      ],
      result: {
        winner: String(resultWinner || '').trim(),
        margin: String(resultMargin || '').trim(),
        manOfTheMatch: String(resultManOfTheMatch || '').trim(),
      },
    };

    const resp = await fetch('/api/scorecards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error('Failed to create scorecard');
    return resp.json();
  };

  const getAdminAuthToken = () =>
    localStorage.getItem('adminToken') || localStorage.getItem('auth_token') || '';

  const saveMatchResult = async () => {
    try {
      if (!selectedMatchId || !selectedMatch) return;

      const token = getAdminAuthToken();
      if (!token) {
        alert('Admin token missing. Please login again.');
        return;
      }

      setResultStatus('saving');

      if (!scorecardId) {
        const created = await createScorecardIfMissing(token);
        const id = String(created?.id || '').trim();
        setScorecardId(id);
        setResultStatus('success');
        setTimeout(() => setResultStatus('idle'), 2000);
        return;
      }

      const resp = await fetch(`/api/scorecards/${encodeURIComponent(scorecardId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          result: {
            winner: String(resultWinner || '').trim(),
            margin: String(resultMargin || '').trim(),
            manOfTheMatch: String(resultManOfTheMatch || '').trim(),
          },
        }),
      });
      if (!resp.ok) throw new Error('Failed to save match result');

      const updated = await resp.json();
      setResultWinner(String(updated?.result?.winner || '').trim());
      setResultMargin(String(updated?.result?.margin || '').trim());
      setResultManOfTheMatch(String(updated?.result?.manOfTheMatch || '').trim());

      setResultStatus('success');
      setTimeout(() => setResultStatus('idle'), 2000);
    } catch (error) {
      console.error('[IPL Live Score Table] Save match result error:', error);
      setResultStatus('error');
      setTimeout(() => setResultStatus('idle'), 3000);
    }
  };

  const saveMatchAdvisory = async () => {
    try {
      if (!selectedMatchId || !selectedMatch) return;

      const token = getAdminAuthToken();
      if (!token) {
        alert('Admin token missing. Please login again.');
        return;
      }

      setAdvisoryStatus('saving');

      const trimmedNote = advisoryNote.trim();
      const reasonText = advisoryReason ? `Reason: ${advisoryReason}.` : '';
      const mergedNote = (() => {
        if (!trimmedNote && !reasonText) return '';
        if (!trimmedNote) return reasonText;
        if (!reasonText) return trimmedNote;
        const normalized = trimmedNote.toLowerCase();
        if (normalized.includes(advisoryReason.toLowerCase())) return trimmedNote;
        return `${trimmedNote} ${reasonText}`;
      })();
      const reducedOversValue = advisoryOvers ? Number(advisoryOvers) : NaN;

      const payload: Partial<Match> & { id: string } = {
        id: selectedMatch.id,
        statusNote: mergedNote || undefined,
        reducedOversTo: Number.isFinite(reducedOversValue) && reducedOversValue > 0 ? reducedOversValue : undefined,
        dlsApplied: advisoryDls ? true : undefined,
      };

      const resp = await fetch(`/api/matches?id=${encodeURIComponent(selectedMatch.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to save match advisory');

      const updated = (await resp.json()) as Match;
      setMatchDetails(updated);
      setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

      setAdvisoryNote(String(updated?.statusNote || '').trim());
      setAdvisoryOvers(
        Number.isFinite(Number(updated?.reducedOversTo)) && Number(updated?.reducedOversTo) > 0
          ? String(updated.reducedOversTo)
          : ''
      );
      setAdvisoryDls(Boolean(updated?.dlsApplied));

      setAdvisoryStatus('success');
      setTimeout(() => setAdvisoryStatus('idle'), 2000);
    } catch (error) {
      console.error('[IPL Live Score Table] Save match advisory error:', error);
      setAdvisoryStatus('error');
      setTimeout(() => setAdvisoryStatus('idle'), 3000);
    }
  };

  const reasonSuffix = advisoryReason ? ` due to ${advisoryReason.toLowerCase()}` : '';

  const applyAdvisoryPreset = (preset: 'abandoned' | 'no-result' | 'reduced-overs') => {
    if (preset === 'abandoned') {
      setAdvisoryNote(`Match abandoned${reasonSuffix}.`);
      setAdvisoryOvers('');
      setAdvisoryDls(false);
      return;
    }
    if (preset === 'no-result') {
      setAdvisoryNote(`No result${reasonSuffix}.`);
      setAdvisoryOvers('');
      setAdvisoryDls(false);
      return;
    }

    const oversText = advisoryOvers ? ` to ${advisoryOvers} per side` : '';
    setAdvisoryNote(`Overs reduced${oversText}${reasonSuffix}.`);
  };

  const syncScorecardFromTable = async () => {
    try {
      if (!selectedMatchId || !selectedMatch) return;

      const token = getAdminAuthToken();
      if (!token) {
        alert('Admin token missing. Please login again.');
        return;
      }

      setScorecardSyncStatus('saving');

      let activeScorecardId = String(scorecardId || '').trim();
      if (!activeScorecardId) {
        try {
          const resp = await fetch(
            `/api/scorecards?matchId=${encodeURIComponent(selectedMatchId)}&league=${encodeURIComponent(LEAGUE)}`
          );
          if (resp.ok) {
            const scorecards = await resp.json();
            const sc = Array.isArray(scorecards) ? scorecards[0] : null;
            activeScorecardId = String(sc?.id || '').trim();
          }
        } catch {}
      }

      if (!activeScorecardId) {
        const created = await createScorecardIfMissing(token);
        activeScorecardId = String(created?.id || '').trim();
      }

      if (!activeScorecardId) throw new Error('Scorecard not found or created');
      if (activeScorecardId !== scorecardId) setScorecardId(activeScorecardId);

      let existingScorecard: any = null;
      try {
        const resp = await fetch(`/api/scorecards/${encodeURIComponent(activeScorecardId)}`);
        if (resp.ok) existingScorecard = await resp.json();
      } catch {}

      const existingInnings = Array.isArray(existingScorecard?.innings) ? existingScorecard.innings : [];
      const existing1 =
        existingInnings.find((inn: any) => Number(inn?.inningsNumber) === 1) || existingInnings[0] || null;
      const existing2 =
        existingInnings.find((inn: any) => Number(inn?.inningsNumber) === 2) || existingInnings[1] || null;

      const mapWicketTypeToDismissalType = (wicketType: string) => {
        const type = String(wicketType || '').trim();
        switch (type) {
          case 'Bowled':
            return 'bowled';
          case 'Caught':
          case 'Caught & Bowled':
            return 'caught';
          case 'LBW':
            return 'lbw';
          case 'Run Out':
          case 'Mankad (Run out at non-striker end)':
            return 'run-out';
          case 'Stumped':
            return 'stumped';
          case 'Hit Wicket':
            return 'hit-wicket';
          case 'Obstructing the Field':
            return 'obstructing';
          case 'Hit the Ball Twice':
            return 'handled-ball';
          case 'Retired Hurt':
            return 'retired-hurt';
          case 'Retired Out':
            return 'retired-out';
          case 'Timed Out':
            return 'timed-out';
          default:
            return type ? type.toLowerCase().replace(/\s+/g, '-') : 'run-out';
        }
      };

      const isBowlerWicketType = (wicketType: string) => {
        const type = String(wicketType || '').trim();
        return (
          type === 'Bowled' ||
          type === 'Caught' ||
          type === 'LBW' ||
          type === 'Stumped' ||
          type === 'Hit Wicket' ||
          type === 'Caught & Bowled' ||
          type === 'Hit the Ball Twice'
        );
      };

      const buildDismissal = (wk: WicketRow, bowlerId: string) => {
        const wicketType = String(wk.wicketType || '').trim();
        const dismissalType = mapWicketTypeToDismissalType(wicketType);
        const bowlerName = bowlerId ? resolvePlayerName(String(bowlerId)) : '';

        const fielder1Id = String(wk.wicketTaker || '').trim();
        const fielder2Id = String(wk.wicketAssistant || '').trim();
        const fielderNames = [fielder1Id, fielder2Id]
          .map((id) => (id ? resolvePlayerName(id) : ''))
          .filter(Boolean);
        const fielderCombined = fielderNames.join('/');

        const dismissal: any = { type: dismissalType };

        const setDetails = (details: string) => {
          const cleaned = String(details || '').trim();
          if (cleaned) dismissal.details = cleaned;
        };

        if (wicketType === 'Bowled') {
          if (bowlerName) setDetails(`b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
        } else if (wicketType === 'LBW') {
          if (bowlerName) setDetails(`lbw b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
        } else if (wicketType === 'Caught') {
          if (fielderNames[0] && bowlerName) setDetails(`c ${fielderNames[0]} b ${bowlerName}`);
          else if (bowlerName) setDetails(`c & b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
          if (fielder1Id) dismissal.fielderId = fielder1Id;
        } else if (wicketType === 'Caught & Bowled') {
          if (bowlerName) setDetails(`c & b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
          if (bowlerId) dismissal.fielderId = bowlerId;
        } else if (wicketType === 'Stumped') {
          if (fielderNames[0] && bowlerName) setDetails(`st ${fielderNames[0]} b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
          if (fielder1Id) dismissal.fielderId = fielder1Id;
        } else if (wicketType === 'Hit Wicket') {
          if (bowlerName) setDetails(`hit wicket b ${bowlerName}`);
          dismissal.bowlerId = bowlerId;
        } else if (wicketType === 'Run Out') {
          if (fielderCombined) setDetails(`run out (${fielderCombined})`);
          else setDetails('run out');
          if (fielder1Id) dismissal.fielderId = fielder1Id;
        } else if (wicketType === 'Mankad (Run out at non-striker end)') {
          if (fielderCombined) setDetails(`run out (Mankad/${fielderCombined})`);
          else setDetails('run out (Mankad)');
          if (fielder1Id) dismissal.fielderId = fielder1Id;
        } else if (wicketType === 'Obstructing the Field') {
          setDetails('obstructing the field');
          if (fielder1Id) dismissal.fielderId = fielder1Id;
        } else if (wicketType === 'Hit the Ball Twice') {
          setDetails('hit the ball twice');
          dismissal.bowlerId = bowlerId;
        } else if (wicketType === 'Timed Out') {
          setDetails('timed out');
        } else if (wicketType === 'Retired Out') {
          setDetails('retired out');
        } else if (wicketType === 'Retired Hurt') {
          setDetails('retired hurt');
        }

        return dismissal;
      };

      const buildInningsFromTable = (innings: '1' | '2', existing: any) => {
        const inningsNumber = innings === '1' ? 1 : 2;
        const battingKey = getBattingTeamKeyForInnings(innings);
        const bowlingKey = otherTeamKey(battingKey);
        const battingCaptainId = matchCaptains[battingKey]?.id || '';
        const bowlingCaptainId = matchCaptains[bowlingKey]?.id || '';

        const team1Id = toTeamIdNumber(selectedMatch.team1?.id);
        const team2Id = toTeamIdNumber(selectedMatch.team2?.id);
        const battingTeamId = battingKey === 'team1' ? team1Id : team2Id;

        const batterOrder: string[] = [];
        const batterSeen = new Set<string>();
        const bowlerOrder: string[] = [];
        const bowlerSeen = new Set<string>();
        const batters = new Map<string, any>();
        const bowlers = new Map<string, any>();

        const ensureBatter = (id: string) => {
          const cleaned = String(id || '').trim();
          if (!cleaned) return null;
          if (!batterSeen.has(cleaned)) {
            batterSeen.add(cleaned);
            batterOrder.push(cleaned);
          }
          if (!batters.has(cleaned)) {
            batters.set(cleaned, {
              playerId: cleaned,
              name: resolvePlayerName(cleaned),
              isCaptain: Boolean(battingCaptainId && cleaned === battingCaptainId),
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              dismissal: undefined,
            });
          }
          return batters.get(cleaned);
        };

        const ensureBowler = (id: string) => {
          const cleaned = String(id || '').trim();
          if (!cleaned) return null;
          if (!bowlerSeen.has(cleaned)) {
            bowlerSeen.add(cleaned);
            bowlerOrder.push(cleaned);
          }
          if (!bowlers.has(cleaned)) {
            bowlers.set(cleaned, {
              playerId: cleaned,
              name: resolvePlayerName(cleaned),
              isCaptain: Boolean(bowlingCaptainId && cleaned === bowlingCaptainId),
              balls: 0,
              runs: 0,
              wickets: 0,
              wides: 0,
              noBalls: 0,
              overAgg: new Map<string, { balls: number; runs: number }>(),
            });
          }
          return bowlers.get(cleaned);
        };

        let teamTotal = 0;
        let legalBalls = 0;
        let widesRuns = 0;
        let noBallRuns = 0;
        let byesRuns = 0;
        let legByesRuns = 0;
        let wicketCount = 0;
        const fallOfWickets: Array<{ player: string; score: string; over: string }> = [];

        const toSortableNumber = (value: unknown) => {
          const n = Number.parseInt(String(value || '').trim(), 10);
          return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
        };

        const deliveries = rows
          .map((row, idx) => ({ row, idx }))
          .filter(({ row }) => String(row?.[2] || '') === innings)
          .sort((a, b) => {
            const overA = toSortableNumber(a.row?.[0]);
            const overB = toSortableNumber(b.row?.[0]);
            if (overA !== overB) return overA - overB;
            const ballA = toSortableNumber(a.row?.[1]);
            const ballB = toSortableNumber(b.row?.[1]);
            if (ballA !== ballB) return ballA - ballB;
            return a.idx - b.idx;
          });

        const MANDATORY_POWERPLAY_BALLS = 36;
        let mandatoryPowerplayRuns = 0;
        let mandatoryPowerplayLegalBalls = 0;

        const partnerships: any[] = [];
        let currentPartnership: any = null;

        const startPartnership = (strikerId: string, nonStrikerId: string) => {
          const a = String(strikerId || '').trim();
          const b = String(nonStrikerId || '').trim();
          if (!a || !b || a === b) return;
          currentPartnership = {
            ids: [a, b],
            key: [a, b].slice().sort().join('|'),
            totalRuns: 0,
            runsById: { [a]: 0, [b]: 0 },
            ballsById: { [a]: 0, [b]: 0 },
          };
        };

        const pushCurrentPartnership = () => {
          if (!currentPartnership) return;
          const [a, b] = currentPartnership.ids as [string, string];
          const totalRuns = Number(currentPartnership.totalRuns) || 0;
          const runsA = Number(currentPartnership.runsById?.[a]) || 0;
          const ballsA = Number(currentPartnership.ballsById?.[a]) || 0;
          const runsB = Number(currentPartnership.runsById?.[b]) || 0;
          const ballsB = Number(currentPartnership.ballsById?.[b]) || 0;
          const hasAny = totalRuns > 0 || ballsA > 0 || ballsB > 0;

          if (hasAny) {
            partnerships.push({
              batsman1: resolvePlayerName(a),
              batsman1Runs: String(runsA),
              batsman1Balls: String(ballsA),
              batsman2: resolvePlayerName(b),
              batsman2Runs: String(runsB),
              batsman2Balls: String(ballsB),
              totalRuns: String(totalRuns),
            });
          }

          currentPartnership = null;
        };

        for (const { row, idx } of deliveries) {
          if (legalBalls >= MAX_LEGAL_BALLS) break;

          const strikerId = String(row?.[3] || '').trim();
          const nonStrikerId = String(row?.[4] || '').trim();
          const bowlerId = String(row?.[5] || '').trim();

          ensureBatter(strikerId);
          ensureBatter(nonStrikerId);
          const bowler = ensureBowler(bowlerId);

          const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
          const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };
          const nonDelivery = isNonDeliveryWicket(wk);

          const isWide = Boolean(ex.hasWide);
          const isNoBall = Boolean(ex.hasNoBall);

          const batRuns = !nonDelivery && !isWide ? parseInt(String(row?.[6] || ''), 10) || 0 : 0;
          const wideRuns = !nonDelivery && isWide ? 1 + (ex.wideExtraRuns || 0) : 0;
          const nbRuns = !nonDelivery && isNoBall ? 1 : 0;
          const bRuns = !nonDelivery && ex.hasByes && !isWide ? ex.byesRuns || 0 : 0;
          const lbRuns = !nonDelivery && ex.hasLB && !isWide ? ex.lbRuns || 0 : 0;
          const totalRunsThisRow = batRuns + wideRuns + nbRuns + bRuns + lbRuns;

          if (mandatoryPowerplayLegalBalls < MANDATORY_POWERPLAY_BALLS) {
            mandatoryPowerplayRuns += totalRunsThisRow;
            if (!nonDelivery && !isWide && !isNoBall) mandatoryPowerplayLegalBalls += 1;
          }

          if (strikerId && nonStrikerId) {
            const key = [strikerId, nonStrikerId].slice().sort().join('|');
            if (!currentPartnership) {
              startPartnership(strikerId, nonStrikerId);
            } else if (key !== currentPartnership.key) {
              pushCurrentPartnership();
              startPartnership(strikerId, nonStrikerId);
            }
          }

          if (currentPartnership) {
            currentPartnership.totalRuns += totalRunsThisRow;
            if (strikerId) {
              currentPartnership.runsById[strikerId] = (currentPartnership.runsById[strikerId] || 0) + batRuns;
              if (!nonDelivery && !isWide) {
                currentPartnership.ballsById[strikerId] = (currentPartnership.ballsById[strikerId] || 0) + 1;
              }
            }
          }

          if (!nonDelivery) {
            teamTotal += totalRunsThisRow;
            widesRuns += wideRuns;
            noBallRuns += nbRuns;
            byesRuns += bRuns;
            legByesRuns += lbRuns;

            const striker = ensureBatter(strikerId);
            if (striker) {
              striker.runs += batRuns;
              if (!isWide) striker.balls += 1;
              if (batRuns === 4) striker.fours += 1;
              if (batRuns === 6) striker.sixes += 1;
            }

            if (bowler) {
              bowler.runs += batRuns + wideRuns + nbRuns;
              if (isWide) bowler.wides += 1;
              if (isNoBall) bowler.noBalls += 1;
              if (!isWide && !isNoBall) bowler.balls += 1;

              const overKey = String(row?.[0] || '').trim();
              if (overKey) {
                const current = bowler.overAgg.get(overKey) || { balls: 0, runs: 0 };
                if (!isWide && !isNoBall) current.balls += 1;
                current.runs += batRuns + wideRuns + nbRuns;
                bowler.overAgg.set(overKey, current);
              }
            }

            if (!isWide && !isNoBall) legalBalls += 1;
          }

          if (!wk.hasWicket) continue;

          const wicketType = String(wk.wicketType || '').trim();
          const outRole =
            wicketType === 'Mankad (Run out at non-striker end)'
              ? 'nonStriker'
              : wk.outBatter === 'nonStriker'
                ? 'nonStriker'
                : 'striker';

          const dismissedId = outRole === 'nonStriker' ? nonStrikerId : strikerId;
          const dismissed = ensureBatter(dismissedId);

          if (isRetiredHurtEvent(wk)) {
            if (dismissed && (!dismissed.dismissal || dismissed.dismissal.type === 'not-out')) {
              dismissed.dismissal = buildDismissal(wk, bowlerId);
            }
            pushCurrentPartnership();
            continue;
          }

          wicketCount += 1;

          if (dismissed && (!dismissed.dismissal || dismissed.dismissal.type === 'retired-hurt')) {
            dismissed.dismissal = buildDismissal(wk, bowlerId);
          }

          const over = String(row?.[0] || '').trim();
          const ball = String(row?.[1] || '').trim();
          const overBall = over && ball ? `${over}.${ball}` : '';
          const dismissedName = dismissed ? String(dismissed.name || dismissedId) : resolvePlayerName(dismissedId);
          if (dismissedName) {
            fallOfWickets.push({
              player: dismissedName,
              score: `${teamTotal}/${wicketCount}`,
              over: overBall,
            });
          }

          if (bowler && isBowlerWicketType(wicketType)) {
            bowler.wickets += 1;
          }

          pushCurrentPartnership();
        }

        pushCurrentPartnership();

        const batting = batterOrder
          .map((id) => {
            const b = batters.get(id);
            if (!b) return null;
            const balls = Number(b.balls) || 0;
            const runs = Number(b.runs) || 0;
            const strikeRate = balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;
            const dismissal = b.dismissal || { type: 'not-out' };
            return { ...b, strikeRate, dismissal };
          })
          .filter(Boolean);

        const bowling = bowlerOrder
          .map((id) => {
            const bw = bowlers.get(id);
            if (!bw) return null;
            const maidens = Array.from(bw.overAgg.values()).filter((o: any) => o.balls === 6 && (o.runs || 0) === 0)
              .length;
            const balls = Number(bw.balls) || 0;
            const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
            const economyRate =
              balls > 0 ? parseFloat(((Number(bw.runs || 0) / (balls / 6)) || 0).toFixed(2)) : 0;

            return {
              playerId: bw.playerId,
              name: bw.name,
              isCaptain: bw.isCaptain,
              overs,
              balls,
              runs: Number(bw.runs) || 0,
              wickets: Number(bw.wickets) || 0,
              maidens,
              economyRate,
              wides: Number(bw.wides) || 0,
              noBalls: Number(bw.noBalls) || 0,
            };
          })
          .filter(Boolean);

        const inningsOvers = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

        const formatOversFromBalls = (balls: number) => {
          const overs = Math.floor(balls / 6);
          const rem = balls % 6;
          return rem === 0 ? String(overs) : `${overs}.${rem}`;
        };

        const mandatoryPowerplayOvers =
          mandatoryPowerplayLegalBalls > 0 ? `0.1 - ${formatOversFromBalls(mandatoryPowerplayLegalBalls)}` : '';

        const base =
          existing && typeof existing === 'object'
            ? { ...existing }
            : {
                inningsNumber,
                battingTeamId,
                batting: [],
                bowling: [],
                extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
                totalRuns: 0,
                totalWickets: 0,
                totalOvers: 0,
                fallOfWickets: [],
                powerplays: {
                  mandatory: { overs: '', runs: 0 },
                  optional: { overs: '', runs: 0 },
                },
                partnerships: [],
              };

        const optionalPowerplay =
          base?.powerplays && typeof base.powerplays === 'object' && base.powerplays.optional
            ? base.powerplays.optional
            : { overs: '', runs: 0 };

        return {
          ...base,
          inningsNumber,
          battingTeamId,
          batting,
          bowling,
          extras: {
            wides: widesRuns,
            noBalls: noBallRuns,
            byes: byesRuns,
            legByes: legByesRuns,
          },
          totalRuns: teamTotal,
          totalWickets: wicketCount,
          totalOvers: inningsOvers,
          fallOfWickets,
          powerplays: {
            mandatory: { overs: mandatoryPowerplayOvers, runs: mandatoryPowerplayRuns },
            optional: optionalPowerplay,
          },
          partnerships,
        };
      };

      const innings1 = buildInningsFromTable('1', existing1);
      const innings2 = buildInningsFromTable('2', existing2);

      const updateResp = await fetch(`/api/scorecards/${encodeURIComponent(activeScorecardId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ innings: [innings1, innings2] }),
      });
      if (!updateResp.ok) throw new Error('Failed to update scorecard innings');

      setScorecardSyncStatus('success');
      setTimeout(() => setScorecardSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('[IPL Live Score Table] Scorecard sync error:', error);
      setScorecardSyncStatus('error');
      setTimeout(() => setScorecardSyncStatus('idle'), 3000);
    }
  };

  const saveRows = async () => {
    if (!selectedMatchId) return;
    setSaveStatus('saving');
    try {
      const resp = await fetch(`/api/ipl-live-score/save?matchId=${encodeURIComponent(selectedMatchId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, extrasData, wicketData }),
      });
      if (!resp.ok) throw new Error('Failed saving rows to KV');

      const token = getAdminAuthToken();

      const payload = buildLiveScorePayload();
      if (payload && token) {
        try {
          await fetch('/api/live-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.error('[IPL Live Score Table] Publish failed:', e);
        }
      }

      if (token) {
        await syncScorecardFromTable();
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[IPL Live Score Table] Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const publishNow = async () => {
    try {
      const payload = buildLiveScorePayload();
      const token = getAdminAuthToken();
      if (!payload || !token) return;

      setSaveStatus('saving');
      const resp = await fetch('/api/live-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to publish');

      await syncScorecardFromTable();

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('[IPL Live Score Table] Publish error:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const renderCell = (cellValue: string, colIndex: number, rowIndex: number) => {
    const row = rows[rowIndex] || [];
    const innings = (String(row?.[2] || '1') as '1' | '2') || '1';
    const battingKey = getBattingTeamKeyForInnings(innings);
    const bowlingKey = otherTeamKey(battingKey);

    const battingOptions = getTeamPlayerOptions(battingKey);
    const bowlingOptions = getTeamPlayerOptions(bowlingKey);

    const ex = { ...DEFAULT_EXTRAS, ...(extrasData[rowIndex] || {}) };
    const wk = { ...DEFAULT_WICKET, ...(wicketData[rowIndex] || {}) };

    switch (colIndex) {
      case 0: {
        return (
          <input
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            placeholder="Over"
            inputMode="numeric"
            className={scoreTableInputClass}
          />
        );
      }
      case 1: {
        return (
          <input
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            placeholder="Ball"
            inputMode="numeric"
            className={scoreTableInputClass}
          />
        );
      }
      case 2: {
        return <span className="text-white/60">{cellValue}</span>;
      }
      case 3:
      case 4: {
        const label = colIndex === 3 ? 'Striker' : 'Non-Striker';
        return (
          <input
            value={resolvePlayerName(cellValue || '')}
            onChange={(e) => updateCell(rowIndex, colIndex, normalizePlayerSelectionInput(e.target.value, battingOptions))}
            list={getTeamPlayerDatalistId(selectedMatchId, battingKey)}
            placeholder={`Search ${label.toLowerCase()} or type name`}
            className={scoreTableInputClass}
          />
        );
      }
      case 5: {
        return (
          <input
            value={resolvePlayerName(cellValue || '')}
            onChange={(e) => updateCell(rowIndex, colIndex, normalizePlayerSelectionInput(e.target.value, bowlingOptions))}
            list={getTeamPlayerDatalistId(selectedMatchId, bowlingKey)}
            placeholder="Search bowler or type name"
            className={scoreTableInputClass}
          />
        );
      }
      case 6: {
        return (
          <select
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className={scoreTableSelectClass}
          >
            <option value="">Runs</option>
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={String(i)}>
                {i}
              </option>
            ))}
          </select>
        );
      }
      case 7: {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ex.hasWide}
                onChange={(e) => onExtrasChange(rowIndex, 'hasWide', e.target.checked)}
                className={scoreTableCheckboxClass}
              />
              <span className="text-xs text-white/70">Wide</span>
            </div>
            {ex.hasWide && (
              <select
                value={ex.wideExtraRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'wideExtraRuns', parseInt(e.target.value, 10) || 0)}
                className={`${scoreTableSelectClass} text-xs`}
              >
                <option value={0}>+0 (1 total)</option>
                <option value={1}>+1 (2 total)</option>
                <option value={2}>+2 (3 total)</option>
                <option value={3}>+3 (4 total)</option>
                <option value={4}>Boundary (5 total)</option>
              </select>
            )}
          </div>
        );
      }
      case 8: {
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ex.hasNoBall}
              onChange={(e) => onExtrasChange(rowIndex, 'hasNoBall', e.target.checked)}
              className={scoreTableCheckboxClass}
            />
            <span className="text-xs text-white/70">No-ball (+1)</span>
          </div>
        );
      }
      case 9: {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ex.hasByes}
                onChange={(e) => onExtrasChange(rowIndex, 'hasByes', e.target.checked)}
                className={scoreTableCheckboxClass}
              />
              <span className="text-xs text-white/70">Byes</span>
            </div>
            {ex.hasByes && (
              <select
                value={ex.byesRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'byesRuns', parseInt(e.target.value, 10) || 0)}
                className={`${scoreTableSelectClass} text-xs`}
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      }
      case 10: {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ex.hasLB}
                onChange={(e) => onExtrasChange(rowIndex, 'hasLB', e.target.checked)}
                className={scoreTableCheckboxClass}
              />
              <span className="text-xs text-white/70">LB</span>
            </div>
            {ex.hasLB && (
              <select
                value={ex.lbRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'lbRuns', parseInt(e.target.value, 10) || 0)}
                className={`${scoreTableSelectClass} text-xs`}
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      }
      case 11: {
        const allowedWicketTypes = ex.hasNoBall
          ? WICKET_TYPES.filter((t) => t === 'Hit the Ball Twice' || t === 'Obstructing the Field' || t === 'Run Out')
          : ex.hasWide
            ? WICKET_TYPES.filter((t) => t === 'Hit Wicket' || t === 'Obstructing the Field' || t === 'Run Out' || t === 'Stumped')
            : WICKET_TYPES;

        const showOutBatter =
          wk.wicketType === 'Run Out' ||
          wk.wicketType === 'Obstructing the Field' ||
          wk.wicketType === 'Mankad (Run out at non-striker end)';

        const outBatterDisabled = wk.wicketType === 'Mankad (Run out at non-striker end)';

        const showWicketTaker = Boolean(wk.wicketType) && ![
          'Bowled',
          'LBW',
          'Hit Wicket',
          'Caught & Bowled',
          'Timed Out',
          'Retired Hurt',
          'Retired Out',
        ].includes(wk.wicketType);

        const showWicketAssistant = wk.wicketType === 'Run Out';

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wk.hasWicket}
                onChange={(e) => onWicketChange(rowIndex, 'hasWicket', e.target.checked)}
                className={scoreTableCheckboxClass}
              />
              <span className="text-xs text-white/70">Wicket</span>
            </div>
            {wk.hasWicket && (
              <>
                <select
                  value={wk.wicketType}
                  onChange={(e) => onWicketChange(rowIndex, 'wicketType', e.target.value)}
                  className={`${scoreTableSelectClass} text-xs`}
                >
                  <option value="">Type...</option>
                  {allowedWicketTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {showOutBatter && (
                  <select
                    value={outBatterDisabled ? 'nonStriker' : wk.outBatter}
                    onChange={(e) => onWicketChange(rowIndex, 'outBatter', e.target.value)}
                    disabled={outBatterDisabled}
                    className={`${scoreTableSelectClass} text-xs disabled:opacity-70`}
                  >
                    <option value="striker">Out: Striker</option>
                    <option value="nonStriker">Out: Non-striker</option>
                  </select>
                )}
                {showWicketTaker && (
                  <input
                    value={resolvePlayerName(wk.wicketTaker || '')}
                    onChange={(e) =>
                      onWicketChange(rowIndex, 'wicketTaker', normalizePlayerSelectionInput(e.target.value, bowlingOptions))
                    }
                    list={getTeamPlayerDatalistId(selectedMatchId, bowlingKey)}
                    placeholder="Search fielder or bowler"
                    className={`${scoreTableInputClass} text-xs`}
                  />
                )}
                {showWicketAssistant && (
                  <input
                    value={resolvePlayerName(wk.wicketAssistant || '')}
                    onChange={(e) =>
                      onWicketChange(
                        rowIndex,
                        'wicketAssistant',
                        normalizePlayerSelectionInput(
                          e.target.value,
                          bowlingOptions.filter((opt) => !wk.wicketTaker || opt.id !== wk.wicketTaker)
                        )
                      )
                    }
                    list={getTeamPlayerDatalistId(selectedMatchId, bowlingKey)}
                    placeholder="Search assistant fielder"
                    className={`${scoreTableInputClass} text-xs`}
                  />
                )}
              </>
            )}
          </div>
        );
      }
      default: {
        return (
          <input
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            placeholder="Notes"
            className={scoreTableInputClass}
          />
        );
      }
    }
  };

  const innings1BattingKey = getBattingTeamKeyForInnings('1');
  const innings2BattingKey = otherTeamKey(innings1BattingKey);

  const innings1BattingName =
    innings1BattingKey === 'team1'
      ? selectedMatch?.team1?.shortName || selectedMatch?.team1?.name
      : selectedMatch?.team2?.shortName || selectedMatch?.team2?.name;
  const innings2BattingName =
    innings2BattingKey === 'team1'
      ? selectedMatch?.team1?.shortName || selectedMatch?.team1?.name
      : selectedMatch?.team2?.shortName || selectedMatch?.team2?.name;

  const inn1 = calculateInningsTotals('1');
  const inn2 = calculateInningsTotals('2');
  const matchTitle = selectedMatch
    ? `${selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1'} vs ${
        selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2'
      }`
    : 'Select an IPL match';
  const matchDateLine = selectedMatch
    ? [selectedMatch.date?.split('T')[0] || '', selectedMatch.time || ''].filter(Boolean).join(' ')
    : '';
  const tossDisplay =
    selectedMatch && matchToss
      ? `${matchToss.winner === 'team1' ? selectedMatch.team1?.shortName : selectedMatch.team2?.shortName} chose ${
          matchToss.decision
        }`
      : 'Toss not set';
  const currentTotals = fastInnings === '1' ? inn1 : inn2;
  const currentBattingName = fastInnings === '1' ? innings1BattingName : innings2BattingName;
  const currentPhase = getInningsPhase(currentTotals.legalBalls, fastInningsComplete);
  const currentRunRate = formatRunRate(currentTotals.teamTotal, currentTotals.legalBalls);
  const chaseTarget = inn1.teamTotal > 0 ? inn1.teamTotal + 1 : 0;
  const chaseRunsNeeded = Math.max(0, chaseTarget - inn2.teamTotal);
  const chaseBallsLeft = Math.max(0, MAX_LEGAL_BALLS - inn2.legalBalls);
  const requiredRunRate =
    fastInnings === '2' && chaseTarget > 0 && chaseRunsNeeded > 0 && chaseBallsLeft > 0
      ? (chaseRunsNeeded / (chaseBallsLeft / 6)).toFixed(2)
      : null;
  const recentCommentary = buildCommentaryFromRows(fastInnings).slice(-5);

  return (
    <div className="oil-panel relative w-full min-w-0 max-w-[calc(100vw-2rem)] overflow-hidden p-4 text-white shadow-2xl lg:max-w-[calc(100vw-18rem)] sm:p-6">
      <style jsx global>{`
        @keyframes iplOilWash {
          0% {
            background-position: 45% 42%;
            transform: scale(1);
          }
          100% {
            background-position: 58% 50%;
            transform: scale(1.04);
          }
        }

        @keyframes iplScorePulse {
          0%,
          100% {
            opacity: 0.62;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.22);
          }
        }

        .ipl-oil-wash {
          animation: iplOilWash 18s ease-in-out infinite alternate;
        }

        .ipl-live-pulse {
          animation: iplScorePulse 2.4s ease-in-out infinite;
        }

        .ipl-score-card {
          transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
        }

        .ipl-score-card:hover {
          transform: translateY(-2px);
          border-color: rgba(215, 168, 91, 0.34);
          background-color: rgba(255, 255, 255, 0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          .ipl-oil-wash,
          .ipl-live-pulse {
            animation: none;
          }

          .ipl-score-card,
          .ipl-score-card:hover {
            transform: none;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="ipl-oil-wash pointer-events-none absolute inset-0 bg-[url('/images/cricket-oil-stadium-hero.png')] bg-cover bg-center opacity-20 saturate-125"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(7,17,15,0.95)_0%,rgba(20,49,43,0.86)_38%,rgba(58,38,21,0.78)_68%,rgba(7,17,15,0.96)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(215,168,91,0.08)_52%,transparent_100%)]"
      />
      <div className="relative z-10">
      {(['team1', 'team2'] as const).map((teamKey) => {
        const options = getTeamPlayerOptions(teamKey);
        const captainId = matchCaptains[teamKey].id;
        const impact = teamKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;

        return (
          <datalist key={teamKey} id={getTeamPlayerDatalistId(selectedMatchId, teamKey)}>
            {options.map((opt) => (
              <option
                key={opt.id}
                value={opt.name}
                label={formatPlayerOptionLabel(opt.name, {
                  isCaptain: Boolean(captainId && opt.id === captainId),
                  isImpactIn: Boolean(impact.impactId && opt.id === impact.impactId),
                  isImpactOut: Boolean(impact.originalId && opt.id === impact.originalId),
                })}
              />
            ))}
          </datalist>
        );
      })}
      <datalist id={getResultPlayerDatalistId(selectedMatchId)}>
        {resultPlayerNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <header className="mb-6 flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7a85b]/30 bg-[#d7a85b]/10 px-3 py-1 text-xs font-semibold text-[#f2d39a]">
            <span className="ipl-live-pulse h-2 w-2 rounded-full bg-[#4cc39a]" />
            IPL 2026 scoring console
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-7 w-7 text-[#d7a85b]" />
            <h1 className="text-2xl font-bold text-white sm:text-3xl">IPL Fast Live Scoring Console</h1>
          </div>
          <div className="mt-1 text-sm font-medium text-[#f2d39a]">{matchTitle}</div>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Record legal balls, extras, wickets, Impact Player moves, match advisories, and scorecard sync from one
            scorer-friendly desk.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4 2xl:min-w-[460px]">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-white/50">Next ball</div>
            <div className="mt-1 font-semibold text-white">
              {fastInningsComplete ? `${MAX_OVERS}.0 done` : `${fastNextBall.over}.${fastNextBall.ball}`}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-white/50">Phase</div>
            <div className="mt-1 font-semibold text-[#f2d39a]">{currentPhase}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-white/50">Run rate</div>
            <div className="mt-1 font-semibold text-white">{currentRunRate}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-white/50">Save state</div>
            <div className="mt-1 font-semibold text-[#9cf2c8]">{getStatusText(saveStatus, 'Draft')}</div>
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <div className="oil-panel p-4 shadow-xl shadow-black/15">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Match Control</div>
              <div className="text-xs text-white/50">Choose the fixture before scoring or publishing.</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-white/60">
              <Clock3 className="h-3.5 w-3.5" />
              {matchDateLine || 'Fixture pending'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Season</label>
              <select
                value={seasonYear === null ? 'all' : String(seasonYear)}
                onChange={(e) => {
                  const value = e.target.value;
                  setSeasonYear(value === 'all' ? null : parseInt(value, 10) || null);
                }}
                className={`w-full ${fieldClass}`}
                disabled={!matches.length}
              >
                {availableSeasonYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
                <option value="all">All seasons</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Match</label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className={`w-full ${fieldClass}`}
                disabled={!visibleMatches.length}
              >
                <option value="">Select match to score...</option>
                {visibleMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team1?.shortName || m.team1?.name} vs {m.team2?.shortName || m.team2?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 text-xs text-white/50">
            Showing {visibleMatches.length} IPL fixture{visibleMatches.length === 1 ? '' : 's'}
          </div>

          {selectedMatch && (
            <div className="mt-4 grid gap-2 text-xs text-white/60 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="block text-white/40">Venue</span>
                <span className="font-medium text-white">{selectedMatch.venue || 'Not set'}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="block text-white/40">Toss</span>
                <span className="font-medium text-white">{tossDisplay}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="block text-white/40">Captains</span>
                <span className="font-medium text-white">
                  {(matchCaptains.team1.name || matchCaptains.team2.name)
                    ? `${matchCaptains.team1.name || '-'} / ${matchCaptains.team2.name || '-'}`
                    : 'Not set'}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="block text-white/40">Playing XI</span>
                <span className="font-medium text-white">
                  {hasPlaying11 ? 'Confirmed' : 'Not set - full squad suggestions enabled'}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2">
                <span className="block text-white/40">Impact Player</span>
                <span className="font-medium text-white">
                  {(impactPlayerInfo.team1.impactName || impactPlayerInfo.team2.impactName)
                    ? `${impactPlayerInfo.team1.impactName || '-'} / ${impactPlayerInfo.team2.impactName || '-'}`
                    : 'Not used yet'}
                </span>
              </div>
            </div>
          )}

          {selectedMatch && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#f2d39a]">Match Advisory</div>
                <div className={`rounded-full border px-2 py-1 text-[11px] ${getStatusClass(advisoryStatus)}`}>
                  {getStatusText(advisoryStatus, 'No advisory')}
                </div>
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Post rain, bad-light, DLS, abandoned, or reduced-over notes to the match cards and match center.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyAdvisoryPreset('abandoned')}
                  className="rounded-full border border-[#e5655f]/40 px-3 py-1.5 text-[11px] text-[#ffaaa5] transition hover:bg-[#e5655f]/10"
                >
                  Abandoned
                </button>
                <button
                  type="button"
                  onClick={() => applyAdvisoryPreset('no-result')}
                  className="rounded-full border border-[#d7a85b]/40 px-3 py-1.5 text-[11px] text-[#f2d39a] transition hover:bg-[#d7a85b]/10"
                >
                  No Result
                </button>
                <button
                  type="button"
                  onClick={() => applyAdvisoryPreset('reduced-overs')}
                  className="rounded-full border border-[#4fb6c4]/40 px-3 py-1.5 text-[11px] text-[#a8e9ef] transition hover:bg-[#4fb6c4]/10"
                >
                  Reduced Overs
                </button>
              </div>

              <textarea
                value={advisoryNote}
                onChange={(e) => setAdvisoryNote(e.target.value)}
                rows={3}
                placeholder="Example: Start delayed because of rain. Overs reduced to 8 per side under DLS."
                className={`mt-3 w-full text-xs ${fieldClass}`}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1">
                    Reason
                  </label>
                  <select
                    value={advisoryReason}
                    onChange={(e) => setAdvisoryReason(e.target.value)}
                    className={`mb-3 w-full text-xs ${fieldClass}`}
                  >
                    <option value="">Select reason...</option>
                    {ADVISORY_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  <label className="block text-[11px] font-semibold text-white/60 mb-1">
                    Reduced overs per side
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={advisoryOvers}
                    onChange={(e) => setAdvisoryOvers(e.target.value)}
                    placeholder="e.g., 8"
                    className={`w-full text-xs ${fieldClass}`}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={advisoryDls}
                      onChange={(e) => setAdvisoryDls(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-[#07110f] text-[#d7a85b] focus:ring-[#d7a85b]/30"
                    />
                    DLS method applied
                  </label>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveMatchAdvisory}
                  disabled={advisoryStatus === 'saving' || !selectedMatchId}
                  className={`${warmButtonClass} px-3 py-2 text-xs`}
                >
                  Save Advisory
                </button>
                {advisoryStatus === 'error' && (
                  <span className="text-xs text-red-300">Failed to save. Try again.</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ipl-score-card oil-stat-card oil-stat-card--gold p-4 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/80">Innings 1</h3>
            <div className="rounded-full bg-[#d7a85b]/10 px-2 py-1 text-xs text-[#f2d39a]">{innings1BattingName || ''}</div>
          </div>
          <div className="text-4xl font-bold text-white">
            {inn1.teamTotal}/{inn1.wickets}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/60">
            <span>Overs {inn1.overs}</span>
            <span>RR {formatRunRate(inn1.teamTotal, inn1.legalBalls)}</span>
            <span>Extras {inn1.extras}</span>
            <span>{formatBallCount(inn1.legalBalls)}</span>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
            {getInningsPhase(inn1.legalBalls, innings1Complete)}
            {innings1Complete ? ` (${MAX_OVERS} ov)` : ` - wides ${inn1.wides}, no-balls ${inn1.noBalls}`}
          </div>
        </div>

        <div className="ipl-score-card oil-stat-card oil-stat-card--cyan p-4 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/80">Innings 2</h3>
            <div className="rounded-full bg-[#4fb6c4]/10 px-2 py-1 text-xs text-[#a8e9ef]">{innings2BattingName || ''}</div>
          </div>
          <div className="text-4xl font-bold text-white">
            {inn2.teamTotal}/{inn2.wickets}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/60">
            <span>Overs {inn2.overs}</span>
            <span>RR {formatRunRate(inn2.teamTotal, inn2.legalBalls)}</span>
            <span>Extras {inn2.extras}</span>
            <span>{formatBallCount(inn2.legalBalls)}</span>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
            {fastInnings === '2' && requiredRunRate
              ? `${chaseRunsNeeded} runs needed from ${chaseBallsLeft} balls. RRR ${requiredRunRate}`
              : innings2Complete
                ? `Innings complete (${MAX_OVERS} ov)`
                : `${getInningsPhase(inn2.legalBalls, innings2Complete)} - target ${
                    chaseTarget ? chaseTarget : 'not set'
                  }`}
          </div>
        </div>
      </div>

      {selectedMatch && (
        <section className="oil-panel mb-6 p-4 shadow-xl shadow-black/15">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-[#d7a85b]" />
                Impact Player Register
              </div>
              <div className="mt-1 text-xs text-white/60">
                Select the Impact IN player from the five nominated substitutes, then choose the Player OUT from
                the confirmed Playing XI.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {(['team1', 'team2'] as const).map((teamKey) => {
              const team = teamKey === 'team1' ? selectedMatch.team1 : selectedMatch.team2;
              const nominees = impactSubstituteIds[teamKey] || [];
              const xi = normalizeIdArray((selectedMatch as any)?.playing11?.[teamKey]);

              const impact = teamKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;
              const status = impactSaveStatus[teamKey];
              const form = impactForms[teamKey];

              const overseasInXI = xi.reduce((count, id) => {
                const p = playerById.get(String(id));
                if (!p?.nationality) return count;
                return isIndianNationality(p.nationality) ? count : count + 1;
              }, 0);
              const selectedInNationality = playerById.get(String(form.inId || ''))?.nationality;
              const selectedInIsOverseas = Boolean(selectedInNationality) && !isIndianNationality(selectedInNationality);

              const nomineeLabels = nominees
                .map((id) => {
                  const p = playerById.get(String(id));
                  return p?.name || String(id);
                })
                .filter(Boolean)
                .join(', ');

              const captainId = String(selectedMatch?.captains?.[teamKey] || '').trim();
              const xiLabels = xi
                .map((id) => {
                  const p = playerById.get(String(id));
                  const label = p?.name || String(id);
                  return captainId && String(id) === captainId ? `${label} (C)` : label;
                })
                .filter(Boolean)
                .join(', ');

              return (
                <div key={teamKey} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#d7a85b]/30 hover:bg-white/10">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm font-semibold text-white">
                      {team?.shortName || team?.name || teamKey.toUpperCase()}
                    </div>
                    {impact.impactId ? (
                      <span className="rounded-full border border-[#4cc39a]/30 bg-[#4cc39a]/10 px-2 py-1 text-[10px] text-[#9cf2c8]">
                        Used
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">
                        Not used
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-white/60 space-y-1 mb-3">
                    <div>
                      <span className="text-white/80">Nominees:</span>{' '}
                      {nomineeLabels || 'Not set (set 5 substitutes in Playing 11)'}
                    </div>
                    <div>
                      <span className="text-white/80">Playing XI:</span>{' '}
                      {xiLabels || 'Not set'}
                    </div>
                    {impact.impactId && (
                      <div>
                        <span className="text-white/80">Current:</span>{' '}
                        {impact.impactName || impact.impactId}
                        {impact.originalId ? ` for ${impact.originalName || impact.originalId}` : ''}
                        {impact.substitutionTime ? ` • ${impact.substitutionTime}` : ''}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-white/70 mb-1">Impact IN</div>
                      <select
                        value={form.inId || ''}
                        onChange={(e) => updateImpactForm(teamKey, { inId: e.target.value })}
                        disabled={!nominees.length}
                        className={`w-full text-sm ${compactFieldClass}`}
                      >
                        <option value="">{nominees.length ? 'Select Impact nominee...' : 'Set nominees first'}</option>
                        {nominees.map((id) => {
                          const p = playerById.get(String(id));
                          const label = p?.name || String(id);
                          const overseasTag = p?.nationality && !isIndianNationality(p.nationality) ? ' (OS)' : '';
                          return (
                            <option key={String(id)} value={String(id)}>
                              {label}{overseasTag}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-white/70 mb-1">Player OUT</div>
                      <select
                        value={form.outId || ''}
                        onChange={(e) => updateImpactForm(teamKey, { outId: e.target.value })}
                        disabled={!xi.length}
                        className={`w-full text-sm ${compactFieldClass}`}
                      >
                        <option value="">{xi.length ? 'Select player leaving the XI...' : 'Set Playing XI first'}</option>
                        {xi.map((id) => {
                          const p = playerById.get(String(id));
                          const label = p?.name || String(id);
                          return (
                            <option key={String(id)} value={String(id)}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-white/70 mb-1">When</div>
                      <select
                        value={form.moment || DEFAULT_IMPACT_FORM.moment}
                        onChange={(e) => updateImpactForm(teamKey, { moment: e.target.value })}
                        className={`w-full text-sm ${compactFieldClass}`}
                      >
                        {IMPACT_MOMENTS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-white/70 mb-1">Over.Ball (optional)</div>
                      <input
                        value={form.overBall || ''}
                        onChange={(e) => updateImpactForm(teamKey, { overBall: e.target.value })}
                        placeholder="e.g. 14.0"
                        className={`w-full text-sm ${compactFieldClass}`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {overseasInXI >= 4 && selectedInIsOverseas && (
                      <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                        Overseas warning: the starting XI already has {overseasInXI} overseas players. Use an Indian
                        Impact Player to stay within the IPL combination rule.
                      </div>
                    )}
                    {String(form.moment || '').toLowerCase().includes('mid-over') && (
                      <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-3 py-2">
                        Mid-over note: if the bowling side uses an Impact Player during an over, the substitute cannot
                        bowl the remaining balls of that over.
                      </div>
                    )}
                    <div className="text-xs text-white/60">
                      After saving, the batter and bowler suggestions show IP and OUT tags for quick scoring.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => saveImpactPlayer(teamKey)}
                      disabled={status === 'saving' || !selectedMatchId}
                      className={`${warmButtonClass} px-3 py-2`}
                    >
                      {impact.impactId ? 'Update Impact Player' : 'Use Impact Player'}
                    </button>
                    <div className={`rounded-full border px-2 py-1 text-xs ${getStatusClass(status)}`}>
                      {getStatusText(status, 'Ready')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="oil-toolbar mb-5 flex flex-wrap items-center gap-3 rounded-2xl p-3 shadow-xl shadow-black/10">
        <button
          onClick={exportCSV}
          className={actionButtonClass}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={exportPDF}
          disabled={pdfGenerating || !selectedMatchId}
          className={actionButtonClass}
        >
          <FileText className="w-4 h-4" />
          {pdfGenerating ? 'Exporting...' : 'Export PDF'}
        </button>
        <button
          onClick={saveRows}
          disabled={saveStatus === 'saving' || !selectedMatchId}
          className={primaryButtonClass}
        >
          <Save className="w-4 h-4" />
          Save Deliveries
        </button>
        <button
          onClick={syncScorecardFromTable}
          disabled={scorecardSyncStatus === 'saving' || !selectedMatchId}
          className={warmButtonClass}
        >
          <RefreshCw className="w-4 h-4" />
          {scorecardSyncStatus === 'saving'
            ? 'Syncing Scorecard...'
            : scorecardSyncStatus === 'success'
              ? 'Scorecard Synced'
              : scorecardSyncStatus === 'error'
                ? 'Sync Failed'
                : 'Sync Scorecard Draft'}
        </button>
        <button
          onClick={publishNow}
          disabled={saveStatus === 'saving' || !selectedMatchId}
          className={primaryButtonClass}
        >
          <UploadCloud className="w-4 h-4" />
          Publish Scoreboard
        </button>

        <div className={`ml-auto rounded-full border px-3 py-1.5 text-xs ${getStatusClass(saveStatus)}`}>
          {getStatusText(saveStatus, 'Unsaved deliveries')}
        </div>
      </div>

      <section className="oil-panel mb-6 p-5 shadow-xl shadow-black/15">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-[#4cc39a]" />
              <h3 className="text-lg font-semibold text-white">Ball-by-Ball Scoring Panel</h3>
            </div>
            <p className="mt-1 text-xs text-white/60">
              Score each delivery with automatic overs, strike rotation, extras, wicket checks, and current-innings
              context.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#d7a85b]/30 bg-[#d7a85b]/10 px-3 py-1 text-[#f2d39a]">
                {currentBattingName || 'Batting team'} {currentTotals.teamTotal}/{currentTotals.wickets}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/60">
                {currentTotals.overs} overs
              </span>
              <span className="rounded-full border border-[#4fb6c4]/30 bg-[#4fb6c4]/10 px-3 py-1 text-[#a8e9ef]">
                {currentPhase}
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={autoSwapStrike}
              onChange={(e) => setAutoSwapStrike(e.target.checked)}
              className="rounded border-white/20 bg-[#07110f] text-[#d7a85b] focus:ring-[#d7a85b]/30"
            />
            Auto swap strike after odd runs, except on wicket balls
          </label>
        </div>

        <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)_minmax(260px,0.85fr)]">
          <div className="min-w-0 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#f2d39a]">Delivery Context</div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-[11px] text-white/60">Innings</div>
                <div className="mt-1 flex items-center gap-2">
                  {(['1', '2'] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setFastInnings(val)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        fastInnings === val
                          ? 'border-[#d7a85b]/40 bg-[#d7a85b]/20 text-white'
                          : 'border-white/10 bg-white/10 text-white/70 hover:bg-white/15'
                      }`}
                    >
                      Innings {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-white/60">Striker</div>
                <input
                  value={resolvePlayerName(fastStrikerId)}
                  onChange={(e) => setFastStrikerId(normalizePlayerSelectionInput(e.target.value, fastBattingOptions))}
                  list={getTeamPlayerDatalistId(selectedMatchId, fastBattingKey)}
                  placeholder="Search striker or type name"
                  className={`mt-1 min-w-[150px] text-xs ${compactFieldClass}`}
                />
              </div>

              {/* ⇄ Interactive Strike Swap Button */}
              <div className="flex pb-0.5">
                <button
                  type="button"
                  title="Swap Striker and Non-striker (Key: S)"
                  onClick={() => {
                    const temp = fastStrikerId;
                    setFastStrikerId(fastNonStrikerId);
                    setFastNonStrikerId(temp);
                  }}
                  className="flex h-[32px] items-center justify-center rounded-lg border border-white/20 bg-white/5 px-2.5 text-xs font-semibold text-[#f2d39a] transition hover:border-[#d7a85b]/40 hover:bg-[#d7a85b]/20 active:scale-95"
                >
                  ⇄ Swap
                </button>
              </div>

              <div>
                <div className="text-[11px] text-white/60">Non-striker</div>
                <input
                  value={resolvePlayerName(fastNonStrikerId)}
                  onChange={(e) =>
                    setFastNonStrikerId(normalizePlayerSelectionInput(e.target.value, fastBattingOptions))
                  }
                  list={getTeamPlayerDatalistId(selectedMatchId, fastBattingKey)}
                  placeholder="Search non-striker or type name"
                  className={`mt-1 min-w-[150px] text-xs ${compactFieldClass}`}
                />
              </div>

              <div>
                <div className="text-[11px] text-white/60">Bowler</div>
                <input
                  value={resolvePlayerName(fastBowlerId)}
                  onChange={(e) => setFastBowlerId(normalizePlayerSelectionInput(e.target.value, fastBowlingOptions))}
                  list={getTeamPlayerDatalistId(selectedMatchId, fastBowlingKey)}
                  placeholder="Search bowler or type name"
                  className={`mt-1 min-w-[150px] text-xs ${compactFieldClass}`}
                />
              </div>

              <div>
                <div className="text-[11px] text-white/60">Next delivery</div>
                <div className="mt-1 rounded-lg border border-[#4cc39a]/30 bg-[#4cc39a]/10 px-3 py-2 text-xs font-semibold text-[#9cf2c8]">
                  {fastInningsComplete ? `Innings complete (${MAX_OVERS} ov)` : `Over ${fastNextBall.over}.${fastNextBall.ball}`}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-white/60">Override over</div>
                <input
                  value={fastOverrideOver}
                  onChange={(e) => setFastOverrideOver(sanitizeOverBallInput(e.target.value))}
                  placeholder={fastNextBall.over}
                  inputMode="numeric"
                  disabled={fastInningsComplete}
                  className={`mt-1 w-24 text-xs ${compactFieldClass}`}
                />
              </div>

              <div>
                <div className="text-[11px] text-white/60">Override ball</div>
                <input
                  value={fastOverrideBall}
                  onChange={(e) => setFastOverrideBall(sanitizeOverBallInput(e.target.value))}
                  placeholder={fastNextBall.ball}
                  inputMode="numeric"
                  disabled={fastInningsComplete}
                  className={`mt-1 w-24 text-xs ${compactFieldClass}`}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#f2d39a]">
              <Zap className="h-3.5 w-3.5" />
              Delivery Result
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  onClick={() =>
                    appendFastBall({
                      runs: run,
                      extras: { ...DEFAULT_EXTRAS },
                      wicket: { ...DEFAULT_WICKET },
                      notes: '',
                    })
                  }
                  disabled={fastInningsComplete}
                  className="h-11 w-11 rounded-xl border border-white/10 bg-white/10 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-[#d7a85b]/40 hover:bg-[#d7a85b]/20 disabled:translate-y-0 disabled:opacity-50"
                >
                  {run}
                </button>
              ))}
              <button
                onClick={toggleFastWicket}
                disabled={fastInningsComplete}
                className={`h-11 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${
                  fastWicket.hasWicket
                    ? 'border-[#e5655f]/40 bg-[#e5655f] text-white'
                    : 'border-white/10 bg-white/10 text-white hover:border-[#e5655f]/40 hover:bg-[#e5655f]/20'
                }`}
              >
                W
              </button>
              <button
                onClick={toggleFastWide}
                disabled={fastInningsComplete}
                className={`h-11 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${
                  fastExtras.hasWide
                    ? 'border-[#d7a85b]/40 bg-[#d7a85b] text-[#07110f]'
                    : 'border-white/10 bg-white/10 text-white hover:border-[#d7a85b]/40 hover:bg-[#d7a85b]/20'
                }`}
              >
                WD
              </button>
              <button
                onClick={toggleFastNoBall}
                disabled={fastInningsComplete}
                className={`h-11 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${
                  fastExtras.hasNoBall
                    ? 'border-[#d7a85b]/40 bg-[#d7a85b] text-[#07110f]'
                    : 'border-white/10 bg-white/10 text-white hover:border-[#d7a85b]/40 hover:bg-[#d7a85b]/20'
                }`}
              >
                NB
              </button>
              <button
                onClick={toggleFastByes}
                disabled={fastInningsComplete}
                className={`h-11 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${
                  fastExtras.hasByes
                    ? 'border-[#4fb6c4]/40 bg-[#4fb6c4] text-[#07110f]'
                    : 'border-white/10 bg-white/10 text-white hover:border-[#4fb6c4]/40 hover:bg-[#4fb6c4]/20'
                }`}
              >
                B
              </button>
              <button
                onClick={toggleFastLegByes}
                disabled={fastInningsComplete}
                className={`h-11 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${
                  fastExtras.hasLB
                    ? 'border-[#4fb6c4]/40 bg-[#4fb6c4] text-[#07110f]'
                    : 'border-white/10 bg-white/10 text-white hover:border-[#4fb6c4]/40 hover:bg-[#4fb6c4]/20'
                }`}
              >
                LB
              </button>
            </div>
            <div className="text-[11px] text-white/50">
              Wide and no-ball are mutually exclusive. Byes/LB disable wide.
            </div>
            <div className="text-[11px] text-white/50">
              Use the result buttons for runs, extras, wicket events, and strike changes while the scorer stays in
              delivery context.
            </div>
            <div className="text-[11px] text-[#9cf2c8]">
              Player fields accept free text. Squad suggestions are optional, so scoring can begin before Playing XI
              and Impact lists are saved.
            </div>
            <div className="text-[11px] text-white/60">
              Ball total: <span className="text-white">{fastTotals.totalRuns}</span> (bat {fastTotals.batRuns} + extras{' '}
              {fastTotals.extrasRuns})
            </div>
            {recentCommentary.length > 0 && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Recent balls</div>
                {recentCommentary.map((line, idx) => (
                  <div key={`${line}-${idx}`} className="rounded-lg bg-[#07110f]/70 px-3 py-2 text-[11px] text-white/70">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#f2d39a]">
              <Gauge className="h-3.5 w-3.5" />
              Delivery Details
            </div>
            <div className="grid gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                Runs off bat
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={fastRuns}
                  onChange={(e) => setFastRuns(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                  className={`w-24 text-xs ${compactFieldClass}`}
                />
              </label>
              {fastExtras.hasWide && (
                <label className="flex items-center justify-between gap-2">
                  Additional wide runs
                  <select
                    value={fastExtras.wideExtraRuns}
                    onChange={(e) => setFastExtras((prev) => ({ ...prev, wideExtraRuns: Number(e.target.value) }))}
                    className={`text-xs ${compactFieldClass}`}
                  >
                    {[0, 1, 2, 3, 4].map((v) => (
                      <option key={v} value={v}>
                        +{v}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {fastExtras.hasByes && (
                <label className="flex items-center justify-between gap-2">
                  Byes
                  <select
                    value={fastExtras.byesRuns}
                    onChange={(e) => setFastExtras((prev) => ({ ...prev, byesRuns: Number(e.target.value) }))}
                    className={`text-xs ${compactFieldClass}`}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {fastExtras.hasLB && (
                <label className="flex items-center justify-between gap-2">
                  Leg byes
                  <select
                    value={fastExtras.lbRuns}
                    onChange={(e) => setFastExtras((prev) => ({ ...prev, lbRuns: Number(e.target.value) }))}
                    className={`text-xs ${compactFieldClass}`}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {fastWicket.hasWicket && (
                <>
                  <select
                    value={fastWicket.wicketType}
                    onChange={(e) => applyFastWicketType(e.target.value)}
                    className={`text-xs ${compactFieldClass}`}
                  >
                    <option value="">Wicket type...</option>
                    {getAllowedWicketTypesForExtras(fastExtras).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {fastExtras.hasNoBall && (
                    <div className="text-[11px] text-white/50">
                      No-ball allows only Run Out, Hit the Ball Twice, or Obstructing the Field.
                    </div>
                  )}
                  <select
                    value={fastWicket.outBatter}
                    onChange={(e) =>
                      setFastWicket((prev) => ({ ...prev, outBatter: e.target.value as WicketOutBatter }))
                    }
                    className={`text-xs ${compactFieldClass}`}
                  >
                    <option value="striker">Out: Striker</option>
                    <option value="nonStriker">Out: Non-striker</option>
                  </select>
                  <input
                    value={resolvePlayerName(fastWicket.wicketTaker)}
                    onChange={(e) =>
                      setFastWicket((prev) => ({
                        ...prev,
                        wicketTaker: normalizePlayerSelectionInput(e.target.value, fastBowlingOptions),
                      }))
                    }
                    list={getTeamPlayerDatalistId(selectedMatchId, fastBowlingKey)}
                    placeholder="Wicket taker..."
                    className={`text-xs ${compactFieldClass}`}
                  />
                  <input
                    value={resolvePlayerName(fastWicket.wicketAssistant)}
                    onChange={(e) =>
                      setFastWicket((prev) => ({
                        ...prev,
                        wicketAssistant: normalizePlayerSelectionInput(
                          e.target.value,
                          fastBowlingOptions.filter((opt) => !prev.wicketTaker || opt.id !== prev.wicketTaker)
                        ),
                      }))
                    }
                    list={getTeamPlayerDatalistId(selectedMatchId, fastBowlingKey)}
                    placeholder="Assistant (optional)"
                    className={`text-xs ${compactFieldClass}`}
                  />
                </>
              )}
              <input
                value={fastNotes}
                onChange={(e) => setFastNotes(e.target.value)}
                placeholder="Commentary note (optional)"
                className={`text-xs ${compactFieldClass}`}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => appendFastBall()}
                  className={`${primaryButtonClass} px-3 py-2 text-xs`}
                  disabled={fastInningsComplete || !fastStrikerId || !fastNonStrikerId || !fastBowlerId}
                >
                  Record Delivery
                </button>
                <button
                  onClick={undoLastBall}
                  disabled={!rows.length}
                  className={`${actionButtonClass} px-3 py-2 text-xs`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo Last Ball
                </button>
                <button
                  onClick={resetFastInputs}
                  className={`${actionButtonClass} px-3 py-2 text-xs`}
                >
                  Clear Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {/* Innings 1 */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1815]/70 shadow-xl shadow-black/15 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm font-semibold text-white">Innings 1 Ball-by-Ball</div>
            <div className="rounded-full bg-[#d7a85b]/10 px-2 py-1 text-xs text-[#f2d39a]">{innings1BattingName || ''}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0e2420]">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="border-r border-white/5 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-white/70"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wide font-semibold text-white/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, rowIndex) => {
                  if (String(row?.[2] || '') !== '1') return null;
                  return (
                    <tr key={rowIndex} className="hover:bg-white/5 transition-colors">
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="px-3 py-3 align-top border-r border-white/5">
                          {renderCell(cell, colIndex, rowIndex)}
                        </td>
                      ))}
                      <td className="px-3 py-3 align-top">
                        <button
                          onClick={() => removeRow(rowIndex)}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg text-red-300 hover:bg-red-500/10"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.some((r) => String(r?.[2] || '') === '1') && (
                  <tr>
                    <td colSpan={HEADERS.length + 1} className="px-4 py-6 text-center text-white/50">
                      No deliveries recorded yet. Use Record Delivery or Add Manual Ball.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-4 py-3">
            <button
              onClick={saveRows}
              disabled={saveStatus === 'saving' || !selectedMatchId}
              className={`${primaryButtonClass} px-3 py-2`}
            >
              <Save className="w-4 h-4" />
              Save Deliveries
            </button>
            <button
              onClick={() => addRowToInnings(1)}
              disabled={innings1Complete}
              className={`${warmButtonClass} px-3 py-2`}
            >
              <Plus className="w-4 h-4" /> Add Manual Ball
            </button>
          </div>
        </section>

        {/* Innings 2 */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1815]/70 shadow-xl shadow-black/15 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm font-semibold text-white">Innings 2 Ball-by-Ball</div>
            <div className="rounded-full bg-[#4fb6c4]/10 px-2 py-1 text-xs text-[#a8e9ef]">{innings2BattingName || ''}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0e2420]">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="border-r border-white/5 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-white/70"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wide font-semibold text-white/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, rowIndex) => {
                  if (String(row?.[2] || '') !== '2') return null;
                  return (
                    <tr key={rowIndex} className="hover:bg-white/5 transition-colors">
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="px-3 py-3 align-top border-r border-white/5">
                          {renderCell(cell, colIndex, rowIndex)}
                        </td>
                      ))}
                      <td className="px-3 py-3 align-top">
                        <button
                          onClick={() => removeRow(rowIndex)}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg text-red-300 hover:bg-red-500/10"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.some((r) => String(r?.[2] || '') === '2') && (
                  <tr>
                    <td colSpan={HEADERS.length + 1} className="px-4 py-6 text-center text-white/50">
                      No deliveries recorded yet. Use Record Delivery or Add Manual Ball.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-4 py-3">
            <button
              onClick={saveRows}
              disabled={saveStatus === 'saving' || !selectedMatchId}
              className={`${primaryButtonClass} px-3 py-2`}
            >
              <Save className="w-4 h-4" />
              Save Deliveries
            </button>
            <button
              onClick={() => addRowToInnings(2)}
              disabled={innings2Complete}
              className={`${warmButtonClass} px-3 py-2`}
            >
              <Plus className="w-4 h-4" /> Add Manual Ball
            </button>
          </div>
        </section>

        {/* Match Result */}
        <section className="rounded-2xl border border-white/10 bg-[#0a1815]/70 p-4 shadow-xl shadow-black/15 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Trophy className="h-4 w-4 text-[#d7a85b]" />
                Match Result
              </div>
              <div className="mt-1 text-xs text-white/50">
                Records the winner, margin, and Player of the Match in the scorecard draft.
              </div>
            </div>
            <div className="text-xs text-white/50">
              {resultLoading ? 'Loading...' : scorecardId ? `Scorecard: ${scorecardId}` : 'No scorecard yet'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Winning Team</label>
              <select
                value={resultWinner}
                onChange={(e) => setResultWinner(e.target.value)}
                disabled={!selectedMatchId}
                className={`w-full ${fieldClass}`}
              >
                <option value="">Select winning team</option>
                {selectedMatch && (
                  <>
                    <option value={selectedMatch.team1?.name}>{selectedMatch.team1?.name}</option>
                    <option value={selectedMatch.team2?.name}>{selectedMatch.team2?.name}</option>
                  </>
                )}
                <option value="No Result">No Result</option>
                <option value="Match Tied">Match Tied</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Margin</label>
              <input
                value={resultMargin}
                onChange={(e) => setResultMargin(e.target.value)}
                disabled={!selectedMatchId}
                placeholder="e.g., 3 wickets, 25 runs, Super Over"
                className={`w-full ${fieldClass}`}
              />
              <p className="text-[11px] text-white/50 mt-2">Examples: 3 wickets, 25 runs, won in Super Over.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Player of the Match</label>
              <input
                value={resultManOfTheMatch}
                onChange={(e) => setResultManOfTheMatch(e.target.value)}
                list={getResultPlayerDatalistId(selectedMatchId)}
                disabled={!selectedMatchId}
                placeholder="Type player name"
                className={`w-full ${fieldClass}`}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={saveMatchResult}
              disabled={!selectedMatchId || resultStatus === 'saving' || resultLoading}
              className={warmButtonClass}
            >
              <Save className="w-4 h-4" />
              Save Match Result
            </button>
            <div className={`rounded-full border px-2 py-1 text-xs ${getStatusClass(resultStatus)}`}>
              {getStatusText(resultStatus, 'Ready')}
            </div>
          </div>
        </section>
      </div>
    </div>
    </div>
  );
}
