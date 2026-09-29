'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import ModernDialog from '@/components/admin/ModernDialog';
import PlayersStatsSubNav from '@/components/admin/PlayersStatsSubNav';
import { exportStatsData } from '@/lib/admin/statsExportUtils';
import {
  calculateBattingDerivedStats,
  formatBattingDerivedStats,
  getBattingAverageDisplayFromStats,
  getBattingAverageSortValue,
  getBattingStrikeRateDisplayFromStats,
  getBattingStrikeRateSortValue,
  parseBattingStatInput,
  parseBattingStatNumber,
} from '@/lib/admin/battingStatsUtils';
import { getQuickFilterCounts, PLAYER_QUICK_FILTERS, playerMatchesQuickFilter, PlayerQuickFilterId } from '@/lib/admin/playerQuickFilters';
import { Search, Filter, Edit2, X, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, Calendar, BarChart3, Target as TargetIcon, Award as AwardIcon, Zap as ZapIcon, Hash, Activity, ShieldCheck, LayoutGrid, Table2, Download, FileDown, FileText, Database, DatabaseBackup } from 'lucide-react';

const NOT_SELECTED_SEASON_FILTER = '__not_selected_season__';

const isInNotSelectedSeasonPool = (player: any) => {
  return player.isActiveInSquad === false || player.squadStatus === 'inactive';
};

const battingAuditLabels: Record<string, string> = {
  matches: 'Matches',
  battingInnings: 'Batting Innings',
  notOuts: 'Not Outs',
  runs: 'Runs',
  ballsFaced: 'Balls Faced',
  highest: 'Top Score',
  fours: 'Fours',
  sixes: 'Sixes',
  fifties: 'Fifties',
  hundreds: 'Centuries',
  ducks: 'Ducks',
  battingAverage: 'Batting Average',
  battingStrikeRate: 'Strike Rate'
};

const normalizeAuditValue = (value: any) => {
  if (value === undefined || value === null || value === '') return '';
  return String(value).trim();
};

const displayAuditValue = (value: any) => {
  const normalized = normalizeAuditValue(value);
  return normalized === '' ? '0' : normalized;
};

const getChangedStatFields = (originalForm: any, currentForm: any, labels: Record<string, string>) => {
  if (!originalForm?.stats || !currentForm?.stats) return [];

  return Object.entries(labels).reduce((changes: any[], [field, label]) => {
    const previousValue = normalizeAuditValue(originalForm.stats[field]);
    const newValue = normalizeAuditValue(currentForm.stats[field]);

    if (previousValue !== newValue) {
      changes.push({
        field,
        label,
        previousValue: displayAuditValue(previousValue),
        newValue: displayAuditValue(newValue)
      });
    }

    return changes;
  }, []);
};

const formatAuditDate = (value?: string) => {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return parsed.toLocaleString();
};

const BATTING_AVERAGE_INPUT_FIELDS = new Set(['battingInnings', 'notOuts', 'runs']);
const BATTING_STRIKE_RATE_INPUT_FIELDS = new Set(['runs', 'ballsFaced']);

const getDerivedBattingStatsFromForm = (stats: {
  battingInnings: string | number;
  notOuts: string | number;
  runs: string | number;
  ballsFaced: string | number;
}) => {
  const battingInnings = parseBattingStatNumber(stats.battingInnings);
  const notOuts = parseBattingStatNumber(stats.notOuts);
  const runs = parseBattingStatNumber(stats.runs);
  const ballsFaced = parseBattingStatNumber(stats.ballsFaced);
  const derived = calculateBattingDerivedStats({ battingInnings, notOuts, runs, ballsFaced });
  return formatBattingDerivedStats(derived, battingInnings, notOuts, ballsFaced);
};

