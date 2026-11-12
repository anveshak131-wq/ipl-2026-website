export interface WplScorecardTeam {
  id: string | number;
  name: string;
  shortName?: string;
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface WplScorecardDismissal {
  type: string;
  bowlerId?: string;
  fielderId?: string;
  details?: string;
}

export interface WplScorecardBatter {
  playerId?: string;
  name: string;
  runs: number | string;
  balls: number | string;
  fours: number | string;
  sixes: number | string;
  strikeRate?: number | string;
  dismissal?: WplScorecardDismissal;
  isCaptain?: boolean;
}

export interface WplScorecardBowler {
  playerId?: string;
  name: string;
  overs: number | string;
  balls?: number | string;
  runs: number | string;
  wickets: number | string;
  maidens?: number | string;
  economyRate?: number | string;
  dots?: number | string;
  wides?: number | string;
  noBalls?: number | string;
  isCaptain?: boolean;
}

export interface WplFallOfWicket {
  player: string;
  score: string;
  over: string;
}

export interface WplPartnership {
  batsman1: string;
  batsman1Runs: string | number;
  batsman1Balls: string | number;
  batsman2: string;
  batsman2Runs: string | number;
  batsman2Balls: string | number;
  totalRuns: string | number;
}

export interface WplScorecardInnings {
  inningsNumber: number;
  battingTeamId: string | number;
  batting: WplScorecardBatter[];
  bowling: WplScorecardBowler[];
  extras?: {
    wides?: number;
    noBalls?: number;
    byes?: number;
    legByes?: number;
  };
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number | string;
  powerplay?: { overs?: number | string; runs?: number };
  powerplays?: {
    mandatory?: { overs?: string; runs?: number };
    optional?: { overs?: string; runs?: number };
  };
  fallOfWickets?: WplFallOfWicket[];
  partnerships?: WplPartnership[];
}

export interface WplScorecard {
  id?: string;
  matchId: string;
  league: string;
  matchInfo: {
    matchId?: string;
    team1: WplScorecardTeam;
    team2: WplScorecardTeam;
    venue?: string;
    date?: string;
    time?: string;
    toss?: { winner?: string; decision?: string };
    status?: string;
  };
  innings: WplScorecardInnings[];
  result?: {
    winner?: string;
    margin?: string;
    manOfTheMatch?: string;
  };
  draft?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export type CanonicalWplCode = 'RCB-W' | 'MI-W' | 'DC-W' | 'GG' | 'UPW';

export interface FranchiseVisualTheme {
  code: CanonicalWplCode;
  name: string;
  logo: string;
  primary: string;
  accent: string;
  badgeClass: string;
  glowColor: string;
}

export const WPL_FRANCHISE_THEMES: Record<CanonicalWplCode, FranchiseVisualTheme> = {
  'RCB-W': {
    code: 'RCB-W',
    name: 'Royal Challengers Bengaluru',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    primary: '#B91C1C',
    accent: '#F59E0B',
    badgeClass: 'bg-red-500/15 text-red-200 border-red-400/35',
    glowColor: 'rgba(220, 38, 38, 0.28)',
  },
  'MI-W': {
    code: 'MI-W',
    name: 'Mumbai Indians',
    logo: '/logos/wpl_mi_logo_animated.svg',
    primary: '#004BA0',
    accent: '#FACC15',
    badgeClass: 'bg-blue-500/15 text-blue-200 border-blue-400/35',
    glowColor: 'rgba(37, 99, 235, 0.28)',
  },
  'DC-W': {
    code: 'DC-W',
    name: 'Delhi Capitals',
    logo: '/logos/wpl_dc_logo_animated.svg',
    primary: '#1D4ED8',
    accent: '#EF4444',
    badgeClass: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/35',
    glowColor: 'rgba(79, 70, 229, 0.28)',
  },
  GG: {
    code: 'GG',
    name: 'Gujarat Giants',
    logo: '/logos/wpl_gg_logo_animated.svg',
    primary: '#EA580C',
    accent: '#FBBF24',
    badgeClass: 'bg-orange-500/15 text-orange-200 border-orange-400/35',
    glowColor: 'rgba(234, 88, 12, 0.28)',
  },
  UPW: {
    code: 'UPW',
    name: 'UP Warriorz',
    logo: '/logos/wpl_upw_logo_animated.svg',
    primary: '#6D28D9',
    accent: '#FBBF24',
    badgeClass: 'bg-violet-500/15 text-violet-200 border-violet-400/35',
    glowColor: 'rgba(109, 40, 217, 0.28)',
  },
};

const CODE_ALIASES: Array<[RegExp, CanonicalWplCode]> = [
  [/\brcb\b|royal challengers/i, 'RCB-W'],
  [/\bmi\b|mumbai indians/i, 'MI-W'],
  [/\bdc\b|delhi capitals/i, 'DC-W'],
  [/\bgg\b|gujarat giants/i, 'GG'],
  [/\bupw\b|up warriorz|warriorz/i, 'UPW'],
];

export function normalizeWplTeamCode(teamOrText?: Partial<WplScorecardTeam> | string | null): CanonicalWplCode | null {
  if (!teamOrText) return null;
  const hay =
    typeof teamOrText === 'string'
      ? teamOrText
      : `${teamOrText.shortName || ''} ${teamOrText.name || ''}`;
  for (const [pattern, code] of CODE_ALIASES) {
    if (pattern.test(hay)) return code;
  }
  return null;
}

export function getTeamVisualTheme(team?: Partial<WplScorecardTeam> | string | null): FranchiseVisualTheme {
  const code = normalizeWplTeamCode(team) || 'MI-W';
  return WPL_FRANCHISE_THEMES[code];
}

export function getTeamLogoUrl(team?: WplScorecardTeam | null): string {
  if (team?.logo && team.logo.trim()) return team.logo;
  return getTeamVisualTheme(team).logo;
}

export function cleanTeamDisplayName(name?: string): string {
  if (!name) return 'TBD';
  return name.replace(/\s*\(WPL\)\s*/gi, '').trim();
}

export function toNum(val: number | string | undefined | null): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/O/g, '0').trim();
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function oversToDecimalOvers(overs: number | string | undefined): number {
  if (overs === undefined || overs === null) return 0;
  const raw = String(overs).trim();
  if (!raw) return 0;
  const [wholeStr, ballStr] = raw.split('.');
  const whole = Number.parseInt(wholeStr || '0', 10) || 0;
  const balls = Number.parseInt((ballStr || '0').slice(0, 1), 10) || 0;
  return whole + Math.min(balls, 5) / 6;
}

export function isNotOutDismissal(dismissal?: WplScorecardDismissal): boolean {
  if (!dismissal) return true;
  const t = (dismissal.type || '').toLowerCase().trim();
  const d = (dismissal.details || '').toLowerCase().trim();
  if (!d && (!t || t === 'not-out' || t === 'not out')) return true;
  return t === 'not-out' || t === 'not out' || t === 'retired-hurt' || t === 'retd-hurt' || d === 'not out';
}

export function formatDismissalText(dismissal?: WplScorecardDismissal): string {
  if (!dismissal) return 'not out';
  if (dismissal.details && dismissal.details.trim()) return dismissal.details.trim();
  const t = (dismissal.type || '').toLowerCase().trim();
  if (!t || t === 'not-out' || t === 'not out') return 'not out';
  if (t === 'retd-out') return 'retired out';
  if (t === 'retired-hurt' || t === 'retd-hurt') return 'retired hurt';
  return t.replace(/-/g, ' ');
}

export function cleanBatters(batting: WplScorecardBatter[] = []): Array<
  WplScorecardBatter & {
    runsNum: number;
    ballsNum: number;
    foursNum: number;
    sixesNum: number;
    srNum: number;
    isNotOut: boolean;
    dismissalLabel: string;
  }
> {
  return batting
    .filter((b) => Boolean(b && b.name && b.name.trim().length > 0))
    .map((b) => {
      const runsNum = toNum(b.runs);
      const ballsNum = toNum(b.balls);
      const foursNum = toNum(b.fours);
      const sixesNum = toNum(b.sixes);
      const rawSr = toNum(b.strikeRate);
      const srNum = rawSr > 0 ? rawSr : ballsNum > 0 ? (runsNum / ballsNum) * 100 : 0;
      const notOut = isNotOutDismissal(b.dismissal);
      return {
        ...b,
        runsNum,
        ballsNum,
        foursNum,
        sixesNum,
        srNum,
        isNotOut: notOut,
        dismissalLabel: formatDismissalText(b.dismissal),
      };
    });
}

export function cleanBowlers(bowling: WplScorecardBowler[] = []): Array<
  WplScorecardBowler & {
    oversLabel: string;
    maidensNum: number;
    runsNum: number;
    wicketsNum: number;
    econNum: number;
    dotsNum: number;
    widesNum: number;
    noBallsNum: number;
  }
> {
  return bowling
    .filter((b) => Boolean(b && b.name && b.name.trim().length > 0))
    .map((b) => {
      const oversStr = String(b.overs ?? '0').trim() || '0';
      const decOvers = oversToDecimalOvers(oversStr);
      const runsNum = toNum(b.runs);
      const wicketsNum = toNum(b.wickets);
      const maidensNum = toNum(b.maidens);
      const rawEcon = toNum(b.economyRate);
      const econNum = rawEcon > 0 ? rawEcon : decOvers > 0 ? runsNum / decOvers : 0;
      return {
        ...b,
        oversLabel: oversStr,
        maidensNum,
        runsNum,
        wicketsNum,
        econNum,
        dotsNum: toNum(b.dots),
        widesNum: toNum(b.wides),
        noBallsNum: toNum(b.noBalls),
      };
    });
}

export interface ComputedInningsSummary {
  totalRuns: number;
  totalWickets: number;
  totalOversLabel: string;
  runRate: string;
  extrasTotal: number;
  extrasBreakdown: string;
  totalFours: number;
  totalSixes: number;
  powerplayLabel: string | null;
}

export function computeInningsSummary(innings: WplScorecardInnings): ComputedInningsSummary {
  const batters = cleanBatters(innings.batting);
  const w = toNum(innings.extras?.wides);
  const nb = toNum(innings.extras?.noBalls);
  const b = toNum(innings.extras?.byes);
  const lb = toNum(innings.extras?.legByes);
  const extrasTotal = w + nb + b + lb;

  const extrasParts: string[] = [];
  if (b > 0) extrasParts.push(`b ${b}`);
  if (lb > 0) extrasParts.push(`lb ${lb}`);
  if (w > 0) extrasParts.push(`w ${w}`);
  if (nb > 0) extrasParts.push(`nb ${nb}`);
  const extrasBreakdown = extrasParts.length > 0 ? extrasParts.join(', ') : 'none';

  const summedBatRuns = batters.reduce((acc, item) => acc + item.runsNum, 0);
  const totalRuns =
    innings.totalRuns !== undefined && innings.totalRuns !== null
      ? toNum(innings.totalRuns)
      : summedBatRuns + extrasTotal;

  const countedDismissals = batters.filter((item) => !item.isNotOut).length;
  const totalWickets =
    innings.totalWickets !== undefined && innings.totalWickets !== null
      ? toNum(innings.totalWickets)
      : countedDismissals;

  const totalOversLabel = String(innings.totalOvers ?? '20.0').trim() || '20.0';
  const decOvers = oversToDecimalOvers(totalOversLabel);
  const runRate = decOvers > 0 ? (totalRuns / decOvers).toFixed(2) : '0.00';

  const totalFours = batters.reduce((acc, item) => acc + item.foursNum, 0);
  const totalSixes = batters.reduce((acc, item) => acc + item.sixesNum, 0);

  let powerplayLabel: string | null = null;
  if (innings.powerplays?.mandatory && (innings.powerplays.mandatory.runs || innings.powerplays.mandatory.overs)) {
    const ppOvers = innings.powerplays.mandatory.overs || '0.1 - 6';
    const ppRuns = toNum(innings.powerplays.mandatory.runs);
    powerplayLabel = `Powerplay (${ppOvers}): ${ppRuns} runs`;
  } else if (innings.powerplay && (innings.powerplay.runs || innings.powerplay.overs)) {
    powerplayLabel = `Powerplay (${innings.powerplay.overs ?? 6} ov): ${toNum(innings.powerplay.runs)} runs`;
  }

  return {
    totalRuns,
    totalWickets,
    totalOversLabel,
    runRate,
    extrasTotal,
    extrasBreakdown,
    totalFours,
    totalSixes,
    powerplayLabel,
  };
}

export function resolveInningsTeams(
  scorecard: WplScorecard,
  innings: WplScorecardInnings
): { battingTeam: WplScorecardTeam; bowlingTeam: WplScorecardTeam } {
  const { team1, team2 } = scorecard.matchInfo;
  const batId = String(innings.battingTeamId ?? '').trim();
  if (batId && String(team1.id).trim() === batId) {
    return { battingTeam: team1, bowlingTeam: team2 };
  }
  if (batId && String(team2.id).trim() === batId) {
    return { battingTeam: team2, bowlingTeam: team1 };
  }
  return innings.inningsNumber === 2
    ? { battingTeam: team2, bowlingTeam: team1 }
    : { battingTeam: team1, bowlingTeam: team2 };
}

export function formatIndianDate(dateStr?: string): { short: string; readable: string } {
  if (!dateStr) return { short: 'TBA', readable: 'Date TBA' };
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = Number.parseInt(mm, 10) - 1;
    const dayNum = Number.parseInt(dd, 10);
    const short = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
    const readable =
      mIdx >= 0 && mIdx < 12 && Number.isFinite(dayNum)
        ? `${dayNum} ${months[mIdx]} ${yyyy}`
        : short;
    return { short, readable };
  }
  return { short: dateStr, readable: dateStr };
}

