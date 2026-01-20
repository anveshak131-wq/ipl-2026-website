import { Match } from '@/types';

const normalize = (s?: string) =>
  (s || '')
    .replace(/\s+\(wpl\)|\s+\(ipl\)/gi, '')
    .replace(/\s+women/gi, '')
    .replace(/bengaluru/gi, 'bangalore')
    .replace(/\W+/g, ' ')
    .trim()
    .toLowerCase();

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
  const normalizedResult = normalize(String(match.result));

  if (normalizedResult.includes('no result') || normalizedResult.includes('abandoned')) return 'nr';

  const variants = Array.from(
    new Set([
      normalize(team.name),
      normalize(team.shortName),
      normalize(team.name?.replace(/-W$/i, '')),
      normalize(team.shortName?.replace(/-W$/i, '')),
    ].filter(Boolean) as string[])
  );

  const winWords = [' won ', ' won by ', ' win ', ' beat ', ' defeated ', 'defeat', 'defeated', 'beat'];
  const lossWords = [' lost ', ' lost to ', ' lost by '];

  for (const v of variants) {
    const vi = normalizedResult.indexOf(v);
    if (vi === -1) continue;

    const winIdx = earliestIndex(normalizedResult, winWords);
    const lossIdx = earliestIndex(normalizedResult, lossWords.concat([' beat ', 'defeated', ' lost ']));

    if (normalizedResult.includes('lost') && normalizedResult.indexOf('lost') < vi) return 'loss';
    if (winIdx !== -1 && vi < winIdx) return 'win';
    if (lossIdx !== -1 && vi > lossIdx) return 'loss';
    if (winIdx !== -1) return vi <= winIdx + 40 ? 'win' : 'loss';

    return 'loss';
  }

  return 'loss';
}

export default getMatchResult;
