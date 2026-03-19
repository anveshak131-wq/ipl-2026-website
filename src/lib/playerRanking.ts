import { League, Player } from '@/types';

export type PlayerGrade = 'A' | 'B' | 'C' | 'D';

const MIN_SAMPLE_FOR_PERCENTILES = 8;
const DEFAULT_RELIABILITY_K = 10;
const RELIABILITY_BASELINE = 50;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeHigherBetter(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100);
}

function normalizeLowerBetter(value: number, max: number, min: number): number {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 0;
  return clamp(((max - value) / (max - min)) * 100);
}

function quantile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * clamp(p, 0, 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);

  if (low === high) return sorted[low];

  const weight = index - low;
  return sorted[low] + (sorted[high] - sorted[low]) * weight;
}

function getBattingSubscore(player: Player): number {
  const stats = player.stats;
  const matches = Math.max(0, Number(stats?.matches || 0));
  const runs = Math.max(0, Number(stats?.runs || 0));
  const strikeRate = Math.max(0, Number(stats?.strikeRate || 0));
  const battingAverage = Math.max(0, Number(stats?.average || 0));
  const fifties = Math.max(0, Number(stats?.fifties || 0));
  const hundreds = Math.max(0, Number(stats?.hundreds || 0));

  if (matches <= 0) return 0;

  const runsPerMatch = runs / matches;
  const milestoneRate = (fifties + 2 * hundreds) / matches;

  const runsScore = normalizeHigherBetter(runsPerMatch, 10, 55);
  const strikeRateScore = normalizeHigherBetter(strikeRate, 110, 180);
  const averageScore = normalizeHigherBetter(battingAverage, 18, 50);
  const milestoneScore = normalizeHigherBetter(milestoneRate, 0.05, 0.35);

  return clamp(
    runsScore * 0.35 +
      strikeRateScore * 0.3 +
      averageScore * 0.25 +
      milestoneScore * 0.1
  );
}

function getBowlingSubscore(player: Player): number {
  const stats = player.stats;
  const matches = Math.max(0, Number(stats?.matches || 0));
  const wickets = Math.max(0, Number(stats?.wickets || 0));
  const economy = Math.max(0, Number(stats?.economy || 0));

  if (matches <= 0) return 0;

  const wicketsPerMatch = wickets / matches;

  const bowlingAverageFromStats = Number(stats?.bowlingAverage || 0);
  const derivedBowlingAverage = wickets > 0 && economy > 0 ? (economy * 4 * matches) / wickets : 0;
  const bowlingAverage = bowlingAverageFromStats > 0 ? bowlingAverageFromStats : derivedBowlingAverage;

  // Approximation: 24 balls per match (4 overs) when explicit balls-bowled is unavailable.
  const bowlingStrikeRateProxy = wickets > 0 ? (matches * 24) / wickets : 999;

  const wicketScore = normalizeHigherBetter(wicketsPerMatch, 0.3, 2.0);
  const economyScore = normalizeLowerBetter(economy, 9.5, 5.8);
  const averageScore = normalizeLowerBetter(bowlingAverage, 40, 16);
  const strikeRateScore = normalizeLowerBetter(bowlingStrikeRateProxy, 28, 10);

  return clamp(
    wicketScore * 0.35 +
      economyScore * 0.3 +
      averageScore * 0.2 +
      strikeRateScore * 0.15
  );
}

/**
 * Computes role-aware raw score in [0, 100] using available season aggregate stats.
 */
export function computeRoleRawScore(player: Player): number {
  if (!player || !player.stats) return 0;

  if (player.role === 'Batsman' || player.role === 'Wicket-keeper') {
    return getBattingSubscore(player);
  }

  if (player.role === 'Bowler') {
    return getBowlingSubscore(player);
  }

  // All-rounder: combine batting and bowling plus a balance bonus.
  const batting = getBattingSubscore(player);
  const bowling = getBowlingSubscore(player);
  const balance = 1 - Math.min(1, Math.abs(batting - bowling) / 100);

  return clamp(batting * 0.4 + bowling * 0.4 + balance * 20);
}

/**
 * Shrinks a raw score toward baseline for small samples to reduce early-season noise.
 */
export function applyReliability(raw: number, matches: number): number {
  const safeRaw = clamp(Number(raw) || 0);
  const safeMatches = Math.max(0, Number(matches) || 0);
  const reliability = safeMatches / (safeMatches + DEFAULT_RELIABILITY_K);

  return clamp(reliability * safeRaw + (1 - reliability) * RELIABILITY_BASELINE);
}

/**
 * Assigns A/B/C/D using role+league percentile bands among peer players.
 * Bands: A top 20%, B next 30%, C next 30%, D bottom 20%.
 */
export function gradeFromPercentile(
  score: number,
  role: Player['role'],
  league: League,
  allPlayers: Player[]
): PlayerGrade {
  const safeScore = clamp(Number(score) || 0);
  const peers = allPlayers.filter(
    (p) => p?.role === role && p?.league === league && p?.stats
  );

  if (peers.length < MIN_SAMPLE_FOR_PERCENTILES) {
    if (safeScore >= 80) return 'A';
    if (safeScore >= 60) return 'B';
    if (safeScore >= 40) return 'C';
    return 'D';
  }

  const peerScores = peers.map((p) => {
    const raw = computeRoleRawScore(p);
    const matches = Number(p.stats?.matches || 0);
    return applyReliability(raw, matches);
  });

  const thresholdA = quantile(peerScores, 0.8);
  const thresholdB = quantile(peerScores, 0.5);
  const thresholdC = quantile(peerScores, 0.2);

  if (safeScore >= thresholdA) return 'A';
  if (safeScore >= thresholdB) return 'B';
  if (safeScore >= thresholdC) return 'C';
  return 'D';
}
