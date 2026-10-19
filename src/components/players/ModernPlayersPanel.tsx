'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Crown, Plane, Sparkles, 
  Grid, List, TrendingUp, Activity, User, ArrowUpDown, Zap
} from 'lucide-react';
import { getAllFormatRatings } from '@/lib/formatRatings';
import PlayerCardModal from '../teams/PlayerCardModal';

interface ModernPlayersPanelProps {
  players?: any[];
  team?: any;
  teams?: any[];
  teamId?: string | number;
  initialRole?: string;
  onPlayerSelect?: (player: any) => void;
  [key: string]: any;
}

export default function ModernPlayersPanel({
  players = [],
  team,
  teams = [],
  teamId,
  onPlayerSelect
}: ModernPlayersPanelProps) {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyOverseas, setOnlyOverseas] = useState<boolean>(false);
  const [onlyCaptains, setOnlyCaptains] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'rating' | 'runs' | 'wickets' | 'name'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  // Derive active team colors (RCB Crimson #DA1A32 & Gold #E5B80B by default)
  const activeTeam = team || teams.find((t: any) => String(t.id) === String(teamId || players[0]?.teamId));
  const primaryColor = activeTeam?.primaryColor || '#DA1A32';
  const secondaryColor = activeTeam?.secondaryColor || '#E5B80B';

  const extractStats = (player: any) => {
    const cs = player.careerStats || {};
    const bat = cs.batting?.IPL || {};
    const bowl = cs.bowling?.IPL || {};
    const st = player.stats || {};

    const runs = Number(bat.Runs || bat.runs || st.runs || player.runs || 0);
    const wickets = Number(bowl.Wkts || bowl.Wickets || st.wickets || player.wickets || 0);
    const avg = bat.Avg || bat.Average || (st.average ? Number(st.average).toFixed(2) : (player.battingAverage ? Number(player.battingAverage).toFixed(2) : (runs > 0 ? (runs / Math.max(1, Number(bat.Inn || 1))).toFixed(2) : '—')));
    const sr = bat.SR || (st.strikeRate ? Number(st.strikeRate).toFixed(2) : (player.strikeRate ? Number(player.strikeRate).toFixed(2) : '—'));
    const econ = bowl.Econ || bowl.Eco || (st.economy ? Number(st.economy).toFixed(2) : (player.economy ? Number(player.economy).toFixed(2) : '—'));
    const matches = Number(bat.M || bowl.M || st.matches || player.matches || 0);
    const highest = bat.HS || bat.Highest || st.highest || '—';

    let ratings: any = null;
    try {
      ratings = getAllFormatRatings(player);
    } catch (e) {
      ratings = {
        IPL: { score: 82, grade: 'A', label: 'World Class' },
        Test: { score: 78, grade: 'B+', label: 'Quality' },
        ODI: { score: 85, grade: 'A', label: 'World Class' },
        T20I: { score: 80, grade: 'A', label: 'World Class' }
      };
    }

    return { runs, wickets, avg, sr, econ, matches, highest, ratings };
  };

  const roles = [
    { id: 'all', label: 'All Squad', icon: Shield },
    { id: 'batsman', label: 'Batters', icon: TrendingUp },
    { id: 'all-rounder', label: 'All-Rounders', icon: Sparkles },
    { id: 'wicket-keeper', label: 'Keepers', icon: User },
    { id: 'bowler', label: 'Bowlers', icon: Activity },
  ];

  const filteredPlayers = useMemo(() => {
    return (players || [])
      .filter((player) => {
        const role = (player.role || '').toLowerCase();
        if (selectedRole === 'batsman' && !(role.includes('batsman') || role.includes('batter'))) return false;
        if (selectedRole === 'bowler' && !role.includes('bowler')) return false;
        if (selectedRole === 'all-rounder' && !(role.includes('all-rounder') || role.includes('allrounder'))) return false;
        if (selectedRole === 'wicket-keeper' && !(role.includes('keeper') || role.includes('wk'))) return false;

        const isOverseas = player.nationality && player.nationality !== 'India' && player.nationality !== 'Indian';
        if (onlyOverseas && !isOverseas) return false;
        if (onlyCaptains && !player.isCaptain) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = player.name?.toLowerCase().includes(q);
          const matchNum = String(player.jerseyNumber || '').includes(q);
          const matchNat = player.nationality?.toLowerCase().includes(q);
          if (!matchName && !matchNum && !matchNat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const statsA = extractStats(a);
        const statsB = extractStats(b);

        let diff = 0;
        if (sortBy === 'runs') diff = statsA.runs - statsB.runs;
        else if (sortBy === 'wickets') diff = statsA.wickets - statsB.wickets;
        else if (sortBy === 'rating') diff = (statsA.ratings?.IPL?.score || 0) - (statsB.ratings?.IPL?.score || 0);
        else diff = (a.name || '').localeCompare(b.name || '');

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [players, selectedRole, searchQuery, onlyOverseas, onlyCaptains, sortBy, sortOrder]);

  const overseasCount = (players || []).filter(p => p.nationality && p.nationality !== 'India' && p.nationality !== 'Indian').length;
  const captain = (players || []).find(p => p.isCaptain);

  const handleCardClick = (player: any) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
    }
    setSelectedPlayer(player);
  };

  return (
    <div className="space-y-6 my-6">
      {/* Control Header & Live Squad Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div 
          className="absolute -top-20 left-1/3 w-96 h-36 blur-3xl opacity-25 pointer-events-none rounded-full"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </span>
                Squad Roster & Ratings
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
                {players.length} Squad
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
              <span className="text-slate-300 font-medium">{overseasCount} Overseas (✈️)</span> • 
              <span className="text-slate-300 font-medium">{players.length - overseasCount} Domestic</span>
              {captain && (
                <>
                  • <span className="text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Captain: {captain.name}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>3D Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' 
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Pro Table</span>
              </button>
            </div>

            <div className="flex items-center bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="rating" className="bg-slate-900">Sort by IPL Rating</option>
                <option value="runs" className="bg-slate-900">Sort by Runs</option>
                <option value="wickets" className="bg-slate-900">Sort by Wickets</option>
                <option value="name" className="bg-slate-900">Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Role Filter Tabs & Quick Filters */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSquadFilterPublic"
                      className="absolute inset-0 rounded-xl shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyOverseas(!onlyOverseas)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                onlyOverseas 
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Overseas</span>
            </button>

            <button
              onClick={() => setOnlyCaptains(!onlyCaptains)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                onlyCaptains 
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Captain</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search player, #, nation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 w-48 md:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredPlayers.length === 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center">
          <User className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No squad players match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search keywords.</p>
        </div>
      )}

      {/* 3D FUT Trading Cards Grid */}
      {viewMode === 'grid' && (
        <motion.div 
          layout 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredPlayers.map((player) => {
              const { runs, wickets, avg, sr, econ, matches, ratings } = extractStats(player);
              const isOverseas = player.nationality && player.nationality !== 'India' && player.nationality !== 'Indian';
              const roleLower = (player.role || '').toLowerCase();
              const isBat = roleLower.includes('batsman') || roleLower.includes('batter');
              const isBowl = roleLower.includes('bowler');
              const isAll = roleLower.includes('all-rounder') || roleLower.includes('allrounder');

              return (
                <motion.div
                  key={player.id || player.name}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleCardClick(player)}
                  className="group relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-5 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  style={{
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Glowing Team Halo */}
                  <div 
                    className="absolute -top-16 -right-16 w-36 h-36 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                  />

                  {/* Header Row: Jersey Watermark & Chips */}
                  <div className="flex items-start justify-between relative z-10 mb-3">
                    <div>
                      {player.jerseyNumber ? (
                        <span className="text-2xl font-black text-slate-500/50 group-hover:text-amber-400 font-mono transition-colors">
                          #{player.jerseyNumber}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-600 font-bold">IPL</span>
                      )}
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          isBat ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' :
                          isBowl ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                          isAll ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' :
                          'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}>
                          {player.role || 'Squad'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {player.isCaptain && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                          <Crown className="w-3 h-3 text-amber-400" /> Captain
                        </span>
                      )}
                      {isOverseas && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Plane className="w-3 h-3 text-sky-400" /> Overseas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avatar & Player Name */}
                  <div className="flex items-center gap-3.5 my-2 relative z-10">
                    <div 
                      className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-black text-lg text-white shadow-inner overflow-hidden group-hover:border-slate-500 transition-colors"
                      style={{ borderBottomColor: primaryColor, borderBottomWidth: 3 }}
                    >
                      {player.image ? (
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="tracking-tighter font-mono">{player.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {player.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {player.battingStyle || player.nationality || 'Team Squad Member'}
                      </p>
                      {player.bowlingStyle && (
                        <p className="text-[10px] text-slate-500 truncate">{player.bowlingStyle}</p>
                      )}
                    </div>
                  </div>

                  {/* 4-Format Rating Badges */}
                  <div className="grid grid-cols-4 gap-1.5 my-3 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center font-mono">
                    {(['Test', 'ODI', 'T20I', 'IPL'] as const).map((fmt) => {
                      const r = ratings?.[fmt] || { score: 75, grade: 'B' };
                      return (
                        <div key={fmt} className="py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                          <div className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-400">{fmt}</div>
                          <div className="text-xs font-extrabold text-white mt-0.5">{r.grade}</div>
                          <div className="text-[9px] text-emerald-400">{r.score}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Role-Specific Metric Summary */}
                  <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans uppercase">Matches</div>
                      <div className="text-sm font-bold text-white mt-0.5">{matches || '—'}</div>
                    </div>

                    {isBowl ? (
                      <>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">Wickets</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">{wickets || '0'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">Econ</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">{econ}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">Runs</div>
                          <div className="text-sm font-bold text-sky-400 mt-0.5">{runs || '0'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">{isAll ? 'Wkts' : 'Avg'}</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">{isAll ? wickets : avg}</div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pro Tactical Data Table */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Player</th>
                  <th className="py-3.5 px-2">Role</th>
                  <th className="py-3.5 px-2">Nation</th>
                  <th className="py-3.5 px-2 text-center">Mat</th>
                  <th className="py-3.5 px-2 text-center font-bold text-white">Runs</th>
                  <th className="py-3.5 px-2 text-center">Avg</th>
                  <th className="py-3.5 px-2 text-center">SR</th>
                  <th className="py-3.5 px-2 text-center font-bold text-emerald-400">Wkts</th>
                  <th className="py-3.5 px-2 text-center">Econ</th>
                  <th className="py-3.5 px-3 text-center">IPL Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPlayers.map((player) => {
                  const { runs, wickets, avg, sr, econ, matches, ratings } = extractStats(player);
                  const isOverseas = player.nationality && player.nationality !== 'India' && player.nationality !== 'Indian';
                  const iplRating = ratings?.IPL || { score: 75, grade: 'B' };

                  return (
                    <tr 
                      key={player.id || player.name}
                      onClick={() => handleCardClick(player)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                        {player.jerseyNumber && <span className="text-slate-500 font-mono text-[11px]">#{player.jerseyNumber}</span>}
                        <span>{player.name}</span>
                        {player.isCaptain && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                      </td>
                      <td className="py-3.5 px-2 font-sans text-slate-300">{player.role}</td>
                      <td className="py-3.5 px-2 font-sans text-slate-400">
                        {isOverseas ? (
                          <span className="text-sky-400 flex items-center gap-1">
                            <Plane className="w-3 h-3" /> {player.nationality}
                          </span>
                        ) : 'India'}
                      </td>
                      <td className="py-3.5 px-2 text-center">{matches || '—'}</td>
                      <td className="py-3.5 px-2 text-center font-bold text-sky-400">{runs}</td>
                      <td className="py-3.5 px-2 text-center">{avg}</td>
                      <td className="py-3.5 px-2 text-center">{sr}</td>
                      <td className="py-3.5 px-2 text-center font-bold text-emerald-400">{wickets}</td>
                      <td className="py-3.5 px-2 text-center">{econ}</td>
                      <td className="py-3.5 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded font-extrabold bg-black/40 border border-white/10 text-emerald-400 text-[11px]">
                          {iplRating.grade} {iplRating.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Popup for Details */}
      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer as any}
          isOpen={Boolean(selectedPlayer)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
