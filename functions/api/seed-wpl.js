/**
 * Cloudflare Pages Function to seed WPL-specific data
 * Run this to populate KV with WPL teams, players, and matches
 */

export const onRequest = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
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
    // WPL Teams (IDs 11-15)
    const wplTeams = [
      {
        id: '11',
        league: 'wpl',
        name: 'Mumbai Indians (WPL)',
        shortName: 'MI-W',
        logo: '/logos/wpl_mi_logo_animated.svg',
        description: 'Defending champions led by Harmanpreet Kaur',
        colors: { primary: '#004BA0', secondary: '#FFD700' },
        homeVenue: 'DY Patil Stadium, Mumbai'
      },
      {
        id: '12',
        league: 'wpl',
        name: 'Royal Challengers Bengaluru (WPL)',
        shortName: 'RCB-W',
        logo: '/logos/wpl_rcb_logo.svg',
        description: 'Led by Smriti Mandhana, known for explosive batting',
        colors: { primary: '#EC1C24', secondary: '#000000' },
        homeVenue: 'M Chinnaswamy Stadium, Bengaluru'
      },
      {
        id: '13',
        league: 'wpl',
        name: 'UP Warriorz',
        shortName: 'UPW',
        logo: '/logos/wpl_upw_logo.svg',
        description: 'Dynamic team with young talent',
        colors: { primary: '#FF6B35', secondary: '#1B1B1B' },
        homeVenue: 'Ekana Cricket Stadium, Lucknow'
      },
      {
        id: '14',
        league: 'wpl',
        name: 'Gujarat Giants',
        shortName: 'GG',
        logo: '/logos/wpl_gg_logo.svg',
        description: 'Strong all-round squad led by Ashleigh Gardner',
        colors: { primary: '#1B2130', secondary: '#E15454' },
        homeVenue: 'Narendra Modi Stadium, Ahmedabad'
      },
      {
        id: '15',
        league: 'wpl',
        name: 'Delhi Capitals (WPL)',
        shortName: 'DC-W',
        logo: '/logos/wpl_dc_logo.svg',
        description: 'Aggressive team with international stars',
        colors: { primary: '#0078BC', secondary: '#EF1B26' },
        homeVenue: 'Arun Jaitley Stadium, Delhi'
      }
    ];

    // WPL Players
    const wplPlayers = [
      // MI-W Players
      {
        id: 'wpl1',
        league: 'wpl',
        name: 'Harmanpreet Kaur',
        role: 'All-rounder',
        teamId: '11',
        age: 35,
        nationality: 'India',
        jerseyNumber: 18,
        isCaptain: true,
        bowlingStyle: 'Right-arm off-break',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 50,
          runs: 1200,
          wickets: 30,
          average: 28.5,
          strikeRate: 125.0,
          economy: 7.2,
          highest: 103,
          fours: 85,
          sixes: 45,
          fifties: 8,
          hundreds: 1,
          bestBowling: '3/15'
        }
      },
      {
        id: 'wpl2',
        league: 'wpl',
        name: 'Alyssa Healy',
        role: 'Wicket-keeper Batter',
        teamId: '11',
        age: 33,
        nationality: 'Australia',
        jerseyNumber: 1,
        isCaptain: false,
        bowlingStyle: 'N/A',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 45,
          runs: 980,
          wickets: 0,
          average: 26.5,
          strikeRate: 130.0,
          economy: 0,
          highest: 88,
          fours: 70,
          sixes: 35,
          fifties: 7,
          hundreds: 0,
          bestBowling: '-'
        }
      },
      {
        id: 'wpl3',
        league: 'wpl',
        name: 'Nat Sciver-Brunt',
        role: 'All-rounder',
        teamId: '11',
        age: 31,
        nationality: 'England',
        jerseyNumber: 8,
        isCaptain: false,
        bowlingStyle: 'Right-arm medium',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 40,
          runs: 750,
          wickets: 45,
          average: 24.0,
          strikeRate: 118.0,
          economy: 6.8,
          highest: 75,
          fours: 55,
          sixes: 20,
          fifties: 5,
          hundreds: 0,
          bestBowling: '4/20'
        }
      },
      // RCB-W Players
      {
        id: 'wpl4',
        league: 'wpl',
        name: 'Smriti Mandhana',
        role: 'Batter',
        teamId: '12',
        age: 27,
        nationality: 'India',
        jerseyNumber: 10,
        isCaptain: true,
        bowlingStyle: 'Right-arm medium',
        battingStyle: 'Left-handed bat',
        stats: {
          matches: 48,
          runs: 1350,
          wickets: 8,
          average: 32.1,
          strikeRate: 135.0,
          economy: 8.5,
          highest: 87,
          fours: 95,
          sixes: 48,
          fifties: 10,
          hundreds: 0,
          bestBowling: '2/25'
        }
      },
      {
        id: 'wpl5',
        league: 'wpl',
        name: 'Ellyse Perry',
        role: 'All-rounder',
        teamId: '12',
        age: 33,
        nationality: 'Australia',
        jerseyNumber: 7,
        isCaptain: false,
        bowlingStyle: 'Right-arm fast',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 42,
          runs: 890,
          wickets: 55,
          average: 28.5,
          strikeRate: 120.0,
          economy: 6.5,
          highest: 85,
          fours: 65,
          sixes: 25,
          fifties: 6,
          hundreds: 0,
          bestBowling: '5/15'
        }
      },
      {
        id: 'wpl6',
        league: 'wpl',
        name: 'Richa Ghosh',
        role: 'Wicket-keeper Batter',
        teamId: '12',
        age: 21,
        nationality: 'India',
        jerseyNumber: 33,
        isCaptain: false,
        bowlingStyle: 'N/A',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 25,
          runs: 420,
          wickets: 0,
          average: 24.0,
          strikeRate: 140.0,
          economy: 0,
          highest: 65,
          fours: 30,
          sixes: 18,
          fifties: 2,
          hundreds: 0,
          bestBowling: '-'
        }
      },
      // UP Warriorz Players
      {
        id: 'wpl7',
        league: 'wpl',
        name: 'Alyssa Perry',
        role: 'All-rounder',
        teamId: '13',
        age: 23,
        nationality: 'Australia',
        jerseyNumber: 17,
        isCaptain: false,
        bowlingStyle: 'Right-arm leg-break',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 18,
          runs: 320,
          wickets: 22,
          average: 22.5,
          strikeRate: 125.0,
          economy: 7.0,
          highest: 61,
          fours: 25,
          sixes: 10,
          fifties: 2,
          hundreds: 0,
          bestBowling: '3/18'
        }
      },
      {
        id: 'wpl8',
        league: 'wpl',
        name: 'Sophie Devine',
        role: 'All-rounder',
        teamId: '13',
        age: 35,
        nationality: 'New Zealand',
        jerseyNumber: 6,
        isCaptain: true,
        bowlingStyle: 'Right-arm medium',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 38,
          runs: 780,
          wickets: 40,
          average: 26.0,
          strikeRate: 122.0,
          economy: 7.1,
          highest: 76,
          fours: 58,
          sixes: 22,
          fifties: 6,
          hundreds: 0,
          bestBowling: '4/22'
        }
      },
      // Gujarat Giants Players
      {
        id: 'wpl9',
        league: 'wpl',
        name: 'Ashleigh Gardner',
        role: 'All-rounder',
        teamId: '14',
        age: 26,
        nationality: 'Australia',
        jerseyNumber: 8,
        isCaptain: true,
        bowlingStyle: 'Right-arm off-break',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 35,
          runs: 680,
          wickets: 48,
          average: 24.5,
          strikeRate: 128.0,
          economy: 6.8,
          highest: 66,
          fours: 52,
          sixes: 18,
          fifties: 4,
          hundreds: 0,
          bestBowling: '4/12'
        }
      },
      {
        id: 'wpl10',
        league: 'wpl',
        name: 'Beth Mooney',
        role: 'Wicket-keeper Batter',
        teamId: '14',
        age: 30,
        nationality: 'Australia',
        jerseyNumber: 5,
        isCaptain: false,
        bowlingStyle: 'N/A',
        battingStyle: 'Left-handed bat',
        stats: {
          matches: 40,
          runs: 920,
          wickets: 0,
          average: 28.0,
          strikeRate: 132.0,
          economy: 0,
          highest: 82,
          fours: 68,
          sixes: 28,
          fifties: 8,
          hundreds: 0,
          bestBowling: '-'
        }
      },
      // DC-W Players
      {
        id: 'wpl11',
        league: 'wpl',
        name: 'Meg Lanning',
        role: 'Batter',
        teamId: '15',
        age: 31,
        nationality: 'Australia',
        jerseyNumber: 1,
        isCaptain: true,
        bowlingStyle: 'Right-arm leg-break',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 36,
          runs: 840,
          wickets: 15,
          average: 26.5,
          strikeRate: 125.0,
          economy: 7.5,
          highest: 78,
          fours: 62,
          sixes: 24,
          fifties: 7,
          hundreds: 0,
          bestBowling: '2/28'
        }
      },
      {
        id: 'wpl12',
        league: 'wpl',
        name: 'Jemimah Rodrigues',
        role: 'Batter',
        teamId: '15',
        age: 24,
        nationality: 'India',
        jerseyNumber: 21,
        isCaptain: false,
        bowlingStyle: 'N/A',
        battingStyle: 'Right-handed bat',
        stats: {
          matches: 32,
          runs: 580,
          wickets: 0,
          average: 22.0,
          strikeRate: 118.0,
          economy: 0,
          highest: 69,
          fours: 42,
          sixes: 15,
          fifties: 4,
          hundreds: 0,
          bestBowling: '-'
        }
      }
    ];

    // WPL Matches
    const wplMatches = [
      {
        id: 'wpl_match_1',
        league: 'wpl',
        team1: { id: 11, name: 'Mumbai Indians (WPL)', shortName: 'MI-W' },
        team2: { id: 12, name: 'Royal Challengers Bengaluru (WPL)', shortName: 'RCB-W' },
        venue: 'DY Patil Stadium, Mumbai',
        date: '2026-01-15',
        time: '19:30',
        status: 'scheduled'
      },
      {
        id: 'wpl_match_2',
        league: 'wpl',
        team1: { id: 13, name: 'UP Warriorz', shortName: 'UPW' },
        team2: { id: 14, name: 'Gujarat Giants', shortName: 'GG' },
        venue: 'Ekana Cricket Stadium, Lucknow',
        date: '2026-01-16',
        time: '15:30',
        status: 'scheduled'
      },
      {
        id: 'wpl_match_3',
        league: 'wpl',
        team1: { id: 15, name: 'Delhi Capitals (WPL)', shortName: 'DC-W' },
        team2: { id: 11, name: 'Mumbai Indians (WPL)', shortName: 'MI-W' },
        venue: 'Arun Jaitley Stadium, Delhi',
        date: '2026-01-17',
        time: '19:30',
        status: 'scheduled'
      },
      {
        id: 'wpl_match_4',
        league: 'wpl',
        team1: { id: 12, name: 'Royal Challengers Bengaluru (WPL)', shortName: 'RCB-W' },
        team2: { id: 14, name: 'Gujarat Giants', shortName: 'GG' },
        venue: 'M Chinnaswamy Stadium, Bengaluru',
        date: '2026-01-18',
        time: '15:30',
        status: 'scheduled'
      },
      {
        id: 'wpl_match_5',
        league: 'wpl',
        team1: { id: 13, name: 'UP Warriorz', shortName: 'UPW' },
        team2: { id: 15, name: 'Delhi Capitals (WPL)', shortName: 'DC-W' },
        venue: 'Narendra Modi Stadium, Ahmedabad',
        date: '2026-01-19',
        time: '19:30',
        status: 'scheduled'
      }
    ];

    // Get existing data
    const existingTeams = await env.IPL_CACHE.get('teams', 'json') || [];
    const existingPlayers = await env.IPL_CACHE.get('players', 'json') || [];
    const existingMatches = await env.IPL_CACHE.get('matches', 'json') || [];

    // Merge teams (avoid duplicates)
    const allTeams = [...existingTeams];
    wplTeams.forEach(team => {
      if (!allTeams.find(t => t.id === team.id)) {
        allTeams.push(team);
      }
    });

    // Merge players (avoid duplicates)
    const allPlayers = [...existingPlayers];
    wplPlayers.forEach(player => {
      if (!allPlayers.find(p => p.id === player.id)) {
        allPlayers.push(player);
      }
    });

    // Merge matches (avoid duplicates)
    const allMatches = [...existingMatches];
    wplMatches.forEach(match => {
      if (!allMatches.find(m => m.id === match.id)) {
        allMatches.push(match);
      }
    });

    // Save to KV
    await env.IPL_CACHE.put('teams', JSON.stringify(allTeams));
    await env.IPL_CACHE.put('players', JSON.stringify(allPlayers));
    await env.IPL_CACHE.put('matches', JSON.stringify(allMatches));

    return new Response(JSON.stringify({
      message: 'WPL data seeded successfully',
      data: {
        teamsAdded: wplTeams.length,
        playersAdded: wplPlayers.length,
        matchesAdded: wplMatches.length,
        totalTeams: allTeams.length,
        totalPlayers: allPlayers.length,
        totalMatches: allMatches.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error seeding WPL data:', error);
    return new Response(JSON.stringify({
      error: 'Failed to seed WPL data',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
