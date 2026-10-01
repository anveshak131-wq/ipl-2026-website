import { League, Player } from '@/types';

export type PlayerGrade = 'A' | 'B' | 'C' | 'D';

const MIN_SAMPLE_FOR_PERCENTILES = 6;
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

// Calibrated League Standards
const BENCHMARKS = {
  wpl: {
    batting: {
      minRunsPerMatch: 8,
      maxRunsPerMatch: 42,
      minSR: 95,
      maxSR: 155,
      minAvg: 14,
      maxAvg: 44,
      minMilestoneRate: 0.05,
      maxMilestoneRate: 0.30,
    },
    bowling: {
      minWicketsPerMatch: 0.25,
      maxWicketsPerMatch: 1.8,
      maxEcon: 9.4,
      minEcon: 5.6,
      maxBowlingAvg: 38,
      minBowlingAvg: 15,
      maxBowlingSR: 28,
      minBowlingSR: 11,
    },
    reliabilityK: 4, // 8-match tournament standard
  },
  ipl: {
    batting: {
      minRunsPerMatch: 10,
      maxRunsPerMatch: 55,
      minSR: 110,
      maxSR: 180,
      minAvg: 18,
      maxAvg: 50,
      minMilestoneRate: 0.05,
      maxMilestoneRate: 0.35,
    },
    bowling: {
      minWicketsPerMatch: 0.3,
      maxWicketsPerMatch: 2.0,
      maxEcon: 10.0,
      minEcon: 6.2,
      maxBowlingAvg: 40,
      minBowlingAvg: 16,
      maxBowlingSR: 28,
      minBowlingSR: 10,
    },
    reliabilityK: 8, // 14-match tournament standard
  },
};

function getBattingSubscore(player: Player): number {
  const stats = player.stats;
  const leagueKey = (player.league || 'ipl').toLowerCase() === 'wpl' ? 'wpl' : 'ipl';
  const cfg = BENCHMARKS[leagueKey].batting;

  const matches = Math.max(0, Number(stats?.matches || 0));
  const runs = Math.max(0, Number(stats?.runs || 0));
  const strikeRate = Math.max(0, Number(stats?.strikeRate || 0));
  const battingAverage = Math.max(0, Number(stats?.average || 0));
  const fifties = Math.max(0, Number(stats?.fifties || 0));
  const hundreds = Math.max(0, Number(stats?.hundreds || 0));

  if (matches <= 0 && runs <= 0) return 40; // Neutral baseline for uncapped/unplayed players

  const effectiveMatches = Math.max(matches, 1);
  const runsPerMatch = runs / effectiveMatches;
  const milestoneRate = (fifties + 2 * hundreds) / effectiveMatches;

  const runsScore = normalizeHigherBetter(runsPerMatch, cfg.minRunsPerMatch, cfg.maxRunsPerMatch);
  const strikeRateScore = normalizeHigherBetter(strikeRate, cfg.minSR, cfg.maxSR);
  const averageScore = normalizeHigherBetter(battingAverage, cfg.minAvg, cfg.maxAvg);
  const milestoneScore = normalizeHigherBetter(milestoneRate, cfg.minMilestoneRate, cfg.maxMilestoneRate);

  return clamp(
    runsScore * 0.35 +
    strikeRateScore * 0.30 +
    averageScore * 0.25 +
    milestoneScore * 0.10
  );
}

