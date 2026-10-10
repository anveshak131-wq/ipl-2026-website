import { PlayerSummary, SelectedPlayer } from '@/types/match';

export interface TeamLineupValidation {
  isValid: boolean;
  errors: string[];
  xiCount: number;
  subsCount: number;
  overseasCount: number;
  associateCount: number;
  hasCaptain: boolean;
  hasKeeper: boolean;
}

export function validateWplTeamLineup(
  playingXI: SelectedPlayer[],
  substitutes: string[],
  squadMap: Map<string, PlayerSummary>
): TeamLineupValidation {
  const errors: string[] = [];

  const xiCount = playingXI.length;
  const subsCount = substitutes.length;

  if (xiCount !== 11) {
    errors.push(`Playing XI must have exactly 11 players (selected: ${xiCount})`);
  }

  if (subsCount > 5) {
    errors.push(`Maximum 5 substitutes allowed (selected: ${subsCount})`);
  }

  const captains = playingXI.filter((p) => p.isCaptain);
  if (captains.length !== 1) {
    errors.push('Exactly 1 Captain must be designated');
  }

  const keepers = playingXI.filter((p) => p.isWicketKeeper);
  if (keepers.length < 1) {
    errors.push('At least 1 Wicketkeeper must be designated');
  }

  let overseasCount = 0;
  let associateCount = 0;

  for (const p of playingXI) {
    const playerMeta = squadMap.get(p.playerId);
    if (playerMeta?.isOverseas) {
      overseasCount++;
      if (playerMeta.isAssociateNation) {
        associateCount++;
      }
    }
  }

  if (overseasCount > 5) {
    errors.push(`Cannot exceed 5 overseas players (currently ${overseasCount})`);
  } else if (overseasCount === 5 && associateCount === 0) {
    errors.push('5 overseas players allowed only if at least 1 is from an Associate Nation');
  }

  return {
    isValid: errors.length === 0,
    errors,
    xiCount,
    subsCount,
    overseasCount,
    associateCount,
    hasCaptain: captains.length === 1,
    hasKeeper: keepers.length >= 1,
  };
}
