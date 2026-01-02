// Mock data for IPL 2026 website
// TODO: Replace with Cloudflare Worker API calls

import { Team, Player, Match, News, Highlight, Content } from '@/types';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';

export const mockTeams: Team[] = [
  {
    id: '1',
    league: 'ipl',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_premium.svg',
    description: 'One of the most popular IPL teams known for their aggressive batting',
    colors: { primary: '#EC1C24', secondary: '#000000' },
    players: [],
    trophies: [],
    homeGrounds: ['M. Chinnaswamy Stadium']
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
      { year: 2023, name: 'IPL Champions' }
    ],
    homeGrounds: ['Wankhede Stadium']
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
    homeGrounds: ['Arun Jaitley Stadium', 'Rajiv Gandhi International Stadium']
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
    homeGrounds: ['Arun Jaitley Stadium', 'Narendra Modi Stadium']
  },
  {
    id: '5',
    league: 'ipl',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/logos/pbks_logo_2026_animated.svg',
    description: 'Known for their explosive batting and never-say-die attitude',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' },
    players: [],
    trophies: [],
    homeGrounds: ['PCA Stadium', 'Arun Jaitley Stadium']
  },
  {
    id: '6',
    league: 'ipl',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/logos/dc_logo_2026_animated.svg',
    description: 'Young and dynamic team with a perfect blend of experience and youth',
    colors: { primary: '#0078BC', secondary: '#EF1B26' },
    players: [],
    trophies: [],
    homeGrounds: ['Arun Jaitley Stadium']
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
    homeGrounds: ['ARUN JAITLEY STADIUM', 'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium']
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
    homeGrounds: ['Arun Jaitley Stadium', 'Sawai Mansingh Stadium']
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
      { year: 2014, name: 'IPL Champions' }
    ],
    homeGrounds: ['Eden Gardens']
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
      { year: 2021, name: 'IPL Champions' }
    ],
    homeGrounds: ['M. A. Chidambaram Stadium']
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
    summary: 'Royal Challengers Bengaluru have retained their key players ahead of the auction.',
    content: 'RCB management has decided to retain their core group including Virat Kohli, Faf du Plessis...',
    image: '/news/rcb-retains.jpg',
    publishedAt: '2026-02-10T14:30:00Z',
    category: 'team'
  }
];

export const mockHighlights: Highlight[] = [
  {
    id: '1',
    title: 'Best Catches of IPL 2025',
    videoUrl: '/highlights/catches.mp4',
    thumbnail: '/highlights/catches-thumb.jpg',
    matchId: '1',
    description: 'Watch the most spectacular catches from IPL 2025 season'
  },
  {
    id: '2',
    title: 'Six Hitting Extravaganza',
    videoUrl: '/highlights/sixes.mp4',
    thumbnail: '/highlights/sixes-thumb.jpg',
    matchId: '2',
    description: 'The biggest sixes from the IPL 2025 season'
  }
];

// TODO: Replace with actual API calls to Cloudflare Workers
export const api = {
  getTeams: async (league?: 'ipl' | 'wpl'): Promise<Team[]> => {
    try {
      const url = league ? `/api/teams?league=${league}` : '/api/teams';
      console.log('API: Fetching teams from:', url);
      const response = await fetch(url);
      console.log('API: Response status:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
      }
      const teams = await response.json();
      console.log('API: Received teams:', teams.length, 'teams');
      // Filter by league if specified (double check in case API didn't filter)
      const filtered = league ? teams.filter((team: Team) => team.league === league) : teams;
      console.log('API: After filtering by league:', filtered.length, 'teams for', league || 'all');
      return filtered;
    } catch (error) {
      console.error('API: Error fetching teams, using fallback:', error);
      // Fallback to mock data if API fails
      const fallback = league ? mockTeams.filter(team => team.league === league) : mockTeams;
      console.log('API: Using fallback data:', fallback.length, 'teams for', league || 'all');
      return fallback;
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
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
      const response = await fetch('/api/matches?clearAll=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to clear matches');
      }
      return await response.json();
    } catch (error) {
      console.error('Error clearing matches:', error);
      throw error;
    }
  },

  getMatches: async (league?: 'ipl' | 'wpl'): Promise<Match[]> => {
    try {
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
      
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Return empty array if API fails (no fallback mock data)
      return [];
    }
  },
  
  createMatch: async (match: Omit<Match, 'id' | 'team1' | 'team2'> & { team1Id: string; team2Id: string }): Promise<Match> => {
    try {
      const token = localStorage.getItem('adminToken');
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
      return await response.json();
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },
  
  updateMatch: async (id: string, match: Partial<Omit<Match, 'id' | 'team1' | 'team2'> & { team1Id?: string; team2Id?: string }>): Promise<Match> => {
    try {
      const token = localStorage.getItem('adminToken');
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
      return await response.json();
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  },
  
  deleteMatch: async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem('adminToken');
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

      return newsItems as unknown as News[];
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      return mockNews;
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

      return highlights as unknown as Highlight[];
    } catch (error) {
      console.error('Error fetching highlights:', error);
      // Fallback to mock data if API fails
      return mockHighlights;
    }
  },

  // Teams API
  createTeam: async (team: Omit<Team, 'id' | 'players'>): Promise<Team> => {
    try {
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...team })
      });
      if (!response.ok) {
        throw new Error('Failed to update team');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  deleteTeam: async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/teams?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete team');
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
