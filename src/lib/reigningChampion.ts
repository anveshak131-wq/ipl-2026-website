import type { Team } from '@/types';

export const IPL_REIGNING_CHAMPION = {
  league: 'ipl' as const,
  season: 2026,
  activeThroughSeason: 2027,
  teamId: '1',
  teamShortName: 'RCB',
  teamName: 'Royal Challengers Bengaluru',
  teamRoute: '/teams/rcb',
  pointsTableRoute: '/ipl/points-table',
  finalDateLabel: 'May 31, 2026',
  finalSummary: 'Beat Gujarat Titans by 5 wickets in the final',
  reignSummary: 'Reigning champions through the 2027 season',
};

export function isIplReigningChampionTeam(
  team: Pick<Team, 'id' | 'shortName'> | null | undefined
): boolean {
  if (!team) return false;

  return (
    String(team.id) === IPL_REIGNING_CHAMPION.teamId ||
    String(team.shortName || '').toUpperCase() === IPL_REIGNING_CHAMPION.teamShortName
  );
}

export function isIplChampionHighlightActive(referenceSeason = new Date().getFullYear()): boolean {
  return referenceSeason <= IPL_REIGNING_CHAMPION.activeThroughSeason;
}
