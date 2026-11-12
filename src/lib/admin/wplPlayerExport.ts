import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export type WplRoleCategory = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
export type WplStatFormat = 'BEST_T20' | 'WPL' | 'T20' | 'ODI' | 'Test';
export type WplExportFormatId = 'pdf' | 'excel' | 'csv' | 'tsv' | 'json' | 'sql' | 'markdown';
export type WplNationalityScope = 'ALL' | 'INDIA' | 'OVERSEAS';
export type WplSquadStatusScope = 'ALL' | 'Active Squad' | 'Injured' | 'Reserve' | 'Unavailable';
export type WplCaptaincyScope = 'ALL' | 'CAPTAINS_ONLY';
export type WplBattingHandScope = 'ALL' | 'RIGHT' | 'LEFT';
export type WplBowlingScope = 'ALL' | 'PACE' | 'SPIN';
export type WplStatsScope = 'ALL' | 'WITH_STATS' | 'MISSING_STATS';
export type WplSortBy = 'TEAM_ROLE_NAME' | 'NAME_ASC' | 'RUNS_DESC' | 'WKTS_DESC' | 'AUCTION_FEE_DESC';

export interface WplTeamRef {
  id: string;
  name: string;
  short: string;
  slug?: string;
}

export interface WplExportPlayerInput {
  id: string | number;
  name: string;
  teamId?: string | number;
  team?: string;
  teamShort?: string;
  role?: string;
  allrounderType?: string;
  isCaptain?: boolean;
  nationality?: string;
  age?: number | string;
  dateOfBirth?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  jerseyNumber?: string | number;
  squadStatus?: string;
  cricbuzzUrl?: string;
  auction?: {
    fee?: string;
    price?: string;
    status?: string;
    year?: string | number;
  };
  stats?: Record<string, any>;
  careerStats?: {
    batting?: Record<string, Record<string, any>>;
    bowling?: Record<string, Record<string, any>>;
  };
}

export interface WplExportFilterOptions {
  teamIds: 'ALL' | string[];
  roles: 'ALL' | WplRoleCategory[];
  nationalityScope: WplNationalityScope;
  countryFilter: string;
  squadStatus: WplSquadStatusScope;
  captaincyScope: WplCaptaincyScope;
  battingHand: WplBattingHandScope;
  bowlingScope: WplBowlingScope;
  statsScope: WplStatsScope;
  formatFocus: WplStatFormat;
  sortBy: WplSortBy;
  searchQuery?: string;
  applySearchQuery?: boolean;
}

export interface ExtractedBattingRow {
  format: 'Test' | 'ODI' | 'T20' | 'WPL';
  matches: string;
  innings: string;
  notOut: string;
  runs: string;
  hs: string;
  avg: string;
  balls: string;
  sr: string;
  hundreds: string;
  fifties: string;
  fours: string;
  sixes: string;
}

export interface ExtractedBowlingRow {
  format: 'Test' | 'ODI' | 'T20' | 'WPL';
  matches: string;
  innings: string;
  balls: string;
  runsConceded: string;
  wickets: string;
  bbi: string;
  econ: string;
  avg: string;
  sr: string;
  fiveWickets: string;
}

export interface NormalizedWplExportRecord {
  id: string;
  name: string;
  teamId: string;
  teamShort: string;
  teamName: string;
  role: WplRoleCategory;
  rawRole: string;
  allrounderType: string;
  isCaptain: boolean;
  nationality: string;
  isOverseas: boolean;
  age: string;
  dateOfBirth: string;
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber: string;
  squadStatus: string;
  auctionFee: string;
  auctionFeeLakhs: number;
  cricbuzzUrl: string;
  hasAnyStats: boolean;
  formatsAvailable: ('Test' | 'ODI' | 'T20' | 'WPL')[];
  battingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBattingRow | null>;
  bowlingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBowlingRow | null>;
  headlineFormatUsed: string;
  headlineBatting: ExtractedBattingRow | null;
  headlineBowling: ExtractedBowlingRow | null;
}

export interface WplExportSummary {
  totalPlayers: number;
  teamCount: number;
  indiaCount: number;
  overseasCount: number;
  captainsCount: number;
  withStatsCount: number;
  missingStatsCount: number;
  totalPurseLakhs: number;
  byRole: Record<WplRoleCategory, number>;
  byTeam: Array<{
    teamId: string;
    teamShort: string;
    teamName: string;
    total: number;
    batters: number;
    bowlers: number;
    allRounders: number;
    wicketKeepers: number;
    india: number;
    overseas: number;
    captains: number;
    withStats: number;
    totalPurseLakhs: number;
  }>;
}

export interface WplExportResult {
  format: WplExportFormatId;
  fileName: string;
  playerCount: number;
  exportedAt: string;
}

export const WPL_CANONICAL_TEAMS: WplTeamRef[] = [
  { id: '14', name: 'Royal Challengers Bengaluru', short: 'RCB-W', slug: 'rcb-w' },
  { id: '13', name: 'Mumbai Indians', short: 'MI-W', slug: 'mi-w' },
  { id: '11', name: 'Delhi Capitals', short: 'DC-W', slug: 'dc-w' },
  { id: '12', name: 'Gujarat Giants', short: 'GG', slug: 'gg' },
  { id: '15', name: 'UP Warriorz', short: 'UPW', slug: 'upw' },
];

export const WPL_ROLE_CATEGORIES: WplRoleCategory[] = [
  'Batter',
  'All-rounder',
  'Bowler',
  'Wicket-keeper',
];

export const WPL_FORMATS_ORDER: Array<'Test' | 'ODI' | 'T20' | 'WPL'> = ['WPL', 'T20', 'ODI', 'Test'];

export const DEFAULT_WPL_EXPORT_FILTERS: WplExportFilterOptions = {
  teamIds: 'ALL',
  roles: 'ALL',
  nationalityScope: 'ALL',
  countryFilter: 'ALL',
  squadStatus: 'ALL',
  captaincyScope: 'ALL',
  battingHand: 'ALL',
  bowlingScope: 'ALL',
  statsScope: 'ALL',
  formatFocus: 'BEST_T20',
  sortBy: 'TEAM_ROLE_NAME',
  searchQuery: '',
  applySearchQuery: false,
};

const FORMAT_ALIASES: Record<'Test' | 'ODI' | 'T20' | 'WPL', string[]> = {
  WPL: ['WPL', 'wpl', 'IPL', 'ipl'],
  T20: ['T20', 't20', 'T20I', 't20i', 'wt20', 'WT20', 'wt20i', 'WT20I'],
  ODI: ['ODI', 'odi', 'wodi', 'WODI'],
  Test: ['Test', 'test', 'TEST', 'wtest', 'WTEST'],
};

