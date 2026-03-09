import { Match } from '@/types';
import { normalizeTeamNameForMatch } from '@/lib/teamNameUtils';

const earliestIndex = (text: string, words: string[]) => {
  let idx = -1;
  for (const w of words) {
    const i = text.indexOf(w);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  return idx;
};

export function getMatchResult(match: Match, teamId: string) {
  if (!match.result) return 'unknown';

  const team = match.team1.id === teamId ? match.team1 : match.team2;
  const normalizedResult = normalizeTeamNameForMatch(String(match.result));

  if (normalizedResult.includes('no result') || normalizedResult.includes('abandoned')) return 'nr';

  // Create team name variants for matching
  const teamVariants = [
    normalizeTeamNameForMatch(team.name),
    normalizeTeamNameForMatch(team.shortName),
    normalizeTeamNameForMatch(team.name?.replace(/-W$/i, '')),
    normalizeTeamNameForMatch(team.shortName?.replace(/-W$/i, '')),
  ].filter(Boolean);

  // Check if any team variant appears in the result
  const teamAppearsInResult = teamVariants.some(variant => 
    normalizedResult.includes(variant)
  );

  if (teamAppearsInResult) {
    // Check for win indicators
    if (normalizedResult.includes(' won by') || 
        normalizedResult.includes(' won ') || 
        normalizedResult.includes(' beat ') ||
        normalizedResult.includes(' defeated ')) {
      return 'win';
    }
  }

  // If team doesn't appear in result or no win indicator, it's a loss
  return 'loss';
}

export default getMatchResult;
