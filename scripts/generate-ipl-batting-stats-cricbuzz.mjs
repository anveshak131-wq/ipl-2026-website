import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const inputPath = process.env.INPUT || path.join(projectRoot, 'generated', 'ipl_batting_stats_filled.json');
const outputPath =
  process.env.OUTPUT || path.join(projectRoot, 'generated', 'ipl_batting_stats_cricbuzz_enriched.json');
const reportPath =
  process.env.REPORT || path.join(projectRoot, 'generated', 'ipl_batting_stats_cricbuzz_enriched_report.json');
const cacheDir = process.env.CRICBUZZ_CACHE_DIR || '/tmp/cricbuzz_profiles';
const cricbuzzBaseUrl = 'https://www.cricbuzz.com';
const seriesId = process.env.CRICBUZZ_IPL_SERIES_ID || '9241';
const matchFormatT20 = '3';
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

const allTimeStatTypes = [
  'mostRuns',
  'highestScore',
  'highestAvg',
  'highestSr',
  'mostHundreds',
  'mostFifties',
  'mostFours',
  'mostSixes',
  'mostNineties',
];

const currentSeasonMappingStatTypes = [
  'mostRuns',
  'highestScore',
  'mostHundreds',
  'mostFifties',
  'mostFours',
  'mostSixes',
];

const activeIplTeamIds = new Set(['58', '59', '61', '62', '63', '64', '65', '255', '966', '971']);

const aliases = new Map([
  ['mshahrukhkhan', ['shahrukhkhan']],
  ['rajbawa', ['rajangadbawa', 'rajangadbawa']],
  ['suryakumaryadav', ['suryakumaryadav', 'suryakumaryadav']],
  ['vijaykumarvyshak', ['vyshakvijaykumar']],
  ['mohammedshami', ['mohammadshami']],
  ['praveendubey', ['pravindubey']],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '-' || raw === '--') return 0;
  const parsed = Number(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInteger(value) {
  return Math.trunc(toNumber(value));
}

function formatAverage(runs, innings, notOuts) {
  const dismissals = Math.max(innings - notOuts, 0);
  return dismissals > 0 ? (runs / dismissals).toFixed(2) : '';
}

function formatStrikeRate(runs, ballsFaced) {
  return ballsFaced > 0 ? ((runs * 100) / ballsFaced).toFixed(1) : '';
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent } });
  if (!response.ok) {
    throw new Error(`Cricbuzz request failed ${response.status}: ${url}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Cricbuzz returned non-JSON for ${url}: ${text.slice(0, 80)}`);
  }
}

function addMapping(mapping, id, name, source) {
  const key = normalizeName(name);
  if (!id || !key) return;
  if (!mapping.has(key)) {
    mapping.set(key, { cricbuzzId: String(id), cricbuzzName: String(name), sources: [] });
  }
  const entry = mapping.get(key);
  if (!entry.sources.includes(source)) entry.sources.push(source);
}

async function buildCricbuzzIdMap() {
  const byName = new Map();
  const sourceUrls = [];

  for (const type of allTimeStatTypes) {
    const url = `${cricbuzzBaseUrl}/api/cricket-series/series-stats/${seriesId}?statsType=${type}&seasonSeriesId=all&seriesType=IPL&matchFormat=${matchFormatT20}`;
    sourceUrls.push(url);
    const stats = await fetchJson(url);
    for (const row of stats.t20StatsList?.values || []) {
      const [id, name] = row.values || [];
      addMapping(byName, id, name, `all:${type}`);
    }
  }

  const firstSeasonUrl = `${cricbuzzBaseUrl}/api/cricket-series/series-stats/${seriesId}?statsType=mostRuns&seasonSeriesId=${seriesId}&matchFormat=${matchFormatT20}`;
  const firstSeasonStats = await fetchJson(firstSeasonUrl);
  sourceUrls.push(firstSeasonUrl);
  const teams = (firstSeasonStats.filter?.team || []).filter((team) => activeIplTeamIds.has(String(team.id)));

  for (const team of teams) {
    for (const type of currentSeasonMappingStatTypes) {
      const url = `${cricbuzzBaseUrl}/api/cricket-series/series-stats/${seriesId}?statsType=${type}&seasonSeriesId=${seriesId}&matchFormat=${matchFormatT20}&teamId=${team.id}`;
      sourceUrls.push(url);
      const stats = await fetchJson(url);
      for (const row of stats.t20StatsList?.values || []) {
        const [id, name] = row.values || [];
        addMapping(byName, id, name, `season:${team.teamShortName}:${type}`);
      }
    }
  }

  return { byName, sourceUrls };
}

