'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  ExternalLink,
  Flame,
  Globe,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api, mockTeams } from '@/lib/data';
import type { Team, Player, Match } from '@/types';

const WPL_PLAYERS_STORAGE_KEY = 'sportsup99_wpl_players_v2';

interface FranchiseConfig {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  logo: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  heroGlow: string;
  border: string;
  badgeBg: string;
  stadium: string;
  city: string;
  captain: string;
  coach: string;
  motto: string;
  championships: string[];
  stats: {
    played: number;
    wins: number;
    losses: number;
    winRate: string;
    highestTotal: string;
    highestOpponent: string;
    lowestDefended: string;
    biggestWin: string;
    bat1stWinRate: string;
    chaseWinRate: string;
    ppRPO: string;
    deathRPO: string;
  };
}

const FRANCHISES: Record<'rcb' | 'mi' | 'dc' | 'gg' | 'upw', FranchiseConfig> = {
  rcb: {
    id: '14',
    slug: 'rcb-w',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_modern.svg',
    primary: '#DC2626',
    secondary: '#FFB703',
    accent: '#FFD700',
    gradient: 'from-[#3f0808] via-[#1a0505] to-[#070913]',
    heroGlow: 'rgba(220, 38, 38, 0.4)',
    border: 'border-red-500/30 hover:border-red-500/60',
    badgeBg: 'bg-red-500/15 text-red-300 border-red-500/30',
    stadium: 'M. Chinnaswamy Stadium, Bengaluru',
    city: 'Bengaluru',
    captain: 'Smriti Mandhana',
    coach: 'Luke Williams',
    motto: 'Play Bold',
    championships: ['2024'],
    stats: {
      played: 36,
      wins: 21,
      losses: 15,
      winRate: '58.3%',
      highestTotal: '198/3',
      highestOpponent: 'vs GG (Chinnaswamy 2024)',
      lowestDefended: '135/6 vs MI (Eliminator)',
      biggestWin: '8 Wickets vs DC (2024 Final)',
      bat1stWinRate: '55.0%',
      chaseWinRate: '61.5%',
      ppRPO: '8.45',
      deathRPO: '10.82',
    },
  },
  mi: {
    id: '13',
    slug: 'mi-w',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_modern.svg',
    primary: '#004BA0',
    secondary: '#D1AB3E',
    accent: '#38BDF8',
    gradient: 'from-[#031d44] via-[#050e1f] to-[#070913]',
    heroGlow: 'rgba(0, 75, 160, 0.4)',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    stadium: 'Wankhede Stadium, Mumbai',
    city: 'Mumbai',
    captain: 'Harmanpreet Kaur',
    coach: 'Charlotte Edwards',
    motto: 'Duniya Hila Denge',
    championships: ['2023'],
    stats: {
      played: 37,
      wins: 23,
      losses: 14,
      winRate: '62.2%',
      highestTotal: '213/4',
      highestOpponent: 'vs GG (Brabourne 2023)',
      lowestDefended: '129 vs DC (Final 2023)',
      biggestWin: '143 Runs vs GG',
      bat1stWinRate: '66.7%',
      chaseWinRate: '59.1%',
      ppRPO: '8.62',
      deathRPO: '11.10',
    },
  },
  dc: {
    id: '11',
    slug: 'dc-w',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_modern.svg',
    primary: '#0284C7',
    secondary: '#DC2626',
    accent: '#38BDF8',
    gradient: 'from-[#082f49] via-[#09152e] to-[#070913]',
    heroGlow: 'rgba(2, 132, 199, 0.4)',
    border: 'border-sky-500/30 hover:border-sky-500/60',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    stadium: 'Arun Jaitley Stadium, Delhi',
    city: 'Delhi',
    captain: 'Meg Lanning',
    coach: 'Jonathan Batty',
    motto: 'Roar Macha',
    championships: [],
    stats: {
      played: 37,
      wins: 22,
      losses: 15,
      winRate: '59.5%',
      highestTotal: '223/2',
      highestOpponent: 'vs RCB (Brabourne 2023)',
      lowestDefended: '138 vs UPW',
      biggestWin: '60 Runs vs RCB',
      bat1stWinRate: '61.5%',
      chaseWinRate: '56.5%',
      ppRPO: '8.90',
      deathRPO: '10.20',
    },
  },
  gg: {
    id: '12',
    slug: 'gg',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_modern.svg',
    primary: '#EA580C',
    secondary: '#FFD700',
    accent: '#00A896',
    gradient: 'from-[#431407] via-[#1c0d06] to-[#070913]',
    heroGlow: 'rgba(234, 88, 12, 0.4)',
    border: 'border-orange-500/30 hover:border-orange-500/60',
    badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    stadium: 'Narendra Modi Stadium, Ahmedabad',
    city: 'Ahmedabad',
    captain: 'Ashleigh Gardner',
    coach: 'Michael Klinger',
    motto: 'Garjega Gujarat',
    championships: [],
    stats: {
      played: 34,
      wins: 13,
      losses: 21,
      winRate: '38.2%',
      highestTotal: '209/10',
      highestOpponent: 'vs DC (2024)',
      lowestDefended: '152 vs UPW',
      biggestWin: '19 Runs vs RCB',
      bat1stWinRate: '35.7%',
      chaseWinRate: '31.6%',
      ppRPO: '7.80',
      deathRPO: '9.45',
    },
  },
  upw: {
    id: '15',
    slug: 'upw',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_modern.svg',
    primary: '#9333EA',
    secondary: '#FFD600',
    accent: '#EAB308',
    gradient: 'from-[#3b0764] via-[#16062a] to-[#070913]',
    heroGlow: 'rgba(147, 51, 234, 0.4)',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    stadium: 'BRSABV Ekana Cricket Stadium, Lucknow',
    city: 'Lucknow',
    captain: 'Alyssa Healy',
    coach: 'Jon Lewis',
    motto: 'Gazab Andaz',
    championships: [],
    stats: {
      played: 33,
      wins: 11,
      losses: 21,
      winRate: '34.8%',
      highestTotal: '225/5 (WPL Record)',
      highestOpponent: 'vs RCB (2023)',
      lowestDefended: '138 vs RCB',
      biggestWin: '33 Runs vs GG',
      bat1stWinRate: '38.5%',
      chaseWinRate: '35.0%',
      ppRPO: '7.95',
      deathRPO: '10.15',
    },
  },
};

