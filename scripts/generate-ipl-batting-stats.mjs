import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const feedDir = process.env.FEED_DIR || '/tmp/iplt20_batting_stats';
const playersPath = process.env.PLAYERS_INPUT || '/tmp/ipl_players_current.json';
const outputPath = process.env.OUTPUT || path.join(projectRoot, 'generated', 'ipl_batting_stats_filled.json');
const reportPath = process.env.REPORT || path.join(projectRoot, 'generated', 'ipl_batting_stats_filled_report.json');

const feedFiles = [
  'alltime-toprunsscorers.js',
  'alltime-mostfours.js',
  'alltime-mostsixes.js',
  'alltime-mostfifties.js',
  'alltime-mostcenturies.js',
  'alltime-highestaverages.js',
  'alltime-higheststrikeratetournament.js',
  'alltime-highestindividualscorers.js',
];

const nameAliasEntries = [
  ['Allah Ghazanfar', ['AM Ghazanfar']],
  ['M Shahrukh Khan', ['Shahrukh Khan']],
  ['Manimaran Siddharth', ['M Siddharth']],
  ['Mohammed Shami', ['Mohammad Shami']],
  ['Praveen Dubey', ['Pravin Dubey']],
  ['Prithviraj Yarra', ['Prithvi Raj Yarra']],
  ['Raj Bawa', ['Raj Angad Bawa', 'Rajangad Bawa']],
  ['Suryakumar Yadav', ['Surya Kumar Yadav']],
  ['Vijaykumar Vyshak', ['Vyshak Vijaykumar']],
];

const nameAliases = new Map(nameAliasEntries.map(([name, aliases]) => [normalizeName(name), aliases]));

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

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInteger(value) {
  return Math.trunc(toNumber(value));
}

function parseFeed(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').trim();
  const open = source.indexOf('(');
  const close = source.lastIndexOf(')');
  if (open < 0 || close < open) {
    throw new Error(`Unable to parse feed wrapper: ${filePath}`);
  }

  const payload = JSON.parse(source.slice(open + 1, close));
  const [key] = Object.keys(payload);
  return payload[key].map((row) => ({ ...row, sourceFeed: path.basename(filePath) }));
}

function rowCompleteness(row) {
  return [
    row.Matches,
    row.Innings,
    row.TotalRuns,
    row.Balls,
    row.Fours,
    row.Sixes,
    row.NotOuts,
    row.HighestScore,
  ].filter((value) => value !== undefined && value !== null && value !== '').length;
}

function preferBetterRow(current, next) {
  if (!current) return next;

  const currentRuns = toInteger(current.TotalRuns);
  const nextRuns = toInteger(next.TotalRuns);
  if (nextRuns !== currentRuns) return nextRuns > currentRuns ? next : current;

  const currentComplete = rowCompleteness(current);
  const nextComplete = rowCompleteness(next);
  if (nextComplete !== currentComplete) return nextComplete > currentComplete ? next : current;

  return current;
}

function buildFeedIndex() {
  const rows = [];
  for (const file of feedFiles) {
    const filePath = path.join(feedDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing feed file: ${filePath}`);
    }
    rows.push(...parseFeed(filePath));
  }

  const byName = new Map();
  for (const row of rows) {
    const key = normalizeName(row.StrikerName);
    if (!key) continue;
    byName.set(key, preferBetterRow(byName.get(key), row));
  }

  return { rows, byName };
}

function getCandidateNames(playerName) {
  return [playerName, ...(nameAliases.get(normalizeName(playerName)) || [])];
}

function findRowForPlayer(player, byName) {
  for (const candidateName of getCandidateNames(player.name)) {
    const key = normalizeName(candidateName);
    const row = byName.get(key);
    if (row) return { row, matchedName: candidateName };
  }

  return { row: null, matchedName: null };
}

function battingStatsFromRow(row, existingStats) {
  const matches = toInteger(row.Matches);
  const battingInnings = toInteger(row.Innings);
  const notOuts = toInteger(row.NotOuts);
  const runs = toInteger(row.TotalRuns);
  const ballsFaced = toInteger(row.Balls);
  const dismissals = Math.max(battingInnings - notOuts, 0);
  const average = dismissals > 0 ? runs / dismissals : 0;
  const strikeRate = ballsFaced > 0 ? (runs * 100) / ballsFaced : 0;

  return {
    ...existingStats,
    matches,
    battingInnings,
    notOuts,
    runs,
    ballsFaced,
    highest: toInteger(row.HighestScore),
    fours: toInteger(row.Fours || row.Most_4s),
    sixes: toInteger(row.Sixes || row.Most_6s),
    fifties: toInteger(row.FiftyPlusRuns),
    hundreds: toInteger(row.Centuries),
    battingAverage: dismissals > 0 ? average.toFixed(2) : '',
    battingStrikeRate: ballsFaced > 0 ? strikeRate.toFixed(1) : '',
    average,
    strikeRate,
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

function main() {
  const players = readJson(playersPath);
  if (!Array.isArray(players)) {
    throw new Error(`Players input must be an array: ${playersPath}`);
  }

  const { rows, byName } = buildFeedIndex();
  const unmatched = [];
  const changed = [];
  const matched = [];

  const updatedPlayers = players.map((player) => {
    const existingStats = player.stats || {};
    const { row, matchedName } = findRowForPlayer(player, byName);
    if (!row) {
      unmatched.push({
        id: player.id,
        name: player.name,
        teamId: player.teamId || '',
        reason: 'No official batting aggregate row found',
      });
      return player;
    }

    const nextStats = battingStatsFromRow(row, existingStats);
    const changes = diffStats(existingStats, nextStats);
    const reportEntry = {
      id: player.id,
      name: player.name,
      matchedName: row.StrikerName,
      aliasUsed: matchedName !== player.name ? matchedName : null,
      officialPlayerId: row.PlayerId || null,
      sourceFeed: row.sourceFeed,
      teamCode: row.TeamCode || '',
      runs: nextStats.runs,
      battingInnings: nextStats.battingInnings,
      ballsFaced: nextStats.ballsFaced,
      changes,
    };

    matched.push(reportEntry);
    if (changes.length > 0) changed.push(reportEntry);

    return {
      ...player,
      stats: nextStats,
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(updatedPlayers, null, 2)}\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: feedFiles.map((file) => `https://scores.iplt20.com/ipl/feeds/stats/${file}`),
        playerInput: playersPath,
        feedDir,
        players: players.length,
        feedRows: rows.length,
        officialNames: byName.size,
        matched: matched.length,
        changed: changed.length,
        unchangedMatched: matched.length - changed.length,
        unmatched: unmatched.length,
        notes: [
          'Official IPLT20 aggregate batting feeds do not include ducks; existing ducks values are preserved.',
          'battingAverage and battingStrikeRate are derived from official cumulative innings, not-outs, runs, and balls faced to match the admin save behavior.',
        ],
        changedPlayers: changed,
        unmatchedPlayers: unmatched,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Players read: ${players.length}`);
  console.log(`Official batting rows read: ${rows.length}`);
  console.log(`Official names indexed: ${byName.size}`);
  console.log(`Matched players: ${matched.length}`);
  console.log(`Changed players: ${changed.length}`);
  console.log(`Unmatched players: ${unmatched.length}`);
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${reportPath}`);
}

main();
