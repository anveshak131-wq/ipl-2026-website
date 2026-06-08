export interface BowlingBaseStatsInput {
  balls: number;
  runsConceded: number;
  wickets: number;
}

export interface BowlingDerivedStats {
  bowlingAverage: number;
  economy: number;
  bowlingStrikeRate: number;
}

/**
 * Standard cricket bowling derived stats from cumulative totals.
 * - Average = Runs Conceded / Wickets
 * - Economy = (Runs Conceded × 6) / Balls
 * - Strike Rate = Balls / Wickets
 */
export function calculateBowlingDerivedStats({
  balls,
  runsConceded,
  wickets,
}: BowlingBaseStatsInput): BowlingDerivedStats {
  const bowlingAverage = wickets > 0 ? runsConceded / wickets : 0;
  const economy = balls > 0 ? (runsConceded * 6) / balls : 0;
  const bowlingStrikeRate = wickets > 0 && balls > 0 ? balls / wickets : 0;

  return { bowlingAverage, economy, bowlingStrikeRate };
}

export function formatBowlingAverage(value: number, wickets: number): string {
  if (wickets <= 0) return '';
  return value.toFixed(2);
}

export function formatBowlingEconomy(value: number, balls: number): string {
  if (balls <= 0) return '';
  return value.toFixed(2);
}

export function formatBowlingStrikeRate(value: number, wickets: number): string {
  if (wickets <= 0) return '';
  return value.toFixed(1);
}

export function getBowlingAverageDisplayFromStats(stats: {
  runsConceded?: number;
  wickets?: number;
}): string {
  const wickets = stats.wickets ?? 0;
  const runsConceded = stats.runsConceded ?? 0;
  if (wickets <= 0) return '-';
  return (runsConceded / wickets).toFixed(2);
}

export function getBowlingEconomyDisplayFromStats(stats: {
  runsConceded?: number;
  balls?: number;
}): string {
  const balls = stats.balls ?? 0;
  const runsConceded = stats.runsConceded ?? 0;
  if (balls <= 0) return '-';
  return ((runsConceded * 6) / balls).toFixed(2);
}

export function getBowlingStrikeRateDisplayFromStats(stats: {
  balls?: number;
  wickets?: number;
}): string {
  const balls = stats.balls ?? 0;
  const wickets = stats.wickets ?? 0;
  if (wickets <= 0 || balls <= 0) return '-';
  return (balls / wickets).toFixed(1);
}

export function getBowlingAverageSortValue(stats: {
  runsConceded?: number;
  wickets?: number;
}): number {
  const wickets = stats.wickets ?? 0;
  const runsConceded = stats.runsConceded ?? 0;
  return wickets > 0 ? runsConceded / wickets : Infinity;
}

export function getBowlingEconomySortValue(stats: {
  runsConceded?: number;
  balls?: number;
}): number {
  const balls = stats.balls ?? 0;
  const runsConceded = stats.runsConceded ?? 0;
  return balls > 0 ? (runsConceded * 6) / balls : Infinity;
}

export function getBowlingStrikeRateSortValue(stats: {
  balls?: number;
  wickets?: number;
}): number {
  const balls = stats.balls ?? 0;
  const wickets = stats.wickets ?? 0;
  return wickets > 0 && balls > 0 ? balls / wickets : Infinity;
}

export function parseBowlingStatInput(value: string): number | '' {
  if (value === '') return '';
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? '' : parsed;
}

export function formatBowlingDerivedStats(
  derived: BowlingDerivedStats,
  balls: number,
  wickets: number,
): {
  bowlingAverage: string;
  economy: string;
  bowlingStrikeRate: string;
} {
  return {
    bowlingAverage: formatBowlingAverage(derived.bowlingAverage, wickets),
    economy: formatBowlingEconomy(derived.economy, balls),
    bowlingStrikeRate: formatBowlingStrikeRate(derived.bowlingStrikeRate, wickets),
  };
}

export function parseBowlingStatNumber(
  value: string | number | undefined | null,
  fallback = 0,
): number {
  if (value === '' || value === undefined || value === null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
