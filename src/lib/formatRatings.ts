export type CricketFormat = 'Test' | 'ODI' | 'T20I' | 'IPL';

export interface FormatRatingResult {
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  label: 'Legendary' | 'World Class' | 'Quality' | 'Average' | 'Developing';
  batScore: number;
  bowlScore: number;
}

function clamp(val: number, min = 0, max = 100): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function scaleRange(val: number, minBound: number, maxBound: number, invert = false): number {
  if (val <= 0 && invert) return 50;
  const pct = (val - minBound) / (maxBound - minBound);
  const clamped = clamp(pct * 100);
  return invert ? 100 - clamped : clamped;
}

export function calculateSingleFormatRating(
  player: any,
  format: CricketFormat
): FormatRatingResult {
  const altFmt = format === 'T20I' ? 'T20' : format;
  const career = player.careerStats || {};
  const bat = career.batting?.[format] || career.batting?.[altFmt] || {};
  const bowl = career.bowling?.[format] || career.bowling?.[altFmt] || {};

  // Batting metrics
  const runs = Number(bat.Runs || bat.runs || (format === 'IPL' ? player.stats?.runs : 0) || 0);
  const avg = Number(bat.Avg || bat.Average || (format === 'IPL' ? player.stats?.average : 0) || 0);
  const sr = Number(bat.SR || (format === 'IPL' ? player.stats?.strikeRate : 0) || 0);
  const inn = Number(bat.Inn || bat.Innings || (runs > 0 ? 1 : 0));
  const hundreds = Number(bat['100'] || bat['100s'] || 0);
  const fifties = Number(bat['50'] || bat['50s'] || 0);
  const doubleHundreds = Number(bat['200'] || bat['200s'] || 0);

  // Bowling metrics
  const wkts = Number(bowl.Wkts || bowl.Wickets || (format === 'IPL' ? player.stats?.wickets : 0) || 0);
  const econ = Number(bowl.Econ || bowl.Eco || (format === 'IPL' ? player.stats?.economy : 0) || 0);
  const bowlAvg = Number(bowl.Avg || 0);
  const bowlSR = Number(bowl.SR || 0);
  const fiveW = Number(bowl['5W'] || bowl['5w'] || 0);

  let batScore = 30;
  let bowlScore = 30;

  // --- 1. FORMAT BATTING ---
  if (runs > 0) {
    if (format === 'Test') {
      const vol = clamp((runs / 8000) * 100);
      const con = clamp((avg / 50.0) * 100);
      const ton = clamp(((hundreds * 3 + doubleHundreds * 5) / Math.max(1, inn)) * 150);
      const spd = scaleRange(sr, 35, 60);
      batScore = vol * 0.35 + con * 0.40 + ton * 0.20 + spd * 0.05;
    } else if (format === 'ODI') {
      const vol = clamp((runs / 7500) * 100);
      const con = clamp((avg / 45.0) * 100);
      const spd = scaleRange(sr, 70, 95);
      const ton = clamp(((hundreds * 4 + fifties * 1.5) / Math.max(1, inn)) * 180);
      batScore = vol * 0.30 + con * 0.35 + spd * 0.25 + ton * 0.10;
    } else {
      // T20I & IPL
      const maxRuns = format === 'IPL' ? 4500 : 3000;
      const vol = clamp((runs / maxRuns) * 100);
      const con = clamp((avg / 35.0) * 100);
      const spd = scaleRange(sr, 115, 150);
      const ton = clamp(((fifties * 3 + hundreds * 6) / Math.max(1, inn)) * 150);
      batScore = spd * 0.40 + con * 0.25 + vol * 0.25 + ton * 0.10;
    }
  }

  // --- 2. FORMAT BOWLING ---
  if (wkts > 0 || econ > 0) {
    if (format === 'Test') {
      const vol = clamp((wkts / 250) * 100);
      const con = scaleRange(bowlAvg, 22.0, 38.0, true);
      const spd = scaleRange(bowlSR, 45.0, 75.0, true);
      const hauls = clamp(((fiveW * 5) / Math.max(1, inn)) * 100);
      bowlScore = vol * 0.35 + con * 0.35 + spd * 0.20 + hauls * 0.10;
    } else if (format === 'ODI') {
      const vol = clamp((wkts / 150) * 100);
      const ec = scaleRange(econ, 4.8, 6.8, true);
      const con = scaleRange(bowlAvg, 26.0, 42.0, true);
      const spd = scaleRange(bowlSR, 30.0, 48.0, true);
      bowlScore = vol * 0.35 + ec * 0.35 + con * 0.20 + spd * 0.10;
    } else {
      // T20I & IPL
      const maxWkts = format === 'IPL' ? 120 : 80;
      const vol = clamp((wkts / maxWkts) * 100);
      const ec = scaleRange(econ, 7.0, 9.8, true);
      const spd = scaleRange(bowlSR, 16.0, 26.0, true);
      bowlScore = ec * 0.45 + vol * 0.30 + spd * 0.25;
    }
  }

  // --- 3. ROLE WEIGHTING ---
  const role = (player.role || '').toLowerCase();
  const subType = (player.allrounderType || '').toLowerCase();

  let composite = 50;
  if (role.includes('batsman') || role.includes('batter') || role.includes('keeper')) {
    composite = batScore; // 100% Batting
  } else if (role.includes('bowler')) {
    composite = bowlScore; // 100% Bowling
  } else if (subType.includes('batting')) {
    composite = batScore * 0.75 + bowlScore * 0.25;
  } else if (subType.includes('bowling')) {
    composite = batScore * 0.25 + bowlScore * 0.75;
  } else {
    composite = batScore * 0.50 + bowlScore * 0.50;
  }

  // Sample size damping for players with few matches in that format
  const matches = Number(bat.M || bat.Matches || bowl.M || bowl.Matches || 0);
  const factor = matches > 0 ? matches / (matches + 5) : 0.5;
  const finalScore = Math.round(clamp(composite * factor + 45 * (1 - factor)));

  let grade: FormatRatingResult['grade'] = 'C';
  let label: FormatRatingResult['label'] = 'Average';

  if (finalScore >= 90) {
    grade = 'A+';
    label = 'Legendary';
  } else if (finalScore >= 80) {
    grade = 'A';
    label = 'World Class';
  } else if (finalScore >= 70) {
    grade = 'B+';
    label = 'Quality';
  } else if (finalScore >= 55) {
    grade = 'B';
    label = 'Average';
  } else if (finalScore >= 42) {
    grade = 'C';
    label = 'Developing';
  } else {
    grade = 'D';
    label = 'Developing';
  }

  return {
    score: finalScore,
    grade,
    label,
    batScore: Math.round(batScore),
    bowlScore: Math.round(bowlScore),
  };
}

export function getAllFormatRatings(player: any): Record<CricketFormat, FormatRatingResult> {
  return {
    Test: calculateSingleFormatRating(player, 'Test'),
    ODI: calculateSingleFormatRating(player, 'ODI'),
    T20I: calculateSingleFormatRating(player, 'T20I'),
    IPL: calculateSingleFormatRating(player, 'IPL'),
  };
}
