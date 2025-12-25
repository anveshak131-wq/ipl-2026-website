'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import { Search, Filter, Edit2, X, TrendingDown, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, Calendar, BarChart3, Target as TargetIcon, Award as AwardIcon, Zap as ZapIcon, Hash, Activity, Gauge, LayoutGrid, Table2 } from 'lucide-react';

const BowlingStatsPage = () => {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const { players, teams, loading, error, updatePlayer, refreshData, lastUpdated } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortField, setSortField] = useState<string>('wickets');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'teams'>('table');
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    age: '',
    jerseyNumber: '',
    stats: {
      matches: '',
      bowlingInnings: '',
      balls: '',
      maidens: '',
      wickets: '',
      runsConceded: '',
      bowlingAverage: '',
      bowlingStrikeRate: '',
      economy: '',
      bestBowling: '',
      fiveWickets: ''
    }
  });

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        setUserRole(role);

        if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/ipl-admin-2026');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ipl-admin-2026');
      }
    };

    checkAuth();
  }, [router]);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingPlayer(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        handleCancelEdit();
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEditModal, handleCancelEdit]);

  // Listen for real-time data updates
  useEffect(() => {
    const handleDataUpdate = async (event: CustomEvent) => {
      const { type } = event.detail || {};
      
      if (type === 'player-updated' || type === 'player-created' || type === 'player-deleted') {
        console.log('Bowling stats: Data update detected, refreshing...');
        // Immediate refresh
        await refreshData();
      }
    };

    window.addEventListener('admin-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('admin-data-updated', handleDataUpdate as EventListener);
    };
  }, [refreshData]);

  // Also refresh when lastUpdated changes (from context)
  useEffect(() => {
    // This will trigger a re-render when context data is updated
    console.log('Bowling stats: Data updated at', new Date(lastUpdated).toLocaleTimeString());
  }, [lastUpdated]);

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name || '',
      role: player.role || '',
      age: player.age || '',
      jerseyNumber: player.jerseyNumber || '',
      stats: {
        matches: player.stats?.matches > 0 ? player.stats.matches : '',
        bowlingInnings: player.stats?.bowlingInnings > 0 ? player.stats.bowlingInnings : '',
        balls: player.stats?.balls > 0 ? player.stats.balls : '',
        maidens: player.stats?.maidens > 0 ? player.stats.maidens : '',
        wickets: player.stats?.wickets > 0 ? player.stats.wickets : '',
        runsConceded: player.stats?.runsConceded > 0 ? player.stats.runsConceded : '',
        bowlingAverage: player.stats?.bowlingAverage || '',
        bowlingStrikeRate: player.stats?.bowlingStrikeRate || '',
        economy: player.stats?.economy || '',
        bestBowling: player.stats?.bestBowling || '',
        fiveWickets: player.stats?.fiveWickets > 0 ? player.stats.fiveWickets : ''
      }
    });
    setShowEditModal(true);
  };

  const handleSavePlayer = async () => {
    try {
      // Extract numeric values for calculations
      const wickets = editForm.stats.wickets === '' ? (editingPlayer.stats?.wickets || 0) : (typeof editForm.stats.wickets === 'number' ? editForm.stats.wickets : parseInt(editForm.stats.wickets) || 0);
      const runsConceded = editForm.stats.runsConceded === '' ? (editingPlayer.stats?.runsConceded || 0) : (typeof editForm.stats.runsConceded === 'number' ? editForm.stats.runsConceded : parseInt(editForm.stats.runsConceded) || 0);
      const balls = editForm.stats.balls === '' ? (editingPlayer.stats?.balls || 0) : (typeof editForm.stats.balls === 'number' ? editForm.stats.balls : parseInt(editForm.stats.balls) || 0);
      const overs = balls / 6; // Convert balls to overs for economy calculation

      // User wants to manually enter values - prioritize manual input
      let bowlingAverageNum = 0;
      let economyNum = 0;
      let bowlingStrikeRateNum = 0;

      // If user manually entered bowling average, use it
      if (editForm.stats.bowlingAverage !== '' && editForm.stats.bowlingAverage !== '0' && editForm.stats.bowlingAverage !== '-') {
        const parsed = parseFloat(editForm.stats.bowlingAverage);
        if (!isNaN(parsed)) {
          bowlingAverageNum = parsed;
        }
      }

      // If user manually entered economy, use it
      if (editForm.stats.economy !== '' && editForm.stats.economy !== '0' && editForm.stats.economy !== '-') {
        const parsed = parseFloat(editForm.stats.economy);
        if (!isNaN(parsed)) {
          economyNum = parsed;
        }
      }

      // If user manually entered bowling strike rate, use it
      if (editForm.stats.bowlingStrikeRate !== '' && editForm.stats.bowlingStrikeRate !== '0' && editForm.stats.bowlingStrikeRate !== '-') {
        const parsed = parseFloat(editForm.stats.bowlingStrikeRate);
        if (!isNaN(parsed)) {
          bowlingStrikeRateNum = parsed;
        }
      }

      // Only calculate if user didn't provide manual values
      if (bowlingAverageNum === 0) {
        // Bowling Average = Runs Conceded / Wickets
        if (wickets > 0 && runsConceded >= 0) {
          bowlingAverageNum = runsConceded / wickets;
        } else {
          bowlingAverageNum = editingPlayer.stats?.bowlingAverage || 0;
        }
      }

      if (economyNum === 0) {
        // Economy = (Runs Conceded * 6) / Balls
        if (balls > 0 && runsConceded >= 0) {
          economyNum = (runsConceded * 6) / balls;
        } else {
          economyNum = editingPlayer.stats?.economy || 0;
        }
      }

      if (bowlingStrikeRateNum === 0) {
        // Bowling Strike Rate = Balls / Wickets
        if (wickets > 0 && balls > 0) {
          bowlingStrikeRateNum = balls / wickets;
        } else {
          bowlingStrikeRateNum = 0;
        }
      }

      // For string display fields - use manual input if provided, otherwise format the numeric value
      const bowlingAverageStr = editForm.stats.bowlingAverage !== '' 
        ? editForm.stats.bowlingAverage 
        : (bowlingAverageNum > 0 ? bowlingAverageNum.toFixed(2) : (editingPlayer.stats?.bowlingAverage || ''));
      
      const economyStr = editForm.stats.economy !== '' 
        ? editForm.stats.economy 
        : (economyNum > 0 ? economyNum.toFixed(2) : (editingPlayer.stats?.economy || ''));
      
      const bowlingStrikeRateStr = editForm.stats.bowlingStrikeRate !== '' 
        ? editForm.stats.bowlingStrikeRate 
        : (bowlingStrikeRateNum > 0 ? bowlingStrikeRateNum.toFixed(1) : (editingPlayer.stats?.bowlingStrikeRate || ''));

      // Prepare stats object with proper type conversions
      const stats = {
        ...editingPlayer.stats, // Preserve existing stats
        matches: editForm.stats.matches === '' ? (editingPlayer.stats?.matches || 0) : (typeof editForm.stats.matches === 'number' ? editForm.stats.matches : parseInt(editForm.stats.matches) || 0),
        bowlingInnings: editForm.stats.bowlingInnings === '' ? (editingPlayer.stats?.bowlingInnings || 0) : (typeof editForm.stats.bowlingInnings === 'number' ? editForm.stats.bowlingInnings : parseInt(editForm.stats.bowlingInnings) || 0),
        balls: balls,
        maidens: editForm.stats.maidens === '' ? (editingPlayer.stats?.maidens || 0) : (typeof editForm.stats.maidens === 'number' ? editForm.stats.maidens : parseInt(editForm.stats.maidens) || 0),
        wickets: wickets,
        runsConceded: runsConceded,
        // String versions for admin display
        bowlingAverage: bowlingAverageStr,
        bowlingStrikeRate: bowlingStrikeRateStr,
        economy: economyStr,
        bestBowling: editForm.stats.bestBowling === '' ? (editingPlayer.stats?.bestBowling || '') : (editForm.stats.bestBowling || ''),
        fiveWickets: editForm.stats.fiveWickets === '' ? (editingPlayer.stats?.fiveWickets || 0) : (typeof editForm.stats.fiveWickets === 'number' ? editForm.stats.fiveWickets : parseInt(editForm.stats.fiveWickets) || 0)
      };

      const updatedPlayer = {
        ...editingPlayer, // Preserve ALL existing player fields
        id: editingPlayer.id,
        name: editForm.name || editingPlayer.name,
        role: editForm.role || editingPlayer.role,
        age: editForm.age || editingPlayer.age,
        jerseyNumber: editForm.jerseyNumber || editingPlayer.jerseyNumber,
        teamId: editingPlayer.teamId,
        league: editingPlayer.league,
        // Preserve all other fields that aren't being edited
        dateOfBirth: editingPlayer.dateOfBirth,
        nationality: editingPlayer.nationality,
        battingStyle: editingPlayer.battingStyle,
        bowlingStyle: editingPlayer.bowlingStyle,
        isCaptain: editingPlayer.isCaptain,
        allrounderType: editingPlayer.allrounderType,
        transferInfo: editingPlayer.transferInfo,
        stats: {
          ...stats,
          // CRITICAL: Explicitly ensure numeric fields are numbers and are always set
          bowlingAverage: typeof bowlingAverageNum === 'number' ? bowlingAverageNum : parseFloat(String(bowlingAverageNum)) || 0,
          economy: typeof economyNum === 'number' ? economyNum : parseFloat(String(economyNum)) || 0
        }
      };

      // Debug logging
      console.log('Updating bowling player with stats:', {
        bowlingAverage: updatedPlayer.stats.bowlingAverage,
        economy: updatedPlayer.stats.economy,
        bowlingStrikeRate: updatedPlayer.stats.bowlingStrikeRate,
        wickets,
        runsConceded,
        balls
      });

      await updatePlayer(editingPlayer.id, updatedPlayer);
      
      // Dispatch event first, then refresh
      window.dispatchEvent(new CustomEvent('admin-data-updated', {
        detail: { type: 'player-updated', playerId: editingPlayer.id }
      }));
      
      // Refresh data after dispatching event
      await refreshData();
      
      setShowEditModal(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Failed to update player:', error);
      alert(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('stats.')) {
      const statField = field.replace('stats.', '');
      setEditForm(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statField]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort players - Only show IPL players (WPL doesn't need stats)
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      // Only show IPL players
      const isIPL = (player.league || 'ipl') === 'ipl';
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.teamId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === 'all' || player.teamId === selectedTeam;
      // Show all players, not just those with existing stats
      return isIPL && matchesSearch && matchesTeam;
    });

    filtered.sort((a, b) => {
      // First, sort by role/type priority
      const getRolePriority = (player: any) => {
        if (player.role === 'Batsman') return 1;
        if (player.role === 'Wicket-keeper') return 2;
        if (player.role === 'All-rounder' && player.allrounderType === 'Batting All-rounder') return 3;
        if (player.role === 'All-rounder' && player.allrounderType === 'Bowling All-rounder') return 4;
        if (player.role === 'All-rounder') return 5; // Generic all-rounder
        if (player.role === 'Bowler') return 6;
        return 99; // Unknown role
      };

      const aRolePriority = getRolePriority(a);
      const bRolePriority = getRolePriority(b);
      
      if (aRolePriority !== bRolePriority) {
        return aRolePriority - bRolePriority;
      }

      // If same role, sort by age (highest age first)
      // First try to use age field directly
      const aAge = a.age || 0;
      const bAge = b.age || 0;
      
      if (aAge > 0 || bAge > 0) {
        if (aAge !== bAge) {
          return bAge - aAge; // Highest age first (descending)
        }
      }
      
      // If age not available, use date of birth (older = earlier date = comes first)
      if (a.dateOfBirth && b.dateOfBirth) {
        const aDate = new Date(a.dateOfBirth).getTime();
        const bDate = new Date(b.dateOfBirth).getTime();
        if (aDate !== bDate) {
          return aDate - bDate; // Older players first (earlier date)
        }
      } else if (a.dateOfBirth && !b.dateOfBirth) {
        return -1; // a has DOB, b doesn't - a comes first
      } else if (!a.dateOfBirth && b.dateOfBirth) {
        return 1; // b has DOB, a doesn't - b comes first
      }

      // If same role and no DOB or same DOB, sort by the selected field
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'wickets':
          aVal = a.stats?.wickets || 0;
          bVal = b.stats?.wickets || 0;
          break;
        case 'average':
          aVal = parseFloat(a.stats?.bowlingAverage) || Infinity;
          bVal = parseFloat(b.stats?.bowlingAverage) || Infinity;
          break;
        case 'economy':
          aVal = parseFloat(a.stats?.economy) || Infinity;
          bVal = parseFloat(b.stats?.economy) || Infinity;
          break;
        case 'strikeRate':
          aVal = parseFloat(a.stats?.bowlingStrikeRate) || Infinity;
          bVal = parseFloat(b.stats?.bowlingStrikeRate) || Infinity;
          break;
        case 'fiveWickets':
          aVal = a.stats?.fiveWickets || 0;
          bVal = b.stats?.fiveWickets || 0;
          break;
        default:
          aVal = a.stats?.wickets || 0;
          bVal = b.stats?.wickets || 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [players, searchQuery, selectedTeam, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const activeBowlers = players.filter(p => (p.league || 'ipl') === 'ipl' && (p.stats?.bowlingInnings > 0 || p.stats?.wickets > 0));
    const totalWickets = activeBowlers.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
    const totalFiveWickets = activeBowlers.reduce((sum, p) => sum + (p.stats?.fiveWickets || 0), 0);
    const totalMaidens = activeBowlers.reduce((sum, p) => sum + (p.stats?.maidens || 0), 0);
    const economies = activeBowlers
      .map(p => parseFloat(p.stats?.economy) || Infinity)
      .filter(e => e !== Infinity);
    const bestEconomy = economies.length > 0 ? Math.min(...economies) : 0;
    const avgWickets = activeBowlers.length > 0 ? (totalWickets / activeBowlers.length).toFixed(1) : 0;

    return { 
      activeBowlers: activeBowlers.length, 
      totalWickets, 
      totalFiveWickets, 
      totalMaidens, 
      bestEconomy: bestEconomy.toFixed(2),
      avgWickets: parseFloat(avgWickets)
    };
  }, [players]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-green-400" /> : <ChevronDown className="w-4 h-4 text-green-400" />;
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-xl">Loading bowling stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  // Hide bowling stats page for WPL (stats not needed)
  if (currentLeague === 'wpl') {
    return (
      <div className="flex min-h-screen bg-gray-950">
        {userRole === 'players_admin' ? (
          <PlayersAdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
        ) : (
          <AdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-white mb-4">Bowling Statistics Not Available</h1>
            <p className="text-gray-400 text-lg mb-6">
              Bowling statistics are not required for WPL players.
            </p>
            <p className="text-gray-500 text-sm">
              Switch to IPL league to view bowling statistics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {userRole === 'players_admin' ? (
      <PlayersAdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
      ) : (
        <AdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
      )}
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen overflow-x-hidden">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  Bowling Statistics
                </h1>
                <p className="text-green-100 text-lg">Comprehensive bowling performance analytics</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{summaryStats.activeBowlers}</div>
                  <div className="text-green-100 text-sm mt-1">Active Bowlers</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{teams.length}</div>
                  <div className="text-green-100 text-sm mt-1">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 shadow-lg border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalWickets.toLocaleString()}</div>
              <div className="text-green-100 text-xs mt-1">Total Wickets</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 shadow-lg border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.bestEconomy}</div>
              <div className="text-emerald-100 text-xs mt-1">Best Economy</div>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 shadow-lg border border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-teal-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalFiveWickets}</div>
              <div className="text-teal-100 text-xs mt-1">5-Wicket Hauls</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 shadow-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalMaidens}</div>
              <div className="text-cyan-100 text-xs mt-1">Maiden Overs</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 shadow-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.avgWickets}</div>
              <div className="text-blue-100 text-xs mt-1">Avg Wickets/Bowler</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 shadow-lg border border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <Filter className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="text-2xl font-bold text-white">{filteredAndSortedPlayers.length}</div>
              <div className="text-indigo-100 text-xs mt-1">Filtered Players</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 bg-gray-900/50 rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('teams')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'teams'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Teams
                </button>
              </div>
            </div>
          </div>

          {/* Players Table or Team Panels */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="bg-gray-800/30 backdrop-blur rounded-2xl p-16 text-center border border-gray-700/50">
              <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-500" />
          </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Players Found</h3>
              <p className="text-gray-400 text-lg mb-6">Try adjusting your search or filter criteria</p>
          </div>
          ) : viewMode === 'table' ? (
            <div className="bg-gray-800/30 backdrop-blur rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Player
                          <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('wickets')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Wickets
                          <SortIcon field="wickets" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('average')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Avg
                          <SortIcon field="average" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('economy')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Economy
                          <SortIcon field="economy" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('strikeRate')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          SR
                          <SortIcon field="strikeRate" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Overs</th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Maidens</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('fiveWickets')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          5W
                          <SortIcon field="fiveWickets" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Best</th>
                      <th className="px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAndSortedPlayers.map((player) => {
                      const team = teams.find(t => t.id === player.teamId);
                      const wickets = player.stats?.wickets || 0;
                      const maxWickets = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.wickets || 0), 1);
                      const wicketsPercentage = (wickets / maxWickets) * 100;
                      const overs = player.stats?.balls ? Math.floor(player.stats.balls / 6) : 0;
                      const balls = player.stats?.balls ? player.stats.balls % 6 : 0;
                      const oversDisplay = overs > 0 ? `${overs}.${balls}` : '0.0';

                      return (
                        <tr key={player.id} className="hover:bg-gray-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {player.name?.charAt(0) || '?'}
                  </div>
                  <div>
                                <div className="font-semibold text-white">{player.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-400">{team?.shortName || 'No Team'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{wickets}</span>
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                                  style={{ width: `${wicketsPercentage}%` }}
                                />
                  </div>
                </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {(() => {
                                // Try string field first
                                if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'string' && player.stats.bowlingAverage !== '0' && player.stats.bowlingAverage !== '-') {
                                  return player.stats.bowlingAverage;
                                }
                                // Try numeric field
                                if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'number' && player.stats.bowlingAverage > 0) {
                                  return player.stats.bowlingAverage.toFixed(2);
                                }
                                // Calculate from base stats
                                const wickets = player.stats?.wickets || 0;
                                const runsConceded = player.stats?.runsConceded || 0;
                                if (wickets > 0 && runsConceded >= 0) {
                                  return (runsConceded / wickets).toFixed(2);
                                }
                                return '-';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {(() => {
                                // Try string field first
                                if (player.stats?.economy && typeof player.stats.economy === 'string' && player.stats.economy !== '0' && player.stats.economy !== '-') {
                                  return player.stats.economy;
                                }
                                // Try numeric field
                                if (player.stats?.economy && typeof player.stats.economy === 'number' && player.stats.economy > 0) {
                                  return player.stats.economy.toFixed(2);
                                }
                                // Calculate from base stats
                                const balls = player.stats?.balls || 0;
                                const runsConceded = player.stats?.runsConceded || 0;
                                if (balls > 0 && runsConceded >= 0) {
                                  return ((runsConceded * 6) / balls).toFixed(2);
                                }
                                return '-';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {(() => {
                                // Try string field first
                                if (player.stats?.bowlingStrikeRate && player.stats.bowlingStrikeRate !== '0' && player.stats.bowlingStrikeRate !== '-') {
                                  return player.stats.bowlingStrikeRate;
                                }
                                // Calculate from base stats
                                const wickets = player.stats?.wickets || 0;
                                const balls = player.stats?.balls || 0;
                                if (wickets > 0 && balls > 0) {
                                  return (balls / wickets).toFixed(1);
                                }
                                return '-';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{player.stats?.bowlingInnings || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{oversDisplay}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-cyan-400 font-semibold">{player.stats?.maidens || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-teal-400 font-semibold">{player.stats?.fiveWickets || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold">{player.stats?.bestBowling || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                <button
                              onClick={() => handleEditPlayer(player)}
                              className="mx-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Team Panels View */
            <div className="space-y-6">
              {teams
                .filter(team => {
                  const teamPlayers = filteredAndSortedPlayers.filter(p => p.teamId === team.id);
                  return teamPlayers.length > 0;
                })
                .map(team => {
                  const teamPlayers = filteredAndSortedPlayers.filter(p => p.teamId === team.id);
                  const teamWickets = teamPlayers.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
                  const teamFiveWickets = teamPlayers.reduce((sum, p) => sum + (p.stats?.fiveWickets || 0), 0);
                  const teamMaidens = teamPlayers.reduce((sum, p) => sum + (p.stats?.maidens || 0), 0);

                  return (
                    <div key={team.id} className="bg-gray-800/30 backdrop-blur rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
                      {/* Team Header */}
                      <div className="bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 p-6 border-b border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {team.shortName || team.name.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                              <p className="text-gray-400 text-sm mt-1">
                                {teamPlayers.length} players • {teamPlayers.filter(p => p.stats?.bowlingInnings > 0).length} active bowlers
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{teamWickets}</div>
                              <div className="text-gray-400 text-xs">Total Wickets</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-teal-400">{teamFiveWickets}</div>
                              <div className="text-gray-400 text-xs">5-Wicket Hauls</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-cyan-400">{teamMaidens}</div>
                              <div className="text-gray-400 text-xs">Maidens</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Players Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {teamPlayers.map((player) => {
                            const wickets = player.stats?.wickets || 0;
                            const maxWickets = Math.max(...teamPlayers.map(p => p.stats?.wickets || 0), 1);
                            const wicketsPercentage = (wickets / maxWickets) * 100;
                            const overs = player.stats?.balls ? Math.floor(player.stats.balls / 6) : 0;
                            const balls = player.stats?.balls ? player.stats.balls % 6 : 0;
                            const oversDisplay = overs > 0 ? `${overs}.${balls}` : '0.0';

                            return (
                              <div
                                key={player.id}
                                className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-5 border border-gray-600/50 hover:border-green-500/50 transition-all hover:shadow-lg group"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {player.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate">{player.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">{player.role}</div>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Wickets</span>
                                    <span className="font-bold text-white">{wickets}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                                      style={{ width: `${wicketsPercentage}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                                      <div className="text-green-400 font-semibold">
                                        {(() => {
                                          if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'string' && player.stats.bowlingAverage !== '0' && player.stats.bowlingAverage !== '-') {
                                            return player.stats.bowlingAverage;
                                          }
                                          if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'number' && player.stats.bowlingAverage > 0) {
                                            return player.stats.bowlingAverage.toFixed(2);
                                          }
                                          const wickets = player.stats?.wickets || 0;
                                          const runsConceded = player.stats?.runsConceded || 0;
                                          if (wickets > 0 && runsConceded >= 0) {
                                            return (runsConceded / wickets).toFixed(2);
                                          }
                                          return '-';
                                        })()}
                                      </div>
                                      <div className="text-xs text-gray-400">Avg</div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                                      <div className="text-emerald-400 font-semibold">
                                        {(() => {
                                          if (player.stats?.economy && typeof player.stats.economy === 'string' && player.stats.economy !== '0' && player.stats.economy !== '-') {
                                            return player.stats.economy;
                                          }
                                          if (player.stats?.economy && typeof player.stats.economy === 'number' && player.stats.economy > 0) {
                                            return player.stats.economy.toFixed(2);
                                          }
                                          const balls = player.stats?.balls || 0;
                                          const runsConceded = player.stats?.runsConceded || 0;
                                          if (balls > 0 && runsConceded >= 0) {
                                            return ((runsConceded * 6) / balls).toFixed(2);
                                          }
                                          return '-';
                                        })()}
                                      </div>
                                      <div className="text-xs text-gray-400">Econ</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                    <span>Best: {player.stats?.bestBowling || '-'}</span>
                                    <span>{player.stats?.fiveWickets || 0} 5W</span>
                                  </div>
                                  <div className="text-xs text-gray-500 text-center mt-1">
                                    {oversDisplay} overs • {player.stats?.maidens || 0} maidens
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleEditPlayer(player)}
                                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 group-hover:scale-105"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit Stats
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
              </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-gray-700/50 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Edit Bowling Statistics</h2>
                      <p className="text-green-100 text-sm mt-0.5">{editForm.name || 'Player'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="text-white hover:text-gray-200 transition-all bg-white/10 hover:bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
                {/* Player Info Section */}
                <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <User className="w-4 h-4 text-green-400" />
                        Player Name
                      </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="Enter player name"
                />
                      <User className="absolute left-3 top-9 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Role
                      </label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
                      <Activity className="absolute left-3 top-9 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <Shirt className="w-4 h-4 text-teal-400" />
                        Jersey Number
                      </label>
                <input
                  type="text"
                  value={editForm.jerseyNumber}
                  onChange={(e) => handleFormChange('jerseyNumber', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="#"
                />
                      <Hash className="absolute left-3 top-9 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
              </div>
              
                {/* Main Statistics Section */}
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      Match Statistics
                    </h3>
                    <p className="text-gray-400 text-sm">Basic match and innings information</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        Matches
                      </label>
                <input
                  type="number"
                  value={editForm.stats.matches}
                  onChange={(e) => handleFormChange('stats.matches', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <TargetIcon className="w-4 h-4 text-emerald-400" />
                        Bowling Innings
                      </label>
                <input
                  type="number"
                  value={editForm.stats.bowlingInnings}
                  onChange={(e) => handleFormChange('stats.bowlingInnings', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <ZapIcon className="w-4 h-4 text-teal-400" />
                        Balls
                      </label>
                <input
                  type="number"
                  value={editForm.stats.balls}
                  onChange={(e) => handleFormChange('stats.balls', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              </div>
              
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-green-400" />
                      Bowling Performance
                    </h3>
                    <p className="text-gray-400 text-sm">Wickets, maidens, and runs conceded</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="relative bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-xl border border-green-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-green-300 mb-2">
                        <TargetIcon className="w-4 h-4" />
                        Wickets
                      </label>
                <input
                  type="number"
                  value={editForm.stats.wickets}
                  onChange={(e) => handleFormChange('stats.wickets', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-green-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                    </div>
                    <div className="relative bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 rounded-xl border border-cyan-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-2">
                        <ZapIcon className="w-4 h-4" />
                        Maidens
                      </label>
                      <input
                        type="number"
                        value={editForm.stats.maidens}
                        onChange={(e) => handleFormChange('stats.maidens', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-teal-500/10 to-teal-600/5 p-4 rounded-xl border border-teal-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-teal-300 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        Runs Conceded
                      </label>
                <input
                  type="number"
                  value={editForm.stats.runsConceded}
                  onChange={(e) => handleFormChange('stats.runsConceded', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-teal-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                    </div>
              </div>
              
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-emerald-400" />
                      Averages & Milestones
                    </h3>
                    <p className="text-gray-400 text-sm">Economy, strike rate, averages, and best figures</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 rounded-xl border border-emerald-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
                        <Gauge className="w-4 h-4" />
                        Economy
                      </label>
                      <input
                        type="text"
                        value={editForm.stats.economy}
                        onChange={(e) => handleFormChange('stats.economy', e.target.value)}
                        placeholder="e.g., 8.25"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-xl border border-blue-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        Bowling Average
                      </label>
                <input
                  type="text"
                  value={editForm.stats.bowlingAverage}
                  onChange={(e) => handleFormChange('stats.bowlingAverage', e.target.value)}
                        placeholder="e.g., 25.50"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-blue-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-xl border border-purple-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-2">
                        <ZapIcon className="w-4 h-4" />
                        Strike Rate
                      </label>
                <input
                  type="text"
                  value={editForm.stats.bowlingStrikeRate}
                  onChange={(e) => handleFormChange('stats.bowlingStrikeRate', e.target.value)}
                        placeholder="e.g., 18.5"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 rounded-xl border border-orange-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-orange-300 mb-2">
                        <AwardIcon className="w-4 h-4" />
                        Best Bowling
                      </label>
                <input
                  type="text"
                  value={editForm.stats.bestBowling}
                  onChange={(e) => handleFormChange('stats.bestBowling', e.target.value)}
                        placeholder="e.g., 5/25"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-orange-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-pink-500/10 to-pink-600/5 p-4 rounded-xl border border-pink-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-pink-300 mb-2">
                        <AwardIcon className="w-4 h-4" />
                        5-Wicket Hauls
                      </label>
                <input
                  type="number"
                  value={editForm.stats.fiveWickets}
                  onChange={(e) => handleFormChange('stats.fiveWickets', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
                    </div>
                  </div>
              </div>
            </div>
            
              {/* Footer */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 p-6 border-t border-gray-700/50 flex justify-end gap-4 backdrop-blur-sm">
              <button
                onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-700/80 hover:bg-gray-600 text-white rounded-xl transition-all font-medium flex items-center gap-2 hover:scale-105"
              >
                  <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSavePlayer}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Edit2 className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default BowlingStatsPage;
