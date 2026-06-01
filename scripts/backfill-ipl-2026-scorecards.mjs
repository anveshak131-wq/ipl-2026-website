const SITE_BASE = process.env.SITE_BASE || 'https://ipl-2026-website.pages.dev';
const OFFICIAL_FEED_BASE = 'https://scores.iplt20.com/ipl/feeds';
const ADMIN_BEARER = process.env.ADMIN_BEARER || 'codex-backfill';
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const MATCH_IDS_ARG = process.argv.find((arg) => arg.startsWith('--match-ids='));
const TARGET_MATCH_IDS = new Set(
  String(MATCH_IDS_ARG ? MATCH_IDS_ARG.split('=')[1] : '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const INCLUDE_PUBLISHED = process.argv.includes('--include-published');
const INCLUDE_UPCOMING = process.argv.includes('--include-upcoming');

const IPL_SHORT_CODES = new Set(['RCB', 'MI', 'CSK', 'KKR', 'GT', 'SRH', 'RR', 'PBKS', 'DC', 'LSG']);

const PLAYER_NAME_ALIASES = new Map([
  ['mohd arshad khan', 'mohammed arshad khan'],
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
]);

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

function dedupePartnerships(rows) {
  const seen = new Set();
  const partnerships = [];
  for (const row of rows || []) {
    const key = `${row.MatchMinOver}-${row.MatchMaxOver}-${row.PartnershipTotal}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const batsman1 = cleanPlayerDisplayName(row.Striker);
    const batsman2 = cleanPlayerDisplayName(row.NonStriker);
    const batsman1Balls = Number(row.StrikerBalls || 0);
    const batsman2Balls = Number(row.NonStrikerBalls || 0);
    partnerships.push({
      batsman1,
      batsman1Runs: String(row.StrikerRuns || 0),
      batsman1Balls: String(batsman1Balls),
      batsman2,
      batsman2Runs: String(row.NonStrikerRuns || 0),
      batsman2Balls: String(batsman2Balls),
      totalRuns: `${Number(row.PartnershipTotal || 0)}(${batsman1Balls + batsman2Balls})`,
    });
  }
  return partnerships;
}

function parseDismissal(outDesc) {
  const details = collapseWhitespace(outDesc);
  if (!details || details === '-') return undefined;
  const lower = details.toLowerCase();
  if (lower === 'not out' || lower === 'not-out') {
    return { type: 'not-out' };
  }
  let type = 'out';
  if (lower.startsWith('c ')) type = 'caught';
  else if (lower.startsWith('b ')) type = 'bowled';
  else if (lower.startsWith('lbw')) type = 'lbw';
  else if (lower.startsWith('run out')) type = 'run_out';
  else if (lower.startsWith('st ')) type = 'stumped';
  else if (lower.startsWith('hit wicket')) type = 'hit_wicket';
  else if (lower.startsWith('retired hurt')) type = 'retired-hurt';
  else if (lower.startsWith('retired out')) type = 'retired_out';
  return { type, details };
}

function buildPowerplay(overHistory) {
  let legalBalls = 0;
  let runs = 0;
  for (const ball of overHistory || []) {
    const actualRuns = Number(ball.ActualRuns || 0);
    const extras = Number(ball.Extras || 0);
    runs += actualRuns + extras;
    const isWide = String(ball.IsWide || '0') === '1';
    const isNoBall = String(ball.IsNoBall || '0') === '1';
    if (!isWide && !isNoBall) {
      legalBalls += 1;
      if (legalBalls >= 36) break;
    }
  }
  return {
    mandatory: {
      overs: '0.1 - 6',
      runs,
    },
    optional: {
      overs: '',
      runs: 0,
    },
  };
}

function splitOvers(value) {
  const text = String(value ?? '0').trim();
  if (!text) return { overs: 0, balls: 0 };
  const [whole, frac = '0'] = text.split('.');
  return {
    overs: Number(whole || 0),
    balls: Number(frac || 0),
  };
}

function parseTotalOvers(value) {
  const text = String(value ?? '0').trim();
  if (!text) return '0.0';
  if (text.includes('.')) return text;
  return `${Number(text || 0)}.0`;
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

    const targetSet = [...targetTokens].sort().join('|');
    const localSet = [...localTokens].sort().join('|');
    if (targetSet === localSet) return player;

    const commonTokens = targetTokens.filter((token) => localTokens.includes(token));
    if (!subsetMatch && commonTokens.length >= Math.min(2, targetTokens.length)) {
      subsetMatch = player;
    }
  }

  return subsetMatch;
}

function resolveLocalPlayerId({
  teamId,
  officialName,
  fallbackOfficialId,
  playerMaps,
  unmatched,
}) {
  const normalized = normalizeName(officialName);
  const teamKey = String(teamId);
  const teamMap = playerMaps.byTeam.get(teamKey);
  const teamMatches = teamMap?.get(normalized) || [];
  if (teamMatches.length === 1) return String(teamMatches[0].id);
  if (teamMatches.length > 1) return String(teamMatches[0].id);

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

function buildResult(match, officialItem, officialTeamIdToLocal) {
  const winner = officialTeamIdToLocal.get(String(officialItem.WinningTeamID || ''))?.name || '';
  const comments = collapseWhitespace(officialItem.Comments || officialItem.Commentss || match.result || '');
  let margin = '';
  if (comments) {
    let remainder = comments;
    const possibleWinnerNames = [
      winner,
      officialItem.FirstBattingTeamName,
      officialItem.SecondBattingTeamName,
      match.team1?.name,
      match.team2?.name,
    ].filter(Boolean);
    for (const name of possibleWinnerNames) {
      const normalizedComment = remainder.toLowerCase();
      const normalizedName = String(name).toLowerCase();
      if (normalizedComment.startsWith(normalizedName)) {
        remainder = remainder.slice(name.length).trim();
        break;
      }
    }
    margin = remainder.replace(/\s+/g, ' ').trim();
    if (margin) {
      margin = margin.charAt(0).toLowerCase() + margin.slice(1);
      margin = margin.replace(/\bRuns\b/g, 'runs').replace(/\bWickets\b/g, 'wickets');
    }
  }
  const manOfTheMatch = collapseWhitespace(String(officialItem.MOM || '').replace(/\s*\([^)]*\)\s*$/, ''));
  return {
    winner: winner || '',
    margin,
    ...(manOfTheMatch ? { manOfTheMatch } : {}),
  };
}

function buildResultText(match, officialItem, officialTeamIdToLocal) {
  const result = buildResult(match, officialItem, officialTeamIdToLocal);
  const winnerTeam = officialTeamIdToLocal.get(String(officialItem.WinningTeamID || '')) || null;
  const comments = collapseWhitespace(officialItem.Comments || officialItem.Commentss || match.result || '');

  if (winnerTeam && result.margin) {
    return `${winnerTeam.shortName || winnerTeam.name} ${result.margin}`;
  }

  return comments;
}

function inferTossDecision(tossDetails) {
  const lower = String(tossDetails || '').toLowerCase();
  if (lower.includes('field')) return 'bowl';
  if (lower.includes('bat')) return 'bat';
  return '';
}

function buildMatchInfo(match, officialItem, officialTeamIdToLocal) {
  const tossTeam = collapseWhitespace(officialItem.TossTeam || '');
  const tossWinner = officialTeamIdToLocal.get(String(officialItem.TossTeamID || ''))?.name
    || Array.from(officialTeamIdToLocal.values()).find((team) => {
      const localName = collapseWhitespace(team.name || '').toLowerCase();
      const localShort = normalizeTeamCode(team.shortName || '');
      const normalizedTossTeam = tossTeam.toLowerCase();
      return localName === normalizedTossTeam || localShort === normalizeTeamCode(tossTeam);
    })?.name
    || '';
  return {
    matchId: String(match.id),
    team1: { ...match.team1, id: Number(match.team1.id) },
    team2: { ...match.team2, id: Number(match.team2.id) },
    venue: collapseWhitespace(officialItem.GroundName || match.venue || ''),
    date: match.date,
    time: officialItem.MatchTime || match.time || '',
    toss: tossWinner ? {
      winner: tossWinner,
      decision: inferTossDecision(officialItem.TossDetails),
    } : undefined,
  };
}

function formatScoreSummary(innings) {
  if (!innings) return '';
  return `${Number(innings.totalRuns || 0)}/${Number(innings.totalWickets || 0)} (${innings.totalOvers || '0.0'} overs)`;
}

function buildMatchPatch(match, innings, officialItem, officialTeamIdToLocal) {
  const inningsByTeamId = new Map(
    innings
      .filter(Boolean)
      .map((entry) => [String(entry.battingTeamId), entry])
  );
  const team1Innings = inningsByTeamId.get(String(match.team1.id));
  const team2Innings = inningsByTeamId.get(String(match.team2.id));

  return {
    status: 'completed',
    result: buildResultText(match, officialItem, officialTeamIdToLocal),
    team1Score: formatScoreSummary(team1Innings),
    team2Score: formatScoreSummary(team2Innings),
    score: {
      team1: team1Innings
        ? {
            runs: Number(team1Innings.totalRuns || 0),
            wickets: Number(team1Innings.totalWickets || 0),
            overs: String(team1Innings.totalOvers || '0.0'),
          }
        : undefined,
      team2: team2Innings
        ? {
            runs: Number(team2Innings.totalRuns || 0),
            wickets: Number(team2Innings.totalWickets || 0),
            overs: String(team2Innings.totalOvers || '0.0'),
          }
        : undefined,
    },
  };
}

function toFallOfWickets(rows) {
  return (rows || []).map((row) => ({
    player: cleanPlayerDisplayName(row.PlayerName),
    score: `${row.FallScore}-${row.FallWickets}`,
    over: String(row.FallOvers || ''),
  }));
}

function shouldIncludeBatter(row) {
  const runs = Number(row.Runs || 0);
  const balls = Number(row.Balls || 0);
  const dismissal = collapseWhitespace(row.OutDesc);
  if (runs > 0 || balls > 0) return true;
  if (dismissal) return true;
  return false;
}

function buildInnings({
  inningsNumber,
  inningsData,
  localBattingTeamId,
  localBowlingTeamId,
  playerMaps,
  unmatched,
}) {
  const batting = (inningsData.BattingCard || [])
    .filter(shouldIncludeBatter)
    .map((row) => {
      const name = cleanPlayerDisplayName(row.PlayerName);
      const dismissal = parseDismissal(row.OutDesc);
      return {
        playerId: resolveLocalPlayerId({
          teamId: localBattingTeamId,
          officialName: name,
          fallbackOfficialId: row.PlayerID || row.PLAYER_ID,
          playerMaps,
          unmatched,
        }),
        name,
        runs: Number(row.Runs || 0),
        balls: Number(row.Balls || 0),
        fours: Number(row.Fours || 0),
        sixes: Number(row.Sixes || 0),
        strikeRate: Number.parseFloat(String(row.StrikeRate || 0)) || 0,
        dismissal,
        isCaptain: /\(c\)/i.test(String(row.PlayerName || '')),
      };
    });

  const bowling = (inningsData.BowlingCard || []).map((row) => {
    const name = cleanPlayerDisplayName(row.PlayerName);
    const oversSplit = splitOvers(row.Overs);
    return {
      playerId: resolveLocalPlayerId({
        teamId: localBowlingTeamId,
        officialName: name,
        fallbackOfficialId: row.PlayerID || row.PLAYER_ID,
        playerMaps,
        unmatched,
      }),
      name,
      overs: oversSplit.overs,
      balls: oversSplit.balls,
      runs: Number(row.Runs || 0),
      wickets: Number(row.Wickets || 0),
      maidens: Number(row.Maidens || 0),
      economyRate: Number(row.Economy || 0),
      isCaptain: /\(c\)/i.test(String(row.PlayerName || '')),
      wides: Number(row.Wides || 0),
      noBalls: Number(row.NoBalls || 0),
    };
  });

  const extrasRow = (inningsData.Extras || [])[0] || {};
  return {
    inningsNumber,
    battingTeamId: Number(localBattingTeamId),
    batting,
    bowling,
    extras: {
      wides: Number(extrasRow.Wides || 0),
      noBalls: Number(extrasRow.NoBalls || 0),
      byes: Number(extrasRow.Byes || 0),
      legByes: Number(extrasRow.LegByes || 0),
    },
    totalRuns: Number(extrasRow.FallScore || 0),
    totalWickets: Number(extrasRow.FallWickets || 0),
    totalOvers: parseTotalOvers(extrasRow.FallOvers || '0.0'),
    fallOfWickets: toFallOfWickets(inningsData.FallOfWickets || []),
    powerplays: buildPowerplay(inningsData.OverHistory || []),
    partnerships: dedupePartnerships(inningsData.PartnershipScores || []),
  };
}

function buildOfficialLookup(scheduleItems) {
  const officialNameToCode = (name) => {
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
  };

  const byExact = new Map();
  const byUnordered = new Map();
  for (const item of scheduleItems) {
    const code1 = normalizeTeamCode(officialNameToCode(item.HomeTeamName || item.MatchName?.split(' vs ')[0] || ''));
    const code2 = normalizeTeamCode(officialNameToCode(item.AwayTeamName || item.MatchName?.split(' vs ')[1] || ''));
    if (!IPL_SHORT_CODES.has(code1) || !IPL_SHORT_CODES.has(code2)) continue;
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

function getScorecardTimestamp(scorecard) {
  const candidates = [scorecard?.updatedAt, scorecard?.publishedAt, scorecard?.createdAt];
  for (const value of candidates) {
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return 0;
}

async function upsertScorecard(existingDraft, scorecard) {
  const headers = {
    Authorization: `Bearer ${ADMIN_BEARER}`,
    'Content-Type': 'application/json',
  };

  if (existingDraft) {
    const response = await fetch(`${SITE_BASE}/api/scorecards/${existingDraft.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(scorecard),
    });
    if (!response.ok) {
      throw new Error(`Failed updating ${existingDraft.id}: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  const response = await fetch(`${SITE_BASE}/api/scorecards`, {
    method: 'POST',
    headers,
    body: JSON.stringify(scorecard),
  });
  if (!response.ok) {
    throw new Error(`Failed creating scorecard for match ${scorecard.matchId}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function publishScorecard(scorecardId) {
  const response = await fetch(`${SITE_BASE}/api/scorecards/${scorecardId}/publish`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${ADMIN_BEARER}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed publishing ${scorecardId}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function updateMatch(matchId, patch) {
  const response = await fetch(`${SITE_BASE}/api/matches`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${ADMIN_BEARER}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: String(matchId),
      ...patch,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed updating match ${matchId}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  const [matches, scorecards, players, scheduleText] = await Promise.all([
    fetchJson(`${SITE_BASE}/api/matches?league=ipl`, { cache: 'no-store' }),
    fetchJson(`${SITE_BASE}/api/scorecards?league=ipl`, { cache: 'no-store' }),
    fetchJson(`${SITE_BASE}/api/players?league=ipl`, { cache: 'no-store' }),
    fetchText(`${OFFICIAL_FEED_BASE}/284-matchschedule.js`, { cache: 'no-store' }),
  ]);

  const scheduleData = parseJsonp(scheduleText);
  const scheduleItems = Array.isArray(scheduleData.Matchsummary) ? scheduleData.Matchsummary : [];
  const officialLookup = buildOfficialLookup(scheduleItems);
  const playerMaps = buildPlayerMaps(players);

  const eligibleMatches = matches.filter((match) => {
    if (match.league !== 'ipl') return false;
    if (match.status === 'completed') return true;
    if (INCLUDE_UPCOMING) return true;
    if (TARGET_MATCH_IDS.has(String(match.id))) return true;
    return false;
  });
  const scorecardsByMatch = new Map();
  for (const scorecard of scorecards.filter((row) => row.league === 'ipl')) {
    const key = String(scorecard.matchId);
    if (!scorecardsByMatch.has(key)) scorecardsByMatch.set(key, []);
    scorecardsByMatch.get(key).push(scorecard);
  }

  const filteredEligibleMatches =
    TARGET_MATCH_IDS.size > 0
      ? eligibleMatches.filter((match) => TARGET_MATCH_IDS.has(String(match.id)))
      : eligibleMatches;

  const targetMatches = filteredEligibleMatches.filter((match) => {
    if (INCLUDE_PUBLISHED) return true;
    const rows = scorecardsByMatch.get(String(match.id)) || [];
    return !rows.some((row) => !row.draft);
  });

  const unmatched = [];
  const actions = [];

  for (const match of targetMatches) {
    const officialItem = mapInternalToOfficialMatch(match, officialLookup);
    if (!officialItem) {
      throw new Error(
        `No official IPL match mapping found for internal match ${match.id} ${match.date} ${match.team1.shortName} vs ${match.team2.shortName}`
      );
    }

    const officialTeamIdToLocal = new Map([
      [String(officialItem.HomeTeamID), match.team1],
      [String(officialItem.AwayTeamID), match.team2],
    ]);

    const [innings1Text, innings2Text] = await Promise.all([
      fetchText(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings1.js`, { cache: 'no-store' }),
      fetchText(`${OFFICIAL_FEED_BASE}/${officialItem.MatchID}-Innings2.js`, { cache: 'no-store' }),
    ]);

    const innings1Raw = parseJsonp(innings1Text).Innings1;
    const innings2Raw = parseJsonp(innings2Text).Innings2;
    const inningsDataList = [innings1Raw, innings2Raw].filter(Boolean);

    const innings = inningsDataList.map((inningsData, index) => {
      const officialBattingTeamId = String((inningsData.Extras || [])[0]?.TeamID || '');
      const localBattingTeam = officialTeamIdToLocal.get(officialBattingTeamId);
      if (!localBattingTeam) {
        throw new Error(`Unable to map batting team ${officialBattingTeamId} for internal match ${match.id}`);
      }
      const localBowlingTeam = String(localBattingTeam.id) === String(match.team1.id) ? match.team2 : match.team1;
      return buildInnings({
        inningsNumber: index + 1,
        inningsData,
        localBattingTeamId: localBattingTeam.id,
        localBowlingTeamId: localBowlingTeam.id,
        playerMaps,
        unmatched,
      });
    });

    const scorecardDoc = {
      matchId: String(match.id),
      league: 'ipl',
      matchInfo: buildMatchInfo(match, officialItem, officialTeamIdToLocal),
      innings,
      result: buildResult(match, officialItem, officialTeamIdToLocal),
    };

    const existingRows = (scorecardsByMatch.get(String(match.id)) || []).slice().sort(
      (a, b) => getScorecardTimestamp(b) - getScorecardTimestamp(a)
    );
    const existingPublished = existingRows.find((row) => row.draft === false) || null;
    const existingDraft = existingRows.find((row) => row.draft === true) || null;
    const existingScorecard = existingPublished || existingDraft || null;
    if (existingPublished) {
      scorecardDoc.draft = false;
      scorecardDoc.publishedAt = existingPublished.publishedAt || new Date().toISOString();
    }

    actions.push({
      matchId: String(match.id),
      officialMatchId: String(officialItem.MatchID),
      label: `${match.date} ${match.team1.shortName} vs ${match.team2.shortName}`,
      existingScorecard,
      matchPatch: buildMatchPatch(match, innings, officialItem, officialTeamIdToLocal),
      scorecard: scorecardDoc,
    });
  }

  const uniqueUnmatched = Array.from(new Map(unmatched.map((row) => [`${row.teamId}|${row.normalized}`, row])).values());

  console.log(`Eligible IPL matches: ${eligibleMatches.length}`);
  console.log(`Missing published scorecards: ${eligibleMatches.filter((match) => {
    const rows = scorecardsByMatch.get(String(match.id)) || [];
    return !rows.some((row) => !row.draft);
  }).length}`);
  if (TARGET_MATCH_IDS.size > 0) {
    console.log(`Targeted matches: ${Array.from(TARGET_MATCH_IDS).join(', ')}`);
  }
  console.log(`Prepared actions: ${actions.length}`);
  console.log(`Unmatched players: ${uniqueUnmatched.length}`);

  if (uniqueUnmatched.length > 0) {
    for (const row of uniqueUnmatched) {
      console.log(
        `UNMATCHED team=${row.teamId} name="${row.officialName}" normalized="${row.normalized}" fallback="${row.fallbackOfficialId}"`
      );
    }
  }

  if (DRY_RUN) {
    for (const action of actions.slice(0, 8)) {
      console.log(
        `DRY_RUN ${action.label} <- official ${action.officialMatchId} ${action.existingScorecard ? `(update ${action.existingScorecard.id}${action.existingScorecard.draft === false ? ', published' : ', draft'})` : '(create)'}`
      );
      console.log(
        `DRY_RUN_MATCH ${action.matchId} result="${action.matchPatch.result}" team1Score="${action.matchPatch.team1Score}" team2Score="${action.matchPatch.team2Score}"`
      );
    }
    return;
  }

  let created = 0;
  let updated = 0;
  let published = 0;
  let matchesUpdated = 0;

  for (const action of actions) {
    const saved = await upsertScorecard(action.existingScorecard ? { id: action.existingScorecard.id } : null, action.scorecard);
    if (action.existingScorecard) updated += 1;
    else created += 1;
    if (saved.draft === false) {
      published += 1;
    } else {
      await publishScorecard(saved.id);
      published += 1;
    }
    await updateMatch(action.matchId, action.matchPatch);
    matchesUpdated += 1;
    console.log(`APPLIED ${action.label} -> ${saved.id}`);
  }

  const refreshedScorecards = await fetchJson(`${SITE_BASE}/api/scorecards?league=ipl&nocache=1`, { cache: 'no-store' });
  const refreshedByMatch = new Map();
  for (const scorecard of refreshedScorecards.filter((row) => row.league === 'ipl')) {
    const key = String(scorecard.matchId);
    if (!refreshedByMatch.has(key)) refreshedByMatch.set(key, []);
    refreshedByMatch.get(key).push(scorecard);
  }
  const remainingMissing = eligibleMatches.filter((match) => {
    const rows = refreshedByMatch.get(String(match.id)) || [];
    return !rows.some((row) => !row.draft);
  });

  console.log(`Created: ${created}`);
  console.log(`Updated drafts: ${updated}`);
  console.log(`Published: ${published}`);
  console.log(`Matches updated: ${matchesUpdated}`);
  console.log(`Remaining missing published scorecards: ${remainingMissing.length}`);
  if (remainingMissing.length > 0) {
    for (const match of remainingMissing) {
      console.log(`REMAINING ${match.id} ${match.date} ${match.team1.shortName} vs ${match.team2.shortName}`);
    }
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
