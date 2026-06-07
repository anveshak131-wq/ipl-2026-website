'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import ModernDialog from '@/components/admin/ModernDialog';
import { exportStatsData } from '@/lib/admin/statsExportUtils';
import { Search, Filter, Edit2, X, TrendingDown, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, Calendar, BarChart3, Target as TargetIcon, Award as AwardIcon, Zap as ZapIcon, Hash, Activity, ShieldCheck, Gauge, LayoutGrid, Table2, Download, FileDown, FileText, Database, DatabaseBackup } from 'lucide-react';

const NOT_SELECTED_SEASON_FILTER = '__not_selected_season__';

const isInNotSelectedSeasonPool = (player: any) => {
  return player.isActiveInSquad === false || player.squadStatus === 'inactive';
};

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
        console.log('Bowling Stats: Token available:', !!token);
        console.log('Bowling Stats: Token value:', token?.substring(0, 20) + '...');
        
        if (!token) {
          console.log('Bowling Stats: No token found, redirecting to dashboard');
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        console.log('Bowling Stats: Auth response:', data);

        if (!response.ok || !data.success) {
          console.log('Bowling Stats: Auth failed, redirecting to dashboard');
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        console.log('Bowling Stats: User role:', role);
        setUserRole(role);

        if (role !== 'admin' && role !== 'user' && role !== 'super_admin') {
          console.log('Bowling Stats: Role not allowed, redirecting to dashboard');
          alert('Access denied. Admin privileges required.');
          router.push('/ipl-admin-2026');
          return;
        }

        console.log('Bowling Stats: Authentication successful, showing page');
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Bowling Stats: Auth error:', error);
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
        console.log('Bowling stats: Data update detected for player:', playerId, 'type:', type, 'refreshing...');
        // Small delay to ensure API has processed the update
        setTimeout(async () => {
          await refreshData();
          console.log('Bowling stats: Data refreshed after update');
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

      // CRITICAL: Use editingPlayer values for read-only fields (name, role, jerseyNumber)
      // These fields are now read-only in the UI, so we must use the original player data
      const updatedPlayer = {
        ...editingPlayer, // Preserve ALL existing player fields FIRST
        id: editingPlayer.id,
        // Read-only fields - always use editingPlayer values (not from form)
        name: editingPlayer.name,
        role: editingPlayer.role,
        jerseyNumber: editingPlayer.jerseyNumber,
        // Age can be updated if provided in form (though not shown in bowling stats form)
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
          // Then override with updated bowling stats (which has string versions)
          ...stats,
          // CRITICAL: Send numeric versions for API calculations
          // The API will use these for calculations and preserve string versions for display
          // Note: stats object above has string versions, but API needs numeric for calculations
          // We'll let API handle the conversion - it will calculate numeric from string if needed
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
                           String(player.teamId || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Handle the special "Not Selected for This Season" filter
      if (selectedTeam === NOT_SELECTED_SEASON_FILTER) {
        return isIPL && matchesSearch && isInNotSelectedSeasonPool(player);
      }
      
      const matchesTeam = selectedTeam === 'all' || String(player.teamId || '') === String(selectedTeam);
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
    // Filter players based on team selection and search query first
    const playersForStats = players.filter(player => {
      // Only show IPL players
      const isIPL = (player.league || 'ipl') === 'ipl';
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           String(player.teamId || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam =
        selectedTeam === NOT_SELECTED_SEASON_FILTER
          ? isInNotSelectedSeasonPool(player)
          : selectedTeam === 'all' || String(player.teamId || '') === String(selectedTeam);
      return isIPL && matchesSearch && matchesTeam;
    });
    
    const activeBowlers = playersForStats.filter(p => p.stats?.bowlingInnings > 0 || p.stats?.wickets > 0);
    
    // If search query is active, show individual player stats instead of aggregated
    if (searchQuery.trim() !== '') {
      if (activeBowlers.length === 0) {
        return { activeBowlers: 0, totalWickets: 0, totalFiveWickets: 0, totalMaidens: 0, bestEconomy: '0.00', avgWickets: 0 };
      }
      // For search results, show individual stats (not aggregated)
      // If multiple players match, show stats for each individually in the table, but summary shows first match
      const player = activeBowlers[0];
      const wickets = player.stats?.wickets || 0;
      const fiveWickets = player.stats?.fiveWickets || 0;
      const maidens = player.stats?.maidens || 0;
      const economy = parseFloat(player.stats?.economy) || 0;
      const avgWickets = wickets; // For individual player, avg is just their wickets

      return { 
        activeBowlers: activeBowlers.length, 
        totalWickets: wickets, 
        totalFiveWickets: fiveWickets, 
        totalMaidens: maidens, 
        bestEconomy: economy.toFixed(2),
        avgWickets: avgWickets
      };
    }
    
    // Normal aggregated stats for team filter only (no search)
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
  }, [players, selectedTeam, searchQuery]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-green-400" /> : <ChevronDown className="w-4 h-4 text-green-400" />;
  };

  const getSelectedTeamLabel = useCallback(() => {
    if (selectedTeam === 'all') return 'All Teams';
    if (selectedTeam === NOT_SELECTED_SEASON_FILTER) return 'Not Selected for This Season';
    return teams.find((team) => String(team.id) === String(selectedTeam))?.name || 'Selected Team';
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
        kind: 'bowling',
        league: currentLeague,
        teamLabel: getSelectedTeamLabel(),
        searchQuery: searchQuery.trim()
      });
      setShowExportModal(false);
    } catch (exportError) {
      console.error('Failed to export bowling stats:', exportError);
      alert('Failed to export bowling stats. Please try again.');
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
    );
  }

  return (
    <>
      <div className="flex-1 ipl-oil-admin-page min-h-screen overflow-x-hidden">
        {/* Hero Header */}
        <div className="relative oil-hero p-6 lg:p-8 shadow-2xl">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="oil-rise">
                <div className="oil-hero-kicker mb-3">
                  <Gauge className="h-3.5 w-3.5" />
                  IPL bowling desk
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#4cc39a]/15 backdrop-blur rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-black/20 border border-[#4cc39a]/30">
                    <TrendingDown className="w-6 h-6 text-[#9cf2c8]" />
                  </div>
                  <span>Bowling Stats Control Room</span>
                </h1>
                <p className="text-sm leading-6 text-white/70 max-w-3xl">
                  Track IPL bowling spells by wickets, economy, strike rate, maidens, best figures, and export-ready
                  bowler sheets.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 oil-rise">
                <div className="oil-stat-card oil-stat-card--teal p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500">{summaryStats.activeBowlers}</div>
                  <div className="text-[#9cf2c8] text-sm mt-1 font-semibold">Wicket Takers</div>
                </div>
                <div className="oil-stat-card oil-stat-card--gold p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500 delay-100">{teams.length}</div>
                  <div className="text-[#f2d39a] text-sm mt-1 font-semibold">IPL Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="oil-stat-card oil-stat-card--teal p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-[#9cf2c8] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalWickets.toLocaleString()}</div>
              <div className="text-[#9cf2c8] text-xs mt-1 font-semibold uppercase tracking-wider">Wickets Taken</div>
            </div>
            <div className="oil-stat-card oil-stat-card--gold p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-[#f2d39a] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.bestEconomy}</div>
              <div className="text-[#f2d39a] text-xs mt-1 font-semibold uppercase tracking-wider">Best Economy</div>
            </div>
            <div className="oil-stat-card oil-stat-card--rose p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-[#ffaaa5] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalFiveWickets}</div>
              <div className="text-[#ffaaa5] text-xs mt-1 font-semibold uppercase tracking-wider">Five-Wicket Hauls</div>
            </div>
            <div className="oil-stat-card oil-stat-card--cyan p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-[#a8e9ef] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalMaidens}</div>
              <div className="text-[#a8e9ef] text-xs mt-1 font-semibold uppercase tracking-wider">Maiden Overs</div>
            </div>
            <div className="oil-stat-card oil-stat-card--copper p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-amber-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.avgWickets}</div>
              <div className="text-amber-100 text-xs mt-1 font-semibold uppercase tracking-wider">Wickets per Bowler</div>
            </div>
            <div className="oil-stat-card oil-stat-card--slate p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Filter className="w-5 h-5 text-slate-200 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{filteredAndSortedPlayers.length}</div>
              <div className="text-slate-200 text-xs mt-1 font-semibold uppercase tracking-wider">Filtered Bowlers</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="oil-toolbar rounded-2xl p-6 mb-6 transition-all duration-200 oil-rise">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 group-focus-within:text-[#9cf2c8] transition-colors" />
                <input
                  type="text"
                  placeholder="Search bowler, team, role, or nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="oil-field w-full pl-10 pr-4 py-2.5"
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 group-focus-within:text-[#f2d39a] transition-colors" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="oil-select pl-10 pr-8 py-2.5 appearance-none cursor-pointer"
                >
                  <option value="all">All Teams</option>
                  <option value={NOT_SELECTED_SEASON_FILTER} className="bg-amber-950">
                    Not Selected for This Season ({getInactivePlayerCount()})
                  </option>
                  {teams.map(team => (
                    <option key={team.id} value={String(team.id)}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="oil-segmented">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-[#4cc39a]/20 text-white shadow-lg'
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
                      ? 'bg-[#4cc39a]/20 text-white shadow-lg'
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
                className="oil-btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Players Table or Team Panels */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="oil-panel rounded-2xl p-16 text-center oil-rise">
              <div className="w-20 h-20 bg-[#4cc39a]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#4cc39a]/20">
                <Search className="w-10 h-10 text-[#9cf2c8]" />
          </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Bowlers Match These Filters</h3>
              <p className="text-gray-400 text-lg mb-6">Try a different player name, team, or bowling metric.</p>
          </div>
          ) : viewMode === 'table' ? (
            <div className="oil-table-shell oil-table-shell--pro rounded-2xl overflow-hidden shadow-xl oil-rise">
              <div className="oil-table-header p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="oil-hero-kicker mb-2">
                      <Table2 className="h-3.5 w-3.5" />
                      Bowling leaderboard
                    </div>
                    <h2 className="text-xl font-bold text-white">Bowlers Ranked by Current Filters</h2>
                    <p className="mt-1 text-sm text-white/60">
                      Compare wicket impact, control, economy, strike rate, and best spells in one table.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="oil-table-stat-pill oil-table-stat-pill--teal">{filteredAndSortedPlayers.length} bowlers</span>
                    <span className="oil-table-stat-pill oil-table-stat-pill--gold">{getSelectedTeamLabel()}</span>
                    <span className="oil-table-stat-pill oil-table-stat-pill--cyan">Sorted by {sortField}</span>
                  </div>
                </div>
              </div>
              <div className="oil-table-scroll custom-scrollbar" tabIndex={0}>
                <table className="oil-table oil-data-table oil-data-table--stats">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-5 py-4 text-left">Rank</th>
                      <th className="oil-table-sticky-name px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="oil-table-sort group"
                        >
                          Player
                          <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('wickets')}
                          className="oil-table-sort group"
                        >
                          Wickets
                          <SortIcon field="wickets" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('average')}
                          className="oil-table-sort group"
                        >
                          Avg
                          <SortIcon field="average" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('economy')}
                          className="oil-table-sort group"
                        >
                          Economy
                          <SortIcon field="economy" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('strikeRate')}
                          className="oil-table-sort group"
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
                          className="oil-table-sort group"
                        >
                          5W
                          <SortIcon field="fiveWickets" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Best</th>
                      <th className="oil-table-sticky-action px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAndSortedPlayers.map((player, index) => {
                      const team = teams.find(t => String(t.id) === String(player.teamId));
                      const wickets = player.stats?.wickets || 0;
                      const maxWickets = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.wickets || 0), 1);
                      const wicketsPercentage = (wickets / maxWickets) * 100;
                      const overs = player.stats?.balls ? Math.floor(player.stats.balls / 6) : 0;
                      const balls = player.stats?.balls ? player.stats.balls % 6 : 0;
                      const oversDisplay = overs > 0 ? `${overs}.${balls}` : '0.0';
                      const bowlingAverage = (() => {
                        if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'string' && player.stats.bowlingAverage !== '0' && player.stats.bowlingAverage !== '-') {
                          return player.stats.bowlingAverage;
                        }
                        if (player.stats?.bowlingAverage && typeof player.stats.bowlingAverage === 'number' && player.stats.bowlingAverage > 0) {
                          return player.stats.bowlingAverage.toFixed(2);
                        }
                        const runsConceded = player.stats?.runsConceded || 0;
                        return wickets > 0 && runsConceded >= 0 ? (runsConceded / wickets).toFixed(2) : '-';
                      })();
                      const economy = (() => {
                        if (player.stats?.economy && typeof player.stats.economy === 'string' && player.stats.economy !== '0' && player.stats.economy !== '-') {
                          return player.stats.economy;
                        }
                        if (player.stats?.economy && typeof player.stats.economy === 'number' && player.stats.economy > 0) {
                          return player.stats.economy.toFixed(2);
                        }
                        const totalBalls = player.stats?.balls || 0;
                        const runsConceded = player.stats?.runsConceded || 0;
                        return totalBalls > 0 && runsConceded >= 0 ? ((runsConceded * 6) / totalBalls).toFixed(2) : '-';
                      })();
                      const bowlingStrikeRate = (() => {
                        if (player.stats?.bowlingStrikeRate && player.stats.bowlingStrikeRate !== '0' && player.stats.bowlingStrikeRate !== '-') {
                          return player.stats.bowlingStrikeRate;
                        }
                        const totalBalls = player.stats?.balls || 0;
                        return wickets > 0 && totalBalls > 0 ? (totalBalls / wickets).toFixed(1) : '-';
                      })();

                      return (
                        <tr key={player.id} className="group">
                          <td className="px-5 py-4">
                            <span className="oil-table-rank">#{index + 1}</span>
                          </td>
                          <td className="oil-table-sticky-name px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="oil-table-avatar bg-gradient-to-br from-[#4cc39a] to-[#126e89]">
                                {player.name?.charAt(0) || '?'}
                              </div>
                              <div className="min-w-[180px]">
                                <div className="font-semibold text-white group-hover:text-[#9cf2c8] transition-colors">{player.name || 'Unknown Player'}</div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  <span className="oil-table-stat-pill">{team?.shortName || 'No Team'}</span>
                                  <span className="oil-table-stat-pill oil-table-stat-pill--teal">{player.role || 'Player'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <span className="text-lg font-extrabold text-white group-hover:text-[#9cf2c8] transition-colors">{wickets}</span>
                              <div className="oil-table-progress">
                                <span
                                  className="bg-gradient-to-r from-[#4cc39a] via-[#4fb6c4] to-[#d7a85b]"
                                  style={{ width: `${wicketsPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--teal">{bowlingAverage}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--gold">{economy}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--cyan">{bowlingStrikeRate}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill">{player.stats?.bowlingInnings || 0} inn</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill">{oversDisplay} ov</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--cyan">{player.stats?.maidens || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--teal">{player.stats?.fiveWickets || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--gold">{player.stats?.bestBowling || '-'}</span>
                          </td>
                          <td className="oil-table-sticky-action px-6 py-4">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="oil-row-action-button oil-row-action-button--teal oil-table-action mx-auto"
                              aria-label={`Edit bowling statistics for ${player.name || 'player'}`}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Stats
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
                  const teamPlayers = filteredAndSortedPlayers.filter(p => String(p.teamId) === String(team.id));
                  return teamPlayers.length > 0;
                })
                .map(team => {
                  const teamPlayers = filteredAndSortedPlayers.filter(p => String(p.teamId) === String(team.id));
                  const teamWickets = teamPlayers.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
                  const teamFiveWickets = teamPlayers.reduce((sum, p) => sum + (p.stats?.fiveWickets || 0), 0);
                  const teamMaidens = teamPlayers.reduce((sum, p) => sum + (p.stats?.maidens || 0), 0);

                  return (
                    <div key={team.id} className="oil-panel rounded-2xl overflow-hidden shadow-xl oil-rise">
                      {/* Team Header */}
                      <div className="bg-gradient-to-r from-[#4cc39a]/15 via-[#4fb6c4]/10 to-[#d7a85b]/10 p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#4cc39a] to-[#126e89] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {team.shortName || team.name.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                              <p className="text-gray-400 text-sm mt-1">
                                {teamPlayers.length} players - {teamPlayers.filter(p => p.stats?.bowlingInnings > 0).length} wicket-taking bowlers
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{teamWickets}</div>
                              <div className="text-gray-400 text-xs">Wickets</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-teal-400">{teamFiveWickets}</div>
                              <div className="text-gray-400 text-xs">Five-Wicket Hauls</div>
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
                                className="oil-stat-card oil-stat-card--teal rounded-xl p-5 group"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-[#4cc39a] to-[#126e89] rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-all duration-200">
                                    {player.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate group-hover:text-[#9cf2c8] transition-colors">{player.name || 'Unknown Player'}</div>
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
                                      className="h-full bg-gradient-to-r from-[#4cc39a] via-[#4fb6c4] to-[#d7a85b] transition-all"
                                      style={{ width: `${wicketsPercentage}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-[#07110f]/70 rounded-lg p-2 text-center border border-[#4cc39a]/20">
                                      <div className="text-[#9cf2c8] font-semibold">
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
                                      <div className="text-xs text-gray-400">Average</div>
                                    </div>
                                    <div className="bg-[#07110f]/70 rounded-lg p-2 text-center border border-[#d7a85b]/20">
                                      <div className="text-[#f2d39a] font-semibold">
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
                                      <div className="text-xs text-gray-400">Economy</div>
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
                                  className="oil-btn-primary w-full px-4 py-2 text-sm"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit Bowling
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
          title="Export Bowling Stats"
          description="Download the currently filtered bowling dataset as PDF, CSV, or SQL."
          variant="default"
          size="lg"
          icon={
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-700 via-amber-700 to-rose-700 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-4 bg-stone-950/70 border border-white/10 rounded-xl">
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
                className="p-4 bg-stone-950/60 hover:bg-stone-900/70 border border-lime-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-lime-500/15 flex items-center justify-center">
                    <FileDown className="w-6 h-6 text-lime-300" />
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
                className="p-4 bg-stone-950/60 hover:bg-stone-900/70 border border-emerald-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
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
                className="p-4 bg-stone-950/60 hover:bg-stone-900/70 border border-amber-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
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
              <div className="p-4 bg-lime-500/10 border border-lime-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-lime-300 border-t-transparent rounded-full animate-spin" />
                  <p className="text-lime-200 text-sm">Exporting bowling stats...</p>
                </div>
              </div>
            )}
          </div>
        </ModernDialog>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="oil-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="oil-modal-shell oil-editor-shell w-full max-w-6xl max-h-[96vh] overflow-hidden text-white">
              <div className="oil-modal-header oil-editor-header p-6">
                <div className="relative z-10 flex items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="oil-modal-icon">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="oil-hero-kicker mb-2">
                        <Gauge className="h-3.5 w-3.5" />
                        Bowler record editor
                      </div>
                      <h2 className="text-2xl font-bold text-white">Edit Bowling Statistics</h2>
                      <p className="mt-1 text-sm leading-5 text-white/70">
                        Update spells, wickets, maidens, economy, strike rate, and best figures for {editForm.name || 'this player'}.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:grid grid-cols-3 gap-2 text-right">
                    <div className="rounded-2xl border border-[#4cc39a]/25 bg-[#4cc39a]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9cf2c8]">Wickets</p>
                      <p className="mt-1 text-xl font-black text-white">{editForm.stats.wickets || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-[#d7a85b]/25 bg-[#d7a85b]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2d39a]">Econ</p>
                      <p className="mt-1 text-xl font-black text-white">{editForm.stats.economy || '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#4fb6c4]/25 bg-[#4fb6c4]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8e9ef]">SR</p>
                      <p className="mt-1 text-xl font-black text-white">{editForm.stats.bowlingStrikeRate || '-'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="oil-modal-close flex-shrink-0"
                    aria-label="Close bowling statistics editor"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="oil-modal-body oil-editor-body custom-scrollbar overflow-y-auto max-h-[calc(95vh-176px)]">
                <div className="oil-modal-strip oil-editor-strip p-6 border-b border-white/10">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1fr] gap-4">
                    <div className="oil-modal-readonly-card oil-editor-identity-card p-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#f2d39a] mb-2 uppercase tracking-wide">
                        <User className="w-3.5 h-3.5" />
                        Player Name
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#d7a85b]/15 border border-[#d7a85b]/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#f2d39a]" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-white">{editForm.name || editingPlayer?.name || 'N/A'}</div>
                          <div className="text-xs text-white/45">Locked squad identity</div>
                        </div>
                      </div>
                    </div>

                    <div className="oil-modal-readonly-card oil-editor-identity-card p-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#9cf2c8] mb-2 uppercase tracking-wide">
                        <Activity className="w-3.5 h-3.5" />
                        Role
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4cc39a]/15 border border-[#4cc39a]/30 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-[#9cf2c8]" />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full border border-[#4cc39a]/30 bg-[#4cc39a]/10 px-3 py-1 text-sm font-semibold text-[#9cf2c8]">
                            {editForm.role || editingPlayer?.role || 'N/A'}
                          </span>
                          <div className="mt-1 text-xs text-white/45">Role is managed in player profile</div>
                        </div>
                      </div>
                    </div>

                    <div className="oil-modal-readonly-card oil-editor-identity-card p-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#a8e9ef] mb-2 uppercase tracking-wide">
                        <Shirt className="w-3.5 h-3.5" />
                        Jersey Number
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4fb6c4]/15 border border-[#4fb6c4]/30 flex items-center justify-center">
                          <Hash className="w-5 h-5 text-[#a8e9ef]" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">{editForm.jerseyNumber || editingPlayer?.jerseyNumber || 'N/A'}</div>
                          <div className="text-xs text-white/45">Match-sheet number</div>
                        </div>
                      </div>
                    </div>

                    <div className="oil-modal-readonly-card oil-editor-score-card p-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#ffaaa5] mb-3 uppercase tracking-wide">
                        <Gauge className="w-3.5 h-3.5" />
                        Bowling Snapshot
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Best</p>
                          <p className="text-lg font-black text-[#f2d39a]">{editForm.stats.bestBowling || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Balls</p>
                          <p className="text-lg font-black text-[#9cf2c8]">{editForm.stats.balls || 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Maidens</p>
                          <p className="text-lg font-black text-[#a8e9ef]">{editForm.stats.maidens || 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">5W</p>
                          <p className="text-lg font-black text-[#ffaaa5]">{editForm.stats.fiveWickets || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <BarChart3 className="w-5 h-5 text-[#f2d39a]" />
                          Match Context
                        </h3>
                        <p className="mt-1 text-sm text-white/55">Appearances, bowling innings, and legal balls delivered.</p>
                      </div>
                      <span className="oil-chip">Spell setup</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--gold p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#f2d39a] mb-2">
                          <Calendar className="w-4 h-4" />
                          Matches
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.matches}
                          onChange={(e) => handleFormChange('stats.matches', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Matches played"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <TargetIcon className="w-4 h-4" />
                          Bowling Innings
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.bowlingInnings}
                          onChange={(e) => handleFormChange('stats.bowlingInnings', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Innings bowled"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <ZapIcon className="w-4 h-4" />
                          Balls
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.balls}
                          onChange={(e) => handleFormChange('stats.balls', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Legal balls"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <TrendingDown className="w-5 h-5 text-[#9cf2c8]" />
                          Bowling Performance
                        </h3>
                        <p className="mt-1 text-sm text-white/55">Wickets, maiden overs, and runs conceded.</p>
                      </div>
                      <span className="oil-chip">Wicket output</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <TargetIcon className="w-4 h-4" />
                          Wickets
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.wickets}
                          onChange={(e) => handleFormChange('stats.wickets', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Wickets taken"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <ShieldCheck className="w-4 h-4" />
                          Maiden Overs
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.maidens}
                          onChange={(e) => handleFormChange('stats.maidens', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Maidens"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--copper p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-amber-100 mb-2">
                          <BarChart3 className="w-4 h-4" />
                          Runs Conceded
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.runsConceded}
                          onChange={(e) => handleFormChange('stats.runsConceded', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Runs conceded"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <Gauge className="w-5 h-5 text-[#f2d39a]" />
                          Rates and Milestones
                        </h3>
                        <p className="mt-1 text-sm text-white/55">Economy, average, strike rate, best figures, and five-wicket hauls.</p>
                      </div>
                      <span className="oil-chip">Scorecard metrics</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <Gauge className="w-4 h-4" />
                          Economy
                        </label>
                        <input
                          type="text"
                          value={editForm.stats.economy}
                          onChange={(e) => handleFormChange('stats.economy', e.target.value)}
                          className="oil-modal-input oil-editor-input"
                          placeholder="e.g., 8.25"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <BarChart3 className="w-4 h-4" />
                          Bowling Average
                        </label>
                        <input
                          type="text"
                          value={editForm.stats.bowlingAverage}
                          onChange={(e) => handleFormChange('stats.bowlingAverage', e.target.value)}
                          className="oil-modal-input oil-editor-input"
                          placeholder="e.g., 25.50"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--gold p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#f2d39a] mb-2">
                          <ZapIcon className="w-4 h-4" />
                          Strike Rate
                        </label>
                        <input
                          type="text"
                          value={editForm.stats.bowlingStrikeRate}
                          onChange={(e) => handleFormChange('stats.bowlingStrikeRate', e.target.value)}
                          className="oil-modal-input oil-editor-input"
                          placeholder="e.g., 18.5"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--copper p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-amber-100 mb-2">
                          <AwardIcon className="w-4 h-4" />
                          Best Bowling
                        </label>
                        <input
                          type="text"
                          value={editForm.stats.bestBowling}
                          onChange={(e) => handleFormChange('stats.bestBowling', e.target.value)}
                          className="oil-modal-input oil-editor-input"
                          placeholder="e.g., 5/25"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--rose p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#ffaaa5] mb-2">
                          <AwardIcon className="w-4 h-4" />
                          Five-Wicket Hauls
                        </label>
                        <input
                          type="number"
                          value={editForm.stats.fiveWickets}
                          onChange={(e) => handleFormChange('stats.fiveWickets', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="oil-modal-input oil-editor-input"
                          placeholder="5-wicket hauls"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="oil-modal-footer oil-editor-footer flex flex-col-reverse gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-white/60">Changes update the IPL bowling table and export-ready player sheet.</p>
                <div className="oil-modal-footer-actions">
                  <button onClick={handleCancelEdit} className="oil-btn-secondary px-5 py-2.5">
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                  <button onClick={handleSavePlayer} className="oil-btn-primary px-5 py-2.5">
                    <Edit2 className="w-4 h-4" />
                    Save Bowling Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </>
  );
};

export default BowlingStatsPage;
