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
const roleMapping: { [key: string]: string } = {
  'Batter': 'Batsman',
  'WK-Batter': 'Wicket-keeper',
  'Bowler': 'Bowler',
  'All-Rounder': 'All-rounder'
};

// Common overseas nationalities based on names
function guessNationality(name: string): string {
  const nameLower = name.toLowerCase();
  // Australian names
  if (nameLower.includes('cameron') || nameLower.includes('cooper') || nameLower.includes('matthew') || 
      nameLower.includes('riley') || nameLower.includes('jordan') || nameLower.includes('jack') ||
      nameLower.includes('zak') || nameLower.includes('luke')) {
    return 'Australia';
  }
  // New Zealand names
  if (nameLower.includes('rachin') || nameLower.includes('finn') || nameLower.includes('tim') ||
      nameLower.includes('matt') || nameLower.includes('kyle') || nameLower.includes('jacob')) {
    return 'New Zealand';
  }
  // South African names
  if (nameLower.includes('anrich') || nameLower.includes('lungi') || nameLower.includes('quinton')) {
    return 'South Africa';
  }
  // Sri Lankan names
  if (nameLower.includes('matheesha') || nameLower.includes('pathirana') || nameLower.includes('wanindu') ||
      nameLower.includes('pathum') || nameLower.includes('akeal')) {
    return 'Sri Lanka';
  }
  // English names
  if (nameLower.includes('liam') || nameLower.includes('josh') || nameLower.includes('adam') ||
      nameLower.includes('ben') || nameLower.includes('david')) {
    return 'England';
  }
  // West Indies
  if (nameLower.includes('jason')) {
    return 'West Indies';
  }
  // Default to Australia for unknown overseas
  return 'Australia';
}

// Parse CSV content and convert to player objects
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const dataLines = lines.slice(1).filter(line => line.trim());
  const players: any[] = [];

  dataLines.forEach((line) => {
    const [playerName, teamAbbr, priceCr, role, category, nationality] = line.split(',');
    
    if (!playerName || !teamAbbr) return;
    
    const teamId = teamMapping[teamAbbr.trim()];
    if (!teamId) {
      console.warn(`Unknown team: ${teamAbbr} for player ${playerName}`);
      return;
    }
    
    const mappedRole = roleMapping[role.trim()] || 'Batsman';
    const isIndian = nationality.trim() === 'Indian';
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
    const isCapped = category.trim() === 'Capped';
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

    // Find max ID to generate new IDs
    let maxId = 0;
    existingPlayers.forEach((p: any) => {
      const idNum = parseInt(p.id, 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    });

    // Check for existing players by name (case-insensitive)
    const existingPlayerNames = new Set(
      existingPlayers.map((p: any) => p.name.toLowerCase().trim())
    );

    const newPlayers: any[] = [];
    const skippedPlayers: any[] = [];

    parsedPlayers.forEach((player) => {
      const playerNameLower = player.name.toLowerCase().trim();
      
      if (existingPlayerNames.has(playerNameLower)) {
        skippedPlayers.push(player);
      } else {
        // Generate new ID
        maxId++;
        newPlayers.push({
          ...player,
          id: String(maxId)
        });
        existingPlayerNames.add(playerNameLower);
      }
    });

    // Add new players to existing players
    const updatedPlayers = [...existingPlayers, ...newPlayers];

    // Save to KV
    await env.IPL_CACHE.put('players', JSON.stringify(updatedPlayers));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalParsed: parsedPlayers.length,
        added: newPlayers.length,
        skipped: skippedPlayers.length
      },
      added: newPlayers,
      skipped: skippedPlayers.map(p => p.name)
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

