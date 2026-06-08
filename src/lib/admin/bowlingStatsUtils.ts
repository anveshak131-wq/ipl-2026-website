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

export function formatBowlingAverage(value: number): string {
  if (value <= 0) return '';
  return value.toFixed(2);
}

export function formatBowlingEconomy(value: number, balls: number): string {
  if (balls <= 0) return '';
  return value.toFixed(2);
}

export function formatBowlingStrikeRate(value: number): string {
  if (value <= 0) return '';
  return value.toFixed(1);
}

export function formatBowlingDerivedStats(
  derived: BowlingDerivedStats,
  balls: number,
): {
  bowlingAverage: string;
  economy: string;
  bowlingStrikeRate: string;
} {
  return {
    bowlingAverage: formatBowlingAverage(derived.bowlingAverage),
    economy: formatBowlingEconomy(derived.economy, balls),
    bowlingStrikeRate: formatBowlingStrikeRate(derived.bowlingStrikeRate),
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