const BattingStatsPage = () => {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const { players, teams, loading, error, updatePlayer, refreshData, lastUpdated } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [originalEditForm, setOriginalEditForm] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [quickFilter, setQuickFilter] = useState<PlayerQuickFilterId>('all');
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
      ducks: '',
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
          router.push('/ops/ipl');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        console.log('Batting Stats: Auth response:', data);

        if (!response.ok || !data.success) {
          console.log('Batting Stats: Auth failed, redirecting to dashboard');
          router.push('/ops/ipl');
          return;
        }

        const role = data.user?.role;
        console.log('Batting Stats: User role:', role);
        setUserRole(role);
        setCurrentAdminEmail(data.user?.email || data.user?.name || 'Unknown admin');

        if (role !== 'admin' && role !== 'user' && role !== 'super_admin' && role !== 'players_admin') {
          console.log('Batting Stats: Role not allowed, redirecting to dashboard');
          alert('Access denied. Admin privileges required.');
          router.push('/ops/ipl');
          return;
        }

        console.log('Batting Stats: Authentication successful, showing page');
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Batting Stats: Auth error:', error);
        router.push('/ops/ipl');
      }
    };

    checkAuth();
  }, [router]);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingPlayer(null);
    setOriginalEditForm(null);
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

    const baseStats = {
      battingInnings: player.stats?.battingInnings > 0 ? player.stats.battingInnings : '',
      notOuts: player.stats?.notOuts > 0 ? player.stats.notOuts : '',
      runs: player.stats?.runs > 0 ? player.stats.runs : '',
      ballsFaced: player.stats?.ballsFaced > 0 ? player.stats.ballsFaced : '',
    };
    const derivedStats = getDerivedBattingStatsFromForm(baseStats);

    const nextEditForm = {
      name: player.name || '',
      role: player.role || '',
      age: player.age || '',
      jerseyNumber: player.jerseyNumber || '',
      stats: {
        matches: player.stats?.matches > 0 ? player.stats.matches : '',
        battingInnings: baseStats.battingInnings,
        notOuts: baseStats.notOuts,
        runs: baseStats.runs,
        ballsFaced: baseStats.ballsFaced,
        highest: player.stats?.highest > 0 ? player.stats.highest : '',
        fours: player.stats?.fours > 0 ? player.stats.fours : '',
        sixes: player.stats?.sixes > 0 ? player.stats.sixes : '',
        fifties: player.stats?.fifties > 0 ? player.stats.fifties : '',
        hundreds: player.stats?.hundreds > 0 ? player.stats.hundreds : '',
        ducks: player.stats?.ducks > 0 ? player.stats.ducks : '',
        battingAverage: derivedStats.battingAverage,
        battingStrikeRate: derivedStats.battingStrikeRate,
      }
    };

    setEditForm(nextEditForm);
    setOriginalEditForm(nextEditForm);
    setShowEditModal(true);
  };

  const liveDerivedBattingStats = useMemo(
    () => getDerivedBattingStatsFromForm(editForm.stats),
    [
      editForm.stats.battingInnings,
      editForm.stats.notOuts,
      editForm.stats.runs,
      editForm.stats.ballsFaced,
    ],
  );

  useEffect(() => {
    if (!showEditModal) return;

    setEditForm((prev) => {
      if (
        prev.stats.battingAverage === liveDerivedBattingStats.battingAverage &&
        prev.stats.battingStrikeRate === liveDerivedBattingStats.battingStrikeRate
      ) {
        return prev;
      }

      return {
        ...prev,
        stats: {
          ...prev.stats,
          battingAverage: liveDerivedBattingStats.battingAverage,
          battingStrikeRate: liveDerivedBattingStats.battingStrikeRate,
        },
      };
    });
  }, [liveDerivedBattingStats, showEditModal]);

  const changedFields = useMemo(
    () => getChangedStatFields(originalEditForm, editForm, battingAuditLabels),
    [editForm, originalEditForm]
  );
  const hasUnsavedChanges = changedFields.length > 0;
  const lastStatsAudit = (editingPlayer as any)?.statsAudit?.batting;

  const handleSavePlayer = async () => {
    try {
      if (!editingPlayer || !hasUnsavedChanges) {
        return;
      }

      const runs = parseBattingStatNumber(editForm.stats.runs, editingPlayer.stats?.runs || 0);
      const battingInnings = parseBattingStatNumber(
        editForm.stats.battingInnings,
        editingPlayer.stats?.battingInnings || 0,
      );
      const notOuts = parseBattingStatNumber(editForm.stats.notOuts, editingPlayer.stats?.notOuts || 0);
      const ballsFaced = parseBattingStatNumber(
        editForm.stats.ballsFaced,
        editingPlayer.stats?.ballsFaced || 0,
      );

      const derived = calculateBattingDerivedStats({ battingInnings, notOuts, runs, ballsFaced });
      const { battingAverage: battingAverageStr, battingStrikeRate: battingStrikeRateStr } =
        formatBattingDerivedStats(derived, battingInnings, notOuts, ballsFaced);
      const averageNum = Number(derived.battingAverage.toFixed(2));
      const strikeRateNum = Number(derived.strikeRate.toFixed(2));

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
        ducks: editForm.stats.ducks === '' ? (editingPlayer.stats?.ducks || 0) : (typeof editForm.stats.ducks === 'number' ? editForm.stats.ducks : parseInt(editForm.stats.ducks) || 0),
        // String versions for admin display
        battingAverage: battingAverageStr,
        battingStrikeRate: battingStrikeRateStr,
        // Numeric versions for end-user pages - CRITICAL: Always set these explicitly
        average: averageNum,
        strikeRate: strikeRateNum
      };

      // CRITICAL: Use editingPlayer values for read-only fields (name, role, jerseyNumber)
      // These fields are now read-only in the UI, so we must use the original player data
      const auditTimestamp = new Date().toISOString();

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
        statsAudit: {
          ...(editingPlayer.statsAudit || {}),
          batting: {
            updatedBy: currentAdminEmail || 'Unknown admin',
            updatedAt: auditTimestamp,
            changes: changedFields
          }
        },
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
      setOriginalEditForm(null);
    } catch (error) {
      console.error('Failed to update player:', error);
      alert(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('stats.')) {
      const statField = field.replace('stats.', '');
      setEditForm((prev) => {
        const nextStats = {
          ...prev.stats,
          [statField]: value,
        };

        if (
          BATTING_AVERAGE_INPUT_FIELDS.has(statField) ||
          BATTING_STRIKE_RATE_INPUT_FIELDS.has(statField)
        ) {
          const derivedStats = getDerivedBattingStatsFromForm(nextStats);
          nextStats.battingAverage = derivedStats.battingAverage;
          nextStats.battingStrikeRate = derivedStats.battingStrikeRate;
        }

        return {
          ...prev,
          stats: nextStats,
        };
      });
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const baseFilteredPlayers = useMemo(() => {
    return players.filter(player => {
      const isIPL = (player.league || 'ipl') === 'ipl';
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           String(player.teamId || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedTeam === NOT_SELECTED_SEASON_FILTER) {
        return isIPL && matchesSearch && isInNotSelectedSeasonPool(player);
      }

      const matchesTeam = selectedTeam === 'all' || String(player.teamId || '') === String(selectedTeam);
      return isIPL && matchesSearch && matchesTeam;
    });
  }, [players, searchQuery, selectedTeam]);

  const quickFilterCounts = useMemo(
    () => getQuickFilterCounts(baseFilteredPlayers, 'batting'),
    [baseFilteredPlayers]
  );

  // Filter and sort players - Only show IPL players (WPL doesn't need stats)
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = baseFilteredPlayers.filter(player => playerMatchesQuickFilter(player, quickFilter, 'batting'));

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
          aVal = getBattingAverageSortValue(a.stats || {});
          bVal = getBattingAverageSortValue(b.stats || {});
          break;
        case 'strikeRate':
          aVal = getBattingStrikeRateSortValue(a.stats || {});
          bVal = getBattingStrikeRateSortValue(b.stats || {});
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
  }, [baseFilteredPlayers, quickFilter, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    // Filter players based on team selection and search query first
    const playersForStats = baseFilteredPlayers.filter(player => playerMatchesQuickFilter(player, quickFilter, 'batting'));
    
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
  }, [baseFilteredPlayers, quickFilter, searchQuery]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />;
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
      <div className="flex-1 ipl-oil-admin-page min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(215,168,91,0.06),transparent)] pointer-events-none" />
        
        {/* Hero Header */}
        <div className="relative oil-hero p-6 lg:p-8 shadow-2xl">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="oil-rise">
                <div className="oil-hero-kicker mb-3">
                  <Activity className="h-3.5 w-3.5" />
                  IPL batting desk
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-[#d7a85b]/15 backdrop-blur rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-black/20 border border-[#d7a85b]/30">
                    <TrendingUp className="w-6 h-6 text-[#f2d39a]" />
                  </div>
                  <span>Batting Stats Control Room</span>
                </h1>
                <p className="text-sm leading-6 text-white/70 max-w-3xl">
                  Review IPL batting records by runs, innings, strike rate, boundaries, milestones, and export-ready
                  player sheets.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 oil-rise">
                <div className="oil-stat-card oil-stat-card--gold p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500">{summaryStats.activeBatsmen}</div>
                  <div className="text-[#f2d39a] text-sm mt-1 font-semibold">Scoring Batters</div>
                </div>
                <div className="oil-stat-card oil-stat-card--teal p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white animate-in zoom-in duration-500 delay-100">{teams.length}</div>
                  <div className="text-[#9cf2c8] text-sm mt-1 font-semibold">IPL Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8 relative z-10">
          <PlayersStatsSubNav />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="oil-stat-card oil-stat-card--gold p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-[#f2d39a] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalRuns.toLocaleString()}</div>
              <div className="text-[#f2d39a] text-xs mt-1 font-semibold uppercase tracking-wider">Runs Scored</div>
            </div>
            <div className="oil-stat-card oil-stat-card--cyan p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-[#a8e9ef] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.highestScore}</div>
              <div className="text-[#a8e9ef] text-xs mt-1 font-semibold uppercase tracking-wider">Top Score</div>
            </div>
            <div className="oil-stat-card oil-stat-card--rose p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-[#ffaaa5] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalHundreds}</div>
              <div className="text-pink-100 text-xs mt-1 font-semibold uppercase tracking-wider">Centuries</div>
            </div>
            <div className="oil-stat-card oil-stat-card--copper p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.totalFifties}</div>
              <div className="text-amber-100 text-xs mt-1 font-semibold uppercase tracking-wider">Fifties</div>
            </div>
            <div className="oil-stat-card oil-stat-card--teal p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{summaryStats.avgRuns}</div>
              <div className="text-emerald-100 text-xs mt-1 font-semibold uppercase tracking-wider">Runs per Batter</div>
            </div>
            <div className="oil-stat-card oil-stat-card--slate p-5 oil-rise group">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-slate-200 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{filteredAndSortedPlayers.length}</div>
              <div className="text-slate-200 text-xs mt-1 font-semibold uppercase tracking-wider">Filtered Batters</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="oil-toolbar rounded-2xl p-6 mb-6 transition-all duration-200 oil-rise">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 group-focus-within:text-[#f2d39a] transition-colors" />
                <input
                  type="text"
                  id="search-players"
                  name="searchPlayers"
                  placeholder="Search batter, team, role, or nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="oil-field w-full pl-10 pr-4 py-2.5"
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 group-focus-within:text-[#9cf2c8] transition-colors" />
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
                      ? 'bg-[#d7a85b]/20 text-white shadow-lg'
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
                      ? 'bg-[#d7a85b]/20 text-white shadow-lg'
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
                className="oil-btn-warm px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              {PLAYER_QUICK_FILTERS.map((filter) => {
                const isActive = quickFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQuickFilter(filter.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-[#d7a85b]/45 bg-[#d7a85b]/20 text-white shadow-lg shadow-[#d7a85b]/10'
                        : 'border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-white/55'}`}>
                      {quickFilterCounts[filter.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players Table or Team Panels */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="oil-panel rounded-2xl p-16 text-center oil-rise">
              <div className="w-20 h-20 bg-[#d7a85b]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-[#d7a85b]/20">
                <Search className="w-10 h-10 text-[#f2d39a]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Batters Match These Filters</h3>
              <p className="text-gray-400 text-lg mb-6">Try a different player name, team, or batting metric.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="oil-table-shell oil-table-shell--pro rounded-2xl overflow-hidden shadow-2xl oil-rise">
              <div className="oil-table-header p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="oil-hero-kicker mb-2">
                      <Table2 className="h-3.5 w-3.5" />
                      Batting leaderboard
                    </div>
                    <h2 className="text-xl font-bold text-white">Batters Ranked by Current Filters</h2>
                    <p className="mt-1 text-sm text-white/60">
                      Review scoring form, boundary impact, innings volume, and milestones in one table.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="oil-table-stat-pill oil-table-stat-pill--gold">{filteredAndSortedPlayers.length} batters</span>
                    <span className="oil-table-stat-pill oil-table-stat-pill--teal">{getSelectedTeamLabel()}</span>
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
                          onClick={() => handleSort('runs')}
                          className="oil-table-sort group"
                        >
                          Runs
                          <SortIcon field="runs" />
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
                          onClick={() => handleSort('strikeRate')}
                          className="oil-table-sort group"
                        >
                          SR
                          <SortIcon field="strikeRate" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('highest')}
                          className="oil-table-sort group"
                        >
                          HS
                          <SortIcon field="highest" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('hundreds')}
                          className="oil-table-sort group"
                        >
                          100s
                          <SortIcon field="hundreds" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('fifties')}
                          className="oil-table-sort group"
                        >
                          50s
                          <SortIcon field="fifties" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">4s/6s</th>
                      <th className="oil-table-sticky-action px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAndSortedPlayers.map((player, index) => {
                      const team = teams.find(t => String(t.id) === String(player.teamId));
                      const runs = player.stats?.runs || 0;
                      const maxRuns = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.runs || 0), 1);
                      const runsPercentage = (runs / maxRuns) * 100;
                      const battingAverage = getBattingAverageDisplayFromStats(player.stats || {});
                      const battingStrikeRate = getBattingStrikeRateDisplayFromStats(player.stats || {});

                      return (
                        <tr key={player.id} className="group">
                          <td className="px-5 py-4">
                            <span className="oil-table-rank">#{index + 1}</span>
                          </td>
                          <td className="oil-table-sticky-name px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="oil-table-avatar bg-gradient-to-br from-[#d7a85b] to-[#126e89]">
                                {player.name?.charAt(0) || '?'}
                              </div>
                              <div className="min-w-[180px]">
                                <div className="font-semibold text-white group-hover:text-[#f2d39a] transition-colors">{player.name || 'Unknown Player'}</div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  <span className="oil-table-stat-pill">{team?.shortName || 'No Team'}</span>
                                  <span className="oil-table-stat-pill oil-table-stat-pill--gold">{player.role || 'Player'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <span className="text-lg font-extrabold text-white group-hover:text-[#f2d39a] transition-colors">{runs.toLocaleString()}</span>
                              <div className="oil-table-progress">
                                <span
                                  className="bg-gradient-to-r from-[#d7a85b] via-[#4cc39a] to-[#4fb6c4]"
                                  style={{ width: `${runsPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--teal">{battingAverage}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--cyan">{battingStrikeRate}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--gold">{player.stats?.highest || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill">{player.stats?.battingInnings || 0} inn</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--rose">{player.stats?.hundreds || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="oil-table-stat-pill oil-table-stat-pill--gold">{player.stats?.fifties || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <span className="oil-table-stat-pill oil-table-stat-pill--cyan">4s {player.stats?.fours || 0}</span>
                              <span className="oil-table-stat-pill oil-table-stat-pill--rose">6s {player.stats?.sixes || 0}</span>
                            </div>
                          </td>
                          <td className="oil-table-sticky-action px-6 py-4">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="oil-row-action-button oil-row-action-button--gold oil-table-action mx-auto"
                              aria-label={`Edit batting statistics for ${player.name || 'player'}`}
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
                .map((team, teamIndex) => {
                  const teamPlayers = filteredAndSortedPlayers.filter(p => String(p.teamId) === String(team.id));
                  const teamRuns = teamPlayers.reduce((sum, p) => sum + (p.stats?.runs || 0), 0);
                  const teamHundreds = teamPlayers.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0);
                  const teamFifties = teamPlayers.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0);

                  return (
                    <div key={team.id} className="oil-panel rounded-2xl overflow-hidden shadow-2xl oil-rise" style={{ animationDelay: `${teamIndex * 100}ms` }}>
                      {/* Team Header */}
                      <div className="bg-gradient-to-r from-[#d7a85b]/15 via-[#4cc39a]/10 to-[#4fb6c4]/10 p-6 border-b border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#d7a85b] via-[#b7792f] to-[#126e89] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl group-hover:scale-105 transition-all duration-200">
                              {team.shortName || team.name.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white group-hover:text-[#f2d39a] transition-colors">{team.name}</h2>
                              <p className="text-gray-400 text-sm mt-1">
                                {teamPlayers.length} players - {teamPlayers.filter(p => p.stats?.battingInnings > 0).length} scoring batters
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
                              <div className="text-gray-400 text-xs font-semibold">Centuries</div>
                            </div>
                            <div className="text-center bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-all">
                              <div className="text-2xl font-bold text-orange-400">{teamFifties}</div>
                              <div className="text-gray-400 text-xs font-semibold">Fifties</div>
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
                                className="oil-stat-card oil-stat-card--gold rounded-2xl p-5 group cursor-pointer oil-rise"
                                style={{ animationDelay: `${playerIndex * 50}ms` }}
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-[#d7a85b] via-[#b7792f] to-[#126e89] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-all duration-200">
                                    {player.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate group-hover:text-[#f2d39a] transition-colors">{player.name || 'Unknown Player'}</div>
                                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{player.role}</div>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm font-medium">Runs</span>
                                    <span className="font-bold text-white group-hover:text-[#f2d39a] transition-colors">{runs.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#d7a85b] via-[#4cc39a] to-[#4fb6c4] transition-all duration-700 shadow-lg shadow-[#d7a85b]/30"
                                      style={{ width: `${runsPercentage}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-[#07110f]/70 rounded-xl p-2 text-center border border-[#d7a85b]/20 hover:border-[#d7a85b]/50 transition-all">
                                      <div className="text-[#f2d39a] font-semibold">
                                        {getBattingAverageDisplayFromStats(player.stats || {})}
                                      </div>
                                      <div className="text-xs text-gray-400 font-semibold">Average</div>
                                    </div>
                                    <div className="bg-[#07110f]/70 rounded-xl p-2 text-center border border-[#4fb6c4]/20 hover:border-[#4fb6c4]/50 transition-all">
                                      <div className="text-[#a8e9ef] font-semibold">
                                        {getBattingStrikeRateDisplayFromStats(player.stats || {})}
                                      </div>
                                      <div className="text-xs text-gray-400 font-semibold">Strike Rate</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>High Score: {player.stats?.highest || '-'}</span>
                                    <span>{player.stats?.hundreds || 0} 100s / {player.stats?.fifties || 0} 50s</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleEditPlayer(player)}
                                  className="oil-btn-primary w-full px-4 py-2 text-sm"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit Batting
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
          <div className="oil-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="oil-modal-shell oil-editor-shell w-full max-w-6xl max-h-[96vh] overflow-hidden text-white">
              <div className="oil-modal-header oil-editor-header p-6">
                <div className="relative z-10 flex items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="oil-modal-icon">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="oil-hero-kicker mb-2">
                        <Target className="h-3.5 w-3.5" />
                        Batter record editor
                      </div>
                      <h2 className="text-2xl font-bold text-white">Edit Batting Statistics</h2>
                      <p className="mt-1 text-sm leading-5 text-white/70">
                        Update innings, scoring, boundaries, milestones, average, and strike-rate details for {editForm.name || 'this player'}.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:grid grid-cols-3 gap-2 text-right">
                    <div className="rounded-2xl border border-[#d7a85b]/25 bg-[#d7a85b]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2d39a]">Runs</p>
                      <p className="mt-1 text-xl font-black text-white">{editForm.stats.runs || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-[#4cc39a]/25 bg-[#4cc39a]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9cf2c8]">Avg</p>
                      <p className="mt-1 text-xl font-black text-white">{liveDerivedBattingStats.battingAverage || '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#4fb6c4]/25 bg-[#4fb6c4]/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8e9ef]">SR</p>
                      <p className="mt-1 text-xl font-black text-white">{liveDerivedBattingStats.battingStrikeRate || '-'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="oil-modal-close flex-shrink-0"
                    aria-label="Close batting statistics editor"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                  {[
                    { label: 'Runs', value: editForm.stats.runs || 0 },
                    { label: 'Innings', value: editForm.stats.battingInnings || 0 },
                    { label: 'Avg', value: liveDerivedBattingStats.battingAverage || '-' },
                    { label: 'SR', value: liveDerivedBattingStats.battingStrikeRate || '-' },
                    { label: '100s', value: editForm.stats.hundreds || 0 },
                    { label: '50s', value: editForm.stats.fifties || 0 },
                    { label: 'Ducks', value: editForm.stats.ducks || 0 }
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs shadow-sm"
                    >
                      <span className="font-bold uppercase tracking-wide text-white/45">{chip.label}</span>
                      <span className="font-black text-white">{chip.value}</span>
                    </div>
                  ))}
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
                        <BarChart3 className="w-3.5 h-3.5" />
                        Batting Snapshot
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Top Score</p>
                          <p className="text-lg font-black text-[#f2d39a]">{editForm.stats.highest || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Balls</p>
                          <p className="text-lg font-black text-[#9cf2c8]">{editForm.stats.ballsFaced || 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">4s</p>
                          <p className="text-lg font-black text-[#a8e9ef]">{editForm.stats.fours || 0}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">6s</p>
                          <p className="text-lg font-black text-[#ffaaa5]">{editForm.stats.sixes || 0}</p>
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
                        <p className="mt-1 text-sm text-white/55">Appearances, batting innings, and not-out count.</p>
                      </div>
                      <span className="oil-chip">Innings setup</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--gold p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#f2d39a] mb-2">
                          <Calendar className="w-4 h-4" />
                          Matches
                        </label>
                        <input
                          type="number"
                          id="edit-stats-matches"
                          name="statsMatches"
                          value={editForm.stats.matches}
                          onChange={(e) => handleFormChange('stats.matches', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Matches played"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <TargetIcon className="w-4 h-4" />
                          Batting Innings
                        </label>
                        <input
                          type="number"
                          id="edit-stats-batting-innings"
                          name="statsBattingInnings"
                          value={editForm.stats.battingInnings}
                          onChange={(e) => handleFormChange('stats.battingInnings', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Innings batted"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <ShieldCheck className="w-4 h-4" />
                          Not Outs
                        </label>
                        <input
                          type="number"
                          id="edit-stats-not-outs"
                          name="statsNotOuts"
                          value={editForm.stats.notOuts}
                          onChange={(e) => handleFormChange('stats.notOuts', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Not-out innings"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <TrendingUp className="w-5 h-5 text-[#9cf2c8]" />
                          Scoring Performance
                        </h3>
                        <p className="mt-1 text-sm text-white/55">Runs, top score, balls faced, and boundary hitting.</p>
                      </div>
                      <span className="oil-chip">Batting output</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--gold p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#f2d39a] mb-2">
                          <TargetIcon className="w-4 h-4" />
                          Runs
                        </label>
                        <input
                          type="number"
                          id="edit-stats-runs"
                          name="statsRuns"
                          value={editForm.stats.runs}
                          onChange={(e) => handleFormChange('stats.runs', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Total runs"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <Award className="w-4 h-4" />
                          Top Score
                        </label>
                        <input
                          type="number"
                          id="edit-stats-highest"
                          name="statsHighest"
                          value={editForm.stats.highest}
                          onChange={(e) => handleFormChange('stats.highest', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Highest score"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <ZapIcon className="w-4 h-4" />
                          Balls Faced
                        </label>
                        <input
                          type="number"
                          id="edit-stats-balls-faced"
                          name="statsBallsFaced"
                          value={editForm.stats.ballsFaced}
                          onChange={(e) => handleFormChange('stats.ballsFaced', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Balls faced"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--copper p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-amber-100 mb-2">
                          <Hash className="w-4 h-4" />
                          Fours
                        </label>
                        <input
                          type="number"
                          id="edit-stats-fours"
                          name="statsFours"
                          value={editForm.stats.fours}
                          onChange={(e) => handleFormChange('stats.fours', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Boundary fours"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--rose p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#ffaaa5] mb-2">
                          <ZapIcon className="w-4 h-4" />
                          Sixes
                        </label>
                        <input
                          type="number"
                          id="edit-stats-sixes"
                          name="statsSixes"
                          value={editForm.stats.sixes}
                          onChange={(e) => handleFormChange('stats.sixes', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Boundary sixes"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <AwardIcon className="w-5 h-5 text-[#f2d39a]" />
                          Milestones and Rates
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          Average is auto-calculated from innings, not outs, and runs. Strike rate is auto-calculated from runs and balls faced. Ducks are recorded separately.
                        </p>
                      </div>
                      <span className="oil-chip">Scorecard metrics</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--copper p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-amber-100 mb-2">
                          <AwardIcon className="w-4 h-4" />
                          Fifties
                        </label>
                        <input
                          type="number"
                          id="edit-stats-fifties"
                          name="statsFifties"
                          value={editForm.stats.fifties}
                          onChange={(e) => handleFormChange('stats.fifties', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="50+ scores"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--rose p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#ffaaa5] mb-2">
                          <AwardIcon className="w-4 h-4" />
                          Centuries
                        </label>
                        <input
                          type="number"
                          id="edit-stats-hundreds"
                          name="statsHundreds"
                          value={editForm.stats.hundreds}
                          onChange={(e) => handleFormChange('stats.hundreds', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="100+ scores"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--cyan p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#a8e9ef] mb-2">
                          <Hash className="w-4 h-4" />
                          Ducks
                        </label>
                        <input
                          type="number"
                          id="edit-stats-ducks"
                          name="statsDucks"
                          value={editForm.stats.ducks}
                          onChange={(e) => handleFormChange('stats.ducks', parseBattingStatInput(e.target.value))}
                          className="oil-modal-input oil-editor-input"
                          placeholder="Zero scores"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--teal p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#9cf2c8] mb-2">
                          <BarChart3 className="w-4 h-4" />
                          Batting Average
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white/35">Auto</span>
                        </label>
                        <input
                          type="text"
                          id="edit-stats-batting-average"
                          name="statsBattingAverage"
                          readOnly
                          value={liveDerivedBattingStats.battingAverage}
                          className="oil-modal-input oil-editor-input cursor-default bg-white/[0.03] text-white/80"
                          placeholder="Runs ÷ dismissals"
                        />
                      </div>
                      <div className="oil-modal-field-card oil-editor-field-card oil-modal-field-card--gold p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#f2d39a] mb-2">
                          <ZapIcon className="w-4 h-4" />
                          Strike Rate
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white/35">Auto</span>
                        </label>
                        <input
                          type="text"
                          id="edit-stats-batting-strike-rate"
                          name="statsBattingStrikeRate"
                          readOnly
                          value={liveDerivedBattingStats.battingStrikeRate}
                          className="oil-modal-input oil-editor-input cursor-default bg-white/[0.03] text-white/80"
                          placeholder="(Runs × 100) ÷ balls"
                        />
                      </div>
                    </div>
                  </section>
                  <section className="oil-modal-section oil-editor-section p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                          <DatabaseBackup className="w-5 h-5 text-[#a8e9ef]" />
                          Change Review
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          Save is enabled only after a stat value changes. Review the previous and new values before saving.
                        </p>
                      </div>
                      <span className={`oil-chip ${hasUnsavedChanges ? 'border-[#f2d39a]/40 text-[#f2d39a]' : ''}`}>
                        {changedFields.length} unsaved {changedFields.length === 1 ? 'change' : 'changes'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        {hasUnsavedChanges ? (
                          <div className="space-y-2">
                            {changedFields.map((change) => (
                              <div key={change.field} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
                                <span className="text-sm font-semibold text-white">{change.label}</span>
                                <span className="text-xs text-white/65">
                                  <span className="text-[#ffaaa5]">{change.previousValue}</span>
                                  <span className="px-2 text-white/35">to</span>
                                  <span className="text-[#9cf2c8]">{change.newValue}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/55">No stat values have changed in this edit session.</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="grid gap-3 text-sm">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Last edited by</p>
                            <p className="mt-1 text-white">{lastStatsAudit?.updatedBy || 'Not recorded'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Last edited time</p>
                            <p className="mt-1 text-white">{formatAuditDate(lastStatsAudit?.updatedAt)}</p>
                          </div>
                          {lastStatsAudit?.changes?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Previous saved values</p>
                              <div className="mt-2 space-y-1">
                                {lastStatsAudit.changes.slice(0, 3).map((change: any) => (
                                  <p key={`${change.field}-${change.previousValue}-${change.newValue}`} className="text-xs text-white/60">
                                    {change.label}: {change.previousValue} to {change.newValue}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="oil-modal-footer oil-editor-footer flex shrink-0 flex-col-reverse gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-white/60">
                  {hasUnsavedChanges
                    ? `${changedFields.length} batting ${changedFields.length === 1 ? 'field is' : 'fields are'} ready to save.`
                    : 'No batting stat changes to save.'}
                </p>
                <div className="oil-modal-footer-actions">
                  <button onClick={handleCancelEdit} className="oil-btn-secondary px-5 py-2.5">
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSavePlayer}
                    disabled={!hasUnsavedChanges}
                    className="oil-btn-warm px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Save Batting Stats
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

export default BattingStatsPage;
