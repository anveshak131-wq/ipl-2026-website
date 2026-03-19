// Teams API (Cloudflare Pages Function)
// Persists team edits from the admin panel in KV (env.IPL_CACHE, key: "teams").

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  try {
    if (!env || !env.IPL_CACHE) return null;
    const teams = await env.IPL_CACHE.get('teams', 'json');
    return Array.isArray(teams) ? teams : null;
  } catch (error) {
    console.error('Teams API: Failed to read teams from KV:', error);
    return null;
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
  const storedTeams = await readTeamsFromKV(env);

  if (!storedTeams || storedTeams.length === 0) {
    await writeTeamsToKV(env, seedTeams);
    return seedTeams;
  }

  const { teams: merged, changed } = mergeSeedIntoStored(seedTeams, storedTeams);
  if (changed) {
    await writeTeamsToKV(env, merged);
  }
  return merged;
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

    const allTeams = await loadTeams(env);
    const responseTeams = filterTeamsForQuery(allTeams, league, includeHistorical);
    return json(responseTeams);
  }

  // Admin-only mutations (basic bearer presence check).
  const token = getBearerToken(request);
  if (!token) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const teams = await loadTeams(env);
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
    await writeTeamsToKV(env, teams);
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

    const teams = await loadTeams(env);
    const index = teams.findIndex((team) => normalizeTeamId(team?.id) === normalizedId);

    const nowIso = new Date().toISOString();
    if (index === -1) {
      const created = {
        id: normalizedId,
        league: normalizeLeague(body?.league, normalizedId),
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
      await writeTeamsToKV(env, teams);
      return json(created, 200);
    }

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
    await writeTeamsToKV(env, teams);
    return json(updatedTeam, 200);
  }

  if (method === 'DELETE') {
    const rawId = url.searchParams.get('id');
    const normalizedId = normalizeTeamId(rawId);
    if (!normalizedId) {
      return json({ error: 'id query param is required' }, 400);
    }

    const teams = await loadTeams(env);
    const remaining = teams.filter((team) => normalizeTeamId(team?.id) !== normalizedId);
    if (remaining.length === teams.length) {
      return json({ error: 'Team not found' }, 404);
    }

    await writeTeamsToKV(env, remaining);
    return json({ success: true, id: normalizedId }, 200);
  }

  return json({ error: 'Method not allowed' }, 405, {
    Allow: 'GET, POST, PUT, DELETE, OPTIONS',
  });
}

