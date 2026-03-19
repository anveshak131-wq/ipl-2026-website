// Teams API (Cloudflare Pages Function)
// Persists team edits from the admin panel in KV (env.IPL_CACHE, key: "teams").

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

const HISTORICAL_IPL_TEAM_IDS = new Set(['16', '17', '18', '19', '20']);
const WPL_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);

function normalizeTeamId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw.replace(/^team/i, '');
}

function normalizeLeague(value, id) {
  if (value === 'ipl' || value === 'wpl') return value;
  const normalizedId = normalizeTeamId(id);
  return WPL_TEAM_IDS.has(normalizedId) ? 'wpl' : 'ipl';
}

function toTimestamp(value) {
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function selectBestTeamMatch(teams, query) {
  const rawQuery = String(query ?? '').trim();
  if (!rawQuery) return null;

  const normalizedIdQuery = normalizeTeamId(rawQuery);
  const isNumericQuery = /^\d+$/.test(normalizedIdQuery);
  const slugLower = rawQuery.toLowerCase();

  let best = null;
  let bestScore = -1;
  let bestUpdatedAt = 0;

  for (const team of teams || []) {
    if (!team) continue;

    const teamId = normalizeTeamId(team.id);
    const shortNameLower = String(team.shortName || '').toLowerCase();
    const nameLower = String(team.name || '').toLowerCase();
    const aliasesLower = Array.isArray(team.aliases)
      ? team.aliases.map((a) => String(a || '').toLowerCase())
      : [];

    let score = 0;

    if (isNumericQuery) {
      if (teamId === normalizedIdQuery) score = 100;
    } else if (shortNameLower) {
      if (shortNameLower === slugLower) score = 100;
      else if (shortNameLower.replace('-w', '') === slugLower) score = 90;
      else if (
        shortNameLower.includes(slugLower) ||
        slugLower.includes(shortNameLower.replace('-w', ''))
      )
        score = 70;
    }

    if (score === 0 && nameLower) {
      if (nameLower === slugLower) score = 60;
      else if (nameLower.includes(slugLower)) score = 40;
    }

    if (score === 0 && aliasesLower.length > 0) {
      if (aliasesLower.includes(slugLower)) score = 50;
    }

    if (score === 0) continue;

    const updatedAt = Math.max(toTimestamp(team.updatedAt), toTimestamp(team.createdAt));
    if (
      score > bestScore ||
      (score === bestScore && updatedAt > bestUpdatedAt) ||
      (score === bestScore && updatedAt === bestUpdatedAt && teamId && best && teamId < normalizeTeamId(best.id))
    ) {
      best = team;
      bestScore = score;
      bestUpdatedAt = updatedAt;
    }
  }

  return best;
}

function getBearerToken(request) {
  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  const lowered = token.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return null;
  return token;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...noCacheHeaders,
      ...extraHeaders,
    },
  });
}

