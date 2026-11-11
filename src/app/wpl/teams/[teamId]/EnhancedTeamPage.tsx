'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Flame,
  MapPin,
  Search,
  Shield,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SquadRosterSection from '@/components/teams/modern/SquadRosterSection';
import { api, mockTeams } from '@/lib/data';
import { hexToRgba, sanitizeNoPinkHex } from '@/lib/teamColors';
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
    secondary: '#F59E0B',
    accent: '#FACC15',
    badgeBg: 'bg-red-500/15 text-red-300 border-red-500/35',
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
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
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
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
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
    secondary: '#FACC15',
    accent: '#14B8A6',
    badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
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
    primary: '#6D28D9',
    secondary: '#F59E0B',
    accent: '#EAB308',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
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
  const targetKey =
    getFranchiseKey(teamParamId) ||
    (teamObj ? getFranchiseKey(teamObj.id || teamObj.shortName || teamObj.name) : 'rcb');

  const pId = String(p.id || '').toLowerCase();
  const pTeamId = String(p.teamId || '').toLowerCase();
  const pTeam = String(p.team || '').toLowerCase();

  if (pId.startsWith(`wpl_${targetKey}`) || pId.startsWith(`wpl-${targetKey}`)) return true;
  if (targetKey === 'upw' && (pId.startsWith('wpl_up') || pId.startsWith('wpl-up'))) return true;

  const franchiseIdMap: Record<string, string> = {
    rcb: '14',
    mi: '13',
    dc: '11',
    gg: '12',
    upw: '15',
  };
  if (pTeamId === franchiseIdMap[targetKey]) return true;

  if (targetKey === 'rcb' && (pTeam.includes('rcb') || pTeam.includes('bengaluru') || pTeam.includes('bangalore'))) return true;
  if (targetKey === 'mi' && (pTeam.includes('mumbai') || pTeam.includes('mi'))) return true;
  if (targetKey === 'dc' && (pTeam.includes('delhi') || pTeam.includes('capitals') || pTeam.includes('dc'))) return true;
  if (targetKey === 'gg' && (pTeam.includes('gujarat') || pTeam.includes('giants') || pTeam.includes('gg'))) return true;
  if (targetKey === 'upw' && (pTeam.includes('up') || pTeam.includes('warrior'))) return true;

  return false;
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
  const combined = `${
    typeof team === 'object' ? `${team?.shortName || ''} ${team?.name || ''} ${team?.id || ''}` : String(team || '')
  } ${fallbackName || ''}`.toLowerCase();

  if (combined.includes('rcb') || combined.includes('royal') || combined.includes('bengaluru') || combined.includes('bangalore')) {
    return FRANCHISES.rcb.logo;
  }
  if (combined.includes('mi') || combined.includes('mumbai')) return FRANCHISES.mi.logo;
  if (combined.includes('dc') || combined.includes('delhi')) return FRANCHISES.dc.logo;
  if (combined.includes('gg') || combined.includes('gujarat')) return FRANCHISES.gg.logo;
  if (combined.includes('upw') || combined.includes('up ') || combined.includes('warrior')) return FRANCHISES.upw.logo;
  return '/logos/tba_logo.svg';
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
  const primaryHex = sanitizeNoPinkHex(config.primary, '#1D4ED8');
  const secondaryHex = sanitizeNoPinkHex(config.secondary, '#F59E0B');

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures' | 'records' | 'about'>('squad');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        let cachedPlayers: Player[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw =
              localStorage.getItem(WPL_PLAYERS_STORAGE_KEY) ||
              localStorage.getItem('sportsup99_wpl_players_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) cachedPlayers = parsed;
            }
          } catch {}
        }

        const [teamsData, apiPlayersData, matchesData] = await Promise.all([
          fetchWithTimeout(api.getTeams('wpl'), 2500, []),
          fetchWithTimeout(api.getPlayers(undefined, 'wpl'), 2500, []),
          fetchWithTimeout(api.getMatches('wpl'), 2500, []),
        ]);

        if (!isMounted) return;

        let found = (teamsData || []).find(
          (t: Team) => getFranchiseKey(t.id || t.shortName || t.name) === franchiseKey
        );
        if (!found) {
          found =
            (mockTeams || []).find(
              (t: Team) =>
                t.league === 'wpl' && getFranchiseKey(t.id || t.shortName || t.name) === franchiseKey
            ) || undefined;
        }

        setTeam(
          found ||
            ({
              id: config.id,
              name: config.name,
              shortName: config.shortName,
              league: 'wpl',
              logo: config.logo,
              description: config.motto,
              venue: config.stadium,
              players: [],
              trophies: config.championships.map((year) => ({
                year: Number(year),
                name: 'WPL Champions',
              })) as any,
            } as unknown as Team)
        );

        const mergedMap = new Map<string, any>();
        (apiPlayersData || []).forEach((p: any) => {
          const clean = { ...p };
          delete clean.cricbuzzUrl;
          delete clean.cricbuzzId;
          const k = String(clean.id || clean.name || '').trim().toLowerCase();
          mergedMap.set(k, clean);
        });

        cachedPlayers.forEach((lp: any) => {
          const cleanLp = { ...lp };
          delete cleanLp.cricbuzzUrl;
          delete cleanLp.cricbuzzId;
          const k = String(cleanLp.id || cleanLp.name || '').trim().toLowerCase();
          const existing = mergedMap.get(k);
          if (!existing) {
            mergedMap.set(k, cleanLp);
          } else {
            const localTotal =
              Object.keys(cleanLp.careerStats?.batting || {}).length +
              Object.keys(cleanLp.careerStats?.bowling || {}).length;
            const existingTotal =
              Object.keys(existing.careerStats?.batting || {}).length +
              Object.keys(existing.careerStats?.bowling || {}).length;

            const localTs = cleanLp.updatedAt ? Date.parse(cleanLp.updatedAt) : 0;
            const existingTs = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
            const localIsStrictlyNewer = Boolean(localTs && localTs > existingTs);

            const careerStats =
              (localIsStrictlyNewer && localTotal > 0) || (existingTotal === 0 && localTotal > 0)
                ? cleanLp.careerStats
                : existingTotal > 0
                ? existing.careerStats
                : cleanLp.careerStats || { batting: {}, bowling: {} };

            const base = localIsStrictlyNewer ? existing : cleanLp;
            const head = localIsStrictlyNewer ? cleanLp : existing;

            mergedMap.set(k, {
              ...base,
              ...head,
              careerStats,
              stats: {
                ...(base.stats || {}),
                ...(head.stats || {}),
              },
            });
          }
        });

        const allPlayers = Array.from(mergedMap.values());
        const squad = allPlayers.filter((p: Player) => isPlayerInWplTeam(p, teamId, found));
        setPlayers(squad);

        const teamMatches = (matchesData || []).filter((m: Match) => {
          const t1 =
            typeof m.team1 === 'object'
              ? String((m.team1 as any)?.name || (m.team1 as any)?.shortName || '')
              : String(m.team1 || '');
          const t2 =
            typeof m.team2 === 'object'
              ? String((m.team2 as any)?.name || (m.team2 as any)?.shortName || '')
              : String(m.team2 || '');
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

    const handleSync = () => loadData();
    window.addEventListener('admin-data-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('admin-data-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [teamId, franchiseKey, config]);

  const displayMatches = useMemo(() => {
    if (matches && matches.length > 0) return matches;

    const opponents = Object.values(FRANCHISES).filter((f) => f.slug !== config.slug);
    return opponents.map((opp, idx) => ({
      id: `wpl-2027-m${idx + 1}`,
      name: `Match ${idx + 1}: ${config.shortName} vs ${opp.shortName}`,
      team1: {
        id: config.id,
        name: config.name,
        shortName: config.shortName,
        logo: config.logo,
      },
      team2: {
        id: opp.id,
        name: opp.name,
        shortName: opp.shortName,
        logo: opp.logo,
      },
      team1Short: config.shortName,
      team2Short: opp.shortName,
      venue: idx % 2 === 0 ? config.stadium : opp.stadium,
      date: `2027-01-${10 + idx * 4}`,
      time: '19:30 IST',
      status: 'Upcoming',
      league: 'wpl',
    }));
  }, [matches, config]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-6 w-56 bg-white/10 rounded-xl" />
          <div className="h-64 rounded-3xl bg-white/[0.04] border border-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-white/[0.03] border border-white/10" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-clip">
      <Navbar />

      <main className="flex-1 pb-24 relative z-10">
        {/* =====================================================================
            1. FRANCHISE HERO BANNER (ZERO PINK)
           ===================================================================== */}
        <section className="relative overflow-hidden pt-8 pb-12 border-b border-white/10 bg-gradient-to-b from-[#0A1022] via-[#070B18] to-[#050814]">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[920px] h-[440px] rounded-full blur-[150px] pointer-events-none opacity-35"
            style={{
              background: `radial-gradient(ellipse at center, ${primaryHex} 0%, ${secondaryHex} 45%, transparent 72%)`,
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-7">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/wpl" className="hover:text-white transition-colors">WPL 2027</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/wpl/teams" className="hover:text-white transition-colors">Franchises</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold">{config.name}</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8"
            >
              {/* Emblem & Franchise Name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                <div className="relative group shrink-0">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#0D1428] border-2 p-4 flex items-center justify-center shadow-2xl relative z-10 backdrop-blur-xl transition-transform duration-300 group-hover:scale-105"
                    style={{ borderColor: hexToRgba(primaryHex, 0.45) }}
                  >
                    <Image
                      src={config.logo}
                      alt={`${config.name} Crest`}
                      width={120}
                      height={120}
                      className="object-contain w-full h-full drop-shadow-2xl"
                      priority
                    />
                  </div>
                  <div
                    className="absolute -inset-2 rounded-3xl blur-xl opacity-45 group-hover:opacity-70 transition-opacity pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})` }}
                  />
                </div>

                <div className="space-y-3 max-w-xl">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${config.badgeBg}`}>
                      {config.shortName}
                    </span>
                    {config.championships.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-black uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{config.championships.join(', ')} Champions</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider">
                        Season 5 Contender
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold">
                      WPL 2027
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    {team?.name || config.name}
                  </h1>

                  <p className="text-sm font-semibold text-slate-300">
                    "{config.motto}" • {config.stadium}
                  </p>
                </div>
              </div>

              {/* Quick Vitals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Captain</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate">{(team as any)?.captain || config.captain}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Head Coach</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate">{(team as any)?.coach || config.coach}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Home City</span>
                  <span className="text-sm font-black text-white block mt-0.5 truncate" title={config.stadium}>
                    {config.city}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-left backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Squad</span>
                  <span className="text-sm font-black text-emerald-400 block mt-0.5 tabular-nums">{players.length} Athletes</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =====================================================================
            2. STICKY MOTION NAVIGATION BAR
           ===================================================================== */}
        <section className="sticky top-16 z-30 bg-[#070B18]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="inline-flex p-1 rounded-2xl bg-[#0D1326] border border-white/10 w-full md:w-auto overflow-x-auto">
              {[
                { id: 'squad', label: 'Squad & Profiles', icon: Users, badge: `${players.length}` },
                { id: 'fixtures', label: 'Match Schedule', icon: Calendar },
                { id: 'records', label: 'Franchise Records', icon: BarChart3 },
                { id: 'about', label: 'Honors & Legacy', icon: Trophy },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative shrink-0 flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                      isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="wpl-franchise-active-tab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-300 shadow-lg shadow-amber-500/20"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                            isActive ? 'bg-slate-950/15 text-slate-950' : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'squad' && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Quick search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-cyan-400/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear quick search"
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
            3. TAB CONTENT PANELS
           ===================================================================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AnimatePresence mode="wait">
            {activeTab === 'squad' && (
              <motion.div
                key="tab-squad"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <SquadRosterSection
                  players={players}
                  league="wpl"
                  teamName={team?.name || config.name}
                  teamShortName={config.shortName}
                  primaryColor={primaryHex}
                  secondaryColor={secondaryHex}
                  captainNameFallback={config.captain}
                  externalSearchQuery={searchQuery}
                  onExternalSearchChange={setSearchQuery}
                />
              </motion.div>
            )}

            {activeTab === 'fixtures' && (
              <motion.div
                key="tab-fixtures"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#0B1226] to-[#080C18] border border-white/12 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white">
                      Season 5 Match Schedule (Jan 9 – Feb 5, 2027)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Official league fixtures and franchise matchups.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-black uppercase tracking-wider border border-cyan-400/35 tabular-nums">
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
                    const matchVenue =
                      typeof m.venue === 'string' && m.venue ? m.venue : config.stadium;
                    const matchDate =
                      typeof m.displayDate === 'string' && m.displayDate
                        ? m.displayDate
                        : typeof m.date === 'string' && m.date
                        ? m.date
                        : 'TBA 2027';
                    const matchName =
                      typeof m.name === 'string' && m.name ? m.name : `${t1Name} vs ${t2Name}`;

                    return (
                      <motion.div
                        key={m.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="p-5 rounded-2xl bg-[#0A1021] border border-white/10 hover:border-cyan-400/45 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
                      >
                        <div className="space-y-1.5 text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{matchVenue}</span>
                            <span>•</span>
                            <span>{matchDate}</span>
                          </div>
                          <h3 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-2.5">
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
                            <span className="text-amber-300 text-xs font-black px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30">
                              VS
                            </span>
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
                          </h3>
                          <p className="text-xs text-slate-400">
                            {matchName} • {typeof m.time === 'string' ? m.time : '19:30 IST'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-300">
                            {typeof m.status === 'string'
                              ? m.status === 'completed'
                                ? 'Final'
                                : m.status === 'live'
                                ? 'LIVE'
                                : 'Scheduled'
                              : 'Scheduled'}
                          </span>
                          <Link
                            href={`/wpl/matches/${m.id || ''}`}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:brightness-105 text-xs font-black uppercase tracking-wider transition-all shadow-md"
                          >
                            Match Center
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div
                key="tab-records"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
                  <div className="p-5 rounded-3xl bg-[#0A1021] border border-white/10 text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Matches</span>
                    <span className="text-3xl font-black text-white mt-1 block">{config.stats.played}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">WPL Archive</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#0A1021] border border-white/10 text-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Victories</span>
                    <span className="text-3xl font-black text-emerald-400 mt-1 block">{config.stats.wins}</span>
                    <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Wins</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#0A1021] border border-white/10 text-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Defeats</span>
                    <span className="text-3xl font-black text-red-400 mt-1 block">{config.stats.losses}</span>
                    <span className="text-[11px] text-red-400/80 mt-0.5 block">Losses</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#0A1021] border border-white/10 text-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Win Rate</span>
                    <span className="text-3xl font-black text-amber-400 mt-1 block">{config.stats.winRate}</span>
                    <span className="text-[11px] text-amber-400/80 mt-0.5 block">Success Ratio</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-[#0A1021] border border-white/10 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Innings Highs & Defenses</span>
                    </h3>

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

                  <div className="p-6 rounded-3xl bg-[#0A1021] border border-white/10 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span>Toss & Phase Dynamics</span>
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span className="text-slate-300">Batting 1st Win Rate</span>
                          <span className="text-emerald-400">{config.stats.bat1stWinRate}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: config.stats.bat1stWinRate }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span className="text-slate-300">Chasing Win Rate</span>
                          <span className="text-cyan-400">{config.stats.chaseWinRate}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: config.stats.chaseWinRate }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-cyan-400 rounded-full"
                          />
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
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="tab-about"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8 max-w-4xl mx-auto"
              >
                <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/30 via-[#0A1021] to-amber-950/20 border border-amber-500/30 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Championship Cabinet</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Official titles lifted in Women's Premier League history.
                    </p>
                  </div>

                  {config.championships.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                      {config.championships.map((year) => (
                        <div
                          key={year}
                          className="p-5 rounded-2xl bg-[#070B18] border-2 border-amber-400/50 shadow-2xl flex items-center gap-4 min-w-[240px]"
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

                <div className="p-6 sm:p-8 rounded-3xl bg-[#0A1021] border border-white/10 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>About {team?.name || config.name}</span>
                  </h3>
                  <p>
                    {team?.name || config.name} represents the city of {config.city} in the Women's Premier League.
                    Playing out of {config.stadium}, the franchise combines global stars and rising domestic performers.
                  </p>
                  <p>
                    Led by captain <strong>{(team as any)?.captain || config.captain}</strong> and head coach{' '}
                    <strong>{(team as any)?.coach || config.coach}</strong>, the team competes under their motto "{config.motto}"
                    with an official squad of {players.length} athletes.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
