export interface IPL2027TeamMeta {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  border: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  remainingPurse: string; // e.g. '₹47.45 Cr'
  purseAmountCr: number;
  openSlots: number;
  overseasSlotsOpen: number;
  retainedCount: number;
}

export const IPL_2027_TEAMS: IPL2027TeamMeta[] = [
  {
    id: '1',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    code: 'RCB',
    color: 'from-red-700/30 via-slate-900/60 to-slate-950',
    border: 'border-red-500/40',
    badge: 'bg-red-500/20 text-red-300',
    primaryColor: '#e11d48',
    secondaryColor: '#1e293b',
    remainingPurse: '₹14.25 Cr',
    purseAmountCr: 14.25,
    openSlots: 5,
    overseasSlotsOpen: 1,
    retainedCount: 20,
  },
  {
    id: '10',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    code: 'CSK',
    color: 'from-amber-500/30 via-slate-900/60 to-slate-950',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
    primaryColor: '#facc15',
    secondaryColor: '#1e3a8a',
    remainingPurse: '₹28.05 Cr',
    purseAmountCr: 28.05,
    openSlots: 6,
    overseasSlotsOpen: 2,
    retainedCount: 19,
  },
  {
    id: '2',
    name: 'Mumbai Indians',
    shortName: 'MI',
    code: 'MI',
    color: 'from-blue-600/30 via-slate-900/60 to-slate-950',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300',
    primaryColor: '#004ba0',
    secondaryColor: '#d1ab3e',
    remainingPurse: '₹12.10 Cr',
    purseAmountCr: 12.1,
    openSlots: 9,
    overseasSlotsOpen: 3,
    retainedCount: 16,
  },
  {
    id: '4',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    code: 'KKR',
    color: 'from-purple-700/30 via-slate-900/60 to-slate-950',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300',
    primaryColor: '#3b0764',
    secondaryColor: '#eab308',
    remainingPurse: '₹41.65 Cr',
    purseAmountCr: 41.65,
    openSlots: 12,
    overseasSlotsOpen: 4,
    retainedCount: 13,
  },
  {
    id: '3',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    code: 'SRH',
    color: 'from-orange-600/30 via-slate-900/60 to-slate-950',
    border: 'border-orange-500/40',
    badge: 'bg-orange-500/20 text-orange-300',
    primaryColor: '#f97316',
    secondaryColor: '#000000',
    remainingPurse: '₹40.15 Cr',
    purseAmountCr: 40.15,
    openSlots: 7,
    overseasSlotsOpen: 3,
    retainedCount: 18,
  },
  {
    id: '7',
    name: 'Delhi Capitals',
    shortName: 'DC',
    code: 'DC',
    color: 'from-blue-700/30 via-slate-900/60 to-slate-950',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300',
    primaryColor: '#1d4ed8',
    secondaryColor: '#dc2626',
    remainingPurse: '₹39.50 Cr',
    purseAmountCr: 39.5,
    openSlots: 9,
    overseasSlotsOpen: 3,
    retainedCount: 16,
  },
  {
    id: '4_gt',
    name: 'Gujarat Titans',
    shortName: 'GT',
    code: 'GT',
    color: 'from-slate-700/40 via-slate-900/60 to-slate-950',
    border: 'border-slate-500/40',
    badge: 'bg-slate-500/20 text-slate-300',
    primaryColor: '#0f172a',
    secondaryColor: '#eab308',
    remainingPurse: '₹8.75 Cr',
    purseAmountCr: 8.75,
    openSlots: 3,
    overseasSlotsOpen: 1,
    retainedCount: 22,
  },
  {
    id: '9',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    code: 'LSG',
    color: 'from-sky-600/30 via-slate-900/60 to-slate-950',
    border: 'border-sky-500/40',
    badge: 'bg-sky-500/20 text-sky-300',
    primaryColor: '#0284c7',
    secondaryColor: '#f97316',
    remainingPurse: '₹47.45 Cr',
    purseAmountCr: 47.45,
    openSlots: 7,
    overseasSlotsOpen: 3,
    retainedCount: 18,
  },
  {
    id: '5',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    code: 'PBKS',
    color: 'from-red-600/30 via-slate-900/60 to-slate-950',
    border: 'border-red-500/40',
    badge: 'bg-red-500/20 text-red-300',
    primaryColor: '#dc2626',
    secondaryColor: '#d1d5db',
    remainingPurse: '₹18.60 Cr',
    purseAmountCr: 18.6,
    openSlots: 6,
    overseasSlotsOpen: 2,
    retainedCount: 19,
  },
  {
    id: '8',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    code: 'RR',
    color: 'from-pink-600/30 via-slate-900/60 to-slate-950',
    border: 'border-pink-500/40',
    badge: 'bg-pink-500/20 text-pink-300',
    primaryColor: '#ec4899',
    secondaryColor: '#1e3a8a',
    remainingPurse: '₹16.80 Cr',
    purseAmountCr: 16.8,
    openSlots: 6,
    overseasSlotsOpen: 2,
    retainedCount: 19,
  },
];