export function parsePartnershipStats(totalRuns: string | number | undefined): {
  runs: number;
  balls: number | null;
  display: string;
} {
  if (totalRuns === undefined || totalRuns === null) {
    return { runs: 0, balls: null, display: '0' };
  }
  const str = String(totalRuns).replace(/O/g, '0').trim();
  const parenMatch = str.match(/^(\d+)\s*\((\d+)\)$/);
  if (parenMatch) {
    return {
      runs: Number.parseInt(parenMatch[1], 10) || 0,
      balls: Number.parseInt(parenMatch[2], 10) || 0,
      display: `${parenMatch[1]} (${parenMatch[2]}b)`,
    };
  }
  const leading = Number.parseInt(str, 10) || 0;
  return { runs: leading, balls: null, display: `${leading}` };
}

export function filterAndSortPublishedWplScorecards(items: WplScorecard[]): WplScorecard[] {
  const published = items.filter((sc) => sc && sc.draft === false && Array.isArray(sc.innings) && sc.innings.length > 0);
  const byMatchId = new Map<string, WplScorecard>();

  const tsOf = (sc: WplScorecard) =>
    new Date(sc.updatedAt || sc.publishedAt || sc.createdAt || 0).getTime() || 0;

  for (const sc of published) {
    const key = String(sc.matchId || sc.id || '').trim();
    if (!key) continue;
    const existing = byMatchId.get(key);
    if (!existing || tsOf(sc) >= tsOf(existing)) {
      byMatchId.set(key, sc);
    }
  }

  return Array.from(byMatchId.values()).sort((a, b) => {
    const dateA = a.matchInfo?.date || '';
    const dateB = b.matchInfo?.date || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return toNum(b.matchId) - toNum(a.matchId);
  });
}

