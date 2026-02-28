(async () => {
  try {
    const payload = {
      matchId: 'testmatch1',
      league: 'ipl',
      matchInfo: {
        team1: { id: 1, name: 'Team A' },
        team2: { id: 2, name: 'Team B' },
        venue: 'Stadium',
        date: '2026-02-28',
        time: '10:00',
        toss: { winner: '', decision: '' },
      },
      innings: [
        { inningsNumber: 1, battingTeamId: 1, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
        { inningsNumber: 2, battingTeamId: 2, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
      ],
    };

    console.log('Posting scorecard to http://localhost:8788/api/scorecards');
    let res = await fetch('http://localhost:8788/api/scorecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
      body: JSON.stringify(payload),
    });
    console.log('POST status', res.status);
    const postBody = await res.text();
    console.log('POST body', postBody);
    const data = JSON.parse(postBody);
    if (!data.id) {
      console.error('No id returned from POST');
      process.exit(1);
    }
    const id = data.id;
    console.log('Created id', id);

    console.log('Calling publish endpoint');
    res = await fetch(`http://localhost:8788/api/scorecards/${id}/publish`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer test-token' },
    });
    console.log('Publish status', res.status);
    const pubBody = await res.text();
    console.log('Publish body', pubBody);
  } catch (e) {
    console.error('Test script error', e);
    process.exit(1);
  }
})();
