// Mock data for IPL 2026 website
// TODO: Replace with Cloudflare Worker API calls

import { Team, Player, Match, News, Highlight } from '@/types';

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/teams/rcb.png',
    description: 'One of the most popular IPL teams known for their aggressive batting',
    colors: { primary: '#EC1C24', secondary: '#000000' },
    players: []
  },
  {
    id: '2',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/teams/mi.png',
    description: 'The most successful IPL team with 5 championship titles',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' },
    players: []
  },
  {
    id: '3',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/teams/srh.png',
    description: 'Known for their strong bowling attack and consistent performances',
    colors: { primary: '#FF822A', secondary: '#000000' },
    players: []
  },
  {
    id: '4',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/teams/gt.png',
    description: 'The newest powerhouse team that won IPL in their debut season',
    colors: { primary: '#1B2130', secondary: '#E15454' },
    players: []
  },
  {
    id: '5',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/teams/pbks.png',
    description: 'Known for their explosive batting and never-say-die attitude',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' },
    players: []
  },
  {
    id: '6',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/teams/dc.png',
    description: 'Young and dynamic team with a perfect blend of experience and youth',
    colors: { primary: '#0078BC', secondary: '#EF1B26' },
    players: []
  },
  {
    id: '7',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/teams/lsg.png',
    description: 'The newest franchise making waves with their balanced squad',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' },
    players: []
  },
  {
    id: '8',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/teams/rr.png',
    description: 'The inaugural IPL champions known for nurturing young talent',
    colors: { primary: '#EA1A85', secondary: '#004B8D' },
    players: []
  },
  {
    id: '9',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/teams/kkr.png',
    description: 'Two-time champions with a massive fan following',
    colors: { primary: '#3A225D', secondary: '#B9975B' },
    players: []
  },
  {
    id: '10',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/teams/csk.png',
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
    photo: '/players/virat.png',
    stats: {
      matches: 237,
      runs: 7263,
      wickets: 0,
      average: 37.24,
      strikeRate: 130.02,
      economy: 0
    },
    bio: 'One of the greatest batsmen in modern cricket, known for his consistency and aggressive style of play.'
  },
  {
    id: '2',
    name: 'Rohit Sharma',
    role: 'Batsman',
    teamId: '2',
    age: 36,
    nationality: 'India',
    photo: '/players/rohit.png',
    stats: {
      matches: 243,
      runs: 6230,
      wickets: 0,
      average: 30.31,
      strikeRate: 130.39,
      economy: 0
    },
    bio: 'The most successful captain in IPL history with 5 titles. Known for his elegant batting and tactical acumen.'
  },
  {
    id: '3',
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    teamId: '2',
    age: 30,
    nationality: 'India',
    photo: '/players/bumrah.png',
    stats: {
      matches: 145,
      runs: 0,
      wickets: 170,
      average: 23.95,
      strikeRate: 0,
      economy: 7.39
    },
    bio: 'One of the best fast bowlers in world cricket, known for his unorthodox action and yorkers.'
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
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockTeams;
  },
  
  getPlayers: async (teamId?: string): Promise<Player[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return teamId ? mockPlayers.filter(p => p.teamId === teamId) : mockPlayers;
  },
  
  getMatches: async (): Promise<Match[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockMatches;
  },
  
  getNews: async (): Promise<News[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockNews;
  },
  
  getHighlights: async (): Promise<Highlight[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockHighlights;
  }
};