const TEAM_ID_ALIASES: Record<string, string[]> = {
  '14': ['14', 'rcb', 'rcb-w', 'royal challengers bengaluru', 'royal challengers bangalore'],
  '13': ['13', 'mi', 'mi-w', 'mumbai indians'],
  '11': ['11', 'dc', 'dc-w', 'delhi capitals'],
  '12': ['12', 'gg', 'gg-w', 'gujarat giants'],
  '15': ['15', 'upw', 'up-w', 'up warriorz'],
};

function cleanStr(value: unknown, fallback = '—'): string {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

function statVal(row: Record<string, any> | undefined, keys: string[], fallback = '—'): string {
  if (!row) return fallback;
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') {
      return String(val).trim();
    }
  }
  return fallback;
}

function toNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeWplRole(rawRole?: string): WplRoleCategory {
  const role = String(rawRole || '').toLowerCase().trim();
  if (role.includes('wicket') || role.includes('keeper') || role === 'wk') {
    return 'Wicket-keeper';
  }
  if (role.includes('all')) {
    return 'All-rounder';
  }
  if (role.includes('bowl')) {
    return 'Bowler';
  }
  return 'Batter';
}

export function resolveWplTeam(player: WplExportPlayerInput, teams: WplTeamRef[] = WPL_CANONICAL_TEAMS): WplTeamRef {
  const rawTeamId = String(player.teamId || '').trim().toLowerCase();
  const rawTeamName = String(player.team || '').trim().toLowerCase();
  const rawTeamShort = String(player.teamShort || '').trim().toLowerCase();

  const direct = teams.find(
    (t) =>
      t.id.toLowerCase() === rawTeamId ||
      t.short.toLowerCase() === rawTeamShort ||
      (t.slug && t.slug.toLowerCase() === rawTeamId) ||
      t.name.toLowerCase() === rawTeamName
  );
  if (direct) return direct;

  for (const [canonicalId, tokens] of Object.entries(TEAM_ID_ALIASES)) {
    const matched = tokens.some(
      (tok) => rawTeamId === tok || rawTeamShort === tok || rawTeamName === tok || rawTeamName.includes(tok)
    );
    if (matched) {
      return teams.find((t) => t.id === canonicalId) || { id: canonicalId, name: cleanStr(player.team, 'WPL Franchise'), short: cleanStr(player.teamShort, 'WPL') };
    }
  }

  return {
    id: cleanStr(player.teamId, 'unknown'),
    name: cleanStr(player.team, 'Unassigned'),
    short: cleanStr(player.teamShort, 'WPL'),
  };
}

export function parseAuctionFeeLakhs(feeStr?: string): number {
  if (!feeStr) return 0;
  const normalized = feeStr.toLowerCase().replace(/,/g, '').trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) return 0;
  if (normalized.includes('cr')) return Math.round(numeric * 100);
  if (normalized.includes('lakh') || normalized.includes('lac') || normalized.endsWith('l')) return Math.round(numeric);
  if (numeric <= 15) return Math.round(numeric * 100);
  return Math.round(numeric);
}

function findFormatStatMap(
  statsByFormat: Record<string, Record<string, any>> | undefined,
  format: 'Test' | 'ODI' | 'T20' | 'WPL'
): Record<string, any> | undefined {
  if (!statsByFormat || typeof statsByFormat !== 'object') return undefined;
  const aliases = FORMAT_ALIASES[format];
  for (const key of aliases) {
    if (statsByFormat[key] && typeof statsByFormat[key] === 'object') {
      return statsByFormat[key];
    }
  }
  return undefined;
}

function extractBattingFormat(
  player: WplExportPlayerInput,
  format: 'Test' | 'ODI' | 'T20' | 'WPL'
): ExtractedBattingRow | null {
  const row = findFormatStatMap(player.careerStats?.batting, format);
  if (row) {
    const matches = statVal(row, ['Mat', 'M', 'Matches', 'matches']);
    const runs = statVal(row, ['Runs', 'R', 'runs']);
    if (matches !== '—' || runs !== '—') {
      return {
        format,
        matches,
        innings: statVal(row, ['Inn', 'Inns', 'Innings', 'innings']),
        notOut: statVal(row, ['NO', 'NotOut', 'no']),
        runs,
        hs: statVal(row, ['HS', 'Highest', 'highScore']),
        avg: statVal(row, ['Avg', 'Average', 'average']),
        balls: statVal(row, ['BF', 'Balls', 'balls']),
        sr: statVal(row, ['SR', 'strikeRate', 'StrikeRate']),
        hundreds: statVal(row, ['100', '100s', 'hundreds'], '0'),
        fifties: statVal(row, ['50', '50s', 'fifties'], '0'),
        fours: statVal(row, ['4s', 'fours'], '—'),
        sixes: statVal(row, ['6s', 'sixes'], '—'),
      };
    }
  }

  // Fallback to flat legacy player.stats for WPL when careerStats is empty
  if (format === 'WPL' && player.stats && (player.stats.matches !== undefined || player.stats.runs !== undefined)) {
    const s = player.stats;
    return {
      format: 'WPL',
      matches: cleanStr(s.matches),
      innings: cleanStr(s.innings),
      notOut: cleanStr(s.notOuts),
      runs: cleanStr(s.runs),
      hs: cleanStr(s.highScore),
      avg: cleanStr(s.average),
      balls: cleanStr(s.ballsFaced),
      sr: cleanStr(s.strikeRate),
      hundreds: cleanStr(s.hundreds, '0'),
      fifties: cleanStr(s.fifties, '0'),
      fours: cleanStr(s.fours),
      sixes: cleanStr(s.sixes),
    };
  }

  return null;
}

function extractBowlingFormat(
  player: WplExportPlayerInput,
  format: 'Test' | 'ODI' | 'T20' | 'WPL'
): ExtractedBowlingRow | null {
  const row = findFormatStatMap(player.careerStats?.bowling, format);
  if (row) {
    const matches = statVal(row, ['Mat', 'M', 'Matches', 'matches']);
    const wickets = statVal(row, ['Wkts', 'W', 'Wickets', 'wickets']);
    const balls = statVal(row, ['Balls', 'B', 'balls']);
    if (matches !== '—' || wickets !== '—' || balls !== '—') {
      return {
        format,
        matches,
        innings: statVal(row, ['Inn', 'Inns', 'Innings', 'innings']),
        balls,
        runsConceded: statVal(row, ['Runs', 'R', 'runsConceded']),
        wickets,
        bbi: statVal(row, ['BBI', 'bestBowling', 'Best']),
        econ: statVal(row, ['Econ', 'Eco', 'economy', 'Economy']),
        avg: statVal(row, ['Avg', 'Average', 'average']),
        sr: statVal(row, ['SR', 'strikeRate', 'StrikeRate']),
        fiveWickets: statVal(row, ['5W', '5w', 'fiveWickets'], '0'),
      };
    }
  }

  if (format === 'WPL' && player.stats && (player.stats.wickets !== undefined || player.stats.economy !== undefined)) {
    const s = player.stats;
    if (s.wickets === undefined && s.economy === undefined) return null;
    return {
      format: 'WPL',
      matches: cleanStr(s.matches),
      innings: cleanStr(s.bowlingInnings),
      balls: cleanStr(s.ballsBowled),
      runsConceded: cleanStr(s.runsConceded),
      wickets: cleanStr(s.wickets),
      bbi: cleanStr(s.bestBowling),
      econ: cleanStr(s.economy),
      avg: cleanStr(s.bowlingAverage),
      sr: cleanStr(s.bowlingStrikeRate),
      fiveWickets: cleanStr(s.fiveWickets, '0'),
    };
  }

  return null;
}

