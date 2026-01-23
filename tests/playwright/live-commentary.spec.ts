import { test, expect } from '@playwright/test';

const BASE = 'https://ipl-2026-website.pages.dev';

test('live-commentary resolves batter and bowler ids to names', async ({ request }) => {
  // Fetch players to map ids to names
  const playersRes = await request.get(`${BASE}/api/players`);
  expect(playersRes.ok()).toBeTruthy();
  const players = await playersRes.json();
  expect(Array.isArray(players)).toBeTruthy();
  expect(players.length).toBeGreaterThan(0);

  // Prefer ids 18 and 4 if present, else pick safe defaults
  const byId = (id) => players.find(p => String(p.id) === String(id));
  const batter = byId('18') || players[17] || players[0];
  const bowler = byId('4') || players[3] || players[1];

  const payload = {
    matchId: 'test-match',
    event: {
      inning: '1',
      over: '0',
      ball: '1',
      type: '0',
      runs: 0,
      batterId: String(batter.id),
      bowlerId: String(bowler.id),
      tone: 'analytical'
    },
    battingTeamName: 'MI-W'
  };

  const res = await request.post(`${BASE}/api/live-commentary`, { data: payload });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.suggestion).toBeTruthy();

  // Ensure the returned suggestion contains the actual names
  expect(data.suggestion).toContain(batter.name);
  expect(data.suggestion).toContain(bowler.name);
});
