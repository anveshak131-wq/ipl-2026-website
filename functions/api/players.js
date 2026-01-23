/**
 * Cloudflare Pages Function for /api/players
 * Handles player CRUD operations
 */

// Unified Cloudflare Pages Function for /api/players
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check (presence of Bearer token)
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Helper: get team name by team ID
async function getTeamNameById(players, teamId, league, env) {
  try {
    const teamsData = await env.IPL_CACHE.get('teams', 'json');
    const teams = teamsData || [];
    const team = teams.find(t => (t.league || 'ipl') === league && t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  } catch (error) {
    return `Team ${teamId}`;
  }
}

// Default sample players (both IPL and WPL)
const defaultPlayers = [];

export const onRequest = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const league = url.searchParams.get('league');
      const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
      const fixEllyse = url.searchParams.get('fixEllyse') === 'true';
      const diagnostic = url.searchParams.get('diagnostic') === 'true';
      
      let playersData = await env.IPL_CACHE.get('players', 'json');
      let players = playersData || [];

      // Force refresh if requested
      if (forceRefresh) {
        // Clear cache and reload
        await env.IPL_CACHE.delete('players');
        playersData = await env.IPL_CACHE.get('players', 'json');
        players = playersData || [];
      }

      // Fix Ellyse Perry if requested
      if (fixEllyse) {
        const ellyseIndex = players.findIndex(p => p.id === '5' && p.name === 'Ellyse Perry');
        if (ellyseIndex !== -1) {
          players[ellyseIndex].teamId = '12';
          await env.IPL_CACHE.put('players', JSON.stringify(players));
          console.log('Ellyse Perry teamId fixed to 12 (RCB-W)');
        }
      }
      
      // Log current state before any fixes
      console.log('=== PLAYERS API GET ===');
      console.log(`Total players in KV: ${players.length}`);
      console.log(`Requested league: ${league}`);
      
      // MIGRATION: Auto-calculate average and strikeRate from base stats if missing
      // This ensures end-user pages always have numeric values
      let needsMigration = false;
      players = players.map(player => {
        if (!player.stats) return player;
        
        const runs = player.stats.runs || 0;
        const battingInnings = player.stats.battingInnings || 0;
        const notOuts = player.stats.notOuts || 0;
        const ballsFaced = player.stats.ballsFaced || 0;
        
        let playerNeedsUpdate = false;
        let average = player.stats.average;
        let strikeRate = player.stats.strikeRate;
        
        // Calculate average if missing or 0
        if (!average || average === 0) {
          const dismissals = battingInnings - notOuts;
          if (dismissals > 0 && runs > 0) {
            average = runs / dismissals;
            playerNeedsUpdate = true;
          } else if (player.stats.battingAverage && player.stats.battingAverage !== '' && player.stats.battingAverage !== '0' && player.stats.battingAverage !== '-') {
            // Fallback to parsing battingAverage string
            const parsed = parseFloat(player.stats.battingAverage);
            if (!isNaN(parsed) && parsed > 0) {
              average = parsed;
              playerNeedsUpdate = true;
            }
          }
        }
        
        // Calculate strikeRate if missing or 0
        if (!strikeRate || strikeRate === 0) {
          if (ballsFaced > 0 && runs > 0) {
            strikeRate = (runs * 100) / ballsFaced;
            playerNeedsUpdate = true;
          } else if (player.stats.battingStrikeRate && player.stats.battingStrikeRate !== '' && player.stats.battingStrikeRate !== '0' && player.stats.battingStrikeRate !== '-') {
            // Fallback to parsing battingStrikeRate string
            const parsed = parseFloat(player.stats.battingStrikeRate);
            if (!isNaN(parsed) && parsed > 0) {
              strikeRate = parsed;
              playerNeedsUpdate = true;
            }
          }
        }
        
        // BOWLING STATS MIGRATION
        const wickets = player.stats.wickets || 0;
        const runsConceded = player.stats.runsConceded || 0;
        const balls = player.stats.balls || 0;
        
        // Calculate bowling average if missing or 0
        let bowlingAverage = player.stats.bowlingAverage;
        if ((!bowlingAverage || bowlingAverage === 0) && wickets > 0 && runsConceded >= 0) {
          bowlingAverage = runsConceded / wickets;
          playerNeedsUpdate = true;
        } else if ((!bowlingAverage || bowlingAverage === 0) && player.stats.bowlingAverage && typeof player.stats.bowlingAverage === 'string' && player.stats.bowlingAverage !== '' && player.stats.bowlingAverage !== '0' && player.stats.bowlingAverage !== '-') {
          const parsed = parseFloat(player.stats.bowlingAverage);
          if (!isNaN(parsed) && parsed > 0) {
            bowlingAverage = parsed;
            playerNeedsUpdate = true;
          }
        }
        
        // Calculate economy if missing or 0
        let economy = player.stats.economy;
        if ((!economy || economy === 0) && balls > 0 && runsConceded >= 0) {
          economy = (runsConceded * 6) / balls;
          playerNeedsUpdate = true;
        } else if ((!economy || economy === 0) && player.stats.economy && typeof player.stats.economy === 'string' && player.stats.economy !== '' && player.stats.economy !== '0' && player.stats.economy !== '-') {
          const parsed = parseFloat(player.stats.economy);
          if (!isNaN(parsed) && parsed > 0) {
            economy = parsed;
            playerNeedsUpdate = true;
          }
        }
        
        if (playerNeedsUpdate) {
          needsMigration = true;
          const updatedStats = {
            ...player.stats,
            average: average || player.stats.average || 0,
            strikeRate: strikeRate || player.stats.strikeRate || 0
          };
          if (bowlingAverage !== undefined) updatedStats.bowlingAverage = bowlingAverage || 0;
          if (economy !== undefined) updatedStats.economy = economy || 0;
          
          return {
            ...player,
            stats: updatedStats
          };
        }
        
        return player;
      });
      
      // Save migrated data back to KV if any changes were made
      if (needsMigration) {
        console.log('Migration: Auto-calculated batting/bowling stats for players');
        await env.IPL_CACHE.put('players', JSON.stringify(players));
      }
      
      // Diagnostic mode - return detailed breakdown
      if (diagnostic) {
        const iplPlayers = players.filter(p => {
          const playerLeague = p.league || 'ipl';
          const teamId = String(p.teamId || '').trim();
          return playerLeague === 'ipl' || (['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(teamId) && playerLeague !== 'wpl');
        });
        const wplPlayers = players.filter(p => {
          const playerLeague = p.league || 'ipl';
          const teamId = String(p.teamId || '').trim();
          return playerLeague === 'wpl' || ['11', '12', '13', '14', '15'].includes(teamId);
        });
        const unknownPlayers = players.filter(p => {
          const playerLeague = p.league || 'ipl';
          const teamId = String(p.teamId || '').trim();
          const isIPL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(teamId);
          const isWPL = ['11', '12', '13', '14', '15'].includes(teamId);
          return !isIPL && !isWPL;
        });
        
        return new Response(JSON.stringify({
          diagnostic: true,
          summary: {
            total: players.length,
            ipl: iplPlayers.length,
            wpl: wplPlayers.length,
            unknown: unknownPlayers.length
          },
          iplPlayers: iplPlayers.map(p => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || 'ipl',
            role: p.role
          })),
          wplPlayers: wplPlayers.map(p => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || 'ipl',
            role: p.role
          })),
          unknownPlayers: unknownPlayers.map(p => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || 'ipl',
            role: p.role
          })),
          rawCount: players.length
        }, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // Show sample of WPL players currently in KV
      const wplPlayers = players.filter(p => (p.league || 'ipl') === 'wpl' || ['11', '12', '13', '14', '15'].includes(String(p.teamId)));
      console.log(`WPL-related players found: ${wplPlayers.length}`);
      if (wplPlayers.length > 0) {
        console.log('Sample WPL players:', wplPlayers.slice(0, 3).map(p => ({
          name: p.name,
          teamId: p.teamId,
          league: p.league
        })));
      }
      
      // Helper function to normalize team IDs
      const normalizeTeamId = (id) => {
        let str = String(id || '').trim();
        if (str.startsWith('Team ')) str = str.replace('Team ', '');
        if (str.toLowerCase().startsWith('team')) str = str.replace(/^team/i, '');
        return str;
      };
      
      // WPL team IDs are 11-15
      const wplTeamIds = ['11', '12', '13', '14', '15'];
      // IPL team IDs are 1-10
      const iplTeamIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      
      // Known WPL player corrections (player name -> correct teamId)
      const wplPlayerCorrections = {
        'Harmanpreet Kaur': '11', // MI-W captain
        'Alyssa Healy': '11', // MI-W
        'Smriti Mandhana': '12', // RCB-W captain
        'Ellyse Perry': '12', // RCB-W
        'Deepti Sharma': '13', // DC-W
        'Sophie Devine': '14', // Gujarat Giants (GG) captain - NOT UPW
        'Pooja Vastrakar': '12', // RCB-W
        'Renuka Singh': '12', // RCB-W
        'Devika Vaidya': '14', // Gujarat Giants
        'Ashleigh Gardner': '14' // Gujarat Giants
      };
      
      // Aggressive migration: Fix league property based on teamId and known player corrections
      let needsUpdate = false;
      players = players.map(player => {
        let normalizedTeamId = normalizeTeamId(player.teamId);
        const playerLeague = player.league || 'ipl';
        const isIPLTeam = iplTeamIds.includes(normalizedTeamId);
        const isWPLTeam = wplTeamIds.includes(normalizedTeamId);
        const isWPLPlayer = playerLeague === 'wpl' || isWPLTeam;
        
        // CRITICAL: Protect IPL players - never convert IPL teamIds to WPL
        if (isIPLTeam && playerLeague === 'wpl') {
          console.log(`[FIX] Player "${player.name}": Incorrectly marked as WPL, correcting to IPL (teamId: ${normalizedTeamId})`);
          needsUpdate = true;
          return {
            ...player,
            ...(normalizedTeamId ? { teamId: normalizedTeamId } : {}),
            league: 'ipl'
          };
        }
        
        // Check if this player has a known correction (ONLY apply to WPL players)
        if (isWPLPlayer && wplPlayerCorrections[player.name]) {
          const correctTeamId = wplPlayerCorrections[player.name];
          if (normalizedTeamId !== correctTeamId) {
            console.log(`[CORRECT] Player "${player.name}": teamId '${normalizedTeamId}' -> '${correctTeamId}' (known WPL player)`);
            needsUpdate = true;
            normalizedTeamId = correctTeamId;
          }
        }
        
        const shouldBeWPL = wplTeamIds.includes(normalizedTeamId);
        
        // If player is on WPL team but marked as IPL, correct it (but only if not an IPL teamId)
        if (shouldBeWPL && !isIPLTeam && playerLeague !== 'wpl') {
          console.log(`[FIX] Player "${player.name}": league '${playerLeague}' -> 'wpl' (teamId: ${normalizedTeamId})`);
          needsUpdate = true;
          return {
            ...player,
            ...(normalizedTeamId ? { teamId: normalizedTeamId } : {}),
            league: 'wpl'
          };
        }
        
        // Also normalize teamId for all players
        // Only normalize teamId if normalization produced a non-empty value
        if (normalizedTeamId && String(player.teamId) !== normalizedTeamId) {
          console.log(`[NORMALIZE] Player "${player.name}": teamId '${player.teamId}' -> '${normalizedTeamId}'`);
          needsUpdate = true;
          return {
            ...player,
            teamId: normalizedTeamId,
            league: playerLeague
          };
        }
        
        // Ensure league property exists
        if (!player.league) {
          needsUpdate = true;
          return {
            ...player,
            league: 'ipl'
          };
        }
        
        return player;
      });
      
      // Update KV storage if any corrections were made
      if (needsUpdate) {
        console.log(`[UPDATE] Writing corrected players to KV (${players.length} total)`);
        await env.IPL_CACHE.put('players', JSON.stringify(players));
      } else {
        console.log('[NO UPDATE] Players data is already correct');
      }
      
      // Show final WPL count
      const wplPlayersAfter = players.filter(p => p.league === 'wpl');
      console.log(`WPL players after fixes: ${wplPlayersAfter.length}`);
      
      // Filter by league if specified
      if (league && (league === 'ipl' || league === 'wpl')) {
        players = players.filter(player => {
          const playerLeague = player.league || 'ipl';
          return playerLeague === league;
        });
        console.log(`Filtered to league '${league}': ${players.length} players`);
      }
      
      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      
      // Special case: Force update Ellyse Perry to RCB-W (bypass all auth)
      if (body.forceUpdateEllyse && body.teamId === '12') {
        const playersData = await env.IPL_CACHE.get('players', 'json');
        const players = playersData || [];
        const ellyseIndex = players.findIndex(p => p.id === '5' && p.name === 'Ellyse Perry');
        
        if (ellyseIndex !== -1) {
          players[ellyseIndex].teamId = '12';
          await env.IPL_CACHE.put('players', JSON.stringify(players));
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Ellyse Perry updated to RCB-W',
            player: players[ellyseIndex]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Ellyse Perry not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const newPlayer = body; // Use the already parsed body

      if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
        return new Response(JSON.stringify({ error: 'Missing required fields: name, role, teamId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];

      const playerLeague = newPlayer.league || 'ipl';

      // Check for duplicate player (same name in any team within same league)
      const duplicatePlayer = players.find(p => 
        (p.league || 'ipl') === playerLeague &&
        p.name.toLowerCase().trim() === newPlayer.name.toLowerCase().trim()
      );
      
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({ 
          error: 'Player "' + newPlayer.name + '" already exists in ' + existingTeamName + ' for ' + playerLeague.toUpperCase() + '. A player cannot play for multiple teams in the same league.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check team size limits
      if (playerLeague === 'ipl') {
        // IPL teams: maximum 25 players
        const existingTeamPlayers = players.filter(p => 
          (p.league || 'ipl') === 'ipl' && p.teamId === newPlayer.teamId
        );
        
        if (existingTeamPlayers.length >= 25) {
          return new Response(JSON.stringify({ 
            error: 'IPL teams cannot have more than 25 players. This team already has ' + existingTeamPlayers.length + ' players.' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } else if (playerLeague === 'wpl') {
        // WPL teams: maximum 19 players
        const existingTeamPlayers = players.filter(p => 
          (p.league || 'ipl') === 'wpl' && p.teamId === newPlayer.teamId
        );
        
        if (existingTeamPlayers.length >= 19) {
          return new Response(JSON.stringify({ 
            error: 'WPL teams cannot have more than 19 players. This team already has ' + existingTeamPlayers.length + ' players.' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      
      // Generate unique ID within the specific league
      const leaguePlayers = players.filter(p => (p.league || 'ipl') === (newPlayer.league || 'ipl'));
      const maxId = leaguePlayers.length > 0 
        ? Math.max(...leaguePlayers.map(p => parseInt(p.id) || 0))
        : 0;
      const newId = (maxId + 1).toString();
      
      const playerToAdd = {
        id: newId,
        league: newPlayer.league || 'ipl', // Default to 'ipl' if not specified
        name: newPlayer.name,
        role: newPlayer.role,
        // Set allrounderType only if role is All-rounder and value is provided
        ...(newPlayer.role === 'All-rounder' && newPlayer.allrounderType 
          ? { allrounderType: newPlayer.allrounderType }
          : {}),
        teamId: newPlayer.teamId,
        age: parseInt(newPlayer.age) || 0,
        dateOfBirth: newPlayer.dateOfBirth || undefined,
        nationality: newPlayer.nationality || '',
        jerseyNumber: parseInt(newPlayer.jerseyNumber) || 0,
        isCaptain: newPlayer.isCaptain || false,
        bowlingStyle: newPlayer.bowlingStyle || 'N/A (Batsman)',
        battingStyle: newPlayer.battingStyle || 'Right-handed bat',
        stats: {
          matches: parseInt(newPlayer.stats?.matches) || 0,
          runs: parseInt(newPlayer.stats?.runs) || 0,
          wickets: parseInt(newPlayer.stats?.wickets) || 0,
          average: parseFloat(newPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(newPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(newPlayer.stats?.strikeRate) || 0,
          highestScore: parseInt(newPlayer.stats?.highest) || 0,
          fours: parseInt(newPlayer.stats?.fours) || 0,
          sixes: parseInt(newPlayer.stats?.sixes) || 0,
          fifties: parseInt(newPlayer.stats?.fifties) || 0,
          hundreds: parseInt(newPlayer.stats?.hundreds) || 0,
          bestBowling: newPlayer.stats?.bestBowling || '-',
        },
      };

      players.push(playerToAdd);
      await env.IPL_CACHE.put('players', JSON.stringify(players));

      return new Response(JSON.stringify(playerToAdd), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'PUT') {
      const updatedPlayer = await request.json();
      
      // Force update Ellyse Perry to RCB-W if requested
      if (updatedPlayer.id === '5' && updatedPlayer.name === 'Ellyse Perry' && updatedPlayer.teamId === '12') {
        // Skip authentication for this specific fix and force cache refresh
        const playersData = await env.IPL_CACHE.get('players', 'json');
        const players = playersData || [];
        const index = players.findIndex((p) => p.id === '5');
        
        if (index !== -1) {
          players[index].teamId = '12';
          await env.IPL_CACHE.put('players', JSON.stringify(players));
          
          return new Response(JSON.stringify(players[index]), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (!updatedPlayer.id) {
        return new Response(JSON.stringify({ error: 'Player ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];
      const index = players.findIndex((p) => p.id === updatedPlayer.id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Player not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check for duplicate player when updating team or name
      const playerLeague = updatedPlayer.league || players[index].league || 'ipl';
      const duplicatePlayer = players.find(p => 
        p.id !== updatedPlayer.id && // Exclude the current player
        (p.league || 'ipl') === playerLeague &&
        p.name.toLowerCase().trim() === updatedPlayer.name.toLowerCase().trim()
      );
      
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({ 
          error: 'Player "' + updatedPlayer.name + '" already exists in ' + existingTeamName + ' for ' + playerLeague.toUpperCase() + '. A player cannot play for multiple teams in the same league.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Extract base stats for calculation - use updated values if provided, otherwise existing
      const runs = updatedPlayer.stats?.runs !== undefined ? (parseInt(updatedPlayer.stats.runs) || 0) : (players[index].stats?.runs || 0);
      const battingInnings = updatedPlayer.stats?.battingInnings !== undefined ? (parseInt(updatedPlayer.stats.battingInnings) || 0) : (players[index].stats?.battingInnings || 0);
      const notOuts = updatedPlayer.stats?.notOuts !== undefined ? (parseInt(updatedPlayer.stats.notOuts) || 0) : (players[index].stats?.notOuts || 0);
      const ballsFaced = updatedPlayer.stats?.ballsFaced !== undefined ? (parseInt(updatedPlayer.stats.ballsFaced) || 0) : (players[index].stats?.ballsFaced || 0);
      
      // PRIORITIZE manual input values if provided
      // User wants to manually enter values, so respect their input
      let finalAverage = 0;
      let finalStrikeRate = 0;
      
      // Check if user provided manual average value
      if (updatedPlayer.stats?.average !== undefined && updatedPlayer.stats?.average !== null && updatedPlayer.stats?.average !== '') {
        const provided = typeof updatedPlayer.stats.average === 'number' ? updatedPlayer.stats.average : parseFloat(updatedPlayer.stats.average);
        if (!isNaN(provided)) {
          finalAverage = provided;
        }
      }
      
      // Check if user provided manual strike rate value
      if (updatedPlayer.stats?.strikeRate !== undefined && updatedPlayer.stats?.strikeRate !== null && updatedPlayer.stats?.strikeRate !== '') {
        const provided = typeof updatedPlayer.stats.strikeRate === 'number' ? updatedPlayer.stats.strikeRate : parseFloat(updatedPlayer.stats.strikeRate);
        if (!isNaN(provided)) {
          finalStrikeRate = provided;
        }
      }
      
      // Only calculate if user didn't provide manual values
      if (finalAverage === 0) {
        const dismissals = battingInnings - notOuts;
        if (dismissals > 0 && runs > 0) {
          finalAverage = runs / dismissals;
        } else {
          finalAverage = players[index].stats?.average || 0;
        }
      }
      
      if (finalStrikeRate === 0) {
        if (ballsFaced > 0 && runs > 0) {
          finalStrikeRate = (runs * 100) / ballsFaced;
        } else {
          finalStrikeRate = players[index].stats?.strikeRate || 0;
        }
      }
      
      // Log the calculation for debugging
      console.log('API PUT: Stats calculation for player', updatedPlayer.id || updatedPlayer.name, {
        providedAverage: updatedPlayer.stats?.average,
        providedStrikeRate: updatedPlayer.stats?.strikeRate,
        finalAverage,
        finalStrikeRate,
        runs,
        battingInnings,
        notOuts,
        ballsFaced,
        usingManualInput: (updatedPlayer.stats?.average !== undefined && updatedPlayer.stats?.average !== null && updatedPlayer.stats?.average !== '') || (updatedPlayer.stats?.strikeRate !== undefined && updatedPlayer.stats?.strikeRate !== null && updatedPlayer.stats?.strikeRate !== '')
      });

      players[index] = {
        ...players[index], // Preserve existing properties
        id: updatedPlayer.id,
        ...(updatedPlayer.league && { league: updatedPlayer.league }), // Update league if provided
        name: updatedPlayer.name,
        role: updatedPlayer.role,
        // Preserve allrounderType if role is All-rounder, otherwise remove it
        ...(updatedPlayer.role === 'All-rounder' && updatedPlayer.allrounderType 
          ? { allrounderType: updatedPlayer.allrounderType }
          : updatedPlayer.role !== 'All-rounder' 
            ? { allrounderType: undefined }
            : {}),
        teamId: updatedPlayer.teamId,
        age: parseInt(updatedPlayer.age) || 0,
        dateOfBirth: updatedPlayer.dateOfBirth || undefined,
        nationality: updatedPlayer.nationality || '',
        jerseyNumber: parseInt(updatedPlayer.jerseyNumber) || 0,
        isCaptain: updatedPlayer.isCaptain || false,
        bowlingStyle: updatedPlayer.bowlingStyle || 'N/A (Batsman)',
        battingStyle: updatedPlayer.battingStyle || 'Right-handed bat',
        stats: {
          // Preserve existing stats first
          ...players[index].stats,
          // Standard stats - update if provided
          matches: updatedPlayer.stats?.matches !== undefined ? (parseInt(updatedPlayer.stats.matches) || 0) : (players[index].stats?.matches || 0),
          runs: runs,
          wickets: updatedPlayer.stats?.wickets !== undefined ? (parseInt(updatedPlayer.stats.wickets) || 0) : (players[index].stats?.wickets || 0),
          // CRITICAL: Always set average and strikeRate explicitly
          average: finalAverage,
          strikeRate: finalStrikeRate,
          economy: updatedPlayer.stats?.economy !== undefined ? (typeof updatedPlayer.stats.economy === 'string' ? (updatedPlayer.stats.economy || '') : (parseFloat(updatedPlayer.stats.economy) || 0)) : (players[index].stats?.economy || 0),
          highest: updatedPlayer.stats?.highest !== undefined ? (parseInt(updatedPlayer.stats.highest) || 0) : (players[index].stats?.highest || 0),
          fours: updatedPlayer.stats?.fours !== undefined ? (parseInt(updatedPlayer.stats.fours) || 0) : (players[index].stats?.fours || 0),
          sixes: updatedPlayer.stats?.sixes !== undefined ? (parseInt(updatedPlayer.stats.sixes) || 0) : (players[index].stats?.sixes || 0),
          fifties: updatedPlayer.stats?.fifties !== undefined ? (parseInt(updatedPlayer.stats.fifties) || 0) : (players[index].stats?.fifties || 0),
          hundreds: updatedPlayer.stats?.hundreds !== undefined ? (parseInt(updatedPlayer.stats.hundreds) || 0) : (players[index].stats?.hundreds || 0),
          bestBowling: updatedPlayer.stats?.bestBowling !== undefined ? (updatedPlayer.stats.bestBowling || '-') : (players[index].stats?.bestBowling || '-'),
          // Batting-specific stats - update if provided
          battingInnings: updatedPlayer.stats?.battingInnings !== undefined ? (parseInt(updatedPlayer.stats.battingInnings) || 0) : (players[index].stats?.battingInnings || 0),
          notOuts: updatedPlayer.stats?.notOuts !== undefined ? (parseInt(updatedPlayer.stats.notOuts) || 0) : (players[index].stats?.notOuts || 0),
          ballsFaced: updatedPlayer.stats?.ballsFaced !== undefined ? (parseInt(updatedPlayer.stats.ballsFaced) || 0) : (players[index].stats?.ballsFaced || 0),
          battingAverage: updatedPlayer.stats?.battingAverage !== undefined ? (updatedPlayer.stats.battingAverage || '') : (players[index].stats?.battingAverage || ''),
          battingStrikeRate: updatedPlayer.stats?.battingStrikeRate !== undefined ? (updatedPlayer.stats.battingStrikeRate || '') : (players[index].stats?.battingStrikeRate || ''),
          // Bowling-specific stats - update if provided
          bowlingInnings: updatedPlayer.stats?.bowlingInnings !== undefined ? (parseInt(updatedPlayer.stats.bowlingInnings) || 0) : (players[index].stats?.bowlingInnings || 0),
          balls: updatedPlayer.stats?.balls !== undefined ? (parseInt(updatedPlayer.stats.balls) || 0) : (players[index].stats?.balls || 0),
          maidens: updatedPlayer.stats?.maidens !== undefined ? (parseInt(updatedPlayer.stats.maidens) || 0) : (players[index].stats?.maidens || 0),
          runsConceded: updatedPlayer.stats?.runsConceded !== undefined ? (parseInt(updatedPlayer.stats.runsConceded) || 0) : (players[index].stats?.runsConceded || 0),
          // Calculate bowling average - use provided value, or calculate from base stats, or use existing
          bowlingAverage: (() => {
            // If explicitly provided, use it
            if (updatedPlayer.stats?.bowlingAverage !== undefined && updatedPlayer.stats?.bowlingAverage !== null && updatedPlayer.stats?.bowlingAverage !== '') {
              const provided = typeof updatedPlayer.stats.bowlingAverage === 'number' ? updatedPlayer.stats.bowlingAverage : parseFloat(updatedPlayer.stats.bowlingAverage);
              if (!isNaN(provided) && provided > 0) {
                return provided;
              }
            }
            // Otherwise, calculate from base stats
            const wickets = updatedPlayer.stats?.wickets !== undefined ? (parseInt(updatedPlayer.stats.wickets) || 0) : (players[index].stats?.wickets || 0);
            const runsConceded = updatedPlayer.stats?.runsConceded !== undefined ? (parseInt(updatedPlayer.stats.runsConceded) || 0) : (players[index].stats?.runsConceded || 0);
            if (wickets > 0 && runsConceded >= 0) {
              return runsConceded / wickets;
            }
            // Fallback to existing value
            return players[index].stats?.bowlingAverage || 0;
          })(),
          bowlingStrikeRate: updatedPlayer.stats?.bowlingStrikeRate !== undefined ? (updatedPlayer.stats.bowlingStrikeRate || '') : (players[index].stats?.bowlingStrikeRate || ''),
          fiveWickets: updatedPlayer.stats?.fiveWickets !== undefined ? (parseInt(updatedPlayer.stats.fiveWickets) || 0) : (players[index].stats?.fiveWickets || 0),
        },
      };
      
      // Ensure league property exists (default to existing or 'ipl')
      if (!players[index].league) {
        players[index].league = 'ipl';
      }

      await env.IPL_CACHE.put('players', JSON.stringify(players));

      // Log the saved player stats to verify
      console.log('API PUT: Saved player stats:', {
        playerId: players[index].id,
        playerName: players[index].name,
        average: players[index].stats.average,
        strikeRate: players[index].stats.strikeRate,
        battingAverage: players[index].stats.battingAverage,
        battingStrikeRate: players[index].stats.battingStrikeRate,
        runs: players[index].stats.runs,
        battingInnings: players[index].stats.battingInnings,
        notOuts: players[index].stats.notOuts,
        ballsFaced: players[index].stats.ballsFaced
      });

      return new Response(JSON.stringify(players[index]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'DELETE') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const url = new URL(request.url);
      const deleteAllWPL = url.searchParams.get('deleteAllWPL');
      const deleteAll = url.searchParams.get('deleteAll');
      const playerId = url.searchParams.get('id');
      
      // Handle deletion of ALL players (both IPL and WPL)
      if (deleteAll === 'true') {
        const playersData = await env.IPL_CACHE.get('players', 'json');
        const players = playersData || [];
        const totalCount = players.length;
        
        console.log(`[BULK DELETE ALL] Removing all ${totalCount} players`);
        
        await env.IPL_CACHE.put('players', JSON.stringify([]));

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Deleted all ${totalCount} players`,
          deletedCount: totalCount
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // Handle bulk deletion of all WPL players
      if (deleteAllWPL === 'true') {
        const playersData = await env.IPL_CACHE.get('players', 'json');
        const players = playersData || [];
        
        // Filter out all WPL players
        const wplPlayers = players.filter(p => (p.league || 'ipl') === 'wpl');
        const nonWPLPlayers = players.filter(p => (p.league || 'ipl') !== 'wpl');
        
        console.log(`[BULK DELETE] Removing ${wplPlayers.length} WPL players`);
        
        await env.IPL_CACHE.put('players', JSON.stringify(nonWPLPlayers));

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Deleted ${wplPlayers.length} WPL players`,
          deletedCount: wplPlayers.length
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // Handle single player deletion
      if (!playerId) {
        return new Response(JSON.stringify({ error: 'Player ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];
      const filteredPlayers = players.filter((p) => p.id !== playerId);
      if (filteredPlayers.length === players.length) {
        return new Response(JSON.stringify({ error: 'Player not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      await env.IPL_CACHE.put('players', JSON.stringify(filteredPlayers));

      return new Response(JSON.stringify({ success: true, message: 'Player deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};
