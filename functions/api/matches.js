/**
 * Cloudflare Pages Function for matches API
 * Handles GET, POST, PUT, DELETE operations for matches
 */

// Mock teams for reference (IPL + WPL)
const mockTeams = [
  // IPL Teams (IDs 1-10)
  {
    id: '1',
    league: 'ipl',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_premium.svg',
    colors: { primary: '#EC1C24', secondary: '#000000' }
  },
  {
    id: '2',
    league: 'ipl',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_new.svg',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' }
  },
  {
    id: '3',
    league: 'ipl',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_new.svg',
    colors: { primary: '#FF822A', secondary: '#000000' }
  },
  {
    id: '4',
    league: 'ipl',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_new.svg',
    colors: { primary: '#1B2130', secondary: '#E15454' }
  },
  {
    id: '5',
    league: 'ipl',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    aliases: ['Kings XI Punjab', 'Kings Eleven Punjab'],
    logo: '/logos/kxip_logo_new.svg',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' }
  },
  {
    id: '6',
    league: 'ipl',
    name: 'Delhi Capitals',
    aliases: ['Delhi Daredevils'],
    shortName: 'DC',
    logo: '/logos/dc_logo_new.svg',
    colors: { primary: '#0078BC', secondary: '#EF1B26' }
  },
  {
    id: '7',
    league: 'ipl',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_new.svg',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' }
  },
  {
    id: '8',
    league: 'ipl',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_new.svg',
    colors: { primary: '#EA1A85', secondary: '#004B8D' }
  },
  {
    id: '9',
    league: 'ipl',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_new.svg',
    colors: { primary: '#3A225D', secondary: '#B9975B' }
  },
  {
    id: '10',
    league: 'ipl',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_new.svg',
    colors: { primary: '#FFB90F', secondary: '#0081E8' }
  },
  {
    id: '16',
    league: 'ipl',
    name: 'Gujarat Lions',
    shortName: 'GL',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#F28C28', secondary: '#1B365D' }
  },
  {
    id: '17',
    league: 'ipl',
    name: 'Rising Pune Supergiant',
    shortName: 'RPS',
    aliases: ['Rising Pune Supergiants'],
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#6A1B9A', secondary: '#F06292' }
  },
  {
    id: '18',
    league: 'ipl',
    name: 'Deccan Chargers',
    shortName: 'DCG',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#1E3A8A', secondary: '#F59E0B' }
  },
  {
    id: '19',
    league: 'ipl',
    name: 'Kochi Tuskers Kerala',
    shortName: 'KTK',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#0F766E', secondary: '#F97316' }
  },
  {
    id: '20',
    league: 'ipl',
    name: 'Pune Warriors India',
    shortName: 'PWI',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#2563EB', secondary: '#FACC15' }
  },
  // WPL Teams (IDs 11-15)
  {
    id: '11',
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#FFD700' }
  },
  {
    id: '12',
    league: 'wpl',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    colors: { primary: '#C8102E', secondary: '#FFD700' }
  },
  {
    id: '13',
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#DC2626' }
  },
  {
    id: '14',
    league: 'wpl',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_animated.svg',
    colors: { primary: '#F97316', secondary: '#FFD700' }
  },
  {
    id: '15',
    league: 'wpl',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_animated.svg',
    colors: { primary: '#059669', secondary: '#F97316' }
  }
];

// No default/sample matches - start with empty array
// Users must create matches through the admin panel

const IPL_TEAM_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '16', '17', '18', '19', '20']);
const WPL_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);
const ACTIVE_IPL_2026_TEAM_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
const ACTIVE_WPL_2026_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);
const DEFAULT_SEASON_YEAR = 2026;

function getYearFromDateLike(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const prefix = str.slice(0, 4);
  if (/^\d{4}$/.test(prefix)) {
    const parsed = Number(prefix);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const ms = Date.parse(str);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).getUTCFullYear();
}

function normalizeTeamId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('tbd-')) return raw;
  return raw.replace(/^team/i, '');
}

function isPlaceholderTeamId(value) {
  return normalizeTeamId(value).startsWith('tbd-');
}

