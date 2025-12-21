/**
 * Comprehensive IPL Players Restore Endpoint
 * Restores IPL players from comprehensive dataset
 * GET /api/restore-players?restoreAll=true
 * POST /api/restore-players (with JSON body of players array)
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get existing players
    const existingPlayers = await env.IPL_CACHE.get('players', 'json') || [];
    
    // Separate WPL and IPL players
    const wplPlayers = existingPlayers.filter(p => {
      const teamId = String(p.teamId || '').trim();
      const league = p.league || 'ipl';
      return league === 'wpl' || ['11', '12', '13', '14', '15'].includes(teamId);
    });
    
    // POST: Accept custom player dataset
    if (request.method === 'POST') {
      const body = await request.json();
      const playersToRestore = Array.isArray(body.players) ? body.players : [];
      
      if (playersToRestore.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No players provided',
          hint: 'Send JSON: { "players": [...] }'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Ensure all players have league='ipl'
      const iplPlayersToAdd = playersToRestore.map(p => ({
        ...p,
        league: 'ipl'
      }));
      
      // Get existing IPL player names to avoid duplicates
      const existingIPLPlayerNames = existingPlayers
        .filter(p => {
          const teamId = String(p.teamId || '').trim();
          const league = p.league || 'ipl';
          return (league === 'ipl' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(teamId)) || 
                 (league === 'ipl' && !['11', '12', '13', '14', '15'].includes(teamId));
        })
        .map(p => p.name.toLowerCase());
      
      // Add IPL players that don't already exist
      const newIPLPlayers = iplPlayersToAdd.filter(p => 
        !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      
      // Merge WPL players with new IPL players
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      
      // Save to KV
      await env.IPL_CACHE.put('players', JSON.stringify(allPlayers));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'IPL players restored successfully',
        restored: newIPLPlayers.length,
        skipped: iplPlayersToAdd.length - newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        totalPlayers: allPlayers.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // GET: Use built-in comprehensive dataset
    if (request.method === 'GET') {
      const restoreAll = url.searchParams.get('restoreAll') === 'true';
      
      if (!restoreAll) {
        return new Response(JSON.stringify({ 
          error: 'Missing restoreAll parameter',
          hint: 'Add ?restoreAll=true to restore IPL players',
          usage: {
            get: 'GET /api/restore-players?restoreAll=true',
            post: 'POST /api/restore-players with JSON body: { "players": [...] }'
          }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Comprehensive IPL Player Dataset (Real player names from IPL 2024)
      // This is a starter set - you can POST more players via the POST endpoint
      const comprehensiveIPLPlayers = [
        // RCB (Team ID: 1)
        { id: '1', league: 'ipl', name: 'Virat Kohli', role: 'Batsman', teamId: '1', age: 35, nationality: 'India', jerseyNumber: 18, isCaptain: true, bowlingStyle: 'N/A (Batsman)', battingStyle: 'Right-handed bat', stats: { matches: 237, runs: 7263, wickets: 0, average: 37.24, strikeRate: 130.02, economy: 0, highest: 113, fours: 629, sixes: 237, fifties: 50, hundreds: 7, bestBowling: '-' } },
        { id: '2', league: 'ipl', name: 'Faf du Plessis', role: 'Batsman', teamId: '1', age: 39, nationality: 'South Africa', jerseyNumber: 12, isCaptain: false, bowlingStyle: 'N/A (Batsman)', battingStyle: 'Right-handed bat', stats: { matches: 130, runs: 4133, wickets: 0, average: 36.9, strikeRate: 134.1, economy: 0, highest: 96, fours: 324, sixes: 165, fifties: 33, hundreds: 0, bestBowling: '-' } },
        { id: '3', league: 'ipl', name: 'Glenn Maxwell', role: 'All-rounder', teamId: '1', age: 35, nationality: 'Australia', jerseyNumber: 33, isCaptain: false, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 124, runs: 2719, wickets: 19, average: 26.4, strikeRate: 157.6, economy: 8.1, highest: 95, fours: 198, sixes: 170, fifties: 15, hundreds: 0, bestBowling: '2/15' } },
        { id: '4', league: 'ipl', name: 'Mohammed Siraj', role: 'Bowler', teamId: '1', age: 30, nationality: 'India', jerseyNumber: 13, isCaptain: false, bowlingStyle: 'Right-arm fast', battingStyle: 'Right-handed bat', stats: { matches: 79, runs: 29, wickets: 78, average: 28.2, strikeRate: 20.1, economy: 8.5, highest: 10, fours: 3, sixes: 1, fifties: 0, hundreds: 0, bestBowling: '4/21' } },
        { id: '5', league: 'ipl', name: 'Dinesh Karthik', role: 'Wicket-keeper', teamId: '1', age: 38, nationality: 'India', jerseyNumber: 21, isCaptain: false, bowlingStyle: 'N/A (Wicket-keeper)', battingStyle: 'Right-handed bat', stats: { matches: 242, runs: 4516, wickets: 0, average: 26.1, strikeRate: 132.7, economy: 0, highest: 97, fours: 405, sixes: 170, fifties: 20, hundreds: 0, bestBowling: '-' } },
        { id: '6', league: 'ipl', name: 'Rajat Patidar', role: 'Batsman', teamId: '1', age: 30, nationality: 'India', jerseyNumber: 8, isCaptain: false, bowlingStyle: 'N/A (Batsman)', battingStyle: 'Right-handed bat', stats: { matches: 23, runs: 404, wickets: 0, average: 28.9, strikeRate: 144.3, economy: 0, highest: 112, fours: 32, sixes: 20, fifties: 1, hundreds: 1, bestBowling: '-' } },
        { id: '7', league: 'ipl', name: 'Anuj Rawat', role: 'Wicket-keeper', teamId: '1', age: 24, nationality: 'India', jerseyNumber: 44, isCaptain: false, bowlingStyle: 'N/A (Wicket-keeper)', battingStyle: 'Left-handed bat', stats: { matches: 25, runs: 329, wickets: 0, average: 18.3, strikeRate: 125.2, economy: 0, highest: 48, fours: 32, sixes: 12, fifties: 0, hundreds: 0, bestBowling: '-' } },
        { id: '8', league: 'ipl', name: 'Mahipal Lomror', role: 'All-rounder', teamId: '1', age: 24, nationality: 'India', jerseyNumber: 32, isCaptain: false, bowlingStyle: 'Left-arm orthodox', battingStyle: 'Left-handed bat', stats: { matches: 28, runs: 423, wickets: 2, average: 21.2, strikeRate: 135.1, economy: 8.5, highest: 54, fours: 32, sixes: 20, fifties: 2, hundreds: 0, bestBowling: '1/12' } },
        { id: '9', league: 'ipl', name: 'Karn Sharma', role: 'Bowler', teamId: '1', age: 36, nationality: 'India', jerseyNumber: 19, isCaptain: false, bowlingStyle: 'Left-arm leg-break', battingStyle: 'Right-handed bat', stats: { matches: 70, runs: 127, wickets: 61, average: 28.5, strikeRate: 18.2, economy: 8.2, highest: 20, fours: 8, sixes: 5, fifties: 0, hundreds: 0, bestBowling: '4/16' } },
        { id: '10', league: 'ipl', name: 'Akash Deep', role: 'Bowler', teamId: '1', age: 27, nationality: 'India', jerseyNumber: 30, isCaptain: false, bowlingStyle: 'Right-arm medium-fast', battingStyle: 'Right-handed bat', stats: { matches: 7, runs: 5, wickets: 7, average: 25.1, strikeRate: 20.6, economy: 7.3, highest: 3, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '3/20' } },
        { id: '11', league: 'ipl', name: 'Cameron Green', role: 'All-rounder', teamId: '1', age: 24, nationality: 'Australia', jerseyNumber: 5, isCaptain: false, bowlingStyle: 'Right-arm medium-fast', battingStyle: 'Right-handed bat', stats: { matches: 16, runs: 452, wickets: 6, average: 50.2, strikeRate: 160.3, economy: 9.1, highest: 100, fours: 35, sixes: 22, fifties: 2, hundreds: 1, bestBowling: '2/18' } },
        { id: '12', league: 'ipl', name: 'Will Jacks', role: 'All-rounder', teamId: '1', age: 25, nationality: 'England', jerseyNumber: 15, isCaptain: false, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 8, runs: 230, wickets: 0, average: 38.3, strikeRate: 175.6, economy: 0, highest: 100, fours: 18, sixes: 15, fifties: 1, hundreds: 1, bestBowling: '-' } },
        { id: '13', league: 'ipl', name: 'Reece Topley', role: 'Bowler', teamId: '1', age: 30, nationality: 'England', jerseyNumber: 27, isCaptain: false, bowlingStyle: 'Left-arm fast-medium', battingStyle: 'Right-handed bat', stats: { matches: 10, runs: 8, wickets: 12, average: 26.8, strikeRate: 20.0, economy: 8.0, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '3/27' } },
        { id: '14', league: 'ipl', name: 'Lockie Ferguson', role: 'Bowler', teamId: '1', age: 32, nationality: 'New Zealand', jerseyNumber: 4, isCaptain: false, bowlingStyle: 'Right-arm fast', battingStyle: 'Right-handed bat', stats: { matches: 38, runs: 45, wickets: 42, average: 28.6, strikeRate: 21.4, economy: 8.0, highest: 12, fours: 4, sixes: 1, fifties: 0, hundreds: 0, bestBowling: '4/28' } },
        { id: '15', league: 'ipl', name: 'Yash Dayal', role: 'Bowler', teamId: '1', age: 26, nationality: 'India', jerseyNumber: 28, isCaptain: false, bowlingStyle: 'Left-arm medium-fast', battingStyle: 'Right-handed bat', stats: { matches: 20, runs: 12, wickets: 15, average: 32.1, strikeRate: 24.0, economy: 8.0, highest: 5, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '3/20' } },
        
        // MI (Team ID: 2) - Continuing with more players...
        { id: '16', league: 'ipl', name: 'Rohit Sharma', role: 'Batsman', teamId: '2', age: 36, nationality: 'India', jerseyNumber: 45, isCaptain: true, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 243, runs: 6230, wickets: 0, average: 30.31, strikeRate: 130.39, economy: 0, highest: 109, fours: 532, sixes: 264, fifties: 42, hundreds: 2, bestBowling: '-' } },
        { id: '17', league: 'ipl', name: 'Jasprit Bumrah', role: 'Bowler', teamId: '2', age: 30, nationality: 'India', jerseyNumber: 93, isCaptain: false, bowlingStyle: 'Right-arm fast', battingStyle: 'Right-handed bat', stats: { matches: 145, runs: 56, wickets: 170, average: 23.95, strikeRate: 87.45, economy: 7.39, highest: 14, fours: 3, sixes: 1, fifties: 0, hundreds: 0, bestBowling: '5/10' } },
        { id: '18', league: 'ipl', name: 'Suryakumar Yadav', role: 'Batsman', teamId: '2', age: 33, nationality: 'India', jerseyNumber: 63, isCaptain: false, bowlingStyle: 'Right-arm leg-break', battingStyle: 'Right-handed bat', stats: { matches: 139, runs: 3241, wickets: 0, average: 32.4, strikeRate: 143.3, economy: 0, highest: 103, fours: 253, sixes: 178, fifties: 21, hundreds: 1, bestBowling: '-' } },
        { id: '19', league: 'ipl', name: 'Hardik Pandya', role: 'All-rounder', teamId: '2', age: 30, nationality: 'India', jerseyNumber: 33, isCaptain: false, bowlingStyle: 'Right-arm medium-fast', battingStyle: 'Right-handed bat', stats: { matches: 123, runs: 2309, wickets: 53, average: 30.1, strikeRate: 145.9, economy: 8.8, highest: 91, fours: 175, sixes: 143, fifties: 10, hundreds: 0, bestBowling: '3/20' } },
        { id: '20', league: 'ipl', name: 'Ishan Kishan', role: 'Wicket-keeper', teamId: '2', age: 25, nationality: 'India', jerseyNumber: 32, isCaptain: false, bowlingStyle: 'N/A (Wicket-keeper)', battingStyle: 'Left-handed bat', stats: { matches: 101, runs: 2205, wickets: 0, average: 27.6, strikeRate: 133.2, economy: 0, highest: 99, fours: 201, sixes: 98, fifties: 14, hundreds: 0, bestBowling: '-' } },
        { id: '21', league: 'ipl', name: 'Tilak Varma', role: 'Batsman', teamId: '2', age: 21, nationality: 'India', jerseyNumber: 23, isCaptain: false, bowlingStyle: 'Right-arm off-break', battingStyle: 'Left-handed bat', stats: { matches: 25, runs: 740, wickets: 0, average: 38.9, strikeRate: 142.3, economy: 0, highest: 84, fours: 58, sixes: 35, fifties: 5, hundreds: 0, bestBowling: '-' } },
        { id: '22', league: 'ipl', name: 'Tim David', role: 'All-rounder', teamId: '2', age: 28, nationality: 'Australia', jerseyNumber: 55, isCaptain: false, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 25, runs: 425, wickets: 0, average: 23.6, strikeRate: 163.5, economy: 0, highest: 46, fours: 25, sixes: 28, fifties: 0, hundreds: 0, bestBowling: '-' } },
        { id: '23', league: 'ipl', name: 'Piyush Chawla', role: 'Bowler', teamId: '2', age: 35, nationality: 'India', jerseyNumber: 11, isCaptain: false, bowlingStyle: 'Right-arm leg-break', battingStyle: 'Right-handed bat', stats: { matches: 181, runs: 584, wickets: 179, average: 27.3, strikeRate: 20.4, economy: 7.9, highest: 24, fours: 48, sixes: 25, fifties: 0, hundreds: 0, bestBowling: '4/17' } },
        { id: '24', league: 'ipl', name: 'Jason Behrendorff', role: 'Bowler', teamId: '2', age: 34, nationality: 'Australia', jerseyNumber: 28, isCaptain: false, bowlingStyle: 'Left-arm fast-medium', battingStyle: 'Right-handed bat', stats: { matches: 27, runs: 12, wickets: 28, average: 28.5, strikeRate: 22.9, economy: 7.5, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '3/23' } },
        { id: '25', league: 'ipl', name: 'Kumar Kartikeya', role: 'Bowler', teamId: '2', age: 26, nationality: 'India', jerseyNumber: 18, isCaptain: false, bowlingStyle: 'Left-arm orthodox', battingStyle: 'Right-handed bat', stats: { matches: 12, runs: 8, wickets: 11, average: 28.2, strikeRate: 24.5, economy: 6.9, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '2/19' } },
        { id: '26', league: 'ipl', name: 'Akash Madhwal', role: 'Bowler', teamId: '2', age: 30, nationality: 'India', jerseyNumber: 22, isCaptain: false, bowlingStyle: 'Right-arm medium-fast', battingStyle: 'Right-handed bat', stats: { matches: 10, runs: 5, wickets: 13, average: 22.8, strikeRate: 17.5, economy: 7.8, highest: 3, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '5/5' } },
        { id: '27', league: 'ipl', name: 'Nehal Wadhera', role: 'Batsman', teamId: '2', age: 23, nationality: 'India', jerseyNumber: 25, isCaptain: false, bowlingStyle: 'Right-arm off-break', battingStyle: 'Left-handed bat', stats: { matches: 14, runs: 241, wickets: 0, average: 20.1, strikeRate: 145.8, economy: 0, highest: 64, fours: 18, sixes: 14, fifties: 1, hundreds: 0, bestBowling: '-' } },
        { id: '28', league: 'ipl', name: 'Vishnu Vinod', role: 'Wicket-keeper', teamId: '2', age: 30, nationality: 'India', jerseyNumber: 29, isCaptain: false, bowlingStyle: 'N/A (Wicket-keeper)', battingStyle: 'Right-handed bat', stats: { matches: 5, runs: 45, wickets: 0, average: 15.0, strikeRate: 128.6, economy: 0, highest: 30, fours: 4, sixes: 2, fifties: 0, hundreds: 0, bestBowling: '-' } },
        { id: '29', league: 'ipl', name: 'Shams Mulani', role: 'Bowler', teamId: '2', age: 26, nationality: 'India', jerseyNumber: 31, isCaptain: false, bowlingStyle: 'Left-arm orthodox', battingStyle: 'Left-handed bat', stats: { matches: 3, runs: 2, wickets: 1, average: 45.0, strikeRate: 36.0, economy: 7.5, highest: 2, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '1/18' } },
        { id: '30', league: 'ipl', name: 'Raghav Goyal', role: 'Bowler', teamId: '2', age: 22, nationality: 'India', jerseyNumber: 35, isCaptain: false, bowlingStyle: 'Left-arm orthodox', battingStyle: 'Right-handed bat', stats: { matches: 2, runs: 0, wickets: 1, average: 32.0, strikeRate: 24.0, economy: 8.0, highest: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: '1/19' } },
        
        // Note: This is a starter set. For 200+ players, use POST endpoint with your player dataset
        // POST /api/restore-players with body: { "players": [array of 200+ player objects] }
      ];
      
      // Get existing IPL player names to avoid duplicates
      const existingIPLPlayerNames = existingPlayers
        .filter(p => {
          const teamId = String(p.teamId || '').trim();
          const league = p.league || 'ipl';
          return (league === 'ipl' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(teamId)) || 
                 (league === 'ipl' && !['11', '12', '13', '14', '15'].includes(teamId));
        })
        .map(p => p.name.toLowerCase());
      
      // Add IPL players that don't already exist
      const newIPLPlayers = comprehensiveIPLPlayers.filter(p => 
        !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      
      // Merge WPL players with new IPL players
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      
      // Save to KV
      await env.IPL_CACHE.put('players', JSON.stringify(allPlayers));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'IPL players restored successfully',
        restored: newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        existingIPL: existingPlayers.length - wplPlayers.length,
        totalPlayers: allPlayers.length,
        note: 'This restored a starter set. To restore 200+ players, use POST endpoint with your player dataset.',
        nextStep: 'POST /api/restore-players with body: { "players": [your player array] }'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to restore players',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