function buildSeedTeams() {
  const wplTeams = [
    {
      id: '12',
      name: 'Royal Challengers Bangalore Women',
      shortName: 'RCB-W',
      league: 'wpl',
      logo: '/logos/wpl_rcb_logo_animated.svg',
      colors: { primary: '#EC1C24', secondary: '#000000' },
      description: "RCB Women's team",
      trophies: [{ year: 2024, name: 'WPL Champions' }],
      homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru'],
    },
    {
      id: '11',
      name: 'Mumbai Indians Women',
      shortName: 'MI-W',
      league: 'wpl',
      logo: '/logos/wpl_mi_logo_animated.svg',
      colors: { primary: '#004BA0', secondary: '#D1AB3E' },
      description: "MI Women's team",
      trophies: [{ year: 2023, name: 'WPL Champions' }],
      homeGrounds: ['Wankhede Stadium, Mumbai'],
    },
    {
      id: '13',
      name: 'Delhi Capitals Women',
      shortName: 'DC-W',
      league: 'wpl',
      logo: '/logos/wpl_dc_logo_animated.svg',
      colors: { primary: '#0078BC', secondary: '#EF1B26' },
      description: "DC Women's team",
      trophies: [],
      homeGrounds: ['Arun Jaitley Stadium, Delhi'],
    },
    {
      id: '14',
      name: 'Gujarat Giants Women',
      shortName: 'GG',
      league: 'wpl',
      logo: '/logos/wpl_gg_logo_animated.svg',
      colors: { primary: '#F97316', secondary: '#FFD700' },
      description: "Gujarat Giants Women's team",
      trophies: [],
      homeGrounds: ['Narendra Modi Stadium, Ahmedabad'],
    },
    {
      id: '15',
      name: 'UP Warriorz Women',
      shortName: 'UPW',
      league: 'wpl',
      logo: '/logos/wpl_upw_logo_animated.svg',
      colors: { primary: '#059669', secondary: '#F97316' },
      description: "UP Warriorz Women's team",
      trophies: [],
      homeGrounds: [
        'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
      ],
    },
  ];

  const iplTeams = [
    {
      id: '1',
      name: 'Royal Challengers Bangalore',
      shortName: 'RCB',
      league: 'ipl',
      logo: '/logos/rcb_logo_premium.svg',
      colors: { primary: '#EC1C24', secondary: '#000000' },
      description: 'RCB team',
      trophies: [],
      homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru'],
    },
    {
      id: '2',
      name: 'Mumbai Indians',
      shortName: 'MI',
      league: 'ipl',
      logo: '/logos/mi_logo_2026.svg',
      colors: { primary: '#004BA0', secondary: '#D1AB3E' },
      description: 'MI team',
      trophies: [
        { year: 2013, name: 'IPL Champions' },
        { year: 2015, name: 'IPL Champions' },
        { year: 2017, name: 'IPL Champions' },
        { year: 2019, name: 'IPL Champions' },
        { year: 2020, name: 'IPL Champions' },
      ],
      homeGrounds: ['Wankhede Stadium, Mumbai'],
    },
    {
      id: '3',
      name: 'Sunrisers Hyderabad',
      shortName: 'SRH',
      league: 'ipl',
      logo: '/logos/srh_logo_2026.svg',
      colors: { primary: '#FF822D', secondary: '#000000' },
      description: 'SRH team',
      trophies: [{ year: 2016, name: 'IPL Champions' }],
      homeGrounds: ['Rajiv Gandhi International Stadium, Hyderabad'],
    },
    {
      id: '4',
      name: 'Gujarat Titans',
      shortName: 'GT',
      league: 'ipl',
      logo: '/logos/gt_logo_2026.svg',
      colors: { primary: '#F97316', secondary: '#FFD700' },
      description: 'GT team',
      trophies: [{ year: 2022, name: 'IPL Champions' }],
      homeGrounds: ['Narendra Modi Stadium, Ahmedabad'],
    },
    {
      id: '5',
      name: 'Punjab Kings',
      shortName: 'PBKS',
      aliases: ['Kings XI Punjab', 'Kings Eleven Punjab'],
      league: 'ipl',
      logo: '/logos/pbks_logo_2026.svg',
      colors: { primary: '#ED1C24', secondary: '#000000' },
      description: 'PBKS team',
      trophies: [],
      homeGrounds: ['Punjab Cricket Association Stadium, Mohali'],
    },
    {
      id: '6',
      name: 'Delhi Capitals',
      aliases: ['Delhi Daredevils'],
      shortName: 'DC',
      league: 'ipl',
      logo: '/logos/dc_logo_2026.svg',
      colors: { primary: '#0078BC', secondary: '#EF1B26' },
      description: 'DC team',
      trophies: [],
      homeGrounds: ['Arun Jaitley Stadium, Delhi'],
    },
    {
      id: '7',
      name: 'Lucknow Super Giants',
      shortName: 'LSG',
      league: 'ipl',
      logo: '/logos/lsg_logo_2026.svg',
      colors: { primary: '#334154', secondary: '#FFB81C' },
      description: 'LSG team',
      trophies: [],
      homeGrounds: [
        'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
      ],
    },
    {
      id: '8',
      name: 'Rajasthan Royals',
      shortName: 'RR',
      league: 'ipl',
      logo: '/logos/rr_logo_2026.svg',
      colors: { primary: '#EC1C24', secondary: '#000000' },
      description: 'RR team',
      trophies: [{ year: 2008, name: 'IPL Champions' }],
      homeGrounds: ['Sawai Mansingh Stadium, Jaipur'],
    },
    {
      id: '9',
      name: 'Kolkata Knight Riders',
      shortName: 'KKR',
      league: 'ipl',
      logo: '/logos/kkr_logo_2026.svg',
      colors: { primary: '#3A225D', secondary: '#000000' },
      description: 'KKR team',
      trophies: [
        { year: 2012, name: 'IPL Champions' },
        { year: 2014, name: 'IPL Champions' },
        { year: 2024, name: 'IPL Champions' },
      ],
      homeGrounds: ['Eden Gardens, Kolkata'],
    },
    {
      id: '10',
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      league: 'ipl',
      logo: '/logos/csk_logo_2026.svg',
      colors: { primary: '#FFFF00', secondary: '#0081E8' },
      description: 'CSK team',
      trophies: [
        { year: 2010, name: 'IPL Champions' },
        { year: 2011, name: 'IPL Champions' },
        { year: 2018, name: 'IPL Champions' },
        { year: 2021, name: 'IPL Champions' },
        { year: 2023, name: 'IPL Champions' },
      ],
      homeGrounds: ['M. A. Chidambaram Stadium, Chennai'],
    },
  ];

  const historicalIplTeams = [
    {
      id: '16',
      name: 'Gujarat Lions',
      shortName: 'GL',
      league: 'ipl',
      logo: '/logos/tba_logo.svg',
      colors: { primary: '#F28C28', secondary: '#1B365D' },
      description: 'Historical IPL team (2016-2017)',
      trophies: [],
      homeGrounds: ['Saurashtra Cricket Association Stadium, Rajkot'],
    },
    {
      id: '17',
      name: 'Rising Pune Supergiant',
      shortName: 'RPS',
      aliases: ['Rising Pune Supergiants'],
      league: 'ipl',
      logo: '/logos/tba_logo.svg',
      colors: { primary: '#6A1B9A', secondary: '#F06292' },
      description: 'Historical IPL team (2016-2017)',
      trophies: [],
      homeGrounds: ['Maharashtra Cricket Association Stadium, Pune'],
    },
    {
      id: '18',
      name: 'Deccan Chargers',
      shortName: 'DCG',
      league: 'ipl',
      logo: '/logos/tba_logo.svg',
      colors: { primary: '#1E3A8A', secondary: '#F59E0B' },
      description: 'Historical IPL team (2008-2012)',
      trophies: [{ year: 2009, name: 'IPL Champions' }],
      homeGrounds: ['Rajiv Gandhi International Stadium, Hyderabad'],
    },
    {
      id: '19',
      name: 'Kochi Tuskers Kerala',
      shortName: 'KTK',
      league: 'ipl',
      logo: '/logos/tba_logo.svg',
      colors: { primary: '#0F766E', secondary: '#F97316' },
      description: 'Historical IPL team (2011)',
      trophies: [],
      homeGrounds: ['Jawaharlal Nehru Stadium, Kochi'],
    },
    {
      id: '20',
      name: 'Pune Warriors India',
      shortName: 'PWI',
      league: 'ipl',
      logo: '/logos/tba_logo.svg',
      colors: { primary: '#2563EB', secondary: '#FACC15' },
      description: 'Historical IPL team (2011-2013)',
      trophies: [],
      homeGrounds: ['Maharashtra Cricket Association Stadium, Pune'],
    },
  ];

  return [...iplTeams, ...wplTeams, ...historicalIplTeams];
}

