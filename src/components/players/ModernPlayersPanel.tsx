'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, BarChart2, Trophy, Zap, Flame, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { teamColors, roleColors, fadeIn, staggerContainer, cardStyle, buttonStyle, inputStyle } from '@/styles/theme';
import PlayerCardModal from './PlayerCardModal';

interface Player {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  role: string;
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number;
  bowlingAverage: number;
  strikeRate: number;
  economy: number;
  bestBowling: string;
  highestScore: string;
  image?: string;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

interface ModernPlayersPanelProps {
  initialPlayers?: Player[];
  teams: Team[];
}

export default function ModernPlayersPanel({ initialPlayers = [], teams }: ModernPlayersPanelProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(initialPlayers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'matches'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(-1);

  // Fetch players if not provided
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!initialPlayers.length) {
        try {
          const data = await fetch('/api/players').then(res => res.json());
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

  const openPlayerModal = (player: Player, index: number) => {
    setSelectedPlayer(player);
    setSelectedPlayerIndex(index);
  };

  const closePlayerModal = () => {
    setSelectedPlayer(null);
    setSelectedPlayerIndex(-1);
  };

  const navigatePlayer = (direction: 'prev' | 'next') => {
    if (selectedPlayerIndex === -1) return;
    
    let newIndex = direction === 'next' ? selectedPlayerIndex + 1 : selectedPlayerIndex - 1;
    
    // Wrap around to start/end of list
    if (newIndex >= filteredPlayers.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredPlayers.length - 1;
    
    setSelectedPlayer(filteredPlayers[newIndex]);
    setSelectedPlayerIndex(newIndex);
  };

  const getRoleGradient = (role?: string) => {
    if (!role) return roleColors.default;
    return roleColors[role as keyof typeof roleColors] || roleColors.default;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <motion.div 
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          IPL 2026 Players
        </h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search players by name, team, or role..."
              className={inputStyle + " pl-10"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="appearance-none bg-slate-800/50 border border-slate-700 text-white pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.shortName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none bg-slate-800/50 border border-slate-700 text-white pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Roles</option>
                {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map((role) => (
                  <option key={role} value={role.toLowerCase()}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Players', value: filteredPlayers.length, icon: <Users className="w-5 h-5" /> },
            { 
              label: 'Top Run Scorer', 
              value: [...filteredPlayers].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0]?.name || '-',
              icon: <Zap className="w-5 h-5" /> 
            },
            { 
              label: 'Top Wicket Taker', 
              value: [...filteredPlayers].sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0]?.name || '-',
              icon: <Trophy className="w-5 h-5" /> 
            },
            { 
              label: 'Best Average', 
              value: [...filteredPlayers].sort((a, b) => (b.battingAverage || 0) - (a.battingAverage || 0))[0]?.name || '-',
              icon: <BarChart2 className="w-5 h-5" /> 
            },
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50"
              variants={fadeIn}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-lg font-semibold mt-1 truncate" title={String(stat.value)}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Players Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {filteredPlayers.map((player, index) => {
          const team = teams.find(t => t.id === player.teamId);
          const teamColor = team ? teamColors[team.shortName] || '#7C3AED' : '#7C3AED';
          
          return (
            <motion.div
              key={player.id}
              variants={fadeIn}
              className={cardStyle + " hover:shadow-xl hover:-translate-y-1 cursor-pointer"}
              onClick={() => openPlayerModal(player, index)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Player Avatar */}
                  <div className="relative">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden border-2"
                      style={{ borderColor: teamColor }}
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
                    <div 
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        getRoleGradient(player.role).split(' ')[0]
                      }`}
                    >
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
                            style={{ backgroundColor: teamColor }}
                          />
                          <span className="text-sm text-slate-300">
                            {team?.shortName || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div 
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          player.role === 'Batsman' ? 'bg-orange-900/30 text-orange-400' :
                          player.role === 'Bowler' ? 'bg-blue-900/30 text-blue-400' :
                          player.role === 'All-Rounder' ? 'bg-purple-900/30 text-purple-400' :
                          player.role === 'Wicket-Keeper' ? 'bg-green-900/30 text-green-400' :
                          'bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        {player.role || 'Player'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div>
                        <p className="text-xs text-slate-400">Matches</p>
                        <p className="text-sm font-semibold">{player.matches || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Runs</p>
                        <p className="text-sm font-semibold">{player.runs || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Wickets</p>
                        <p className="text-sm font-semibold">{player.wickets || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4 flex justify-end">
                  <button 
                    className="text-sm flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlayerModal(player, index);
                    }}
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredPlayers.length === 0 && (
        <motion.div 
          className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50"
          variants={fadeIn}
        >
          <div className="text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-medium text-white mb-1">No players found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        </motion.div>
      )}

      {/* Player Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerCardModal
            isOpen={!!selectedPlayer}
            onClose={closePlayerModal}
            player={selectedPlayer}
            teamColor={teams.find(t => t.id === selectedPlayer.teamId) ? 
              teamColors[teams.find(t => t.id === selectedPlayer.teamId)?.shortName || ''] : '#7C3AED'}
            onNext={() => navigatePlayer('next')}
            onPrev={() => navigatePlayer('prev')}
            hasNext={selectedPlayerIndex < filteredPlayers.length - 1}
            hasPrev={selectedPlayerIndex > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