export function filterScorecards(
  scorecards: WplScorecard[],
  teamFilter: CanonicalWplCode | 'ALL',
  searchQuery: string
): WplScorecard[] {
  const q = searchQuery.trim().toLowerCase();
  return scorecards.filter((sc) => {
    const code1 = normalizeWplTeamCode(sc.matchInfo.team1);
    const code2 = normalizeWplTeamCode(sc.matchInfo.team2);
    if (teamFilter !== 'ALL' && code1 !== teamFilter && code2 !== teamFilter) {
      return false;
    }
    if (!q) return true;

    const matchNumText = `match ${sc.matchId} m${sc.matchId}`.toLowerCase();
    const headerFields = [
      sc.matchInfo.team1.name,
      sc.matchInfo.team1.shortName,
      sc.matchInfo.team2.name,
      sc.matchInfo.team2.shortName,
      sc.matchInfo.venue,
      sc.matchInfo.date,
      sc.result?.winner,
      sc.result?.manOfTheMatch,
      sc.result?.margin,
      matchNumText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (headerFields.includes(q)) return true;

    return sc.innings.some((inns) => {
      const hasBatter = (inns.batting || []).some((b) => (b.name || '').toLowerCase().includes(q));
      const hasBowler = (inns.bowling || []).some((bw) => (bw.name || '').toLowerCase().includes(q));
      return hasBatter || hasBowler;
    });
  });
}

export function getMatchHighlightMetrics(scorecard: WplScorecard) {
  let totalFours = 0;
  let totalSixes = 0;
  let bestBatter: { name: string; runs: number; balls: number; teamCode: string } | null = null;
  let bestBowler: { name: string; wickets: number; runs: number; overs: string; teamCode: string } | null = null;

  for (const inns of scorecard.innings || []) {
    const { battingTeam, bowlingTeam } = resolveInningsTeams(scorecard, inns);
    const batCode = normalizeWplTeamCode(battingTeam) || battingTeam.shortName || '';
    const bowlCode = normalizeWplTeamCode(bowlingTeam) || bowlingTeam.shortName || '';

    for (const b of cleanBatters(inns.batting)) {
      totalFours += b.foursNum;
      totalSixes += b.sixesNum;
      if (!bestBatter || b.runsNum > bestBatter.runs || (b.runsNum === bestBatter.runs && b.ballsNum < bestBatter.balls)) {
        bestBatter = { name: b.name, runs: b.runsNum, balls: b.ballsNum, teamCode: batCode };
      }
    }

    for (const bw of cleanBowlers(inns.bowling)) {
      if (
        !bestBowler ||
        bw.wicketsNum > bestBowler.wickets ||
        (bw.wicketsNum === bestBowler.wickets && bw.runsNum < bestBowler.runs)
      ) {
        bestBowler = {
          name: bw.name,
          wickets: bw.wicketsNum,
          runs: bw.runsNum,
          overs: bw.oversLabel,
          teamCode: bowlCode,
        };
      }
    }
  }

  return { totalFours, totalSixes, bestBatter, bestBowler };
}
