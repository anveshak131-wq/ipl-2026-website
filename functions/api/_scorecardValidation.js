function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function normalizeToken(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function normalizeId(value) {
  const raw = String(value ?? '').trim();
  return raw.replace(/^team/i, '');
}

function parseOversToBalls(value) {
  if (!hasValue(value)) return 0;
  const raw = String(value).trim();
  const [oversPart, ballsPart = '0'] = raw.split('.');
  const overs = Number(oversPart);
  const balls = Number(ballsPart);
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) return 0;
  return overs * 6 + balls;
}

function getInningsLabel(inning, index) {
  return `Innings ${inning?.inningsNumber || index + 1}`;
}

function getTeamTokens(team) {
  return [
    team?.id,
    team?.name,
    team?.shortName,
  ]
    .filter(hasValue)
    .map(normalizeToken)
    .filter(Boolean);
}

function sideForWinner(scorecard, winner) {
  const winnerToken = normalizeToken(winner);
  if (!winnerToken) return null;

  const team1Tokens = getTeamTokens(scorecard?.matchInfo?.team1);
  const team2Tokens = getTeamTokens(scorecard?.matchInfo?.team2);

  if (team1Tokens.includes(winnerToken)) return 'team1';
  if (team2Tokens.includes(winnerToken)) return 'team2';
  return null;
}

function getTeamInnings(scorecard, teamKey) {
  const teamId = normalizeId(scorecard?.matchInfo?.[teamKey]?.id);
  return (scorecard?.innings || []).find(
    (inning) => normalizeId(inning?.battingTeamId) === teamId,
  );
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    const normalized = normalizeToken(value);
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicates.add(String(value));
    }
    seen.add(normalized);
  }

  return Array.from(duplicates);
}

async function getStoredMatches(env) {
  if (!env?.IPL_CACHE) return [];
  const matches = await env.IPL_CACHE.get('matches', 'json');
  return Array.isArray(matches) ? matches : [];
}

async function getStoredScorecards(env, max = 500) {
  if (!env?.IPL_CACHE) return [];

  const scorecards = [];
  let cursor;

  do {
    const list = await env.IPL_CACHE.list({ prefix: 'scorecard_', cursor });
    cursor = list.cursor;

    for (const item of list.keys || []) {
      if (scorecards.length >= max) return scorecards;
      const raw = await env.IPL_CACHE.get(item.name);
      if (!raw) continue;

      try {
        scorecards.push(JSON.parse(raw));
      } catch {
        // Ignore malformed scorecard records.
      }
    }
  } while (cursor);

  return scorecards;
}

function validateInningsTotals(scorecard, warnings) {
  const innings = Array.isArray(scorecard?.innings) ? scorecard.innings : [];
  if (innings.length === 0) {
    warnings.push('No innings have been added to this scorecard.');
    return;
  }

  innings.forEach((inning, index) => {
    const label = getInningsLabel(inning, index);
    const batting = Array.isArray(inning?.batting) ? inning.batting : [];
    const bowling = Array.isArray(inning?.bowling) ? inning.bowling : [];
    const extras = inning?.extras || {};

    if (batting.length === 0) {
      warnings.push(`${label}: batting card is empty.`);
    }

    const batterRuns = batting.reduce((sum, batter) => sum + toNumber(batter?.runs), 0);
    const extrasTotal =
      toNumber(extras.wides) +
      toNumber(extras.noBalls) +
      toNumber(extras.byes) +
      toNumber(extras.legByes);
    const calculatedRuns = batterRuns + extrasTotal;

    if (hasValue(inning?.totalRuns) && toNumber(inning.totalRuns) !== calculatedRuns) {
      warnings.push(
        `${label}: total runs ${toNumber(inning.totalRuns)} do not match batting runs plus extras (${calculatedRuns}).`,
      );
    }

    const calculatedWickets = batting.filter((batter) => {
      const dismissalType = String(batter?.dismissal?.type || '').toLowerCase();
      return dismissalType && dismissalType !== 'not-out' && dismissalType !== 'retired-hurt';
    }).length;

    if (hasValue(inning?.totalWickets) && toNumber(inning.totalWickets) !== calculatedWickets) {
      warnings.push(
        `${label}: wickets ${toNumber(inning.totalWickets)} do not match recorded dismissals (${calculatedWickets}).`,
      );
    }

    const bowlingBalls = bowling.reduce(
      (sum, bowler) => sum + parseOversToBalls(bowler?.overs),
      0,
    );
    const totalOversBalls = parseOversToBalls(inning?.totalOvers);
    if (bowlingBalls > 0 && totalOversBalls > 0 && bowlingBalls !== totalOversBalls) {
      warnings.push(
        `${label}: total overs ${inning.totalOvers} do not match bowling overs (${Math.floor(bowlingBalls / 6)}.${bowlingBalls % 6}).`,
      );
    }

    const duplicateBatters = findDuplicates(
      batting.map((batter) => batter?.playerId || batter?.name),
    );
    if (duplicateBatters.length > 0) {
      warnings.push(`${label}: duplicate batters found (${duplicateBatters.join(', ')}).`);
    }

    const duplicateBowlers = findDuplicates(
      bowling.map((bowler) => bowler?.playerId || bowler?.name),
    );
    if (duplicateBowlers.length > 0) {
      warnings.push(`${label}: duplicate bowlers found (${duplicateBowlers.join(', ')}).`);
    }
  });
}

