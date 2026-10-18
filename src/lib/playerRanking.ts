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

export function extractPlayerMetrics(player: Player, league: League = "ipl") {
  const stats = (player.stats || {}) as Record<string, any>;
  const fmtKey = league === "wpl" ? "WPL" : "IPL";
  const iplBat = (player as any).careerStats?.batting?.[fmtKey] || (player as any).careerStats?.batting?.IPL || {};
  const iplBowl = (player as any).careerStats?.bowling?.[fmtKey] || (player as any).careerStats?.bowling?.IPL || {};

  const runs = Number(iplBat.Runs || iplBat.runs || stats.runs || 0);
  const avg = Number(iplBat.Avg || iplBat.Average || stats.average || stats.battingAverage || 0);
  const sr = Number(iplBat.SR || stats.strikeRate || stats.battingStrikeRate || 0);
  const matches = Number(iplBat.M || iplBowl.M || stats.matches || 0);
  const innings = Number(iplBat.Inn || iplBat.Innings || stats.battingInnings || (runs > 0 ? 1 : 0));
  const fifties = Number(iplBat["50"] || iplBat["50s"] || stats.fifties || 0);
  const hundreds = Number(iplBat["100"] || iplBat["100s"] || stats.hundreds || 0);

  const wickets = Number(iplBowl.Wkts || iplBowl.Wickets || stats.wickets || 0);
  const econ = Number(iplBowl.Econ || iplBowl.Eco || stats.economy || 0);
  const bowlSR = Number(iplBowl.SR || stats.bowlingStrikeRate || 0);
  const maidens = Number(iplBowl.Maidens || stats.maidens || 0);

  return {
    runs,
    avg,
    sr,
    matches,
    innings,
    fifties,
    hundreds,
    wickets,
    econ,
    bowlSR,
    maidens
  };
}

export function computeBattingScore(player: Player, league: League = "ipl"): number {
  const m = extractPlayerMetrics(player, league);
  if (m.runs === 0 && m.matches === 0) return 40;

  const maxRuns = league === "wpl" ? 1200 : 5000;
  const volumeNorm = clamp((m.runs / maxRuns) * 100);
  const avgNorm = clamp((m.avg / 40) * 100);
  const srNorm = clamp(((m.sr - 105) / 55) * 100);
  const milestoneRate = ((m.hundreds * 5 + m.fifties * 2) / Math.max(1, m.innings)) * 200;
  const milestoneNorm = clamp(milestoneRate);

  const score = (volumeNorm * 0.35) + (avgNorm * 0.25) + (srNorm * 0.30) + (milestoneNorm * 0.10);
  return clamp(score);
}

export function computeBowlingScore(player: Player, league: League = "ipl"): number {
  const m = extractPlayerMetrics(player, league);
  if (m.wickets === 0 && m.econ === 0) return 40;

  const maxWkts = league === "wpl" ? 45 : 120;
  const wktNorm = clamp((m.wickets / maxWkts) * 100);
  const econNorm = m.econ > 0 ? clamp(((10.5 - m.econ) / 4.0) * 100) : 50;
  const srNorm = m.bowlSR > 0 ? clamp(((30.0 - m.bowlSR) / 15.0) * 100) : 50;

  const score = (wktNorm * 0.40) + (econNorm * 0.40) + (srNorm * 0.20);
  return clamp(score);
}

export const computeWPLBattingScore = computeBattingScore;
export const computeWPLBowlingScore = computeBowlingScore;

export function computeRoleRawScore(player: Player): number {
  const role = (player.role || "").toLowerCase();
  const subType = (player.allrounderType || "").toLowerCase();
  const league = (player.league as League) || "ipl";

  const batScore = computeBattingScore(player, league);
  const bowlScore = computeBowlingScore(player, league);

  // Pure Batsman / Wicket-keeper: 100% Batting ONLY
  if (role.includes("batsman") || role.includes("batter") || role.includes("keeper")) {
    return Math.round(batScore);
  }

  // Pure Bowler: 100% Bowling ONLY
  if (role.includes("bowler")) {
    return Math.round(bowlScore);
  }

  // Batting All-rounder: 75% Batting, 25% Bowling
  if (subType.includes("batting")) {
    return Math.round((batScore * 0.75) + (bowlScore * 0.25));
  }

  // Bowling All-rounder: 25% Batting, 75% Bowling
  if (subType.includes("bowling")) {
    return Math.round((batScore * 0.25) + (bowlScore * 0.75));
  }

  // General All-rounder: 50% Batting, 50% Bowling
  return Math.round((batScore * 0.50) + (bowlScore * 0.50));
}

export function applyReliability(rawScore: number, sampleUnits: number, league: League = "ipl"): number {
  const k = league === "wpl" ? 4 : 5;
  const baseline = 50;
  const factor = sampleUnits / (sampleUnits + k);
  return rawScore * factor + baseline * (1 - factor);
}

export function gradeFromPercentile(
  score: number,
  playerRole: string,
  _league: League = "ipl",
  allPlayers: Player[] = []
): PlayerGrade {
  // Direct benchmark guarantee: An elite player with >= 82 score is always Grade A
  if (score >= 82) return "A";
  if (score >= 68) return "B";
  if (score >= 50) return "C";

  if (!allPlayers || allPlayers.length <= 1) {
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    if (score >= 45) return "C";
    return "D";
  }

  const roleLower = (playerRole || "").toLowerCase();
  const peerScores = allPlayers
    .filter((p) => {
      const pRole = (p.role || "").toLowerCase();
      if (roleLower.includes("all-rounder")) return pRole.includes("all-rounder");
      if (roleLower.includes("bowler")) return pRole.includes("bowler");
      if (roleLower.includes("keeper")) return pRole.includes("keeper");
      return pRole.includes("batsman") || pRole.includes("batter");
    })
    .map((p) => {
      const raw = computeRoleRawScore(p);
      const matches = Number(p.stats?.matches || (p as any).careerStats?.batting?.IPL?.M || 0);
      return Math.round(applyReliability(raw, matches));
    });

  if (peerScores.length < 3) {
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    if (score >= 45) return "C";
    return "D";
  }

  const q75 = quantile(peerScores, 0.75);
  const q45 = quantile(peerScores, 0.45);
  const q20 = quantile(peerScores, 0.20);

  if (score >= q75) return "A";
  if (score >= q45) return "B";
  if (score >= q20) return "C";
  return "D";
}
