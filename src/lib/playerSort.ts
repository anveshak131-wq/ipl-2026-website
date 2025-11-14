import { Player } from '@/types';

const ROLE_PRIORITY = ['Batsman', 'Wicket-keeper', 'All-rounder', 'Bowler'];

export function sortPlayersByRoleAndAge(players: Player[] = []): Player[] {
  return [...players].sort((a, b) => {
    const pa = ROLE_PRIORITY.indexOf(a.role as string);
    const pb = ROLE_PRIORITY.indexOf(b.role as string);
    const prioA = pa === -1 ? ROLE_PRIORITY.length : pa;
    const prioB = pb === -1 ? ROLE_PRIORITY.length : pb;

    if (prioA !== prioB) return prioA - prioB;

    const ageA = Number(a.age) || 0;
    const ageB = Number(b.age) || 0;

    // Older players first
    return ageB - ageA;
  });
}

export default sortPlayersByRoleAndAge;
