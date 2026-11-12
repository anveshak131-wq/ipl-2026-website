import type { Player } from '@/types';

export type RoleCategory = 'all-rounder' | 'wicketkeeper' | 'bowler' | 'batter';

export interface RoleMeta {
  category: RoleCategory;
  short: string;
  label: string;
  badgeClass: string;
  accentHex: string;
  metricTextClass: string;
  topBarClass: string;
}

export function getInitials(name?: string): string {
  const clean = String(name || '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'PL';
  const parts = clean.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isOverseasPlayer(nationality?: string): boolean {
  const nat = String(nationality || '').trim().toLowerCase();
  if (!nat) return false;
  return nat !== 'india' && nat !== 'indian' && nat !== 'ind';
}

export function getRoleMeta(role?: string): RoleMeta {
  const r = String(role || '').toLowerCase();
  if (r.includes('wicket') || r.includes('keeper') || r === 'wk') {
    return {
      category: 'wicketkeeper',
      short: 'WK',
      label: 'Wicketkeeper',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
      accentHex: '#10B981',
      metricTextClass: 'text-emerald-400',
      topBarClass: 'from-emerald-400 via-teal-400 to-cyan-400',
    };
  }
  if (r.includes('all') || r.includes('rounder')) {
    return {
      category: 'all-rounder',
      short: 'AR',
      label: 'All-Rounder',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
      accentHex: '#818CF8',
      metricTextClass: 'text-indigo-300',
      topBarClass: 'from-indigo-400 via-blue-400 to-cyan-400',
    };
  }
  if (r.includes('bowl')) {
    return {
      category: 'bowler',
      short: 'BOWL',
      label: 'Bowler',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
      accentHex: '#22D3EE',
      metricTextClass: 'text-cyan-400',
      topBarClass: 'from-cyan-400 via-sky-400 to-blue-400',
    };
  }
  return {
    category: 'batter',
    short: 'BAT',
    label: 'Batter',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    accentHex: '#F59E0B',
    metricTextClass: 'text-amber-400',
    topBarClass: 'from-amber-400 via-orange-400 to-yellow-400',
  };
}

export function safeText(val: unknown, fallback = '—'): string {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'object') return fallback;
  return String(val);
}

/**
 * Parse a player's birth date into UTC milliseconds for accurate oldest-first sorting.
 * Supports ISO/YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, and readable date strings.
 */
export function parsePlayerDobMs(player: any): number | null {
  const raw = String(player?.dateOfBirth || player?.dob || player?.birthDate || '').trim();
  if (!raw || raw === 'TBA' || raw === '—') return null;

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const ms = Date.UTC(Number(y), Number(m) - 1, Number(d));
    return Number.isFinite(ms) ? ms : null;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const ms = Date.UTC(Number(y), Number(m) - 1, Number(d));
    return Number.isFinite(ms) ? ms : null;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Compute integer age from explicit `player.age` or fall back to birth date.
 */
export function getPlayerAgeNumeric(player: any): number | null {
  const rawAge = player?.age;
  if (typeof rawAge === 'number' && Number.isFinite(rawAge) && rawAge > 0 && rawAge < 80) {
    return Math.floor(rawAge);
  }
  if (typeof rawAge === 'string') {
    const parsedAge = Number.parseInt(rawAge, 10);
    if (Number.isFinite(parsedAge) && parsedAge > 0 && parsedAge < 80) {
      return parsedAge;
    }
  }

  const dobMs = parsePlayerDobMs(player);
  if (dobMs === null) return null;
  const dob = new Date(dobMs);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age > 0 && age < 80 ? age : null;
}

/**
 * Compare two players by age descending (oldest first).
 * Uses exact birth timestamp when available, then integer age, then name A–Z.
 */
export function comparePlayersByAgeDesc(a: any, b: any): number {
  const dobA = parsePlayerDobMs(a);
  const dobB = parsePlayerDobMs(b);

  if (dobA !== null && dobB !== null && dobA !== dobB) {
    return dobA - dobB; // Earlier timestamp = older athlete
  }

  const ageA = getPlayerAgeNumeric(a);
  const ageB = getPlayerAgeNumeric(b);

  if (ageA !== null && ageB !== null && ageA !== ageB) {
    return ageB - ageA; // Higher integer age = older athlete
  }

  if (dobA !== null || ageA !== null) {
    if (dobB === null && ageB === null) return -1;
  } else if (dobB !== null || ageB !== null) {
    return 1;
  }

  return String(a?.name || '').localeCompare(String(b?.name || ''));
}

function toNum(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export interface NormalizedPlayerMetrics {
  matches: number;
  runs: number;
  wickets: number;
  average: string;
  strikeRate: string;
  economy: string;
  highest: string;
  bestBowling: string;
  fifties: number;
  hundreds: number;
}

export function getPlayerLeagueStats(
  player: any,
  league: 'ipl' | 'wpl' = 'ipl'
): NormalizedPlayerMetrics {
  const s = (player?.stats && typeof player.stats === 'object') ? player.stats : {};
  const cs = (player?.careerStats && typeof player.careerStats === 'object') ? player.careerStats : {};
  const bat = (cs.batting && typeof cs.batting === 'object') ? cs.batting : {};
  const bowl = (cs.bowling && typeof cs.bowling === 'object') ? cs.bowling : {};

  const leagueKey = league === 'wpl' ? 'WPL' : 'IPL';
  const leagueBat =
    bat[leagueKey] ||
    bat[leagueKey.toLowerCase()] ||
    bat.T20 ||
    bat.T20I ||
    bat.t20 ||
    bat.t20i ||
    {};
  const leagueBowl =
    bowl[leagueKey] ||
    bowl[leagueKey.toLowerCase()] ||
    bowl.T20 ||
    bowl.T20I ||
    bowl.t20 ||
    bowl.t20i ||
    {};

  const matches = toNum(
    s.matches ?? player?.matches ?? leagueBat.Mat ?? leagueBat.M ?? leagueBat.matches ?? leagueBowl.Mat ?? leagueBowl.M
  );
  const runs = toNum(s.runs ?? player?.runs ?? leagueBat.Runs ?? leagueBat.runs ?? leagueBat.R);
  const wickets = toNum(s.wickets ?? player?.wickets ?? leagueBowl.Wkts ?? leagueBowl.wkts ?? leagueBowl.W);

  const rawAvg = s.average ?? s.battingAverage ?? player?.battingAverage ?? leagueBat.Avg ?? leagueBat.avg ?? leagueBat.Average;
  const avgNum = toNum(rawAvg);
  const average = avgNum > 0 ? avgNum.toFixed(2) : (typeof rawAvg === 'string' && rawAvg && rawAvg !== '0' ? rawAvg : '—');

  const rawSr = s.strikeRate ?? s.battingStrikeRate ?? player?.strikeRate ?? leagueBat.SR ?? leagueBat.sr;
  const srNum = toNum(rawSr);
  const strikeRate = srNum > 0 ? srNum.toFixed(1) : (typeof rawSr === 'string' && rawSr && rawSr !== '0' ? rawSr : '—');

  const rawEcon = s.economy ?? player?.economy ?? leagueBowl.Econ ?? leagueBowl.econ ?? leagueBowl.Eco;
  const econNum = toNum(rawEcon);
  const economy = econNum > 0 ? econNum.toFixed(2) : (typeof rawEcon === 'string' && rawEcon && rawEcon !== '0' ? rawEcon : '—');

  const highestRaw = s.highest ?? s.highestScore ?? player?.highestScore ?? leagueBat.HS ?? leagueBat.hs;
  const highest = highestRaw && typeof highestRaw !== 'object' ? String(highestRaw) : '—';

  const bestRaw = s.bestBowling ?? player?.bestBowling ?? leagueBowl.BBI ?? leagueBowl.bbi;
  const bestBowling = bestRaw && typeof bestRaw !== 'object' ? String(bestRaw) : '—';

  const fifties = toNum(s.fifties ?? player?.fifties ?? leagueBat['50'] ?? leagueBat['50s']);
  const hundreds = toNum(s.hundreds ?? player?.hundreds ?? leagueBat['100'] ?? leagueBat['100s']);

  return {
    matches,
    runs,
    wickets,
    average,
    strikeRate,
    economy,
    highest,
    bestBowling,
    fifties,
    hundreds,
  };
}

export interface BattingCareerRow {
  format: string;
  mat: string | number;
  inn: string | number;
  no: string | number;
  runs: string | number;
  hs: string | number;
  avg: string | number;
  bf: string | number;
  sr: string | number;
  hundreds: string | number;
  fifties: string | number;
  fours: string | number;
  sixes: string | number;
}

export interface BowlingCareerRow {
  format: string;
  mat: string | number;
  inn: string | number;
  balls: string | number;
  runs: string | number;
  wkts: string | number;
  bbi: string | number;
  econ: string | number;
  avg: string | number;
  sr: string | number;
  fiveW: string | number;
}

export function extractMultiFormatBattingRows(
  player: Player | any,
  league: 'ipl' | 'wpl' = 'ipl'
): BattingCareerRow[] {
  const bat = (player?.careerStats?.batting && typeof player.careerStats.batting === 'object')
    ? player.careerStats.batting
    : {};
  const leagueFmt = league === 'wpl' ? 'WPL' : 'IPL';
  const formats = ['Test', 'ODI', 'T20', leagueFmt];
  const rows: BattingCareerRow[] = [];

  for (const fmt of formats) {
    let row =
      bat[fmt] ||
      bat[fmt.toLowerCase()] ||
      bat[fmt.toUpperCase()] ||
      (fmt === 'T20'
        ? bat.T20I || bat.t20i || bat.wt20 || bat.WT20 || bat.wt20i || bat.WT20I
        : undefined) ||
      (fmt === 'Test' ? bat.wtest || bat.WTEST : undefined) ||
      (fmt === 'ODI' ? bat.wodi || bat.WODI : undefined) ||
      (fmt === 'WPL' ? bat.wpl : undefined) ||
      (fmt === 'IPL' ? bat.ipl : undefined);

    if (!row && fmt === leagueFmt && player?.stats) {
      const s = player.stats;
      const m = s.matches ?? player.matches ?? 0;
      const inn = s.battingInnings ?? (m || 0);
      const no = s.notOuts ?? 0;
      const runs = s.runs ?? player.runs ?? 0;
      const bf = s.ballsFaced ?? 0;
      const hs = s.highest ?? s.highestScore ?? player.highestScore ?? 0;
      const hsDisplay = s.highestNotOut ? `${hs}*` : hs;
      const dismissals = Math.max(0, Number(inn) - Number(no));
      const avg =
        s.average || s.battingAverage
          ? Number(s.average ?? s.battingAverage).toFixed(2)
          : dismissals > 0 && Number(runs) > 0
          ? (Number(runs) / dismissals).toFixed(2)
          : Number(runs) > 0
          ? Number(runs).toFixed(2)
          : '—';
      const sr =
        s.strikeRate || s.battingStrikeRate
          ? Number(s.strikeRate ?? s.battingStrikeRate).toFixed(2)
          : Number(bf) > 0 && Number(runs) > 0
          ? ((Number(runs) * 100) / Number(bf)).toFixed(2)
          : '—';

      if (m > 0 || runs > 0) {
        row = {
          Mat: m,
          Inn: inn,
          NO: no,
          Runs: runs,
          HS: hsDisplay || '—',
          Avg: avg,
          BF: bf || '—',
          SR: sr,
          '100': s.hundreds ?? player.hundreds ?? 0,
          '50': s.fifties ?? player.fifties ?? 0,
          '4s': s.fours ?? player.fours ?? 0,
          '6s': s.sixes ?? player.sixes ?? 0,
        };
      }
    }

    if (
      row &&
      (row.Mat !== undefined || row.Runs !== undefined || row.M !== undefined || row.matches !== undefined)
    ) {
      rows.push({
        format: fmt === 'T20' ? 'T20I' : fmt,
        mat: safeText(row.Mat ?? row.M ?? row.matches ?? row.Matches),
        inn: safeText(row.Inn ?? row.inn ?? row.Innings ?? row.innings),
        no: safeText(row.NO ?? row.no ?? row.NotOut ?? row['not out']),
        runs: safeText(row.Runs ?? row.runs ?? row.R ?? row.r),
        hs: safeText(row.HS ?? row.hs ?? row.Highest ?? row.highest),
        avg: safeText(row.Avg ?? row.avg ?? row.Average ?? row.average),
        bf: safeText(row.BF ?? row.bf ?? row.Balls ?? row.balls),
        sr: safeText(row.SR ?? row.sr ?? row.strikeRate ?? row['strike rate']),
        hundreds: safeText(row['100'] ?? row['100s'] ?? row.hundreds, '0'),
        fifties: safeText(row['50'] ?? row['50s'] ?? row.fifties, '0'),
        fours: safeText(row['4s'] ?? row.fours, '0'),
        sixes: safeText(row['6s'] ?? row.sixes, '0'),
      });
    }
  }

  return rows;
}

export function extractMultiFormatBowlingRows(
  player: Player | any,
  league: 'ipl' | 'wpl' = 'ipl'
): BowlingCareerRow[] {
  const bowl = (player?.careerStats?.bowling && typeof player.careerStats.bowling === 'object')
    ? player.careerStats.bowling
    : {};
  const leagueFmt = league === 'wpl' ? 'WPL' : 'IPL';
  const formats = ['Test', 'ODI', 'T20', leagueFmt];
  const rows: BowlingCareerRow[] = [];

  for (const fmt of formats) {
    let row =
      bowl[fmt] ||
      bowl[fmt.toLowerCase()] ||
      bowl[fmt.toUpperCase()] ||
      (fmt === 'T20'
        ? bowl.T20I || bowl.t20i || bowl.wt20 || bowl.WT20 || bowl.wt20i || bowl.WT20I
        : undefined) ||
      (fmt === 'Test' ? bowl.wtest || bowl.WTEST : undefined) ||
      (fmt === 'ODI' ? bowl.wodi || bowl.WODI : undefined) ||
      (fmt === 'WPL' ? bowl.wpl : undefined) ||
      (fmt === 'IPL' ? bowl.ipl : undefined);

    if (
      !row &&
      fmt === leagueFmt &&
      player?.stats &&
      (player.stats.wickets || player.stats.economy || player.stats.balls)
    ) {
      const s = player.stats;
      const m = s.matches ?? player.matches ?? 0;
      const inn = s.bowlingInnings || '—';
      const ballsVal = toNum(s.balls);
      const runsConceded = toNum(s.runsConceded);
      const wkts = toNum(s.wickets);
      const econ = s.economy
        ? Number(s.economy).toFixed(2)
        : ballsVal > 0
        ? ((runsConceded * 6) / ballsVal).toFixed(2)
        : '—';
      const bAvg = s.bowlingAverage
        ? Number(s.bowlingAverage).toFixed(2)
        : wkts > 0 && runsConceded > 0
        ? (runsConceded / wkts).toFixed(2)
        : '—';
      const bSr = s.bowlingStrikeRate
        ? Number(s.bowlingStrikeRate).toFixed(1)
        : wkts > 0 && ballsVal > 0
        ? (ballsVal / wkts).toFixed(1)
        : '—';

      row = {
        Mat: m,
        Inn: inn,
        Balls: ballsVal > 0 ? ballsVal : s.balls || '—',
        Runs: runsConceded,
        Wkts: wkts,
        BBI: s.bestBowling || '—',
        Econ: econ,
        Avg: bAvg,
        SR: bSr,
        '5W': s.fiveWickets ?? 0,
      };
    }

    if (
      row &&
      (row.Mat !== undefined || row.Wkts !== undefined || row.Balls !== undefined || row.M !== undefined)
    ) {
      rows.push({
        format: fmt === 'T20' ? 'T20I' : fmt,
        mat: safeText(row.Mat ?? row.M ?? row.matches ?? row.Matches),
        inn: safeText(row.Inn ?? row.inn ?? row.Innings ?? row.innings),
        balls: safeText(row.Balls ?? row.balls ?? row.B ?? row.b),
        runs: safeText(row.Runs ?? row.runs ?? row.R ?? row.r),
        wkts: safeText(row.Wkts ?? row.wkts ?? row.W ?? row.w),
        bbi: safeText(row.BBI ?? row.bbi ?? row.bestBowling, '—'),
        econ: safeText(row.Econ ?? row.econ ?? row.economy),
        avg: safeText(row.Avg ?? row.avg ?? row.average),
        sr: safeText(row.SR ?? row.sr ?? row.strikeRate),
        fiveW: safeText(row['5w'] ?? row['5W'] ?? row.fiveWickets, '0'),
      });
    }
  }

  return rows;
}

/**
 * Determine whether an all-rounder is predominantly a bowling all-rounder vs batting all-rounder.
 */
export function isBowlingAllRounder(player: any, league: 'ipl' | 'wpl' = 'ipl'): boolean {
  const roleStr = String(player?.role || '').toLowerCase();
  if (roleStr.includes('bowling all') || roleStr.includes('bowl-ar')) return true;
  if (roleStr.includes('batting all') || roleStr.includes('bat-ar')) return false;

  const leagueStats = getPlayerLeagueStats(player, league);
  let runs = leagueStats.runs;
  let wickets = leagueStats.wickets;

  // Fall back to broader career formats when league stats are empty (e.g. new signings)
  if (runs === 0 && wickets === 0) {
    const cs = (player?.careerStats && typeof player.careerStats === 'object') ? player.careerStats : {};
    const batRows = Object.values((cs.batting && typeof cs.batting === 'object') ? cs.batting : {}) as any[];
    const bowlRows = Object.values((cs.bowling && typeof cs.bowling === 'object') ? cs.bowling : {}) as any[];
    runs = batRows.reduce((sum, row) => sum + toNum(row?.Runs ?? row?.runs ?? row?.R), 0);
    wickets = bowlRows.reduce((sum, row) => sum + toNum(row?.Wkts ?? row?.wkts ?? row?.W), 0);
  }

  if (runs > 0 || wickets > 0) {
    return wickets * 20 > runs;
  }

  return false;
}

/**
 * Canonical squad sort tiers:
 * 0 = Batter, 1 = Wicketkeeper, 2 = Batting All-Rounder, 3 = Bowling All-Rounder, 4 = Bowler
 */
export function getPlayerRoleSortTier(player: any, league: 'ipl' | 'wpl' = 'ipl'): number {
  const category = getRoleMeta(player?.role).category;
  if (category === 'batter') return 0;
  if (category === 'wicketkeeper') return 1;
  if (category === 'all-rounder') return isBowlingAllRounder(player, league) ? 3 : 2;
  return 4;
}

/**
 * Display-ready role label distinguishing Batting vs Bowling All-Rounders cleanly.
 */
export function getPlayerDisplayRoleLabel(player: any, league: 'ipl' | 'wpl' = 'ipl'): string {
  const meta = getRoleMeta(player?.role);
  if (meta.category !== 'all-rounder') return meta.label;
  return isBowlingAllRounder(player, league) ? 'Bowling All-Rounder' : 'Batting All-Rounder';
}

/**
 * Sort squad athletes by Role tier (Batting -> Wicketkeeper -> Batting AR -> Bowling AR -> Bowler),
 * and within each tier sort oldest to youngest.
 */
export function sortPlayersByRoleAndAge<T = any>(list: T[], league: 'ipl' | 'wpl' = 'ipl'): T[] {
  return [...list].sort((a, b) => {
    const tierDiff = getPlayerRoleSortTier(a, league) - getPlayerRoleSortTier(b, league);
    if (tierDiff !== 0) return tierDiff;
    return comparePlayersByAgeDesc(a, b);
  });
}