function pickHeadlineStats(
  battingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBattingRow | null>,
  bowlingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBowlingRow | null>,
  formatFocus: WplStatFormat
): {
  headlineFormatUsed: string;
  headlineBatting: ExtractedBattingRow | null;
  headlineBowling: ExtractedBowlingRow | null;
} {
  const preference: Array<'Test' | 'ODI' | 'T20' | 'WPL'> =
    formatFocus === 'BEST_T20'
      ? ['WPL', 'T20', 'ODI', 'Test']
      : [formatFocus, 'WPL', 'T20', 'ODI', 'Test'].filter((v, idx, arr) => arr.indexOf(v) === idx) as Array<'Test' | 'ODI' | 'T20' | 'WPL'>;

  if (formatFocus !== 'BEST_T20') {
    const exactBat = battingByFormat[formatFocus];
    const exactBowl = bowlingByFormat[formatFocus];
    if (exactBat || exactBowl) {
      return {
        headlineFormatUsed: formatFocus,
        headlineBatting: exactBat,
        headlineBowling: exactBowl,
      };
    }
    return {
      headlineFormatUsed: formatFocus,
      headlineBatting: null,
      headlineBowling: null,
    };
  }

  for (const fmt of preference) {
    if (battingByFormat[fmt] || bowlingByFormat[fmt]) {
      return {
        headlineFormatUsed: fmt,
        headlineBatting: battingByFormat[fmt],
        headlineBowling: bowlingByFormat[fmt],
      };
    }
  }

  return {
    headlineFormatUsed: 'WPL',
    headlineBatting: null,
    headlineBowling: null,
  };
}

export function normalizeWplPlayerForExport(
  player: WplExportPlayerInput,
  teams: WplTeamRef[] = WPL_CANONICAL_TEAMS,
  formatFocus: WplStatFormat = 'BEST_T20'
): NormalizedWplExportRecord {
  const team = resolveWplTeam(player, teams);
  const role = normalizeWplRole(player.role);
  const nationality = cleanStr(player.nationality, 'India');
  const isOverseas = nationality.toLowerCase() !== 'india';
  const auctionFee = cleanStr(player.auction?.fee || player.auction?.price, '—');

  const battingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBattingRow | null> = {
    WPL: extractBattingFormat(player, 'WPL'),
    T20: extractBattingFormat(player, 'T20'),
    ODI: extractBattingFormat(player, 'ODI'),
    Test: extractBattingFormat(player, 'Test'),
  };

  const bowlingByFormat: Record<'Test' | 'ODI' | 'T20' | 'WPL', ExtractedBowlingRow | null> = {
    WPL: extractBowlingFormat(player, 'WPL'),
    T20: extractBowlingFormat(player, 'T20'),
    ODI: extractBowlingFormat(player, 'ODI'),
    Test: extractBowlingFormat(player, 'Test'),
  };

  const formatsAvailable = WPL_FORMATS_ORDER.filter(
    (fmt) => battingByFormat[fmt] !== null || bowlingByFormat[fmt] !== null
  );

  const { headlineFormatUsed, headlineBatting, headlineBowling } = pickHeadlineStats(
    battingByFormat,
    bowlingByFormat,
    formatFocus
  );

  return {
    id: String(player.id),
    name: cleanStr(player.name, 'Unknown Player'),
    teamId: team.id,
    teamShort: team.short,
    teamName: team.name,
    role,
    rawRole: cleanStr(player.role, role),
    allrounderType: role === 'All-rounder' ? cleanStr(player.allrounderType, 'All-rounder') : '—',
    isCaptain: Boolean(player.isCaptain),
    nationality,
    isOverseas,
    age: player.age !== undefined && player.age !== null && String(player.age).trim() !== '' ? String(player.age) : '—',
    dateOfBirth: cleanStr(player.dateOfBirth),
    battingStyle: cleanStr(player.battingStyle),
    bowlingStyle: cleanStr(player.bowlingStyle),
    jerseyNumber: cleanStr(player.jerseyNumber, 'N/A'),
    squadStatus: cleanStr(player.squadStatus, 'Active Squad'),
    auctionFee,
    auctionFeeLakhs: parseAuctionFeeLakhs(auctionFee),
    cricbuzzUrl: cleanStr(player.cricbuzzUrl, ''),
    hasAnyStats: formatsAvailable.length > 0,
    formatsAvailable,
    battingByFormat,
    bowlingByFormat,
    headlineFormatUsed,
    headlineBatting,
    headlineBowling,
  };
}

function classifyBowlingArmType(bowlingStyle: string): 'PACE' | 'SPIN' | 'OTHER' {
  const s = bowlingStyle.toLowerCase();
  if (!s || s === '—' || s === 'none' || s === 'n/a') return 'OTHER';
  if (s.includes('fast') || s.includes('medium') || s.includes('seam') || s.includes('pace')) {
    return 'PACE';
  }
  if (s.includes('spin') || s.includes('break') || s.includes('orthodox') || s.includes('chinaman') || s.includes('googly')) {
    return 'SPIN';
  }
  return 'OTHER';
}

