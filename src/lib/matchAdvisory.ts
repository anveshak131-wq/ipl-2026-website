import type { Match } from '@/types';

export type MatchAdvisoryType = 'abandoned' | 'reduced-overs' | 'no-result' | 'note';

export interface MatchAdvisory {
  type: MatchAdvisoryType;
  title: string;
  detail?: string;
}

const normalize = (value?: unknown) => (typeof value === 'string' ? value.trim() : '');

const hasNoResult = (text: string) => {
  const normalized = text.toLowerCase();
  return normalized.includes('no result') || normalized.includes('no-result');
};

const hasAbandoned = (text: string) => text.toLowerCase().includes('abandon');

export function getMatchAdvisory(match?: Partial<Match> | null): MatchAdvisory | null {
  if (!match) return null;

  const note = normalize(match.statusNote);
  const resultText = normalize(match.result);
  const reasonText = normalize(match.resultReason);
  const detailText = normalize(match.resultReasonDetail);
  const combined = `${resultText} ${reasonText} ${detailText}`.trim();

  const isExplicitAbandoned = match.resultType === 'abandoned' || hasAbandoned(combined);
  const isCancelled = match.status === 'cancelled';

  if (isExplicitAbandoned || isCancelled) {
    const title = isExplicitAbandoned ? 'Match abandoned' : 'Match cancelled';
    return {
      type: 'abandoned',
      title,
      detail: note || resultText || undefined,
    };
  }

  const reducedOversValue = typeof match.reducedOversTo === 'number'
    ? match.reducedOversTo
    : Number.NaN;
  const isReducedOvers = Number.isFinite(reducedOversValue) && reducedOversValue > 0;

  if (isReducedOvers) {
    const parts = [`Overs reduced to ${reducedOversValue} per side`];
    if (match.dlsApplied) parts.push('DLS method applied');
    if (note) parts.push(note);
    return {
      type: 'reduced-overs',
      title: 'Overs reduced',
      detail: parts.join(' • '),
    };
  }

  if (match.resultType === 'no-result' || hasNoResult(combined)) {
    return {
      type: 'no-result',
      title: 'No result',
      detail: note || resultText || undefined,
    };
  }

  if (note) {
    return {
      type: 'note',
      title: 'Match update',
      detail: note,
    };
  }

  return null;
}
