export interface BattingBaseStatsInput {
  battingInnings: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
}

export interface BattingDerivedStats {
  battingAverage: number;
  strikeRate: number;
}

export function getBattingDismissals(battingInnings: number, notOuts: number): number {
  return Math.max(battingInnings - notOuts, 0);
}

/**
 * Standard cricket batting derived stats from cumulative totals.
 * - Average = Runs / Dismissals, where Dismissals = Innings − Not Outs
 * - Strike Rate = (Runs × 100) / Balls Faced
 *
 * Ducks are tracked separately and do not change these formulas.
 */
export function calculateBattingDerivedStats({
  battingInnings,
  notOuts,
  runs,
  ballsFaced,
}: BattingBaseStatsInput): BattingDerivedStats {
  const dismissals = getBattingDismissals(battingInnings, notOuts);
  const battingAverage = dismissals > 0 ? runs / dismissals : 0;
  const strikeRate = ballsFaced > 0 ? (runs * 100) / ballsFaced : 0;

  return { battingAverage, strikeRate };
}

export function formatBattingAverage(value: number, dismissals: number): string {
  if (dismissals <= 0) return '';
  return value.toFixed(2);
}

export function formatBattingStrikeRate(value: number, ballsFaced: number): string {
  if (ballsFaced <= 0) return '';
  return value.toFixed(2);
}

export function getBattingAverageDisplayFromStats(stats: {
  runs?: number;
  battingInnings?: number;
  notOuts?: number;
}): string {
  const runs = stats.runs ?? 0;
  const dismissals = getBattingDismissals(stats.battingInnings ?? 0, stats.notOuts ?? 0);
  if (dismissals <= 0) return '-';
  return (runs / dismissals).toFixed(2);
}

export function getBattingStrikeRateDisplayFromStats(stats: {
  runs?: number;
  ballsFaced?: number;
}): string {
  const runs = stats.runs ?? 0;
  const ballsFaced = stats.ballsFaced ?? 0;
  if (ballsFaced <= 0) return '-';
  return ((runs * 100) / ballsFaced).toFixed(2);
}

export function getBattingAverageSortValue(stats: {
  runs?: number;
  battingInnings?: number;
  notOuts?: number;
}): number {
  const runs = stats.runs ?? 0;
  const dismissals = getBattingDismissals(stats.battingInnings ?? 0, stats.notOuts ?? 0);
  return dismissals > 0 ? runs / dismissals : 0;
}

export function getBattingStrikeRateSortValue(stats: {
  runs?: number;
  ballsFaced?: number;
}): number {
  const runs = stats.runs ?? 0;
  const ballsFaced = stats.ballsFaced ?? 0;
  return ballsFaced > 0 ? (runs * 100) / ballsFaced : 0;
}

export function parseBattingStatInput(value: string): number | '' {
  if (value === '') return '';
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? '' : parsed;
}

export function formatBattingDerivedStats(
  derived: BattingDerivedStats,
  battingInnings: number,
  notOuts: number,
  ballsFaced: number,
): {
  battingAverage: string;
  battingStrikeRate: string;
} {
  const dismissals = getBattingDismissals(battingInnings, notOuts);

  return {
    battingAverage: formatBattingAverage(derived.battingAverage, dismissals),
    battingStrikeRate: formatBattingStrikeRate(derived.strikeRate, ballsFaced),
  };
}

export function parseBattingStatNumber(
  value: string | number | undefined | null,
  fallback = 0,
): number {
  if (value === '' || value === undefined || value === null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
