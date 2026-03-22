'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import ModernDialog from '@/components/admin/ModernDialog';
import { exportStatsData } from '@/lib/admin/statsExportUtils';
import { Search, Filter, Edit2, X, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, Calendar, BarChart3, Target as TargetIcon, Award as AwardIcon, Zap as ZapIcon, Hash, Activity, LayoutGrid, Table2, Download, FileDown, FileText, Database, DatabaseBackup } from 'lucide-react';

const NOT_SELECTED_SEASON_FILTER = '__not_selected_season__';

const isInNotSelectedSeasonPool = (player: any) => {
  return player.isActiveInSquad === false || player.squadStatus === 'inactive';
};

const BattingStatsPage = () => {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const { players, teams, loading, error, updatePlayer, refreshData, lastUpdated } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortField, setSortField] = useState<string>('runs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'teams'>('table');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    age: '',
    jerseyNumber: '',
    stats: {
      matches: '',
      battingInnings: '',
      notOuts: '',
      runs: '',
      ballsFaced: '',
      highest: '',
      fours: '',
      sixes: '',
      fifties: '',
      hundreds: '',
      battingAverage: '',
      battingStrikeRate: ''
    }
  });

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        console.log('Batting Stats: Token available:', !!token);
        console.log('Batting Stats: Token value:', token?.substring(0, 20) + '...');
        
        if (!token) {
          console.log('Batting Stats: No token found, redirecting to dashboard');
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        console.log('Batting Stats: Auth response:', data);

        if (!response.ok || !data.success) {
          console.log('Batting Stats: Auth failed, redirecting to dashboard');
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        console.log('Batting Stats: User role:', role);
        setUserRole(role);

        if (role !== 'admin' && role !== 'user' && role !== 'super_admin') {
          console.log('Batting Stats: Role not allowed, redirecting to dashboard');
          alert('Access denied. Admin privileges required.');
          router.push('/ipl-admin-2026');
          return;
        }

        console.log('Batting Stats: Authentication successful, showing page');
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Batting Stats: Auth error:', error);
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
      const { type, playerId } = event.detail || {};
      
      if (type === 'player-updated' || type === 'player-created' || type === 'player-deleted') {
        console.log('Batting stats: Data update detected for player:', playerId, 'type:', type, 'refreshing...');
        // Small delay to ensure API has processed the update
        setTimeout(async () => {
          await refreshData();
          console.log('Batting stats: Data refreshed after update');
        }, 200);
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
    console.log('Batting stats: Data updated at', new Date(lastUpdated).toLocaleTimeString());
  }, [lastUpdated]);

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    
    // Calculate average and strike rate from existing stats if available
    const runs = player.stats?.runs || 0;
    const battingInnings = player.stats?.battingInnings || 0;
    const notOuts = player.stats?.notOuts || 0;
    const ballsFaced = player.stats?.ballsFaced || 0;
    
    // Calculate from base stats
    const dismissals = battingInnings - notOuts;
    let calculatedAvg = 0;
    if (dismissals > 0 && runs > 0) {
      calculatedAvg = runs / dismissals;
    }
    
    let calculatedSR = 0;
    if (ballsFaced > 0 && runs > 0) {
      calculatedSR = (runs * 100) / ballsFaced;
    }
    
    // Prefer string versions for display, fallback to calculated from numeric, then to numeric directly
    const displayAvg = player.stats?.battingAverage && player.stats.battingAverage !== '0' && player.stats.battingAverage !== '-'
      ? player.stats.battingAverage
      : (calculatedAvg > 0 ? calculatedAvg.toFixed(2) : (player.stats?.average > 0 ? player.stats.average.toFixed(2) : ''));
    
    const displaySR = player.stats?.battingStrikeRate && player.stats.battingStrikeRate !== '0' && player.stats.battingStrikeRate !== '-'
      ? player.stats.battingStrikeRate
      : (calculatedSR > 0 ? calculatedSR.toFixed(1) : (player.stats?.strikeRate > 0 ? player.stats.strikeRate.toFixed(1) : ''));
    
    setEditForm({
      name: player.name || '',
      role: player.role || '',
      age: player.age || '',
      jerseyNumber: player.jerseyNumber || '',
      stats: {
        matches: player.stats?.matches > 0 ? player.stats.matches : '',
        battingInnings: battingInnings > 0 ? battingInnings : '',
        notOuts: notOuts > 0 ? notOuts : '',
        runs: runs > 0 ? runs : '',
        ballsFaced: ballsFaced > 0 ? ballsFaced : '',
        highest: player.stats?.highest > 0 ? player.stats.highest : '',
        fours: player.stats?.fours > 0 ? player.stats.fours : '',
        sixes: player.stats?.sixes > 0 ? player.stats.sixes : '',
        fifties: player.stats?.fifties > 0 ? player.stats.fifties : '',
        hundreds: player.stats?.hundreds > 0 ? player.stats.hundreds : '',
        battingAverage: displayAvg,
        battingStrikeRate: displaySR
      }
    });
    setShowEditModal(true);
  };

  const handleSavePlayer = async () => {
    try {
      // Extract numeric values for calculations
      const runs = editForm.stats.runs === '' ? (editingPlayer.stats?.runs || 0) : (typeof editForm.stats.runs === 'number' ? editForm.stats.runs : parseInt(editForm.stats.runs) || 0);
      const battingInnings = editForm.stats.battingInnings === '' ? (editingPlayer.stats?.battingInnings || 0) : (typeof editForm.stats.battingInnings === 'number' ? editForm.stats.battingInnings : parseInt(editForm.stats.battingInnings) || 0);
      const notOuts = editForm.stats.notOuts === '' ? (editingPlayer.stats?.notOuts || 0) : (typeof editForm.stats.notOuts === 'number' ? editForm.stats.notOuts : parseInt(editForm.stats.notOuts) || 0);
      const ballsFaced = editForm.stats.ballsFaced === '' ? (editingPlayer.stats?.ballsFaced || 0) : (typeof editForm.stats.ballsFaced === 'number' ? editForm.stats.ballsFaced : parseInt(editForm.stats.ballsFaced) || 0);

      // User wants to manually enter values - prioritize manual input
      // Parse manual input values if provided
      let averageNum = 0;
      let strikeRateNum = 0;
      
      // If user manually entered batting average, use it
      if (editForm.stats.battingAverage !== '' && editForm.stats.battingAverage !== '0' && editForm.stats.battingAverage !== '-') {
        const parsed = parseFloat(editForm.stats.battingAverage);
        if (!isNaN(parsed)) {
          averageNum = parsed;
        }
      }
      
      // If user manually entered strike rate, use it
      if (editForm.stats.battingStrikeRate !== '' && editForm.stats.battingStrikeRate !== '0' && editForm.stats.battingStrikeRate !== '-') {
        const parsed = parseFloat(editForm.stats.battingStrikeRate);
        if (!isNaN(parsed)) {
          strikeRateNum = parsed;
        }
      }
      
      // Only calculate if user didn't provide manual values
      if (averageNum === 0) {
        const dismissals = battingInnings - notOuts;
        if (dismissals > 0 && runs > 0) {
          averageNum = runs / dismissals;
        } else {
          averageNum = editingPlayer.stats?.average || 0;
        }
      }
      
      if (strikeRateNum === 0) {
        if (ballsFaced > 0 && runs > 0) {
          strikeRateNum = (runs * 100) / ballsFaced;
        } else {
          strikeRateNum = editingPlayer.stats?.strikeRate || 0;
        }
      }

      // For string display fields - use manual input if provided, otherwise format the numeric value
      const battingAverageStr = editForm.stats.battingAverage !== '' 
        ? editForm.stats.battingAverage 
        : (averageNum > 0 ? averageNum.toFixed(2) : (editingPlayer.stats?.battingAverage || ''));
      
      const battingStrikeRateStr = editForm.stats.battingStrikeRate !== '' 
        ? editForm.stats.battingStrikeRate 
        : (strikeRateNum > 0 ? strikeRateNum.toFixed(1) : (editingPlayer.stats?.battingStrikeRate || ''));

      // Prepare stats object with proper type conversions
      // IMPORTANT: Set average and strikeRate AFTER spreading to ensure they override any old values
      const stats = {
        ...editingPlayer.stats, // Preserve existing stats
        matches: editForm.stats.matches === '' ? (editingPlayer.stats?.matches || 0) : (typeof editForm.stats.matches === 'number' ? editForm.stats.matches : parseInt(editForm.stats.matches) || 0),
        battingInnings: battingInnings,
        notOuts: notOuts,
        runs: runs,
        ballsFaced: ballsFaced,
        highest: editForm.stats.highest === '' ? (editingPlayer.stats?.highest || 0) : (typeof editForm.stats.highest === 'number' ? editForm.stats.highest : parseInt(editForm.stats.highest) || 0),
        fours: editForm.stats.fours === '' ? (editingPlayer.stats?.fours || 0) : (typeof editForm.stats.fours === 'number' ? editForm.stats.fours : parseInt(editForm.stats.fours) || 0),
        sixes: editForm.stats.sixes === '' ? (editingPlayer.stats?.sixes || 0) : (typeof editForm.stats.sixes === 'number' ? editForm.stats.sixes : parseInt(editForm.stats.sixes) || 0),
        fifties: editForm.stats.fifties === '' ? (editingPlayer.stats?.fifties || 0) : (typeof editForm.stats.fifties === 'number' ? editForm.stats.fifties : parseInt(editForm.stats.fifties) || 0),
        hundreds: editForm.stats.hundreds === '' ? (editingPlayer.stats?.hundreds || 0) : (typeof editForm.stats.hundreds === 'number' ? editForm.stats.hundreds : parseInt(editForm.stats.hundreds) || 0),
        // String versions for admin display
        battingAverage: battingAverageStr,
        battingStrikeRate: battingStrikeRateStr,
        // Numeric versions for end-user pages - CRITICAL: Always set these explicitly
        average: averageNum,
        strikeRate: strikeRateNum
      };

      // CRITICAL: Use editingPlayer values for read-only fields (name, role, jerseyNumber)
      // These fields are now read-only in the UI, so we must use the original player data
      const updatedPlayer = {
        ...editingPlayer, // Preserve ALL existing player fields FIRST
        id: editingPlayer.id,
        // Read-only fields - always use editingPlayer values (not from form)
        name: editingPlayer.name,
        role: editingPlayer.role,
        jerseyNumber: editingPlayer.jerseyNumber,
        // Age can be updated if provided in form (though not shown in batting stats form)
        age: editForm.age || editingPlayer.age,
        // Preserve all team and league info
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
          // CRITICAL: Preserve ALL existing stats first
          ...editingPlayer.stats,
          // Then override with updated batting stats
          ...stats,
          // CRITICAL: Explicitly ensure average and strikeRate are numbers and are always set
          average: typeof averageNum === 'number' ? averageNum : parseFloat(String(averageNum)) || 0,
          strikeRate: typeof strikeRateNum === 'number' ? strikeRateNum : parseFloat(String(strikeRateNum)) || 0,
          // Ensure string versions are also set
          battingAverage: battingAverageStr,
          battingStrikeRate: battingStrikeRateStr
        }
      };

      // Debug logging
      console.log('Updating player with stats:', {
        average: updatedPlayer.stats.average,
        strikeRate: updatedPlayer.stats.strikeRate,
        battingAverage: updatedPlayer.stats.battingAverage,
        battingStrikeRate: updatedPlayer.stats.battingStrikeRate,
        runs,
        battingInnings,
        notOuts,
        ballsFaced
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
      
      // Handle the special "Not Selected This Season" filter
      if (selectedTeam === NOT_SELECTED_SEASON_FILTER) {
        return isIPL && matchesSearch && isInNotSelectedSeasonPool(player);
      }
      
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
        case 'runs':
          aVal = a.stats?.runs || 0;
          bVal = b.stats?.runs || 0;
          break;
        case 'average':
          aVal = parseFloat(a.stats?.battingAverage) || 0;
          bVal = parseFloat(b.stats?.battingAverage) || 0;
          break;
        case 'strikeRate':
          aVal = parseFloat(a.stats?.battingStrikeRate) || 0;
          bVal = parseFloat(b.stats?.battingStrikeRate) || 0;
          break;
        case 'highest':
          aVal = a.stats?.highest || 0;
          bVal = b.stats?.highest || 0;
          break;
        case 'hundreds':
          aVal = a.stats?.hundreds || 0;
          bVal = b.stats?.hundreds || 0;
          break;
        case 'fifties':
          aVal = a.stats?.fifties || 0;
          bVal = b.stats?.fifties || 0;
          break;
        default:
          aVal = a.stats?.runs || 0;
          bVal = b.stats?.runs || 0;
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
    // Filter players based on team selection and search query first
    const playersForStats = players.filter(player => {
      // Only show IPL players
      const isIPL = (player.league || 'ipl') === 'ipl';
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.teamId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === 'all' || player.teamId === selectedTeam;
      return isIPL && matchesSearch && matchesTeam;
    });
    
    const activeBatsmen = playersForStats.filter(p => p.stats?.battingInnings > 0 || p.stats?.runs > 0);
    
    // If search query is active, show individual player stats instead of aggregated
    if (searchQuery.trim() !== '') {
      if (activeBatsmen.length === 0) {
        return { activeBatsmen: 0, totalRuns: 0, totalHundreds: 0, totalFifties: 0, highestScore: 0, avgRuns: 0 };
      }
      // For search results, show individual stats (not aggregated)
      // If multiple players match, show stats for each individually in the table, but summary shows first match
      const player = activeBatsmen[0];
      const runs = player.stats?.runs || 0;
      const hundreds = player.stats?.hundreds || 0;
      const fifties = player.stats?.fifties || 0;
      const highest = player.stats?.highest || 0;
      const avgRuns = runs; // For individual player, avg is just their runs

      return { activeBatsmen: activeBatsmen.length, totalRuns: runs, totalHundreds: hundreds, totalFifties: fifties, highestScore: highest, avgRuns };
    }
    
    // Normal aggregated stats for team filter only (no search)
    const totalRuns = activeBatsmen.reduce((sum, p) => sum + (p.stats?.runs || 0), 0);
    const totalHundreds = activeBatsmen.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0);
    const totalFifties = activeBatsmen.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0);
    const highestScore = Math.max(...activeBatsmen.map(p => p.stats?.highest || 0), 0);
    const avgRuns = activeBatsmen.length > 0 ? Math.round(totalRuns / activeBatsmen.length) : 0;

    return { activeBatsmen: activeBatsmen.length, totalRuns, totalHundreds, totalFifties, highestScore, avgRuns };
  }, [players, selectedTeam, searchQuery]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />;
  };

  const getSelectedTeamLabel = useCallback(() => {
    if (selectedTeam === 'all') return 'All Teams';
    if (selectedTeam === NOT_SELECTED_SEASON_FILTER) return 'Not Selected This Season';
    return teams.find((team) => team.id === selectedTeam)?.name || 'Selected Team';
  }, [selectedTeam, teams]);

  const getInactivePlayerCount = useCallback(() => {
    return players.filter(p => isInNotSelectedSeasonPool(p)).length;
  }, [players]);

  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'sql') => {
    if (filteredAndSortedPlayers.length === 0) {
      alert('No players match the current filters.');
      return;
    }

    try {
      setIsExporting(true);
      exportStatsData(format, filteredAndSortedPlayers, teams, {
        kind: 'batting',
        league: currentLeague,
        teamLabel: getSelectedTeamLabel(),
        searchQuery: searchQuery.trim()
      });
      setShowExportModal(false);
    } catch (exportError) {
      console.error('Failed to export batting stats:', exportError);
      alert('Failed to export batting stats. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [currentLeague, filteredAndSortedPlayers, getSelectedTeamLabel, searchQuery, teams]);

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
        <div className="text-white text-xl">Loading batting stats...</div>
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

  // Hide batting stats page for WPL (stats not needed)
  if (currentLeague === 'wpl') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-3xl font-bold text-white mb-4">Batting Statistics Not Available</h1>
          <p className="text-gray-400 text-lg mb-6">
            Batting statistics are not required for WPL players.
          </p>
          <p className="text-gray-500 text-sm">
            Switch to IPL league to view batting statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 min-h-screen overflow-x-hidden relative">
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        
        {/* Hero Header */}
        <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-8 shadow-2xl overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="animate-in slide-in-from-left duration-700">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-white/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">Batting Statistics</span>
                </h1>
                <p className="text-cyan-100 text-lg font-medium tracking-wide">Comprehensive batting performance analytics</p>
              </div>
              <div className="flex flex-wrap gap-4 animate-in slide-in-from-right duration-700">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px] border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500">{summaryStats.activeBatsmen}</div>
                  <div className="text-cyan-100 text-sm mt-1 font-semibold">Active Batsmen</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px] border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/50">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500 delay-100">{teams.length}</div>
                  <div className="text-cyan-100 text-sm mt-1 font-semibold">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8 relative z-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-cyan-600 via-cyan-600 to-blue-700 rounded-2xl p-5 shadow-xl border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-cyan-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalRuns.toLocaleString()}</div>
              <div className="text-cyan-100 text-xs mt-1 font-semibold uppercase tracking-wider">Total Runs</div>
            </div>
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-purple-700 rounded-2xl p-5 shadow-xl border border-violet-400/30 hover:border-violet-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-75 group">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-violet-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.highestScore}</div>
              <div className="text-violet-100 text-xs mt-1 font-semibold uppercase tracking-wider">Highest Score</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-rose-700 rounded-2xl p-5 shadow-xl border border-pink-400/30 hover:border-pink-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-150 group">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-pink-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalHundreds}</div>
              <div className="text-pink-100 text-xs mt-1 font-semibold uppercase tracking-wider">Centuries</div>
            </div>
            <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-orange-700 rounded-2xl p-5 shadow-xl border border-amber-400/30 hover:border-amber-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-200 group">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalFifties}</div>
              <div className="text-amber-100 text-xs mt-1 font-semibold uppercase tracking-wider">Half Centuries</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 rounded-2xl p-5 shadow-xl border border-emerald-400/30 hover:border-emerald-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-300 group">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.avgRuns}</div>
              <div className="text-emerald-100 text-xs mt-1 font-semibold uppercase tracking-wider">Avg Runs/Player</div>
            </div>
            <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 rounded-2xl p-5 shadow-xl border border-sky-400/30 hover:border-sky-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/50 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-[375ms] group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-sky-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{filteredAndSortedPlayers.length}</div>
              <div className="text-sky-100 text-xs mt-1 font-semibold uppercase tracking-wider">Filtered Players</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gradient-to-r from-gray-800/60 via-gray-800/40 to-gray-800/60 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  id="search-players"
                  name="searchPlayers"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-gray-900/80"
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-900/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-gray-900/80"
                >
                  <option value="all">All Teams</option>
                  <option value={NOT_SELECTED_SEASON_FILTER} className="bg-amber-950">
                    Not Selected This Season ({getInactivePlayerCount()})
                  </option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 bg-gray-900/60 rounded-xl p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('teams')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'teams'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Teams
                </button>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={filteredAndSortedPlayers.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-700 via-cyan-700 to-sky-700 hover:from-amber-600 hover:via-cyan-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/30"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Players Table or Team Panels */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-800/40 backdrop-blur-md rounded-3xl p-16 text-center border border-gray-700/50 shadow-xl animate-in fade-in-50 zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-700/60 to-gray-600/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Players Found</h3>
              <p className="text-gray-400 text-lg mb-6">Try adjusting your search or filter criteria</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-800/40 backdrop-blur-md rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl animate-in fade-in-50 slide-in-from-bottom-8 duration-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80 border-b border-gray-700">
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
                          onClick={() => handleSort('runs')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Runs
                          <SortIcon field="runs" />
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
                          onClick={() => handleSort('strikeRate')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          SR
                          <SortIcon field="strikeRate" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('highest')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          HS
                          <SortIcon field="highest" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('hundreds')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          100s
                          <SortIcon field="hundreds" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('fifties')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          50s
                          <SortIcon field="fifties" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">4s/6s</th>
                      <th className="px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAndSortedPlayers.map((player, index) => {
                      const team = teams.find(t => t.id === player.teamId);
                      const runs = player.stats?.runs || 0;
                      const maxRuns = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.runs || 0), 1);
                      const runsPercentage = (runs / maxRuns) * 100;

                      return (
                        <tr key={player.id} className="hover:bg-gradient-to-r hover:from-gray-800/60 hover:via-gray-800/40 hover:to-gray-800/60 transition-all duration-300 group border-l-4 border-transparent hover:border-l-cyan-500 hover:shadow-lg">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                {player.name?.charAt(0) || '?'}
                  </div>
                  <div>
                                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{player.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{team?.shortName || 'No Team'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{runs.toLocaleString()}</span>
                              <div className="w-16 h-2 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700 shadow-lg shadow-cyan-500/50"
                                  style={{ width: `${runsPercentage}%` }}
                                />
                  </div>
                </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {(() => {
                                // Try string field first
                                if (player.stats?.battingAverage && player.stats.battingAverage !== '0' && player.stats.battingAverage !== '-') {
                                  return player.stats.battingAverage;
                                }
                                // Try numeric field
                                if (player.stats?.average && player.stats.average > 0) {
                                  return player.stats.average.toFixed(2);
                                }
                                // Calculate from base stats
                                const runs = player.stats?.runs || 0;
                                const battingInnings = player.stats?.battingInnings || 0;
                                const notOuts = player.stats?.notOuts || 0;
                                const dismissals = battingInnings - notOuts;
                                if (dismissals > 0 && runs > 0) {
                                  return (runs / dismissals).toFixed(2);
                                }
                                return '-';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {(() => {
                                // Try string field first
                                if (player.stats?.battingStrikeRate && player.stats.battingStrikeRate !== '0' && player.stats.battingStrikeRate !== '-') {
                                  return player.stats.battingStrikeRate;
                                }
                                // Try numeric field
                                if (player.stats?.strikeRate && player.stats.strikeRate > 0) {
                                  return player.stats.strikeRate.toFixed(1);
                                }
                                // Calculate from base stats
                                const runs = player.stats?.runs || 0;
                                const ballsFaced = player.stats?.ballsFaced || 0;
                                if (ballsFaced > 0 && runs > 0) {
                                  return ((runs * 100) / ballsFaced).toFixed(1);
                                }
                                return '-';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold">{player.stats?.highest || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{player.stats?.battingInnings || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-pink-400 font-semibold">{player.stats?.hundreds || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-orange-400 font-semibold">{player.stats?.fifties || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">
                              {player.stats?.fours || 0}/{player.stats?.sixes || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                <button
                              onClick={() => handleEditPlayer(player)}
                              className="mx-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 group-hover:shadow-cyan-500/50"
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
                .map((team, teamIndex) => {
                  const teamPlayers = filteredAndSortedPlayers.filter(p => p.teamId === team.id);
                  const teamRuns = teamPlayers.reduce((sum, p) => sum + (p.stats?.runs || 0), 0);
                  const teamHundreds = teamPlayers.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0);
                  const teamFifties = teamPlayers.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0);

                  return (
                    <div key={team.id} className="bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-800/50 backdrop-blur-md rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 animate-in fade-in-50 slide-in-from-bottom-8" style={{ animationDelay: `${teamIndex * 100}ms` }}>
                      {/* Team Header */}
                      <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/20 p-6 border-b border-gray-700/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                              {team.shortName || team.name.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{team.name}</h2>
                              <p className="text-gray-400 text-sm mt-1">
                                {teamPlayers.length} players • {teamPlayers.filter(p => p.stats?.battingInnings > 0).length} active batsmen
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-all">
                              <div className="text-2xl font-bold text-white">{teamRuns.toLocaleString()}</div>
                              <div className="text-gray-400 text-xs font-semibold">Total Runs</div>
                            </div>
                            <div className="text-center bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-all">
                              <div className="text-2xl font-bold text-pink-400">{teamHundreds}</div>
                              <div className="text-gray-400 text-xs font-semibold">100s</div>
                            </div>
                            <div className="text-center bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-all">
                              <div className="text-2xl font-bold text-orange-400">{teamFifties}</div>
                              <div className="text-gray-400 text-xs font-semibold">50s</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Players Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {teamPlayers.map((player, playerIndex) => {
                            const runs = player.stats?.runs || 0;
                            const maxRuns = Math.max(...teamPlayers.map(p => p.stats?.runs || 0), 1);
                            const runsPercentage = (runs / maxRuns) * 100;

                            return (
                              <div
                                key={player.id}
                                className="bg-gradient-to-br from-gray-700/60 via-gray-800/60 to-gray-800/60 rounded-2xl p-5 border border-gray-600/50 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 group hover:scale-105 cursor-pointer animate-in fade-in-50 zoom-in-95"
                                style={{ animationDelay: `${playerIndex * 50}ms` }}
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    {player.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{player.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{player.role}</div>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm font-medium">Runs</span>
                                    <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{runs.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700 shadow-lg shadow-cyan-500/50"
                                      style={{ width: `${runsPercentage}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-gray-900/60 rounded-xl p-2 text-center border border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                                      <div className="text-cyan-400 font-semibold">
                                        {(() => {
                                          if (player.stats?.battingAverage && player.stats.battingAverage !== '0' && player.stats.battingAverage !== '-') {
                                            return player.stats.battingAverage;
                                          }
                                          if (player.stats?.average && player.stats.average > 0) {
                                            return player.stats.average.toFixed(2);
                                          }
                                          const runs = player.stats?.runs || 0;
                                          const battingInnings = player.stats?.battingInnings || 0;
                                          const notOuts = player.stats?.notOuts || 0;
                                          const dismissals = battingInnings - notOuts;
                                          if (dismissals > 0 && runs > 0) {
                                            return (runs / dismissals).toFixed(2);
                                          }
                                          return '-';
                                        })()}
                                      </div>
                                      <div className="text-xs text-gray-400 font-semibold">Avg</div>
                                    </div>
                                    <div className="bg-gray-900/60 rounded-xl p-2 text-center border border-indigo-500/20 hover:border-indigo-500/50 transition-all">
                                      <div className="text-indigo-400 font-semibold">
                                        {(() => {
                                          if (player.stats?.battingStrikeRate && player.stats.battingStrikeRate !== '0' && player.stats.battingStrikeRate !== '-') {
                                            return player.stats.battingStrikeRate;
                                          }
                                          if (player.stats?.strikeRate && player.stats.strikeRate > 0) {
                                            return player.stats.strikeRate.toFixed(1);
                                          }
                                          const runs = player.stats?.runs || 0;
                                          const ballsFaced = player.stats?.ballsFaced || 0;
                                          if (ballsFaced > 0 && runs > 0) {
                                            return ((runs * 100) / ballsFaced).toFixed(1);
                                          }
                                          return '-';
                                        })()}
                                      </div>
                                      <div className="text-xs text-gray-400 font-semibold">SR</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>HS: {player.stats?.highest || '-'}</span>
                                    <span>{player.stats?.hundreds || 0}💯 / {player.stats?.fifties || 0} 50</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleEditPlayer(player)}
                                  className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50"
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

        <ModernDialog
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export Batting Stats"
          description="Download the currently filtered batting dataset as PDF, CSV, or SQL."
          variant="default"
          size="lg"
          icon={
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-700 via-cyan-700 to-sky-700 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-4 bg-slate-900/70 border border-white/10 rounded-xl">
              <p className="text-sm text-gray-200">
                Export scope: {currentLeague.toUpperCase()} • {getSelectedTeamLabel()} • {filteredAndSortedPlayers.length} players
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Current search: {searchQuery.trim() || 'None'}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="p-4 bg-slate-900/60 hover:bg-slate-800/70 border border-cyan-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <FileDown className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">PDF</p>
                    <p className="text-xs text-gray-400">Dark oil-paint report</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="p-4 bg-slate-900/60 hover:bg-slate-800/70 border border-emerald-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">CSV</p>
                    <p className="text-xs text-gray-400">Sheets-ready export</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('sql')}
                disabled={isExporting}
                className="p-4 bg-slate-900/60 hover:bg-slate-800/70 border border-amber-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Database className="w-6 h-6 text-amber-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">SQL</p>
                    <p className="text-xs text-gray-400">Import-ready table dump</p>
                  </div>
                </div>
              </button>
            </div>

            {isExporting && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                  <p className="text-cyan-200 text-sm">Exporting batting stats...</p>
                </div>
              </div>
            )}
          </div>
        </ModernDialog>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-gray-700/50 animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-6 border-b border-gray-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Edit Batting Statistics</h2>
                      <p className="text-cyan-100 text-sm mt-0.5 font-medium">{editForm.name || 'Player'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="text-white hover:text-gray-200 transition-all bg-white/10 hover:bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center hover:scale-110 hover:rotate-90 duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
                {/* Player Info Section */}
                <div className="p-6 bg-gradient-to-r from-gray-800/60 via-gray-900/60 to-gray-800/60 border-b border-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Player Name - Read-only with premium design */}
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        Player Name
                      </label>
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-cyan-500/30 shadow-lg hover:shadow-cyan-500/20 transition-all">
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-base truncate">
                              {editForm.name || editingPlayer?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">Read-only</div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>

                    {/* Role - Read-only with badge design */}
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                        <Activity className="w-3.5 h-3.5 text-violet-400" />
                        Role
                      </label>
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-violet-500/30 shadow-lg hover:shadow-violet-500/20 transition-all">
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/40 text-violet-200 font-semibold text-sm">
                                {editForm.role || editingPlayer?.role || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1.5">Read-only</div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>

                    {/* Jersey Number - Read-only with premium design */}
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                        <Shirt className="w-3.5 h-3.5 text-rose-400" />
                        Jersey Number
                      </label>
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-rose-500/30 shadow-lg hover:shadow-rose-500/20 transition-all">
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-600/20 border border-rose-500/30 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-lg">
                                {editForm.jerseyNumber || editingPlayer?.jerseyNumber || 'N/A'}
                              </span>
                              {editForm.jerseyNumber && (
                                <span className="text-xs text-gray-400">#{editForm.jerseyNumber}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">Read-only</div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  </div>
              </div>
              
                {/* Main Statistics Section */}
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      Match Statistics
                    </h3>
                    <p className="text-gray-400 text-sm">Basic match and innings information</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Matches
                      </label>
                <input
                  type="number"
                  id="edit-stats-matches"
                  name="statsMatches"
                  value={editForm.stats.matches}
                  onChange={(e) => handleFormChange('stats.matches', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-gray-700/90 hover:border-cyan-500/30"
                        placeholder="Matches"
                />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <TargetIcon className="w-4 h-4 text-indigo-400" />
                        Batting Innings
                      </label>
                <input
                  type="number"
                  id="edit-stats-batting-innings"
                  name="statsBattingInnings"
                  value={editForm.stats.battingInnings}
                  onChange={(e) => handleFormChange('stats.battingInnings', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:bg-gray-700/90 hover:border-indigo-500/30"
                        placeholder="Batting Innings"
                />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <ZapIcon className="w-4 h-4 text-violet-400" />
                        Not Outs
                      </label>
                <input
                  type="number"
                  id="edit-stats-not-outs"
                  name="statsNotOuts"
                  value={editForm.stats.notOuts}
                  onChange={(e) => handleFormChange('stats.notOuts', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all hover:bg-gray-700/90 hover:border-violet-500/30"
                        placeholder="Not Outs"
                />
                    </div>
              </div>
              
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Batting Performance
                    </h3>
                    <p className="text-gray-400 text-sm">Runs, boundaries, and scoring statistics</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="relative bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-2">
                        <TargetIcon className="w-4 h-4" />
                        Runs
                      </label>
                <input
                  type="number"
                  id="edit-stats-runs"
                  name="statsRuns"
                  value={editForm.stats.runs}
                  onChange={(e) => handleFormChange('stats.runs', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-gray-700/90"
                        placeholder="Runs"
                      />
                    </div>
                    <div className="relative bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-4 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-2">
                        <TargetIcon className="w-4 h-4" />
                        Highest Score
                      </label>
                      <input
                        type="number"
                        id="edit-stats-highest"
                        name="statsHighest"
                        value={editForm.stats.highest}
                        onChange={(e) => handleFormChange('stats.highest', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-indigo-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:bg-gray-700/90"
                        placeholder="Highest Score"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-4 rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-violet-300 mb-2">
                        <ZapIcon className="w-4 h-4" />
                        Balls Faced
                      </label>
                <input
                  type="number"
                  id="edit-stats-balls-faced"
                  name="statsBallsFaced"
                  value={editForm.stats.ballsFaced}
                  onChange={(e) => handleFormChange('stats.ballsFaced', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all hover:bg-gray-700/90"
                        placeholder="Balls Faced"
                />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        Fours
                      </label>
                <input
                  type="number"
                  id="edit-stats-fours"
                  name="statsFours"
                  value={editForm.stats.fours}
                  onChange={(e) => handleFormChange('stats.fours', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-gray-700/90 hover:border-cyan-500/30"
                        placeholder="Fours"
                />
              </div>
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <ZapIcon className="w-4 h-4 text-amber-400" />
                        Sixes
                      </label>
                <input
                  type="number"
                  id="edit-stats-sixes"
                  name="statsSixes"
                  value={editForm.stats.sixes}
                  onChange={(e) => handleFormChange('stats.sixes', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all hover:bg-gray-700/90 hover:border-amber-500/30"
                        placeholder="Sixes"
                />
                    </div>
              </div>
              
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <AwardIcon className="w-5 h-5 text-amber-400" />
                      Milestones & Averages
                    </h3>
                    <p className="text-gray-400 text-sm">Half-centuries, centuries, and calculated averages</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
                        <AwardIcon className="w-4 h-4" />
                        Fifties
                      </label>
                <input
                  type="number"
                  id="edit-stats-fifties"
                  name="statsFifties"
                  value={editForm.stats.fifties}
                  onChange={(e) => handleFormChange('stats.fifties', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-amber-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all hover:bg-gray-700/90"
                        placeholder="Fifties"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-rose-500/10 to-rose-600/5 p-4 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-rose-300 mb-2">
                        <AwardIcon className="w-4 h-4" />
                        Hundreds
                      </label>
                <input
                  type="number"
                  id="edit-stats-hundreds"
                  name="statsHundreds"
                  value={editForm.stats.hundreds}
                  onChange={(e) => handleFormChange('stats.hundreds', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-rose-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all hover:bg-gray-700/90"
                        placeholder="Hundreds"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        Batting Average
                      </label>
                <input
                  type="text"
                  id="edit-stats-batting-average"
                  name="statsBattingAverage"
                  value={editForm.stats.battingAverage}
                  onChange={(e) => handleFormChange('stats.battingAverage', e.target.value)}
                        placeholder="e.g., 45.67"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:bg-gray-700/90"
                />
              </div>
                    <div className="relative bg-gradient-to-br from-teal-500/10 to-teal-600/5 p-4 rounded-xl border border-teal-500/20 hover:border-teal-500/40 transition-all group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-teal-300 mb-2">
                        <ZapIcon className="w-4 h-4" />
                        Strike Rate
                      </label>
                <input
                  type="text"
                  id="edit-stats-batting-strike-rate"
                  name="statsBattingStrikeRate"
                  value={editForm.stats.battingStrikeRate}
                  onChange={(e) => handleFormChange('stats.battingStrikeRate', e.target.value)}
                        placeholder="e.g., 145.50"
                        className="w-full px-4 py-2.5 bg-gray-700/70 border border-teal-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:bg-gray-700/90"
                />
                    </div>
                  </div>
              </div>
            </div>
            
              {/* Footer */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 p-6 border-t border-gray-700/50 flex justify-end gap-4 backdrop-blur-sm">
              <button
                onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-700/80 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 font-medium flex items-center gap-2 hover:scale-105 shadow-lg"
              >
                  <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSavePlayer}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-300 font-medium flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 hover:shadow-cyan-500/50"
                >
                  <Edit2 className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
                </div>
              )}
            </div>
    </>
  );
};

export default BattingStatsPage;
