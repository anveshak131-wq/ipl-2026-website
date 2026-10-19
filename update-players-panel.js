const fs = require('fs');
const path = require('path');

const targetFile = 'src/components/teams/IPLPlayersPanel.tsx';

// Ensure backup
if (fs.existsSync(targetFile)) {
  fs.copyFileSync(targetFile, targetFile + '.backup');
  console.log('✓ Created backup of existing IPLPlayersPanel.tsx');
}

const modernPanelCode = `'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Crown, Plane, Sparkles, Filter, 
  Grid, List, TrendingUp, Award, Activity, User, ArrowUpDown
} from 'lucide-react';
import { getAllFormatRatings } from '@/lib/formatRatings';

interface IPLPlayersPanelProps {
  players: any[];
  team?: any;
  teamColor?: string;
  onPlayerClick?: (player: any) => void;
}

export default function IPLPlayersPanel({
  players = [],
  team,
  teamColor = '#DA1A32', // Default RCB Crimson
  onPlayerClick
}: IPLPlayersPanelProps) {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyOverseas, setOnlyOverseas] = useState<boolean>(false);
  const [onlyCaptains, setOnlyCaptains] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'rating'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Derive Team Identity
  const primaryColor = team?.primaryColor || teamColor || '#DA1A32';
  const secondaryColor = team?.secondaryColor || '#E5B80B';

  // Helper to extract stats safely across flat stats and careerStats
  const extractStats = (player: any) => {
    const cs = player.careerStats || {};
    const bat = cs.batting?.IPL || {};
    const bowl = cs.bowling?.IPL || {};
    const st = player.stats || {};

    const runs = Number(bat.Runs || bat.runs || st.runs || player.runs || 0);
    const wickets = Number(bowl.Wkts || bowl.Wickets || st.wickets || player.wickets || 0);
    const avg = bat.Avg || bat.Average || (st.average ? Number(st.average).toFixed(2) : (runs > 0 ? (runs / Math.max(1, Number(bat.Inn || 1))).toFixed(2) : '-'));
    const sr = bat.SR || (st.strikeRate ? Number(st.strikeRate).toFixed(2) : '-');
    const econ = bowl.Econ || bowl.Eco || (st.economy ? Number(st.economy).toFixed(2) : '-');
    const matches = Number(bat.M || bowl.M || st.matches || player.matches || 0);
    const highest = bat.HS || bat.Highest || st.highest || '-';
    const hundreds = Number(bat['100'] || bat['100s'] || st.hundreds || 0);
    const fifties = Number(bat['50'] || bat['50s'] || st.fifties || 0);

    const ratings = getAllFormatRatings(player);
    const iplRating = ratings.IPL || { score: 75, grade: 'B' };

    return { runs, wickets, avg, sr, econ, matches, highest, hundreds, fifties, iplRating };
  };

  // Roles categorization
  const roles = [
    { id: 'all', label: 'All Squad', icon: Shield },
    { id: 'batsman', label: 'Batters', icon: TrendingUp },
    { id: 'all-rounder', label: 'All-Rounders', icon: Sparkles },
    { id: 'wicket-keeper', label: 'Wicket-Keepers', icon: User },
    { id: 'bowler', label: 'Bowlers', icon: Activity },
  ];

  // Filtering & Sorting
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        const role = (player.role || '').toLowerCase();
        if (selectedRole === 'batsman' && !(role.includes('batsman') || role.includes('batter'))) return false;
        if (selectedRole === 'bowler' && !role.includes('bowler')) return false;
        if (selectedRole === 'all-rounder' && !(role.includes('all-rounder') || role.includes('allrounder'))) return false;
        if (selectedRole === 'wicket-keeper' && !(role.includes('keeper') || role.includes('wk'))) return false;

        if (onlyOverseas && (player.nationality === 'India' || player.nationality === 'Indian')) return false;
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
        else if (sortBy === 'rating') diff = statsA.iplRating.score - statsB.iplRating.score;
        else diff = (a.name || '').localeCompare(b.name || '');

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [players, selectedRole, searchQuery, onlyOverseas, onlyCaptains, sortBy, sortOrder]);

  // Squad Counters
  const overseasCount = players.filter(p => p.nationality && p.nationality !== 'India' && p.nationality !== 'Indian').length;
  const captain = players.find(p => p.isCaptain);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Quick Analytics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 left-1/4 w-96 h-32 blur-3xl opacity-20 pointer-events-none rounded-full"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Squad Roster</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
                {players.length} Players
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{overseasCount} Overseas</span> • 
              <span>{players.length - overseasCount} Domestic</span>
              {captain && (
                <>
                  • <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Capt: {captain.name}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* View Mode & Sorter Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grid Trading Cards"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Compact Table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sorter Dropdown */}
            <div className="flex items-center bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="rating" className="bg-slate-900">Sort by Rating</option>
                <option value="runs" className="bg-slate-900">Sort by Runs</option>
                <option value="wickets" className="bg-slate-900">Sort by Wickets</option>
                <option value="name" className="bg-slate-900">Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Interactive Search & Role Pill Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Animated Role Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r shadow-lg"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${primaryColor},${secondaryColor})`
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters & Search Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyOverseas(!onlyOverseas)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                onlyOverseas 
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-lg shadow-sky-500/10' 
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Overseas</span>
            </button>

            <button
              onClick={() => setOnlyCaptains(!onlyCaptains)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                onlyCaptains 
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10' 
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Captain</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search player, no, nation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/90 border border-slate-700 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 w-44 md:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Empty State Fallback */}
      {filteredPlayers.length === 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <User className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No players found</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting your search query or role filter.</p>
        </div>
      )}

      {/* 4. GRID VIEW: FUT / Trading Card Experience */}
      {viewMode === 'grid' && (
        <motion.div 
          layout 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <AnimatePresence>
            {filteredPlayers.map((player) => {
              const { runs, wickets, avg, sr, econ, matches, iplRating } = extractStats(player);
              const isOverseas = player.nationality && player.nationality !== 'India' && player.nationality !== 'Indian';
              const roleLower = (player.role || '').toLowerCase();
              const isBat = roleLower.includes('batsman') || roleLower.includes('batter');
              const isBowl = roleLower.includes('bowler');
              const isAll = roleLower.includes('all-rounder') || roleLower.includes('allrounder');
              const isWk = roleLower.includes('keeper');

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => onPlayerClick && onPlayerClick(player)}
                  className="group relative bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Glowing Team Ambient Behind Avatar */}
                  <div 
                    className="absolute -top-16 -right-16 w-36 h-36 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                  />

                  {/* Top Badges Row */}
                  <div className="flex items-start justify-between relative z-10 mb-3">
                    {/* Jersey Watermark & Role */}
                    <div>
                      {player.jerseyNumber ? (
                        <span className="text-xl font-black text-slate-500/40 group-hover:text-amber-400/80 font-mono transition-colors">
                          #{player.jerseyNumber}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">PRO</span>
                      )}
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          isBat ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' :
                          isBowl ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                          isAll ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' :
                          'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}>
                          {player.role || 'Player'}
                        </span>
                      </div>
                    </div>

                    {/* Status Icons: Captain & Overseas */}
                    <div className="flex flex-col items-end gap-1.5">
                      {player.isCaptain && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                          <Crown className="w-3 h-3 text-amber-400" /> Captain
                        </span>
                      )}
                      {isOverseas && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Plane className="w-3 h-3 text-sky-400" /> Overseas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player Identity Block */}
                  <div className="flex items-center gap-3.5 my-2 relative z-10">
                    <div className="relative">
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

                  {/* Role-Weighted Performance Rating Pill */}
                  <div className="my-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      IPL Rating
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{iplRating.score}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-black/40 border border-white/10 text-emerald-400">
                        {iplRating.grade}
                      </span>
                    </div>
                  </div>

                  {/* Tailored Metrics Section */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono">
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

      {/* 5. TABLE VIEW: Tactical Sports Data View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Nation</th>
                  <th className="py-3 px-2 text-center">Mat</th>
                  <th className="py-3 px-2 text-center font-bold text-white">Runs</th>
                  <th className="py-3 px-2 text-center">Avg</th>
                  <th className="py-3 px-2 text-center">SR</th>
                  <th className="py-3 px-2 text-center font-bold text-emerald-400">Wkts</th>
                  <th className="py-3 px-2 text-center">Econ</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPlayers.map((player) => {
                  const { runs, wickets, avg, sr, econ, matches, iplRating } = extractStats(player);
                  const isOverseas = player.nationality && player.nationality !== 'India' && player.nationality !== 'Indian';

                  return (
                    <tr 
                      key={player.id}
                      onClick={() => onPlayerClick && onPlayerClick(player)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        {player.jerseyNumber && <span className="text-slate-500 font-mono text-[11px]">#{player.jerseyNumber}</span>}
                        <span>{player.name}</span>
                        {player.isCaptain && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                      </td>
                      <td className="py-3 px-2 font-sans text-slate-300">{player.role}</td>
                      <td className="py-3 px-2 font-sans text-slate-400">
                        {isOverseas ? (
                          <span className="text-sky-400 flex items-center gap-1">
                            <Plane className="w-3 h-3" /> {player.nationality}
                          </span>
                        ) : 'India'}
                      </td>
                      <td className="py-3 px-2 text-center">{matches || '—'}</td>
                      <td className="py-3 px-2 text-center font-bold text-sky-400">{runs}</td>
                      <td className="py-3 px-2 text-center">{avg}</td>
                      <td className="py-3 px-2 text-center">{sr}</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-400">{wickets}</td>
                      <td className="py-3 px-2 text-center">{econ}</td>
                      <td className="py-3 px-3 text-center font-sans">
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
    </div>
  );
}
`;

fs.writeFileSync(targetFile, modernPanelCode, 'utf8');
console.log('✓ Successfully created redesigned IPLPlayersPanel.tsx!');
