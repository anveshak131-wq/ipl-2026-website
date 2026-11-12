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

export function formatIndianDate(raw?: string): string {
  if (!raw) return '—';
  const s = String(raw).trim();
  if (!s || s === '—' || s === '-' || s.toUpperCase() === 'N/A') return '—';

  // Already DD/MM/YYYY or D/M/YYYY
  const dmySlash = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmySlash) {
    const day = Number(dmySlash[1]);
    const month = Number(dmySlash[2]);
    const year = Number(dmySlash[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }

  // ISO YYYY-MM-DD or YYYY/MM/DD (with optional time suffix)
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = String(Number(ymdMatch[2])).padStart(2, '0');
    const day = String(Number(ymdMatch[3])).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Natural date strings e.g. "Apr 26, 1999" or "26 April 1999"
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return s;
}

function formatIndianTimestamp(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = String(hours24 % 12 || 12).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours12}:${minutes} ${period}`;
}

function formatPurseInr(lakhs: number): string {
  if (!lakhs || lakhs <= 0) return '-';
  if (lakhs >= 100) return `INR ${(lakhs / 100).toFixed(2)} Cr`;
  return `INR ${lakhs} L`;
}

function pdfSafe(value: unknown): string {
  return String(value ?? '-')
    .replace(/₹\s*/g, 'INR ')
    .replace(/[—–]/g, '-')
    .replace(/•/g, '|')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\xA9]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim() || '-';
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

export function normalizeWplSquadStatus(rawStatus?: string): string {
  const status = String(rawStatus || '').toLowerCase().trim();
  if (!status || status === 'active' || status === 'active squad' || status === 'available') {
    return 'Active Squad';
  }
  if (status.includes('injur')) return 'Injured';
  if (status.includes('reserve') || status.includes('bench') || status.includes('standby')) return 'Reserve';
  if (status.includes('unavail') || status.includes('ruled out') || status.includes('withdrawn')) return 'Unavailable';
  return String(rawStatus).trim();
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
    dateOfBirth: formatIndianDate(cleanStr(player.dateOfBirth)),
    battingStyle: cleanStr(player.battingStyle),
    bowlingStyle: cleanStr(player.bowlingStyle),
    jerseyNumber: cleanStr(player.jerseyNumber, 'N/A'),
    squadStatus: normalizeWplSquadStatus(player.squadStatus),
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
      'Date of Birth (DD/MM/YYYY)': r.dateOfBirth,
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
  summarySheet.addRow(['Filter Scope', scopeLabel, 'Exported At (IST)', formatIndianTimestamp(new Date())]);
  summarySheet.addRow(['DOB Format', 'DD/MM/YYYY', 'Copyright', WPL_COPYRIGHT_NOTICE]);
  styleSheet(summarySheet, sumHeaders, [12, 28, 13, 10, 13, 10, 15, 10, 10, 10, 12, 18], accentFill);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${scopeSlug}_${dateStamp}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerFileDownload(blob, fileName);
  return fileName;
}

const WPL_COPYRIGHT_NOTICE =
  '© 2026-2027 SportsUP18 · WPL Operations & Analytics Desk. All Rights Reserved.';

const TEAM_PDF_PALETTES: Record<
  string,
  {
    primary: [number, number, number];
    tableHead: [number, number, number];
    accent: [number, number, number];
    softTint: [number, number, number];
  }
> = {
  '14': {
    primary: [153, 27, 27],     // RCB-W Deep Crimson
    tableHead: [127, 29, 29],
    accent: [245, 158, 11],     // Championship Gold
    softTint: [254, 242, 242],
  },
  '13': {
    primary: [23, 37, 84],      // MI-W Royal Navy
    tableHead: [30, 58, 138],
    accent: [251, 191, 36],     // Gold Accent
    softTint: [239, 246, 255],
  },
  '11': {
    primary: [29, 78, 216],     // DC-W Electric Blue
    tableHead: [30, 64, 175],
    accent: [220, 38, 38],      // Crimson Slash
    softTint: [239, 246, 255],
  },
  '12': {
    primary: [180, 83, 9],      // GG Vibrant Tangerine Amber
    tableHead: [146, 64, 14],
    accent: [250, 204, 21],     // Bright Gold
    softTint: [255, 251, 235],
  },
  '15': {
    primary: [55, 48, 163],     // UPW Royal Indigo
    tableHead: [49, 46, 129],
    accent: [245, 158, 11],     // Gold Trim
    softTint: [238, 242, 255],
  },
};

function getTeamPdfPalette(teamId: string) {
  return (
    TEAM_PDF_PALETTES[teamId] || {
      primary: [15, 23, 42] as [number, number, number],
      tableHead: [30, 41, 59] as [number, number, number],
      accent: [16, 185, 129] as [number, number, number],
      softTint: [241, 245, 249] as [number, number, number],
    }
  );
}

interface CachedPoppinsFonts {
  regular: string;
  semiBold: string;
  bold: string;
}

let cachedPoppinsPromise: Promise<CachedPoppinsFonts | null> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x4000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

async function loadPoppinsFonts(): Promise<CachedPoppinsFonts | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  if (!cachedPoppinsPromise) {
    cachedPoppinsPromise = (async () => {
      try {
        const [regRes, semiRes, boldRes] = await Promise.all([
          fetch('/fonts/pdf/Poppins-Regular.ttf'),
          fetch('/fonts/pdf/Poppins-SemiBold.ttf'),
          fetch('/fonts/pdf/Poppins-Bold.ttf'),
        ]);
        if (!regRes.ok || !boldRes.ok) return null;
        const [regBuf, boldBuf, semiBuf] = await Promise.all([
          regRes.arrayBuffer(),
          boldRes.arrayBuffer(),
          semiRes.ok ? semiRes.arrayBuffer() : boldRes.arrayBuffer(),
        ]);
        return {
          regular: arrayBufferToBase64(regBuf),
          semiBold: arrayBufferToBase64(semiBuf),
          bold: arrayBufferToBase64(boldBuf),
        };
      } catch {
        return null;
      }
    })();
  }
  return cachedPoppinsPromise;
}

async function registerPdfFontFamily(doc: jsPDF): Promise<{ bodyFont: string; displayFont: string }> {
  const fonts = await loadPoppinsFonts();
  if (!fonts) {
    return { bodyFont: 'helvetica', displayFont: 'times' };
  }
  try {
    doc.addFileToVFS('Poppins-Regular.ttf', fonts.regular);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    doc.addFileToVFS('Poppins-Bold.ttf', fonts.bold);
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
    doc.addFileToVFS('Poppins-SemiBold.ttf', fonts.semiBold);
    doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'italic');
    return { bodyFont: 'Poppins', displayFont: 'Poppins' };
  } catch {
    return { bodyFont: 'helvetica', displayFont: 'times' };
  }
}

function drawPdfPageCanvasBackground(doc: jsPDF, fontFamily: string) {
  // Rich tinted folio background (#EEF2F7 soft glacial slate)
  doc.setFillColor(238, 242, 247);
  doc.rect(0, 0, 297, 210, 'F');

  // Subtle decorative top-right stepped diagonal accents
  doc.setFillColor(226, 232, 240);
  doc.triangle(242, 0, 297, 0, 297, 52, 'F');
  doc.setFillColor(219, 234, 254);
  doc.triangle(264, 0, 297, 0, 297, 32, 'F');

  // Elevated folio content frame outline (#FFFFFF rounded sheet shadow edge + border)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(9.5, 13, 281, 182.5, 2, 2, 'FD');

  // Architectural deep midnight obsidian binding spine on far left
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, 5.2, 210, 'F');

  // Dual emerald & gold vertical spine highlight strips
  doc.setFillColor(16, 185, 129);
  doc.rect(5.2, 0, 1.1, 140, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(5.2, 140, 1.1, 70, 'F');

  // Soft watermark behind sheet area (low-contrast pale slate)
  doc.setTextColor(236, 241, 247);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(34);
  doc.text('SPORTSUP18  |  WPL', 150, 116, { align: 'center', angle: 24 });
}

function installPdfPageBackgroundHook(doc: jsPDF, fontFamily: string) {
  drawPdfPageCanvasBackground(doc, fontFamily);
  const originalAddPage = doc.addPage.bind(doc);
  (doc as unknown as { addPage: (...args: any[]) => jsPDF }).addPage = (...args: any[]) => {
    const result = originalAddPage(...args);
    drawPdfPageCanvasBackground(doc, fontFamily);
    return result;
  };
}

function getLastAutoTableY(doc: jsPDF, fallbackY: number): number {
  const y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof y === 'number' && Number.isFinite(y) ? y : fallbackY;
}

function drawPdfSectionHeading(
  doc: jsPDF,
  y: number,
  indexNum: string,
  title: string,
  subtitle: string,
  fontFamily: string
): number {
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, y, 271, 9.2, 1.4, 1.4, 'FD');

  // Emerald index badge pill
  doc.setFillColor(6, 95, 70);
  doc.roundedRect(15.5, y + 1.4, 8.5, 6.4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.text(indexNum, 19.75, y + 5.9, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8.8);
  doc.text(pdfSafe(title), 26.5, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.2);
  doc.text(pdfSafe(subtitle), 282, y + 5.9, { align: 'right' });

  return y + 11.8;
}

function stampPdfRunningHeadersAndFooters(
  doc: jsPDF,
  scopeLabel: string,
  generatedAtStr: string,
  totalPlayers: number,
  fontFamily: string
) {
  const totalPages = doc.getNumberOfPages();
  const shortScope = pdfSafe(scopeLabel).slice(0, 52);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Slim running header on continuation pages (covers top strip cleanly)
    if (pageNum > 1) {
      doc.setFillColor(11, 17, 32);
      doc.rect(6.3, 0, 290.7, 11.2, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(6.3, 11.2, 220, 0.8, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(226.3, 11.2, 70.7, 0.8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8.2);
      doc.text('SPORTSUP18  |  WPL SQUAD ROSTERS, BIOS & PERFORMANCE DOSSIER', 14, 7.2);

      doc.setTextColor(203, 213, 225);
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(6.9);
      doc.text(pdfSafe(`Scope: ${shortScope}  |  DOB: DD/MM/YYYY  |  ${generatedAtStr}`), 285, 7.2, {
        align: 'right',
      });
    }

    // Crisp copyright & page footer tray on every page
    doc.setFillColor(226, 232, 240);
    doc.rect(6.3, 197.2, 290.7, 12.8, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.35);
    doc.line(6.3, 197.2, 297, 197.2);

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(6.9);
    doc.setTextColor(15, 23, 42);
    doc.text(pdfSafe(WPL_COPYRIGHT_NOTICE), 14, 203.8);

    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(pdfSafe(`DOB Format: DD/MM/YYYY  |  ${totalPlayers} Matched Records`), 173, 203.8, {
      align: 'center',
    });

    // Dark pill page counter badge
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(256, 199.5, 29, 6.4, 1.2, 1.2, 'F');
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Page ${pageNum} of ${totalPages}`, 270.5, 203.7, { align: 'center' });
  }
}

