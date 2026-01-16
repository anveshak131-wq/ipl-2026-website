/**
 * Debug endpoint to see what scorecards are in KV
 */

export async function onRequest(context) {
  const { env } = context;
  
  try {
    const kvNamespace = env.IPL_CACHE;
    
    if (!kvNamespace) {
      return new Response(JSON.stringify({ error: 'KV namespace not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all scorecard keys
    const listResult = await kvNamespace.list({ prefix: 'scorecard_' });
    const keys = listResult.keys.map(k => k.name);

    // Fetch all scorecards
    const scorecardPromises = keys.map(key => kvNamespace.get(key, 'json'));
    const allScorecards = (await Promise.all(scorecardPromises)).filter(Boolean);
    
    const debugData = {
      totalKeys: keys.length,
      totalScorecards: allScorecards.length,
      scorecards: allScorecards.map(s => ({
        id: s.id,
        matchId: s.matchId,
        league: s.league,
        draft: s.draft,
        publishedAt: s.publishedAt,
        matchInfo: {
          team1: s.matchInfo?.team1,
          team2: s.matchInfo?.team2,
        },
        hasInnings1: !!s.innings1,
        hasInnings2: !!s.innings2,
        innings1Batting: s.innings1?.battingCard?.length || 0,
        innings1Bowling: s.innings1?.bowlingCard?.length || 0,
        innings2Batting: s.innings2?.battingCard?.length || 0,
        innings2Bowling: s.innings2?.bowlingCard?.length || 0,
      }))
    };

    return new Response(JSON.stringify(debugData, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch debug data', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
