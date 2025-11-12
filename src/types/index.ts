// Core type definitions for IPL 2026 website

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  teamId: string;
  age: number;
  nationality: string;
  photo: string;
  stats: {
    matches: number;
    runs: number;
    wickets: number;
    average: number;
    strikeRate: number;
    economy: number;
  };
  bio: string;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  venue: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'completed';
  result?: string;
  score?: {
    team1: {
      runs: number;
      wickets: number;
      overs: number;
    };
    team2: {
      runs: number;
      wickets: number;
      overs: number;
    };
  };
}

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  publishedAt: string;
  category: 'match' | 'team' | 'player' | 'general';
}

export interface Highlight {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  matchId: string;
  description: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface Content {
  id: string;
  type: 'banner' | 'highlight' | 'news';
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
