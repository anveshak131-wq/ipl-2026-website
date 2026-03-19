// Mock data for IPL 2026 website
// TODO: Replace with Cloudflare Worker API calls

import { Team, Player, Match, News, Highlight, Content } from '@/types';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { filterMatchesForSeason, filterNewsForSeason, filterTeamsForSeason, SEASON_YEAR } from '@/lib/season';

const MATCH_CACHE_KEYS = ['matches_cache_all', 'matches_cache_ipl', 'matches_cache_wpl'] as const;

function clearMatchesClientCache(): void {
  if (typeof window === 'undefined') return;

  for (const key of MATCH_CACHE_KEYS) {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('API: Failed to clear matches cache key', key, error);
    }
  }
}

function getAdminAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  return (
    localStorage.getItem('adminToken') ||
    localStorage.getItem('admin_token') ||
    sessionStorage.getItem('admin_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  );
}

export const mockTeams: Team[] = [
  {
    id: '1',
    league: 'ipl',
    name: 'Royal Challengers Bangalore',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_premium.svg',
    description: 'One of the most popular IPL teams known for their aggressive batting',
    colors: { primary: '#EC1C24', secondary: '#000000' },
    players: [],
    trophies: [],
    homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru']
  },
  {
    id: '2',
    league: 'ipl',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_2026_animated.svg',
    description: 'The most successful IPL team with 5 championship titles',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' },
    players: [],
    trophies: [
      { year: 2013, name: 'IPL Champions' },
      { year: 2015, name: 'IPL Champions' },
      { year: 2017, name: 'IPL Champions' },
      { year: 2019, name: 'IPL Champions' },
      { year: 2020, name: 'IPL Champions' }
    ],
    homeGrounds: ['Wankhede Stadium, Mumbai']
  },
  {
    id: '3',
    league: 'ipl',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_2026_animated.svg',
    description: 'Known for their strong bowling attack and consistent performances',
    colors: { primary: '#FF822A', secondary: '#000000' },
    players: [],
    trophies: [
      { year: 2016, name: 'IPL Champions' }
    ],
    homeGrounds: ['Rajiv Gandhi International Stadium, Hyderabad']
  },
  {
    id: '4',
    league: 'ipl',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_2026_animated.svg',
    description: 'The newest powerhouse team that won IPL in their debut season',
    colors: { primary: '#1B2130', secondary: '#E15454' },
    players: [],
    trophies: [
      { year: 2022, name: 'IPL Champions' }
    ],
    homeGrounds: ['Narendra Modi Stadium, Ahmedabad']
  },
  {
    id: '5',
    league: 'ipl',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    aliases: ['Kings XI Punjab', 'Kings Eleven Punjab'],
    logo: '/logos/pbks_logo_2026_animated.svg',
    description: 'Known for their explosive batting and never-say-die attitude',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' },
    players: [],
    trophies: [],
    homeGrounds: ['Punjab Cricket Association Stadium, Mohali']
  },
  {
    id: '6',
    league: 'ipl',
    name: 'Delhi Capitals',
    aliases: ['Delhi Daredevils'],
    shortName: 'DC',
    logo: '/logos/dc_logo_2026_animated.svg',
    description: 'Young and dynamic team with a perfect blend of experience and youth',
    colors: { primary: '#0078BC', secondary: '#EF1B26' },
    players: [],
    trophies: [],
    homeGrounds: ['Arun Jaitley Stadium, Delhi']
  },
  {
    id: '7',
    league: 'ipl',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_2026_animated.svg',
    description: 'The newest franchise making waves with their balanced squad',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' },
    players: [],
    trophies: [],
    homeGrounds: ['Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow']
  },
  {
    id: '8',
    league: 'ipl',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_2026_animated.svg',
    description: 'The inaugural IPL champions known for nurturing young talent',
    colors: { primary: '#EA1A85', secondary: '#004B8D' },
    players: [],
    trophies: [
      { year: 2008, name: 'IPL Champions' }
    ],
    homeGrounds: ['Sawai Mansingh Stadium, Jaipur']
  },
  {
    id: '9',
    league: 'ipl',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_2026_animated.svg',
    description: 'Two-time champions with a massive fan following',
    colors: { primary: '#3A225D', secondary: '#B9975B' },
    players: [],
    trophies: [
      { year: 2012, name: 'IPL Champions' },
      { year: 2014, name: 'IPL Champions' },
      { year: 2024, name: 'IPL Champions' }
    ],
    homeGrounds: ['Eden Gardens, Kolkata']
  },
  {
    id: '10',
    league: 'ipl',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_2026_animated.svg',
    description: 'The Yellow Army led by the legendary MS Dhoni',
    colors: { primary: '#FFB90F', secondary: '#0081E8' },
    players: [],
    trophies: [
      { year: 2010, name: 'IPL Champions' },
      { year: 2011, name: 'IPL Champions' },
      { year: 2018, name: 'IPL Champions' },
      { year: 2021, name: 'IPL Champions' },
      { year: 2023, name: 'IPL Champions' }
    ],
    homeGrounds: ['M. A. Chidambaram Stadium, Chennai']
  },
  {
    id: '16',
    league: 'ipl',
    name: 'Gujarat Lions',
    shortName: 'GL',
    logo: '/logos/tba_logo.svg',
    description: 'Temporary IPL franchise that competed in the 2016 and 2017 seasons',
    colors: { primary: '#F28C28', secondary: '#1B365D' },
    players: [],
    trophies: [],
    homeGrounds: ['Saurashtra Cricket Association Stadium, Rajkot']
  },
  {
    id: '17',
    league: 'ipl',
    name: 'Rising Pune Supergiant',
    shortName: 'RPS',
    aliases: ['Rising Pune Supergiants'],
    logo: '/logos/tba_logo.svg',
    description: 'Temporary IPL franchise that competed in the 2016 and 2017 seasons',
    colors: { primary: '#6A1B9A', secondary: '#F06292' },
    players: [],
    trophies: [],
    homeGrounds: ['Maharashtra Cricket Association Stadium, Pune']
  },
  {
    id: '18',
    league: 'ipl',
    name: 'Deccan Chargers',
    shortName: 'DCG',
    logo: '/logos/tba_logo.svg',
    description: 'Defunct IPL franchise that competed from 2008 through 2012',
    colors: { primary: '#1E3A8A', secondary: '#F59E0B' },
    players: [],
    trophies: [
      { year: 2009, name: 'IPL Champions' }
    ],
    homeGrounds: ['Rajiv Gandhi International Stadium, Hyderabad']
  },
  {
    id: '19',
    league: 'ipl',
    name: 'Kochi Tuskers Kerala',
    shortName: 'KTK',
    logo: '/logos/tba_logo.svg',
    description: 'Defunct IPL franchise that competed in the 2011 season',
    colors: { primary: '#0F766E', secondary: '#F97316' },
    players: [],
    trophies: [],
    homeGrounds: ['Jawaharlal Nehru Stadium, Kochi']
  },
  {
    id: '20',
    league: 'ipl',
    name: 'Pune Warriors India',
    shortName: 'PWI',
    logo: '/logos/tba_logo.svg',
    description: 'Defunct IPL franchise that competed from 2011 through 2013',
    colors: { primary: '#2563EB', secondary: '#FACC15' },
    players: [],
    trophies: [],
    homeGrounds: ['Maharashtra Cricket Association Stadium, Pune']
  },
  // WPL Teams
  {
    id: '11',
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_animated.svg',
    description: 'The women\'s franchise of Mumbai Indians bringing championship pedigree',
    colors: { primary: '#004BA0', secondary: '#FFD700' },
    players: [],
    trophies: [
      {
        year: 2023,
        name: 'WPL Champions'
      }
    ],
    homeGrounds: ['Wankhede Stadium, Mumbai']
  },
  {
    id: '12',
    league: 'wpl',
    name: 'Royal Challengers Bangalore (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    description: 'The women\'s franchise of RCB with explosive talent',
    colors: { primary: '#C8102E', secondary: '#FFD700' },
    players: [],
    trophies: [
      {
        year: 2024,
        name: 'WPL Champions'
      }
    ],
    homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru']
  },
  {
    id: '13',
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_animated.svg',
    description: 'The women\'s franchise of Delhi Capitals combining youth and experience',
    colors: { primary: '#004BA0', secondary: '#DC2626' },
    players: [],
    trophies: [],
    homeGrounds: ['Arun Jaitley Stadium, Delhi']
  },
  {
    id: '14',
    league: 'wpl',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_animated.svg',
    description: 'The women\'s franchise of Gujarat Giants aiming for glory',
    colors: { primary: '#F97316', secondary: '#FFD700' },
    players: [],
    trophies: [],
    homeGrounds: ['Narendra Modi Stadium, Ahmedabad']
  },
  {
    id: '15',
    league: 'wpl',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_animated.svg',
    description: 'The women\'s franchise of UP Warriorz bringing fierce competition',
    colors: { primary: '#059669', secondary: '#F97316' },
    players: [],
    trophies: [],
    homeGrounds: ['Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow']
  }
];

export const mockPlayers: Player[] = [
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

// No mock/sample matches - start with empty array
// Users must create matches through the admin panel
export const mockMatches: Match[] = [];

export const mockNews: News[] = [
  {
    id: '1',
    title: 'IPL 2026 Schedule Announced',
    summary: 'The complete schedule for IPL 2026 has been released with exciting matches lined up.',
    content: 'The Board of Control for Cricket in India (BCCI) has announced the complete schedule for IPL 2026...',
    image: '/news/schedule.jpg',
    publishedAt: '2026-02-15T10:00:00Z',
    category: 'general'
  },
  {
    id: '2',
    title: 'RCB Retains Core Squad for 2026',
    summary: 'Royal Challengers Bangalore have retained their key players ahead of the auction.',
    content: 'RCB management has decided to retain their core group including Virat Kohli, Faf du Plessis...',
    image: '/news/rcb-retains.jpg',
    publishedAt: '2026-02-10T14:30:00Z',
    category: 'team'
  }
];

export const mockHighlights: Highlight[] = [
  {
    id: '1',
    title: 'Best Catches of IPL 2026',
    videoUrl: '/highlights/catches.mp4',
    thumbnail: '/highlights/catches-thumb.jpg',
    matchId: '1',
    description: 'Watch the most spectacular catches from the IPL 2026 season'
  },
  {
    id: '2',
    title: 'Six Hitting Extravaganza',
    videoUrl: '/highlights/sixes.mp4',
    thumbnail: '/highlights/sixes-thumb.jpg',
    matchId: '2',
    description: 'The biggest sixes from the IPL 2026 season'
  }
];

// TODO: Replace with actual API calls to Cloudflare Workers
export const api = {
  getTeams: async (league?: 'ipl' | 'wpl'): Promise<Team[]> => {
    try {
      const baseUrl = league ? `/api/teams?league=${league}` : '/api/teams';
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
      console.log('API: Fetching teams from:', url);
      const response = await fetch(url, { cache: 'no-store' });
      console.log('API: Response status:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
      }
      const teams = await response.json();
      console.log('API: Received teams:', teams.length, 'teams');
      // Filter by league if specified (double check in case API didn't filter)
      const filtered = league ? teams.filter((team: Team) => team.league === league) : teams;
      console.log('API: After filtering by league:', filtered.length, 'teams for', league || 'all');
      return filterTeamsForSeason(filtered, SEASON_YEAR);
    } catch (error) {
      console.error('API: Error fetching teams, using fallback:', error);
      // Fallback to mock data if API fails
      const fallback = league ? mockTeams.filter(team => team.league === league) : mockTeams;
      console.log('API: Using fallback data:', fallback.length, 'teams for', league || 'all');
      return filterTeamsForSeason(fallback, SEASON_YEAR);
    }
  },
  
  getPlayers: async (teamId?: string, league?: 'ipl' | 'wpl'): Promise<Player[]> => {
    try {
      const url = league ? `/api/players?league=${league}` : '/api/players';
      console.log('API: Fetching players from:', url);
      const response = await fetch(url);
      console.log('API: Players response status:', response.status, response.ok);
      
      if (!response.ok) {
        console.error('API: Failed to fetch players, status:', response.status);
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      let players = await response.json();
      console.log('API: Received players:', players?.length || 0, 'players');
      console.log('API: Players data:', players);
      
      // Don't use fallback mock data - return empty array if no players in KV
      if (!players || players.length === 0) {
        console.log('API: No players returned from KV storage for league:', league);
        return [];
      }
      
      // Ensure all players have league property (migration for existing data)
      players = players.map((p: Player) => ({
        ...p,
        league: p.league || 'ipl', // Default to 'ipl' if missing
        // Ensure teamId is a string for consistent comparison
        teamId: String(p.teamId)
      }));
      
      console.log('API: After mapping, players count:', players.length);
      console.log('API: Sample players after mapping:', players.slice(0, 3).map((p: Player) => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        teamIdType: typeof p.teamId,
        league: p.league,
        leagueType: typeof p.league
      })));
      
      // Filter by league if specified
      if (league) {
        const beforeFilter = players.length;
        // Store original players to check available leagues if needed
        const originalPlayers = [...players];
        players = players.filter((p: Player) => {
          const playerLeague = p.league || 'ipl';
          const matches = playerLeague === league;
          if (!matches && beforeFilter < 20) {
            console.log(`API: Player filtered out by league:`, {
              name: p.name,
              playerLeague,
              requestedLeague: league
            });
          }
          return matches;
        });
        console.log(`API: After filtering by league '${league}':`, beforeFilter, '->', players.length);
        if (players.length === 0 && beforeFilter > 0) {
          const uniqueLeagues = Array.from(new Set(originalPlayers.map((p: Player) => p.league || 'ipl')));
          console.warn(`⚠️ No players match league '${league}'. Available leagues:`, uniqueLeagues);
        }
      }
      
      // Filter by team if specified
      if (teamId) {
        const beforeTeamFilter = players.length;
        players = players.filter((p: Player) => p.teamId === teamId);
        console.log(`API: After filtering by teamId '${teamId}':`, beforeTeamFilter, '->', players.length);
      }
      
      const finalList = teamId ? sortPlayersByRoleAndAge(players) : players;
      console.log('API: Final players list:', finalList.length, 'players');
      return finalList;
    } catch (error) {
      console.error('API: Error fetching players:', error);
      // Return empty array instead of fallback - let the user know there are no players
      return [];
    }
  },
  
  clearAllMatches: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches?clearAll=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to clear matches (${response.status}): ${body}`);
      }
      clearMatchesClientCache();
      return await response.json();
    } catch (error) {
      console.error('Error clearing matches:', error);
      throw error;
    }
  },

  getMatches: async (league?: 'ipl' | 'wpl'): Promise<Match[]> => {
    try {
      // Browser-side cache to avoid refetching on every navigation
      if (typeof window !== 'undefined') {
        const cacheKey = `matches_cache_${league || 'all'}`;
        const cachedRaw = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { ts: number; data: Match[] };
            const maxAgeMs = 2 * 60 * 1000; // 2 minutes is enough for schedule data
            if (Date.now() - cached.ts < maxAgeMs && Array.isArray(cached.data)) {
              return filterMatchesForSeason(cached.data, SEASON_YEAR);
            }
          } catch (err) {
            console.warn('API: Failed to parse cached matches, ignoring cache', err);
          }
        }
      }

      const url = league ? `/api/matches?league=${league}` : '/api/matches';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      let matches = await response.json();
      
      // If API returns empty array, return empty array (no fallback mock data)
      if (!matches || matches.length === 0) {
        console.log('API: No matches returned');
        return [];
      }
      
      // Ensure all matches have league property (migration for existing data)
      matches = matches.map((match: Match) => ({
        ...match,
        league: match.league || 'ipl' // Default to 'ipl' if missing
      }));
      
      // Filter by league if specified
      if (league) {
        matches = matches.filter((match: Match) => {
          const matchLeague = match.league || 'ipl';
          return matchLeague === league;
        });
      }

      matches = filterMatchesForSeason(matches, SEASON_YEAR);

      if (typeof window !== 'undefined') {
        const cacheKey = `matches_cache_${league || 'all'}`;
        const payload = JSON.stringify({ ts: Date.now(), data: matches });
        try {
          sessionStorage.setItem(cacheKey, payload);
          localStorage.setItem(cacheKey, payload);
        } catch (err) {
          console.warn('API: Failed to write matches cache', err);
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Return empty array if API fails (no fallback mock data)
      return [];
    }
  },
  
  bulkUpdateMatchStatus: async (
    matchIds: string[],
    status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  ): Promise<{ updated: number; status: string }> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches?bulkStatus=true', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchIds, status })
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bulk status update failed (${response.status}): ${body}`);
      }
      clearMatchesClientCache();
      return await response.json();
    } catch (error) {
      console.error('Error bulk updating match status:', error);
      throw error;
    }
  },

  bulkCreateMatches: async (
    matches: Array<Omit<Match, 'id' | 'team1' | 'team2'> & { team1Id: string; team2Id: string }>
  ): Promise<{ created: Match[]; count: number }> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches?bulk=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matches })
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bulk create failed (${response.status}): ${body}`);
      }
      clearMatchesClientCache();
      return await response.json();
    } catch (error) {
      console.error('Error bulk creating matches:', error);
      throw error;
    }
  },

  bulkDeleteMatches: async (
    matchIds: string[]
  ): Promise<{ success: boolean; deleted: number; requested: number; notFound?: string[]; message?: string }> => {
    try {
      if (!Array.isArray(matchIds) || matchIds.length === 0) {
        throw new Error('No match IDs provided for bulk delete.');
      }

      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches?bulkDelete=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchIds })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bulk delete failed (${response.status}): ${body}`);
      }

      const result = await response.json();
      clearMatchesClientCache();
      return result;
    } catch (error) {
      console.error('Error bulk deleting matches:', error);
      throw error;
    }
  },

  createMatch: async (match: Omit<Match, 'id' | 'team1' | 'team2'> & { team1Id: string; team2Id: string }): Promise<Match> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(match)
      });
      if (!response.ok) {
        throw new Error('Failed to create match');
      }
      clearMatchesClientCache();
      return await response.json();
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },
  
  updateMatch: async (id: string, match: Partial<Omit<Match, 'id' | 'team1' | 'team2'> & { team1Id?: string; team2Id?: string }>): Promise<Match> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...match })
      });
      if (!response.ok) {
        throw new Error('Failed to update match');
      }
      clearMatchesClientCache();
      return await response.json();
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  },
  
  deleteMatch: async (id: string): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Match ID is required for deletion.');
      }

      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }
      
      const response = await fetch(`/api/matches?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to delete match: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the default error message
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Try to parse response, but don't fail if it's empty
      try {
        const result = await response.json();
        if (result.error && !result.success) {
          throw new Error(result.error);
        }
      } catch (e) {
        // If response is empty or not JSON, that's okay - deletion might still be successful
        // We'll verify by checking if the match still exists after refresh
        console.log('Delete response was empty or not JSON, assuming success');
      }

      clearMatchesClientCache();
    } catch (error: any) {
      console.error('API: Error deleting match:', error);
      throw error;
    }
  },
  
  getNews: async (): Promise<News[]> => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const allContent = (await response.json()) as Content[];

      const now = Date.now();
      const isWithinSchedule = (item: Content, atMs: number) => {
        if (!item.isActive) return false;
        if (item.publishAt) {
          const start = Date.parse(item.publishAt);
          if (!Number.isNaN(start) && atMs < start) return false;
        }
        if (item.unpublishAt) {
          const end = Date.parse(item.unpublishAt);
          if (!Number.isNaN(end) && atMs >= end) return false;
        }
        return true;
      };

      // Only include scheduled & active news items and sort newest-first
      const newsItems = allContent
        .filter((item) => item.type === 'news' && isWithinSchedule(item, now))
        .sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt || '').getTime() || 0;
          const dateB = new Date(b.publishedAt || b.createdAt || '').getTime() || 0;
          return dateB - dateA;
        });

      return filterNewsForSeason(newsItems as unknown as News[], SEASON_YEAR);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      return filterNewsForSeason(mockNews, SEASON_YEAR);
    }
  },

  getHighlights: async (): Promise<Highlight[]> => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch highlights');
      }
      const allContent = (await response.json()) as Content[];

      const now = Date.now();
      const isWithinSchedule = (item: Content, atMs: number) => {
        if (!item.isActive) return false;
        if (item.publishAt) {
          const start = Date.parse(item.publishAt);
          if (!Number.isNaN(start) && atMs < start) return false;
        }
        if (item.unpublishAt) {
          const end = Date.parse(item.unpublishAt);
          if (!Number.isNaN(end) && atMs >= end) return false;
        }
        return true;
      };

      // Filter for highlight type content that is within its schedule
      const highlights = allContent.filter(
        (item: Content) => item.type === 'highlight' && isWithinSchedule(item, now),
      );

      return filterNewsForSeason(highlights as unknown as News[], SEASON_YEAR) as unknown as Highlight[];
    } catch (error) {
      console.error('Error fetching highlights:', error);
      // Fallback to mock data if API fails
      return filterNewsForSeason(mockHighlights as unknown as News[], SEASON_YEAR) as unknown as Highlight[];
    }
  },

  // Teams API
  createTeam: async (team: Omit<Team, 'id' | 'players'>): Promise<Team> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Creating team with data:', { ...team, league: team.league });
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(team)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to create team: ${response.status} ${response.statusText}`;
        console.error('API error response:', errorData);
        throw new Error(errorMessage);
      }
      
      const createdTeam = await response.json();
      console.log('Team created successfully:', createdTeam);
      return createdTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  updateTeam: async (id: string, team: Partial<Omit<Team, 'id' | 'players'>>): Promise<Team> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...team })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message =
          (errorData && (errorData.error || errorData.message)) ||
          `Failed to update team: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  deleteTeam: async (id: string): Promise<void> => {
    try {
      const token = getAdminAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await fetch(`/api/teams?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message =
          (errorData && (errorData.error || errorData.message)) ||
          `Failed to delete team: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Content API
  getContent: async (): Promise<Content[]> => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  },

  createContent: async (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<Content> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(content)
      });
      if (!response.ok) {
        throw new Error('Failed to create content');
      }
      const result = await response.json();
      return result.content || result;
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  },

  updateContent: async (id: string, content: Partial<Omit<Content, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Content> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...content })
      });
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      const result = await response.json();
      return result.content || result;
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  },

  deleteContent: async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  },

  // Settings API
  getSettings: async (): Promise<any> => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  },

  updateSettings: async (settings: any): Promise<any> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      const result = await response.json();
      return result.settings || result;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Player API
  updatePlayer: async (playerId: string, updatedPlayer: Partial<Player>): Promise<Player> => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: playerId, ...updatedPlayer })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to update player: ${response.status} ${response.statusText}`;
        console.error('API error response:', errorData);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  },

  createPlayer: async (player: Omit<Player, 'id'>): Promise<Player> => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(player)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to create player: ${response.status} ${response.statusText}`;
        console.error('API error response:', errorData);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  },

  deletePlayer: async (playerId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/players?id=${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to delete player: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  },

  // Predictions API
  createPrediction: async (prediction: {
    matchId: string;
    predictedWinner: 'team1' | 'team2';
    playerPredictions?: {
      topScorer?: string;
      mostWickets?: string;
      playerOfMatch?: string;
    };
    league: 'ipl' | 'wpl';
  }): Promise<any> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prediction)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create prediction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating prediction:', error);
      throw error;
    }
  },

  getPredictions: async (filters?: {
    matchId?: string;
    userId?: string;
    league?: 'ipl' | 'wpl';
  }): Promise<any[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.matchId) params.append('matchId', filters.matchId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.league) params.append('league', filters.league);

      const url = `/api/predictions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  },

  updatePrediction: async (id: string, updates: {
    predictedWinner?: 'team1' | 'team2';
    playerPredictions?: {
      topScorer?: string;
      mostWickets?: string;
      playerOfMatch?: string;
    };
  }): Promise<any> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/predictions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update prediction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating prediction:', error);
      throw error;
    }
  },

  getLeaderboard: async (matchId?: string): Promise<any[]> => {
    try {
      const url = `/api/predictions/leaderboard${matchId ? `?matchId=${matchId}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  getPredictionStats: async (userId: string): Promise<any> => {
    try {
      const response = await fetch(`/api/predictions/stats?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prediction stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching prediction stats:', error);
      return null;
    }
  },

  voteOnPoll: async (matchId: string, pollId: string, optionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/predictions/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'vote',
          matchId,
          pollId,
          optionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to vote on poll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error;
    }
  },

  getPolls: async (matchId: string): Promise<any | null> => {
    try {
      const response = await fetch(`/api/predictions/polls?matchId=${matchId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching polls:', error);
      return null;
    }
  }
};
