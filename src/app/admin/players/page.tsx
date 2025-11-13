'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';

// Sort icons
const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Cricket-playing countries
const CRICKET_COUNTRIES = [
  'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 
  'Sri Lanka', 'West Indies', 'Bangladesh', 'Afghanistan', 'Ireland', 
  'Netherlands', 'Scotland', 'Zimbabwe', 'Nepal', 'Oman', 'UAE', 'USA',
  'Canada', 'Kenya', 'Namibia', 'Papua New Guinea', 'Hong Kong'
];

// Bowling styles
const BOWLING_STYLES = [
  'Right-arm fast',
  'Right-arm fast-medium', 
  'Right-arm medium-fast',
  'Right-arm medium',
  'Right-arm off-break',
  'Right-arm leg-break',
  'Left-arm fast',
  'Left-arm fast-medium',
  'Left-arm medium-fast', 
  'Left-arm medium',
  'Left-arm orthodox',
  'Left-arm unorthodox',
  'Right-arm wrist spin',
  'Right-arm finger spin',
  'N/A (Batsman)'
];

// Batting styles
const BATTING_STYLES = [
  'Right-handed bat',
  'Left-handed bat',
  'Right-hand bat',
  'Left-hand bat',
  'Opening batsman',
  'Top-order batsman',
  'Middle-order batsman',
  'Lower-order batsman',
  'Finisher',
  'Pinch hitter',
  'All-rounder'
];

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility

