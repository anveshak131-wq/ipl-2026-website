'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ModernDialog from '@/components/admin/ModernDialog';
import LeagueSwitch from '@/components/admin/LeagueSwitch';
import WPLTeamsManager from '@/components/admin/WPLTeamsManager';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { parseDateDDMMYYYY, formatDateDDMMYYYY, calculateAge, isValidDate, formatDateMonthDDYYYY, parseDateMonthDDYYYY, isValidDateForLeague } from '@/lib/dateUtils';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';
import '@/styles/flags.css';

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

// Cricket-playing countries (exclude Pakistan – not part of IPL/WPL)
const CRICKET_COUNTRIES = [
  'India', 'Australia', 'England', 'South Africa', 'New Zealand',
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

// Current season for which transfer rules apply (used to enforce auction locks)
const CURRENT_SEASON = 2027;

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility

export default function AdminPlayers() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<string | null>(null);
  const [lastCalculatedAge, setLastCalculatedAge] = useState<string>('');
  const [formData, setFormData] = useState<{
    name: string;
    role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
    teamId: string;
    league: 'ipl' | 'wpl';
    age: string;
    dateOfBirth: string; // DD/MM/YYYY format for input
    nationality: string;
    jerseyNumber: string;
    isCaptain: boolean;
    bowlingStyle: string;
    customBowlingStyle: string;
    battingStyle: string;
    // Transfer-related fields
    lastAuctionYear?: number | undefined;
    acquiredVia: 'auction' | 'trade' | 'swap' | 'retention' | 'transfer';
    transferable: boolean;
    transferFee?: string;
    transferNotes?: string;

    stats: {
      // General stats
      matches: string;
      
      // Batting innings stats
      battingInnings: string;
      notOuts: string;
      runs: string;
      ballsFaced: string;
      highest: string;
      fours: string;
      sixes: string;
      fifties: string;
      hundreds: string;
      battingAverage: string;
      battingStrikeRate: string;
      
      // Bowling innings stats
      bowlingInnings: string;
      overs: string;
      balls: string;
      maidens: string;
      wickets: string;
      runsConceded: string;
      bowlingAverage: string;
      bowlingStrikeRate: string;
      economy: string;
      bestBowling: string;
      fiveWickets: string;
    };
  }>({
    name: '',
    role: 'Batsman',
    teamId: '',
    league: currentLeague, // Use current league from context
    age: '',
    dateOfBirth: '',
    nationality: '',
    jerseyNumber: '',
    isCaptain: false,
    bowlingStyle: 'N/A (Batsman)',
    customBowlingStyle: '',
    battingStyle: 'Right-handed bat',
    // Transfer defaults
    lastAuctionYear: undefined,
    acquiredVia: 'auction',
    transferable: false,
    transferFee: '',
    transferNotes: '',
    stats: {
      // General stats
      matches: '',
      
      // Batting innings stats
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
      battingStrikeRate: '',
      
      // Bowling innings stats
      bowlingInnings: '',
      overs: '',
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
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
        fetchData();
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ipl-admin-2026');
      }
    };

    checkAuth();
  }, [router]);

  // Auto-calculate age when date of birth is entered or changed
  useEffect(() => {
    if (formData.dateOfBirth && isValidDateForLeague(formData.dateOfBirth, currentLeague)) {
      try {
        const dateOfBirthISO = currentLeague === 'wpl' 
          ? parseDateMonthDDYYYY(formData.dateOfBirth)
          : parseDateDDMMYYYY(formData.dateOfBirth);
        
        if (dateOfBirthISO) {
          const calculatedAge = calculateAge(dateOfBirthISO);
          const calculatedAgeStr = calculatedAge.toString();
          
          // Only auto-update age if:
          // 1. Age field is empty, OR
          // 2. Age matches the last calculated value (meaning it was auto-calculated before)
          // This allows admin to manually override by typing a different age
          if (!formData.age || formData.age === '' || formData.age === lastCalculatedAge) {
            setFormData(prev => ({ ...prev, age: calculatedAgeStr }));
            setLastCalculatedAge(calculatedAgeStr);
          }
        }
      } catch (error) {
        console.error('Error calculating age from date of birth:', error);
      }
    } else if (!formData.dateOfBirth) {
      // Reset last calculated age when DOB is cleared
      setLastCalculatedAge('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dateOfBirth, currentLeague]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const playersData = await api.getPlayers(undefined, currentLeague);
      const teamsData = await api.getTeams(currentLeague);
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch data when league changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeague]);

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setLastCalculatedAge(''); // Reset calculated age when adding new player
    setFormData({
      name: '',
      role: 'Batsman',
      teamId: selectedTeam === 'all' ? '' : selectedTeam, // Auto-select filtered team
      league: currentLeague, // Use current league from context
      age: '',
      dateOfBirth: '',
      nationality: '',
      jerseyNumber: '',
      isCaptain: false,
      bowlingStyle: 'N/A (Batsman)',
      customBowlingStyle: '',
      battingStyle: 'Right-handed bat',
      // Transfer defaults when creating a new player
      lastAuctionYear: undefined,
      acquiredVia: 'auction',
      transferable: false,
      transferFee: '',
      transferNotes: '',
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
    
    // If player has DOB, format it according to league and calculate age
    // Otherwise, reset last calculated age
    const dobFormatted = player.dateOfBirth 
      ? (player.league === 'wpl' 
          ? formatDateMonthDDYYYY(player.dateOfBirth)
          : formatDateDDMMYYYY(player.dateOfBirth))
      : '';
    
    if (dobFormatted) {
      const dateISO = player.league === 'wpl' 
        ? parseDateMonthDDYYYY(dobFormatted)
        : parseDateDDMMYYYY(dobFormatted);
      
      if (dateISO) {
        const calculatedAge = calculateAge(dateISO);
        setLastCalculatedAge(calculatedAge.toString());
      } else {
        setLastCalculatedAge('');
      }
    } else {
      setLastCalculatedAge('');
    }
    
    // Work out bowling style – if it's not in the predefined list, treat it as a custom style
    const existingBowlingStyle = player.bowlingStyle || '';
    const isPredefinedBowlingStyle = existingBowlingStyle && BOWLING_STYLES.includes(existingBowlingStyle);

    setFormData({
      name: player.name,
      role: player.role,
      teamId: player.teamId,
      league: player.league,
      age: player.age > 0 ? player.age.toString() : '',
      dateOfBirth: dobFormatted,
      nationality: player.nationality,
      jerseyNumber: player.jerseyNumber > 0 ? player.jerseyNumber.toString() : '',
      isCaptain: player.isCaptain || false,
      bowlingStyle: isPredefinedBowlingStyle ? existingBowlingStyle : 'N/A (Batsman)',
      customBowlingStyle: isPredefinedBowlingStyle ? '' : (existingBowlingStyle || ''),
      battingStyle: player.battingStyle || '',
      // Transfer info mapping (if available)
      lastAuctionYear: player.transferInfo?.lastAuctionYear,
      acquiredVia: player.transferInfo?.acquiredVia || 'auction',
      transferable: typeof player.transferInfo?.transferable === 'boolean' ? player.transferInfo!.transferable : false,
      transferFee: player.transferInfo?.transferFee ? String(player.transferInfo.transferFee) : '',
      transferNotes: player.transferInfo?.notes || '',
      stats: {
        // General stats
        matches: player.stats.matches.toString(),
        
        // Batting innings stats
        battingInnings: (player.stats.battingInnings || 0).toString(),
        notOuts: (player.stats.notOuts || 0).toString(),
        runs: player.stats.runs.toString(),
        ballsFaced: (player.stats.ballsFaced || 0).toString(),
        highest: player.stats.highest.toString(),
        fours: player.stats.fours.toString(),
        sixes: player.stats.sixes.toString(),
        fifties: player.stats.fifties.toString(),
        hundreds: player.stats.hundreds.toString(),
        battingAverage: (player.stats.battingAverage || 0).toString(),
        battingStrikeRate: (player.stats.battingStrikeRate || player.stats.strikeRate || 0).toString(),
        
        // Bowling innings stats
        bowlingInnings: (player.stats.bowlingInnings || 0).toString(),
        overs: (player.stats.overs || '0.0'),
        balls: (player.stats.balls || 0).toString(),
        maidens: (player.stats.maidens || 0).toString(),
        wickets: player.stats.wickets.toString(),
        runsConceded: (player.stats.runsConceded || 0).toString(),
        bowlingAverage: bowlingAvg.toString(),
        bowlingStrikeRate: (player.stats.bowlingStrikeRate || 0).toString(),
        economy: player.stats.economy.toString(),
        bestBowling: player.stats.bestBowling,
        fiveWickets: (player.stats.fiveWickets || 0).toString(),
      }
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        router.push('/ipl-admin-2026');
        return;
      }

      // Parse DOB if provided
      let calculatedAge = parseInt(formData.age) || 0;
      let dateOfBirthISO = '';
      
      if (formData.dateOfBirth) {
        if (!isValidDateForLeague(formData.dateOfBirth, formData.league)) {
          const expectedFormat = formData.league === 'wpl' ? 'Month DD, YYYY (e.g., July 18, 1996)' : 'DD/MM/YYYY';
          alert(`Invalid date format. Please use ${expectedFormat}`);
          return;
        }
        
        dateOfBirthISO = formData.league === 'wpl' 
          ? parseDateMonthDDYYYY(formData.dateOfBirth)
          : parseDateDDMMYYYY(formData.dateOfBirth);
        
        // Auto-calculate age from DOB
        calculatedAge = calculateAge(dateOfBirthISO);
      }
      
      const finalBowlingStyle = formData.customBowlingStyle.trim() || formData.bowlingStyle;

      const playerData = {
        name: formData.name,
        role: formData.role,
        teamId: formData.teamId,
        league: formData.league,
        dateOfBirth: dateOfBirthISO || undefined,
        age: calculatedAge,
        nationality: formData.nationality,
        jerseyNumber: parseInt(formData.jerseyNumber),
        isCaptain: formData.isCaptain,
        bowlingStyle: finalBowlingStyle,
        battingStyle: formData.battingStyle,
        stats: {
          // General stats
          matches: parseInt(formData.stats.matches) || 0,
          
          // Batting innings stats
          battingInnings: parseInt(formData.stats.battingInnings) || 0,
          notOuts: parseInt(formData.stats.notOuts) || 0,
          runs: parseInt(formData.stats.runs) || 0,
          ballsFaced: parseInt(formData.stats.ballsFaced) || 0,
          highest: parseInt(formData.stats.highest) || 0,
          fours: parseInt(formData.stats.fours) || 0,
          sixes: parseInt(formData.stats.sixes) || 0,
          fifties: parseInt(formData.stats.fifties) || 0,
          hundreds: parseInt(formData.stats.hundreds) || 0,
          battingAverage: parseFloat(formData.stats.battingAverage) || 0,
          battingStrikeRate: parseFloat(formData.stats.battingStrikeRate) || 0,
          
          // Bowling innings stats
          bowlingInnings: parseInt(formData.stats.bowlingInnings) || 0,
          overs: formData.stats.overs || '0.0',
          balls: parseInt(formData.stats.balls) || 0,
          maidens: parseInt(formData.stats.maidens) || 0,
          wickets: parseInt(formData.stats.wickets) || 0,
          runsConceded: parseInt(formData.stats.runsConceded) || 0,
          bowlingAverage: parseFloat(formData.stats.bowlingAverage) || 0,
          bowlingStrikeRate: parseFloat(formData.stats.bowlingStrikeRate) || 0,
          economy: parseFloat(formData.stats.economy) || 0,
          bestBowling: formData.stats.bestBowling || '-',
          fiveWickets: parseInt(formData.stats.fiveWickets) || 0,
        }
      ,
        transferInfo: {
          lastAuctionYear: formData.lastAuctionYear ? Number(formData.lastAuctionYear) : undefined,
          acquiredVia: formData.acquiredVia,
          transferable: !!formData.transferable,
          transferFee: formData.transferFee ? parseFloat(String(formData.transferFee)) : undefined,
          notes: formData.transferNotes || undefined
        }
      };

      if (editingPlayer) {
        // Update existing player
        const response = await fetch('/api/players', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
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

  const handleDeletePlayer = (playerId: string, playerName?: string) => {
    setDeleteTarget({ id: playerId, name: playerName || 'Player' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      const response = await fetch(`/api/players?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      // Refresh players list
      await fetchData();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllPlayers = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        setIsDeletingAll(false);
        setShowDeleteAllModal(false);
        return;
      }

      const response = await fetch(`/api/players?deleteAll=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete all players');
      }

      const result = await response.json();
      
      // Refresh players list
      await fetchData();
      setShowDeleteAllModal(false);
      alert(`Successfully deleted all ${result.deletedCount || players.length} players.`);
    } catch (error: any) {
      console.error('Error deleting all players:', error);
      alert(`Failed to delete all players: ${error.message || 'Please try again.'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/backup-players?action=list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load backups');
      }

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error: any) {
      console.error('Error loading backups:', error);
      alert(`Failed to load backups: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/backup-players?action=create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }

      const result = await response.json();
      
      // Reload backups list
      await loadBackups();
      alert(`Backup created successfully! (${result.backup.playerCount} players)`);
    } catch (error: any) {
      console.error('Error creating backup:', error);
      alert(`Failed to create backup: ${error.message || 'Please try again.'}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupKey: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will replace all current players.')) {
      return;
    }

    setIsRestoringBackup(backupKey);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/backup-players?action=restore&backupKey=${encodeURIComponent(backupKey)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore backup');
      }

      const result = await response.json();
      
      // Refresh players list
      await fetchData();
      setShowBackupModal(false);
      alert(`Successfully restored ${result.restored.playerCount} players from backup!`);
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      alert(`Failed to restore backup: ${error.message || 'Please try again.'}`);
    } finally {
      setIsRestoringBackup(null);
    }
  };

  const deleteBackup = async (backupKey: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        alert('Admin session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/backup-players?action=delete&backupKey=${encodeURIComponent(backupKey)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete backup');
      }

      // Reload backups list
      await loadBackups();
      alert('Backup deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      alert(`Failed to delete backup: ${error.message || 'Please try again.'}`);
    }
  };

  const handleOpenBackupModal = () => {
    setShowBackupModal(true);
    loadBackups();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
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
    : players.filter(player => {
        // Only show players with a valid teamId when a specific team is selected
        if (!player.teamId) {
          return false; // Exclude players without a teamId
        }
        
        // Ensure both values are strings for comparison
        const playerTeamId = String(player.teamId).trim();
        const selectedTeamId = String(selectedTeam).trim();
        return playerTeamId === selectedTeamId;
      });

  // Apply sorting
  if (sortField) {
    filteredPlayers = [...filteredPlayers].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

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

      if (typeof aValue === 'string' && typeof bValue === 'string') {
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

  // Apply role-priority + age ordering (batsmen -> wicket-keepers -> all-rounders -> bowlers)
  filteredPlayers = sortPlayersByRoleAndAge(filteredPlayers);

  // Calculate statistics by role
  // Use filteredPlayers for stats so counts reflect current team filter
  const stats = {
    total: filteredPlayers.length,
    batsmen: filteredPlayers.filter(p => p.role === 'Batsman').length,
    bowlers: filteredPlayers.filter(p => p.role === 'Bowler').length,
    allRounders: filteredPlayers.filter(p => p.role === 'All-rounder').length,
    wicketkeepers: filteredPlayers.filter(p => p.role === 'Wicket-keeper').length,
  };

  // Apply search filter
  let searchFilteredPlayers = filteredPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nationality.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Safety check: Double-filter by team to ensure no players slip through
  if (selectedTeam !== 'all') {
    searchFilteredPlayers = searchFilteredPlayers.filter(player => {
      if (!player.teamId) return false;
      return String(player.teamId).trim() === String(selectedTeam).trim();
    });
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {userRole !== 'players_admin' && <AdminSidebar currentPage="/ipl-admin-2026/players" />}
      <div className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                  Player Management
                </h1>
                <p className="text-gray-400 text-lg">
                  Track and manage all {currentLeague === 'wpl' ? 'WPL' : 'IPL'} players
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LeagueSwitch size="md" showLabel={false} />
                <button
                  onClick={handleOpenBackupModal}
                  className="admin-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Backups
                </button>
                <button
                  onClick={handleDeleteAllPlayers}
                  className="admin-btn-danger flex items-center gap-2"
                  disabled={players.length === 0}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Players
                </button>
                <button
                  onClick={handleAddPlayer}
                  className="admin-btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Player
                </button>
              </div>
            </div>

            {/* WPL Teams Manager - Only show for WPL */}
            {currentLeague === 'wpl' && (
              <div className="mb-6">
                <WPLTeamsManager 
                  onTeamsUpdate={(teams) => setTeams(teams)}
                  className="w-full"
                />
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Total Players */}
              <div className="admin-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-gray-400">Total Players</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">All squads combined</span>
                  <div className="admin-badge-success">
                    Active
                  </div>
                </div>
              </div>

              {/* Batsmen */}
              <div className="admin-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.batsmen}</p>
                    <p className="text-xs text-gray-400">Batsmen</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">Run scorers</span>
                  <div className="admin-badge-neutral">
                    {stats.total > 0 ? ((stats.batsmen / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Bowlers */}
              <div className="admin-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.bowlers}</p>
                    <p className="text-xs text-gray-400">Bowlers</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">Wicket takers</span>
                  <div className="admin-badge-neutral">
                    {stats.total > 0 ? ((stats.bowlers / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* All-rounders */}
              <div className="admin-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.allRounders}</p>
                    <p className="text-xs text-gray-400">All-rounders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">Versatile players</span>
                  <div className="admin-badge-neutral">
                    {stats.total > 0 ? ((stats.allRounders / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Wicket-keepers */}
              <div className="admin-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.wicketkeepers}</p>
                    <p className="text-xs text-gray-400">Wicket-keepers</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">Behind the stumps</span>
                  <div className="admin-badge-neutral">
                    {stats.total > 0 ? ((stats.wicketkeepers / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Search Bar and Team Filter Row */}
            <div className="flex gap-4 flex-col md:flex-row items-stretch">
              {/* Search Bar */}
              <div className="relative flex-1">
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by player name, nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-input w-full pl-12 pr-4 py-3"
                />
              </div>

              {/* Team Filter Dropdown */}
              <div className="relative md:min-w-[320px]">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full glass-effect px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-3 hover:bg-white/10 transition-all duration-300 group h-full"
                >
                  <svg 
                    className="w-5 h-5 text-ipl-gold flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="flex-1 text-left truncate flex items-center gap-2">
                    {selectedTeam === 'all' 
                      ? <><CustomEmoji type="trophy" size={14} /> All Teams</>
                      : <><CustomEmoji type="cricket" size={14} /> {teams.find(t => t.id === selectedTeam)?.shortName || 'Select'}</>
                    }
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div 
                  className={`absolute left-0 right-0 mt-2 glass-effect rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top z-50 ${
                    isDropdownOpen 
                      ? 'opacity-100 scale-y-100 max-h-[500px]' 
                      : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
                  }`}
                >
                  <div className="py-2 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-ipl-gold/50 scrollbar-track-white/5">
                    {/* All Teams Option */}
                    <button
                      onClick={() => {
                        setSelectedTeam('all');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-6 py-3.5 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${
                        selectedTeam === 'all' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2"><CustomEmoji type="trophy" size={16} /> All Teams</div>
                        <div className="text-xs text-gray-400">{players.length} total players</div>
                      </div>
                      {selectedTeam === 'all' && (
                        <svg className="w-5 h-5 text-ipl-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Divider */}
                    {teams.length > 0 && <div className="border-t border-white/10 my-2" />}

                    {/* Team Options */}
                    {teams.map((team) => {
                      const teamPlayersCount = players.filter(p => String(p.teamId) === String(team.id)).length;
                      return (
                        <button
                          key={team.id}
                          onClick={() => {
                            setSelectedTeam(team.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-6 py-3.5 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${
                            selectedTeam === team.id ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm shadow-lg flex-shrink-0"
                            style={{ backgroundColor: team.colors.primary }}
                            title={team.name}
                          >
                            {team.shortName}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{team.name}</div>
                            <div className="text-xs text-gray-400">
                              {teamPlayersCount} player{teamPlayersCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {selectedTeam === team.id && (
                            <svg className="w-5 h-5 text-ipl-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Results Info and Quick Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">{searchFilteredPlayers.length}</span> of <span className="font-semibold text-white">{filteredPlayers.length}</span> players
                {selectedTeam !== 'all' && (
                  <span className="ml-2">
                    in <span className="text-ipl-gold font-semibold">{teams.find(t => t.id === selectedTeam)?.name}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
                  >
                    Clear Search
                  </button>
                )}
                {selectedTeam !== 'all' && (
                  <button
                    onClick={() => setSelectedTeam('all')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
                  >
                    View All Teams
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Players Table */}
          <div className="admin-card overflow-hidden">
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      DOB ({currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'})
                    </th>
                    {currentLeague !== 'wpl' && (
                      <>
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
                        <th className="px-6 py-4 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                          Batting Innings
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                          Bowling Innings
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
                          Batting SR
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Economy
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
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {searchFilteredPlayers.length > 0 ? searchFilteredPlayers
                    .filter(player => {
                      // Final safety check: If a team is selected, ensure player matches
                      if (selectedTeam !== 'all' && player.teamId) {
                        return String(player.teamId).trim() === String(selectedTeam).trim();
                      }
                      return true;
                    })
                    .map((player, idx) => {
                    const team = teams.find(t => String(t.id) === String(player.teamId));
                    return (
                      <tr key={`${player.id}-${player.teamId}-${selectedTeam}-${idx}`} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple flex items-center justify-center text-white font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {player.nationality && (
                                  <FlagImage nationality={player.nationality} size="sm" />
                                )}
                                <div>
                                  <div className="text-white font-semibold">{player.name}</div>
                                  <div className="text-xs text-gray-500">{player.nationality}</div>
                                </div>
                              </div>
                            </div>
                            {player.isCaptain && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" title="Captain">
                                <CustomEmoji type="star" size={14} /> C
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.jerseyNumber > 0 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                              {player.jerseyNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                            player.role === 'Batsman' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            player.role === 'Bowler' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            player.role === 'All-rounder' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          }`}>
                            {player.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center"
                              style={{ backgroundColor: team?.colors.primary }}
                            >
                              {team?.shortName}
                            </div>
                            <span className="text-gray-300 font-medium">{team?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                          {player.age > 0 && `${player.age}y`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.dateOfBirth && (
                            currentLeague === 'wpl' 
                              ? formatDateMonthDDYYYY(player.dateOfBirth)
                              : formatDateDDMMYYYY(player.dateOfBirth)
                          )}
                        </td>
                        {currentLeague !== 'wpl' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ipl-gold font-bold">
                              {player.stats.runs > 0 && player.stats.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400 font-bold">
                              {player.stats.wickets > 0 && player.stats.wickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-400 font-semibold">
                              {player.stats.battingInnings > 0 && player.stats.battingInnings}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-yellow-400 font-semibold">
                              {player.stats.bowlingInnings > 0 && player.stats.bowlingInnings}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-400 font-semibold">
                              {player.stats.battingAverage > 0 && player.stats.battingAverage.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {(() => {
                                const bowlingAvg = player.stats.bowlingAverage ?? 
                                  (player.stats.wickets > 0 
                                    ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
                                    : 0);
                                return bowlingAvg > 0 ? bowlingAvg.toFixed(2) : null;
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {player.stats.battingStrikeRate > 0 && player.stats.battingStrikeRate.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {player.stats.economy > 0 && player.stats.economy.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {(player.stats.fours > 0 || player.stats.sixes > 0) && 
                                `${player.stats.fours}/${player.stats.sixes}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {(player.stats.fifties > 0 || player.stats.hundreds > 0) && 
                                `${player.stats.fifties}/${player.stats.hundreds}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {player.stats.bestBowling && player.stats.bestBowling !== '-' && player.stats.bestBowling.trim() !== '' 
                                && player.stats.bestBowling}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditPlayer(player)}
                              className="text-ipl-gold hover:text-ipl-purple transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePlayer(player.id, player.name)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={currentLeague === 'wpl' ? 7 : 12} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-400 text-lg font-medium">No players found</p>
                          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="mt-6 admin-glass rounded-xl p-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-white">{stats.total}</span> total players in <span className="font-semibold text-white">{teams.length}</span> teams
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-green-400 font-semibold">{stats.batsmen}</span>
                <span className="text-gray-500 ml-1">Batsmen</span>
              </div>
              <div>
                <span className="text-blue-400 font-semibold">{stats.bowlers}</span>
                <span className="text-gray-500 ml-1">Bowlers</span>
              </div>
              <div>
                <span className="text-purple-400 font-semibold">{stats.allRounders}</span>
                <span className="text-gray-500 ml-1">All-rounders</span>
              </div>
              <div>
                <span className="text-orange-400 font-semibold">{stats.wicketkeepers}</span>
                <span className="text-gray-500 ml-1">Wicket-keepers</span>
              </div>
            </div>
          </div>

          {/* Player Form Modal */}
          <ModernDialog
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={editingPlayer ? 'Edit Player' : 'Add New Player'}
            description={editingPlayer ? 'Update player information' : 'Add a new player to the database'}
            variant="info"
            size="xl"
            icon={<CustomEmoji type="cricket-stumps" size={24} />}
            contentClassName="max-h-[70vh] overflow-y-auto"
            footer={
              <div className="flex gap-4">
                <button
                  type="submit"
                  form="player-form"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  {editingPlayer ? 'Update Player' : 'Add Player'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/10 bg-slate-800/60 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-700/80 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            }
          >
            <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
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
                          className="admin-input w-full"
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
                          className="admin-input w-full"
                        >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket-keeper">Wicket-keeper</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          League
                        </label>
                        <select
                          value={formData.league}
                          onChange={(e) => setFormData({...formData, league: e.target.value as 'ipl' | 'wpl'})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                          required
                        >
                          <option value="ipl">IPL (Indian Premier League)</option>
                          <option value="wpl">WPL (Women's Premier League)</option>
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
                          {teams.filter(team => team.league === formData.league).map(team => (
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
                          onChange={(e) => {
                            // When admin manually changes age, clear the last calculated age
                            // so it won't be auto-overwritten
                            if (e.target.value !== lastCalculatedAge) {
                              setLastCalculatedAge('');
                            }
                            setFormData({...formData, age: e.target.value});
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter age"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.dateOfBirth && isValidDate(formData.dateOfBirth, 'DD/MM/YYYY')
                            ? 'Auto-calculated from date of birth (you can manually change if needed)'
                            : 'Enter age manually or provide date of birth to auto-calculate'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date of Birth ({currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'})
                        </label>
                        <input
                          type="text"
                          value={formData.dateOfBirth}
                          onChange={(e) => {
                            setFormData({...formData, dateOfBirth: e.target.value});
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder={currentLeague === 'wpl' ? 'July 18, 1996 (optional)' : 'DD/MM/YYYY (optional)'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.dateOfBirth && isValidDateForLeague(formData.dateOfBirth, currentLeague) 
                            ? `Age automatically calculated: ${calculateAge(
                                currentLeague === 'wpl' 
                                  ? parseDateMonthDDYYYY(formData.dateOfBirth)
                                  : parseDateDDMMYYYY(formData.dateOfBirth)
                              )} years` 
                            : 'Optional: If provided, age will be automatically calculated'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nationality
                        </label>
                        <select
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                          required
                        >
                          <option value="">Select nationality</option>
                          {CRICKET_COUNTRIES.map((country) => (
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
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={formData.jerseyNumber}
                            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="Enter jersey number or leave blank"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, jerseyNumber: '' })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/20 text-gray-200 hover:bg-white/10 transition-colors"
                          >
                            N/A
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Use N/A if a jersey number is not assigned yet.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bowling Style
                        </label>
                        <select
                          value={formData.bowlingStyle}
                          onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          {BOWLING_STYLES.map((style) => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          If the exact style is not in the list, enter a custom bowling style below.
                        </p>
                        <input
                          type="text"
                          value={formData.customBowlingStyle}
                          onChange={(e) => setFormData({ ...formData, customBowlingStyle: e.target.value })}
                          className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Custom bowling style (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Batting Style
                        </label>
                        <select
                          value={formData.battingStyle}
                          onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          {BATTING_STYLES.map((style) => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="player-isCaptain"
                          checked={formData.isCaptain}
                          onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                          className="w-4 h-4 bg-white/10 border border-white/20 rounded text-ipl-gold focus:outline-none focus:border-ipl-gold"
                        />
                        <label htmlFor="player-isCaptain" className="ml-2 text-sm font-medium text-gray-300">
                          Is Captain
                        </label>
                      </div>

                      {/* Transfer / Auction Info */}
                      <div className="col-span-1 md:col-span-2 border-t border-white/5 pt-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Transfer / Auction Info</h3>
                        {/* Determine if player is auction-locked for CURRENT_SEASON */}
                        {(() => {
                          const isAuctionLocked = typeof formData.lastAuctionYear !== 'undefined' &&
                            formData.lastAuctionYear === 2026 &&
                            formData.acquiredVia === 'auction' &&
                            CURRENT_SEASON === 2027;
                          return (
                            <>
                              {isAuctionLocked && (
                                <div className="mb-2 text-sm text-yellow-300">Players bought at the IPL 2026 auction cannot be traded for the 2027 season (auction-locked).</div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Auction Year</label>
                                  <input
                                    type="number"
                                    value={formData.lastAuctionYear ?? ''}
                                    onChange={(e) => setFormData({ ...formData, lastAuctionYear: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                                    placeholder="e.g., 2026"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Acquired Via</label>
                                  <select
                                    value={formData.acquiredVia}
                                    onChange={(e) => setFormData({ ...formData, acquiredVia: e.target.value as any })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                                  >
                                    <option value="auction">Auction</option>
                                    <option value="retention">Retention</option>
                                    <option value="trade">Trade</option>
                                    <option value="swap">Swap</option>
                                    <option value="transfer">Transfer</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Transferable</label>
                                  <input
                                    type="checkbox"
                                    checked={!!formData.transferable}
                                    onChange={(e) => setFormData({ ...formData, transferable: e.target.checked })}
                                    disabled={typeof formData.lastAuctionYear !== 'undefined' && formData.lastAuctionYear === 2026 && formData.acquiredVia === 'auction' && CURRENT_SEASON === 2027}
                                    className="w-4 h-4 bg-white/10 border border-white/20 rounded text-ipl-gold focus:outline-none focus:border-ipl-gold"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Transfer Fee</label>
                                  <input
                                    type="text"
                                    value={formData.transferFee ?? ''}
                                    onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                                    placeholder="Optional cash deal value"
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                  <input
                                    type="text"
                                    value={formData.transferNotes ?? ''}
                                    onChange={(e) => setFormData({ ...formData, transferNotes: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                                    placeholder="E.g., Confirmed trade, cash deal details"
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Stats - Only show for IPL */}
                    {formData.league !== 'wpl' && (
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
                            Batting Innings
                          </label>
                          <input
                            type="number"
                            value={formData.stats.battingInnings}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, battingInnings: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Not Outs
                          </label>
                          <input
                            type="number"
                            value={formData.stats.notOuts}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, notOuts: e.target.value}})}
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
                            Balls Faced
                          </label>
                          <input
                            type="number"
                            value={formData.stats.ballsFaced}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, ballsFaced: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Highest Score
                          </label>
                          <input
                            type="text"
                            value={formData.stats.highest}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, highest: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            4s
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
                            6s
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
                            50s
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
                            100s
                          </label>
                          <input
                            type="number"
                            value={formData.stats.hundreds}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, hundreds: e.target.value}})}
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
                            value={formData.stats.battingAverage}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, battingAverage: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Batting Strike Rate
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.battingStrikeRate}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, battingStrikeRate: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        
                        {/* Bowling Innings Stats */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bowling Innings
                          </label>
                          <input
                            type="number"
                            value={formData.stats.bowlingInnings}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bowlingInnings: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Overs
                          </label>
                          <input
                            type="text"
                            value={formData.stats.overs}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, overs: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Balls
                          </label>
                          <input
                            type="number"
                            value={formData.stats.balls}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, balls: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Maidens
                          </label>
                          <input
                            type="number"
                            value={formData.stats.maidens}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, maidens: e.target.value}})}
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
                            Runs Conceded
                          </label>
                          <input
                            type="number"
                            value={formData.stats.runsConceded}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, runsConceded: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
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
                            Bowling Strike Rate
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.bowlingStrikeRate}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bowlingStrikeRate: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500 mt-1">Balls per wicket</p>
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
                          <p className="text-xs text-gray-500 mt-1">Runs per over</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Best Bowling
                          </label>
                          <input
                            type="text"
                            value={formData.stats.bestBowling}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bestBowling: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0/0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            5-Wicket Hauls
                          </label>
                          <input
                            type="number"
                            value={formData.stats.fiveWickets}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fiveWickets: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    )}
            </form>
          </ModernDialog>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ModernDialog
        isOpen={showDeleteModal && !!deleteTarget}
        onClose={cancelDelete}
        title="Delete Player"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="danger"
        size="md"
        icon={<CustomEmoji type="warning" size={24} />}
        footer={
          <div className="flex gap-3">
            <button
              onClick={cancelDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Warning Badge */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-300">This will permanently remove all player data.</p>
          </div>
        </div>
      </ModernDialog>

      {/* Delete All Players Confirmation Modal */}
      <ModernDialog
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="Delete All Players"
        description={`Are you sure you want to delete ALL ${players.length} players? This action cannot be undone and will permanently remove all player data from the system.`}
        variant="danger"
        size="md"
        icon={<CustomEmoji type="warning" size={24} />}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteAllModal(false)}
              disabled={isDeletingAll}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteAll}
              disabled={isDeletingAll}
              className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeletingAll ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Deleting All...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Players
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Warning Badge */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300 mb-1">⚠️ Irreversible Action</p>
              <p className="text-sm text-red-200">
                This will permanently delete all {players.length} players from the database. This includes all IPL and WPL players. 
                You will need to re-upload or manually add all players again.
              </p>
            </div>
          </div>
        </div>
      </ModernDialog>

      {/* Backup Management Modal */}
      <ModernDialog
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Player Backups"
        description="Create, view, and restore player backups"
        variant="default"
        size="lg"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        }
        footer={
          <div className="flex gap-3">
            <button
              onClick={createBackup}
              disabled={isCreatingBackup || players.length === 0}
              className="admin-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingBackup ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Backup
                </>
              )}
            </button>
            <button
              onClick={() => setShowBackupModal(false)}
              className="admin-btn-secondary"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-300 mb-1">Current Players</p>
                <p className="text-2xl font-bold text-white">{players.length} players</p>
                <p className="text-xs text-gray-400 mt-1">
                  IPL: {players.filter(p => (p.league || 'ipl') === 'ipl').length} • 
                  WPL: {players.filter(p => (p.league || 'ipl') === 'wpl').length}
                </p>
              </div>
            </div>
          </div>

          {/* Backups List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Backup History</h3>
              <button
                onClick={loadBackups}
                disabled={isLoadingBackups}
                className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {isLoadingBackups ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {isLoadingBackups ? (
              <div className="text-center py-8 text-gray-400">Loading backups...</div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No backups found</p>
                <p className="text-sm mt-1">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.key}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-white">
                            {new Date(backup.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span>{backup.playerCount} players</span>
                          {backup.metadata && (
                            <>
                              <span>IPL: {backup.metadata.iplCount || 0}</span>
                              <span>WPL: {backup.metadata.wplCount || 0}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => restoreBackup(backup.key)}
                          disabled={isRestoringBackup === backup.key}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isRestoringBackup === backup.key ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Restoring...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Restore
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.key)}
                          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModernDialog>
    </div>
  );
}

