import { describe, it, expect } from 'vitest';
import { Match, Team } from '@/types';
import { getMatchResult } from '@/lib/matchUtils';

const makeTeam = (id: string, name: string, shortName: string): Team => ({
  id,
  league: 'wpl',
  name,
  shortName,
  logo: '',
  description: '',
  colors: { primary: '#000', secondary: '#111' },
  players: [],
});

describe('getMatchResult', () => {
  it('detects RCB-W wins from varied result strings', () => {
    const rcb = makeTeam('rcb-w', 'Royal Challengers Bengaluru Women', 'RCB-W');
    const mi = makeTeam('mi-w', 'Mumbai Indians Women', 'MI-W');

    const cases: string[] = [
      'Royal Challengers Bengaluru Women won by 3 wkts',
      'Royal Challengers Bengaluru Women won by 9 wkts\n',
      'Royal Challengers Bengaluru Women won by 32 runs\n',
    ];

    for (const res of cases) {
      const match: Match = {
        id: 't1',
        league: 'wpl',
        date: new Date().toISOString(),
        time: '19:30',
        venue: 'Test Stadium',
        team1: rcb,
        team2: mi,
        status: 'completed',
        result: res,
      } as Match;

      expect(getMatchResult(match, 'rcb-w')).toBe('win');
      expect(getMatchResult(match, 'mi-w')).toBe('loss');
    }
  });
});
