const TEAM_NAME_ALIASES: Record<string, string> = {
  'kings xi punjab': 'Punjab Kings',
  'kings eleven punjab': 'Punjab Kings',
  'delhi daredevils': 'Delhi Capitals',
  'royal challengers bangalore': 'Royal Challengers Bengaluru',
};

const normalizeComparableName = (name?: string) =>
  (name || '')
    .replace(/\s+\(wpl\)|\s+\(ipl\)/gi, '')
    .replace(/\s+women/gi, '')
    .replace(/bengaluru/gi, 'bangalore')
    .replace(/bangalo re/gi, 'bangalore')
    .replace(/\W+/g, ' ')
    .trim()
    .toLowerCase();

export function canonicalizeTeamName(name?: string): string {
  const normalized = normalizeComparableName(name);
  if (!normalized) return '';
  return TEAM_NAME_ALIASES[normalized] || (name || '').trim();
}

export function normalizeTeamNameForMatch(name?: string): string {
  return normalizeComparableName(canonicalizeTeamName(name));
}