function getBowlingSubscore(player: Player): number {
  const stats = player.stats;
  const leagueKey = (player.league || 'ipl').toLowerCase() === 'wpl' ? 'wpl' : 'ipl';
  const cfg = BENCHMARKS[leagueKey].bowling;

  const matches = Math.max(0, Number(stats?.matches || 0));
  const wickets = Math.max(0, Number(stats?.wickets || 0));
  const economy = Math.max(0, Number(stats?.economy || 0));

  if (matches <= 0 && wickets <= 0) return 40;

  const effectiveMatches = Math.max(matches, 1);
  const wicketsPerMatch = wickets / effectiveMatches;

  const bowlingAverageFromStats = Number(stats?.bowlingAverage || 0);
  const derivedBowlingAverage = wickets > 0 && economy > 0 ? (economy * 4 * effectiveMatches) / wickets : 0;
  const bowlingAverage = bowlingAverageFromStats > 0 ? bowlingAverageFromStats : derivedBowlingAverage;
  const bowlingStrikeRateProxy = wickets > 0 ? (effectiveMatches * 24) / wickets : 999;

  const wicketScore = normalizeHigherBetter(wicketsPerMatch, cfg.minWicketsPerMatch, cfg.maxWicketsPerMatch);
  const economyScore = normalizeLowerBetter(economy, cfg.maxEcon, cfg.minEcon);
  const averageScore = normalizeLowerBetter(bowlingAverage, cfg.maxBowlingAvg, cfg.minBowlingAvg);
  const strikeRateScore = normalizeLowerBetter(bowlingStrikeRateProxy, cfg.maxBowlingSR, cfg.minBowlingSR);

  return clamp(
    wicketScore * 0.35 +
    economyScore * 0.30 +
    averageScore * 0.20 +
    strikeRateScore * 0.15
  );
}

/**
 * Computes role-aware and league-calibrated raw score in [0, 100].
 */
export function computeRoleRawScore(player: Player): number {
  if (!player || !player.stats) return 45;

  const role = (player.role || '').toLowerCase();

  if (role.includes('bat') || role.includes('keeper')) {
    return getBattingSubscore(player);
  }

  if (role.includes('bowl')) {
    return getBowlingSubscore(player);
  }

  // All-rounder: balanced blend of batting and bowling
  const batting = getBattingSubscore(player);
  const bowling = getBowlingSubscore(player);
  const balance = 1 - Math.min(1, Math.abs(batting - bowling) / 100);

  return clamp(batting * 0.45 + bowling * 0.45 + balance * 10);
}

/**
 * Shrinks raw score toward baseline using league-specific sample calibration.
 */
export function applyReliability(raw: number, matches: number, league: League = 'ipl'): number {
  const safeRaw = clamp(Number(raw) || 0);
  const safeMatches = Math.max(0, Number(matches) || 0);

  if (safeMatches <= 0) {
    return 40; // Clean baseline for squad players awaiting debut
  }

  const leagueKey = String(league).toLowerCase() === 'wpl' ? 'wpl' : 'ipl';
  const k = BENCHMARKS[leagueKey].reliabilityK;

  const reliability = safeMatches / (safeMatches + k);
  return clamp(reliability * safeRaw + (1 - reliability) * RELIABILITY_BASELINE);
}

/**
 * Assigns A/B/C/D using league and role calibrated percentile distribution.
 */
export function gradeFromPercentile(
  score: number,
  role: Player['role'],
  league: League,
  allPlayers: Player[]
): PlayerGrade {
  const safeScore = clamp(Number(score) || 0);

  if (safeScore <= 0) {
    return 'D';
  }

  const peers = allPlayers.filter(
    (p) => (p?.role || '').toLowerCase() === (role || '').toLowerCase() && 
           (p?.league || 'ipl').toLowerCase() === (league || 'ipl').toLowerCase() && 
           p?.stats
  );

  if (peers.length < MIN_SAMPLE_FOR_PERCENTILES) {
    if (safeScore >= 75) return 'A';
    if (safeScore >= 60) return 'B';
    if (safeScore >= 45) return 'C';
    return 'D';
  }

  const peerScores = peers.map((p) => {
    const raw = computeRoleRawScore(p);
    const matches = Number(p.stats?.matches || 0);
    return applyReliability(raw, matches, league);
  });

  const thresholdA = quantile(peerScores, 0.78);
  const thresholdB = quantile(peerScores, 0.50);
  const thresholdC = quantile(peerScores, 0.22);

  if (safeScore >= thresholdA) return 'A';
  if (safeScore >= thresholdB) return 'B';
  if (safeScore >= thresholdC) return 'C';
  return 'D';
}