function getFranchiseKey(str?: string): 'rcb' | 'mi' | 'dc' | 'gg' | 'upw' {
  const s = String(str || '').toLowerCase().trim();
  if (s.includes('rcb') || s.includes('bangalore') || s.includes('bengaluru') || s === '14') return 'rcb';
  if (s.includes('mi') || s.includes('mumbai') || s === '13') return 'mi';
  if (s.includes('dc') || s.includes('delhi') || s === '11') return 'dc';
  if (s.includes('gg') || s.includes('gujarat') || s === '12') return 'gg';
  if (s.includes('upw') || s.includes('up') || s.includes('warrior') || s === '15') return 'upw';
  return 'rcb';
}

function isPlayerInWplTeam(p: any, teamParamId: string, teamObj?: any): boolean {
  const targetKey = getFranchiseKey(teamParamId) || (teamObj ? getFranchiseKey(teamObj.id || teamObj.shortName || teamObj.name) : 'rcb');

  const pId = String(p.id || '').toLowerCase();
  const pTeamId = String(p.teamId || '').toLowerCase();
  const pTeam = String(p.team || '').toLowerCase();

  // Match by id prefix (e.g. wpl_rcb_..., wpl-rcb-...)
  if (pId.startsWith(`wpl_${targetKey}`) || pId.startsWith(`wpl-${targetKey}`)) return true;
  if (targetKey === 'upw' && (pId.startsWith('wpl_up') || pId.startsWith('wpl-up'))) return true;

  // Match by canonical franchise ID
  const franchiseIdMap: Record<string, string> = {
    rcb: '14',
    mi: '13',
    dc: '11',
    gg: '12',
    upw: '15'
  };
  if (pTeamId === franchiseIdMap[targetKey]) return true;

  // Match by team name
  if (targetKey === 'rcb' && (pTeam.includes('rcb') || pTeam.includes('bengaluru') || pTeam.includes('bangalore'))) return true;
  if (targetKey === 'mi' && (pTeam.includes('mumbai') || pTeam.includes('mi'))) return true;
  if (targetKey === 'dc' && (pTeam.includes('delhi') || pTeam.includes('capitals') || pTeam.includes('dc'))) return true;
  if (targetKey === 'gg' && (pTeam.includes('gujarat') || pTeam.includes('giants') || pTeam.includes('gg'))) return true;
  if (targetKey === 'upw' && (pTeam.includes('up') || pTeam.includes('warrior'))) return true;

  return false;
}

function getPlayerDisplayStats(player: any) {
  const s = player?.stats || {};
  const cs = player?.careerStats || {};
  const bat = (cs && typeof cs.batting === 'object') ? cs.batting : {};
  const bowl = (cs && typeof cs.bowling === 'object') ? cs.bowling : {};

  const wplBat = bat['WPL'] || bat['wpl'] || bat['T20'] || bat['T20I'] || {};
  const wplBowl = bowl['WPL'] || bowl['wpl'] || bowl['T20'] || bowl['T20I'] || {};

  const rawRuns = wplBat.Runs ?? wplBat.runs ?? wplBat.R ?? s.runs ?? 0;
  const rawWkts = wplBowl.Wkts ?? wplBowl.wkts ?? wplBowl.W ?? s.wickets ?? 0;
  const rawMatches = wplBat.Mat ?? wplBat.matches ?? wplBat.M ?? wplBowl.Mat ?? s.matches ?? 0;

  const runs = typeof rawRuns === 'object' ? 0 : rawRuns;
  const wickets = typeof rawWkts === 'object' ? 0 : rawWkts;
  const matches = typeof rawMatches === 'object' ? 0 : rawMatches;

  return { runs, wickets, matches };
}

function getTeamDisplayShort(team: any, fallback?: string): string {
  if (fallback && typeof fallback === 'string') return fallback;
  if (!team) return 'TBD';
  if (typeof team === 'string') return team;
  if (typeof team === 'object') {
    return team.shortName || team.name || String(team.id || 'TBD');
  }
  return String(team);
}

function getTeamDisplayName(team: any, fallback?: string): string {
  if (fallback && typeof fallback === 'string') return fallback;
  if (!team) return 'TBD';
  if (typeof team === 'string') return team;
  if (typeof team === 'object') {
    return team.name || team.shortName || String(team.id || 'TBD');
  }
  return String(team);
}

function getTeamLogoUrl(team: any, fallbackName?: string): string {
  if (typeof team === 'object' && team?.logo && typeof team.logo === 'string') {
    if (
      /^\/logos\/wpl_(rcb|mi|dc|gg|upw)_logo_(modern|animated)\.svg$/.test(team.logo) ||
      team.logo === '/logos/tba_logo.svg' ||
      team.logo.startsWith('http') ||
      team.logo.startsWith('data:')
    ) {
      return team.logo;
    }
  }
  const combined = `${typeof team === 'object' ? `${team?.shortName || ''} ${team?.name || ''} ${team?.id || ''}` : String(team || '')} ${fallbackName || ''}`.toLowerCase();
  if (combined.includes('rcb') || combined.includes('royal') || combined.includes('bengaluru') || combined.includes('bangalore')) {
    return FRANCHISES.rcb.logo;
  }
  if (combined.includes('mi') || combined.includes('mumbai')) {
    return FRANCHISES.mi.logo;
  }
  if (combined.includes('dc') || combined.includes('delhi')) {
    return FRANCHISES.dc.logo;
  }
  if (combined.includes('gg') || combined.includes('gujarat')) {
    return FRANCHISES.gg.logo;
  }
  if (combined.includes('upw') || combined.includes('up ') || combined.includes('warrior')) {
    return FRANCHISES.upw.logo;
  }
  return '/logos/tba_logo.svg';
}

function safeCell(val: any, fallback: string = '—'): string | number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'object') return fallback;
  return val;
}

function getRoleMeta(role?: string) {
  const r = (role || '').toLowerCase();
  if (r.includes('wicket') || r.includes('keeper') || r.includes('wk')) {
    return {
      label: 'Wicket-Keeper',
      short: 'WK',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      accentText: 'text-emerald-400',
    };
  }
  if (r.includes('all-rounder') || r.includes('allrounder') || r.includes('all rounder')) {
    return {
      label: 'All-Rounder',
      short: 'ALL-R',
      badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      glow: 'shadow-purple-500/20',
      accentText: 'text-purple-400',
    };
  }
  if (r.includes('bowl')) {
    return {
      label: 'Bowler',
      short: 'BOWL',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glow: 'shadow-cyan-500/20',
      accentText: 'text-cyan-400',
    };
  }
  return {
    label: 'Batter',
    short: 'BAT',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glow: 'shadow-amber-500/20',
    accentText: 'text-amber-400',
  };
}