function candidateKeys(playerName) {
  const key = normalizeName(playerName);
  return [key, ...(aliases.get(key) || [])];
}

function findCricbuzzMapping(player, byName) {
  for (const key of candidateKeys(player.name)) {
    const entry = byName.get(key);
    if (entry) return entry;
  }

  return null;
}

function extractEscapedJsonObject(html, key) {
  const escapedKey = `\\"${key}\\":`;
  const startIndex = html.indexOf(escapedKey);
  if (startIndex < 0) return null;

  let index = startIndex + escapedKey.length;
  while (index < html.length && /\s/.test(html[index])) index += 1;
  if (html[index] !== '{') return null;

  let depth = 0;
  let end = index;
  for (; end < html.length; end += 1) {
    const char = html[end];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }

  const raw = html.slice(index, end);
  const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return JSON.parse(unescaped);
}

async function fetchProfileHtml(cricbuzzId, cricbuzzName) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = path.join(cacheDir, `${cricbuzzId}.html`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }

  const url = `${cricbuzzBaseUrl}/profiles/${cricbuzzId}/${slugify(cricbuzzName)}`;
  const response = await fetch(url, { headers: { 'user-agent': userAgent } });
  if (!response.ok) {
    throw new Error(`Profile fetch failed ${response.status}: ${url}`);
  }

  const html = await response.text();
  fs.writeFileSync(filePath, html);
  return html;
}

function parseIplBattingStats(profileHtml) {
  const batting = extractEscapedJsonObject(profileHtml, 'playerBattingStats');
  if (!batting?.headers || !batting?.values) return null;

  const iplColumn = batting.headers.indexOf('IPL');
  if (iplColumn < 0) return null;

  const valuesByRow = new Map();
  for (const row of batting.values) {
    const rowValues = row.values || [];
    valuesByRow.set(rowValues[0], rowValues[iplColumn]);
  }

  const matches = toInteger(valuesByRow.get('Matches'));
  const battingInnings = toInteger(valuesByRow.get('Innings'));
  const runs = toInteger(valuesByRow.get('Runs'));
  const ballsFaced = toInteger(valuesByRow.get('Balls'));
  const notOuts = toInteger(valuesByRow.get('Not Out'));
  const fifties = toInteger(valuesByRow.get('50s'));
  const hundreds = toInteger(valuesByRow.get('100s'));

  return {
    matches,
    battingInnings,
    runs,
    ballsFaced,
    highest: toInteger(valuesByRow.get('Highest')),
    average: Math.max(battingInnings - notOuts, 0) > 0 ? runs / Math.max(battingInnings - notOuts, 1) : 0,
    strikeRate: ballsFaced > 0 ? (runs * 100) / ballsFaced : 0,
    notOuts,
    fours: toInteger(valuesByRow.get('Fours')),
    sixes: toInteger(valuesByRow.get('Sixes')),
    ducks: toInteger(valuesByRow.get('Ducks')),
    fifties,
    hundreds,
    battingAverage: formatAverage(runs, battingInnings, notOuts),
    battingStrikeRate: formatStrikeRate(runs, ballsFaced),
  };
}

function diffStats(before, after) {
  const fields = [
    'matches',
    'battingInnings',
    'notOuts',
    'runs',
    'ballsFaced',
    'highest',
    'fours',
    'sixes',
    'ducks',
    'fifties',
    'hundreds',
    'battingAverage',
    'battingStrikeRate',
    'average',
    'strikeRate',
  ];

  return fields
    .filter((field) => String(before?.[field] ?? '') !== String(after?.[field] ?? ''))
    .map((field) => ({
      field,
      before: before?.[field] ?? null,
      after: after?.[field] ?? null,
    }));
}

