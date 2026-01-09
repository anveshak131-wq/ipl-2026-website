'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, X, BarChart2, Trophy, Zap, Flame } from 'lucide-react';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';

interface IPLPlayersPanelProps {
  initialPlayers?: Player[];
  teams: Team[];
}

const roleColors = {
  'Batsman': 'from-orange-500 to-amber-500',
  'Bowler': 'from-blue-500 to-cyan-400',
  'All-Rounder': 'from-purple-500 to-pink-500',
  'Wicket-Keeper': 'from-green-500 to-emerald-400',
  'default': 'from-gray-500 to-gray-400'
};

export default function IPLPlayersPanel({ initialPlayers = [], teams }: IPLPlayersPanelProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(initialPlayers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'matches'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);

  // Fetch players if not provided
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!initialPlayers.length) {
        try {
          const data = await api.getPlayers();
          setPlayers(data);
          setFilteredPlayers(data);
        } catch (error) {
          console.error('Error fetching players:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlayers();
  }, [initialPlayers]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...players];

    // Apply team filter
    if (selectedTeam !== 'all') {
      result = result.filter(player => player.teamId === selectedTeam);
    }

    // Apply role filter
    if (selectedRole !== 'all') {
      result = result.filter(player => player.role?.toLowerCase() === selectedRole.toLowerCase());
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(player => 
        player.name.toLowerCase().includes(term) ||
        player.teamName?.toLowerCase().includes(term) ||
        player.role?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        const aValue = a[sortBy] || 0;
        const bValue = b[sortBy] || 0;
        comparison = (aValue as number) - (bValue as number);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPlayers(result);
  }, [players, searchTerm, selectedTeam, selectedRole, sortBy, sortOrder]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const togglePlayerDetails = (playerId: string) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.colors?.primary || '#7C3AED';
  };

  const getRoleGradient = (role?: string) => {
    if (!role) return roleColors.default;
    return roleColors[role as keyof typeof roleColors] || roleColors.default;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ipl-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <label
              htmlFor="player-search"
              className="block text-sm font-medium sr-only"
            >
              Search players
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="player-search"
              name="player-search"
              type="text"
              placeholder="Search players..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ipl-gold/50 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <label
                htmlFor="team-filter"
                className="block text-sm font-medium sr-only"
              >
                Filter by team
              </label>
              <select
                id="team-filter"
                name="team-filter"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="appearance-none bg-slate-800/50 border border-slate-700 text-white pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ipl-gold/50"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.shortName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="role-filter"
                className="block text-sm font-medium sr-only"
              >
                Filter by role
              </label>
              <select
                id="role-filter"
                name="role-filter"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none bg-slate-800/50 border border-slate-700 text-white pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ipl-gold/50"
              >
                <option value="all">All Roles</option>
                {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map((role) => (
                  <option key={role} value={role.toLowerCase()}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.map((player) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 ${
              expandedPlayer === player.id ? 'ring-2 ring-ipl-gold' : ''
            }`}
          >
            {/* Player Card */}
            <div 
              className="p-5 cursor-pointer"
              onClick={() => togglePlayerDetails(player.id)}
            >
              <div className="flex items-start gap-4">
                {/* Player Avatar */}
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden border-2"
                    style={{ borderColor: getTeamColor(player.teamId) }}
                  >
                    {player.image ? (
                      <Image
                        src={player.image}
                        alt={player.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {player.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    getRoleGradient(player.role).split(' ')[0]
                  }`}>
                    {player.role?.charAt(0) || 'P'}
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-white">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getTeamColor(player.teamId) }}
                        />
                        <span className="text-sm text-gray-300">
                          {teams.find(t => t.id === player.teamId)?.shortName || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div 
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        player.role === 'Batsman' ? 'bg-orange-900/30 text-orange-400' :
                        player.role === 'Bowler' ? 'bg-blue-900/30 text-blue-400' :
                        player.role === 'All-Rounder' ? 'bg-purple-900/30 text-purple-400' :
                        player.role === 'Wicket-Keeper' ? 'bg-green-900/30 text-green-400' :
                        'bg-gray-700/50 text-gray-300'
                      }`}
                    >
                      {player.role || 'Player'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Matches</p>
                      <p className="text-sm font-semibold">{player.matches || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Runs</p>
                      <p className="text-sm font-semibold">{player.runs || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Wickets</p>
                      <p className="text-sm font-semibold">{player.wickets || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedPlayer === player.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="h-px bg-slate-700/50 my-4" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Batting Avg</p>
                        <p className="text-sm font-semibold">{player.battingAverage || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Strike Rate</p>
                        <p className="text-sm font-semibold">
                          {player.strikeRate ? `${player.strikeRate}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Best Bowling</p>
                        <p className="text-sm font-semibold">{player.bestBowling || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Economy</p>
                        <p className="text-sm font-semibold">{player.economy || '-'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <a
                        href={`/players/${player.id}`}
                        className="block w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700/70 rounded-md text-sm font-medium text-center transition-colors"
                      >
                        View Full Profile
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50">
          <div className="text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-medium text-white mb-1">No players found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </div>
      )}
    </div>
  );
}
