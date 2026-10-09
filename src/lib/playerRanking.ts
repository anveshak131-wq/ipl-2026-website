import { League, Player } from "@/types";

export type PlayerGrade = "A" | "B" | "C" | "D";

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
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

/**
 * Batting Impact Engine
 * Tailored for WPL standards (2023-2026), accounting for boundary rate and strike rate leverage.
 */
export function computeWPLBattingScore(player: Player): number {
  const stats = (player.stats || {}) as Record<string, any>;
  const runs = Number(stats.runs || 0);
  const matches = Number(stats.matches || 0);
  const innings = Number(stats.innings || matches || 1);
  const sr = Number(stats.strikeRate || 100);
  const avg = Number(stats.average || (runs > 0 ? runs / Math.max(1, innings) : 20));
  const fours = Number(stats.fours || 0);
  const sixes = Number(stats.sixes || 0);

  if (runs === 0 && matches === 0) return 40; // Default baseline for unplayed squad members

  const boundaryRuns = fours * 4 + sixes * 6;
  const boundaryPct = runs > 0 ? (boundaryRuns / runs) * 100 : 35;

  // Calibrated ranges for WPL top performers
  const runsPerInningsNorm = clamp(((runs / Math.max(1, innings) - 10) / (45 - 10)) * 100);
  const srNorm = clamp(((sr - 100) / (165 - 100)) * 100);
  const avgNorm = clamp(((avg - 14) / (48 - 14)) * 100);
  const boundaryNorm = clamp(((boundaryPct - 30) / (72 - 30)) * 100);

  const rawBat = (
    runsPerInningsNorm * 0.30 +
    srNorm * 0.35 +
    boundaryNorm * 0.20 +
    avgNorm * 0.15
  );

  // Opportunity damping (needs ~3.5 innings of sample size)
  const confidence = innings / (innings + 3.5);
  return Math.round(rawBat * confidence + 50 * (1 - confidence));
}

/**
 * Bowling Impact Engine
 * Calibrated against WPL pace and spin economies, strike rates, and wicket hauls.
 */
export function computeWPLBowlingScore(player: Player): number {
  const stats = (player.stats || {}) as Record<string, any>;
  const wickets = Number(stats.wickets || 0);
  const matches = Number(stats.matches || 0);
  const overs = Number(stats.overs || matches * 2.5);
  const econ = Number(stats.economy || 8.0);
  const bowlingAvg = Number(stats.bowlingAverage || (wickets > 0 ? (overs * 6) / wickets : 32));

  if (overs < 1.5 && wickets === 0) return 40;

  const wktPerOver = wickets / Math.max(1, overs);
  const wktNorm = clamp(((wktPerOver - 0.10) / (0.60 - 0.10)) * 100);
  const econNorm = clamp(((9.6 - econ) / (9.6 - 5.8)) * 100);
  const avgNorm = clamp(((36 - bowlingAvg) / (36 - 16)) * 100);

  const rawBowl = (
    wktNorm * 0.40 +
    econNorm * 0.35 +
    avgNorm * 0.25
  );

  // Damping: needs ~10 overs bowled to establish true baseline
  const confidence = overs / (overs + 10);
  return Math.round(rawBowl * confidence + 50 * (1 - confidence));
}

/**
 * Computes the role-adjusted performance raw score for any player
 */
export function computeRoleRawScore(player: Player): number {
  const role = (player.role || "").toLowerCase();
  const batScore = computeWPLBattingScore(player);
  const bowlScore = computeWPLBowlingScore(player);

  if (role.includes("all-rounder") || role.includes("allrounder")) {
    // Primary skill takes 65%, secondary takes 35% with a synergy bonus
    const high = Math.max(batScore, bowlScore);
    const low = Math.min(batScore, bowlScore);
    return Math.min(99, Math.round(high * 0.65 + low * 0.35 + 5));
  }

  if (role.includes("bowler")) {
    // Frontline bowlers: 85% bowling impact, 15% batting lower-order value
    return Math.round(bowlScore * 0.85 + batScore * 0.15);
  }

  if (role.includes("keeper") || role.includes("wicket")) {
    // Wicketkeepers: 85% batting impact + glovework standard baseline
    return Math.min(99, Math.round(batScore * 0.85 + 12));
  }

  // Pure Batters
  return batScore;
}

/**
 * Reliability damping wrapper across tournament editions
 */
export function applyReliability(rawScore: number, sampleUnits: number, league: League = "wpl"): number {
  const k = league === "wpl" ? 4 : 5;
  const baseline = 50;
  const factor = sampleUnits / (sampleUnits + k);
  return rawScore * factor + baseline * (1 - factor);
}

/**
 * Derives A / B / C / D letter grade comparing against role peer percentiles
 */
export function gradeFromPercentile(
  score: number,
  playerRole: string,
  _league: League,
  allPlayers: Player[] = []
): PlayerGrade {
  const roleLower = (playerRole || "").toLowerCase();
  
  // Extract scores of cohort peers sharing the same broad role
  const peerScores = allPlayers
    .filter((p) => {
      const pRole = (p.role || "").toLowerCase();
      if (roleLower.includes("all-rounder")) return pRole.includes("all-rounder");
      if (roleLower.includes("bowler")) return pRole.includes("bowler");
      if (roleLower.includes("keeper")) return pRole.includes("keeper");
      return !pRole.includes("bowler") && !pRole.includes("all-rounder");
    })
    .map((p) => computeRoleRawScore(p));

  if (peerScores.length >= 5) {
    const p80 = quantile(peerScores, 0.80);
    const p55 = quantile(peerScores, 0.55);
    const p25 = quantile(peerScores, 0.25);

    if (score >= p80) return "A";
    if (score >= p55) return "B";
    if (score >= p25) return "C";
    return "D";
  }

  // Fallback absolute score thresholds
  if (score >= 82) return "A";
  if (score >= 68) return "B";
  if (score >= 50) return "C";
  return "D";
}
