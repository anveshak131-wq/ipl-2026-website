/**
 * Cloudflare Pages Function for /api/admin/upload-players-csv
 * Handles CSV file upload, parsing, and player data storage
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check
function verifyAdminToken(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Team mapping: CSV abbreviation -> Team ID
const teamMapping: { [key: string]: string } = {
  'RCB': '1',  // Royal Challengers Bengaluru
  'MI': '2',   // Mumbai Indians
  'SRH': '3',  // Sunrisers Hyderabad
  'GT': '4',   // Gujarat Titans
  'PBKS': '5', // Punjab Kings
  'DC': '6',   // Delhi Capitals
  'LSG': '7',  // Lucknow Super Giants
  'RR': '8',   // Rajasthan Royals
  'KKR': '9',  // Kolkata Knight Riders
  'CSK': '10'  // Chennai Super Kings
};

// Role mapping: CSV role -> Our role format
// Supports both 2026 format (Batter, WK-Batter, etc.) and 2025 format (BAT, BOWL, AR, WK)
const roleMapping: { [key: string]: string } = {
  'Batter': 'Batsman',
  'WK-Batter': 'Wicket-keeper',
  'Bowler': 'Bowler',
  'All-Rounder': 'All-rounder',
  // 2025 auction format
  'BAT': 'Batsman',
  'BOWL': 'Bowler',
  'AR': 'All-rounder',
  'WK': 'Wicket-keeper'
};

// Common overseas nationalities based on names
// Defaults to India since most IPL players are Indian
function guessNationality(name: string): string {
  const nameLower = name.toLowerCase();
  
  // Clear overseas indicators (first names that are rarely Indian)
  const overseasFirstNames = [
    'cameron', 'cooper', 'matthew', 'riley', 'jordan', 'jack', 'zak', 'luke',
    'pat', 'travis', 'marcus', 'glenn', 'josh', 'matt', 'daniel', 'james',
    'will', 'nathan', 'xavier', 'sean', 'aaron', 'liam', 'adam', 'ben',
    'david', 'sam', 'jonny', 'phil', 'jofra', 'ollie', 'reece', 'tom',
    'jordan', 'michael', 'harry', 'jacob', 'brydon', 'chris', 'john',
    'patrick', 'oliver', 'brandon', 'corbin', 'benny', 'tim', 'kyle',
    'trent', 'lockie', 'devon', 'jake', 'kane', 'finn', 'rachin',
    'quinton', 'heinrich', 'tristan', 'aiden', 'faf', 'ryan', 'gerald',
    'dewald', 'rilee', 'sherfane', 'matthew', 'richard', 'kwena', 'lizaad',
    'leus', 'rassie', 'daryn', 'wayne', 'keemo', 'junior', 'dwaine',
    'matheesha', 'pathirana', 'wanindu', 'pathum', 'akeal', 'maheesh',
    'dushmantha', 'kamindu', 'dunith', 'dilshan', 'bhanuka', 'kusal',
    'charith', 'dasun', 'lahiru', 'vijayakanth', 'dumindu',
    'nicholas', 'shimron', 'andre', 'sunil', 'evin', 'johnson', 'litton',
    'alzarri', 'obed', 'romario', 'odean', 'alick', 'hilton', 'dominic',
    'roston', 'shai', 'mustafizur', 'taskin', 'shoriful', 'towhid',
    'mehidy', 'shakib', 'mahedi', 'najibullah', 'tanzim', 'nahid',
    'rashid', 'mujeeb', 'noor', 'naveen', 'rahmanullah', 'ibrahim',
    'qais', 'azmatullah', 'gulbadin', 'mohammad nabi', 'fazalhaq',
    'sediqullah', 'nangeyalia', 'sikandar', 'blessing'
  ];
  
  // Check if first word matches overseas patterns
  const firstWord = nameLower.split(' ')[0];
  for (const pattern of overseasFirstNames) {
    if (firstWord.includes(pattern) || nameLower.includes(pattern)) {
      // Further check for specific countries
      if (['cameron', 'cooper', 'matthew', 'pat', 'travis', 'marcus', 'glenn', 'josh', 'matt', 'daniel', 'james', 'will', 'nathan', 'xavier', 'sean', 'aaron', 'liam', 'adam', 'ben', 'sam', 'jonny', 'phil', 'jofra', 'ollie', 'reece', 'tom', 'michael', 'harry', 'jacob', 'brydon', 'chris', 'john', 'patrick', 'oliver', 'brandon', 'corbin', 'benny'].some(p => firstWord.includes(p) || nameLower.includes(p))) {
        return 'Australia';
      }
      if (['tim', 'kyle', 'trent', 'lockie', 'devon', 'jake', 'kane', 'finn', 'rachin', 'matt henry', 'glenn phillips', 'mitchell santner', 'tom latham', 'kyle verreynne', 'tim southee', 'kyle jamieson'].some(p => nameLower.includes(p))) {
        return 'New Zealand';
      }
      if (['quinton', 'heinrich', 'tristan', 'aiden', 'faf', 'ryan', 'gerald', 'dewald', 'rilee', 'sherfane', 'matthew breetzke', 'richard gleeson', 'kwena', 'lizaad', 'leus', 'rassie', 'daryn', 'richard ngarava', 'wayne', 'keemo', 'junior', 'dwaine'].some(p => nameLower.includes(p))) {
        return 'South Africa';
      }
      if (['matheesha', 'pathirana', 'wanindu', 'pathum', 'akeal', 'maheesh', 'dushmantha', 'kamindu', 'dunith', 'dilshan', 'bhanuka', 'kusal', 'charith', 'dasun', 'lahiru', 'vijayakanth', 'dumindu'].some(p => nameLower.includes(p))) {
        return 'Sri Lanka';
      }
      if (['liam', 'adam', 'ben', 'david', 'sam curran', 'jonny', 'phil', 'jofra', 'ollie', 'reece', 'tom banton', 'sam billings', 'jordan cox', 'ben mcdermott', 'tom kohler', 'james vince', 'richard gleeson', 'matthew potts', 'ben sears', 'john turner', 'joshua', 'oliver', 'harry tector', 'will young', 'sean', 'jacob bethell', 'brydon', 'dan lawrence', 'james anderson', 'chris jordan', 'tymal', 'david payne', 'patrick'].some(p => nameLower.includes(p))) {
        return 'England';
      }
      if (['jason', 'nicholas', 'shimron', 'andre', 'sunil', 'evin', 'brandon', 'johnson', 'litton', 'andre fletcher', 'alzarri', 'obed', 'romario', 'kyle mayers', 'odean', 'alick', 'hilton', 'dominic', 'keemo', 'roston', 'shai'].some(p => nameLower.includes(p))) {
        return 'West Indies';
      }
      if (['mustafizur', 'taskin', 'shoriful', 'towhid', 'litton', 'mehidy', 'shakib', 'mahedi', 'najibullah', 'tanzim', 'nahid'].some(p => nameLower.includes(p))) {
        return 'Bangladesh';
      }
      if (['rashid', 'mujeeb', 'noor', 'naveen', 'rahmanullah', 'najibullah', 'ibrahim', 'qais', 'azmatullah', 'gulbadin', 'mohammad nabi', 'fazalhaq', 'sediqullah', 'nangeyalia'].some(p => nameLower.includes(p))) {
        return 'Afghanistan';
      }
      if (['sikandar', 'blessing', 'richard ngarava'].some(p => nameLower.includes(p))) {
        return 'Zimbabwe';
      }
      // Default to Australia for other overseas
      return 'Australia';
    }
  }
  
  // Default to India (most IPL players are Indian)
  return 'India';
}

// Parse CSV content and convert to player objects
// Only extracts: Name, Team, Type (Role), Nationality
// All other fields are kept empty/default
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headerLine = lines[0].toLowerCase();
  const dataLines = lines.slice(1).filter(line => line.trim());
  const players: any[] = [];

  dataLines.forEach((line) => {
    const columns = line.split(',');
    
    // Try to find Name, Team, Type/Role, Nationality columns
    // Handle different CSV formats by checking header positions
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('player'));
    const teamIndex = headers.findIndex(h => h.includes('team'));
    const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('role'));
    const nationalityIndex = headers.findIndex(h => h.includes('nationality') || h.includes('nation'));
    
    // Extract values
    const playerName = nameIndex >= 0 ? columns[nameIndex]?.trim() : columns[0]?.trim();
    const teamAbbr = teamIndex >= 0 ? columns[teamIndex]?.trim() : columns[1]?.trim();
    const playerType = typeIndex >= 0 ? columns[typeIndex]?.trim() : columns[2]?.trim();
    const nationality = nationalityIndex >= 0 ? columns[nationalityIndex]?.trim() : columns[3]?.trim();
    
    if (!playerName || !teamAbbr) return;
    
    const teamAbbrTrimmed = teamAbbr.trim();
    
    // Skip players with no team
    if (!teamAbbrTrimmed || teamAbbrTrimmed === '-' || teamAbbrTrimmed === '') {
      return;
    }
    
    const teamId = teamMapping[teamAbbrTrimmed];
    if (!teamId) {
      console.warn(`Unknown team: ${teamAbbrTrimmed} for player ${playerName}`);
      return;
    }
    
    // Map role/type
    const mappedRole = roleMapping[playerType?.trim() || 'BAT'] || roleMapping[playerType?.trim() || 'Batter'] || 'Batsman';
    
    // Determine nationality
    let finalNationality = 'India'; // Default
    if (nationality && nationality.trim() && nationality.trim() !== '-') {
      const nationalityTrimmed = nationality.trim();
      if (nationalityTrimmed === 'Indian' || nationalityTrimmed === 'India') {
        finalNationality = 'India';
      } else if (nationalityTrimmed === 'Overseas') {
        finalNationality = guessNationality(playerName);
      } else {
        // Use nationality as-is if it's a country name
        finalNationality = nationalityTrimmed;
      }
    } else {
      // Guess nationality if not provided
      finalNationality = guessNationality(playerName);
    }
    
    const player = {
      name: playerName.trim(),
      role: mappedRole,
      teamId: teamId,
      league: 'ipl',
      nationality: finalNationality,
      // All other fields kept empty (0/empty string) until manually added
      age: 0, // Empty - to be filled manually
      jerseyNumber: 0, // Empty - to be filled manually
      isCaptain: false,
      bowlingStyle: '', // Empty - to be filled manually
      battingStyle: '', // Empty - to be filled manually
      stats: {
        matches: 0, // Empty - to be filled manually
        runs: 0, // Empty - to be filled manually
        wickets: 0, // Empty - to be filled manually
        average: 0, // Empty - to be filled manually
        strikeRate: 0, // Empty - to be filled manually
        economy: 0, // Empty - to be filled manually
        highest: 0, // Empty - to be filled manually
        fours: 0, // Empty - to be filled manually
        sixes: 0, // Empty - to be filled manually
        fifties: 0, // Empty - to be filled manually
        hundreds: 0, // Empty - to be filled manually
        bestBowling: '-' // Empty - to be filled manually
      }
      // transferInfo not included - to be added manually if needed
    };
    
    players.push(player);
  });

  return players;
}

export const onRequest = async (context: any) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Verify admin token
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const parsedPlayers = parseCSV(csvContent);

    if (parsedPlayers.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid players found in CSV' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get existing players from KV
    const existingPlayersData = await env.IPL_CACHE.get('players', 'json');
    const existingPlayers = existingPlayersData || [];

    // IMPORTANT: Preserve all existing players - never overwrite or modify them
    // This ensures 2026 players remain unchanged

    // Find max ID to generate new IDs
    let maxId = 0;
    existingPlayers.forEach((p: any) => {
      const idNum = parseInt(p.id, 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    });

    // Create a set of existing player names (case-insensitive) for duplicate detection
    // Also check by name + teamId combination to catch same player on different teams
    const existingPlayerNames = new Set(
      existingPlayers.map((p: any) => `${p.name.toLowerCase().trim()}_${p.teamId || ''}`)
    );
    
    // Also track by name alone for strict duplicate checking
    const existingPlayerNamesOnly = new Set(
      existingPlayers.map((p: any) => p.name.toLowerCase().trim())
    );

    const newPlayers: any[] = [];
    const skippedPlayers: any[] = [];
    const skippedReasons: { [key: string]: string } = {};

    parsedPlayers.forEach((player) => {
      const playerNameLower = player.name.toLowerCase().trim();
      const playerKey = `${playerNameLower}_${player.teamId || ''}`;
      
      // Skip if player already exists (by name only - strict duplicate check)
      // This prevents adding the same player twice even if they're on different teams
      if (existingPlayerNamesOnly.has(playerNameLower)) {
        skippedPlayers.push(player);
        skippedReasons[player.name] = 'Player already exists (duplicate name)';
        return;
      }
      
      // Also check if same player + team combination exists
      if (existingPlayerNames.has(playerKey)) {
        skippedPlayers.push(player);
        skippedReasons[player.name] = 'Player already exists on this team';
        return;
      }
      
      // Generate new ID and add player
      maxId++;
      newPlayers.push({
        ...player,
        id: String(maxId)
      });
      
      // Add to tracking sets to prevent duplicates within the same upload
      existingPlayerNames.add(playerKey);
      existingPlayerNamesOnly.add(playerNameLower);
    });

    // IMPORTANT: Preserve all existing players and only add new ones
    // This ensures 2026 players are never modified or overwritten
    const updatedPlayers = [...existingPlayers, ...newPlayers];

    // Save to KV
    await env.IPL_CACHE.put('players', JSON.stringify(updatedPlayers));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalParsed: parsedPlayers.length,
        added: newPlayers.length,
        skipped: skippedPlayers.length,
        existingPreserved: existingPlayers.length
      },
      added: newPlayers.map(p => ({
        name: p.name,
        team: Object.keys(teamMapping).find(k => teamMapping[k] === p.teamId),
        role: p.role
      })),
      skipped: skippedPlayers.map(p => ({
        name: p.name,
        reason: skippedReasons[p.name] || 'Duplicate'
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process CSV file',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