export default function AdminPlayers() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<{
    name: string;
    role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
    teamId: string;
    age: string;
    nationality: string;
    jerseyNumber: string;
    isCaptain: boolean;
    bowlingStyle: string;
    battingStyle: string;
    stats: {
      matches: string;
      runs: string;
      wickets: string;
      average: string;
      bowlingAverage: string;
      strikeRate: string;
      economy: string;
      highest: string;
      fours: string;
      sixes: string;
      fifties: string;
      hundreds: string;
      bestBowling: string;
    };
  }>({
    name: '',
    role: 'Batsman',
    teamId: '',
    age: '',
    nationality: '',
    jerseyNumber: '',
    isCaptain: false,
    bowlingStyle: 'N/A (Batsman)',
    battingStyle: 'Right-handed bat',
    stats: {
      matches: '',
      runs: '',
      wickets: '',
      average: '',
      bowlingAverage: '',
      strikeRate: '',
      economy: '',
      highest: '',
      fours: '',
      sixes: '',
      fifties: '',
      hundreds: '',
      bestBowling: ''
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const playersData = await api.getPlayers();
      const teamsData = await api.getTeams();
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      role: 'Batsman',
      teamId: '',
      age: '',
      nationality: '',
      jerseyNumber: '',
      isCaptain: false,
      bowlingStyle: 'N/A (Batsman)',
      battingStyle: 'Right-handed bat',
      stats: {
        matches: '',
        runs: '',
        wickets: '',
        average: '',
        bowlingAverage: '',
        strikeRate: '',
        economy: '',
        highest: '',
        fours: '',
        sixes: '',
        fifties: '',
        hundreds: '',
        bestBowling: ''
      }
    });
    setShowForm(true);
  };

  // Calculate bowling average from economy and wickets if not provided
  const calculateBowlingAverage = (economy: number, wickets: number, matches: number): number => {
    if (wickets === 0) return 0;
    // Estimate overs bowled: assume average 4 overs per match for bowlers
    const estimatedOvers = matches * 4;
    const runsConceded = economy * estimatedOvers;
    return runsConceded / wickets;
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    // Calculate bowling average if not available (for backward compatibility)
    const bowlingAvg = player.stats.bowlingAverage ?? 
      (player.stats.wickets > 0 
        ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
        : 0);
    
    setFormData({
      name: player.name,
      role: player.role,
      teamId: player.teamId,
      age: player.age.toString(),
      nationality: player.nationality,
      jerseyNumber: player.jerseyNumber.toString(),
      isCaptain: player.isCaptain || false,
      bowlingStyle: player.bowlingStyle || 'N/A (Batsman)',
      battingStyle: player.battingStyle || 'Right-handed bat',
      stats: {
        matches: player.stats.matches.toString(),
        runs: player.stats.runs.toString(),
        wickets: player.stats.wickets.toString(),
        average: player.stats.average.toString(),
        bowlingAverage: bowlingAvg.toString(),
        strikeRate: player.stats.strikeRate.toString(),
        economy: player.stats.economy.toString(),
        highest: player.stats.highest.toString(),
        fours: player.stats.fours.toString(),
        sixes: player.stats.sixes.toString(),
        fifties: player.stats.fifties.toString(),
        hundreds: player.stats.hundreds.toString(),
        bestBowling: player.stats.bestBowling
      }
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const playerData = {
        ...formData,
        age: parseInt(formData.age),
        jerseyNumber: parseInt(formData.jerseyNumber),
        isCaptain: formData.isCaptain,
        bowlingStyle: formData.bowlingStyle,
        battingStyle: formData.battingStyle,
        stats: {
          matches: parseInt(formData.stats.matches) || 0,
          runs: parseInt(formData.stats.runs) || 0,
          wickets: parseInt(formData.stats.wickets) || 0,
          average: parseFloat(formData.stats.average) || 0,
          bowlingAverage: parseFloat(formData.stats.bowlingAverage) || 0,
          strikeRate: parseFloat(formData.stats.strikeRate) || 0,
          economy: parseFloat(formData.stats.economy) || 0,
          highest: parseInt(formData.stats.highest) || 0,
          fours: parseInt(formData.stats.fours) || 0,
          sixes: parseInt(formData.stats.sixes) || 0,
          fifties: parseInt(formData.stats.fifties) || 0,
          hundreds: parseInt(formData.stats.hundreds) || 0,
          bestBowling: formData.stats.bestBowling || '-',
        }
      };

      if (editingPlayer) {
        // Update existing player
        const response = await fetch('/api/players', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...playerData, id: editingPlayer.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to update player');
        }
      } else {
        // Create new player
        const response = await fetch('/api/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(playerData),
        });

        if (!response.ok) {
          throw new Error('Failed to create player');
        }
      }

      // Refresh players list
      await fetchData();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player. Please try again.');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      try {
        const response = await fetch(`/api/players?id=${playerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete player');
        }

        // Refresh players list
        await fetchData();
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Failed to delete player. Please try again.');
      }
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort players
  let filteredPlayers = selectedTeam === 'all' 
    ? players 
    : players.filter(player => player.teamId === selectedTeam);

  // Apply sorting
  if (sortField) {
    filteredPlayers = [...filteredPlayers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'battingAverage':
          aValue = a.stats.average || 0;
          bValue = b.stats.average || 0;
          break;
        case 'bowlingAverage':
          // Calculate bowling average if not available
          aValue = a.stats.bowlingAverage ?? 
            (a.stats.wickets > 0 
              ? calculateBowlingAverage(a.stats.economy, a.stats.wickets, a.stats.matches)
              : 0);
          bValue = b.stats.bowlingAverage ?? 
            (b.stats.wickets > 0 
              ? calculateBowlingAverage(b.stats.economy, b.stats.wickets, b.stats.matches)
              : 0);
          break;
        case 'runs':
          aValue = a.stats.runs || 0;
          bValue = b.stats.runs || 0;
          break;
        case 'wickets':
          aValue = a.stats.wickets || 0;
          bValue = b.stats.wickets || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/players" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/players" />
      
      <div className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Players
            </h1>
            <button 
              onClick={handleAddPlayer}
              className="ipl-button"
            >
              Add New Player
            </button>
          </div>

          {/* Team Filter Dropdown */}
          <div className="mb-6 relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="glass-effect px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-3 min-w-[280px] hover:bg-white/10 transition-all duration-300 group"
            >
              <svg 
                className="w-5 h-5 text-ipl-gold" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="flex-1 text-left">
                {selectedTeam === 'all' 
                  ? 'All Teams' 
                  : teams.find(t => t.id === selectedTeam)?.name || 'Select Team'
                }
              </span>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div 
              className={`absolute left-0 right-0 mt-2 glass-effect rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top z-10 ${
                isDropdownOpen 
                  ? 'opacity-100 scale-y-100 max-h-[400px]' 
                  : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
              }`}
            >
              <div className="py-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-ipl-gold/50 scrollbar-track-white/5">
                {/* All Teams Option */}
                <button
                  onClick={() => {
                    setSelectedTeam('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center space-x-3 ${
                    selectedTeam === 'all' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">All Teams</div>
                    <div className="text-xs text-gray-400">{players.length} players</div>
                  </div>
                  {selectedTeam === 'all' && (
                    <svg className="w-5 h-5 text-ipl-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Team Options */}
                <div className="border-t border-white/10 mt-2 pt-2">
                  {teams.map((team) => {
                    const teamPlayersCount = players.filter(p => p.teamId === team.id).length;
                    return (
                      <button
                        key={team.id}
                        onClick={() => {
                          setSelectedTeam(team.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${
                          selectedTeam === team.id ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                        }`}
                      >
                        <div 
                          className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm shadow-lg"
                          style={{ backgroundColor: team.colors.primary }}
                        >
                          {team.shortName}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-xs text-gray-400">
                            {teamPlayersCount} player{teamPlayersCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {selectedTeam === team.id && (
                          <svg className="w-5 h-5 text-ipl-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Players Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Name
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Jersey
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('runs')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Runs
                        {sortField === 'runs' && (
                          sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('wickets')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Wickets
                        {sortField === 'wickets' && (
                          sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('battingAverage')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Batting Avg
                        {sortField === 'battingAverage' && (
                          sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('bowlingAverage')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Bowling Avg
                        {sortField === 'bowlingAverage' && (
                          sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      SR
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      4s/6s
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      50s/100s
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      BBM
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPlayers.map((player) => {
                    const team = teams.find(t => t.id === player.teamId);
                    return (
                      <tr key={player.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">
                              {player.name}
                            </span>
                            <div className="flex space-x-1">
                              {player.isCaptain && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  ⭐ C
                                </span>
                              )}
                              {player.nationality !== 'India' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  🌍 Foreign
                                </span>
                              )}
                              {player.role === 'Wicket-keeper' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                  🧤 WK
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                            {player.jerseyNumber || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ipl-purple/20 text-ipl-purple border border-ipl-purple/30">
                            {player.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {team?.shortName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.runs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.wickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.average.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {(() => {
                            const bowlingAvg = player.stats.bowlingAverage ?? 
                              (player.stats.wickets > 0 
                                ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
                                : 0);
                            return bowlingAvg > 0 ? bowlingAvg.toFixed(2) : '-';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.strikeRate.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.fours}/{player.stats.sixes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.fifties}/{player.stats.hundreds}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.bestBowling || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditPlayer(player)}
                              className="text-ipl-gold hover:text-ipl-purple transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Player Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-effect rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingPlayer ? 'Edit Player' : 'Add New Player'}
                    </h2>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Player Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter player name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket-keeper">Wicket-keeper</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Team
                        </label>
                        <select
                          value={formData.teamId}
                          onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                          required
                        >
                          <option value="">Select a team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter age"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nationality
                        </label>
                        <select
                          value={formData.nationality}
                          onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                          required
                        >
                          <option value="">Select nationality</option>
                          {CRICKET_COUNTRIES.map(country => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Jersey Number
                        </label>
                        <input
                          type="number"
                          value={formData.jerseyNumber}
                          onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter jersey number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bowling Style
                        </label>
                        <select
                          value={formData.bowlingStyle}
                          onChange={(e) => setFormData({...formData, bowlingStyle: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          {BOWLING_STYLES.map(style => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Batting Style
                        </label>
                        <select
                          value={formData.battingStyle}
                          onChange={(e) => setFormData({...formData, battingStyle: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          {BATTING_STYLES.map(style => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isCaptain"
                          checked={formData.isCaptain}
                          onChange={(e) => setFormData({...formData, isCaptain: e.target.checked})}
                          className="w-4 h-4 bg-white/10 border border-white/20 rounded text-ipl-gold focus:outline-none focus:border-ipl-gold"
                        />
                        <label htmlFor="isCaptain" className="ml-2 text-sm font-medium text-gray-300">
                          Is Captain
                        </label>
                      </div>

                      </div>

                    {/* Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Player Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Matches
                          </label>
                          <input
                            type="number"
                            value={formData.stats.matches}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, matches: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Runs
                          </label>
                          <input
                            type="number"
                            value={formData.stats.runs}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, runs: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Wickets
                          </label>
                          <input
                            type="number"
                            value={formData.stats.wickets}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, wickets: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Batting Average
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.average}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, average: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bowling Average
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.bowlingAverage}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bowlingAverage: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500 mt-1">Runs conceded per wicket</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Strike Rate
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.strikeRate}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, strikeRate: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Economy
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.economy}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, economy: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Highest Score
                          </label>
                          <input
                            type="number"
                            value={formData.stats.highest}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, highest: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fours
                          </label>
                          <input
                            type="number"
                            value={formData.stats.fours}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fours: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sixes
                          </label>
                          <input
                            type="number"
                            value={formData.stats.sixes}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, sixes: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fifties (50s)
                          </label>
                          <input
                            type="number"
                            value={formData.stats.fifties}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fifties: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hundreds (100s)
                          </label>
                          <input
                            type="number"
                            value={formData.stats.hundreds}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, hundreds: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Best Bowling (BBM)
                          </label>
                          <input
                            type="text"
                            value={formData.stats.bestBowling}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bestBowling: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="e.g., 4/21 or 3/45"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-4 pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="ipl-button flex-1"
                      >
                        {editingPlayer ? 'Update Player' : 'Add Player'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