async function readTeamsFromKV(env) {
  if (!env || !env.IPL_CACHE) {
    return { teams: null, error: 'KV binding IPL_CACHE is missing' };
  }

  const kv = env.IPL_CACHE;

  try {
    const teams = await kv.get('teams', { type: 'json', cacheTtl: 0 });
    return { teams: Array.isArray(teams) ? teams : null, error: null };
  } catch (errorWithCacheTtl) {
    try {
      const teams = await kv.get('teams', { type: 'json' });
      return { teams: Array.isArray(teams) ? teams : null, error: null };
    } catch (errorWithOptionsObject) {
      try {
        const teams = await kv.get('teams', 'json');
        return { teams: Array.isArray(teams) ? teams : null, error: null };
      } catch (errorWithTypeString) {
        console.error('Teams API: Failed to read teams from KV:', {
          errorWithCacheTtl,
          errorWithOptionsObject,
          errorWithTypeString,
        });
        return { teams: null, error: 'Failed to read teams from KV' };
      }
    }
  }
}

async function writeTeamsToKV(env, teams) {
  try {
    if (!env || !env.IPL_CACHE) return false;
    await env.IPL_CACHE.put('teams', JSON.stringify(teams));
    return true;
  } catch (error) {
    console.error('Teams API: Failed to write teams to KV:', error);
    return false;
  }
}