function groupRecordsByTeam(records: NormalizedWplExportRecord[], teams: WplTeamRef[]) {
  const buckets = new Map<string, NormalizedWplExportRecord[]>();
  teams.forEach((t) => buckets.set(t.id, []));

  for (const r of records) {
    if (!buckets.has(r.teamId)) buckets.set(r.teamId, []);
    buckets.get(r.teamId)!.push(r);
  }

  return Array.from(buckets.entries())
    .filter(([, list]) => list.length > 0)
    .map(([teamId, list]) => {
      const teamMeta = teams.find((t) => t.id === teamId) || {
        id: teamId,
        short: list[0].teamShort,
        name: list[0].teamName,
      };
      return { team: teamMeta, players: list };
    });
}

function findScopeLeaders(records: NormalizedWplExportRecord[]) {
  let topBatter: NormalizedWplExportRecord | null = null;
  let topRuns = 0;
  let topBowler: NormalizedWplExportRecord | null = null;
  let topWkts = 0;
  let topSigning: NormalizedWplExportRecord | null = null;
  let topFee = 0;

  for (const r of records) {
    const runs = toNumber(r.headlineBatting?.runs || '0');
    if (runs > topRuns) {
      topRuns = runs;
      topBatter = r;
    }
    const wkts = toNumber(r.headlineBowling?.wickets || '0');
    if (wkts > topWkts) {
      topWkts = wkts;
      topBowler = r;
    }
    if (r.auctionFeeLakhs > topFee) {
      topFee = r.auctionFeeLakhs;
      topSigning = r;
    }
  }

  return { topBatter, topRuns, topBowler, topWkts, topSigning };
}

