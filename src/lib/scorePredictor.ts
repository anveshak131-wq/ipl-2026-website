export interface PastMatch {
  battingTeam: string;
  bowlingTeam: string;
  venue: string;
  runsScored: number;
}

export interface PredictionResult {
  predictedScore: number;
  range: string;
  factors: {
    teamBattingAverage: number;
    opponentConcededAverage: number;
    venueAverage: number;
    dataPointsUsed: number;
  };
  note?: string;
}

export function predictTeamScore(
  targetTeam: string,
  opponent: string,
  venue: string,
  pastMatches: PastMatch[]
): PredictionResult {
  if (!pastMatches || pastMatches.length === 0) {
    return {
      predictedScore: 160,
      range: "140 - 180",
      factors: {
        teamBattingAverage: 160,
        opponentConcededAverage: 160,
        venueAverage: 160,
        dataPointsUsed: 0
      },
      note: "No data available. Using default T20 baseline."
    };
  }

  const allScores = pastMatches.map(m => m.runsScored);
  const tournamentAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  const teamMatches = pastMatches.filter(m => m.battingTeam === targetTeam);
  const teamAvg = teamMatches.length > 0 
    ? teamMatches.reduce((a, m) => a + m.runsScored, 0) / teamMatches.length 
    : tournamentAvg;

  const opponentMatches = pastMatches.filter(m => m.bowlingTeam === opponent);
  const opponentConcededAvg = opponentMatches.length > 0
    ? opponentMatches.reduce((a, m) => a + m.runsScored, 0) / opponentMatches.length
    : tournamentAvg;

  const venueMatches = pastMatches.filter(m => m.venue === venue);
  const venueAvg = venueMatches.length > 0
    ? venueMatches.reduce((a, m) => a + m.runsScored, 0) / venueMatches.length
    : tournamentAvg;

  let predictedScore = Math.round((teamAvg * 0.40) + (opponentConcededAvg * 0.40) + (venueAvg * 0.20));
  const lowerBound = predictedScore - 12;
  const upperBound = predictedScore + 12;

  return {
    predictedScore,
    range: `${lowerBound} - ${upperBound}`,
    factors: {
      teamBattingAverage: Math.round(teamAvg),
      opponentConcededAverage: Math.round(opponentConcededAvg),
      venueAverage: Math.round(venueAvg),
      dataPointsUsed: pastMatches.length
    }
  };
}