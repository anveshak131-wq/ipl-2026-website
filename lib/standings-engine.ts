import { TeamRef } from '@/types/match';

export interface MatchResultPayload {
  matchId: string;
  isCompleted: boolean;
  isAbandoned?: boolean;
  winnerTeamId?: string | null;
  innings1: {
    teamId: string;
    runs: number;
    wickets: number;
    oversBowled: number;
  };
  innings2: {
    teamId: string;
    runs: number;
    wickets: number;
    oversBowled: number;
  };
}

export interface TeamStandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  shortName: string;
  played: number;
  won: number;
  lost: number;
  tiedOrNoResult: number;
  points: number;
  nrr: number;
  runsFor: number;
  oversForDecimal: number;
  runsAgainst: number;
  oversAgainstDecimal: number;
  form: ('W' | 'L' | 'NR')[];
}

export function cricketOversToDecimal(overs: number, allOut: boolean): number {
  if (allOut) return 20.0;
  const completedOvers = Math.floor(overs);
  const balls = Math.round((overs - completedOvers) * 10);
  return completedOvers + balls / 6.0;
}

export function calculateWplStandings(
  teams: TeamRef[],
  completedMatches: MatchResultPayload[]
): TeamStandingRow[] {
  const standingsMap = new Map<string, Omit<TeamStandingRow, 'rank' | 'nrr'>>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      shortName: team.short,
      played: 0,
      won: 0,
      lost: 0,
      tiedOrNoResult: 0,
      points: 0,
      runsFor: 0,
      oversForDecimal: 0,
      runsAgainst: 0,
      oversAgainstDecimal: 0,
      form: [],
    });
  }

  for (const match of completedMatches) {
    if (!match.isCompleted) continue;

    const t1 = standingsMap.get(match.innings1.teamId);
    const t2 = standingsMap.get(match.innings2.teamId);
    if (!t1 || !t2) continue;

    t1.played += 1;
    t2.played += 1;

    if (match.isAbandoned) {
      t1.tiedOrNoResult += 1;
      t2.tiedOrNoResult += 1;
      t1.points += 1;
      t2.points += 1;
      t1.form.push('NR');
      t2.form.push('NR');
      continue;
    }

    const t1AllOut = match.innings1.wickets >= 10;
    const t2AllOut = match.innings2.wickets >= 10;

    const t1OversFaced = cricketOversToDecimal(match.innings1.oversBowled, t1AllOut);
    const t2OversFaced = cricketOversToDecimal(match.innings2.oversBowled, t2AllOut);

    t1.runsFor += match.innings1.runs;
    t1.oversForDecimal += t1OversFaced;
    t2.runsAgainst += match.innings1.runs;
    t2.oversAgainstDecimal += t1OversFaced;

    t2.runsFor += match.innings2.runs;
    t2.oversForDecimal += t2OversFaced;
    t1.runsAgainst += match.innings2.runs;
    t1.oversAgainstDecimal += t2OversFaced;

    if (match.winnerTeamId === t1.teamId) {
      t1.won += 1;
      t1.points += 2;
      t1.form.push('W');
      t2.lost += 1;
      t2.form.push('L');
    } else if (match.winnerTeamId === t2.teamId) {
      t2.won += 1;
      t2.points += 2;
      t2.form.push('W');
      t1.lost += 1;
      t1.form.push('L');
    } else {
      t1.tiedOrNoResult += 1;
      t2.tiedOrNoResult += 1;
      t1.points += 1;
      t2.points += 1;
      t1.form.push('NR');
      t2.form.push('NR');
    }
  }

  const rows: TeamStandingRow[] = Array.from(standingsMap.values()).map((row) => {
    const runRateFor = row.oversForDecimal > 0 ? row.runsFor / row.oversForDecimal : 0;
    const runRateAgainst = row.oversAgainstDecimal > 0 ? row.runsAgainst / row.oversAgainstDecimal : 0;
    const nrr = Number((runRateFor - runRateAgainst).toFixed(3));

    return {
      ...row,
      rank: 1,
      nrr,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return b.nrr - a.nrr;
  });

  return rows.map((row, idx) => ({ ...row, rank: idx + 1 }));
}