function isPlaceholderTeam(team) {
  if (!team) return true;

  const teamId = normalizeTeamId(team.id);
  if (teamId.startsWith('tbd-')) return true;

  const haystack = `${team.name || ''} ${team.shortName || ''}`.toLowerCase();
  return (
    haystack.includes('tbd') ||
    haystack.includes('place team') ||
    haystack.includes('1st place') ||
    haystack.includes('2nd place') ||
    haystack.includes('3rd place') ||
    haystack.includes('4th place') ||
    haystack.includes('winner of') ||
    haystack.includes('loser of')
  );
}

function extractRunsFromScore(score) {
  if (typeof score === 'number' && Number.isFinite(score)) return score;
  if (typeof score !== 'string') return 0;

  const match = score.trim().match(/^(\d+)/);
  if (!match) return 0;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNoResultMatch(match) {
  const haystack = `${match?.resultType || ''} ${match?.resultReason || ''} ${match?.result || ''}`.toLowerCase();
  return haystack.includes('no result') || haystack.includes('abandoned') || haystack.includes('washout');
}

function getFallbackTeam(teamId, league) {
  return {
    id: teamId,
    shortName: `Team ${teamId}`,
    name: `Team ${teamId}`,
    logo: '',
    league: league || 'ipl',
    colors: { primary: '#6B7280', secondary: '#9CA3AF' },
    players: [],
  };
}

function getBaseTeamObject(match, key, teams) {
  const existingTeam = match?.[key];
  if (existingTeam && existingTeam.name && existingTeam.shortName) {
    return {
      ...existingTeam,
      players: existingTeam.players || [],
    };
  }

  const idKey = key === 'team1' ? 'team1Id' : 'team2Id';
  const teamId = String(match?.[idKey] ?? existingTeam?.id ?? '').trim();
  const team = getTeamById(teamId, teams);
  if (team) {
    return {
      ...team,
      players: team.players || [],
    };
  }

  return getFallbackTeam(teamId, inferMatchLeague(match) || match?.league || 'ipl');
}

function sortStandingsRows(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
  return String(a.team?.name || '').localeCompare(String(b.team?.name || ''));
}

function createMatchResolutionContext(allMatches, teams) {
  return {
    allMatches: Array.isArray(allMatches) ? allMatches : [],
    teams,
    standingsBySeason: new Map(),
    resolvedTeamsByMatchId: new Map(),
    resolvingMatchIds: new Set(),
  };
}

function buildIplSeasonStandings(matches, teams, seasonYear) {
  const rowsById = new Map();

  teams.forEach((team) => {
    if ((team?.league || 'ipl') !== 'ipl') return;
    if (isPlaceholderTeam(team)) return;

    rowsById.set(String(team.id), {
      team: {
        ...team,
        players: team.players || [],
      },
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      noResult: 0,
      points: 0,
      netRunRate: 0,
      totalRunsScored: 0,
      totalRunsConceded: 0,
      nrrMatches: 0,
    });
  });

  const getResolvedTeamPair = (match) => {
    const team1 = getBaseTeamObject(match, 'team1', teams);
    const team2 = getBaseTeamObject(match, 'team2', teams);
    return { team1, team2 };
  };

  matches.forEach((match) => {
    if ((inferMatchLeague(match) || match?.league || 'ipl') !== 'ipl') return;
    if (match?.playoffType) return;
    if (match?.status !== 'completed') return;
    if (getYearFromDateLike(match?.date) !== seasonYear) return;

    const team1Id = normalizeTeamId(match?.team1Id ?? match?.team1?.id);
    const team2Id = normalizeTeamId(match?.team2Id ?? match?.team2?.id);
    if (!rowsById.has(team1Id) || !rowsById.has(team2Id)) return;

    const row1 = rowsById.get(team1Id);
    const row2 = rowsById.get(team2Id);
    row1.matchesPlayed += 1;
    row2.matchesPlayed += 1;

    if (isNoResultMatch(match)) {
      row1.noResult += 1;
      row2.noResult += 1;
      row1.points += 1;
      row2.points += 1;
    } else {
      const { team1, team2 } = getResolvedTeamPair(match);
      const team1Runs = match?.score?.team1?.runs;
      const team2Runs = match?.score?.team2?.runs;

      let winnerId = '';
      if (typeof team1Runs === 'number' && typeof team2Runs === 'number' && team1Runs !== team2Runs) {
        winnerId = team1Runs > team2Runs ? team1Id : team2Id;
      } else {
        const result = `${match?.result || ''}`.toLowerCase();
        const team1Tokens = [team1?.name, team1?.shortName]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        const team2Tokens = [team2?.name, team2?.shortName]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        const team1Mentioned = team1Tokens.some((token) => result.includes(token));
        const team2Mentioned = team2Tokens.some((token) => result.includes(token));

        if (team1Mentioned && !team2Mentioned) winnerId = team1Id;
        if (team2Mentioned && !team1Mentioned) winnerId = team2Id;
      }

      if (winnerId === team1Id) {
        row1.wins += 1;
        row1.points += 2;
        row2.losses += 1;
      } else if (winnerId === team2Id) {
        row2.wins += 1;
        row2.points += 2;
        row1.losses += 1;
      }
    }

    const team1RunsForNrr = extractRunsFromScore(match?.team1Score ?? match?.score?.team1?.runs);
    const team2RunsForNrr = extractRunsFromScore(match?.team2Score ?? match?.score?.team2?.runs);
    if (team1RunsForNrr > 0 || team2RunsForNrr > 0) {
      row1.totalRunsScored += team1RunsForNrr;
      row1.totalRunsConceded += team2RunsForNrr;
      row1.nrrMatches += 1;

      row2.totalRunsScored += team2RunsForNrr;
      row2.totalRunsConceded += team1RunsForNrr;
      row2.nrrMatches += 1;
    }
  });

  const standings = Array.from(rowsById.values()).map((row) => ({
    ...row,
    netRunRate:
      row.nrrMatches > 0
        ? Number(((row.totalRunsScored - row.totalRunsConceded) / (row.nrrMatches * 20)).toFixed(2))
        : 0,
  }));

  standings.sort(sortStandingsRows);
  return standings;
}

function getIplSeasonStandings(context, seasonYear) {
  if (!context.standingsBySeason.has(seasonYear)) {
    context.standingsBySeason.set(
      seasonYear,
      buildIplSeasonStandings(context.allMatches, context.teams, seasonYear)
    );
  }
  return context.standingsBySeason.get(seasonYear) || [];
}

function getPlayoffMatchForSeason(context, seasonYear, playoffType) {
  return (
    context.allMatches.find((candidate) => {
      if ((inferMatchLeague(candidate) || candidate?.league || 'ipl') !== 'ipl') return false;
      if (candidate?.playoffType !== playoffType) return false;
      return getYearFromDateLike(candidate?.date) === seasonYear;
    }) || null
  );
}

function resolveWinningTeam(match, context) {
  if (!match || match.status !== 'completed') return null;
  if (isNoResultMatch(match)) return null;

  const { team1, team2 } = getResolvedTeamPair(match, context);
  if (!team1 || !team2) return null;

  const team1Runs = match?.score?.team1?.runs;
  const team2Runs = match?.score?.team2?.runs;
  if (typeof team1Runs === 'number' && typeof team2Runs === 'number' && team1Runs !== team2Runs) {
    return team1Runs > team2Runs ? team1 : team2;
  }

  const result = `${match?.result || ''}`.toLowerCase();
  const team1Tokens = [team1.name, team1.shortName]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  const team2Tokens = [team2.name, team2.shortName]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const team1Mentioned = team1Tokens.some((token) => result.includes(token));
  const team2Mentioned = team2Tokens.some((token) => result.includes(token));

  if (team1Mentioned && !team2Mentioned) return team1;
  if (team2Mentioned && !team1Mentioned) return team2;
  return null;
}

function resolveLosingTeam(match, context) {
  if (!match) return null;
  const winner = resolveWinningTeam(match, context);
  if (!winner) return null;

  const { team1, team2 } = getResolvedTeamPair(match, context);
  if (!team1 || !team2) return null;
  return String(winner.id) === String(team1.id) ? team2 : team1;
}

function getResolvedTeamPair(match, context) {
  if (!match) return { team1: null, team2: null };

  const cacheKey = String(match.id || '');
  if (cacheKey && context.resolvedTeamsByMatchId.has(cacheKey)) {
    return context.resolvedTeamsByMatchId.get(cacheKey);
  }

  const baseTeam1 = getBaseTeamObject(match, 'team1', context.teams);
  const baseTeam2 = getBaseTeamObject(match, 'team2', context.teams);
  const baseResolved = { team1: baseTeam1, team2: baseTeam2 };

  if (!cacheKey) return baseResolved;
  if (context.resolvingMatchIds.has(cacheKey)) return baseResolved;

  context.resolvingMatchIds.add(cacheKey);

  try {
    let team1 = baseTeam1;
    let team2 = baseTeam2;
    const matchLeague = inferMatchLeague(match) || match?.league || 'ipl';
    const hasPlaceholder =
      isPlaceholderTeamId(match?.team1Id ?? baseTeam1?.id) ||
      isPlaceholderTeamId(match?.team2Id ?? baseTeam2?.id) ||
      isPlaceholderTeam(baseTeam1) ||
      isPlaceholderTeam(baseTeam2);

    if (matchLeague === 'ipl' && match?.playoffType && hasPlaceholder) {
      const seasonYear = getYearFromDateLike(match?.date) || DEFAULT_SEASON_YEAR;
      const standings = getIplSeasonStandings(context, seasonYear);

      let derivedTeam1 = null;
      let derivedTeam2 = null;

      if (match.playoffType === 'qualifier1') {
        derivedTeam1 = standings[0]?.team || null;
        derivedTeam2 = standings[1]?.team || null;
      } else if (match.playoffType === 'eliminator') {
        derivedTeam1 = standings[2]?.team || null;
        derivedTeam2 = standings[3]?.team || null;
      } else if (match.playoffType === 'qualifier2') {
        const qualifier1Match = getPlayoffMatchForSeason(context, seasonYear, 'qualifier1');
        const eliminatorMatch = getPlayoffMatchForSeason(context, seasonYear, 'eliminator');
        derivedTeam1 = resolveLosingTeam(qualifier1Match, context);
        derivedTeam2 = resolveWinningTeam(eliminatorMatch, context);
      } else if (match.playoffType === 'final') {
        const qualifier1Match = getPlayoffMatchForSeason(context, seasonYear, 'qualifier1');
        const qualifier2Match = getPlayoffMatchForSeason(context, seasonYear, 'qualifier2');
        derivedTeam1 = resolveWinningTeam(qualifier1Match, context);
        derivedTeam2 = resolveWinningTeam(qualifier2Match, context);
      }

      if (isPlaceholderTeam(baseTeam1) && derivedTeam1) team1 = derivedTeam1;
      if (isPlaceholderTeam(baseTeam2) && derivedTeam2) team2 = derivedTeam2;
    }

    const resolved = { team1, team2 };
    context.resolvedTeamsByMatchId.set(cacheKey, resolved);
    return resolved;
  } finally {
    context.resolvingMatchIds.delete(cacheKey);
  }
}

function isActiveSeasonMatch(match, seasonYear) {
  const matchLeague = inferMatchLeague(match) || match.league || 'ipl';
  const activeIds = matchLeague === 'wpl' ? ACTIVE_WPL_2026_TEAM_IDS : ACTIVE_IPL_2026_TEAM_IDS;

  const year = getYearFromDateLike(match?.date);
  if (year !== seasonYear) return false;

  const team1Id = normalizeTeamId(match?.team1Id ?? match?.team1?.id);
  const team2Id = normalizeTeamId(match?.team2Id ?? match?.team2?.id);
  const allowsPlaceholders = Boolean(match?.playoffType);

  const isEligibleTeamId = (teamId) => {
    if (!teamId) return false;
    if (activeIds.has(teamId)) return true;
    return allowsPlaceholders && isPlaceholderTeamId(teamId);
  };

  return isEligibleTeamId(team1Id) && isEligibleTeamId(team2Id);
}

function normalizeLeague(value) {
  return value === 'ipl' || value === 'wpl' ? value : null;
}

function inferMatchLeague(match) {
  const explicit = normalizeLeague(match?.league);

  const team1Id = String(match?.team1Id ?? match?.team1?.id ?? '');
  const team2Id = String(match?.team2Id ?? match?.team2?.id ?? '');

  let teamBased = null;
  if (WPL_TEAM_IDS.has(team1Id) || WPL_TEAM_IDS.has(team2Id)) teamBased = 'wpl';
  if (IPL_TEAM_IDS.has(team1Id) || IPL_TEAM_IDS.has(team2Id)) teamBased = teamBased || 'ipl';

  if (explicit && teamBased && explicit !== teamBased) return teamBased;
  return explicit || teamBased || null;
}

// Helper function to verify admin token
function verifyAdminToken(request) {
  // Auth is enforced at the Cloudflare Pages middleware/layout level.
  // Here we do a lightweight presence check: accept any Bearer token,
  // or requests from same-origin (no Authorization header at all).
  const authHeader = request.headers.get('authorization');
  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return false; // malformed header — reject
  }
  return true;
}

