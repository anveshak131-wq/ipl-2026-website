export interface BattingStats {
  matches: number;
  innings: number;
  runs: number;
  ballsFaced: number;
  highestScore: string;
  battingAverage: number;
  strikeRate: number;
  centuries: number;
  halfCenturies: number;
  fours: number;
  sixes: number;
}

export interface BowlingStats {
  matches: number;
  innings: number;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  bestBowling: string;
  bowlingAverage: number;
  economy: number;
  bowlingStrikeRate: number;
  fourWickets: number;
  fiveWickets: number;
}

export interface PlayerStats {
  battingStats?: Partial<BattingStats>;
  bowlingStats?: Partial<BowlingStats>;
}
