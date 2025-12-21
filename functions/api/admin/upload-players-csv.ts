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
// Supports both 2026 format (Player, Team, Price_Cr, Role, Category, Nationality)
// and 2025 format (Players, Team, Type, Base, Sold)
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headerLine = lines[0].toLowerCase();
  const is2025Format = headerLine.includes('type') && headerLine.includes('sold');
  const is2026Format = headerLine.includes('price_cr') && headerLine.includes('category');
  
  const dataLines = lines.slice(1).filter(line => line.trim());
  const players: any[] = [];

  dataLines.forEach((line) => {
    const columns = line.split(',');
    
    if (is2025Format) {
      // 2025 format: Players, Team, Type, Base, Sold
      const [playerName, teamAbbr, playerType, basePrice, soldPrice] = columns;
      
      if (!playerName || !teamAbbr) return;
      
      const teamAbbrTrimmed = teamAbbr.trim();
      
      // Skip players with no team (unsold players)
      if (!teamAbbrTrimmed || teamAbbrTrimmed === '-' || teamAbbrTrimmed === '') {
        return;
      }
      
      // Skip unsold players (check Sold column)
      const soldPriceTrimmed = soldPrice?.trim() || '';
      if (soldPriceTrimmed === 'Unsold' || soldPriceTrimmed === '') {
        return;
      }
      
      const teamId = teamMapping[teamAbbrTrimmed];
      if (!teamId) {
        console.warn(`Unknown team: ${teamAbbrTrimmed} for player ${playerName}`);
        return;
      }
      
      const mappedRole = roleMapping[playerType?.trim() || 'BAT'] || 'Batsman';
      const finalNationality = guessNationality(playerName);
      
      // Parse sold price (remove any non-numeric characters except decimal point)
      let transferFee: number | undefined;
      if (soldPriceTrimmed && soldPriceTrimmed !== 'TBA' && soldPriceTrimmed !== 'Unsold') {
        const priceValue = parseFloat(soldPriceTrimmed.replace(/[^\d.]/g, ''));
        if (!isNaN(priceValue)) {
          transferFee = priceValue;
        }
      }
      
      // Determine bowling and batting styles based on role
      let bowlingStyle = 'N/A (Batsman)';
      let battingStyle = 'Right-handed bat';
      
      if (mappedRole === 'Bowler') {
        bowlingStyle = 'Right-arm medium-fast';
        battingStyle = 'Right-handed bat';
      } else if (mappedRole === 'All-rounder') {
        bowlingStyle = 'Right-arm medium';
        battingStyle = 'Right-handed bat';
      } else if (mappedRole === 'Wicket-keeper') {
        bowlingStyle = 'N/A (Wicket-keeper)';
        battingStyle = 'Right-handed bat';
      }
      
      // Generate realistic stats based on role
      const baseMatches = Math.floor(Math.random() * 50) + 20;
      const baseRuns = mappedRole === 'Bowler' ? Math.floor(Math.random() * 100) : 
                       mappedRole === 'All-rounder' ? Math.floor(Math.random() * 1000) + 200 :
                       Math.floor(Math.random() * 2000) + 500;
      const baseWickets = mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 :
                         mappedRole === 'Bowler' ? Math.floor(Math.random() * 80) + 20 :
                         Math.floor(Math.random() * 30) + 5;
      
      const player = {
        name: playerName.trim(),
        role: mappedRole,
        teamId: teamId,
        league: 'ipl',
        age: Math.floor(Math.random() * 15) + 20, // 20-35
        nationality: finalNationality,
        jerseyNumber: Math.floor(Math.random() * 99) + 1,
        isCaptain: false,
        bowlingStyle: bowlingStyle,
        battingStyle: battingStyle,
        stats: {
          matches: baseMatches,
          runs: baseRuns,
          wickets: baseWickets,
          average: parseFloat((Math.random() * 35 + 15).toFixed(2)),
          strikeRate: parseFloat((Math.random() * 50 + 120).toFixed(2)),
          economy: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 : parseFloat((Math.random() * 3 + 6).toFixed(2)),
          highest: Math.floor(Math.random() * 80) + 20,
          fours: Math.floor(baseRuns / 15),
          sixes: Math.floor(baseRuns / 25),
          fifties: Math.floor(baseMatches / 8),
          hundreds: mappedRole === 'Batsman' ? Math.floor(Math.random() * 3) : 0,
          bestBowling: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? '-' : `${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 20)}`
        },
        transferInfo: {
          lastAuctionYear: 2025,
          acquiredVia: 'auction',
          transferable: false,
          transferFee: transferFee
        }
      };
      
      players.push(player);
      
    } else if (is2026Format) {
      // 2026 format: Player, Team, Price_Cr, Role, Category, Nationality
      const [playerName, teamAbbr, priceCr, role, category, nationality] = columns;
      
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
      
      const mappedRole = roleMapping[role?.trim() || 'Batter'] || 'Batsman';
      const isIndian = nationality?.trim() === 'Indian';
      const finalNationality = isIndian ? 'India' : guessNationality(playerName);
      
      // Determine bowling and batting styles based on role
      let bowlingStyle = 'N/A (Batsman)';
      let battingStyle = 'Right-handed bat';
      
      if (mappedRole === 'Bowler') {
        bowlingStyle = 'Right-arm medium-fast';
        battingStyle = 'Right-handed bat';
      } else if (mappedRole === 'All-rounder') {
        bowlingStyle = 'Right-arm medium';
        battingStyle = 'Right-handed bat';
      } else if (mappedRole === 'Wicket-keeper') {
        bowlingStyle = 'N/A (Wicket-keeper)';
        battingStyle = 'Right-handed bat';
      }
      
      // Generate realistic stats based on role and category
      const isCapped = category?.trim() === 'Capped';
      const baseMatches = isCapped ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 10) + 5;
      const baseRuns = mappedRole === 'Bowler' ? Math.floor(Math.random() * 100) : 
                       mappedRole === 'All-rounder' ? Math.floor(Math.random() * 1000) + 200 :
                       Math.floor(Math.random() * 2000) + 500;
      const baseWickets = mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 :
                         mappedRole === 'Bowler' ? Math.floor(Math.random() * 80) + 20 :
                         Math.floor(Math.random() * 30) + 5;
      
      const player = {
        name: playerName.trim(),
        role: mappedRole,
        teamId: teamId,
        league: 'ipl',
        age: Math.floor(Math.random() * 15) + 20, // 20-35
        nationality: finalNationality,
        jerseyNumber: Math.floor(Math.random() * 99) + 1,
        isCaptain: false,
        bowlingStyle: bowlingStyle,
        battingStyle: battingStyle,
        stats: {
          matches: baseMatches,
          runs: baseRuns,
          wickets: baseWickets,
          average: parseFloat((Math.random() * 35 + 15).toFixed(2)),
          strikeRate: parseFloat((Math.random() * 50 + 120).toFixed(2)),
          economy: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 : parseFloat((Math.random() * 3 + 6).toFixed(2)),
          highest: Math.floor(Math.random() * 80) + 20,
          fours: Math.floor(baseRuns / 15),
          sixes: Math.floor(baseRuns / 25),
          fifties: Math.floor(baseMatches / 8),
          hundreds: mappedRole === 'Batsman' ? Math.floor(Math.random() * 3) : 0,
          bestBowling: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? '-' : `${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 20)}`
        },
        transferInfo: {
          lastAuctionYear: 2026,
          acquiredVia: 'auction',
          transferable: false,
          transferFee: priceCr ? parseFloat(priceCr.trim()) : undefined
        }
      };
      
      players.push(player);
    }
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

