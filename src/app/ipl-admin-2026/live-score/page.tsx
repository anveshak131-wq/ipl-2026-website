'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/data';
import type { Match, Player } from '@/types';
import { Activity, Download, FileText, Plus, Save, Trash2, UploadCloud } from 'lucide-react';

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

type TeamKey = 'team1' | 'team2';

type ImpactForm = {
  inId: string;
  outId: string;
  moment: string;
  overBall: string;
};

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

export default function IPLAdminLiveScoreTablePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);

  const [rows, setRows] = useState<string[][]>([]);
  const [extrasData, setExtrasData] = useState<Record<number, ExtrasRow>>({});
  const [wicketData, setWicketData] = useState<Record<number, WicketRow>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [impactForms, setImpactForms] = useState<Record<TeamKey, ImpactForm>>({
    team1: { ...DEFAULT_IMPACT_FORM },
    team2: { ...DEFAULT_IMPACT_FORM },
  });
  const [impactSaveStatus, setImpactSaveStatus] = useState<Record<TeamKey, SaveStatus>>({
    team1: 'idle',
    team2: 'idle',
  });

  const selectedMatchFromList = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );
  const selectedMatch = matchDetails || selectedMatchFromList;

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
    // decision === 'bowl'
    return innings === '1' ? otherTeamKey(winner) : winner;
  };

  const getTeamPlayerOptions = (teamKey: 'team1' | 'team2') => {
    const fromXI = teamKey === 'team1' ? playing11Names.team1 : playing11Names.team2;
    const fromSquad = (teamKey === 'team1' ? squads.team1 : squads.team2).map((p) => p.name);
    const impact = teamKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;

    const base = (fromXI.length ? fromXI : fromSquad).slice();
    if (impact?.impactName) {
      // Keep the OUT player in the dropdown so previously-entered rows don't go blank.
      // Tagging/guardrails are handled in the UI, not by removing options.
      base.push(impact.impactName);
    }
    return uniqStrings(base);
  };

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
      const marginX = 10;
      const marginBottom = 10;

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

      // ── Page 1: Summary ──────────────────────────────────────────────────────
      let y = 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(title, pageWidth / 2, y, { align: 'center' });
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const infoLines = [
        `Venue: ${selectedMatch.venue || '-'}`,
        `Date: ${formatDateLine() || '-'}`,
        `Toss: ${tossLine}`,
        `Captains: ${captainsLine}`,
        `Playing XI: ${playingXiLine}`,
        `Impact Players: ${impactUsedLine}`,
      ];

      infoLines.forEach((line) => {
        doc.text(line, marginX, y);
        y += 6;
      });
      y += 2;

      const inningsSummaryBody = [
        [
          'Innings 1',
          String(innings1BattingName || ''),
          `${inn1.teamTotal}/${inn1.wickets}`,
          String(inn1.overs),
          String(inn1.extras),
          String(inn1.wides),
          String(inn1.noBalls),
        ],
        [
          'Innings 2',
          String(innings2BattingName || ''),
          `${inn2.teamTotal}/${inn2.wickets}`,
          String(inn2.overs),
          String(inn2.extras),
          String(inn2.wides),
          String(inn2.noBalls),
        ],
      ];

      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX, bottom: marginBottom },
        head: [['Innings', 'Batting', 'Score', 'Overs', 'Extras', 'W', 'NB']],
        body: inningsSummaryBody,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, valign: 'middle' },
        headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 40 },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 16, halign: 'center' },
        },
      });

      const lastSummaryY = (doc as any).lastAutoTable?.finalY || y;
      y = lastSummaryY + 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Impact Player (IPL)', marginX, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        'Impact IN must be from the 5 nominated substitutes (set in Playing 11). Player OUT must be from the Playing XI.',
        marginX,
        y,
      );
      y += 5;
      doc.text(
        'Once saved, the Impact IN/OUT players are tagged in the batter/bowler dropdowns (IP / OUT).',
        marginX,
        y,
      );
      y += 2;

      autoTable(doc, {
        startY: y + 3,
        margin: { left: marginX, right: marginX, bottom: marginBottom },
        head: [[team1Label, team2Label]],
        body: [[formatImpactBlock('team1'), formatImpactBlock('team2')]],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, valign: 'top' },
        headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      });

      // ── Innings tables ───────────────────────────────────────────────────────
      doc.addPage();

      const normalizeRowForPdf = (r: string[]) => HEADERS.map((_, idx) => String(r?.[idx] ?? ''));

      const innings1Rows = rows.filter((r) => String(r?.[2] || '') === '1').map((r) => normalizeRowForPdf(r));
      const innings2Rows = rows.filter((r) => String(r?.[2] || '') === '2').map((r) => normalizeRowForPdf(r));

      const renderInningsTable = (inningsLabel: string, battingName: string, bodyRows: string[][]) => {
        const headerY = 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${inningsLabel}${battingName ? ` — ${battingName}` : ''}`, marginX, headerY);

        autoTable(doc, {
          startY: headerY + 4,
          margin: { left: marginX, right: marginX, top: headerY + 4, bottom: marginBottom },
          head: [HEADERS],
          body: bodyRows,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.6, valign: 'middle' },
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        });
      };

      renderInningsTable('Innings 1', String(innings1BattingName || ''), innings1Rows);

      doc.addPage();
      renderInningsTable('Innings 2', String(innings2BattingName || ''), innings2Rows);

      // ── Page footer (page numbers) ───────────────────────────────────────────
      const totalPages = (doc as any).internal?.getNumberOfPages?.() ? (doc as any).internal.getNumberOfPages() : (doc.internal as any).pages.length - 1;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(title, marginX, pageHeight - 4);
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
    const battingCaptainName = matchCaptains[battingKey].name;
    const bowlingCaptainName = matchCaptains[bowlingKey].name;
    const battingImpact = battingKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;
    const bowlingImpact = bowlingKey === 'team1' ? impactPlayerInfo.team1 : impactPlayerInfo.team2;

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
                {formatPlayerOptionLabel(name, {
                  isCaptain: Boolean(battingCaptainName && name === battingCaptainName),
                  isImpactIn: Boolean(battingImpact.impactName && name === battingImpact.impactName),
                  isImpactOut: Boolean(battingImpact.originalName && name === battingImpact.originalName),
                })}
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
                {formatPlayerOptionLabel(name, {
                  isCaptain: Boolean(bowlingCaptainName && name === bowlingCaptainName),
                  isImpactIn: Boolean(bowlingImpact.impactName && name === bowlingImpact.impactName),
                  isImpactOut: Boolean(bowlingImpact.originalName && name === bowlingImpact.originalName),
                })}
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
          WPL live-score-csv style UI • Uses IPL Playing XI + Impact substitutes (5 nominees)
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
                <span className="text-white/80">Captains:</span>{' '}
                {(matchCaptains.team1.name || matchCaptains.team2.name)
                  ? `${matchCaptains.team1.name || '-'} / ${matchCaptains.team2.name || '-'}`
                  : 'Not set'}
              </div>
              <div>
                <span className="text-white/80">Playing XI:</span>{' '}
                {hasPlaying11 ? 'Set' : 'Not set (dropdown will use full squad)'}
              </div>
              <div>
                <span className="text-white/80">Impact Players:</span>{' '}
                {(impactPlayerInfo.team1.impactName || impactPlayerInfo.team2.impactName)
                  ? `${impactPlayerInfo.team1.impactName || '-'} / ${impactPlayerInfo.team2.impactName || '-'}`
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
        </div>
      </div>

      {selectedMatch && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/80">Impact Player (IPL)</div>
              <div className="text-xs text-white/60 mt-1">
                Impact IN must be from the 5 nominated substitutes (set in Playing 11). Player OUT must be from the Playing XI.
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
                <div key={teamKey} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm font-semibold text-white">
                      {team?.shortName || team?.name || teamKey.toUpperCase()}
                    </div>
                    {impact.impactId ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
                        Used
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
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
                        className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-2 bg-slate-950 text-white text-sm disabled:opacity-60"
                      >
                        <option value="">{nominees.length ? 'Select nominee...' : 'Set nominees first'}</option>
                        {nominees.map((id) => {
                          const p = playerById.get(String(id));
                          const label = p?.name || String(id);
                          const globe = p?.nationality && !isIndianNationality(p.nationality) ? ' 🌍' : '';
                          return (
                            <option key={String(id)} value={String(id)}>
                              {label}{globe}
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
                        className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-2 bg-slate-950 text-white text-sm disabled:opacity-60"
                      >
                        <option value="">{xi.length ? 'Select from XI...' : 'Set Playing XI first'}</option>
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
                        className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-2 bg-slate-950 text-white text-sm"
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
                        className="w-full border border-white/10 focus:border-purple-400 rounded-lg px-2 py-2 bg-white/5 text-white placeholder-white/30 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {overseasInXI >= 4 && selectedInIsOverseas && (
                      <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                        Overseas warning: starting XI already has {overseasInXI} overseas players — Impact Player should be Indian.
                      </div>
                    )}
                    {String(form.moment || '').toLowerCase().includes('mid-over') && (
                      <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-3 py-2">
                        Mid-over note: if the bowling side uses an Impact Player during an over, that player cannot bowl the remaining balls of that over.
                      </div>
                    )}
                    <div className="text-xs text-white/60">
                      Once saved, the Impact IN/OUT players are tagged in the batter/bowler dropdowns (IP / OUT).
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => saveImpactPlayer(teamKey)}
                      disabled={status === 'saving' || !selectedMatchId}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold"
                    >
                      {impact.impactId ? 'Update Impact' : 'Use Impact'}
                    </button>
                    <div className="text-xs">
                      {status === 'idle' && <span className="text-white/40">—</span>}
                      {status === 'saving' && <span className="text-yellow-300">Saving…</span>}
                      {status === 'success' && <span className="text-emerald-300">Saved</span>}
                      {status === 'error' && <span className="text-red-300">Error</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={exportPDF}
          disabled={pdfGenerating || !selectedMatchId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60 text-white text-sm font-semibold"
        >
          <FileText className="w-4 h-4" />
          {pdfGenerating ? 'Exporting…' : 'Export PDF'}
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
                      No deliveries yet. Click “Add Ball” below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={saveRows}
              disabled={saveStatus === 'saving' || !selectedMatchId}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              Save Rows
            </button>
            <button
              onClick={() => addRowToInnings(1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Ball
            </button>
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
                      No deliveries yet. Click “Add Ball” below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={saveRows}
              disabled={saveStatus === 'saving' || !selectedMatchId}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              Save Rows
            </button>
            <button
              onClick={() => addRowToInnings(2)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Ball
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