function getInitials(name: string): string {
  if (!name) return 'WPL';
  const clean = name.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function fetchWithTimeout<T>(promise: Promise<T>, ms = 2500, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export default function EnhancedWPLTeamPage({ teamId }: { teamId: string }) {
  const franchiseKey = useMemo(() => getFranchiseKey(teamId), [teamId]);
  const config = FRANCHISES[franchiseKey];

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures' | 'records' | 'about'>('squad');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'batter' | 'all-rounder' | 'wicketkeeper' | 'bowler'>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeHeroPlayer, setActiveHeroPlayer] = useState<any>(null);

  // Load team and players data with localStorage caching
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Read cached players from localStorage (instant cache from Admin WPL page)
        let cachedPlayers: Player[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(WPL_PLAYERS_STORAGE_KEY) || localStorage.getItem('sportsup99_wpl_players_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) cachedPlayers = parsed;
            }
          } catch (e) {}
        }

        // 2. Fetch fresh teams and players
        const [teamsData, apiPlayersData, matchesData] = await Promise.all([
          fetchWithTimeout(api.getTeams('wpl'), 2000, []),
          fetchWithTimeout(api.getPlayers(undefined, 'wpl'), 2000, []),
          fetchWithTimeout(api.getMatches('wpl'), 2000, [])
        ]);

        if (!isMounted) return;

        // Locate team object
        let found = (teamsData || []).find((t: Team) => getFranchiseKey(t.id || t.shortName || t.name) === franchiseKey);
        if (!found) {
          found = (mockTeams || []).find((t: Team) => t.league === 'wpl' && getFranchiseKey(t.id || t.shortName || t.name) === franchiseKey) || null;
        }

        setTeam(found || ({
          id: config.id,
          name: config.name,
          shortName: config.shortName,
          league: 'wpl',
          logo: config.logo,
          description: config.motto,
          venue: config.stadium,
          players: [],
          trophies: config.championships.map(year => ({ year: Number(year), name: 'WPL Champions' })) as any
        } as unknown as Team));

        // 3. Merge API players with cached players (preserving richer careerStats)
        const mergedMap = new Map<string, any>();
        (apiPlayersData || []).forEach((p: any) => {
          const k = String(p.id || p.name || '').trim().toLowerCase();
          mergedMap.set(k, p);
        });

        cachedPlayers.forEach((lp: any) => {
          const k = String(lp.id || lp.name || '').trim().toLowerCase();
          const existing = mergedMap.get(k);
          if (!existing) {
            mergedMap.set(k, lp);
          } else {
            const localBatKeys = Object.keys(lp.careerStats?.batting || {});
            const localBowlKeys = Object.keys(lp.careerStats?.bowling || {});
            const existingBatKeys = Object.keys(existing.careerStats?.batting || {});
            const existingBowlKeys = Object.keys(existing.careerStats?.bowling || {});
            const localTotal = localBatKeys.length + localBowlKeys.length;
            const existingTotal = existingBatKeys.length + existingBowlKeys.length;

            const localTs = lp.updatedAt ? Date.parse(lp.updatedAt) : 0;
            const existingTs = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
            const localIsStrictlyNewer = Boolean(localTs && localTs > existingTs);

            const careerStats = (localIsStrictlyNewer && localTotal > 0) || (existingTotal === 0 && localTotal > 0)
              ? lp.careerStats
              : (existingTotal > 0 ? existing.careerStats : (lp.careerStats || { batting: {}, bowling: {} }));

            const base = localIsStrictlyNewer ? existing : lp;
            const head = localIsStrictlyNewer ? lp : existing;

            mergedMap.set(k, {
              ...base,
              ...head,
              careerStats,
              cricbuzzUrl: head.cricbuzzUrl || base.cricbuzzUrl || '',
              cricbuzzId: head.cricbuzzId || base.cricbuzzId || '',
              stats: {
                ...(base.stats || {}),
                ...(head.stats || {})
              }
            });
          }
        });

        const allPlayers = Array.from(mergedMap.values());
        const squad = allPlayers.filter((p: Player) => isPlayerInWplTeam(p, teamId, found));
        setPlayers(squad);

        // Filter relevant matches
        const teamMatches = (matchesData || []).filter((m: Match) => {
          const t1 = typeof m.team1 === 'object' ? String((m.team1 as any)?.name || (m.team1 as any)?.shortName || '') : String(m.team1 || '');
          const t2 = typeof m.team2 === 'object' ? String((m.team2 as any)?.name || (m.team2 as any)?.shortName || '') : String(m.team2 || '');
          return isPlayerInWplTeam({ team: t1 }, teamId) || isPlayerInWplTeam({ team: t2 }, teamId);
        });
        setMatches(teamMatches);

      } catch (err) {
        console.error('Failed to load WPL team data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // Listen for live updates from Admin WPL operations
    const handleSync = () => loadData();
    window.addEventListener('admin-data-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('admin-data-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [teamId, franchiseKey, config]);

  // Set default hero spotlight player to team captain
  useEffect(() => {
    if (!players || players.length === 0) return;

    const currentHeroValid = activeHeroPlayer && players.some((p: any) =>
      String(p.id) === String(activeHeroPlayer.id) || (p.name && activeHeroPlayer.name && p.name.trim().toLowerCase() === activeHeroPlayer.name.trim().toLowerCase())
    );

    if (currentHeroValid) {
      const refreshed = players.find((p: any) =>
        String(p.id) === String(activeHeroPlayer.id) || (p.name && activeHeroPlayer.name && p.name.trim().toLowerCase() === activeHeroPlayer.name.trim().toLowerCase())
      );
      if (refreshed) setActiveHeroPlayer(refreshed);
      return;
    }

    // Default to Captain
    const captain = players.find((p: any) => p.isCaptain);
    if (captain) {
      setActiveHeroPlayer(captain);
      return;
    }

    // Known franchise captain name fallback
    const preferred = players.find((p: any) => p.name?.toLowerCase().includes(config.captain.toLowerCase()));
    setActiveHeroPlayer(preferred || players[0]);
  }, [players, activeHeroPlayer, config]);

  // Filtered squad list
  const filteredSquad = useMemo(() => {
    return players.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q || (p.name || '').toLowerCase().includes(q);
      const role = (p.role || '').toLowerCase();
      let roleMatch = true;
      if (selectedRole === 'batter') roleMatch = role.includes('bat') && !role.includes('all');
      else if (selectedRole === 'bowler') roleMatch = role.includes('bowl') && !role.includes('all');
      else if (selectedRole === 'all-rounder') roleMatch = role.includes('all') || role.includes('rounder');
      else if (selectedRole === 'wicketkeeper') roleMatch = role.includes('keeper') || role.includes('wk');
      return nameMatch && roleMatch;
    });
  }, [players, searchQuery, selectedRole]);

  // Synthetic matches for display if API matches are empty
  const displayMatches = useMemo(() => {
    if (matches && matches.length > 0) return matches;

    // Generated authentic schedule for Season 2027
    const opponents = Object.values(FRANCHISES).filter(f => f.slug !== config.slug);
    return opponents.map((opp, idx) => ({
      id: `wpl-2027-m${idx + 1}`,
      name: `Match ${idx + 1}: ${config.shortName} vs ${opp.shortName}`,
      team1: {
        id: config.id,
        name: config.name,
        shortName: config.shortName,
        logo: config.logo
      },
      team2: {
        id: opp.id,
        name: opp.name,
        shortName: opp.shortName,
        logo: opp.logo
      },
      team1Short: config.shortName,
      team2Short: opp.shortName,
      venue: idx % 2 === 0 ? config.stadium : opp.stadium,
      date: `2027-01-${10 + idx * 4}`,
      time: '19:30 IST',
      status: 'Upcoming',
      league: 'wpl'
    }));
  }, [matches, config]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-8 w-64 bg-white/10 rounded-xl" />
          <div className="h-72 rounded-3xl bg-white/[0.04] border border-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/[0.03] border border-white/5" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white relative overflow-hidden">
      <Navbar />

      <main className="flex-1 pb-24 relative z-10">

        {/* =====================================================================
            1. FRANCHISE BRAND HERO BANNER
           ===================================================================== */}
        <section className="relative overflow-hidden pt-8 pb-12 border-b border-white/10 bg-gradient-to-b from-[#0b0e1b] via-[#070914] to-[#060813]">
          {/* Ambient Team Glow Halo */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-40 mix-blend-screen"
            style={{
              background: `radial-gradient(ellipse at center, ${config.primary} 0%, ${config.secondary} 40%, transparent 70%)`
            }}
          />

          {/* Subdued Hex Grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/wpl" className="hover:text-white transition-colors">WPL 2027</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/wpl/teams" className="hover:text-white transition-colors">Franchises</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold">{config.name}</span>
            </div>

            {/* Main Franchise Header Card */}
            <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                
                {/* 3D Glass Crest Pedestal */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#0e1222] border-2 border-white/15 p-4 flex items-center justify-center shadow-2xl relative z-10 backdrop-blur-xl group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={config.logo}
                      alt={`${config.name} Crest`}
                      width={120}
                      height={120}
                      className="object-contain w-full h-full drop-shadow-2xl"
                      priority
                    />
                  </div>
                  {/* Under-crest ambient beam */}
                  <div
                    className="absolute -inset-2 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})` }}
                  />
                </div>

                {/* Identity & Honors */}
                <div className="space-y-3 max-w-xl">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${config.badgeBg}`}>
                      {config.shortName}
                    </span>
                    {config.championships.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{config.championships.join(', ')} Champions</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                        <span>Championship Contender</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                      Season 5 (2027)
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    {config.name}
                  </h1>

                  <p className="text-sm font-semibold text-slate-300 italic">
                    "{config.motto}"
                  </p>
                </div>
              </div>

              {/* Quick Vitals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Captain</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate">{config.captain}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Head Coach</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate">{config.coach}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Home Stadium</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate" title={config.stadium}>
                    {config.city}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Squad Count</span>
                  <span className="text-sm font-black text-emerald-400 block mt-0.5">{players.length} Athletes</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
            2. STICKY SUB-NAVIGATION & SQUAD CONTROLS
           ===================================================================== */}
        <section className="sticky top-16 z-30 bg-[#090d1c]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* 4 Tabs with Motion Indicator */}
            <div className="inline-flex p-1 rounded-2xl bg-[#0f1426] border border-white/10 w-full md:w-auto">
              {[
                { id: 'squad', label: 'Squad & Athletes', icon: Users, badge: `${players.length}` },
                { id: 'fixtures', label: 'Matches & Fixtures', icon: Calendar },
                { id: 'records', label: 'Franchise Records', icon: BarChart3 },
                { id: 'about', label: 'Honors & Story', icon: Trophy },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl bg-pink-600 shadow-lg shadow-pink-600/30"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search when on Squad tab */}
            {activeTab === 'squad' && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>


        {/* =====================================================================
            3. TAB CONTENT
           ===================================================================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* TAB 1: SQUAD & ATHLETES */}
          {activeTab === 'squad' && (
            <div className="space-y-10">

              {/* --- FEATURED SPOTLIGHT HERO CARD --- */}
              {activeHeroPlayer && (() => {
                const hero = activeHeroPlayer;
                const stats = getPlayerDisplayStats(hero);
                const roleMeta = getRoleMeta(hero.role);
                const initials = getInitials(hero.name);
                const battingHand = (hero.battingStyle || '').toLowerCase().includes('left') ? 'Left Hand' : 'Right Hand';

                return (
                  <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#11162a] via-[#0c0f1e] to-[#070914] p-6 sm:p-8 shadow-2xl">
                    {/* Ambient Glow */}
                    <div
                      className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-30"
                      style={{ background: `radial-gradient(circle, ${config.primary}, transparent)` }}
                    />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                      {/* Left: Player Info */}
                      <div className="space-y-4 text-center lg:text-left flex-1">
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
                          </span>
                          {hero.isCaptain && (
                            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                              ★ Team Captain
                            </span>
                          )}
                          <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${roleMeta.badgeBg}`}>
                            {roleMeta.label}
                          </span>
                          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300">
                            {battingHand} Bat
                          </span>
                        </div>

                        <div>
                          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            {hero.name}
                          </h2>
                          <p className="text-sm font-semibold text-slate-300 mt-1">
                            {hero.nationality || 'India'} • {hero.bowlingStyle || 'Specialist Athlete'}
                            {hero.age ? ` • ${hero.age} yrs` : ''}
                          </p>
                        </div>

                        {/* Interactive Dossier CTA */}
                        <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPlayer(hero)}
                            className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-pink-600/30 hover:scale-105 active:scale-95 flex items-center gap-2"
                          >
                            <span>Open Full Cricbuzz Dossier</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-slate-400">
                            Click any roster member below to switch spotlight or view career tables
                          </span>
                        </div>
                      </div>

                      {/* Right: Pedestal & 3 Big Stat Boxes */}
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/20 bg-gradient-to-b from-white/10 to-black/60 flex items-center justify-center shadow-xl backdrop-blur-md">
                            {hero.image ? (
                              <img src={hero.image} alt={hero.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <div className="text-center">
                                <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                                  {initials}
                                </span>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  {roleMeta.short}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3 Core Highlight Counters */}
                        <div className="grid grid-cols-3 gap-3 min-w-[270px]">
                          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Runs</span>
                            <span className="text-2xl font-black text-white mt-1 block">{stats.runs}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">WPL Career</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center">
                            <span className={`text-[10px] font-black ${roleMeta.accentText} uppercase tracking-wider block`}>Wickets</span>
                            <span className="text-2xl font-black text-white mt-1 block">{stats.wickets}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">WPL Career</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center">
                            <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider block">Matches</span>
                            <span className="text-2xl font-black text-white mt-1 block">{stats.matches}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Caps</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* --- ROLE FILTERS & DUGOUT SQUAD GRID --- */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                  {/* Filter chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'all', label: 'All Squad', count: players.length },
                      { id: 'batter', label: 'Batters' },
                      { id: 'all-rounder', label: 'All-Rounders' },
                      { id: 'wicketkeeper', label: 'WK-Keepers' },
                      { id: 'bowler', label: 'Bowlers' },
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          selectedRole === role.id
                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 scale-105'
                            : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/5'
                        }`}
                      >
                        {role.label} {role.count ? `(${role.count})` : ''}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Official Squad: <span className="text-white font-black">{filteredSquad.length}</span> Athletes
                  </div>
                </div>

                {/* SQUAD ATHLETE CARDS (ALL 10 VISIBLE, CLEAN GRID WITH PROPER SPACING) */}
                {filteredSquad.length === 0 ? (
                  <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/10">
                    <p className="text-sm font-bold text-slate-300">No athletes match the current search or filter</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedRole('all'); }}
                      className="mt-3 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                    {filteredSquad.map((player, idx) => {
                      const stats = getPlayerDisplayStats(player);
                      const roleMeta = getRoleMeta(player.role);
                      const isHero = activeHeroPlayer?.name === player.name;
                      const initials = getInitials(player.name);

                      return (
                        <motion.div
                          key={player.id || player.name}
                          whileHover={{ y: -5 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => {
                            setActiveHeroPlayer(player);
                            setSelectedPlayer(player);
                          }}
                          className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-200 backdrop-blur-xl flex flex-col justify-between ${
                            isHero
                              ? 'ring-2 ring-pink-500 border-pink-500/90 bg-[#13182e] shadow-xl shadow-pink-500/15'
                              : 'border-white/10 bg-[#0d101e]/90 hover:border-white/25 hover:bg-[#12162a]'
                          }`}
                        >
                          <div>
                            {/* Card Top Meta */}
                            <div className="flex items-center justify-between gap-2 mb-3.5">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${roleMeta.badgeBg}`}>
                                {roleMeta.label}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {player.isCaptain && (
                                  <span className="text-[10px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                                    ★ Captain
                                  </span>
                                )}
                                <span className="text-xs font-mono text-slate-500 font-bold ml-1">
                                  #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                </span>
                              </div>
                            </div>

                            {/* Player Core Identity */}
                            <div className="flex items-center gap-3.5 mb-3.5">
                              {/* Avatar */}
                              <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-black text-sm border ${
                                isHero ? 'border-pink-500 bg-pink-500/20 text-white' : 'border-white/15 bg-black/40 text-slate-200'
                              } shadow-inner overflow-hidden`}>
                                {player.image ? (
                                  <img src={player.image} alt={player.name} className="w-full h-full object-cover object-top rounded-xl" />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="font-extrabold text-sm text-white truncate group-hover:text-pink-300 transition-colors">
                                  {player.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {player.battingStyle || 'Right Hand'} • {player.bowlingStyle || 'Specialist'}
                                </p>
                              </div>
                            </div>

                            {/* Key Stats Bar */}
                            <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-black/40 border border-white/5 text-center text-xs">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Runs</span>
                                <span className="font-black text-white">{stats.runs}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Wkts</span>
                                <span className={`font-black ${roleMeta.accentText}`}>{stats.wickets}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Caps</span>
                                <span className="font-black text-slate-300">{stats.matches}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Auction Fee & View Button */}
                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-semibold truncate mr-2">
                              {player.auction?.fee && (typeof player.auction.fee === 'string' || typeof player.auction.fee === 'number') ? (
                                <>Fee: <strong className="text-emerald-400">{String(player.auction.fee)}</strong></>
                              ) : (
                                <>Nationality: <strong className="text-slate-200">{typeof player.nationality === 'string' ? player.nationality : 'India'}</strong></>
                              )}
                            </span>
                            <span className="text-pink-400 font-bold group-hover:text-pink-300 group-hover:underline flex items-center gap-0.5 shrink-0">
                              <span>Dossier</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FIXTURES & MATCHES */}
          {activeTab === 'fixtures' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-[#0e1224] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">Season 5 Match Schedule (Jan 9 – Feb 5, 2027)</h3>
                  <p className="text-xs text-slate-400 mt-1">Official league fixtures and head-to-head franchise clashes.</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-pink-600/30 text-pink-300 text-xs font-black uppercase tracking-wider border border-pink-500/40">
                  {displayMatches.length} Fixtures Scheduled
                </span>
              </div>

              <div className="grid gap-4">
                {displayMatches.map((m: any, idx) => {
                  const t1Short = getTeamDisplayShort(m.team1, m.team1Short || m.homeShort);
                  const t2Short = getTeamDisplayShort(m.team2, m.team2Short || m.awayShort);
                  const t1Name = getTeamDisplayName(m.team1, m.homeTeam);
                  const t2Name = getTeamDisplayName(m.team2, m.awayTeam);
                  const t1Logo = getTeamLogoUrl(m.team1, `${t1Short} ${t1Name}`);
                  const t2Logo = getTeamLogoUrl(m.team2, `${t2Short} ${t2Name}`);
                  const matchVenue = typeof m.venue === 'string' && m.venue ? m.venue : config.stadium;
                  const matchDate = typeof m.displayDate === 'string' && m.displayDate ? m.displayDate : typeof m.date === 'string' && m.date ? m.date : 'TBA 2027';
                  const matchName = typeof m.name === 'string' && m.name ? m.name : `${t1Name} vs ${t2Name}`;

                  return (
                    <div
                      key={m.id || idx}
                      className="p-5 rounded-2xl bg-[#0c1020] border border-white/10 hover:border-pink-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-pink-400 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{matchVenue}</span>
                          <span>•</span>
                          <span>{matchDate}</span>
                        </div>
                        <h4 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-2.5">
                          <img
                            src={t1Logo}
                            alt={t1Short}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logos/tba_logo.svg';
                            }}
                            className="w-6 h-6 object-contain inline-block shrink-0"
                          />
                          <span>{t1Short}</span>
                          <span className="text-pink-400 text-xs font-bold px-2 py-0.5 rounded bg-pink-500/15 border border-pink-500/30">VS</span>
                          <span>{t2Short}</span>
                          <img
                            src={t2Logo}
                            alt={t2Short}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logos/tba_logo.svg';
                            }}
                            className="w-6 h-6 object-contain inline-block shrink-0"
                          />
                        </h4>
                        <p className="text-xs text-slate-400">
                          {matchName} • {typeof m.time === 'string' ? m.time : '19:30 IST'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                          {typeof m.status === 'string' ? (m.status === 'completed' ? 'Final' : m.status === 'live' ? 'LIVE' : 'Scheduled') : 'Scheduled'}
                        </span>
                        <Link
                          href={`/wpl/matches/${m.id || ''}`}
                          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md"
                        >
                          Match Center
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FRANCHISE RECORDS & STATS */}
          {activeTab === 'records' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* Win/Loss Big Stat Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#0d1122] border border-white/10 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Matches</span>
                  <span className="text-3xl font-black text-white mt-1 block">{config.stats.played}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">WPL Archive</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0d1122] border border-white/10 text-center">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Victories</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block">{config.stats.wins}</span>
                  <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Wins</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0d1122] border border-white/10 text-center">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Defeats</span>
                  <span className="text-3xl font-black text-rose-400 mt-1 block">{config.stats.losses}</span>
                  <span className="text-[11px] text-rose-500/80 mt-0.5 block">Losses</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0d1122] border border-white/10 text-center">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Win Rate</span>
                  <span className="text-3xl font-black text-amber-400 mt-1 block">{config.stats.winRate}</span>
                  <span className="text-[11px] text-amber-500/80 mt-0.5 block">Success Ratio</span>
                </div>
              </div>

              {/* Franchise Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#0d1122] border border-white/10 space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Innings Highs & Defenses</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-semibold">Highest Team Total</span>
                        <span className="text-slate-300 text-[11px]">{config.stats.highestOpponent}</span>
                      </div>
                      <span className="text-lg font-black text-amber-400">{config.stats.highestTotal}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-semibold">Lowest Total Defended</span>
                        <span className="text-slate-300 text-[11px]">Championship Clutches</span>
                      </div>
                      <span className="text-lg font-black text-emerald-400">{config.stats.lowestDefended}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-semibold">Biggest Margin Win</span>
                        <span className="text-slate-300 text-[11px]">High-Impact Statement</span>
                      </div>
                      <span className="text-sm font-black text-cyan-300">{config.stats.biggestWin}</span>
                    </div>
                  </div>
                </div>

                {/* Tactical Pace & Phase Ratios */}
                <div className="p-6 rounded-3xl bg-[#0d1122] border border-white/10 space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>Toss & Phase Dynamics</span>
                  </h4>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1.5">
                        <span className="text-slate-300">Batting 1st Win Rate</span>
                        <span className="text-emerald-400">{config.stats.bat1stWinRate}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: config.stats.bat1stWinRate }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1.5">
                        <span className="text-slate-300">Chasing Win Rate</span>
                        <span className="text-pink-400">{config.stats.chaseWinRate}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: config.stats.chaseWinRate }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">PP Run Rate</span>
                        <span className="text-base font-black text-white mt-0.5 block">{config.stats.ppRPO} RPO</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Death Economy</span>
                        <span className="text-base font-black text-white mt-0.5 block">{config.stats.deathRPO} RPO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HONORS & STORY */}
          {activeTab === 'about' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Trophy Showcase */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/30 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Championship Cabinet</h3>
                  <p className="text-xs text-slate-400 mt-1">Official titles lifted in Women's Premier League history.</p>
                </div>

                {config.championships.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    {config.championships.map((year) => (
                      <div
                        key={year}
                        className="p-5 rounded-2xl bg-[#0a0f1d] border-2 border-amber-400/50 shadow-2xl flex items-center gap-4 min-w-[240px]"
                      >
                        <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
                        <div className="text-left">
                          <span className="text-xs font-bold uppercase text-amber-400 block">WPL Champions</span>
                          <span className="text-xl font-black text-white">{year} Season</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 pt-2">
                    Franchise pursuing its maiden WPL title in Season 5 (2027).
                  </p>
                )}
              </div>

              {/* Franchise Story & Profile */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1122] border border-white/10 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <h4 className="text-base font-black text-white">About {config.name}</h4>
                <p>
                  {config.name} is one of the foundational franchises in the Women's Premier League, representing the city of {config.city}.
                  Playing out of {config.stadium}, the franchise combines world-class international superstars and grassroots Indian prodigies.
                </p>
                <p>
                  Led by captain <strong>{config.captain}</strong> and head coach <strong>{config.coach}</strong>, the team embodies their motto "{config.motto}".
                  Their official roster of {players.length} athletes represents one of the most competitive lineups in modern T20 cricket.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>


      {/* =====================================================================
          4. PUBLIC PLAYER DETAIL MODAL (CRICBUZZ STANDARD WITH FULL MULTI-FORMAT CAREER STATS)
         ===================================================================== */}
      <AnimatePresence>
        {selectedPlayer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090d1a] border border-white/15 p-6 sm:p-8 shadow-2xl text-white space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 via-black/70 to-black/95 border border-white/20 shrink-0 flex flex-col items-center justify-center shadow-xl">
                  {/* Glowing Ambient */}
                  <div
                    className="absolute inset-0 opacity-40 blur-lg pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${config.primary}, transparent)` }}
                  />

                  {/* Jersey Number or Initials */}
                  <span className="relative z-10 text-3xl font-black tracking-tight text-white drop-shadow-md">
                    {selectedPlayer.jerseyNumber && selectedPlayer.jerseyNumber !== 'N/A' ? (`#${selectedPlayer.jerseyNumber}`) : getInitials(selectedPlayer.name)}
                  </span>
                  <span className="relative z-10 text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-0.5">
                    {selectedPlayer.role ? selectedPlayer.role.slice(0, 10) : 'Player'}
                  </span>
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl font-black text-white">{selectedPlayer.name}</h3>
                    {selectedPlayer.isCaptain && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                        ★ Captain
                      </span>
                    )}
                    {selectedPlayer.cricbuzzUrl && (
                      <a
                        href={selectedPlayer.cricbuzzUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors"
                      >
                        <span>Cricbuzz Dossier</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {(() => {
                      const meta = getRoleMeta(selectedPlayer.role);
                      return (
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ring-1 ${meta.badgeBg}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                    {selectedPlayer.nationality && (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-semibold text-gray-300">
                        {selectedPlayer.nationality}
                      </span>
                    )}
                    {selectedPlayer.dateOfBirth && (
                      <span className="text-xs text-slate-400">
                        DOB: {selectedPlayer.dateOfBirth} {selectedPlayer.age ? `(${selectedPlayer.age} yrs)` : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 pt-1">
                    Batting: <span className="text-white font-medium">{selectedPlayer.battingStyle || 'Right Handed'}</span> • Bowling: <span className="text-white font-medium">{selectedPlayer.bowlingStyle || 'None'}</span>
                  </p>
                </div>
              </div>

              {/* BATTING CAREER SUMMARY (MULTI-FORMAT) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400">
                      Batting Career Summary
                    </h4>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">
                    Auto-extracted from Cricbuzz Dossier
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-white/5 text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Format</th>
                        <th className="py-2.5 px-2">Mat</th>
                        <th className="py-2.5 px-2">Inn</th>
                        <th className="py-2.5 px-2">NO</th>
                        <th className="py-2.5 px-2">Runs</th>
                        <th className="py-2.5 px-2">HS</th>
                        <th className="py-2.5 px-2">Avg</th>
                        <th className="py-2.5 px-2">BF</th>
                        <th className="py-2.5 px-2">SR</th>
                        <th className="py-2.5 px-2">100</th>
                        <th className="py-2.5 px-2">50</th>
                        <th className="py-2.5 px-2">4s</th>
                        <th className="py-2.5 px-2">6s</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                      {(() => {
                        const bat = selectedPlayer.careerStats?.batting || {};
                        const formats = ['Test', 'ODI', 'T20', 'WPL'];
                        const renderedRows = formats.map((fmt) => {
                          let row = bat[fmt] || bat[fmt.toLowerCase()] || bat[fmt.toUpperCase()] ||
                                    (fmt === 'T20' ? (bat['T20I'] || bat['t20i'] || bat['wt20'] || bat['WT20'] || bat['wt20i'] || bat['WT20I']) : undefined) ||
                                    (fmt === 'T20I' ? (bat['T20'] || bat['t20'] || bat['wt20'] || bat['WT20']) : undefined) ||
                                    (fmt === 'Test' ? (bat['wtest'] || bat['WTEST']) : undefined) ||
                                    (fmt === 'ODI' ? (bat['wodi'] || bat['WODI']) : undefined) ||
                                    (fmt === 'WPL' ? (bat['wpl'] || bat['IPL'] || bat['ipl']) : undefined);

                          if (!row && fmt === 'WPL' && selectedPlayer.stats) {
                            const s = selectedPlayer.stats;
                            const m = s.matches || 0;
                            const inn = s.battingInnings || m || 0;
                            const no = s.notOuts || 0;
                            const runs = s.runs || 0;
                            const bf = s.ballsFaced || 0;
                            const hs = s.highest || 0;
                            const hsDisplay = s.highestNotOut ? `${hs}*` : `${hs}`;
                            const dismissals = Math.max(0, inn - no);
                            const avg = s.average ? Number(s.average).toFixed(2) : (dismissals > 0 && runs > 0 ? (runs / dismissals).toFixed(2) : (runs > 0 ? Number(runs).toFixed(2) : '—'));
                            const sr = s.strikeRate ? Number(s.strikeRate).toFixed(2) : (bf > 0 && runs > 0 ? ((runs * 100) / bf).toFixed(2) : '—');
                            row = {
                              Mat: m,
                              Inn: inn,
                              NO: no,
                              Runs: runs,
                              HS: hsDisplay,
                              Avg: avg,
                              BF: bf || '—',
                              SR: sr || '—',
                              '100': s.hundreds ?? 0,
                              '50': s.fifties ?? 0,
                              '4s': s.fours ?? 0,
                              '6s': s.sixes ?? 0
                            };
                          }

                          if (!row || (row.Mat === undefined && row.Runs === undefined && row.M === undefined)) return null;

                          return (
                            <tr key={fmt} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-2.5 px-3 text-left font-black text-white">{fmt}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Mat ?? row.M ?? row.matches ?? row.Matches)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Inn ?? row.inn ?? row.Innings ?? row.innings)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.NO ?? row.no ?? row.NotOut ?? row['not out'])}</td>
                              <td className="py-2.5 px-2 font-black text-emerald-400">{safeCell(row.Runs ?? row.runs ?? row.R ?? row.r)}</td>
                              <td className="py-2.5 px-2 font-bold">{safeCell(row.HS ?? row.hs ?? row.Highest ?? row.highest)}</td>
                              <td className="py-2.5 px-2 font-bold text-cyan-400">{safeCell(row.Avg ?? row.avg ?? row.Average ?? row.average)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.BF ?? row.bf ?? row.Balls ?? row.balls)}</td>
                              <td className="py-2.5 px-2 font-bold text-amber-400">{safeCell(row.SR ?? row.sr ?? row.strikeRate ?? row['strike rate'])}</td>
                              <td className="py-2.5 px-2">{safeCell(row['100'] ?? row['100s'] ?? row.hundreds, '0')}</td>
                              <td className="py-2.5 px-2">{safeCell(row['50'] ?? row['50s'] ?? row.fifties, '0')}</td>
                              <td className="py-2.5 px-2">{safeCell(row['4s'] ?? row.fours, '0')}</td>
                              <td className="py-2.5 px-2">{safeCell(row['6s'] ?? row.sixes, '0')}</td>
                            </tr>
                          );
                        }).filter(Boolean);

                        if (renderedRows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={13} className="py-4 text-center text-slate-400 text-xs">
                                No batting career records found for this player.
                              </td>
                            </tr>
                          );
                        }
                        return renderedRows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOWLING CAREER SUMMARY (MULTI-FORMAT) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-teal-400">
                      Bowling Career Summary
                    </h4>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">
                    Auto-extracted from Cricbuzz Dossier
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-white/5 text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Format</th>
                        <th className="py-2.5 px-2">Mat</th>
                        <th className="py-2.5 px-2">Inn</th>
                        <th className="py-2.5 px-2">Balls</th>
                        <th className="py-2.5 px-2">Runs</th>
                        <th className="py-2.5 px-2">Wkts</th>
                        <th className="py-2.5 px-2">BBI</th>
                        <th className="py-2.5 px-2">Econ</th>
                        <th className="py-2.5 px-2">Avg</th>
                        <th className="py-2.5 px-2">SR</th>
                        <th className="py-2.5 px-2">5W</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                      {(() => {
                        const bowl = selectedPlayer.careerStats?.bowling || {};
                        const formats = ['Test', 'ODI', 'T20', 'WPL'];
                        const renderedRows = formats.map((fmt) => {
                          let row = bowl[fmt] || bowl[fmt.toLowerCase()] || bowl[fmt.toUpperCase()] ||
                                    (fmt === 'T20' ? (bowl['T20I'] || bowl['t20i'] || bowl['wt20'] || bowl['WT20'] || bowl['wt20i'] || bowl['WT20I']) : undefined) ||
                                    (fmt === 'T20I' ? (bowl['T20'] || bowl['t20'] || bowl['wt20'] || bowl['WT20']) : undefined) ||
                                    (fmt === 'Test' ? (bowl['wtest'] || bowl['WTEST']) : undefined) ||
                                    (fmt === 'ODI' ? (bowl['wodi'] || bowl['WODI']) : undefined) ||
                                    (fmt === 'WPL' ? (bowl['wpl'] || bowl['IPL'] || bowl['ipl']) : undefined);

                          if (!row && fmt === 'WPL' && selectedPlayer.stats && (selectedPlayer.stats.wickets || selectedPlayer.stats.economy || selectedPlayer.stats.balls)) {
                            const s = selectedPlayer.stats;
                            const m = s.matches || 0;
                            const inn = s.bowlingInnings || '—';
                            const oversRaw = parseFloat(s.balls || '0') || 0;
                            const fullOvers = Math.floor(oversRaw);
                            const remBalls = Math.round((oversRaw - fullOvers) * 10);
                            const totalBalls = fullOvers * 6 + remBalls;
                            const runsConceded = s.runsConceded || 0;
                            const wkts = s.wickets || 0;
                            const econ = s.economy ? Number(s.economy).toFixed(2) : (totalBalls > 0 ? ((runsConceded * 6) / totalBalls).toFixed(2) : '—');
                            const bAvg = s.bowlingAverage ? Number(s.bowlingAverage).toFixed(2) : (wkts > 0 && runsConceded > 0 ? (runsConceded / wkts).toFixed(2) : '—');
                            const bSR = s.bowlingStrikeRate ? Number(s.bowlingStrikeRate).toFixed(1) : (wkts > 0 && totalBalls > 0 ? (totalBalls / wkts).toFixed(1) : '—');
                            row = {
                              Mat: m,
                              Inn: inn,
                              Balls: totalBalls > 0 ? totalBalls : (s.balls || '—'),
                              Runs: runsConceded,
                              Wkts: wkts,
                              BBI: s.bestBowling || '—/—',
                              Econ: econ,
                              Avg: bAvg,
                              SR: bSR,
                              '5W': s.fiveWickets || 0
                            };
                          }

                          if (!row || (row.Mat === undefined && row.Wkts === undefined && row.Balls === undefined && row.M === undefined)) return null;

                          return (
                            <tr key={fmt} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-2.5 px-3 text-left font-black text-white">{fmt}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Mat ?? row.M ?? row.matches ?? row.Matches)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Inn ?? row.inn ?? row.Innings ?? row.innings)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Balls ?? row.balls ?? row.B ?? row.b)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.Runs ?? row.runs ?? row.R ?? row.r)}</td>
                              <td className="py-2.5 px-2 font-black text-teal-400">{safeCell(row.Wkts ?? row.wkts ?? row.W ?? row.w)}</td>
                              <td className="py-2.5 px-2">{safeCell(row.BBI ?? row.bbi ?? row.bestBowling, '—/—')}</td>
                              <td className="py-2.5 px-2 font-bold text-amber-400">{safeCell(row.Econ ?? row.econ ?? row.economy)}</td>
                              <td className="py-2.5 px-2 font-bold text-purple-400">{safeCell(row.Avg ?? row.avg ?? row.average)}</td>
                              <td className="py-2.5 px-2 font-bold text-rose-400">{safeCell(row.SR ?? row.sr ?? row.strikeRate)}</td>
                              <td className="py-2.5 px-2">{safeCell(row['5w'] ?? row['5W'] ?? row.fiveWickets, '0')}</td>
                            </tr>
                          );
                        }).filter(Boolean);

                        if (renderedRows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={11} className="py-4 text-center text-slate-400 text-xs">
                                No bowling career records found for this player.
                              </td>
                            </tr>
                          );
                        }
                        return renderedRows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Contract & Fielding Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-white/10">
                <div className="flex items-center gap-4 text-slate-300">
                  {selectedPlayer.auction?.fee && (typeof selectedPlayer.auction.fee === 'string' || typeof selectedPlayer.auction.fee === 'number') && (
                    <span>
                      Contract / Fee: <strong className="text-emerald-400 font-black">{String(selectedPlayer.auction.fee)}</strong>
                    </span>
                  )}
                  {selectedPlayer.stats?.catches ? (
                    <span>Catches: <strong className="text-white">{String(selectedPlayer.stats.catches)}</strong></span>
                  ) : null}
                  {selectedPlayer.stats?.stumpings ? (
                    <span>Stumpings: <strong className="text-white">{String(selectedPlayer.stats.stumpings)}</strong></span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
