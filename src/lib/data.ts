// Mock data for IPL 2026 website
// TODO: Replace with Cloudflare Worker API calls

import { Team, Player, Match, News, Highlight, Content } from '@/types';

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_new.svg',
    description: 'One of the most popular IPL teams known for their aggressive batting',
    colors: { primary: '#EC1C24', secondary: '#000000' },
    players: []
  },
  {
    id: '2',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_new.svg',
    description: 'The most successful IPL team with 5 championship titles',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' },
    players: []
  },
  {
    id: '3',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_new.svg',
    description: 'Known for their strong bowling attack and consistent performances',
    colors: { primary: '#FF822A', secondary: '#000000' },
    players: []
  },
  {
    id: '4',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_new.svg',
    description: 'The newest powerhouse team that won IPL in their debut season',
    colors: { primary: '#1B2130', secondary: '#E15454' },
    players: []
  },
  {
    id: '5',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/logos/kxip_logo_new.svg',
    description: 'Known for their explosive batting and never-say-die attitude',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' },
    players: []
  },
  {
    id: '6',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/logos/dc_logo_new.svg',
    description: 'Young and dynamic team with a perfect blend of experience and youth',
    colors: { primary: '#0078BC', secondary: '#EF1B26' },
    players: []
  },
  {
    id: '7',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_new.svg',
    description: 'The newest franchise making waves with their balanced squad',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' },
    players: []
  },
  {
    id: '8',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_new.svg',
    description: 'The inaugural IPL champions known for nurturing young talent',
    colors: { primary: '#EA1A85', secondary: '#004B8D' },
    players: []
  },
  {
    id: '9',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_new.svg',
    description: 'Two-time champions with a massive fan following',
    colors: { primary: '#3A225D', secondary: '#B9975B' },
    players: []
  },
  {
    id: '10',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_new.svg',
    description: 'The Yellow Army led by the legendary MS Dhoni',
    colors: { primary: '#FFFF00', secondary: '#0081E8' },
    players: []
  }
];

export const mockPlayers: Player[] = [
  {
    id: '1',
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

export const mockMatches: Match[] = [
  {
    id: '1',
    date: '2026-03-23',
    time: '19:30',
    venue: 'M. A. Chidambaram Stadium, Chennai',
    team1: mockTeams[9], // CSK
    team2: mockTeams[1], // RCB
    status: 'upcoming'
  },
  {
    id: '2',
    date: '2026-03-24',
    time: '15:30',
    venue: 'Eden Gardens, Kolkata',
    team1: mockTeams[8], // KKR
    team2: mockTeams[3], // GT
    status: 'upcoming'
  },
  {
    id: '3',
    date: '2026-03-25',
    time: '19:30',
    venue: 'Wankhede Stadium, Mumbai',
    team1: mockTeams[1], // MI
    team2: mockTeams[7], // RR
    status: 'upcoming'
  }
];

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
  getTeams: async (): Promise<Team[]> => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      // Fallback to mock data if API fails
      return mockTeams;
    }
  },
  
  getPlayers: async (teamId?: string): Promise<Player[]> => {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const players = await response.json();
      return teamId ? players.filter((p: Player) => p.teamId === teamId) : players;
    } catch (error) {
      console.error('Error fetching players:', error);
      // Fallback to mock data if API fails
      return teamId ? mockPlayers.filter(p => p.teamId === teamId) : mockPlayers;
    }
  },
  
  getMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Fallback to mock data if API fails
      return mockMatches;
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
      const response = await fetch(`/api/matches?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  },
  
  getNews: async (): Promise<News[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockNews;
  },
  
  getHighlights: async (): Promise<Highlight[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockHighlights;
  },

  // Teams API
  createTeam: async (team: Omit<Team, 'id' | 'players'>): Promise<Team> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(team)
      });
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      return await response.json();
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
  }
};