async function exportPdfReport(
  records: NormalizedWplExportRecord[],
  summary: WplExportSummary,
  filters: WplExportFilterOptions,
  teams: WplTeamRef[],
  scopeSlug: string,
  scopeLabel: string,
  dateStamp: string
): Promise<string> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { bodyFont, displayFont } = await registerPdfFontFamily(doc);
  installPdfPageBackgroundHook(doc, bodyFont);

  const generatedAtStr = formatIndianTimestamp(new Date());
  const formatFocusLabel =
    filters.formatFocus === 'BEST_T20' ? 'Smart Best (WPL -> T20)' : filters.formatFocus;

  doc.setProperties({
    title: 'SportsUP18 WPL Squad, Profile & Performance Dossier',
    subject: pdfSafe(`Scope: ${scopeLabel}`),
    author: 'SportsUP18 WPL Operations & Analytics Desk',
    creator: 'SportsUP18 Admin Export Studio',
    keywords: 'WPL, Cricket, Squad Roster, Player Bio, Career Stats, SportsUP18',
  });

  // ── Page 1 Layered Midnight-Emerald Hero Masthead ───────────────────────────
  doc.setFillColor(11, 17, 32);
  doc.rect(6.3, 0, 290.7, 32.5, 'F');
  doc.setFillColor(17, 24, 39);
  doc.triangle(195, 0, 297, 0, 297, 32.5, 'F');

  // Dual emerald & gold horizon accent rule
  doc.setFillColor(16, 185, 129);
  doc.rect(6.3, 32.5, 200, 1.4, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(206.3, 32.5, 90.7, 1.4, 'F');

  // Brand Tag Pill
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(14, 5.2, 34, 5.6, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(displayFont, 'bold');
  doc.setFontSize(7);
  doc.text('SPORTSUP18 OPS', 31, 9.1, { align: 'center' });

  doc.setTextColor(245, 158, 11);
  doc.setFont(bodyFont, 'bold');
  doc.setFontSize(7.1);
  doc.text('WOMEN\'S PREMIER LEAGUE  |  OFFICIAL ADMIN & SCOUTING DOSSIER', 51, 9.1);

  doc.setTextColor(255, 255, 255);
  doc.setFont(displayFont, 'bold');
  doc.setFontSize(15.2);
  doc.text('WPL SQUAD ROSTERS, PROFILES & CAREER STATISTICS', 14, 18.2);

  doc.setTextColor(203, 213, 225);
  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(7.8);
  doc.text(
    pdfSafe(`Scope: ${scopeLabel}   |   Format Focus: ${formatFocusLabel}`),
    14,
    25.8
  );

  // Right frosted-slate metadata card on Page 1 masthead
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.25);
  doc.roundedRect(216, 5.5, 69, 22, 1.8, 1.8, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(216, 5.5, 1.6, 22, 'F');

  doc.setTextColor(52, 211, 153);
  doc.setFont(bodyFont, 'bold');
  doc.setFontSize(6.6);
  doc.text('EXPORT METADATA (IST)', 220.5, 10.4);
  doc.setTextColor(248, 250, 252);
  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(7);
  doc.text(pdfSafe(`Generated: ${generatedAtStr}`), 220.5, 15.6);
  doc.text('DOB Standard: DD/MM/YYYY', 220.5, 20.1);
  doc.text(pdfSafe(`Purse Covered: ${formatPurseInr(summary.totalPurseLakhs)}`), 220.5, 24.5);

  // ── Elevated Executive KPI Summary Cards ────────────────────────────────────
  const kpiCards: Array<{ label: string; value: string; sub: string; accent: [number, number, number] }> = [
    {
      label: 'MATCHED PLAYERS',
      value: String(summary.totalPlayers),
      sub: `${summary.teamCount} Franchise${summary.teamCount === 1 ? '' : 's'}`,
      accent: [16, 185, 129],
    },
    {
      label: 'ROLE COMPOSITION',
      value: `${summary.byRole.Batter}B / ${summary.byRole['All-rounder']}AR / ${summary.byRole.Bowler}BW`,
      sub: `${summary.byRole['Wicket-keeper']} Wicket-keeper${summary.byRole['Wicket-keeper'] === 1 ? '' : 's'}`,
      accent: [14, 165, 233],
    },
    {
      label: 'INDIA VS OVERSEAS',
      value: `${summary.indiaCount} IND  |  ${summary.overseasCount} OS`,
      sub: `${summary.captainsCount} Captain${summary.captainsCount === 1 ? '' : 's'} Included`,
      accent: [99, 102, 241],
    },
    {
      label: 'CAREER STATS VERIFIED',
      value: `${summary.withStatsCount} / ${summary.totalPlayers}`,
      sub: `${summary.totalPlayers > 0 ? Math.round((summary.withStatsCount / summary.totalPlayers) * 100) : 0}% Profile Coverage`,
      accent: [13, 148, 136],
    },
    {
      label: 'KNOWN CONTRACT VALUE',
      value: formatPurseInr(summary.totalPurseLakhs),
      sub: 'Aggregate Auction Value',
      accent: [217, 119, 6],
    },
  ];

  const cardGap = 3.2;
  const cardWidth = (271 - cardGap * (kpiCards.length - 1)) / kpiCards.length;
  kpiCards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    // Subtle card drop-shadow
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(x + 0.5, 37.8, cardWidth, 16.8, 1.5, 1.5, 'F');
    // Elevated crisp white KPI card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, 37.2, cardWidth, 16.8, 1.5, 1.5, 'FD');

    doc.setFillColor(card.accent[0], card.accent[1], card.accent[2]);
    doc.rect(x, 37.2, 1.6, 16.8, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFont(bodyFont, 'bold');
    doc.setFontSize(6.1);
    doc.text(card.label, x + 3.6, 41.8);

    doc.setTextColor(15, 23, 42);
    doc.setFont(displayFont, 'bold');
    doc.setFontSize(9.4);
    doc.text(pdfSafe(card.value), x + 3.6, 47.2);

    doc.setTextColor(71, 85, 105);
    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(6.4);
    doc.text(pdfSafe(card.sub), x + 3.6, 51.3);
  });

  let cursorY = 57.5;

  // ── Section 01: Franchise Distribution Matrix ───────────────────────────────
  if (summary.byTeam.length > 0) {
    cursorY = drawPdfSectionHeading(
      doc,
      cursorY,
      '01',
      'FRANCHISE DISTRIBUTION & PURSE OVERVIEW',
      `${summary.byTeam.length} Franchise(s) Breakdown`,
      bodyFont
    );

    const summaryBody = summary.byTeam.map((t) => [
      pdfSafe(t.teamShort),
      pdfSafe(t.teamName),
      String(t.total),
      String(t.batters),
      String(t.allRounders),
      String(t.bowlers),
      String(t.wicketKeepers),
      String(t.india),
      String(t.overseas),
      String(t.captains),
      `${t.withStats}/${t.total}`,
      `${t.total > 0 ? Math.round((t.withStats / t.total) * 100) : 0}%`,
      pdfSafe(formatPurseInr(t.totalPurseLakhs)),
    ]);

    if (summary.byTeam.length > 1) {
      summaryBody.push([
        'TOTAL',
        'All Filtered Franchises',
        String(summary.totalPlayers),
        String(summary.byRole.Batter),
        String(summary.byRole['All-rounder']),
        String(summary.byRole.Bowler),
        String(summary.byRole['Wicket-keeper']),
        String(summary.indiaCount),
        String(summary.overseasCount),
        String(summary.captainsCount),
        `${summary.withStatsCount}/${summary.totalPlayers}`,
        `${summary.totalPlayers > 0 ? Math.round((summary.withStatsCount / summary.totalPlayers) * 100) : 0}%`,
        pdfSafe(formatPurseInr(summary.totalPurseLakhs)),
      ]);
    }

    autoTable(doc, {
      startY: cursorY,
      rowPageBreak: 'avoid',
      margin: { left: 14, right: 12, top: 16.5, bottom: 16.5 },
      head: [[
        'Code', 'Franchise', 'Players', 'Bat', 'AR', 'Bowl', 'WK', 'IND', 'OS', 'Capt', 'Stats', 'Cov%', 'Known Purse'
      ]],
      body: summaryBody,
      styles: {
        font: bodyFont,
        fontSize: 7.2,
        cellPadding: 1.9,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.12,
      },
      headStyles: {
        font: bodyFont,
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold' },
        1: { cellWidth: 58, fontStyle: 'bold' },
        2: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' },
        8: { cellWidth: 18, halign: 'center' },
        9: { cellWidth: 17, halign: 'center' },
        10: { cellWidth: 21, halign: 'center' },
        11: { cellWidth: 19, halign: 'center' },
        12: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (summary.byTeam.length > 1 && data.section === 'body' && data.row.index === summaryBody.length - 1) {
          data.cell.styles.fillColor = [209, 250, 229];
          data.cell.styles.textColor = [6, 78, 59];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    cursorY = getLastAutoTableY(doc, cursorY) + 5.5;
  }

  // ── Scope Leaders Spotlight Strip (when multiple players matched) ───────────
  const leaders = findScopeLeaders(records);
  if (records.length > 1 && (leaders.topBatter || leaders.topBowler || leaders.topSigning) && cursorY < 164) {
    const leaderPills: Array<{ badge: string; title: string; detail: string; accent: [number, number, number] }> = [];
    if (leaders.topBatter) {
      leaderPills.push({
        badge: 'TOP RUN SCORER',
        title: `${leaders.topBatter.name} (${leaders.topBatter.teamShort})`,
        detail: `${leaders.topRuns} runs (${leaders.topBatter.headlineFormatUsed}) | SR ${leaders.topBatter.headlineBatting?.sr || '-'}`,
        accent: [16, 185, 129],
      });
    }
    if (leaders.topBowler) {
      leaderPills.push({
        badge: 'LEADING WICKET TAKER',
        title: `${leaders.topBowler.name} (${leaders.topBowler.teamShort})`,
        detail: `${leaders.topWkts} wkts (${leaders.topBowler.headlineFormatUsed}) | Econ ${leaders.topBowler.headlineBowling?.econ || '-'}`,
        accent: [14, 165, 233],
      });
    }
    if (leaders.topSigning) {
      leaderPills.push({
        badge: 'HIGHEST SIGNING',
        title: `${leaders.topSigning.name} (${leaders.topSigning.teamShort})`,
        detail: `${leaders.topSigning.auctionFee} | ${leaders.topSigning.role}`,
        accent: [217, 119, 6],
      });
    }

    if (leaderPills.length > 0) {
      const gap = 3;
      const w = (271 - gap * (leaderPills.length - 1)) / leaderPills.length;
      leaderPills.forEach((pill, i) => {
        const px = 14 + i * (w + gap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.roundedRect(px, cursorY, w, 13.2, 1.3, 1.3, 'FD');

        doc.setFillColor(pill.accent[0], pill.accent[1], pill.accent[2]);
        doc.rect(px, cursorY, w, 1.1, 'F');

        doc.setTextColor(pill.accent[0], pill.accent[1], pill.accent[2]);
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(5.9);
        doc.text(pill.badge, px + 3, cursorY + 4.3);

        doc.setTextColor(15, 23, 42);
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(7.6);
        doc.text(pdfSafe(pill.title), px + 3, cursorY + 8.3);

        doc.setTextColor(71, 85, 105);
        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(6.5);
        doc.text(pdfSafe(pill.detail), px + 3, cursorY + 11.7);
      });
      cursorY += 17.5;
    }
  }

  // ── Section 02: Team-by-Team Organized Squad & Headline Performance ──────────
  const teamGroups = groupRecordsByTeam(records, teams);
  if (cursorY > 152) {
    doc.addPage();
    cursorY = 16.5;
  }

  cursorY = drawPdfSectionHeading(
    doc,
    cursorY,
    '02',
    'TEAM-WISE ORGANIZED SQUADS, BIOS & HEADLINE STATS',
    `DOB Format: DD/MM/YYYY  |  Focus: ${formatFocusLabel}`,
    bodyFont
  );

  teamGroups.forEach((group, groupIdx) => {
    const { team, players: groupPlayers } = group;
    const palette = getTeamPdfPalette(team.id);

    // Keep each franchise header attached to its squad table
    if (cursorY > 158 || (groupIdx > 0 && cursorY > 136)) {
      doc.addPage();
      cursorY = 16.5;
    }

    const groupSummary = summarizeWplExportRecords(groupPlayers, teams).byTeam[0];

    // Team Broadcast Header Card
    doc.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.roundedRect(14, cursorY, 271, 9.8, 1.4, 1.4, 'F');
    doc.setFillColor(palette.accent[0], palette.accent[1], palette.accent[2]);
    doc.rect(14, cursorY + 8.6, 271, 1.2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont(displayFont, 'bold');
    doc.setFontSize(9.1);
    doc.text(pdfSafe(`${team.name.toUpperCase()} (${team.short})`), 18, cursorY + 6.1);

    if (groupSummary) {
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(7.1);
      doc.text(
        pdfSafe(
          `${groupSummary.total} Players  |  ${groupSummary.batters} Bat / ${groupSummary.allRounders} AR / ${groupSummary.bowlers} Bowl / ${groupSummary.wicketKeepers} WK  |  ${groupSummary.india} IND / ${groupSummary.overseas} OS  |  Purse: ${formatPurseInr(groupSummary.totalPurseLakhs)}`
        ),
        281,
        cursorY + 6.1,
        { align: 'right' }
      );
    }

    cursorY += 11;

    autoTable(doc, {
      startY: cursorY,
      rowPageBreak: 'avoid',
      margin: { left: 14, right: 12, top: 16.5, bottom: 16.5 },
      head: [[
        '#',
        'Player',
        'Role & Spec',
        'Country',
        'DOB (DD/MM/YYYY)',
        'Bat / Bowl Style',
        'Status / #',
        'Fee',
        'Fmt',
        'Mat',
        'Runs (HS)',
        'Avg / SR',
        'Wkts (BBI)',
        'Econ / Avg',
      ]],
      body: groupPlayers.map((r, idx) => {
        const nameLabel = [r.name, r.isCaptain ? '(C)' : '', r.isOverseas ? '[OS]' : '']
          .filter(Boolean)
          .join(' ');
        const roleLabel =
          r.role === 'All-rounder' && r.allrounderType !== '—' && r.allrounderType !== 'All-rounder'
            ? `${r.role}\n(${r.allrounderType.replace(' Allrounder', ' AR')})`
            : r.role;
        const dobLabel =
          r.dateOfBirth !== '—'
            ? r.age !== '—'
              ? `${r.dateOfBirth}\nAge ${r.age}`
              : r.dateOfBirth
            : r.age !== '—'
              ? `Age ${r.age}`
              : '-';
        const styleLabel = `${r.battingStyle.replace(' bat', '')} /\n${r.bowlingStyle}`;
        const statusShort = r.squadStatus.replace(' Squad', '');
        const statusJersey =
          r.jerseyNumber && r.jerseyNumber !== 'N/A' && r.jerseyNumber !== '—'
            ? `${statusShort} (#${r.jerseyNumber})`
            : statusShort;

        const matNum = toNumber(r.headlineBatting?.matches || r.headlineBowling?.matches || '0');
        const hasStats = Boolean(r.headlineBatting || r.headlineBowling);
        const matchesStr = r.headlineBatting?.matches || r.headlineBowling?.matches || '-';
        const runsHs =
          r.headlineBatting && (matNum > 0 || toNumber(r.headlineBatting.runs) > 0)
            ? `${r.headlineBatting.runs} (${r.headlineBatting.hs})`
            : '-';
        const batAvgSr =
          r.headlineBatting && (matNum > 0 || toNumber(r.headlineBatting.runs) > 0)
            ? `${r.headlineBatting.avg} / ${r.headlineBatting.sr}`
            : '-';
        const wktsBbi =
          r.headlineBowling && (matNum > 0 || toNumber(r.headlineBowling.wickets) > 0)
            ? `${r.headlineBowling.wickets} (${r.headlineBowling.bbi})`
            : '-';
        const bowlEconAvg =
          r.headlineBowling && (matNum > 0 || toNumber(r.headlineBowling.wickets) > 0)
            ? `${r.headlineBowling.econ} / ${r.headlineBowling.avg}`
            : '-';

        return [
          String(idx + 1),
          pdfSafe(nameLabel),
          pdfSafe(roleLabel),
          pdfSafe(r.nationality),
          pdfSafe(dobLabel),
          pdfSafe(styleLabel),
          pdfSafe(statusJersey),
          pdfSafe(r.auctionFee),
          hasStats ? pdfSafe(r.headlineFormatUsed) : '-',
          pdfSafe(matchesStr),
          pdfSafe(runsHs),
          pdfSafe(batAvgSr),
          pdfSafe(wktsBbi),
          pdfSafe(bowlEconAvg),
        ];
      }),
      styles: {
        font: bodyFont,
        fontSize: 6.7,
        cellPadding: 1.65,
        valign: 'middle',
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        font: bodyFont,
        fillColor: palette.tableHead,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.6,
      },
      alternateRowStyles: { fillColor: palette.softTint },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 34, fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 17 },
        4: { cellWidth: 22 },
        5: { cellWidth: 36 },
        6: { cellWidth: 17 },
        7: { cellWidth: 17 },
        8: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        9: { cellWidth: 9, halign: 'right' },
        10: { cellWidth: 21, halign: 'right' },
        11: { cellWidth: 21, halign: 'right' },
        12: { cellWidth: 19, halign: 'right' },
        13: { cellWidth: 19, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const playerRec = groupPlayers[data.row.index];
          if (playerRec?.isCaptain) {
            data.cell.styles.fillColor = [254, 249, 231];
            if (data.column.index === 1) {
              data.cell.styles.textColor = [146, 64, 14];
            }
          }
          if (data.column.index === 8 && playerRec && (playerRec.headlineBatting || playerRec.headlineBowling)) {
            const fmt = playerRec.headlineFormatUsed;
            if (fmt === 'WPL') data.cell.styles.textColor = [3, 105, 161];
            else if (fmt === 'T20') data.cell.styles.textColor = [6, 95, 70];
            else if (fmt === 'ODI') data.cell.styles.textColor = [180, 83, 9];
          }
        }
      },
    });

    cursorY = getLastAutoTableY(doc, cursorY) + 6;
  });

  // ── Section 03: Multi-Format Career Statistics Annex (Grouped by Player) ────
  const annexRows: Array<{ cells: string[]; playerParity: number; isFirstFormat: boolean }> = [];
  let playerParityIdx = 0;

  teamGroups.forEach((group) => {
    group.players.forEach((r) => {
      const playerFormats = WPL_FORMATS_ORDER.filter(
        (fmt) => r.battingByFormat[fmt] !== null || r.bowlingByFormat[fmt] !== null
      );
      if (playerFormats.length === 0) return;

      const parity = playerParityIdx % 2;
      playerParityIdx++;

      playerFormats.forEach((fmt, fmtIdx) => {
        const bat = r.battingByFormat[fmt];
        const bowl = r.bowlingByFormat[fmt];
        annexRows.push({
          playerParity: parity,
          isFirstFormat: fmtIdx === 0,
          cells: [
            pdfSafe(r.name),
            pdfSafe(r.teamShort),
            fmt,
            pdfSafe(bat?.matches || bowl?.matches || '-'),
            pdfSafe(bat?.innings || bowl?.innings || '-'),
            pdfSafe(bat?.notOut || '-'),
            pdfSafe(bat?.runs || '-'),
            pdfSafe(bat?.hs || '-'),
            pdfSafe(bat?.avg || '-'),
            pdfSafe(bat?.sr || '-'),
            bat ? pdfSafe(`${bat.fifties}/${bat.hundreds}`) : '-',
            pdfSafe(bowl?.wickets || '-'),
            pdfSafe(bowl?.bbi || '-'),
            pdfSafe(bowl?.econ || '-'),
            pdfSafe(bowl?.avg || '-'),
            pdfSafe(bowl?.fiveWickets || '-'),
          ],
        });
      });
    });
  });

  if (annexRows.length > 0) {
    doc.addPage();
    const annexStartY = drawPdfSectionHeading(
      doc,
      16.5,
      '03',
      'COMPLETE MULTI-FORMAT CAREER STATISTICS ANNEX',
      'Grouped by Player across WPL | T20 | ODI | Test',
      bodyFont
    );

    autoTable(doc, {
      startY: annexStartY,
      rowPageBreak: 'avoid',
      margin: { left: 14, right: 12, top: 16.5, bottom: 16.5 },
      head: [[
        'Player', 'Team', 'Format', 'Mat', 'Inn', 'NO', 'Runs', 'HS', 'Bat Avg', 'Bat SR', '50s/100s', 'Wkts', 'BBI', 'Econ', 'Bowl Avg', '5W'
      ]],
      body: annexRows.map((entry) => entry.cells),
      styles: {
        font: bodyFont,
        fontSize: 6.8,
        cellPadding: 1.55,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        font: bodyFont,
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.7,
      },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: 'bold' },
        1: { cellWidth: 14, fontStyle: 'bold' },
        2: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
        3: { cellWidth: 12, halign: 'right' },
        4: { cellWidth: 12, halign: 'right' },
        5: { cellWidth: 11, halign: 'right' },
        6: { cellWidth: 16, halign: 'right' },
        7: { cellWidth: 14, halign: 'right' },
        8: { cellWidth: 17, halign: 'right' },
        9: { cellWidth: 17, halign: 'right' },
        10: { cellWidth: 18, halign: 'center' },
        11: { cellWidth: 14, halign: 'right' },
        12: { cellWidth: 17, halign: 'right' },
        13: { cellWidth: 16, halign: 'right' },
        14: { cellWidth: 17, halign: 'right' },
        15: { cellWidth: 14, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const entry = annexRows[data.row.index];
          if (entry && entry.playerParity === 1) {
            data.cell.styles.fillColor = [239, 246, 255];
          } else {
            data.cell.styles.fillColor = [255, 255, 255];
          }
          if (entry && !entry.isFirstFormat && (data.column.index === 0 || data.column.index === 1)) {
            data.cell.styles.fontStyle = 'normal';
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      },
    });
  }

  stampPdfRunningHeadersAndFooters(doc, scopeLabel, generatedAtStr, records.length, bodyFont);

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
    copyright: WPL_COPYRIGHT_NOTICE,
    dateOfBirthFormat: 'DD/MM/YYYY',
    exportedAt: formatIndianTimestamp(new Date()),
    exportedAtIso: new Date().toISOString(),
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
    `# SportsUP18 · WPL Players, Profiles & Career Stats Report`,
    '',
    `- **Scope:** ${scopeLabel}`,
    `- **Generated:** ${formatIndianTimestamp(new Date())}`,
    `- **DOB Standard:** DD/MM/YYYY`,
    `- **Total Players:** ${summary.totalPlayers} across ${summary.teamCount} franchise(s)`,
    `- **Breakdown:** ${summary.byRole.Batter} Batters | ${summary.byRole['All-rounder']} All-rounders | ${summary.byRole.Bowler} Bowlers | ${summary.byRole['Wicket-keeper']} Wicket-keepers`,
    `- **Squad Split:** ${summary.indiaCount} India | ${summary.overseasCount} Overseas | ${summary.withStatsCount} With Stats`,
    '',
    '| # | Player | Team | Role | Nationality | DOB (DD/MM/YYYY) | Bat / Bowl Style | Fee | Fmt | Mat | Runs | HS | SR | Wkts | Econ |',
    '|---|--------|------|------|-------------|------------------|------------------|-----|-----|-----|------|----|----|------|------|',
  ];

  records.forEach((r, idx) => {
    const captainBadge = r.isCaptain ? ' (C)' : '';
    const bat = r.headlineBatting;
    const bowl = r.headlineBowling;
    lines.push(
      `| ${idx + 1} | ${r.name}${captainBadge} | ${r.teamShort} | ${r.role} | ${r.nationality} | ${r.dateOfBirth} | ${r.battingStyle} / ${r.bowlingStyle} | ${r.auctionFee} | ${bat || bowl ? r.headlineFormatUsed : '—'} | ${bat?.matches || bowl?.matches || '—'} | ${bat?.runs || '—'} | ${bat?.hs || '—'} | ${bat?.sr || '—'} | ${bowl?.wickets || '—'} | ${bowl?.econ || '—'} |`
    );
  });

  lines.push('', `---`, `*${WPL_COPYRIGHT_NOTICE}*`);

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
      fileName = await exportPdfReport(records, summary, params.filters, teams, scopeSlug, scopeLabel, dateStamp);
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