function buildNextStats(existingStats, cricbuzzStats) {
  return {
    ...existingStats,
    ...cricbuzzStats,
  };
}

async function main() {
  const players = readJson(inputPath);
  if (!Array.isArray(players)) {
    throw new Error(`Input file must be a player array: ${inputPath}`);
  }

  const { byName, sourceUrls } = await buildCricbuzzIdMap();
  const matched = [];
  const changed = [];
  const unchanged = [];
  const unmatched = [];
  const profileFailures = [];

  let processedProfiles = 0;
  const profileStatsCache = new Map();

  async function getProfileStats(entry) {
    if (profileStatsCache.has(entry.cricbuzzId)) {
      return profileStatsCache.get(entry.cricbuzzId);
    }

    try {
      const html = await fetchProfileHtml(entry.cricbuzzId, entry.cricbuzzName);
      const stats = parseIplBattingStats(html);
      processedProfiles += 1;
      profileStatsCache.set(entry.cricbuzzId, stats);
      return stats;
    } catch (error) {
      profileFailures.push({
        cricbuzzId: entry.cricbuzzId,
        cricbuzzName: entry.cricbuzzName,
        error: error.message,
      });
      profileStatsCache.set(entry.cricbuzzId, null);
      return null;
    }
  }

  const updatedPlayers = [];
  for (const player of players) {
    const mapping = findCricbuzzMapping(player, byName);
    if (!mapping) {
      unmatched.push({
        id: player.id,
        name: player.name,
        reason: 'No Cricbuzz id found in IPL all-time/current stat rows',
      });
      updatedPlayers.push(player);
      continue;
    }

    const cricbuzzStats = await getProfileStats(mapping);
    if (!cricbuzzStats || cricbuzzStats.matches === 0) {
      unmatched.push({
        id: player.id,
        name: player.name,
        cricbuzzId: mapping.cricbuzzId,
        cricbuzzName: mapping.cricbuzzName,
        reason: 'No IPL batting profile stats found',
      });
      updatedPlayers.push(player);
      continue;
    }

    const existingStats = player.stats || {};
    const nextStats = buildNextStats(existingStats, cricbuzzStats);
    const changes = diffStats(existingStats, nextStats);
    const entry = {
      id: player.id,
      name: player.name,
      cricbuzzId: mapping.cricbuzzId,
      cricbuzzName: mapping.cricbuzzName,
      mappingSources: mapping.sources,
      stats: cricbuzzStats,
      changes,
    };

    matched.push(entry);
    if (changes.length > 0) {
      changed.push(entry);
    } else {
      unchanged.push(entry);
    }

    updatedPlayers.push({
      ...player,
      stats: nextStats,
    });
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(updatedPlayers, null, 2)}\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        input: inputPath,
        source: 'Cricbuzz profile IPL batting tables',
        sourcePages: [
          `${cricbuzzBaseUrl}/cricket-series/${seriesId}/indian-premier-league-2026/stats`,
          ...sourceUrls,
        ],
        notes: [
          'ESPNcricinfo records pages returned Access Denied from this environment, so this generator uses Cricbuzz.',
          'Cricbuzz series stat tables are used only to map player names to Cricbuzz profile ids.',
          'The actual batting fields come from each Cricbuzz profile page IPL career column.',
        ],
        players: players.length,
        cricbuzzNamesIndexed: byName.size,
        profilesFetchedOrRead: processedProfiles,
        matched: matched.length,
        changed: changed.length,
        unchanged: unchanged.length,
        unmatched: unmatched.length,
        profileFailures: profileFailures.length,
        changedPlayers: changed,
        unchangedPlayers: unchanged,
        unmatchedPlayers: unmatched,
        profileFailuresDetail: profileFailures,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Players read: ${players.length}`);
  console.log(`Cricbuzz names indexed: ${byName.size}`);
  console.log(`Profiles fetched/read: ${processedProfiles}`);
  console.log(`Matched players: ${matched.length}`);
  console.log(`Changed players: ${changed.length}`);
  console.log(`Unchanged players: ${unchanged.length}`);
  console.log(`Unmatched players: ${unmatched.length}`);
  console.log(`Profile failures: ${profileFailures.length}`);
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${reportPath}`);
}

main();
