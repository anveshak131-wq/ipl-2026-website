'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/data';
import type { Match, Player } from '@/types';
import { Activity, Download, Plus, Save, Trash2, UploadCloud } from 'lucide-react';

const LEAGUE = 'ipl' as const;

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

type WicketRow = {
  hasWicket: boolean;
  wicketType: string;
  wicketTaker: string;
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
};

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

export default function IPLAdminLiveScoreTablePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);

  const [rows, setRows] = useState<string[][]>([]);
  const [extrasData, setExtrasData] = useState<Record<number, ExtrasRow>>({});
  const [wicketData, setWicketData] = useState<Record<number, WicketRow>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const selectedMatchFromList = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );
  const selectedMatch = matchDetails || selectedMatchFromList;

  const playerById = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const storageKeyPrefix = useMemo(() => {
    if (!selectedMatchId) return '';
    return `ipl-live-score:${selectedMatchId}`;
  }, [selectedMatchId]);

  // Load matches + players
  useEffect(() => {
    (async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches(LEAGUE),
          api.getPlayers(undefined, LEAGUE),
        ]);

        const nextMatches = (matchesData || []) as Match[];
        setMatches(nextMatches);
        setPlayers((playersData || []) as Player[]);

        setSelectedMatchId((prev) => {
          if (prev && nextMatches.find((m) => m.id === prev)) return prev;
          const preferred =
            nextMatches.find((m) => m.status === 'live') ||
            nextMatches.find((m) => m.status === 'upcoming') ||
            nextMatches[0];
          return preferred?.id || '';
        });
      } catch (error) {
        console.error('[IPL Live Score Table] Failed to load matches/players:', error);
      }
    })();
  }, []);

  // Load match details + saved table state for the selected match
  useEffect(() => {
    if (!selectedMatchId) return;

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
        const matchResp = await fetch(`/api/matches?id=${encodeURIComponent(selectedMatchId)}`);
        if (matchResp.ok) {
          const matchData = (await matchResp.json()) as Match;
          setMatchDetails(matchData);
        } else {
          setMatchDetails(null);
        }
      } catch {
        setMatchDetails(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const impactPlayerNames = useMemo(() => {
    const team1ImpactId =
      selectedMatch?.impactPlayer?.team1?.impact ||
      selectedMatch?.impactPlayer?.team1?.playerId ||
      '';
    const team2ImpactId =
      selectedMatch?.impactPlayer?.team2?.impact ||
      selectedMatch?.impactPlayer?.team2?.playerId ||
      '';

    const team1 = team1ImpactId ? playerById.get(String(team1ImpactId))?.name || '' : '';
    const team2 = team2ImpactId ? playerById.get(String(team2ImpactId))?.name || '' : '';

    return { team1: team1.trim(), team2: team2.trim() };
  }, [playerById, selectedMatch]);

  const hasPlaying11 = Boolean(playing11Names.team1.length) && Boolean(playing11Names.team2.length);
  const matchToss = selectedMatch?.matchState?.toss;

  const getBattingTeamKeyForInnings = (innings: '1' | '2'): 'team1' | 'team2' => {
    if (!matchToss) return 'team1';
    const winner = matchToss.winner;
    const decision = matchToss.decision;
    if (decision === 'bat') {
      return innings === '1' ? winner : otherTeamKey(winner);
    }
    // decision === 'bowl'
    return innings === '1' ? otherTeamKey(winner) : winner;
  };

  const getTeamPlayerOptions = (teamKey: 'team1' | 'team2') => {
    const fromXI = teamKey === 'team1' ? playing11Names.team1 : playing11Names.team2;
    const fromSquad = (teamKey === 'team1' ? squads.team1 : squads.team2).map((p) => p.name);
    const impact = teamKey === 'team1' ? impactPlayerNames.team1 : impactPlayerNames.team2;

    const base = (fromXI.length ? fromXI : fromSquad).slice();
    if (impact) base.push(impact);
    return uniqStrings(base);
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
    const taker = data.wicketTaker ? ` - ${data.wicketTaker}` : '';
    return `${type}${taker}`.trim();
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

    // Guardrails: wides and no-balls are mutually exclusive in this UI
    if (field === 'hasWide' && value === true) next.hasNoBall = false;
    if (field === 'hasNoBall' && value === true) next.hasWide = false;

    // If turning off wide/no-ball, reset their detail fields
    if ((field === 'hasWide' && value === false) || next.hasWide === false) {
      next.wideExtraRuns = 0;
    }
    if (field === 'hasByes' && value === false) next.byesRuns = 0;
    if (field === 'hasLB' && value === false) next.lbRuns = 0;

    setExtrasForRow(rowIndex, next);

    // Keep CSV cell values in sync (store numeric totals in those columns)
    const wideTotal = next.hasWide ? 1 + (next.wideExtraRuns || 0) : '';
    const noBallTotal = next.hasNoBall ? 1 : '';
    const byesTotal = next.hasByes ? String(next.byesRuns || 0) : '';
    const lbTotal = next.hasLB ? String(next.lbRuns || 0) : '';

    updateCell(rowIndex, 7, wideTotal ? String(wideTotal) : '');
    updateCell(rowIndex, 8, noBallTotal ? String(noBallTotal) : '');
    updateCell(rowIndex, 9, byesTotal);
    updateCell(rowIndex, 10, lbTotal);
  };

  const onWicketChange = (rowIndex: number, field: keyof WicketRow, value: boolean | string) => {
    const current = { ...DEFAULT_WICKET, ...(wicketData[rowIndex] || {}) };
    const next: WicketRow = { ...current, [field]: value } as WicketRow;

    if (field === 'hasWicket' && value === false) {
      next.wicketType = '';
      next.wicketTaker = '';
    }

    setWicketForRow(rowIndex, next);

    const desc = generateWicketDescription(next);
    updateCell(rowIndex, 11, desc);
  };

  const countLegalBallsInInnings = (innings: '1' | '2') => {
    let balls = 0;
    rows.forEach((row, idx) => {
      if (String(row?.[2] || '') !== innings) return;
      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      if (!ex.hasWide && !ex.hasNoBall) balls += 1;
    });
    return balls;
  };

  const getNextBallForInnings = (innings: '1' | '2') => {
    const legalBalls = countLegalBallsInInnings(innings);
    const over = Math.floor(legalBalls / 6);
    const ball = (legalBalls % 6) + 1;
    return { over: String(over), ball: String(ball) };
  };

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

  const calculateInningsTotals = (innings: '1' | '2') => {
    let batsmanRuns = 0;
    let wides = 0;
    let noBalls = 0;
    let byes = 0;
    let legByes = 0;
    let wickets = 0;
    let legalBalls = 0;
    let extras = 0;

    rows.forEach((row, idx) => {
      if (String(row?.[2] || '') !== innings) return;

      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const wk = { ...DEFAULT_WICKET, ...(wicketData[idx] || {}) };

      const runs = parseInt(String(row?.[6] || ''), 10) || 0;
      batsmanRuns += runs;

      if (wk.hasWicket) wickets += 1;

      if (!ex.hasWide && !ex.hasNoBall) {
        legalBalls += 1;
      }

      if (ex.hasWide) {
        wides += 1;
        const wideRuns = 1 + (ex.wideExtraRuns || 0);
        extras += wideRuns;
      }

      if (ex.hasNoBall) {
        noBalls += 1;
        extras += 1; // mandatory no-ball extra (additional runs should be recorded in Runs / Byes / LB)
      }

      if (ex.hasByes) {
        const r = ex.byesRuns || 0;
        byes += r;
        extras += r;
      }

      if (ex.hasLB) {
        const r = ex.lbRuns || 0;
        legByes += r;
        extras += r;
      }
    });

    const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
    const teamTotal = batsmanRuns + extras;
    return { batsmanRuns, wides, noBalls, byes, legByes, wickets, legalBalls, overs, extras, teamTotal };
  };

  const exportCSV = () => {
    const headerLine = HEADERS.join(',');
    const body = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
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
        const striker = row[3] || '';
        const bowler = row[5] || '';
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
    rows.forEach((row, idx) => {
      if (String(row?.[2] || '') !== innings) return;
      if (String(row?.[3] || '') !== batterName) return;
      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const r = parseInt(String(row?.[6] || ''), 10) || 0;
      runs += r;
      if (!ex.hasWide && !ex.hasNoBall) balls += 1;
    });
    return { runs, balls };
  };

  const computeBowlerStats = (innings: '1' | '2', bowlerName: string) => {
    let runsConceded = 0;
    let balls = 0;
    rows.forEach((row, idx) => {
      if (String(row?.[2] || '') !== innings) return;
      if (String(row?.[5] || '') !== bowlerName) return;

      const ex = { ...DEFAULT_EXTRAS, ...(extrasData[idx] || {}) };
      const batRuns = parseInt(String(row?.[6] || ''), 10) || 0;

      // Batsman runs always count against bowler (unless user records byes/LB correctly as 0 in Runs)
      runsConceded += batRuns;

      // Wide/no-ball penalties count against bowler; byes/LB do not.
      if (ex.hasWide) runsConceded += 1 + (ex.wideExtraRuns || 0);
      if (ex.hasNoBall) runsConceded += 1;

      if (!ex.hasWide && !ex.hasNoBall) balls += 1;
    });
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
    const currentBatterName = last?.row?.[3] || '';
    const currentBowlerName = last?.row?.[5] || '';

    const batterStats = currentBatterName ? computeBatterStats(currentInnings, currentBatterName) : { runs: 0, balls: 0 };
    const bowlerStats = currentBowlerName ? computeBowlerStats(currentInnings, currentBowlerName) : { runs: 0, balls: 0 };

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

      // Best-effort publish to the public live-score API
      try {
        const payload = buildLiveScorePayload();
        const token = localStorage.getItem('adminToken');
        if (payload && token) {
          await fetch('/api/live-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      } catch (e) {
        console.error('[IPL Live Score Table] Publish failed:', e);
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
      const token = localStorage.getItem('adminToken');
      if (!payload || !token) return;

      setSaveStatus('saving');
      const resp = await fetch('/api/live-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to publish');
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
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-white/5 text-white placeholder-white/30"
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
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-white/5 text-white placeholder-white/30"
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
          <select
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white"
          >
            <option value="">{label}</option>
            {battingOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        );
      }
      case 5: {
        return (
          <select
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white"
          >
            <option value="">Bowler</option>
            {bowlingOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        );
      }
      case 6: {
        return (
          <select
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white"
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
                className="rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
              />
              <span className="text-xs text-white/70">Wide</span>
            </div>
            {ex.hasWide && (
              <select
                value={ex.wideExtraRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'wideExtraRuns', parseInt(e.target.value, 10) || 0)}
                className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white text-xs"
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
              className="rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
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
                className="rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
              />
              <span className="text-xs text-white/70">Byes</span>
            </div>
            {ex.hasByes && (
              <select
                value={ex.byesRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'byesRuns', parseInt(e.target.value, 10) || 0)}
                className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white text-xs"
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
                className="rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
              />
              <span className="text-xs text-white/70">LB</span>
            </div>
            {ex.hasLB && (
              <select
                value={ex.lbRuns}
                onChange={(e) => onExtrasChange(rowIndex, 'lbRuns', parseInt(e.target.value, 10) || 0)}
                className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white text-xs"
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
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wk.hasWicket}
                onChange={(e) => onWicketChange(rowIndex, 'hasWicket', e.target.checked)}
                className="rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
              />
              <span className="text-xs text-white/70">Wicket</span>
            </div>
            {wk.hasWicket && (
              <>
                <select
                  value={wk.wicketType}
                  onChange={(e) => onWicketChange(rowIndex, 'wicketType', e.target.value)}
                  className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-slate-950 text-white text-xs"
                >
                  <option value="">Type...</option>
                  {WICKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  value={wk.wicketTaker}
                  onChange={(e) => onWicketChange(rowIndex, 'wicketTaker', e.target.value)}
                  placeholder="Fielder/Bowler"
                  className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-white/5 text-white placeholder-white/30 text-xs"
                />
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
            className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-1 bg-white/5 text-white placeholder-white/30"
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

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 p-6 shadow-2xl">
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">IPL Live Score (Table)</h1>
        </div>
        <p className="text-sm text-white/60">
          WPL live-score-csv style UI • Uses IPL Playing XI + Impact Player
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="block text-xs font-semibold text-white/70 mb-2">Select Match</label>
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 bg-slate-950 text-white"
            disabled={!matches.length}
          >
            <option value="">Choose...</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team1?.shortName || m.team1?.name} vs {m.team2?.shortName || m.team2?.name}
              </option>
            ))}
          </select>

          {selectedMatch && (
            <div className="mt-3 text-xs text-white/60 space-y-1">
              <div>
                <span className="text-white/80">Venue:</span> {selectedMatch.venue || '-'}
              </div>
              <div>
                <span className="text-white/80">Date:</span> {selectedMatch.date?.split('T')[0] || '-'}{' '}
                {selectedMatch.time || ''}
              </div>
              <div>
                <span className="text-white/80">Toss:</span>{' '}
                {matchToss
                  ? `${matchToss.winner === 'team1' ? selectedMatch.team1?.shortName : selectedMatch.team2?.shortName} chose ${matchToss.decision}`
                  : 'Not set'}
              </div>
              <div>
                <span className="text-white/80">Playing XI:</span>{' '}
                {hasPlaying11 ? 'Set' : 'Not set (dropdown will use full squad)'}
              </div>
              <div>
                <span className="text-white/80">Impact Players:</span>{' '}
                {(impactPlayerNames.team1 || impactPlayerNames.team2)
                  ? `${impactPlayerNames.team1 || '-'} / ${impactPlayerNames.team2 || '-'}`
                  : 'Not set'}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/80">Innings 1</h3>
            <div className="text-xs text-white/60">{innings1BattingName || ''}</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {inn1.teamTotal}/{inn1.wickets}
          </div>
          <div className="text-xs text-white/60 mt-1">
            Overs {inn1.overs} • Extras {inn1.extras} • W {inn1.wides} • NB {inn1.noBalls}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => addRowToInnings(1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Ball
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/80">Innings 2</h3>
            <div className="text-xs text-white/60">{innings2BattingName || ''}</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {inn2.teamTotal}/{inn2.wickets}
          </div>
          <div className="text-xs text-white/60 mt-1">
            Overs {inn2.overs} • Extras {inn2.extras} • W {inn2.wides} • NB {inn2.noBalls}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => addRowToInnings(2)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Ball
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={saveRows}
          disabled={saveStatus === 'saving' || !selectedMatchId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          Save Rows
        </button>
        <button
          onClick={publishNow}
          disabled={saveStatus === 'saving' || !selectedMatchId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-sm font-semibold"
        >
          <UploadCloud className="w-4 h-4" />
          Publish Live Score
        </button>

        <div className="ml-auto text-xs">
          {saveStatus === 'idle' && <span className="text-white/50">Not saved</span>}
          {saveStatus === 'saving' && <span className="text-yellow-300">Saving…</span>}
          {saveStatus === 'success' && <span className="text-emerald-300">Saved</span>}
          {saveStatus === 'error' && <span className="text-red-300">Error</span>}
        </div>
      </div>

      <div className="space-y-6">
        {/* Innings 1 */}
        <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Innings 1 Table</div>
            <div className="text-xs text-white/60">{innings1BattingName || ''}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[11px] uppercase tracking-wide font-semibold text-white/70 border-r border-white/5"
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
                      No deliveries yet. Click “Add Ball” under Innings 1.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Innings 2 */}
        <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Innings 2 Table</div>
            <div className="text-xs text-white/60">{innings2BattingName || ''}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[11px] uppercase tracking-wide font-semibold text-white/70 border-r border-white/5"
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
                      No deliveries yet. Click “Add Ball” under Innings 2.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