// Helper function to get team by ID from teams array
function getTeamById(teamId, teams) {
  // First try to find in provided teams array
  const team = teams.find(t => t.id === teamId);
  if (team) return team;
  
  // Fallback to mockTeams for backward compatibility
  return mockTeams.find(t => t.id === teamId);
}

// Helper function to format match with full team objects
function formatMatch(match, teams, allMatchesOrContext) {
  const context =
    allMatchesOrContext && Array.isArray(allMatchesOrContext.allMatches)
      ? allMatchesOrContext
      : createMatchResolutionContext(allMatchesOrContext, teams);
  const { team1, team2 } = getResolvedTeamPair(match, context);

  return {
    id: match.id,
    league: match.league || 'ipl', // Ensure league property is included
    date: match.date,
    time: match.time,
    venue: match.venue,
    team1: team1 || getFallbackTeam(match.team1Id, match.league || 'ipl'),
    team2: team2 || getFallbackTeam(match.team2Id, match.league || 'ipl'),
    status: match.status,
    result: match.result,
    resultType: match.resultType,
    resultReason: match.resultReason,
    resultReasonDetail: match.resultReasonDetail,
    statusNote: match.statusNote,
    reducedOversTo: match.reducedOversTo,
    dlsApplied: match.dlsApplied,
    score: match.score,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    matchNumber: match.matchNumber,
    playoffType: match.playoffType,
    playing11: match.playing11,
    captains: match.captains,
    impactPlayer: match.impactPlayer,
    impactSubstitutes: match.impactSubstitutes,
    toss: match.toss,
    matchState: match.matchState,
    _isMock: match._isMock
  };
}