export function resolveIpl2027Team(teamIdOrName?: string | null): IPL2027TeamMeta | undefined {
  if (!teamIdOrName) return undefined;
  const raw = String(teamIdOrName).trim().toLowerCase();

  return IPL_2027_TEAMS.find((t) => {
    if (t.id.toLowerCase() === raw) return true;
    if (t.shortName.toLowerCase() === raw) return true;
    if (t.name.toLowerCase() === raw) return true;
    if (raw.includes('rcb') && t.shortName === 'RCB') return true;
    if (raw.includes('mumbai') && t.shortName === 'MI') return true;
    if (raw.includes('chennai') && t.shortName === 'CSK') return true;
    if (raw.includes('kolkata') && t.shortName === 'KKR') return true;
    if (raw.includes('hyderabad') && t.shortName === 'SRH') return true;
    if (raw.includes('rajasthan') && t.shortName === 'RR') return true;
    if (raw.includes('delhi') && t.shortName === 'DC') return true;
    if (raw.includes('punjab') && t.shortName === 'PBKS') return true;
    if (raw.includes('lucknow') && t.shortName === 'LSG') return true;
    if (raw.includes('gujarat') && t.shortName === 'GT') return true;
    return false;
  });
}

export const IPL_2027_BASE_PURSE_CR = 130.0;
export const IPL_2027_SQUAD_MIN = 18;
export const IPL_2027_SQUAD_MAX = 25;
export const IPL_2027_OVERSEAS_MAX = 8;

export function parseFeeInCrores(feeStr?: string | number | null): number {
  if (!feeStr) return 0;
  if (typeof feeStr === 'number') {
    if (feeStr < 500) return feeStr;
    return feeStr / 10000000;
  }
  const str = String(feeStr).trim();
  if (!str) return 0;
  const crMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore)/i);
  if (crMatch) return parseFloat(crMatch[1]);
  const lakhMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|l)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) / 100;
  const plain = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(plain)) {
    return plain < 500 ? plain : plain / 10000000;
  }
  return 0;
}

export function isPlayerOverseas(nationality?: string | null): boolean {
  if (!nationality) return false;
  const nat = nationality.trim().toLowerCase();
  return nat !== '' && !['india', 'ind', 'indian'].includes(nat);
}

export interface FranchiseRosterHealth {
  team: IPL2027TeamMeta;
  squadCount: number;
  squadMax: number;
  squadMin: number;
  squadOpenSlots: number;
  squadStatus: 'ok' | 'below_min' | 'full' | 'overflow';
  
  overseasCount: number;
  overseasMax: number;
  overseasOpenSlots: number;
  overseasStatus: 'ok' | 'full' | 'exceeded';

  totalPurseCr: number;
  spentPurseCr: number;
  remainingPurseCr: number;
  formattedRemainingPurse: string;
  formattedSpentPurse: string;

  roles: {
    batters: { count: number; percentage: number };
    keepers: { count: number; percentage: number };
    allRounders: { count: number; percentage: number };
    bowlers: { count: number; percentage: number };
  };

  injuredCount: number;
  injuredPlayers: any[];
}

