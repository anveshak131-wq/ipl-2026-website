// Migration script to update matches with scores from existing scorecards
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';
const API_BASE = 'https://ipl-2026-website.pages.dev';

async function migrateScores() {
  try {
    console.log('Fetching WPL scorecards...');
    const scorecardsRes = await fetch(`${API_BASE}/api/scorecards?league=WPL`);
    const scorecards = await scorecardsRes.json();
    console.log(`Found ${scorecards.length} scorecards`);

    for (const scorecard of scorecards) {
      if (!scorecard.matchId) {
        console.log(`Skipping scorecard ${scorecard.id} - no matchId`);
        continue;
      }

      console.log(`\nProcessing match ${scorecard.matchId}...`);

      // Fetch the match
      const matchRes = await fetch(`${API_BASE}/api/matches?id=${scorecard.matchId}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (!matchRes.ok) {
        console.log(`Failed to fetch match ${scorecard.matchId}`);
        continue;
      }

      const match = await matchRes.json();

      // Calculate scores from innings
      const team1Score = scorecard.innings.find(inn => inn.battingTeamId.toString() === scorecard.matchInfo.team1.id.toString());
      const team2Score = scorecard.innings.find(inn => inn.battingTeamId.toString() === scorecard.matchInfo.team2.id.toString());

      const team1ScoreStr = team1Score 
        ? `${team1Score.totalRuns || 0}/${team1Score.totalWickets || 0} (${team1Score.totalOvers || 0} overs)`
        : undefined;
      const team2ScoreStr = team2Score 
        ? `${team2Score.totalRuns || 0}/${team2Score.totalWickets || 0} (${team2Score.totalOvers || 0} overs)`
        : undefined;

      const tossWinner = scorecard.matchInfo.toss?.winner === scorecard.matchInfo.team1.name ? 'team1' : 'team2';

      console.log(`  Team 1 Score: ${team1ScoreStr || 'N/A'}`);
      console.log(`  Team 2 Score: ${team2ScoreStr || 'N/A'}`);
      console.log(`  Result: ${scorecard.result?.winner ? `${scorecard.result.winner} won by ${scorecard.result.margin}` : 'N/A'}`);

      // Update the match
      const updateRes = await fetch(`${API_BASE}/api/matches`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          ...match,
          id: scorecard.matchId, // Ensure ID is in the body
          team1Score: team1ScoreStr,
          team2Score: team2ScoreStr,
          result: scorecard.result?.winner ? `${scorecard.result.winner} won by ${scorecard.result.margin}` : match.result,
          status: scorecard.result?.winner ? 'completed' : match.status,
          matchState: {
            ...match.matchState,
            toss: scorecard.matchInfo.toss?.winner ? {
              winner: tossWinner,
              decision: scorecard.matchInfo.toss.decision,
              timestamp: Date.now(),
            } : match.matchState?.toss,
          },
        }),
      });

      if (updateRes.ok) {
        console.log(`  ✓ Successfully updated match ${scorecard.matchId}`);
      } else {
        const error = await updateRes.text();
        console.log(`  ✗ Failed to update match ${scorecard.matchId}: ${error}`);
      }
    }

    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateScores();
