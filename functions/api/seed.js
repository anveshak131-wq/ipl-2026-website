/**
 * Cloudflare Pages Function to seed initial data
 * Run this once to populate KV with mock data
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Only allow GET and OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Mock teams data
    const mockTeams = [
      {
        id: '1',
        name: 'Royal Challengers Bengaluru',
        shortName: 'RCB',
        logo: '/logos/rcb_logo_premium.svg',
        description: 'One of the most popular IPL teams known for their aggressive batting',
        colors: { primary: '#EC1C24', secondary: '#000000' }
      },
      {
        id: '2',
        name: 'Mumbai Indians',
        shortName: 'MI',
        logo: '/logos/mi_logo_new.svg',
        description: 'The most successful IPL team with 5 championship titles',
        colors: { primary: '#004BA0', secondary: '#FFFFFF' }
      },
      {
        id: '3',
        name: 'Sunrisers Hyderabad',
        shortName: 'SRH',
        logo: '/logos/srh_logo_new.svg',
        description: 'Known for their strong bowling attack and consistent performances',
        colors: { primary: '#FF822A', secondary: '#000000' }
      },
      {
        id: '4',
        name: 'Gujarat Titans',
        shortName: 'GT',
        logo: '/logos/gt_logo_new.svg',
        description: 'The newest powerhouse team that won IPL in their debut season',
        colors: { primary: '#1B2130', secondary: '#E15454' }
      },
      {
        id: '5',
        name: 'Punjab Kings',
        shortName: 'PBKS',
        logo: '/logos/kxip_logo_new.svg',
        description: 'Known for their explosive batting and never-say-die attitude',
        colors: { primary: '#ED1D24', secondary: '#FBDD0B' }
      },
      {
        id: '6',
        name: 'Delhi Capitals',
        shortName: 'DC',
        logo: '/logos/dc_logo_new.svg',
        description: 'Young and dynamic team with a perfect blend of experience and youth',
        colors: { primary: '#0078BC', secondary: '#EF1B26' }
      },
      {
        id: '7',
        name: 'Lucknow Super Giants',
        shortName: 'LSG',
        logo: '/logos/lsg_logo_new.svg',
        description: 'The newest franchise making waves with their balanced squad',
        colors: { primary: '#9C2A2C', secondary: '#F7E17D' }
      },
      {
        id: '8',
        name: 'Rajasthan Royals',
        shortName: 'RR',
        logo: '/logos/rr_logo_new.svg',
        description: 'The inaugural IPL champions known for nurturing young talent',
        colors: { primary: '#EA1A85', secondary: '#004B8D' }
      },
      {
        id: '9',
        name: 'Kolkata Knight Riders',
        shortName: 'KKR',
        logo: '/logos/kkr_logo_new.svg',
        description: 'Two-time champions with a massive fan following',
        colors: { primary: '#3A225D', secondary: '#B9975B' }
      },
      {
        id: '10',
        name: 'Chennai Super Kings',
        shortName: 'CSK',
        logo: '/logos/csk_logo_new.svg',
        description: 'The Yellow Army led by the legendary MS Dhoni',
        colors: { primary: '#FFB90F', secondary: '#0081E8' }
      }
    ];

    // Mock players data
    const mockPlayers = [
      {
        id: '1',
        league: 'ipl',
        name: 'Virat Kohli',
        role: 'Batsman',
        teamId: '1',
        age: 35,
        nationality: 'India',
        jerseyNumber: 18,
        isCaptain: true,
        bowlingStyle: 'N/A (Batsman)',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 237,
          runs: 7263,
          wickets: 0,
          average: 37.24,
          strikeRate: 130.02,
          economy: 0,
          highest: 113,
          fours: 629,
          sixes: 237,
          fifties: 50,
          hundreds: 7,
          bestBowling: '-'
        }
      },
      {
        id: '2',
        league: 'ipl',
        name: 'Rohit Sharma',
        role: 'Batsman',
        teamId: '2',
        age: 36,
        nationality: 'India',
        jerseyNumber: 45,
        isCaptain: true,
        bowlingStyle: 'Right-arm off-break',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 243,
          runs: 6230,
          wickets: 0,
          average: 30.31,
          strikeRate: 130.39,
          economy: 0,
          highest: 109,
          fours: 532,
          sixes: 264,
          fifties: 42,
          hundreds: 2,
          bestBowling: '-'
        }
      },
      {
        id: '3',
        league: 'ipl',
        name: 'Jasprit Bumrah',
        role: 'Bowler',
        teamId: '2',
        age: 30,
        nationality: 'India',
        jerseyNumber: 93,
        isCaptain: false,
        bowlingStyle: 'Right-arm fast',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 145,
          runs: 56,
          wickets: 170,
          average: 23.95,
          strikeRate: 87.45,
          economy: 7.39,
          highest: 14,
          fours: 3,
          sixes: 1,
          fifties: 0,
          hundreds: 0,
          bestBowling: '5/10'
        }
      }
    ];

    const restoreIPL = url.searchParams.get('restoreIPL') === 'true';
    
    // Check if players already exist (for restore functionality)
    const existingPlayers = await env.IPL_CACHE.get('players', 'json') || [];
    
    // If restoreIPL is true, skip team check and restore players directly
    if (restoreIPL && existingPlayers.length > 0) {
      // Get existing WPL players (teamIds 11-15 or league='wpl')
      const wplPlayers = existingPlayers.filter(p => {
        const teamId = String(p.teamId || '').trim();
        const league = p.league || 'ipl';
        return league === 'wpl' || ['11', '12', '13', '14', '15'].includes(teamId);
      });
      
      // Get existing IPL players to avoid duplicates
      const existingIPLPlayerNames = existingPlayers
        .filter(p => {
          const teamId = String(p.teamId || '').trim();
          const league = p.league || 'ipl';
          return (league === 'ipl' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(teamId)) || 
                 (league === 'ipl' && !['11', '12', '13', '14', '15'].includes(teamId));
        })
        .map(p => p.name.toLowerCase());
      
      // Add IPL players that don't already exist
      const newIPLPlayers = mockPlayers.filter(p => 
        !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      
      await env.IPL_CACHE.put('players', JSON.stringify(allPlayers));
      
      return new Response(JSON.stringify({
        message: 'IPL players restored successfully',
        restored: newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        totalPlayers: allPlayers.length,
        restoredPlayers: newIPLPlayers.map(p => p.name)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Seed with mock players (initial seed)
    await env.IPL_CACHE.put('players', JSON.stringify(mockPlayers));

    return new Response(JSON.stringify({
      message: 'Data seeded successfully',
      playersCount: mockPlayers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to seed data',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