export function filterAndNormalizeWplPlayers(
  players: WplExportPlayerInput[],
  filters: WplExportFilterOptions,
  teams: WplTeamRef[] = WPL_CANONICAL_TEAMS
): NormalizedWplExportRecord[] {
  const normalized = players.map((p) => normalizeWplPlayerForExport(p, teams, filters.formatFocus));
  const search = filters.applySearchQuery && filters.searchQuery ? filters.searchQuery.trim().toLowerCase() : '';

  const filtered = normalized.filter((record) => {
    if (filters.teamIds !== 'ALL' && filters.teamIds.length > 0 && !filters.teamIds.includes(record.teamId)) {
      return false;
    }
    if (filters.roles !== 'ALL' && filters.roles.length > 0 && !filters.roles.includes(record.role)) {
      return false;
    }
    if (filters.nationalityScope === 'INDIA' && record.isOverseas) {
      return false;
    }
    if (filters.nationalityScope === 'OVERSEAS' && !record.isOverseas) {
      return false;
    }
    if (filters.countryFilter !== 'ALL' && record.nationality.toLowerCase() !== filters.countryFilter.toLowerCase()) {
      return false;
    }
    if (filters.squadStatus !== 'ALL' && record.squadStatus.toLowerCase() !== filters.squadStatus.toLowerCase()) {
      return false;
    }
    if (filters.captaincyScope === 'CAPTAINS_ONLY' && !record.isCaptain) {
      return false;
    }
    if (filters.battingHand === 'RIGHT' && !record.battingStyle.toLowerCase().includes('right')) {
      return false;
    }
    if (filters.battingHand === 'LEFT' && !record.battingStyle.toLowerCase().includes('left')) {
      return false;
    }
    if (filters.bowlingScope !== 'ALL') {
      const styleClass = classifyBowlingArmType(record.bowlingStyle);
      if (styleClass !== filters.bowlingScope) return false;
    }
    if (filters.statsScope === 'WITH_STATS' && !record.hasAnyStats) {
      return false;
    }
    if (filters.statsScope === 'MISSING_STATS' && record.hasAnyStats) {
      return false;
    }
    if (search) {
      const haystack = `${record.name} ${record.teamName} ${record.teamShort} ${record.nationality} ${record.role}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const roleOrder: Record<WplRoleCategory, number> = {
    Batter: 1,
    'Wicket-keeper': 2,
    'All-rounder': 3,
    Bowler: 4,
  };

  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'NAME_ASC':
        return a.name.localeCompare(b.name);
      case 'RUNS_DESC': {
        const diff = toNumber(b.headlineBatting?.runs || '0') - toNumber(a.headlineBatting?.runs || '0');
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      case 'WKTS_DESC': {
        const diff = toNumber(b.headlineBowling?.wickets || '0') - toNumber(a.headlineBowling?.wickets || '0');
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      case 'AUCTION_FEE_DESC': {
        const diff = b.auctionFeeLakhs - a.auctionFeeLakhs;
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      case 'TEAM_ROLE_NAME':
      default: {
        const teamCmp = a.teamShort.localeCompare(b.teamShort);
        if (teamCmp !== 0) return teamCmp;
        const roleCmp = (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9);
        if (roleCmp !== 0) return roleCmp;
        return a.name.localeCompare(b.name);
      }
    }
  });
}

export function summarizeWplExportRecords(
  records: NormalizedWplExportRecord[],
  teams: WplTeamRef[] = WPL_CANONICAL_TEAMS
): WplExportSummary {
  const byRole: Record<WplRoleCategory, number> = {
    Batter: 0,
    'All-rounder': 0,
    Bowler: 0,
    'Wicket-keeper': 0,
  };

  const teamMap = new Map<string, WplExportSummary['byTeam'][number]>();
  for (const t of teams) {
    teamMap.set(t.id, {
      teamId: t.id,
      teamShort: t.short,
      teamName: t.name,
      total: 0,
      batters: 0,
      bowlers: 0,
      allRounders: 0,
      wicketKeepers: 0,
      india: 0,
      overseas: 0,
      captains: 0,
      withStats: 0,
      totalPurseLakhs: 0,
    });
  }

  let indiaCount = 0;
  let overseasCount = 0;
  let captainsCount = 0;
  let withStatsCount = 0;
  let totalPurseLakhs = 0;

  for (const r of records) {
    byRole[r.role] = (byRole[r.role] || 0) + 1;
    if (r.isOverseas) overseasCount++;
    else indiaCount++;
    if (r.isCaptain) captainsCount++;
    if (r.hasAnyStats) withStatsCount++;
    totalPurseLakhs += r.auctionFeeLakhs;

    if (!teamMap.has(r.teamId)) {
      teamMap.set(r.teamId, {
        teamId: r.teamId,
        teamShort: r.teamShort,
        teamName: r.teamName,
        total: 0,
        batters: 0,
        bowlers: 0,
        allRounders: 0,
        wicketKeepers: 0,
        india: 0,
        overseas: 0,
        captains: 0,
        withStats: 0,
        totalPurseLakhs: 0,
      });
    }

    const bucket = teamMap.get(r.teamId)!;
    bucket.total++;
    if (r.role === 'Batter') bucket.batters++;
    else if (r.role === 'Bowler') bucket.bowlers++;
    else if (r.role === 'All-rounder') bucket.allRounders++;
    else if (r.role === 'Wicket-keeper') bucket.wicketKeepers++;
    if (r.isOverseas) bucket.overseas++;
    else bucket.india++;
    if (r.isCaptain) bucket.captains++;
    if (r.hasAnyStats) bucket.withStats++;
    bucket.totalPurseLakhs += r.auctionFeeLakhs;
  }

  const activeTeams = Array.from(teamMap.values()).filter((t) => t.total > 0);
  return {
    totalPlayers: records.length,
    teamCount: activeTeams.length,
    indiaCount,
    overseasCount,
    captainsCount,
    withStatsCount,
    missingStatsCount: records.length - withStatsCount,
    totalPurseLakhs,
    byRole,
    byTeam: activeTeams,
  };
}

export function describeFilterScope(
  filters: WplExportFilterOptions,
  teams: WplTeamRef[] = WPL_CANONICAL_TEAMS
): { scopeSlug: string; scopeLabel: string } {
  const parts: string[] = [];
  const slugParts: string[] = ['wpl'];

  if (filters.teamIds === 'ALL' || filters.teamIds.length === 0 || filters.teamIds.length === teams.length) {
    parts.push('All WPL Teams');
    slugParts.push('all-teams');
  } else {
    const shorts = filters.teamIds
      .map((id) => teams.find((t) => t.id === id)?.short || id)
      .filter(Boolean);
    parts.push(shorts.join(', '));
    slugParts.push(shorts.join('-').toLowerCase().replace(/[^a-z0-9-]+/g, ''));
  }

  if (filters.roles === 'ALL' || filters.roles.length === 0 || filters.roles.length === WPL_ROLE_CATEGORIES.length) {
    parts.push('All Roles');
    slugParts.push('all-roles');
  } else {
    const label = filters.roles.join(' & ');
    parts.push(label);
    slugParts.push(filters.roles.join('-').toLowerCase().replace(/[^a-z0-9-]+/g, ''));
  }

  if (filters.nationalityScope !== 'ALL') {
    parts.push(filters.nationalityScope === 'INDIA' ? 'India Only' : 'Overseas Only');
    slugParts.push(filters.nationalityScope.toLowerCase());
  }
  if (filters.countryFilter !== 'ALL') {
    parts.push(filters.countryFilter);
    slugParts.push(filters.countryFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }
  if (filters.squadStatus !== 'ALL') {
    parts.push(filters.squadStatus);
  }
  if (filters.captaincyScope === 'CAPTAINS_ONLY') {
    parts.push('Captains');
    slugParts.push('captains');
  }
  if (filters.battingHand !== 'ALL') {
    parts.push(filters.battingHand === 'RIGHT' ? 'RHB' : 'LHB');
  }
  if (filters.bowlingScope !== 'ALL') {
    parts.push(filters.bowlingScope === 'PACE' ? 'Pace' : 'Spin');
  }
  if (filters.statsScope === 'WITH_STATS') {
    parts.push('With Stats');
  } else if (filters.statsScope === 'MISSING_STATS') {
    parts.push('Missing Stats');
  }

  return {
    scopeLabel: parts.join(' • '),
    scopeSlug: slugParts.join('_'),
  };
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildFlatRows(records: NormalizedWplExportRecord[]) {
  return records.map((r, index) => {
    const wplBat = r.battingByFormat.WPL;
    const wplBowl = r.bowlingByFormat.WPL;
    const t20Bat = r.battingByFormat.T20;
    const t20Bowl = r.bowlingByFormat.T20;
    const odiBat = r.battingByFormat.ODI;
    const odiBowl = r.bowlingByFormat.ODI;

    return {
      '#': index + 1,
      'Player ID': r.id,
      'Player Name': r.name,
      'Team': r.teamShort,
      'Franchise': r.teamName,
      'Role': r.role,
      'All-Rounder Spec': r.allrounderType,
      'Captain': r.isCaptain ? 'Yes' : 'No',
      'Nationality': r.nationality,
      'Slot Type': r.isOverseas ? 'Overseas' : 'Domestic (IND)',
      'Age': r.age,
      'Date of Birth': r.dateOfBirth,
      'Batting Style': r.battingStyle,
      'Bowling Style': r.bowlingStyle,
      'Jersey #': r.jerseyNumber,
      'Squad Status': r.squadStatus,
      'Auction / Contract Fee': r.auctionFee,
      'Fee (INR Lakhs)': r.auctionFeeLakhs,
      'Stats Formats': r.formatsAvailable.join(', ') || 'None',
      'Focus Format': r.headlineFormatUsed,
      'Focus Bat Mat': r.headlineBatting?.matches || '—',
      'Focus Bat Runs': r.headlineBatting?.runs || '—',
      'Focus Bat HS': r.headlineBatting?.hs || '—',
      'Focus Bat Avg': r.headlineBatting?.avg || '—',
      'Focus Bat SR': r.headlineBatting?.sr || '—',
      'Focus 50s/100s': r.headlineBatting ? `${r.headlineBatting.fifties}/${r.headlineBatting.hundreds}` : '—',
      'Focus Bowl Wkts': r.headlineBowling?.wickets || '—',
      'Focus Bowl Econ': r.headlineBowling?.econ || '—',
      'Focus Bowl Avg': r.headlineBowling?.avg || '—',
      'Focus Bowl BBI': r.headlineBowling?.bbi || '—',
      'WPL Matches': wplBat?.matches || wplBowl?.matches || '—',
      'WPL Runs': wplBat?.runs || '—',
      'WPL Bat SR': wplBat?.sr || '—',
      'WPL Wickets': wplBowl?.wickets || '—',
      'WPL Econ': wplBowl?.econ || '—',
      'T20I/T20 Runs': t20Bat?.runs || '—',
      'T20I/T20 Wkts': t20Bowl?.wickets || '—',
      'ODI Runs': odiBat?.runs || '—',
      'ODI Wkts': odiBowl?.wickets || '—',
    };
  });
}

function escapeDelimited(val: unknown, delimiter: string): string {
  const s = String(val ?? '');
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeSql(val: string | number | boolean | null | undefined): string {
  if (val === undefined || val === null || val === '—') return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function exportDelimited(
  records: NormalizedWplExportRecord[],
  scopeSlug: string,
  dateStamp: string,
  delimiter: ',' | '\t',
  ext: 'csv' | 'tsv',
  mime: string
): string {
  const flatRows = buildFlatRows(records);
  const headers = flatRows.length > 0 ? Object.keys(flatRows[0]) : ['Message'];
  const lines = [
    headers.map((h) => escapeDelimited(h, delimiter)).join(delimiter),
    ...(flatRows.length > 0
      ? flatRows.map((row) => headers.map((h) => escapeDelimited((row as Record<string, unknown>)[h], delimiter)).join(delimiter))
      : [`No matching players found${delimiter}`]),
  ];
  const fileName = `${scopeSlug}_${dateStamp}.${ext}`;
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: `${mime};charset=utf-8;` });
  triggerFileDownload(blob, fileName);
  return fileName;
}

async function exportExcelWorkbook(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WPL Operations Admin Desk';
  workbook.created = new Date();

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  const accentFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  const stripeFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };

  const styleSheet = (sheet: ExcelJS.Worksheet, headers: string[], widths: number[], headerStyle = headerFill) => {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
    const row1 = sheet.getRow(1);
    row1.height = 24;
    row1.eachCell((cell) => {
      cell.fill = headerStyle;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    widths.forEach((w, idx) => {
      sheet.getColumn(idx + 1).width = w;
    });
    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.height = 20;
        if (rowNum % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = stripeFill;
          });
        }
        row.eachCell((cell) => {
          cell.font = { size: 10, color: { argb: 'FF0F172A' } };
          cell.alignment = { vertical: 'middle' };
        });
      }
    });
  };

  // Sheet 1: Roster & Bio
  const flatRows = buildFlatRows(records);
  const rosterHeaders = flatRows.length > 0 ? Object.keys(flatRows[0]) : ['Player Name', 'Team', 'Role'];
  const rosterSheet = workbook.addWorksheet('Roster & Headline Stats');
  rosterSheet.addRow(rosterHeaders);
  flatRows.forEach((r) => rosterSheet.addRow(rosterHeaders.map((h) => (r as Record<string, unknown>)[h])));
  styleSheet(
    rosterSheet,
    rosterHeaders,
    rosterHeaders.map((h) => (h.includes('Name') || h.includes('Franchise') || h.includes('Style') ? 22 : h === '#' ? 6 : 14))
  );

  // Sheet 2: Batting Career (All Formats)
  const batHeaders = ['Player Name', 'Team', 'Role', 'Format', 'Matches', 'Innings', 'Not Out', 'Runs', 'HS', 'Avg', 'Balls Faced', 'Strike Rate', '100s', '50s', '4s', '6s'];
  const batSheet = workbook.addWorksheet('Batting Career (All Formats)');
  batSheet.addRow(batHeaders);
  records.forEach((r) => {
    WPL_FORMATS_ORDER.forEach((fmt) => {
      const b = r.battingByFormat[fmt];
      if (!b) return;
      batSheet.addRow([
        r.name, r.teamShort, r.role, fmt,
        b.matches, b.innings, b.notOut, b.runs, b.hs, b.avg, b.balls, b.sr, b.hundreds, b.fifties, b.fours, b.sixes,
      ]);
    });
  });
  styleSheet(batSheet, batHeaders, [22, 10, 14, 10, 10, 10, 10, 10, 10, 10, 12, 12, 8, 8, 8, 8], accentFill);

  // Sheet 3: Bowling Career (All Formats)
  const bowlHeaders = ['Player Name', 'Team', 'Role', 'Format', 'Matches', 'Innings', 'Balls Bowled', 'Runs Conceded', 'Wickets', 'BBI', 'Economy', 'Avg', 'Strike Rate', '5W'];
  const bowlSheet = workbook.addWorksheet('Bowling Career (All Formats)');
  bowlSheet.addRow(bowlHeaders);
  records.forEach((r) => {
    WPL_FORMATS_ORDER.forEach((fmt) => {
      const b = r.bowlingByFormat[fmt];
      if (!b) return;
      bowlSheet.addRow([
        r.name, r.teamShort, r.role, fmt,
        b.matches, b.innings, b.balls, b.runsConceded, b.wickets, b.bbi, b.econ, b.avg, b.sr, b.fiveWickets,
      ]);
    });
  });
  styleSheet(bowlSheet, bowlHeaders, [22, 10, 14, 10, 10, 10, 12, 14, 10, 12, 10, 10, 12, 8]);

  // Sheet 4: Team & Filter Summary
  const summarySheet = workbook.addWorksheet('Team & Role Summary');
  const sumHeaders = ['Team Short', 'Franchise Name', 'Total Players', 'Batters', 'All-rounders', 'Bowlers', 'Wicket-keepers', 'India', 'Overseas', 'Captains', 'With Stats', 'Known Purse (Lakhs)'];
  summarySheet.addRow(sumHeaders);
  summary.byTeam.forEach((t) => {
    summarySheet.addRow([
      t.teamShort, t.teamName, t.total, t.batters, t.allRounders, t.bowlers, t.wicketKeepers,
      t.india, t.overseas, t.captains, t.withStats, t.totalPurseLakhs,
    ]);
  });
  summarySheet.addRow([]);
  summarySheet.addRow(['Filter Scope', scopeLabel, 'Exported At', new Date().toISOString()]);
  styleSheet(summarySheet, sumHeaders, [12, 28, 13, 10, 13, 10, 15, 10, 10, 10, 12, 18], accentFill);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${scopeSlug}_${dateStamp}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerFileDownload(blob, fileName);
  return fileName;
}

function exportPdfReport(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  filters: WplExportFilterOptions,
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): string {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Slate-indigo header banner with emerald rule (no pink anywhere)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 28, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('WPL SQUAD, BIO & PERFORMANCE EXPORT', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Scope: ${scopeLabel}  |  Format Focus: ${filters.formatFocus === 'BEST_T20' ? 'WPL -> T20 Best' : filters.formatFocus}`, 14, 19);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24.5);

  // KPI summary bar
  const kpiItems = [
    { label: 'PLAYERS', val: String(summary.totalPlayers) },
    { label: 'TEAMS', val: String(summary.teamCount) },
    { label: 'BATTERS', val: String(summary.byRole.Batter) },
    { label: 'ALL-ROUNDERS', val: String(summary.byRole['All-rounder']) },
    { label: 'BOWLERS', val: String(summary.byRole.Bowler) },
    { label: 'WK', val: String(summary.byRole['Wicket-keeper']) },
    { label: 'INDIA / OS', val: `${summary.indiaCount} / ${summary.overseasCount}` },
    { label: 'WITH STATS', val: `${summary.withStatsCount}/${summary.totalPlayers}` },
  ];

  const boxWidth = 32.5;
  kpiItems.forEach((kpi, i) => {
    const x = 14 + i * (boxWidth + 1.5);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, 33, boxWidth, 13, 1.5, 1.5, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + 2.5, 37.5);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(kpi.val, x + 2.5, 43.2);
  });

  // Main Roster + Bio + Headline Stats table
  autoTable(doc, {
    startY: 50,
    head: [[
      '#', 'Player', 'Team', 'Role', 'Country', 'DOB / Age', 'Bat / Bowl Style', 'Status', 'Fee',
      'Fmt', 'Mat', 'Runs', 'HS', 'Avg', 'SR', 'Wkts', 'Econ', 'BBI'
    ]],
    body: records.map((r, i) => [
      String(i + 1),
      r.isCaptain ? `${r.name} (C)` : r.name,
      r.teamShort,
      r.role,
      r.nationality,
      r.dateOfBirth !== '—' ? `${r.dateOfBirth} (${r.age})` : r.age,
      `${r.battingStyle.replace(' bat', '')} / ${r.bowlingStyle}`,
      r.squadStatus.replace(' Squad', ''),
      r.auctionFee,
      r.headlineBatting || r.headlineBowling ? r.headlineFormatUsed : '—',
      r.headlineBatting?.matches || r.headlineBowling?.matches || '—',
      r.headlineBatting?.runs || '—',
      r.headlineBatting?.hs || '—',
      r.headlineBatting?.avg || '—',
      r.headlineBatting?.sr || '—',
      r.headlineBowling?.wickets || '—',
      r.headlineBowling?.econ || '—',
      r.headlineBowling?.bbi || '—',
    ]),
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [15, 23, 42] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 31, fontStyle: 'bold' },
      2: { cellWidth: 13 },
      3: { cellWidth: 20 },
      4: { cellWidth: 17 },
      5: { cellWidth: 22 },
      6: { cellWidth: 37 },
      7: { cellWidth: 15 },
      8: { cellWidth: 17 },
      9: { cellWidth: 10, halign: 'center' },
      10: { cellWidth: 9, halign: 'right' },
      11: { cellWidth: 11, halign: 'right' },
      12: { cellWidth: 10, halign: 'right' },
      13: { cellWidth: 11, halign: 'right' },
      14: { cellWidth: 11, halign: 'right' },
      15: { cellWidth: 10, halign: 'right' },
      16: { cellWidth: 11, halign: 'right' },
      17: { cellWidth: 11, halign: 'right' },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`WPL Operations Admin Export • ${records.length} Players`, 14, 203);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 265, 203);
    },
  });

  // Page 2+: Multi-format stats annex when players have career rows
  const multiFormatRows: string[][] = [];
  records.forEach((r) => {
    WPL_FORMATS_ORDER.forEach((fmt) => {
      const bat = r.battingByFormat[fmt];
      const bowl = r.bowlingByFormat[fmt];
      if (!bat && !bowl) return;
      multiFormatRows.push([
        r.name,
        r.teamShort,
        fmt,
        bat?.matches || bowl?.matches || '—',
        bat?.runs || '—',
        bat?.hs || '—',
        bat?.avg || '—',
        bat?.sr || '—',
        bat ? `${bat.fifties}/${bat.hundreds}` : '—',
        bowl?.wickets || '—',
        bowl?.bbi || '—',
        bowl?.econ || '—',
        bowl?.avg || '—',
      ]);
    });
  });

  if (multiFormatRows.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MULTI-FORMAT CAREER STATISTICS ANNEX (WPL • T20 • ODI • TEST)', 14, 10.5);

    autoTable(doc, {
      startY: 22,
      head: [['Player', 'Team', 'Format', 'Mat', 'Runs', 'HS', 'Bat Avg', 'Bat SR', '50s/100s', 'Wkts', 'BBI', 'Econ', 'Bowl Avg']],
      body: multiFormatRows,
      styles: { fontSize: 7.2, cellPadding: 1.8, textColor: [15, 23, 42] },
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const fileName = `${scopeSlug}_${dateStamp}.pdf`;
  doc.save(fileName);
  return fileName;
}

function exportJsonDatabase(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  filters: WplExportFilterOptions,
  teams: WplTeamRef[],
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): string {
  const battingRows = records.flatMap((r) =>
    WPL_FORMATS_ORDER.filter((fmt) => r.battingByFormat[fmt]).map((fmt) => ({
      playerId: r.id,
      playerName: r.name,
      teamId: r.teamId,
      teamShort: r.teamShort,
      ...r.battingByFormat[fmt]!,
    }))
  );

  const bowlingRows = records.flatMap((r) =>
    WPL_FORMATS_ORDER.filter((fmt) => r.bowlingByFormat[fmt]).map((fmt) => ({
      playerId: r.id,
      playerName: r.name,
      teamId: r.teamId,
      teamShort: r.teamShort,
      ...r.bowlingByFormat[fmt]!,
    }))
  );

  const payload = {
    schemaVersion: 'wpl-players-db-v2',
    exportedAt: new Date().toISOString(),
    league: 'WPL',
    filterScope: scopeLabel,
    filters,
    summary,
    tables: {
      teams: teams.filter((t) => summary.byTeam.some((active) => active.teamId === t.id)),
      players: records.map((r) => ({
        id: r.id,
        name: r.name,
        teamId: r.teamId,
        teamShort: r.teamShort,
        teamName: r.teamName,
        role: r.role,
        rawRole: r.rawRole,
        allrounderType: r.allrounderType,
        isCaptain: r.isCaptain,
        nationality: r.nationality,
        isOverseas: r.isOverseas,
        age: r.age,
        dateOfBirth: r.dateOfBirth,
        battingStyle: r.battingStyle,
        bowlingStyle: r.bowlingStyle,
        jerseyNumber: r.jerseyNumber,
        squadStatus: r.squadStatus,
        auctionFee: r.auctionFee,
        auctionFeeLakhs: r.auctionFeeLakhs,
        cricbuzzUrl: r.cricbuzzUrl,
        formatsAvailable: r.formatsAvailable,
      })),
      player_batting_stats: battingRows,
      player_bowling_stats: bowlingRows,
    },
  };

  const fileName = `${scopeSlug}_database_${dateStamp}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  triggerFileDownload(blob, fileName);
  return fileName;
}

function exportSqlDatabase(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  teams: WplTeamRef[],
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): string {
  const lines: string[] = [
    '-- WPL Players, Profile Details & Career Stats Relational Database Dump',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Filter Scope: ${scopeLabel}`,
    `-- Matched Players: ${records.length}`,
    '',
    'BEGIN TRANSACTION;',
    '',
    'DROP TABLE IF EXISTS wpl_player_bowling_stats;',
    'DROP TABLE IF EXISTS wpl_player_batting_stats;',
    'DROP TABLE IF EXISTS wpl_players;',
    'DROP TABLE IF EXISTS wpl_teams;',
    '',
    'CREATE TABLE wpl_teams (',
    '  id VARCHAR(32) PRIMARY KEY,',
    '  short_code VARCHAR(16) NOT NULL,',
    '  name VARCHAR(128) NOT NULL,',
    '  slug VARCHAR(32)',
    ');',
    '',
    'CREATE TABLE wpl_players (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  team_id VARCHAR(32) NOT NULL,',
    '  team_short VARCHAR(16) NOT NULL,',
    '  name VARCHAR(128) NOT NULL,',
    '  role VARCHAR(32) NOT NULL,',
    '  allrounder_type VARCHAR(64),',
    '  is_captain INTEGER DEFAULT 0,',
    '  nationality VARCHAR(64),',
    '  is_overseas INTEGER DEFAULT 0,',
    '  age VARCHAR(16),',
    '  date_of_birth VARCHAR(32),',
    '  batting_style VARCHAR(64),',
    '  bowling_style VARCHAR(64),',
    '  jersey_number VARCHAR(16),',
    '  squad_status VARCHAR(32),',
    '  auction_fee VARCHAR(32),',
    '  auction_fee_lakhs INTEGER DEFAULT 0,',
    '  FOREIGN KEY (team_id) REFERENCES wpl_teams(id)',
    ');',
    '',
    'CREATE TABLE wpl_player_batting_stats (',
    '  player_id VARCHAR(64) NOT NULL,',
    '  format VARCHAR(16) NOT NULL,',
    '  matches VARCHAR(16),',
    '  innings VARCHAR(16),',
    '  not_out VARCHAR(16),',
    '  runs VARCHAR(16),',
    '  high_score VARCHAR(16),',
    '  average VARCHAR(16),',
    '  balls_faced VARCHAR(16),',
    '  strike_rate VARCHAR(16),',
    '  hundreds VARCHAR(16),',
    '  fifties VARCHAR(16),',
    '  fours VARCHAR(16),',
    '  sixes VARCHAR(16),',
    '  PRIMARY KEY (player_id, format),',
    '  FOREIGN KEY (player_id) REFERENCES wpl_players(id)',
    ');',
    '',
    'CREATE TABLE wpl_player_bowling_stats (',
    '  player_id VARCHAR(64) NOT NULL,',
    '  format VARCHAR(16) NOT NULL,',
    '  matches VARCHAR(16),',
    '  innings VARCHAR(16),',
    '  balls VARCHAR(16),',
    '  runs_conceded VARCHAR(16),',
    '  wickets VARCHAR(16),',
    '  bbi VARCHAR(16),',
    '  economy VARCHAR(16),',
    '  average VARCHAR(16),',
    '  strike_rate VARCHAR(16),',
    '  five_wickets VARCHAR(16),',
    '  PRIMARY KEY (player_id, format),',
    '  FOREIGN KEY (player_id) REFERENCES wpl_players(id)',
    ');',
    '',
  ];

  const activeTeams = teams.filter((t) => summary.byTeam.some((s) => s.teamId === t.id));
  activeTeams.forEach((t) => {
    lines.push(
      `INSERT INTO wpl_teams (id, short_code, name, slug) VALUES (${escapeSql(t.id)}, ${escapeSql(t.short)}, ${escapeSql(t.name)}, ${escapeSql(t.slug || t.short.toLowerCase())});`
    );
  });

  lines.push('');
  records.forEach((r) => {
    lines.push(
      `INSERT INTO wpl_players (id, team_id, team_short, name, role, allrounder_type, is_captain, nationality, is_overseas, age, date_of_birth, batting_style, bowling_style, jersey_number, squad_status, auction_fee, auction_fee_lakhs) VALUES (${escapeSql(r.id)}, ${escapeSql(r.teamId)}, ${escapeSql(r.teamShort)}, ${escapeSql(r.name)}, ${escapeSql(r.role)}, ${escapeSql(r.allrounderType)}, ${escapeSql(r.isCaptain)}, ${escapeSql(r.nationality)}, ${escapeSql(r.isOverseas)}, ${escapeSql(r.age)}, ${escapeSql(r.dateOfBirth)}, ${escapeSql(r.battingStyle)}, ${escapeSql(r.bowlingStyle)}, ${escapeSql(r.jerseyNumber)}, ${escapeSql(r.squadStatus)}, ${escapeSql(r.auctionFee)}, ${escapeSql(r.auctionFeeLakhs)});`
    );
  });

  lines.push('');
  records.forEach((r) => {
    WPL_FORMATS_ORDER.forEach((fmt) => {
      const bat = r.battingByFormat[fmt];
      if (bat) {
        lines.push(
          `INSERT INTO wpl_player_batting_stats (player_id, format, matches, innings, not_out, runs, high_score, average, balls_faced, strike_rate, hundreds, fifties, fours, sixes) VALUES (${escapeSql(r.id)}, ${escapeSql(fmt)}, ${escapeSql(bat.matches)}, ${escapeSql(bat.innings)}, ${escapeSql(bat.notOut)}, ${escapeSql(bat.runs)}, ${escapeSql(bat.hs)}, ${escapeSql(bat.avg)}, ${escapeSql(bat.balls)}, ${escapeSql(bat.sr)}, ${escapeSql(bat.hundreds)}, ${escapeSql(bat.fifties)}, ${escapeSql(bat.fours)}, ${escapeSql(bat.sixes)});`
        );
      }
      const bowl = r.bowlingByFormat[fmt];
      if (bowl) {
        lines.push(
          `INSERT INTO wpl_player_bowling_stats (player_id, format, matches, innings, balls, runs_conceded, wickets, bbi, economy, average, strike_rate, five_wickets) VALUES (${escapeSql(r.id)}, ${escapeSql(fmt)}, ${escapeSql(bowl.matches)}, ${escapeSql(bowl.innings)}, ${escapeSql(bowl.balls)}, ${escapeSql(bowl.runsConceded)}, ${escapeSql(bowl.wickets)}, ${escapeSql(bowl.bbi)}, ${escapeSql(bowl.econ)}, ${escapeSql(bowl.avg)}, ${escapeSql(bowl.sr)}, ${escapeSql(bowl.fiveWickets)});`
        );
      }
    });
  });

  lines.push('', 'COMMIT;', '');
  const fileName = `${scopeSlug}_database_${dateStamp}.sql`;
  const blob = new Blob([lines.join('\n')], { type: 'application/sql;charset=utf-8;' });
  triggerFileDownload(blob, fileName);
  return fileName;
}

function exportMarkdownDossier(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): string {
  const lines: string[] = [
    `# WPL Players, Profiles & Career Stats Report`,
    '',
    `- **Scope:** ${scopeLabel}`,
    `- **Generated:** ${new Date().toISOString()}`,
    `- **Total Players:** ${summary.totalPlayers} across ${summary.teamCount} franchise(s)`,
    `- **Breakdown:** ${summary.byRole.Batter} Batters | ${summary.byRole['All-rounder']} All-rounders | ${summary.byRole.Bowler} Bowlers | ${summary.byRole['Wicket-keeper']} Wicket-keepers`,
    `- **Squad Split:** ${summary.indiaCount} India | ${summary.overseasCount} Overseas | ${summary.withStatsCount} With Stats`,
    '',
    '| # | Player | Team | Role | Nationality | Bat / Bowl Style | Fee | Fmt | Mat | Runs | HS | SR | Wkts | Econ |',
    '|---|--------|------|------|-------------|------------------|-----|-----|-----|------|----|----|------|------|',
  ];

  records.forEach((r, idx) => {
    const captainBadge = r.isCaptain ? ' (C)' : '';
    const bat = r.headlineBatting;
    const bowl = r.headlineBowling;
    lines.push(
      `| ${idx + 1} | ${r.name}${captainBadge} | ${r.teamShort} | ${r.role} | ${r.nationality} | ${r.battingStyle} / ${r.bowlingStyle} | ${r.auctionFee} | ${bat || bowl ? r.headlineFormatUsed : '—'} | ${bat?.matches || bowl?.matches || '—'} | ${bat?.runs || '—'} | ${bat?.hs || '—'} | ${bat?.sr || '—'} | ${bowl?.wickets || '—'} | ${bowl?.econ || '—'} |`
    );
  });

  const fileName = `${scopeSlug}_dossier_${dateStamp}.md`;
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
  triggerFileDownload(blob, fileName);
  return fileName;
}

export async function runWplPlayerExport(params: {
  format: WplExportFormatId;
  players: WplExportPlayerInput[];
  filters: WplExportFilterOptions;
  teams?: WplTeamRef[];
}): Promise<WplExportResult> {
  const teams = params.teams || WPL_CANONICAL_TEAMS;
  const records = filterAndNormalizeWplPlayers(params.players, params.filters, teams);
  const summary = summarizeWplExportRecords(records, teams);
  const { scopeSlug, scopeLabel } = describeFilterScope(params.filters, teams);
  const dateStamp = new Date().toISOString().split('T')[0];

  let fileName = '';
  switch (params.format) {
    case 'pdf':
      fileName = exportPdfReport(records, summary, params.filters, scopeSlug, scopeLabel, dateStamp);
      break;
    case 'excel':
      fileName = await exportExcelWorkbook(records, summary, scopeSlug, scopeLabel, dateStamp);
      break;
    case 'csv':
      fileName = exportDelimited(records, scopeSlug, dateStamp, ',', 'csv', 'text/csv');
      break;
    case 'tsv':
      fileName = exportDelimited(records, scopeSlug, dateStamp, '\t', 'tsv', 'text/tab-separated-values');
      break;
    case 'json':
      fileName = exportJsonDatabase(records, summary, params.filters, teams, scopeSlug, scopeLabel, dateStamp);
      break;
    case 'sql':
      fileName = exportSqlDatabase(records, summary, teams, scopeSlug, scopeLabel, dateStamp);
      break;
    case 'markdown':
      fileName = exportMarkdownDossier(records, summary, scopeSlug, scopeLabel, dateStamp);
      break;
  }

  return {
    format: params.format,
    fileName,
    playerCount: records.length,
    exportedAt: new Date().toISOString(),
  };
}
