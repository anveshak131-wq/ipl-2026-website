import { WplMatch, TeamRef, VenueRef } from '@/types/match';

export function generateWpl2027SeasonDraft(
  teams: TeamRef[],
  venues: VenueRef[],
  seasonStartDate: string = '2027-02-12'
): WplMatch[] {
  if (teams.length !== 5) {
    throw new Error('WPL requires exactly 5 franchise teams.');
  }

  const generatedMatches: WplMatch[] = [];
  const teamIds = teams.map((t) => t.id);
  const pairings: [string, string][] = [];

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = 0; j < teamIds.length; j++) {
      if (i !== j) {
        pairings.push([teamIds[i], teamIds[j]]);
      }
    }
  }

  const scheduledPairings = [...pairings].sort(() => Math.sin(pairings.length) - 0.5);

  let currentDate = new Date(`${seasonStartDate}T19:30:00+05:30`);
  let matchCounter = 1;

  const venue1 = venues[0]?.id || 'v-venue-1';
  const venue2 = venues[1]?.id || venues[0]?.id || 'v-venue-2';

  for (const [teamA, teamB] of scheduledPairings) {
    generatedMatches.push({
      id: `wpl-2027-m${String(matchCounter).padStart(2, '0')}`,
      matchNumber: matchCounter,
      stage: 'LEAGUE',
      teamAId: teamA,
      teamBId: teamB,
      venueId: matchCounter <= 11 ? venue1 : venue2,
      scheduledStartTime: currentDate.toISOString(),
      status: matchCounter === 1 ? 'READY_FOR_TOSS' : 'SCHEDULED',
      isResolved: true,
      lineupStatus: 'PENDING',
    });

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    matchCounter++;
  }

  currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

  generatedMatches.push({
    id: 'wpl-2027-m21',
    matchNumber: 21,
    stage: 'ELIMINATOR',
    teamAId: null,
    teamBId: null,
    placeholderA: {
      label: 'Rank 2 (Points Table)',
      sourceType: 'POINTS_TABLE_RANK',
      sourceRank: 2,
    },
    placeholderB: {
      label: 'Rank 3 (Points Table)',
      sourceType: 'POINTS_TABLE_RANK',
      sourceRank: 3,
    },
    venueId: venue2,
    scheduledStartTime: currentDate.toISOString(),
    status: 'SCHEDULED',
    isResolved: false,
    lineupStatus: 'PENDING',
  });

  currentDate = new Date(currentDate.getTime() + 48 * 60 * 60 * 1000);

  generatedMatches.push({
    id: 'wpl-2027-m22',
    matchNumber: 22,
    stage: 'FINAL',
    teamAId: null,
    teamBId: null,
    placeholderA: {
      label: 'Rank 1 (Points Table)',
      sourceType: 'POINTS_TABLE_RANK',
      sourceRank: 1,
    },
    placeholderB: {
      label: 'Winner of Eliminator (M21)',
      sourceType: 'MATCH_WINNER',
      sourceMatchNumber: 21,
    },
    venueId: venue2,
    scheduledStartTime: currentDate.toISOString(),
    status: 'SCHEDULED',
    isResolved: false,
    lineupStatus: 'PENDING',
  });

  return generatedMatches;
}
