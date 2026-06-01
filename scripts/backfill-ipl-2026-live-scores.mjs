const SITE_BASE = process.env.SITE_BASE || 'https://ipl-2026-website.pages.dev';
const OFFICIAL_FEED_BASE = 'https://scores.iplt20.com/ipl/feeds';
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const MATCH_IDS_ARG = process.argv.find((arg) => arg.startsWith('--match-ids='));
const TARGET_MATCH_IDS = new Set(
  String(MATCH_IDS_ARG ? MATCH_IDS_ARG.split('=')[1] : '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const INCLUDE_UPCOMING = process.argv.includes('--include-upcoming');

const ROW_WIDTH = 13;

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

function normalizeTeamCode(value) {
  return collapseWhitespace(value).toUpperCase();
}

function stripJsonp(text) {
  const trimmed = String(text || '').trim();
  return trimmed.replace(/^[^(]+\(/, '').replace(/\);\s*$/, '');
}

function parseJsonp(text) {
  return JSON.parse(stripJsonp(text));
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchTextOrNull(url, init) {
  const response = await fetch(url, init);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.text();
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
      officialNameToCode(item.HomeTeamName || item.MatchName?.split(' vs ')[0] || '')
    );
    const code2 = normalizeTeamCode(
      officialNameToCode(item.AwayTeamName || item.MatchName?.split(' vs ')[1] || '')
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

function cleanCommentary(value) {
  return collapseWhitespace(
    String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
  );
}

function parsePlayerNamesFromDismissalText(text) {
  return String(text || '')
    .split('/')
    .map((part) => cleanPlayerDisplayName(part))
    .filter(Boolean);
}

function inferWicketTypeFromTexts(rawType, outDesc) {
  const type = collapseWhitespace(rawType);
  const lowerType = type.toLowerCase();
  const desc = collapseWhitespace(outDesc);
  const lowerDesc = desc.toLowerCase();

  if (lowerDesc.startsWith('c & b') || lowerDesc.startsWith('caught & bowled')) return 'Caught & Bowled';
  if (lowerType === 'caught & bowled') return 'Caught & Bowled';
  if (lowerType === 'caught' || lowerDesc.startsWith('c ')) return 'Caught';
  if (lowerType === 'bowled' || lowerDesc.startsWith('b ')) return 'Bowled';
  if (lowerType === 'lbw' || lowerDesc.startsWith('lbw')) return 'LBW';
  if (lowerType === 'run out' || lowerDesc.startsWith('run out')) return 'Run Out';
  if (lowerType === 'stumped' || lowerDesc.startsWith('st ')) return 'Stumped';
  if (lowerType === 'hit wicket' || lowerDesc.startsWith('hit wicket')) return 'Hit Wicket';
  if (lowerType === 'obstructing the field' || lowerDesc.startsWith('obstructing the field')) return 'Obstructing the Field';
  if (lowerType === 'hit the ball twice' || lowerDesc.startsWith('hit the ball twice')) return 'Hit the Ball Twice';
  if (lowerType === 'timed out' || lowerDesc.startsWith('timed out')) return 'Timed Out';
  if (lowerType === 'retired hurt' || lowerDesc.startsWith('retired hurt')) return 'Retired Hurt';
  if (lowerType === 'retired out' || lowerDesc.startsWith('retired out')) return 'Retired Out';
  if (type) return type;
  return desc ? 'Wicket' : '';
}

function parseDismissalRow(ball, outDesc) {
  const wicketType = inferWicketTypeFromTexts(ball.WicketType, outDesc);
  const strikerId = String(ball.StrikerID || '').trim();
  const nonStrikerId = String(ball.NonStrikerID || '').trim();
  const outId = String(ball.OutBatsManID || '').trim();
  const outBatter = outId && nonStrikerId && outId === nonStrikerId ? 'nonStriker' : 'striker';

  let wicketTaker = '';
  let wicketAssistant = '';
  const desc = collapseWhitespace(outDesc);
  const lowerDesc = desc.toLowerCase();

  if (wicketType === 'Caught') {
    const match = desc.match(/^c\s+(.+?)\s+b\s+/i);
    wicketTaker = cleanPlayerDisplayName(match?.[1] || '');
  } else if (wicketType === 'Caught & Bowled') {
    wicketTaker = '';
  } else if (wicketType === 'Stumped') {
    const match = desc.match(/^st\s+(.+?)\s+b\s+/i);
    wicketTaker = cleanPlayerDisplayName(match?.[1] || '');
  } else if (wicketType === 'Run Out') {
    const match = desc.match(/^run out\s*\((.+)\)$/i);
    const names = parsePlayerNamesFromDismissalText(match?.[1] || '');
    wicketTaker = names[0] || '';
    wicketAssistant = names[1] || '';
  } else if (wicketType === 'Obstructing the Field') {
    const match = desc.match(/^obstructing the field\s*\((.+)\)$/i);
    const names = parsePlayerNamesFromDismissalText(match?.[1] || '');
    wicketTaker = names[0] || '';
    wicketAssistant = names[1] || '';
  } else if (wicketType === 'Mankad (Run out at non-striker end)') {
    wicketTaker = cleanPlayerDisplayName(ball.BowlerName || '');
  }

  if (!wicketType && ball.IsWicket === '1' && lowerDesc.includes('mankad')) {
    return {
      hasWicket: true,
      wicketType: 'Mankad (Run out at non-striker end)',
      wicketTaker: cleanPlayerDisplayName(ball.BowlerName || ''),
      wicketAssistant: '',
      outBatter: 'nonStriker',
    };
  }

  return {
    hasWicket: ball.IsWicket === '1',
    wicketType,
    wicketTaker,
    wicketAssistant,
    outBatter,
  };
}

function generateWicketDescription(wk) {
  if (!wk?.hasWicket) return '';
  const type = wk.wicketType || 'Wicket';
  const takerCombined = [wk.wicketTaker, wk.wicketAssistant].filter(Boolean).join(' / ');
  const taker = takerCombined ? ` - ${takerCombined}` : '';
  const needsOutBatter =
    type === 'Run Out' || type === 'Obstructing the Field' || type === 'Mankad (Run out at non-striker end)';
  const outTag = needsOutBatter
    ? ` (${type === 'Mankad (Run out at non-striker end)' ? 'Non-striker' : wk.outBatter === 'nonStriker' ? 'Non-striker' : 'Striker'})`
    : '';
  return `${type}${outTag}${taker}`.trim();
}

function parseBallName(value, fallbackOverNo) {
  const raw = String(value || '').trim();
  if (raw.includes('.')) {
    const [over, ball] = raw.split('.');
    return {
      over: String(Number.parseInt(over, 10) || 0),
      ball: String(Number.parseInt(ball, 10) || 0),
    };
  }

  const over = Math.max(0, Number.parseInt(String(fallbackOverNo || 1), 10) - 1);
  return {
    over: String(over),
    ball: String(Number.parseInt(String(raw || 1), 10) || 1),
  };
}

function buildPlayerNameLookup(inningsData) {
  const lookup = new Map();

  for (const row of inningsData.BattingCard || []) {
    const id = String(row.PlayerID || row.PLAYER_ID || '').trim();
    const name = cleanPlayerDisplayName(row.PlayerName);
    if (id && name && !lookup.has(id)) lookup.set(id, name);
  }

  for (const row of inningsData.BowlingCard || []) {
    const id = String(row.PlayerID || row.PLAYER_ID || '').trim();
    const name = cleanPlayerDisplayName(row.PlayerName);
    if (id && name && !lookup.has(id)) lookup.set(id, name);
  }

  return lookup;
}

function buildDismissalLookup(inningsData) {
  const lookup = new Map();
  for (const row of inningsData.BattingCard || []) {
    const id = String(row.PlayerID || row.PLAYER_ID || '').trim();
    const outDesc = collapseWhitespace(row.OutDesc || '');
    if (id && outDesc) lookup.set(id, outDesc);
  }
  return lookup;
}

function buildRowsForInnings(inningsData) {
  const rows = [];
  const extrasData = {};
  const wicketData = {};

  const playerNames = buildPlayerNameLookup(inningsData);
  const dismissalLookup = buildDismissalLookup(inningsData);
  const deliveries = Array.isArray(inningsData.OverHistory) ? inningsData.OverHistory : [];

  for (const ball of deliveries) {
    const { over, ball: ballNo } = parseBallName(ball.BallName, ball.OverNo);
    const row = Array(ROW_WIDTH).fill('');

    const strikerId = String(ball.StrikerID || '').trim();
    const nonStrikerId = String(ball.NonStrikerID || '').trim();
    const bowlerId = String(ball.BowlerID || '').trim();

    const strikerName = playerNames.get(strikerId) || cleanPlayerDisplayName(ball.BatsManName) || strikerId;
    const nonStrikerName = playerNames.get(nonStrikerId) || nonStrikerId;
    const bowlerName = playerNames.get(bowlerId) || cleanPlayerDisplayName(ball.BowlerName) || bowlerId;

    const isWide = String(ball.IsWide || '0') === '1';
    const isNoBall = String(ball.IsNoBall || '0') === '1';
    const isBye = String(ball.IsBye || '0') === '1';
    const isLegBye = String(ball.IsLegBye || '0') === '1';
    const totalExtras = Number.parseInt(String(ball.Extras || '0'), 10) || 0;
    const actualRuns = Number.parseInt(String(ball.ActualRuns || '0'), 10) || 0;

    const extras = {
      hasWide: isWide,
      wideExtraRuns: isWide ? Math.max(0, totalExtras - 1) : 0,
      hasNoBall: isNoBall,
      hasByes: isBye,
      byesRuns: isBye ? Math.max(0, totalExtras - (isNoBall ? 1 : 0)) : 0,
      hasLB: isLegBye,
      lbRuns: isLegBye ? Math.max(0, totalExtras - (isNoBall ? 1 : 0)) : 0,
    };

    const batRuns = isWide || isBye || isLegBye ? 0 : actualRuns;
    const outDesc = dismissalLookup.get(String(ball.OutBatsManID || '').trim()) || '';
    const wicket = parseDismissalRow(ball, outDesc);
    const commentary = cleanCommentary(ball.Commentry || ball.NewCommentry || ball.Runs || '');

    const isEmptyDelivery =
      !strikerName &&
      !nonStrikerName &&
      !bowlerName &&
      !commentary &&
      batRuns === 0 &&
      totalExtras === 0 &&
      !wicket.hasWicket;

    if (isEmptyDelivery) {
      continue;
    }

    row[0] = over;
    row[1] = ballNo;
    row[2] = String(inningsData.Extras?.[0]?.InningsNo || ball.InningsNo || '');
    row[3] = strikerName;
    row[4] = nonStrikerName;
    row[5] = bowlerName;
    row[6] = String(batRuns);
    row[7] = extras.hasWide ? String(1 + extras.wideExtraRuns) : '';
    row[8] = extras.hasNoBall ? '1' : '';
    row[9] = extras.hasByes ? String(extras.byesRuns) : '';
    row[10] = extras.hasLB ? String(extras.lbRuns) : '';
    row[11] = generateWicketDescription(wicket);
    row[12] = commentary;

    const index = rows.length;
    rows.push(row);
    extrasData[index] = extras;
    wicketData[index] = wicket;
  }

  return { rows, extrasData, wicketData };
}

function mergeInningsPayloads(payloads) {
  const rows = [];
  const extrasData = {};
  const wicketData = {};

  for (const payload of payloads) {
    if (!payload) continue;
    const offset = rows.length;

    for (const row of payload.rows || []) {
      rows.push(row);
    }

    for (const [key, value] of Object.entries(payload.extrasData || {})) {
      extrasData[offset + Number(key)] = value;
    }

    for (const [key, value] of Object.entries(payload.wicketData || {})) {
      wicketData[offset + Number(key)] = value;
    }
  }

  return { rows, extrasData, wicketData };
}

async function saveLiveScore(matchId, payload) {
  const response = await fetch(`${SITE_BASE}/api/ipl-live-score/save?matchId=${encodeURIComponent(matchId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed saving live score for match ${matchId}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const [matches, scheduleText] = await Promise.all([
    fetchJson(`${SITE_BASE}/api/matches?league=ipl&nocache=1`, { cache: 'no-store' }),
    fetchText(`${OFFICIAL_FEED_BASE}/284-matchschedule.js`, { cache: 'no-store' }),
  ]);

  const scheduleData = parseJsonp(scheduleText);
  const scheduleItems = Array.isArray(scheduleData.Matchsummary) ? scheduleData.Matchsummary : [];
  const officialLookup = buildOfficialLookup(scheduleItems);

  const seasonMatches = matches.filter((match) => match.league === 'ipl' && String(match.date || '').startsWith('2026-'));
  const eligibleMatches = seasonMatches.filter((match) => {
    if (TARGET_MATCH_IDS.size > 0) return TARGET_MATCH_IDS.has(String(match.id));
    if (match.status === 'completed') return true;
    return INCLUDE_UPCOMING;
  });

  const actions = [];
  const skipped = [];

  for (const match of eligibleMatches) {
    const officialItem = mapInternalToOfficialMatch(match, officialLookup);
    if (!officialItem) {
      skipped.push({ matchId: String(match.id), reason: 'No official match mapping', label: `${match.date} ${match.team1?.shortName} vs ${match.team2?.shortName}` });
      continue;
    }

    const [innings1Text, innings2Text] = await Promise.all([
      fetchTextOrNull(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings1.js`, { cache: 'no-store' }),
      fetchTextOrNull(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings2.js`, { cache: 'no-store' }),
    ]);

    const inningsPayloads = [];
    for (const text of [innings1Text, innings2Text]) {
      if (!text) continue;
      const parsed = parseJsonp(text);
      const inningsData = parsed.Innings1 || parsed.Innings2 || null;
      if (!inningsData) continue;
      const deliveryCount = Array.isArray(inningsData.OverHistory) ? inningsData.OverHistory.length : 0;
      if (deliveryCount === 0) continue;
      inningsPayloads.push(buildRowsForInnings(inningsData));
    }

    if (inningsPayloads.length === 0) {
      skipped.push({
        matchId: String(match.id),
        reason: 'No innings feed data available yet',
        label: `${match.date} ${match.team1?.shortName} vs ${match.team2?.shortName}`,
        officialMatchId: String(officialItem.MatchID),
      });
      continue;
    }

    const payload = mergeInningsPayloads(inningsPayloads);
    actions.push({
      matchId: String(match.id),
      officialMatchId: String(officialItem.MatchID),
      label: `${match.date} ${match.team1?.shortName} vs ${match.team2?.shortName}`,
      rowCount: payload.rows.length,
      inningsCount: inningsPayloads.length,
      payload,
    });
  }

  console.log(`2026 IPL matches in API: ${seasonMatches.length}`);
  console.log(`Eligible matches: ${eligibleMatches.length}`);
  console.log(`Prepared live-score imports: ${actions.length}`);
  console.log(`Skipped matches: ${skipped.length}`);

  for (const action of actions.slice(0, 10)) {
    console.log(
      `READY ${action.matchId} <- official ${action.officialMatchId} ${action.label} rows=${action.rowCount} innings=${action.inningsCount}`
    );
  }

  for (const row of skipped.slice(0, 10)) {
    console.log(
      `SKIP ${row.matchId} ${row.label} ${row.officialMatchId ? `(official ${row.officialMatchId}) ` : ''}${row.reason}`
    );
  }

  if (DRY_RUN) return;

  let applied = 0;
  for (const action of actions) {
    await saveLiveScore(action.matchId, action.payload);
    applied += 1;
    console.log(`APPLIED ${action.matchId} ${action.label} rows=${action.rowCount}`);
  }

  console.log(`Applied live-score imports: ${applied}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