function validateToss(scorecard, warnings) {
  const toss = scorecard?.matchInfo?.toss;
  if (!hasValue(toss?.winner) || !hasValue(toss?.decision)) {
    warnings.push('Toss winner and decision are missing.');
  }
}

function validatePlaying11(match, warnings) {
  if (!match) {
    warnings.push('Could not find the linked match, so playing 11 completeness could not be checked.');
    return;
  }

  const team1 = Array.isArray(match?.playing11?.team1) ? match.playing11.team1.map(String).filter(Boolean) : [];
  const team2 = Array.isArray(match?.playing11?.team2) ? match.playing11.team2.map(String).filter(Boolean) : [];

  if (team1.length !== 11 || team2.length !== 11) {
    warnings.push(`Playing 11 is incomplete (${team1.length}/11 for team 1, ${team2.length}/11 for team 2).`);
  }

  if (team1.length > 0 || team2.length > 0) {
    if (!match?.playing11?.setAt) {
      warnings.push('Playing 11 exists but has not been published yet.');
    }

    const team1Duplicates = findDuplicates(team1);
    const team2Duplicates = findDuplicates(team2);
    const overlap = team1.filter((id) => team2.includes(id));

    if (team1Duplicates.length > 0) {
      warnings.push(`Duplicate players found in team 1 playing 11 (${team1Duplicates.join(', ')}).`);
    }
    if (team2Duplicates.length > 0) {
      warnings.push(`Duplicate players found in team 2 playing 11 (${team2Duplicates.join(', ')}).`);
    }
    if (overlap.length > 0) {
      warnings.push(`Players appear in both playing 11s (${Array.from(new Set(overlap)).join(', ')}).`);
    }
  }
}

function validatePointsTableRisk(scorecard, match, scorecards, currentScorecardId, warnings) {
  const publishedForSameMatch = scorecards.filter(
    (candidate) =>
      candidate?.draft === false &&
      String(candidate?.matchId || '') === String(scorecard?.matchId || '') &&
      String(candidate?.id || '') !== String(currentScorecardId || scorecard?.id || ''),
  );

  if (publishedForSameMatch.length > 0) {
    warnings.push('Points table check: another published scorecard already exists for this match.');
  }

  const resultWinner = scorecard?.result?.winner;
  const team1Innings = getTeamInnings(scorecard, 'team1');
  const team2Innings = getTeamInnings(scorecard, 'team2');
  const team1Runs = hasValue(team1Innings?.totalRuns) ? toNumber(team1Innings.totalRuns) : null;
  const team2Runs = hasValue(team2Innings?.totalRuns) ? toNumber(team2Innings.totalRuns) : null;
  const hasScore = team1Runs !== null || team2Runs !== null;

  if (hasScore && !hasValue(resultWinner)) {
    warnings.push('Points table check: result winner is missing, so standings may not update.');
    return;
  }

  const winnerSide = sideForWinner(scorecard, resultWinner);
  if (hasValue(resultWinner) && !winnerSide) {
    warnings.push('Points table check: result winner does not match either team.');
    return;
  }

  if (winnerSide && team1Runs !== null && team2Runs !== null) {
    const winnerRuns = winnerSide === 'team1' ? team1Runs : team2Runs;
    const loserRuns = winnerSide === 'team1' ? team2Runs : team1Runs;
    const resultText = `${scorecard?.result?.margin || ''} ${scorecard?.result?.reason || ''} ${scorecard?.result?.resultType || ''}`.toLowerCase();
    const hasSpecialResult = /dls|vjd|super over|no result|abandoned|washout|retired/.test(resultText);

    if (winnerRuns < loserRuns && !hasSpecialResult) {
      warnings.push('Points table check: selected winner has fewer runs than the opponent.');
    }

    if (winnerRuns === loserRuns && !hasSpecialResult) {
      warnings.push('Points table check: scores are tied without a Super Over or no-result note.');
    }
  }

  if (match?.status === 'completed' && hasValue(match?.result) && hasValue(resultWinner)) {
    const resultText = normalizeToken(match.result);
    const winnerTokens = winnerSide === 'team1'
      ? getTeamTokens(scorecard?.matchInfo?.team1)
      : getTeamTokens(scorecard?.matchInfo?.team2);
    const existingResultMentionsWinner = winnerTokens.some((token) => resultText.includes(token));
    if (!existingResultMentionsWinner) {
      warnings.push('Points table check: existing match result differs from this scorecard winner.');
    }
  }
}

export async function validateScorecardForPublish(scorecard, env, options = {}) {
  const errors = [];
  const warnings = [];

  if (!scorecard || typeof scorecard !== 'object') {
    errors.push('Scorecard payload is missing.');
    return { errors, warnings, checkedAt: new Date().toISOString() };
  }

  if (!hasValue(scorecard.matchId)) {
    errors.push('Scorecard is missing matchId.');
  }

  if (!scorecard.matchInfo?.team1 || !scorecard.matchInfo?.team2) {
    errors.push('Scorecard is missing team information.');
  }

  validateToss(scorecard, warnings);
  validateInningsTotals(scorecard, warnings);

  const matches = await getStoredMatches(env);
  const match = matches.find((candidate) => String(candidate?.id) === String(scorecard.matchId)) || null;
  validatePlaying11(match, warnings);

  const scorecards = await getStoredScorecards(env);
  validatePointsTableRisk(scorecard, match, scorecards, options.currentScorecardId, warnings);

  return {
    errors,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}