// GET - Retrieve all matches
async function handleGetRequest(context) {
  const { env, request } = context;
  
  try {
    // Get league query parameter
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    const matchId = url.searchParams.get('id');
    const includeAll = url.searchParams.get('includeAll') === 'true';
    const disableScorecardSync =
      url.searchParams.get('syncScorecards') === '0' || url.searchParams.get('noScorecardSync') === '1';
    const forceScorecardSync = url.searchParams.get('syncScorecards') === '1';
    const seasonParam = url.searchParams.get('season') || url.searchParams.get('year');
    const seasonYear = Number.parseInt(seasonParam || '', 10);
    const resolvedSeasonYear = Number.isFinite(seasonYear) ? seasonYear : DEFAULT_SEASON_YEAR;
    
    // Try to get matches from KV storage
    const kvRaw = await env.IPL_CACHE.get('matches');

    let matches;
    // Start with empty array - no default/sample matches
    // If KV exists, use what's in KV (even if empty array)
    if (kvRaw === null) {
      // KV key doesn't exist - first time, start with empty array
      matches = [];
    } else {
      // KV key exists - use what's in KV (even if empty array)
      try {
        matches = JSON.parse(kvRaw) || [];
      } catch {
        matches = [];
      }
    }
    
    // Ensure all matches have league property (migration for existing data)
    let needsUpdate = false;
    matches = matches.map((match) => {
      const inferred = inferMatchLeague(match);
      const nextLeague = inferred || match.league || 'ipl';
      if (match.league !== nextLeague) {
        needsUpdate = true;
        return { ...match, league: nextLeague };
      }
      if (!match.league) {
        // Guarantee the property exists for consistent filtering on the client.
        needsUpdate = true;
        return { ...match, league: nextLeague };
      }
      return match;
    });

    if (needsUpdate) {
      await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    }
    
    // Filter by league if specified
    if (league && (league === 'ipl' || league === 'wpl')) {
      matches = matches.filter(match => {
        const matchLeague = inferMatchLeague(match) || match.league || 'ipl';
        return matchLeague === league;
      });
    }

    // Default: only return the active 2026 season data (unless explicitly requested otherwise).
    if (!includeAll) {
      matches = matches.filter((match) => isActiveSeasonMatch(match, resolvedSeasonYear));
    }
    
    // Fetch teams from KV storage to properly resolve team objects
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      // Fallback to mockTeams if KV is empty
      allTeams = mockTeams;
    }
    
    // Format matches with team objects
    const resolutionContext = createMatchResolutionContext(matches, allTeams);
    const formattedMatches = matches.map(match => formatMatch(match, allTeams, resolutionContext));
    
    // Sync results from scorecards for completed matches with missing results
    const shouldSyncScorecards = forceScorecardSync || (!disableScorecardSync && !matchId);
    if (shouldSyncScorecards) {
      try {
        const scorecardsResponse = await fetch(
          `${request.url.replace('/api/matches', '/api/scorecards')}&league=${league || 'ipl'}`
        );
        if (scorecardsResponse.ok) {
          const scorecards = await scorecardsResponse.json();
          if (Array.isArray(scorecards)) {
            // Update matches with scorecard results
            formattedMatches.forEach(match => {
              if (match.status === 'completed' && !match.result) {
                // Only use published scorecards to avoid leaking draft results.
                const scorecard = scorecards.find(sc => sc.matchId === match.id && sc.draft === false);
                if (scorecard && scorecard.result && scorecard.result.winner) {
                  // Create result text from scorecard
                  const winnerTeam = allTeams.find(t => t.name === scorecard.result.winner);
                  const isTeam1Winner = winnerTeam && winnerTeam.id === match.team1?.id;
                  
                  if (isTeam1Winner) {
                    match.result = `${match.team1?.shortName || match.team1?.name} won by ${scorecard.result.margin}`;
                  } else {
                    match.result = `${match.team2?.shortName || match.team2?.name} won by ${scorecard.result.margin}`;
                  }
                  
                  console.log(`Updated match ${match.id} result from scorecard:`, match.result);
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Error syncing scorecard results:', error);
      }
    }
    
    if (matchId) {
      const selected = formattedMatches.find((m) => String(m.id) === String(matchId)) || null;
      if (!selected) {
        return new Response(JSON.stringify({ error: 'Match not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      return new Response(JSON.stringify(selected), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return new Response(JSON.stringify(formattedMatches), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error retrieving matches:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST (bulk) - Create multiple matches in one atomic KV write
async function handleBulkPostRequest(context) {
  const { env, request } = context;

  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const incoming = Array.isArray(body.matches) ? body.matches : [];
    if (!incoming.length) {
      return new Response(JSON.stringify({ error: 'No matches provided' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate each row has required fields
    for (const m of incoming) {
      if (!m.date || !m.time || !m.venue || !m.team1Id || !m.team2Id) {
        return new Response(JSON.stringify({ error: `Missing required fields in match: ${JSON.stringify(m)}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Read existing matches ONCE
    let matches = await env.IPL_CACHE.get('matches', 'json') || [];
    let nextId = Math.max(...matches.map(m => parseInt(m.id) || 0), 0) + 1;

    // Fetch teams for response formatting
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || !allTeams.length) allTeams = mockTeams;

    const created = incoming.map(m => {
      const newMatch = {
        id: String(nextId++),
        league: m.league || 'ipl',
        date: m.date,
        time: m.time,
        venue: m.venue,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        status: m.status || 'upcoming',
        ...(m.statusNote ? { statusNote: String(m.statusNote).trim() } : {}),
        ...(Number.isFinite(Number(m.reducedOversTo)) && Number(m.reducedOversTo) > 0
          ? { reducedOversTo: Number(m.reducedOversTo) }
          : {}),
        ...(typeof m.dlsApplied === 'boolean' ? { dlsApplied: m.dlsApplied } : {}),
        ...(m.playoffType ? { playoffType: m.playoffType } : {}),
      };
      matches.push(newMatch);
      return newMatch;
    });

    // Single atomic write
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    const resolutionContext = createMatchResolutionContext(matches, allTeams);

    return new Response(JSON.stringify({
      success: true,
      created: created.map(m => formatMatch(m, allTeams, resolutionContext)),
      count: created.length
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error bulk creating matches:', error);
    return new Response(JSON.stringify({ error: `Bulk create failed: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create a new match
async function handlePostRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { date, time, venue, team1Id, team2Id, status, league, statusNote, reducedOversTo, dlsApplied } = body;
    
    // Validate required fields
    if (!date || !time || !venue || !team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
    // Generate new ID
    const newId = String(Math.max(...matches.map(m => parseInt(m.id) || 0), 0) + 1);
    
    // Create new match
    const newMatch = {
      id: newId,
      league: league || 'ipl', // Default to 'ipl' if not specified
      date,
      time,
      venue,
      team1Id,
      team2Id,
      status: status || 'upcoming',
      ...(statusNote ? { statusNote: String(statusNote).trim() } : {}),
      ...(Number.isFinite(Number(reducedOversTo)) && Number(reducedOversTo) > 0
        ? { reducedOversTo: Number(reducedOversTo) }
        : {}),
      ...(typeof dlsApplied === 'boolean' ? { dlsApplied } : {})
    };
    
    // Add to matches array
    matches.push(newMatch);
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    // Fetch teams to format the response
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    const resolutionContext = createMatchResolutionContext(matches, allTeams);
    
    return new Response(JSON.stringify(formatMatch(newMatch, allTeams, resolutionContext)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return new Response(JSON.stringify({ error: 'Failed to create match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT (bulk) - Update status for multiple matches in one atomic KV write
async function handleBulkPutRequest(context) {
  const { env, request } = context;

  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { matchIds, status } = body;
    if (!Array.isArray(matchIds) || !matchIds.length || !status) {
      return new Response(JSON.stringify({ error: 'matchIds array and status are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const idSet = new Set(matchIds.map(String));
    let matches = await env.IPL_CACHE.get('matches', 'json') || [];
    let updatedCount = 0;
    matches = matches.map(m => {
      if (idSet.has(String(m.id))) { updatedCount++; return { ...m, status }; }
      return m;
    });
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    return new Response(JSON.stringify({ success: true, updated: updatedCount, status }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error bulk updating match status:', error);
    return new Response(JSON.stringify({ error: `Bulk status update failed: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Update an existing match
async function handlePutRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { id, date, time, venue, team1Id, team2Id, status, league, playing11 } = body;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
    // Find and update match
    const matchIndex = matches.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update match with all fields from body, preserving existing values
    const updatedMatch = {
      ...matches[matchIndex],
      ...body, // Spread all fields from body
      id // Ensure ID doesn't change
    };
    
    // Ensure league property exists (default to existing or 'ipl')
    if (!updatedMatch.league) {
      updatedMatch.league = matches[matchIndex].league || 'ipl';
    }
    
    matches[matchIndex] = updatedMatch;
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    // Fetch teams to format the response
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    const resolutionContext = createMatchResolutionContext(matches, allTeams);
    
    return new Response(JSON.stringify(formatMatch(updatedMatch, allTeams, resolutionContext)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return new Response(JSON.stringify({ error: 'Failed to update match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete a match or clear all matches
async function handleDeleteRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('id');
    const clearAll = url.searchParams.get('clearAll') === 'true';
    const bulkDelete = url.searchParams.get('bulkDelete') === 'true' || url.searchParams.get('bulk') === 'true';
    
    // If clearAll is true, clear all matches from KV storage
    if (clearAll) {
      await env.IPL_CACHE.put('matches', JSON.stringify([]));
      console.log('All matches cleared from KV storage');
      return new Response(JSON.stringify({ success: true, message: 'All matches cleared successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bulk delete matches in one request (atomic KV write)
    if (bulkDelete) {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const matchIds = Array.isArray(body.matchIds) ? body.matchIds.map(String).filter(Boolean) : [];
      if (!matchIds.length) {
        return new Response(JSON.stringify({ error: 'matchIds array is required for bulk delete' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let matches = await env.IPL_CACHE.get('matches', 'json');
      const kvExists = await env.IPL_CACHE.get('matches');
      if (kvExists === null) {
        matches = [];
      } else {
        matches = matches || [];
      }

      const idSet = new Set(matchIds);
      const existingIds = new Set(matches.map((m) => String(m.id)));
      const notFound = matchIds.filter((id) => !existingIds.has(id));

      const remainingMatches = matches.filter((m) => !idSet.has(String(m.id)));
      const deleted = matches.length - remainingMatches.length;

      await env.IPL_CACHE.put('matches', JSON.stringify(remainingMatches));

      return new Response(JSON.stringify({
        success: true,
        deleted,
        requested: matchIds.length,
        notFound,
        message: `Deleted ${deleted} match(es)`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required or use clearAll=true to clear all matches' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
    // Ensure all matches have league property
    matches = matches.map(m => ({
      ...m,
      league: m.league || 'ipl'
    }));
    
    // Find the match to delete
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex === -1) {
      console.error(`Match with ID ${matchId} not found. Total matches: ${matches.length}`);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Remove the match
    matches.splice(matchIndex, 1);
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    console.log(`Match ${matchId} deleted successfully. Remaining matches: ${matches.length}`);
    
    return new Response(JSON.stringify({ success: true, message: 'Match deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    return new Response(JSON.stringify({ error: `Failed to delete match: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main request handler
export async function onRequest(context) {
  const { request } = context;
  const method = request.method;
  const url = new URL(request.url);
  
  // Enable CORS for your domain
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  const hasAuth = Boolean(request.headers.get('authorization') || request.headers.get('Authorization'));
  const bypassCache =
    request.headers.get('cache-control')?.includes('no-cache') || url.searchParams.get('nocache') === '1';
  const shouldCache = method === 'GET' && !hasAuth && !bypassCache;
  const cache = shouldCache && typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = cache ? new Request(request.url, request) : null;

  if (cache && cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  let response;
  
  switch (method) {
    case 'GET':
      response = await handleGetRequest(context);
      break;
    case 'POST': {
      const postUrl = new URL(request.url);
      response = postUrl.searchParams.get('bulk') === 'true'
        ? await handleBulkPostRequest(context)
        : await handlePostRequest(context);
      break;
    }
    case 'PUT': {
      const putUrl = new URL(request.url);
      response = putUrl.searchParams.get('bulkStatus') === 'true'
        ? await handleBulkPutRequest(context)
        : await handlePutRequest(context);
      break;
    }
    case 'DELETE':
      response = await handleDeleteRequest(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
  
  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (cache && cacheKey && response.ok) {
    const cacheTtl = url.searchParams.get('id') ? 10 : 30;
    response.headers.set('Cache-Control', `public, max-age=${cacheTtl}`);
    if (context.waitUntil) {
      context.waitUntil(cache.put(cacheKey, response.clone()));
    } else {
      cache.put(cacheKey, response.clone());
    }
  }
  
  return response;
}
