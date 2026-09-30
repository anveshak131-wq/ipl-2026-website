'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ModernTeamLogo from '@/components/ui/ModernTeamLogo';
import { Team, Player } from '@/types';
import { api } from '@/lib/data';
import { wplTeams } from '@/data/wpl-teams';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Trophy, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Search, 
  LayoutGrid, 
  List, 
  ShieldCheck, 
  ChevronRight,
  Flame
} from 'lucide-react';

// Authentic franchise identity map
const WPL_THEMES: Record<string, {
  accent: string;
  secondary: string;
  glow: string;
  border: string;
  badge: string;
  championships: string[];
  captain: string;
}> = {
  'rcb': {
    accent: '#DC2626',
    secondary: '#D97706',
    glow: 'rgba(220, 38, 38, 0.28)',
    border: 'border-red-500/30 hover:border-red-500/60',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    championships: ['2024'],
    captain: 'Smriti Mandhana',
  },
  'mi': {
    accent: '#2563EB',
    secondary: '#EAB308',
    glow: 'rgba(37, 99, 235, 0.28)',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    championships: ['2023'],
    captain: 'Harmanpreet Kaur',
  },
  'dc': {
    accent: '#0284C7',
    secondary: '#DC2626',
    glow: 'rgba(2, 132, 199, 0.28)',
    border: 'border-sky-500/30 hover:border-sky-500/60',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    championships: [],
    captain: 'Meg Lanning',
  },
  'gg': {
    accent: '#EA580C',
    secondary: '#F59E0B',
    glow: 'rgba(234, 88, 12, 0.28)',
    border: 'border-orange-500/30 hover:border-orange-500/60',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    championships: [],
    captain: 'Beth Mooney',
  },
  'upw': {
    accent: '#9333EA',
    secondary: '#EAB308',
    glow: 'rgba(147, 51, 234, 0.28)',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    championships: [],
    captain: 'Alyssa Healy',
  },
};

const DEFAULT_THEME = {
  accent: '#38BDF8',
  secondary: '#818CF8',
  glow: 'rgba(56, 189, 248, 0.22)',
  border: 'border-slate-700/60 hover:border-slate-500',
  badge: 'bg-slate-800 text-slate-300 border-slate-700',
  championships: [],
  captain: 'Team Captain',
};

