'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'matches'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch player stats from scorecards
  const fetchPlayerStats = async () => {
    try {
      // Fetch both batting and bowling stats for all leagues
      const [iplBatting, iplBowling, wplBatting, wplBowling] = await Promise.all([
        fetch('/api/stats?league=ipl&type=batting'),
        fetch('/api/stats?league=ipl&type=bowling'),
        fetch('/api/stats?league=wpl&type=batting'),
        fetch('/api/stats?league=wpl&type=bowling')
      ]);
      
      const [iplBattingData, iplBowlingData, wplBattingData, wplBowlingData] = await Promise.all([
        iplBatting.json(),
        iplBowling.json(),
        wplBatting.json(),
        wplBowling.json()
      ]);
      
      const allBattingStats = [
        ...(iplBattingData.battingStats || []),
        ...(wplBattingData.battingStats || [])
      ];
      
      const allBowlingStats = [
        ...(iplBowlingData.bowlingStats || []),
        ...(wplBowlingData.bowlingStats || [])
      ];
      
      // Merge batting and bowling stats by playerId
      const mergedStats = allBattingStats.map(battingStat => {
        const bowlingStat = allBowlingStats.find(b => b.playerId === battingStat.playerId);
        return {
          ...battingStat,
          wickets: bowlingStat?.wickets || 0,
          bowlingAverage: bowlingStat?.average || 0,
          economy: bowlingStat?.economy || 0,
          bestBowling: bowlingStat?.bestBowling || '0/0'
        };
      });
      
      setPlayerStats(mergedStats);
      console.log('Fetched player stats:', mergedStats.length);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  // Function to get real player stats
  const getPlayerRealStats = (player: Player) => {
    const playerStat = playerStats.find(stat => 
      stat.playerId === player.id || 
      stat.playerId === String(player.id) ||
      stat.playerName === player.name
    );
    
    if (playerStat) {
      return {
        ...player,
        matches: playerStat.matches || 0,
        runs: playerStat.runs || 0,
        wickets: playerStat.wickets || 0,
        average: playerStat.average || 0,
        strikeRate: playerStat.strikeRate || 0,
        highestScore: playerStat.highestScore || 0,
        fifties: playerStat.fifties || 0,
        hundreds: playerStat.hundreds || 0,
        fours: playerStat.fours || 0,
        sixes: playerStat.sixes || 0,
        bowlingAverage: playerStat.bowlingAverage || 0,
        economy: playerStat.economy || 0,
        bestBowling: playerStat.bestBowling || '0/0'
      } as any;
    }
    
    return player as any;
  };

  // Fetch players and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(),
          api.getTeams()
        ]);
        setPlayers(playersData);
        setFilteredPlayers(playersData);
        setTeams(teamsData);
        
        // Fetch player stats after getting players
        await fetchPlayerStats();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...players];

    // Apply team filter
    if (selectedTeam !== 'all') {
      result = result.filter(player => player.teamId === selectedTeam);
    }

    // Apply role filter
    if (selectedRole !== 'all') {
      result = result.filter(player => player.role?.toLowerCase() === selectedRole);
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

  const toggleSortOrder = (key: typeof sortBy) => {
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTeam('all');
    setSelectedRole('all');
  };

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.colors?.primary || '#7C3AED';
  };

  const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
  const stats = [
    { key: 'matches', label: 'Matches' },
    { key: 'runs', label: 'Runs' },
    { key: 'wickets', label: 'Wickets' },
    { key: 'highestScore', label: 'Best' },
    { key: 'battingAverage', label: 'Avg' },
    { key: 'strikeRate', label: 'SR' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-ipl-gold animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            IPL 2026 Players
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore the complete roster of players participating in IPL 2026. Filter by team, role, or search for specific players.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700/50">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ipl-gold/50 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-grow">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ipl-gold/50 text-white appearance-none"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.shortName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              <div className="relative flex-grow">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ipl-gold/50 text-white appearance-none"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role.toLowerCase()}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {(searchTerm || selectedTeam !== 'all' || selectedRole !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-400">Sort by:</span>
            {[
              { key: 'name' as const, label: 'Name' },
              { key: 'matches' as const, label: 'Matches' },
              { key: 'runs' as const, label: 'Runs' },
              { key: 'wickets' as const, label: 'Wickets' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSortOrder(key)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sortBy === key
                    ? 'bg-ipl-gold/20 text-ipl-gold font-medium'
                    : 'text-gray-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {label}
                  {sortBy === key && (
                    <ChevronUp 
                      className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      size={16} 
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-medium">{filteredPlayers.length}</span> players
            {selectedTeam !== 'all' && (
              <span className="ml-2">
                in <span className="text-white font-medium">
                  {teams.find(t => t.id === selectedTeam)?.shortName || 'Team'}
                </span>
              </span>
            )}
            {selectedRole !== 'all' && (
              <span className="ml-2">
                as <span className="text-white font-medium capitalize">{selectedRole}</span>
              </span>
            )}
          </p>
        </div>

        {/* Players Grid */}
        {filteredPlayers.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPlayers.map((player) => {
              const teamColor = getTeamColor(player.teamId);
              const team = teams.find(t => t.id === player.teamId);
              
              return (
                <motion.div
                  key={player.id}
                  variants={item}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Player Card */}
                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => togglePlayerDetails(player.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Player Image */}
                      <div className="relative flex-shrink-0">
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
                      </div>

                      {/* Player Info */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-white">{player.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {team && (
                                <div 
                                  className="w-5 h-5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: teamColor }}
                                />
                              )}
                              <span className="text-sm text-gray-300">
                                {team?.shortName || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div 
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              player.role === 'Batsman' ? 'bg-green-900/30 text-green-400' :
                              player.role === 'Bowler' ? 'bg-blue-900/30 text-blue-400' :
                              player.role === 'All-Rounder' ? 'bg-purple-900/30 text-purple-400' :
                              player.role === 'Wicket-Keeper' ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-gray-700/50 text-gray-300'
                            }`}
                          >
                            {player.role || 'Player'}
                          </div>
                        </div>

                        {/* Stats Preview */}
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div>
                            <p className="text-xs text-gray-400">Matches</p>
                            <p className="text-sm font-semibold">{getPlayerRealStats(player).matches || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Runs</p>
                            <p className="text-sm font-semibold">{getPlayerRealStats(player).runs || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Wickets</p>
                            <p className="text-sm font-semibold">{getPlayerRealStats(player).wickets || 0}</p>
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
                            {stats.map((stat) => (
                              <div key={stat.key} className="text-center">
                                <p className="text-xs text-gray-400">{stat.label}</p>
                                <p className="text-sm font-semibold">
                                  {player[stat.key as keyof typeof player] || '0'}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <button
                              onClick={() => {
                                // Navigate to player detail page
                                window.location.href = `/players/${player.id}`;
                              }}
                              className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700/70 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              View Full Profile
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50">
            <div className="text-gray-400 mb-2">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-medium text-white mb-1">No players found</h3>
              <p className="max-w-md mx-auto">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <X size={16} />
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
