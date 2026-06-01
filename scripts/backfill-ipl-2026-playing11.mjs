const SITE_BASE = process.env.SITE_BASE || 'https://ipl-2026-website.pages.dev';
const OFFICIAL_FEED_BASE = 'https://scores.iplt20.com/ipl/feeds';
const SCHEDULE_URL = `${OFFICIAL_FEED_BASE}/284-matchschedule.js`;
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const INCLUDE_POPULATED = process.argv.includes('--include-populated');
const MATCH_IDS_ARG = process.argv.find((arg) => arg.startsWith('--match-ids='));
const TARGET_MATCH_IDS = new Set(
  String(MATCH_IDS_ARG ? MATCH_IDS_ARG.split('=')[1] : '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const ADMIN_BEARER = process.env.ADMIN_BEARER || 'codex-backfill';

const PLAYER_NAME_ALIASES = new Map([
  ['mohd arshad khan', 'arshad khan'],
  ['mohammed arshad khan', 'arshad khan'],
  ['m siddharth', 'manimaran siddharth'],
  ['n jagadeesan', 'narayan jagadeesan'],
  ['r ashwin', 'ravichandran ashwin'],
  ['lungisani ngidi', 'lungi ngidi'],
  ['shahrukh khan', 'm shahrukh khan'],
  ['vyshak vijaykumar', 'vijaykumar vyshak'],
  ['am ghazanfar', 'allah ghazanfar'],
  ['rasikh dar', 'rasikh salam'],
  ['raj angad bawa', 'raj bawa'],
  ['mohammad shami', 'mohammed shami'],
  ['shahbaz ahamad', 'shahbaz ahmed'],
  ['dewald brevis', 'dewald brevis'],
  ['ishan kishan', 'ishan kishan'],
]);

const KNOWN_MISSING_PLAYER_PROFILES = [
  {
    name: 'Navdeep Saini',
    teamId: '9',
    role: 'Bowler',
    nationality: 'India',
    battingStyle: 'Right-handed bat',
    bowlingStyle: 'Right-arm fast',
  },
  {
    name: 'Krish Bhagat',
    teamId: '2',
    role: 'All-rounder',
    nationality: 'India',
    battingStyle: 'Right-handed bat',
    bowlingStyle: 'Right-arm medium',
  },
  {
    name: 'Dilshan Madushanka',
    teamId: '3',
    role: 'Bowler',
    nationality: 'Sri Lanka',
    battingStyle: 'Left-handed bat',
    bowlingStyle: 'Left-arm medium',
  },
  {
    name: 'Dasun Shanaka',
    teamId: '8',
    role: 'All-rounder',
    nationality: 'Sri Lanka',
    battingStyle: 'Right-handed bat',
    bowlingStyle: 'Right-arm medium',
  },
  {
    name: 'Spencer Johnson',
    teamId: '10',
    role: 'Bowler',
    nationality: 'Australia',
    battingStyle: 'Left-handed bat',
    bowlingStyle: 'Left-arm fast',
  },
  {
    name: 'Tejasvi Singh',
    teamId: '9',
    role: 'Wicket-keeper',
    nationality: 'India',
    battingStyle: 'Right-handed bat',
    bowlingStyle: 'N/A (Wicket-keeper)',
  },
];

const KNOWN_PLAYER_CORRECTIONS = [
  {
    name: 'Harshit Rana',
    teamId: '9',
    updates: {
      isActiveInSquad: false,
      squadStatus: 'inactive',
      squadExitReason: 'injury_replacement',
    },
  },
  {
    name: 'Atharva Ankolekar',
    teamId: '2',
    updates: {
      isActiveInSquad: false,
      squadStatus: 'inactive',
      squadExitReason: 'injury_replacement',
    },
  },
  {
    name: 'Brydon Carse',
    teamId: '3',
    updates: {
      isActiveInSquad: false,
      squadStatus: 'inactive',
      squadExitReason: 'injury_replacement',
    },
  },
  {
    name: 'Sam Curran',
    teamId: '8',
    updates: {
      isActiveInSquad: false,
      squadStatus: 'inactive',
      squadExitReason: 'injury_replacement',
    },
  },
  {
    name: 'Nathan Ellis',
    teamId: '10',
    updates: {
      isActiveInSquad: false,
      squadStatus: 'inactive',
      squadExitReason: 'injury_replacement',
    },
  },
  {
    name: 'Tejasvi Dahiya',
    teamId: '9',
    updates: {
      name: 'Tejasvi Singh',
    },
  },
];

function collapseWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanPlayerDisplayName(value) {
  return collapseWhitespace(
    String(value || '')
      .replace(/\((?:c|wk|ip|rp)\)/gi, ' ')
      .replace(/\(([^)]+)\)\s*$/, (match, group) => {
        const trimmed = String(group || '').trim();
        if (/^(?:c|wk|ip|rp|cs|sub)$/i.test(trimmed)) return ' ';
        return match;
      })
  );
}

function normalizeName(value) {
  const cleaned = cleanPlayerDisplayName(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bmd\b/g, 'mohammed')
    .replace(/\bmohd\b/g, 'mohammed')
    .replace(/\bmohammad\b/g, 'mohammed')
    .replace(/\bahamad\b/g, 'ahmed')
    .replace(/\bahmad\b/g, 'ahmed')
    .replace(/\bsurya kumar\b/g, 'suryakumar')
    .replace(/\bk l\b/g, 'kl')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return PLAYER_NAME_ALIASES.get(cleaned) || cleaned;
}

function normalizeTeamCode(value) {
  return collapseWhitespace(value).toUpperCase();
}

function stripJsonp(text) {
  return String(text || '').trim().replace(/^[^(]+\(/, '').replace(/\);\s*$/, '');
}

function parseJsonp(text) {
  return JSON.parse(stripJsonp(text));
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchTextOrNull(url, init) {
  const response = await fetch(url, init);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.text();
}

async function createPlayer(profile) {
  const response = await fetch(`${SITE_BASE}/api/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_BEARER}`,
    },
    body: JSON.stringify({
      league: 'ipl',
      teamId: profile.teamId,
      name: profile.name,
      role: profile.role,
      nationality: profile.nationality,
      battingStyle: profile.battingStyle,
      bowlingStyle: profile.bowlingStyle,
      stats: {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed creating player ${profile.name}: ${response.status} ${text}`);
  }

  return response.json();
}

async function updatePlayer(player, updates) {
  const response = await fetch(`${SITE_BASE}/api/players`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_BEARER}`,
    },
    body: JSON.stringify({
      ...player,
      ...updates,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed updating player ${player.name}: ${response.status} ${text}`);
  }

  return response.json();
}

function officialNameToCode(name) {
  const normalized = collapseWhitespace(name).toLowerCase();
  if (normalized.includes('challengers')) return 'RCB';
  if (normalized.includes('mumbai')) return 'MI';
  if (normalized.includes('super kings')) return 'CSK';
  if (normalized.includes('knight riders')) return 'KKR';
  if (normalized.includes('gujarat titans')) return 'GT';
  if (normalized.includes('sunrisers')) return 'SRH';
  if (normalized.includes('rajasthan')) return 'RR';
  if (normalized.includes('punjab')) return 'PBKS';
  if (normalized.includes('delhi')) return 'DC';
  if (normalized.includes('lucknow')) return 'LSG';
  return '';
}

function buildOfficialLookup(scheduleItems) {
  const byExact = new Map();
  const byUnordered = new Map();

  for (const item of scheduleItems) {
    const code1 = normalizeTeamCode(
      item.HomeTeamCode || officialNameToCode(item.HomeTeamName || item.MatchName?.split(' vs ')[0] || '')
    );
    const code2 = normalizeTeamCode(
      item.AwayTeamCode || officialNameToCode(item.AwayTeamName || item.MatchName?.split(' vs ')[1] || '')
    );
    if (!code1 || !code2) continue;

    const exactKey = `${item.MatchDate}|${code1}|${code2}`;
    const unorderedKey = `${item.MatchDate}|${[code1, code2].sort().join('|')}`;
    byExact.set(exactKey, item);
    if (!byUnordered.has(unorderedKey)) byUnordered.set(unorderedKey, []);
    byUnordered.get(unorderedKey).push(item);
  }

  return { byExact, byUnordered };
}

function mapInternalToOfficialMatch(match, officialLookup) {
  const code1 = normalizeTeamCode(match.team1?.shortName || '');
  const code2 = normalizeTeamCode(match.team2?.shortName || '');
  const exactKey = `${match.date}|${code1}|${code2}`;
  const unorderedKey = `${match.date}|${[code1, code2].sort().join('|')}`;
  return officialLookup.byExact.get(exactKey) || (officialLookup.byUnordered.get(unorderedKey) || [])[0] || null;
}

function buildPlayerMaps(players) {
  const byTeam = new Map();
  const global = new Map();

  for (const player of players || []) {
    const teamId = String(player.teamId || '');
    const normalized = normalizeName(player.name);
    if (!normalized) continue;
    if (!byTeam.has(teamId)) byTeam.set(teamId, new Map());
    const teamMap = byTeam.get(teamId);
    if (!teamMap.has(normalized)) teamMap.set(normalized, []);
    teamMap.get(normalized).push(player);
    if (!global.has(normalized)) global.set(normalized, []);
    global.get(normalized).push(player);
  }

  return { byTeam, global };
}

async function ensureKnownMissingPlayers(players) {
  const existingByKey = new Map(
    (players || []).map((player) => [
      `${normalizeName(player.name)}|${String(player.teamId || '')}|${player.league || 'ipl'}`,
      player,
    ])
  );
  const existingByName = new Map();
  for (const player of players || []) {
    const nameKey = `${normalizeName(player.name)}|${player.league || 'ipl'}`;
    if (!existingByName.has(nameKey)) existingByName.set(nameKey, []);
    existingByName.get(nameKey).push(player);
  }
  const nextPlayers = [...(players || [])];

  for (const profile of KNOWN_MISSING_PLAYER_PROFILES) {
    const key = `${normalizeName(profile.name)}|${profile.teamId}|ipl`;
    if (existingByKey.has(key)) continue;

    const nameMatches = existingByName.get(`${normalizeName(profile.name)}|ipl`) || [];
    const reusableExisting = nameMatches.find(
      (player) =>
        String(player.teamId || '') !== profile.teamId &&
        (player.isActiveInSquad === false ||
          player.squadStatus === 'inactive' ||
          !String(player.teamId || '').trim())
    );

    if (reusableExisting) {
      const revivalUpdates = {
        teamId: profile.teamId,
        role: profile.role,
        nationality: profile.nationality,
        battingStyle: profile.battingStyle,
        bowlingStyle: profile.bowlingStyle,
        isActiveInSquad: true,
        squadStatus: 'active',
        squadExitReason: undefined,
        squadExitDate: undefined,
      };

      if (APPLY) {
        const updated = await updatePlayer(reusableExisting, revivalUpdates);
        const index = nextPlayers.findIndex((player) => player.id === reusableExisting.id);
        if (index >= 0) nextPlayers[index] = updated;
        existingByKey.set(key, updated);
        console.log(`REVIVED_PLAYER ${updated.id} ${updated.name} team=${updated.teamId}`);
      } else {
        const updated = { ...reusableExisting, ...revivalUpdates };
        const index = nextPlayers.findIndex((player) => player.id === reusableExisting.id);
        if (index >= 0) nextPlayers[index] = updated;
        existingByKey.set(key, updated);
        console.log(`PREVIEW_REVIVED_PLAYER ${updated.id} ${updated.name} team=${updated.teamId}`);
      }
      continue;
    }

    if (APPLY) {
      const created = await createPlayer(profile);
      nextPlayers.push(created);
      existingByKey.set(key, created);
      console.log(`SEEDED_PLAYER ${created.id} ${created.name} team=${created.teamId}`);
    } else {
      const previewPlayer = {
        id: `preview-${normalizeName(profile.name).replace(/\s+/g, '-')}`,
        league: 'ipl',
        name: profile.name,
        role: profile.role,
        teamId: profile.teamId,
        nationality: profile.nationality,
        battingStyle: profile.battingStyle,
        bowlingStyle: profile.bowlingStyle,
        stats: {},
      };
      nextPlayers.push(previewPlayer);
      existingByKey.set(key, previewPlayer);
      console.log(`PREVIEW_SEEDED_PLAYER ${previewPlayer.name} team=${previewPlayer.teamId}`);
    }
  }

  return nextPlayers;
}

async function ensureKnownPlayerCorrections(players) {
  const nextPlayers = [...(players || [])];

  for (const correction of KNOWN_PLAYER_CORRECTIONS) {
    const index = nextPlayers.findIndex(
      (player) =>
        normalizeName(player.name) === normalizeName(correction.name) &&
        String(player.teamId || '') === correction.teamId
    );
    if (index === -1) continue;

    const current = nextPlayers[index];
    const changed = Object.entries(correction.updates).some(([key, value]) => current[key] !== value);
    if (!changed) continue;

    if (APPLY) {
      const updated = await updatePlayer(current, correction.updates);
      nextPlayers[index] = updated;
      console.log(`CORRECTED_PLAYER ${updated.id} ${current.name} -> ${updated.name}`);
    } else {
      nextPlayers[index] = {
        ...current,
        ...correction.updates,
      };
      console.log(
        `PREVIEW_CORRECTED_PLAYER ${current.id} ${current.name} -> ${nextPlayers[index].name}`
      );
    }
  }

  return nextPlayers;
}

function findFuzzyPlayerMatch(teamPlayers, normalized) {
  if (!Array.isArray(teamPlayers) || !normalized) return null;
  const targetTokens = normalized.split(' ').filter(Boolean);
  const targetCompact = normalized.replace(/\s+/g, '');
  let subsetMatch = null;

  for (const player of teamPlayers) {
    const localNormalized = normalizeName(player.name);
    if (!localNormalized) continue;
    if (localNormalized === normalized) return player;
    if (localNormalized.replace(/\s+/g, '') === targetCompact) return player;

    const localTokens = localNormalized.split(' ').filter(Boolean);
    if (
      targetTokens.length >= 2 &&
      localTokens.length >= 2 &&
      localTokens[0] === targetTokens[0] &&
      localTokens[localTokens.length - 1] === targetTokens[targetTokens.length - 1]
    ) {
      if (localTokens.includes(targetTokens[1]) || targetTokens.includes(localTokens[1])) {
        return player;
      }
    }

    if (
      targetTokens.length >= 2 &&
      localTokens.length >= 2 &&
      localTokens[localTokens.length - 1] === targetTokens[targetTokens.length - 1] &&
      (localTokens[0].startsWith(targetTokens[0]) || targetTokens[0].startsWith(localTokens[0]))
    ) {
      return player;
    }

    const commonTokens = targetTokens.filter((token) => localTokens.includes(token));
    if (!subsetMatch && commonTokens.length >= Math.min(2, targetTokens.length)) {
      subsetMatch = player;
    }
  }

  return subsetMatch;
}

function resolveLocalPlayerId({ teamId, officialName, fallbackOfficialId, playerMaps, unmatched }) {
  const normalized = normalizeName(officialName);
  const teamKey = String(teamId || '');
  const teamMap = playerMaps.byTeam.get(teamKey);
  const teamMatches = teamMap?.get(normalized) || [];
  if (teamMatches.length >= 1) return String(teamMatches[0].id);

  const fuzzyTeamPlayers = teamMap ? Array.from(teamMap.values()).flat() : [];
  const fuzzyMatch = findFuzzyPlayerMatch(fuzzyTeamPlayers, normalized);
  if (fuzzyMatch) return String(fuzzyMatch.id);

  const globalMatches = playerMaps.global.get(normalized) || [];
  if (globalMatches.length === 1) return String(globalMatches[0].id);

  unmatched.push({
    teamId: teamKey,
    officialName: cleanPlayerDisplayName(officialName),
    normalized,
    fallbackOfficialId: String(fallbackOfficialId || ''),
  });
  return String(fallbackOfficialId || normalized || officialName);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function extractTeamIdFromInnings(inningsData) {
  const firstBatter = Array.isArray(inningsData?.BattingCard) ? inningsData.BattingCard[0] : null;
  const extras = Array.isArray(inningsData?.Extras) ? inningsData.Extras[0] : null;
  return String(firstBatter?.TeamID || extras?.TeamID || '').trim();
}

function sortRowsForXI(a, b) {
  const aOrder = Number.isFinite(Number(a.MatchPlayingOrder)) ? Number(a.MatchPlayingOrder) : 999;
  const bOrder = Number.isFinite(Number(b.MatchPlayingOrder)) ? Number(b.MatchPlayingOrder) : 999;
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aPlay = Number.isFinite(Number(a.PlayingOrder)) ? Number(a.PlayingOrder) : 999;
  const bPlay = Number.isFinite(Number(b.PlayingOrder)) ? Number(b.PlayingOrder) : 999;
  if (aPlay !== bPlay) return aPlay - bPlay;
  return cleanPlayerDisplayName(a.PlayerName).localeCompare(cleanPlayerDisplayName(b.PlayerName));
}

function buildTeamSheetFromRows(rows, localTeamId, playerMaps, unmatched) {
  const sorted = uniqueBy([...rows].sort(sortRowsForXI), (row) => String(row.PlayerID || row.PLAYER_ID || row.PlayerName || ''));
  const originalRows = sorted.filter((row) => !/\(ip\)/i.test(String(row.PlayerName || '')));
  const impactInRow = sorted.find((row) => /\(ip\)/i.test(String(row.PlayerName || ''))) || null;
  const impactOutRow = sorted.find((row) => /\(rp\)/i.test(String(row.PlayerName || ''))) || null;
  const captainRow = sorted.find((row) => /\(c\)/i.test(String(row.PlayerName || ''))) || null;

  const playing11 = uniqueBy(
    originalRows.map((row) => ({
      localId: resolveLocalPlayerId({
        teamId: localTeamId,
        officialName: row.PlayerName,
        fallbackOfficialId: row.PlayerID || row.PLAYER_ID,
        playerMaps,
        unmatched,
      }),
      name: cleanPlayerDisplayName(row.PlayerName),
    })),
    (entry) => entry.localId
  ).slice(0, 11);

  const captainId = captainRow
    ? resolveLocalPlayerId({
        teamId: localTeamId,
        officialName: captainRow.PlayerName,
        fallbackOfficialId: captainRow.PlayerID || captainRow.PLAYER_ID,
        playerMaps,
        unmatched,
      })
    : '';

  let impactPlayer = null;
  if (impactInRow && impactOutRow) {
    const impactId = resolveLocalPlayerId({
      teamId: localTeamId,
      officialName: impactInRow.PlayerName,
      fallbackOfficialId: impactInRow.PlayerID || impactInRow.PLAYER_ID,
      playerMaps,
      unmatched,
    });
    const originalId = resolveLocalPlayerId({
      teamId: localTeamId,
      officialName: impactOutRow.PlayerName,
      fallbackOfficialId: impactOutRow.PlayerID || impactOutRow.PLAYER_ID,
      playerMaps,
      unmatched,
    });
    impactPlayer = impactId && originalId
      ? {
          original: originalId,
          impact: impactId,
        }
      : null;
  }

  return {
    playing11: playing11.map((entry) => entry.localId),
    captainId,
    impactPlayer,
    preview: {
      xi: playing11.map((entry) => entry.name),
      impactIn: impactInRow ? cleanPlayerDisplayName(impactInRow.PlayerName) : '',
      impactOut: impactOutRow ? cleanPlayerDisplayName(impactOutRow.PlayerName) : '',
    },
  };
}

function shouldProcessMatch(match) {
  if (match.league !== 'ipl') return false;
  if (match.status !== 'completed') return false;
  if (TARGET_MATCH_IDS.size > 0 && !TARGET_MATCH_IDS.has(String(match.id))) return false;
  if (INCLUDE_POPULATED) return true;
  return (
    (match.playing11?.team1 || []).length !== 11 ||
    (match.playing11?.team2 || []).length !== 11 ||
    !match.captains?.team1 ||
    !match.captains?.team2 ||
    !match.impactPlayer?.team1?.impact ||
    !match.impactPlayer?.team2?.impact
  );
}

async function main() {
  const [matches, initialPlayers, scheduleText] = await Promise.all([
    fetchJson(`${SITE_BASE}/api/matches?league=ipl&nocache=1`, { cache: 'no-store' }),
    fetchJson(`${SITE_BASE}/api/players?league=ipl&includeInactive=true`, { cache: 'no-store' }),
    fetchText(SCHEDULE_URL, { cache: 'no-store' }),
  ]);

  const correctedPlayers = await ensureKnownPlayerCorrections(initialPlayers);
  const players = await ensureKnownMissingPlayers(correctedPlayers);
  const officialSchedule = parseJsonp(scheduleText).Matchsummary || [];
  const officialLookup = buildOfficialLookup(officialSchedule);
  const playerMaps = buildPlayerMaps(players);
  const selectedMatches = matches.filter(shouldProcessMatch);

  console.log(`PLAYING11_TARGET_MATCHES ${selectedMatches.length}`);
  if (!selectedMatches.length) return;

  let updated = 0;
  let skipped = 0;
  const unmatched = [];

  for (const match of selectedMatches) {
    const officialItem = mapInternalToOfficialMatch(match, officialLookup);
    if (!officialItem?.MatchID) {
      console.log(`SKIP ${match.id} no official match mapping`);
      skipped += 1;
      continue;
    }

    const [innings1Text, innings2Text] = await Promise.all([
      fetchTextOrNull(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings1.js`, { cache: 'no-store' }),
      fetchTextOrNull(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings2.js`, { cache: 'no-store' }),
    ]);

    const teamSheetsByOfficialId = new Map();

    for (const text of [innings1Text, innings2Text]) {
      if (!text) continue;
      const parsed = parseJsonp(text);
      const inningsData = parsed.Innings1 || parsed.Innings2 || null;
      if (!inningsData || !Array.isArray(inningsData.BattingCard) || !inningsData.BattingCard.length) continue;

      const officialTeamId = extractTeamIdFromInnings(inningsData);
      if (!officialTeamId) continue;

      let localTeamId = '';
      if (String(officialItem.HomeTeamID || '') === officialTeamId) {
        localTeamId = String(match.team1?.shortName) === normalizeTeamCode(officialItem.HomeTeamCode || officialNameToCode(officialItem.HomeTeamName || ''))
          ? String(match.team1?.id || '')
          : String(match.team2?.id || '');
      } else if (String(officialItem.AwayTeamID || '') === officialTeamId) {
        localTeamId = String(match.team1?.shortName) === normalizeTeamCode(officialItem.AwayTeamCode || officialNameToCode(officialItem.AwayTeamName || ''))
          ? String(match.team1?.id || '')
          : String(match.team2?.id || '');
      }

      if (!localTeamId) {
        const battingCode = normalizeTeamCode(officialNameToCode(inningsData.Extras?.[0]?.BattingTeamName || ''));
        if (battingCode && battingCode === normalizeTeamCode(match.team1?.shortName || '')) {
          localTeamId = String(match.team1?.id || '');
        } else if (battingCode && battingCode === normalizeTeamCode(match.team2?.shortName || '')) {
          localTeamId = String(match.team2?.id || '');
        }
      }

      if (!localTeamId) continue;

      const sheet = buildTeamSheetFromRows(inningsData.BattingCard, localTeamId, playerMaps, unmatched);
      teamSheetsByOfficialId.set(officialTeamId, sheet);
    }

    const homeSheet = teamSheetsByOfficialId.get(String(officialItem.HomeTeamID || '')) || null;
    const awaySheet = teamSheetsByOfficialId.get(String(officialItem.AwayTeamID || '')) || null;

    const team1IsHome = normalizeTeamCode(match.team1?.shortName || '') === normalizeTeamCode(officialItem.HomeTeamCode || officialNameToCode(officialItem.HomeTeamName || ''));
    const team1Sheet = team1IsHome ? homeSheet : awaySheet;
    const team2Sheet = team1IsHome ? awaySheet : homeSheet;

    if (!team1Sheet?.playing11?.length || !team2Sheet?.playing11?.length) {
      console.log(`SKIP ${match.id} incomplete official XI extraction`);
      skipped += 1;
      continue;
    }

    const payload = {
      id: match.id,
      date: match.date,
      time: match.time,
      venue: match.venue,
      team1Id: match.team1.id,
      team2Id: match.team2.id,
      status: match.status,
      league: match.league,
      captains: {
        ...(match.captains || {}),
        team1: team1Sheet.captainId || match.captains?.team1 || '',
        team2: team2Sheet.captainId || match.captains?.team2 || '',
        setAt: match.captains?.setAt || match.playing11?.setAt || new Date().toISOString(),
      },
      playing11: {
        team1: team1Sheet.playing11,
        team2: team2Sheet.playing11,
        setAt: match.playing11?.setAt || new Date().toISOString(),
      },
      impactPlayer: {
        team1: team1Sheet.impactPlayer || match.impactPlayer?.team1 || null,
        team2: team2Sheet.impactPlayer || match.impactPlayer?.team2 || null,
      },
    };

    console.log(
      `READY ${match.id} <- official ${officialItem.MatchID} ` +
      `${match.team1.shortName} xi=${payload.playing11.team1.length} impact=${payload.impactPlayer.team1?.impact ? 'yes' : 'no'} ` +
      `${match.team2.shortName} xi=${payload.playing11.team2.length} impact=${payload.impactPlayer.team2?.impact ? 'yes' : 'no'}`
    );

    if (!DRY_RUN) {
      const response = await fetch(`${SITE_BASE}/api/matches?id=${encodeURIComponent(match.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_BEARER}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed updating match ${match.id}: ${response.status} ${text}`);
      }
    }

    updated += 1;
  }

  console.log(`PLAYING11_${DRY_RUN ? 'DRY_RUN' : 'APPLIED'} updated=${updated} skipped=${skipped}`);
  if (unmatched.length) {
    console.log('UNMATCHED_PLAYERS');
    console.log(JSON.stringify(unmatched.slice(0, 100), null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