function getFranchiseTheme(team: Team) {
  const key = (team.shortName || team.id || team.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru')) return WPL_THEMES['rcb'];
  if (key.includes('mi') || key.includes('mumbai')) return WPL_THEMES['mi'];
  if (key.includes('dc') || key.includes('delhi')) return WPL_THEMES['dc'];
  if (key.includes('gg') || key.includes('gujarat')) return WPL_THEMES['gg'];
  if (key.includes('upw') || key.includes('warrior')) return WPL_THEMES['upw'];
  return DEFAULT_THEME;
}

// Canonical list of all 5 WPL Teams to guarantee 100% presence
const FALLBACK_WPL_TEAMS: Team[] = (wplTeams || []).map((t, idx) => {
  const sName = t.shortName.toLowerCase();
  let id = sName;
  if (sName.includes('rcb')) id = 'rcb-w';
  else if (sName.includes('mi')) id = 'mi-w';
  else if (sName.includes('dc')) id = 'dc-w';
  else if (sName.includes('gg')) id = 'gg';
  else if (sName.includes('up')) id = 'upw';

  return {
    id,
    league: 'wpl',
    name: t.name,
    shortName: t.shortName,
    logo: t.logo,
    colors: t.colors,
    venue: t.homeGrounds?.[0] || 'Home Venue TBA',
    captain: '',
    players: [],
    trophies: (t as any).trophies || [],
  } as unknown as Team;
});

function WPLTeamsContent() {
  const searchParams = useSearchParams();
  const { currentLeague, setCurrentLeague } = useLeague();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    (async () => {
      try {
        const [teamsData, playersData] = await Promise.all([
          api.getTeams('wpl').catch(() => []),
          api.getPlayers(undefined, 'wpl').catch(() => []),
        ]);

        const validApiTeams = (teamsData || []).filter((t: Team) => !isPlaceholderTeam(t.name));

        // Merge API teams with Fallback Teams to guarantee all 5 franchises always exist
        const mergedMap = new Map<string, Team>();
        
        // 1. Seed with canonical 5 WPL franchises
        FALLBACK_WPL_TEAMS.forEach((ft) => {
          const key = ft.shortName.toLowerCase().replace(/[^a-z]/g, '');
          mergedMap.set(key, ft);
        });

        // 2. Overlay live API teams if present
        validApiTeams.forEach((at: Team) => {
          const key = (at.shortName || at.name || '').toLowerCase().replace(/[^a-z]/g, '');
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...at });
        });

        setTeams(Array.from(mergedMap.values()));
        setPlayers(playersData || []);
      } catch (err) {
        console.error('Failed to load WPL teams:', err);
        setTeams(FALLBACK_WPL_TEAMS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Players mapping by team
  const playersByTeam = useMemo(() => {
    const map = new Map<string, Player[]>();
    for (const p of players) {
      const tid = String(p.teamId || '').toLowerCase();
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid)!.push(p);
    }
    return map;
  }, [players]);

  // Unique venues
  const uniqueVenues = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      if (t.venue) set.add(t.venue);
    });
    return Array.from(set);
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchSearch =
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        team.shortName.toLowerCase().includes(search.toLowerCase()) ||
        (team.venue && team.venue.toLowerCase().includes(search.toLowerCase()));
      const matchVenue = selectedVenue === 'all' || team.venue === selectedVenue;
      return matchSearch && matchVenue;
    });
  }, [teams, search, selectedVenue]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080f] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Synchronizing 2027 Franchises…</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-100 flex flex-col relative selection:bg-amber-400 selection:text-slate-950">
      <Navbar />

      {/* Atmospheric Stadium Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[450px] bg-sky-500/[0.04] blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[500px] bg-indigo-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/[0.03] blur-[120px]" />
        
        {/* Subtle Pitch Grid Canvas */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <main className="relative z-10 flex-1 pb-28">
        
        {/* Hero Section */}
        <section className="pt-12 pb-10 border-b border-white/[0.06] bg-gradient-to-b from-[#0e121e]/80 to-[#06080f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Season 5 • Jan 9 – Feb 5, 2027</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                  Franchises & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-slate-100 to-sky-300">Rosters</span>
                </h1>
                
                <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                  The official roster and leadership breakdown of the 5 franchises contending for the 2027 Women's Premier League title.
                </p>
              </div>

              {/* Tournament Meta Strip */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 px-4 backdrop-blur-xl">
                <div className="text-right pr-3 border-r border-white/10">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">Contenders</span>
                  <span className="text-lg font-black text-white">{teams.length} Teams</span>
                </div>
                <div className="text-left pl-1">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-400">Window</span>
                  <span className="text-sm font-black text-slate-200">Jan 9 – Feb 5, 2027</span>
                </div>
              </div>
            </div>

            {/* Filter & Control Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search franchise, city, stadium..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-white/20 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {uniqueVenues.length > 1 && (
                  <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-white/20"
                  >
                    <option value="all">All Venues</option>
                    {uniqueVenues.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Franchises Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-24 rounded-3xl bg-white/[0.02] border border-white/10 max-w-lg mx-auto p-8">
              <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-base font-bold text-white">No franchises match your search</p>
              <p className="text-xs text-slate-400 mt-1">Reset your filter to view all 5 WPL franchises</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team, index) => {
                const theme = getFranchiseTheme(team);
                const teamRoster = playersByTeam.get(String(team.id).toLowerCase()) || [];
                const isHovered = activeHoverId === team.id;
                const captainName = team.captain || theme.captain;

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onMouseEnter={() => setActiveHoverId(team.id)}
                    onMouseLeave={() => setActiveHoverId(null)}
                    className="relative group"
                  >
                    <div 
                      className={`relative rounded-3xl p-6 sm:p-7 border ${theme.border} bg-[#0a0d16] overflow-hidden transition-all duration-300 flex flex-col justify-between h-full`}
                      style={{
                        boxShadow: isHovered ? `0 20px 45px -10px ${theme.glow}` : '0 10px 30px -15px rgba(0,0,0,0.5)',
                        transform: isHovered ? 'translateY(-4px)' : 'none',
                      }}
                    >
                      {/* Ambient Franchise Glow */}
                      <div 
                        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40"
                        style={{ backgroundColor: theme.accent }}
                      />

                      <div>
                        {/* Top Meta Bar */}
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${theme.badge}`}>
                            {team.shortName || 'WPL'}
                          </span>

                          {theme.championships.length > 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>{theme.championships.join(', ')} Champions</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                              Contender
                            </span>
                          )}
                        </div>

                        {/* Team Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/40 border border-white/10 p-2.5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <ModernTeamLogo team={team} size="lg" />
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover:text-slate-100">
                              {team.name}
                            </h2>
                            {captainName && (
                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <span className="text-amber-400 font-bold">Captain:</span> {captainName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/5 mb-6 text-xs">
                          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Home Venue</span>
                            <span className="block text-slate-200 font-semibold truncate mt-0.5" title={team.venue || 'TBA'}>
                              {team.venue || 'Official TBA'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Squad Status</span>
                            <span className="block text-slate-200 font-semibold mt-0.5">
                              {teamRoster.length > 0 ? `${teamRoster.length} Players` : '18 Contenders'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Link Button */}
                      <Link
                        href={`/wpl/teams/${team.id}`}
                        className="mt-auto w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all group-hover:border-white/20"
                      >
                        <span>Explore Full Squad</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                      </Link>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredTeams.map((team, index) => {
                const theme = getFranchiseTheme(team);
                const captainName = team.captain || theme.captain;

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0a0d16] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 p-2 flex items-center justify-center shrink-0">
                        <ModernTeamLogo team={team} size="md" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{team.name}</h3>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase ${theme.badge}`}>
                            {team.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {team.venue || 'Home Stadium TBA'} {captainName && `• Capt: ${captainName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      {theme.championships.length > 0 && (
                        <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          {theme.championships.join(', ')} Champions
                        </span>
                      )}
                      <Link
                        href={`/wpl/teams/${team.id}`}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <span>View Squad</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function WPLTeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <WPLTeamsContent />
    </Suspense>
  );
}