export function computeFranchiseRosterHealth(
  teamIdOrMeta: string | IPL2027TeamMeta,
  players: any[]
): FranchiseRosterHealth | null {
  const teamMeta = typeof teamIdOrMeta === 'string' ? resolveIpl2027Team(teamIdOrMeta) : teamIdOrMeta;
  if (!teamMeta) return null;

  // Active squad players in this franchise
  const activePlayers = players.filter((p) => {
    const isTeam =
      String(p.teamId) === teamMeta.id ||
      (p.teamShortName && p.teamShortName.toUpperCase() === teamMeta.shortName) ||
      (p.team && p.team.toLowerCase().includes(teamMeta.name.toLowerCase()));
    
    const isReleased =
      (p.squadStatus || '').toLowerCase().includes('release') ||
      (p.team || '').toLowerCase().includes('standby') ||
      p.teamId === 'pool' ||
      p.teamId === 'STANDBY_2027';

    return isTeam && !isReleased;
  });

  const squadCount = activePlayers.length;
  const squadOpenSlots = Math.max(0, IPL_2027_SQUAD_MAX - squadCount);
  let squadStatus: 'ok' | 'below_min' | 'full' | 'overflow' = 'ok';
  if (squadCount < IPL_2027_SQUAD_MIN) squadStatus = 'below_min';
  else if (squadCount === IPL_2027_SQUAD_MAX) squadStatus = 'full';
  else if (squadCount > IPL_2027_SQUAD_MAX) squadStatus = 'overflow';

  // Overseas count
  const overseasCount = activePlayers.filter((p) => isPlayerOverseas(p.nationality)).length;
  const overseasOpenSlots = Math.max(0, IPL_2027_OVERSEAS_MAX - overseasCount);
  let overseasStatus: 'ok' | 'full' | 'exceeded' = 'ok';
  if (overseasCount === IPL_2027_OVERSEAS_MAX) overseasStatus = 'full';
  else if (overseasCount > IPL_2027_OVERSEAS_MAX) overseasStatus = 'exceeded';

  // Role Breakdown
  let batters = 0;
  let keepers = 0;
  let allRounders = 0;
  let bowlers = 0;

  activePlayers.forEach((p) => {
    const role = (p.role || '').toUpperCase();
    if (role.includes('KEEPER') || role.includes('WK')) keepers++;
    else if (role.includes('ALLROUNDER') || role.includes('ALL-ROUNDER') || role.includes('ALL ROUNDER')) allRounders++;
    else if (role.includes('BOWLER') || role.includes('BOWL')) bowlers++;
    else batters++;
  });

  const totalForRoles = squadCount > 0 ? squadCount : 1;
  const roles = {
    batters: { count: batters, percentage: Math.round((batters / totalForRoles) * 100) },
    keepers: { count: keepers, percentage: Math.round((keepers / totalForRoles) * 100) },
    allRounders: { count: allRounders, percentage: Math.round((allRounders / totalForRoles) * 100) },
    bowlers: { count: bowlers, percentage: Math.round((bowlers / totalForRoles) * 100) },
  };

  // Injured or Withdrawn players (creates injury replacement vacancy under BCCI rules)
  const injuredPlayers = activePlayers.filter((p) => {
    const st = (p.squadStatus || '').toLowerCase();
    return st.includes('injur') || st.includes('withdrawn') || st.includes('ruled out');
  });

  // Dynamic Purse Computation
  const baseSpent = IPL_2027_BASE_PURSE_CR - teamMeta.purseAmountCr;
  let explicitFeesSum = 0;
  let explicitCount = 0;
  activePlayers.forEach((p) => {
    const f = parseFeeInCrores(p.transferFee || p.auction?.fee);
    if (f > 0) {
      explicitFeesSum += f;
      explicitCount++;
    }
  });

  const unsetCount = squadCount - explicitCount;
  const defaultPerUnset = unsetCount > 0
    ? Math.max(0.5, (baseSpent - explicitFeesSum) / unsetCount)
    : 0;

  const dynamicSpentCr = explicitFeesSum + (unsetCount * defaultPerUnset);
  const remainingPurseCr = Math.max(0, IPL_2027_BASE_PURSE_CR - dynamicSpentCr);

  return {
    team: teamMeta,
    squadCount,
    squadMax: IPL_2027_SQUAD_MAX,
    squadMin: IPL_2027_SQUAD_MIN,
    squadOpenSlots,
    squadStatus,
    overseasCount,
    overseasMax: IPL_2027_OVERSEAS_MAX,
    overseasOpenSlots,
    overseasStatus,
    totalPurseCr: IPL_2027_BASE_PURSE_CR,
    spentPurseCr: Math.round(dynamicSpentCr * 100) / 100,
    remainingPurseCr: Math.round(remainingPurseCr * 100) / 100,
    formattedRemainingPurse: `₹${remainingPurseCr.toFixed(2)} Cr`,
    formattedSpentPurse: `₹${dynamicSpentCr.toFixed(2)} Cr`,
    roles,
    injuredCount: injuredPlayers.length,
    injuredPlayers,
  };
}