function teamCompletenessScore(team) {
  if (!team) return 0;
  let score = 0;
  if (team.name) score += 2;
  if (team.shortName) score += 2;
  if (team.logo) score += 1;
  if (team.description) score += 1;
  if (Array.isArray(team.trophies)) score += Math.min(team.trophies.length, 10);
  if (Array.isArray(team.homeGrounds)) score += Math.min(team.homeGrounds.length, 5);
  return score;
}

function dedupeTeamsByKey(teams) {
  if (!Array.isArray(teams)) return { teams: [], changed: false };

  const byKey = new Map();
  let changed = false;

  for (const rawTeam of teams) {
    if (!rawTeam || rawTeam.id === undefined || rawTeam.id === null) {
      changed = true;
      continue;
    }

    const id = normalizeTeamId(rawTeam.id);
    if (!id) {
      changed = true;
      continue;
    }

    const league = normalizeLeague(rawTeam.league, id);
    const normalizedTeam =
      rawTeam.id === id && rawTeam.league === league ? rawTeam : { ...rawTeam, id, league };
    const key = `${league}:${id}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, normalizedTeam);
      continue;
    }

    const existingUpdated = Math.max(toTimestamp(existing.updatedAt), toTimestamp(existing.createdAt));
    const candidateUpdated = Math.max(
      toTimestamp(normalizedTeam.updatedAt),
      toTimestamp(normalizedTeam.createdAt),
    );

    if (candidateUpdated > existingUpdated) {
      byKey.set(key, normalizedTeam);
    } else if (candidateUpdated === existingUpdated) {
      const existingScore = teamCompletenessScore(existing);
      const candidateScore = teamCompletenessScore(normalizedTeam);
      if (candidateScore > existingScore) {
        byKey.set(key, normalizedTeam);
      }
    }

    changed = true;
  }

  if (byKey.size !== teams.length) changed = true;

  return { teams: Array.from(byKey.values()), changed };
}

function mergeSeedIntoStored(seedTeams, storedTeams) {
  if (!Array.isArray(storedTeams)) {
    return { teams: seedTeams, changed: true };
  }

  const storedById = new Map();
  for (const raw of storedTeams) {
    if (!raw || raw.id === undefined || raw.id === null) continue;
    const id = normalizeTeamId(raw.id);
    const league = normalizeLeague(raw.league, id);
    storedById.set(`${league}:${id}`, { ...raw, id, league });
  }

  const usedKeys = new Set();
  let changed = storedTeams.length !== seedTeams.length;

  const merged = seedTeams.map((seed) => {
    const id = normalizeTeamId(seed.id);
    const league = normalizeLeague(seed.league, id);
    const key = `${league}:${id}`;
    const stored = storedById.get(key);
    usedKeys.add(key);
    if (!stored) {
      changed = true;
      return { ...seed, id, league };
    }
    if (stored.id !== id || stored.league !== league) changed = true;
    return { ...seed, ...stored, id, league };
  });

  for (const [key, stored] of storedById.entries()) {
    if (usedKeys.has(key)) continue;
    changed = true;
    merged.push(stored);
  }

  return { teams: merged, changed };
}

async function loadTeams(env) {
  const seedTeams = buildSeedTeams();
  const storedResult = await readTeamsFromKV(env);
  const storedTeams = storedResult.teams;

  if (storedResult.error) {
    // If we cannot read from KV (binding missing or runtime error), do NOT overwrite KV with seed data.
    // Returning seed-only keeps the site functional without destroying existing KV state.
    return { teams: seedTeams, source: 'seed-only' };
  }

  if (!storedTeams || storedTeams.length === 0) {
    const persisted = await writeTeamsToKV(env, seedTeams);
    return { teams: seedTeams, source: persisted ? 'seeded' : 'seed-only' };
  }

  const storedDeduped = dedupeTeamsByKey(storedTeams);
  const { teams: merged, changed: mergedChanged } = mergeSeedIntoStored(seedTeams, storedDeduped.teams);
  const mergedDeduped = dedupeTeamsByKey(merged);

  if (storedDeduped.changed || mergedChanged || mergedDeduped.changed) {
    await writeTeamsToKV(env, mergedDeduped.teams);
  }
  return { teams: mergedDeduped.teams, source: 'kv' };
}

function filterTeamsForQuery(teams, league, includeHistorical) {
  let result = Array.isArray(teams) ? teams : [];

  if (league === 'ipl' || league === 'wpl') {
    result = result.filter((team) => normalizeLeague(team?.league, team?.id) === league);
  }

  if (!includeHistorical) {
    result = result.filter((team) => {
      const teamLeague = normalizeLeague(team?.league, team?.id);
      if (teamLeague !== 'ipl') return true;
      const id = normalizeTeamId(team?.id);
      return !HISTORICAL_IPL_TEAM_IDS.has(id);
    });
  }

  return result;
}

function getNextNumericId(teams) {
  let max = 0;
  for (const team of teams || []) {
    const numeric = Number.parseInt(normalizeTeamId(team?.id), 10);
    if (Number.isFinite(numeric)) {
      max = Math.max(max, numeric);
    }
  }
  return String(max + 1);
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method === 'GET') {
    const league = url.searchParams.get('league');
    const includeHistorical = url.searchParams.get('includeHistorical') === 'true';
    const teamQuery = url.searchParams.get('teamId');

    const loaded = await loadTeams(env);
    const allTeams = loaded.teams;
    const source = loaded.source;

    const responseTeams = filterTeamsForQuery(allTeams, league, includeHistorical);
    if (teamQuery) {
      const best = selectBestTeamMatch(responseTeams, teamQuery);
      return json(best ? [best] : [], 200, { 'X-Teams-Source': source });
    }
    return json(responseTeams, 200, { 'X-Teams-Source': source });
  }

  // Admin-only mutations (basic bearer presence check).
  const token = getBearerToken(request);
  if (!token) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!env || !env.IPL_CACHE) {
    return json(
      {
        error:
          'KV binding IPL_CACHE is missing. Configure KV namespace binding "IPL_CACHE" in Cloudflare Pages > Settings > Functions.',
      },
      500,
    );
  }

  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const loaded = await loadTeams(env);
    const teams = loaded.teams;
    const nextId = getNextNumericId(teams);
    const league = normalizeLeague(body?.league, nextId);
    const createdTeam = {
      id: nextId,
      league,
      name: body?.name || `Team ${nextId}`,
      shortName: body?.shortName || `T${nextId}`,
      aliases: Array.isArray(body?.aliases) ? body.aliases : undefined,
      logo: body?.logo || '/logos/tba_logo.svg',
      description: body?.description || '',
      colors: body?.colors || { primary: '#6B46C1', secondary: '#FFD700' },
      trophies: Array.isArray(body?.trophies) ? body.trophies : [],
      homeGrounds: Array.isArray(body?.homeGrounds) ? body.homeGrounds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teams.push(createdTeam);
    const persisted = await writeTeamsToKV(env, teams);
    if (!persisted) {
      return json({ error: 'Failed to persist team changes' }, 500);
    }
    return json(createdTeam, 201);
  }

  if (method === 'PUT') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const rawId = body?.id;
    const normalizedId = normalizeTeamId(rawId);
    if (!normalizedId) {
      return json({ error: 'id is required' }, 400);
    }

    const loaded = await loadTeams(env);
    const teams = loaded.teams;
    const desiredLeague =
      body?.league !== undefined && body?.league !== null
        ? normalizeLeague(body.league, normalizedId)
        : null;
    const matchingIndexes = [];
    for (let i = 0; i < teams.length; i += 1) {
      const team = teams[i];
      if (normalizeTeamId(team?.id) !== normalizedId) continue;
      if (desiredLeague && normalizeLeague(team?.league, team?.id) !== desiredLeague) continue;
      matchingIndexes.push(i);
    }

    const nowIso = new Date().toISOString();
    if (matchingIndexes.length === 0) {
      const created = {
        id: normalizedId,
        league: desiredLeague || normalizeLeague(body?.league, normalizedId),
        name: body?.name || `Team ${normalizedId}`,
        shortName: body?.shortName || `T${normalizedId}`,
        aliases: Array.isArray(body?.aliases) ? body.aliases : undefined,
        logo: body?.logo || '/logos/tba_logo.svg',
        description: body?.description || '',
        colors: body?.colors || { primary: '#6B46C1', secondary: '#FFD700' },
        trophies: Array.isArray(body?.trophies) ? body.trophies : [],
        homeGrounds: Array.isArray(body?.homeGrounds) ? body.homeGrounds : [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      teams.push(created);
      const persisted = await writeTeamsToKV(env, teams);
      if (!persisted) {
        return json({ error: 'Failed to persist team changes' }, 500);
      }
      return json(created, 200);
    }

    let firstUpdated = null;
    for (const index of matchingIndexes) {
      const current = teams[index] || {};
      const updatedTeam = {
        ...current,
        ...body,
        id: normalizedId,
        league: normalizeLeague(body?.league ?? current.league, normalizedId),
        updatedAt: nowIso,
      };

      if (body?.trophies !== undefined) {
        updatedTeam.trophies = Array.isArray(body.trophies) ? body.trophies : [];
      }
      if (body?.homeGrounds !== undefined) {
        updatedTeam.homeGrounds = Array.isArray(body.homeGrounds) ? body.homeGrounds : [];
      }

      teams[index] = updatedTeam;
      if (!firstUpdated) firstUpdated = updatedTeam;
    }

    const persisted = await writeTeamsToKV(env, teams);
    if (!persisted) {
      return json({ error: 'Failed to persist team changes' }, 500);
    }
    return json(firstUpdated || teams[matchingIndexes[0]] || null, 200);
  }

  if (method === 'DELETE') {
    const rawId = url.searchParams.get('id');
    const normalizedId = normalizeTeamId(rawId);
    if (!normalizedId) {
      return json({ error: 'id query param is required' }, 400);
    }

    const loaded = await loadTeams(env);
    const teams = loaded.teams;
    const remaining = teams.filter((team) => normalizeTeamId(team?.id) !== normalizedId);
    if (remaining.length === teams.length) {
      return json({ error: 'Team not found' }, 404);
    }

    const persisted = await writeTeamsToKV(env, remaining);
    if (!persisted) {
      return json({ error: 'Failed to persist team changes' }, 500);
    }
    return json({ success: true, id: normalizedId }, 200);
  }

  return json({ error: 'Method not allowed' }, 405, {
    Allow: 'GET, POST, PUT, DELETE, OPTIONS',
  });
}
