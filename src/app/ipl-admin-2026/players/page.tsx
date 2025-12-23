'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import ModernDialog from '@/components/admin/ModernDialog';
import LeagueSwitch from '@/components/admin/LeagueSwitch';
import WPLTeamsManager from '@/components/admin/WPLTeamsManager';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { parseDateDDMMYYYY, formatDateDDMMYYYY, calculateAge, isValidDate, formatDateMonthDDYYYY, parseDateMonthDDYYYY, isValidDateForLeague } from '@/lib/dateUtils';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';
import { Search, Filter, Edit2, X, Users, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, Calendar, BarChart3, Plus, Trash2, Download, Upload, Shield, Activity, Hash, Grid3x3, List, Eye, Star } from 'lucide-react';
import '@/styles/flags.css';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
    allrounderType: 'Batting All-rounder' | 'Bowling All-rounder' | '';
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
    allrounderType: '',
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

        // Check if user has valid admin role
        if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/ipl-admin-2026');
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
    if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '') {
      try {
        let dateOfBirthISO = '';
        
        // Try to parse in the expected format for the current league first
        if (currentLeague === 'wpl') {
          dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
        } else {
          // For IPL, try DD/MM/YYYY format first
          dateOfBirthISO = parseDateDDMMYYYY(formData.dateOfBirth);
          
          // If that fails, try Month DD, YYYY format as fallback
          if (!dateOfBirthISO) {
            dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
          }
        }
        
        if (dateOfBirthISO) {
          // Debug: log the parsed date
          console.log('useEffect - Parsed date:', dateOfBirthISO, 'Input:', formData.dateOfBirth);
          const calculatedAge = calculateAge(dateOfBirthISO);
          console.log('useEffect - Calculated age:', calculatedAge);
          
          // Only proceed if age calculation is valid (greater than 0)
          if (calculatedAge > 0) {
          const calculatedAgeStr = calculatedAge.toString();
          
          // Only auto-update age if:
            // 1. Age field is empty, "0", or matches last calculated value
          // This allows admin to manually override by typing a different age
            if (!formData.age || formData.age === '' || formData.age === '0' || formData.age === lastCalculatedAge) {
              console.log('useEffect - Updating age to:', calculatedAgeStr);
            setFormData(prev => ({ ...prev, age: calculatedAgeStr }));
            setLastCalculatedAge(calculatedAgeStr);
            } else {
              console.log('useEffect - Not updating age, current value:', formData.age, 'lastCalculated:', lastCalculatedAge);
            }
          } else {
            // If age calculation returned 0, log for debugging but don't update
            console.warn('useEffect - Age calculation returned 0 for date:', formData.dateOfBirth, 'Parsed:', dateOfBirthISO);
            const testDate = new Date(dateOfBirthISO);
            console.warn('useEffect - Test date object:', testDate, 'Is valid:', !isNaN(testDate.getTime()));
            // Don't update age if calculation failed
            if (formData.age === lastCalculatedAge && lastCalculatedAge) {
              setFormData(prev => ({ ...prev, age: '' }));
              setLastCalculatedAge('');
            }
          }
        } else {
          // If date parsing failed, clear the age if it was auto-calculated
          if (formData.age === lastCalculatedAge && lastCalculatedAge) {
            setFormData(prev => ({ ...prev, age: '' }));
            setLastCalculatedAge('');
          }
        }
      } catch (error) {
        console.error('Error calculating age from date of birth:', error);
        // Clear age if calculation fails and it was auto-calculated
        if (formData.age === lastCalculatedAge && lastCalculatedAge) {
          setFormData(prev => ({ ...prev, age: '' }));
          setLastCalculatedAge('');
      }
      }
    } else if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
      // Reset last calculated age when DOB is cleared
      if (formData.age === lastCalculatedAge && lastCalculatedAge) {
        setFormData(prev => ({ ...prev, age: '' }));
      }
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
      // Reset team filter when league changes
      setSelectedTeam('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeague]);

  // Reset team filter if selected team is not in current league
  useEffect(() => {
    if (selectedTeam !== 'all' && teams.length > 0) {
      const selectedTeamObj = teams.find(t => String(t.id) === String(selectedTeam));
      if (!selectedTeamObj || selectedTeamObj.league !== currentLeague) {
        setSelectedTeam('all');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, currentLeague]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both dropdowns
      if (!target.closest('[data-filter-dropdown]')) {
        setIsDropdownOpen(false);
        setShowAdvancedFilters(false);
      }
    };

    if (isDropdownOpen || showAdvancedFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen, showAdvancedFilters]);

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setLastCalculatedAge(''); // Reset calculated age when adding new player
    setFormData({
      name: '',
      role: 'Batsman',
      allrounderType: '',
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
      allrounderType: player.allrounderType || '',
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
        matches: player.stats.matches > 0 ? player.stats.matches.toString() : '',
        runs: player.stats.runs > 0 ? player.stats.runs.toString() : '',
        wickets: player.stats.wickets > 0 ? player.stats.wickets.toString() : '',
        average: player.stats.average > 0 ? player.stats.average.toString() : '',
        bowlingAverage: bowlingAvg > 0 ? bowlingAvg.toString() : '',
        strikeRate: player.stats.strikeRate > 0 ? player.stats.strikeRate.toString() : '',
        economy: player.stats.economy > 0 ? player.stats.economy.toString() : '',
        highest: player.stats.highest > 0 ? player.stats.highest.toString() : '',
        fours: player.stats.fours > 0 ? player.stats.fours.toString() : '',
        sixes: player.stats.sixes > 0 ? player.stats.sixes.toString() : '',
        fifties: player.stats.fifties > 0 ? player.stats.fifties.toString() : '',
        hundreds: player.stats.hundreds > 0 ? player.stats.hundreds.toString() : '',
        bestBowling: player.stats.bestBowling && player.stats.bestBowling !== '-' && player.stats.bestBowling.trim() !== '' ? player.stats.bestBowling : ''
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
      
      if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '') {
        // For IPL, try DD/MM/YYYY format first, then Month DD, YYYY as fallback
        // For WPL, use Month DD, YYYY format
        if (formData.league === 'wpl') {
          dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
        } else {
          // For IPL, try DD/MM/YYYY format first
          dateOfBirthISO = parseDateDDMMYYYY(formData.dateOfBirth);
          // If that fails, try Month DD, YYYY format as fallback
          if (!dateOfBirthISO) {
            dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
          }
        }
        
        // Validate the parsed date
        if (!dateOfBirthISO) {
          const expectedFormat = formData.league === 'wpl' 
            ? 'Month DD, YYYY (e.g., July 18, 1996)' 
            : 'DD/MM/YYYY or Month DD, YYYY (e.g., 25/12/1994 or December 25, 1994)';
          alert(`Invalid date format. Please use ${expectedFormat}`);
          return;
        }
        
        // Auto-calculate age from DOB
        calculatedAge = calculateAge(dateOfBirthISO);
        if (calculatedAge <= 0) {
          // If age calculation failed, use the manually entered age
          calculatedAge = parseInt(formData.age) || 0;
        }
      }
      
      const finalBowlingStyle = formData.customBowlingStyle.trim() || formData.bowlingStyle;

      const playerData = {
        name: formData.name,
        role: formData.role,
        allrounderType: formData.role === 'All-rounder' && formData.allrounderType ? formData.allrounderType : undefined,
        teamId: formData.teamId,
        league: formData.league,
        dateOfBirth: dateOfBirthISO || undefined,
        age: calculatedAge,
        nationality: formData.nationality,
        jerseyNumber: parseInt(formData.jerseyNumber) || 0,
        isCaptain: formData.isCaptain,
        bowlingStyle: finalBowlingStyle,
        battingStyle: formData.battingStyle,
        stats: {
          matches: formData.stats.matches ? parseInt(formData.stats.matches) || 0 : 0,
          runs: formData.stats.runs ? parseInt(formData.stats.runs) || 0 : 0,
          wickets: formData.stats.wickets ? parseInt(formData.stats.wickets) || 0 : 0,
          average: formData.stats.average && formData.stats.average.trim() !== '' ? parseFloat(formData.stats.average) : 0,
          bowlingAverage: formData.stats.bowlingAverage && formData.stats.bowlingAverage.trim() !== '' ? parseFloat(formData.stats.bowlingAverage) : 0,
          strikeRate: formData.stats.strikeRate && formData.stats.strikeRate.trim() !== '' ? parseFloat(formData.stats.strikeRate) : 0,
          economy: formData.stats.economy && formData.stats.economy.trim() !== '' ? parseFloat(formData.stats.economy) : 0,
          highest: formData.stats.highest ? parseInt(formData.stats.highest) || 0 : 0,
          fours: formData.stats.fours ? parseInt(formData.stats.fours) || 0 : 0,
          sixes: formData.stats.sixes ? parseInt(formData.stats.sixes) || 0 : 0,
          fifties: formData.stats.fifties ? parseInt(formData.stats.fifties) || 0 : 0,
          hundreds: formData.stats.hundreds ? parseInt(formData.stats.hundreds) || 0 : 0,
          bestBowling: formData.stats.bestBowling || '-',
        },
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
          const errorData = await response.json().catch(() => ({ error: 'Failed to update player' }));
          throw new Error(errorData.error || 'Failed to update player');
        }
        
        const updatedPlayer = await response.json();
        console.log('Player updated successfully:', updatedPlayer);
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
          const errorData = await response.json().catch(() => ({ error: 'Failed to create player' }));
          throw new Error(errorData.error || 'Failed to create player');
        }
      }

      // Refresh players list
      await fetchData();
      setShowForm(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Error saving player:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save player. Please try again.';
      alert(errorMessage);
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

  // Filter players by league first, then by team
  let filteredPlayers = players.filter(player => {
    // Only show players from the current league
    const playerLeague = player.league || 'ipl';
    if (playerLeague !== currentLeague) {
      return false;
    }
    return true;
  });

  // Then filter by team if a specific team is selected
  if (selectedTeam !== 'all') {
    filteredPlayers = filteredPlayers.filter(player => {
        // Only show players with a valid teamId when a specific team is selected
        if (!player.teamId) {
          return false; // Exclude players without a teamId
        }
        
        // Ensure both values are strings for comparison
        const playerTeamId = String(player.teamId).trim();
        const selectedTeamId = String(selectedTeam).trim();
        return playerTeamId === selectedTeamId;
      });
  }

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
  
  // Apply role filter
  if (selectedRole !== 'all') {
    searchFilteredPlayers = searchFilteredPlayers.filter(player => player.role === selectedRole);
  }
  
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {userRole === 'players_admin' ? (
        <PlayersAdminSidebar currentPage="/ipl-admin-2026/players" />
      ) : (
      <AdminSidebar currentPage="/ipl-admin-2026/players" />
      )}
      <div className="flex-1">
        <div className="p-6 lg:p-8">
          {/* Modern Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-8 mb-8 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
              <div>
                      <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
                  Player Management
                </h1>
                      <p className="text-gray-300 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                  Track and manage all {currentLeague === 'wpl' ? 'WPL' : 'IPL'} players
                </p>
              </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                <LeagueSwitch size="md" showLabel={false} />
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-gray-800/50 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      title="List View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleOpenBackupModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl border border-white/10"
                  >
                    <Download className="w-5 h-5" />
                    Backups
                  </button>
                  <button
                    onClick={handleDeleteAllPlayers}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={players.length === 0}
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete All
                  </button>
                <button
                  onClick={handleAddPlayer}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Add Player
                </button>
                </div>
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

            {/* Modern Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Total Players */}
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl hover:from-blue-500/30 hover:to-indigo-600/30 transition-all duration-300 group shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-blue-200 font-medium">Total Players</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-blue-500/20">
                  <span className="text-sm text-blue-100 font-medium">All squads</span>
                  <div className="px-3 py-1 bg-blue-500/30 rounded-full text-xs font-semibold text-blue-100 border border-blue-400/50">
                    Active
                  </div>
                </div>
              </div>

              {/* Batsmen */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-xl hover:from-emerald-500/30 hover:to-teal-600/30 transition-all duration-300 group shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.batsmen}</p>
                    <p className="text-xs text-emerald-200 font-medium">Batsmen</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
                  <span className="text-sm text-emerald-100 font-medium">Run scorers</span>
                  <div className="px-3 py-1 bg-emerald-500/30 rounded-full text-xs font-semibold text-emerald-100 border border-emerald-400/50">
                    {stats.total > 0 ? ((stats.batsmen / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Bowlers */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-xl hover:from-cyan-500/30 hover:to-blue-600/30 transition-all duration-300 group shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.bowlers}</p>
                    <p className="text-xs text-cyan-200 font-medium">Bowlers</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
                  <span className="text-sm text-cyan-100 font-medium">Wicket takers</span>
                  <div className="px-3 py-1 bg-cyan-500/30 rounded-full text-xs font-semibold text-cyan-100 border border-cyan-400/50">
                    {stats.total > 0 ? ((stats.bowlers / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* All-rounders */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30 backdrop-blur-xl hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-300 group shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.allRounders}</p>
                    <p className="text-xs text-purple-200 font-medium">All-rounders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                  <span className="text-sm text-purple-100 font-medium">Versatile</span>
                  <div className="px-3 py-1 bg-purple-500/30 rounded-full text-xs font-semibold text-purple-100 border border-purple-400/50">
                    {stats.total > 0 ? ((stats.allRounders / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Wicket-keepers */}
              <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl p-6 border border-orange-500/30 backdrop-blur-xl hover:from-orange-500/30 hover:to-red-600/30 transition-all duration-300 group shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.wicketkeepers}</p>
                    <p className="text-xs text-orange-200 font-medium">Wicket-keepers</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-orange-500/20">
                  <span className="text-sm text-orange-100 font-medium">Behind stumps</span>
                  <div className="px-3 py-1 bg-orange-500/30 rounded-full text-xs font-semibold text-orange-100 border border-orange-400/50">
                    {stats.total > 0 ? ((stats.wicketkeepers / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Search and Filter Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex gap-4 flex-col md:flex-row items-stretch">
                {/* Enhanced Search Bar */}
              <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                <input
                  type="text"
                  placeholder="Search by player name, nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

                {/* Role Filter */}
              <div className="relative md:min-w-[200px] z-50" data-filter-dropdown>
                <button
                  onClick={() => {
                    setShowAdvancedFilters(!showAdvancedFilters);
                    setIsDropdownOpen(false); // Close team dropdown when role filter opens
                  }}
                  className={`w-full bg-gray-800/50 border border-white/10 px-6 py-3.5 rounded-xl text-white font-medium flex items-center space-x-3 hover:bg-gray-700/50 hover:border-white/20 transition-all duration-300 h-full ${
                    selectedRole !== 'all' ? 'border-blue-500/50 bg-blue-500/10' : ''
                  }`}
                >
                  <Award className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {selectedRole === 'all' ? 'All Roles' : selectedRole}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                {showAdvancedFilters && (
                  <div className="absolute left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[9999]">
                    <div className="py-2">
                      {['all', 'Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'].map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setSelectedRole(role);
                            setShowAdvancedFilters(false);
                          }}
                          className={`w-full px-6 py-3 text-left hover:bg-blue-500/20 transition-all duration-200 flex items-center justify-between ${
                            selectedRole === role ? 'bg-blue-500/30 text-blue-200' : 'text-white'
                          }`}
                        >
                          <span>{role === 'all' ? 'All Roles' : role}</span>
                          {selectedRole === role && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

                {/* Enhanced Team Filter Dropdown */}
              <div className="relative md:min-w-[320px] z-50" data-filter-dropdown>
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setShowAdvancedFilters(false); // Close role filter when team dropdown opens
                  }}
                    className="w-full bg-gray-800/50 border border-white/10 px-6 py-3.5 rounded-xl text-white font-medium flex items-center space-x-3 hover:bg-gray-700/50 hover:border-white/20 transition-all duration-300 group h-full"
                  >
                    <Filter className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="flex-1 text-left truncate flex items-center gap-2">
                    {selectedTeam === 'all' 
                        ? <>All Teams</>
                        : <>{teams.find(t => t.id === selectedTeam)?.shortName || 'Select Team'}</>
                    }
                  </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                  {/* Enhanced Dropdown Menu */}
                <div 
                    className={`absolute left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-out origin-top z-[9999] ${
                    isDropdownOpen 
                      ? 'opacity-100 scale-y-100 max-h-[500px]' 
                      : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
                  }`}
                >
                    <div className="py-2 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-gray-700/50">
                    {/* All Teams Option */}
                    <button
                      onClick={() => {
                        setSelectedTeam('all');
                        setIsDropdownOpen(false);
                      }}
                        className={`w-full px-6 py-3.5 text-left hover:bg-blue-500/20 transition-all duration-200 flex items-center space-x-3 group ${
                          selectedTeam === 'all' ? 'bg-blue-500/30 text-blue-200' : 'text-white'
                        }`}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                          <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                          <div className="font-semibold">All Teams</div>
                        <div className="text-xs text-gray-400">{players.length} total players</div>
                      </div>
                      {selectedTeam === 'all' && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                          </div>
                      )}
                    </button>

                    {/* Divider */}
                    {teams.length > 0 && <div className="border-t border-white/10 my-2" />}

                      {/* Team Options - Only show teams from current league */}
                      {teams
                        .filter(team => team.league === currentLeague)
                        .map((team) => {
                          const teamPlayersCount = players.filter(p => 
                            String(p.teamId) === String(team.id) && 
                            (p.league || 'ipl') === currentLeague
                          ).length;
                      return (
                        <button
                          key={team.id}
                          onClick={() => {
                            setSelectedTeam(team.id);
                            setIsDropdownOpen(false);
                          }}
                              className={`w-full px-6 py-3.5 text-left hover:bg-blue-500/20 transition-all duration-200 flex items-center space-x-3 group ${
                                selectedTeam === team.id ? 'bg-blue-500/30 text-blue-200' : 'text-white'
                          }`}
                        >
                          <div 
                                className="flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm shadow-lg flex-shrink-0"
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
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                                </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Info and Quick Actions */}
              <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                <div className="text-sm text-gray-300">
                  Showing <span className="font-bold text-white">{searchFilteredPlayers.length}</span> of <span className="font-bold text-white">{filteredPlayers.length}</span> players
                {selectedTeam !== 'all' && (
                  <span className="ml-2">
                      in <span className="text-blue-400 font-semibold">{teams.find(t => t.id === selectedTeam)?.name}</span>
                  </span>
                )}
                {selectedRole !== 'all' && (
                  <span className="ml-2">
                      • <span className="text-purple-400 font-semibold">{selectedRole}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                      className="text-xs px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all border border-white/10"
                  >
                    Clear Search
                  </button>
                )}
                {selectedRole !== 'all' && (
                  <button
                    onClick={() => setSelectedRole('all')}
                      className="text-xs px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all border border-white/10"
                  >
                    All Roles
                  </button>
                )}
                {selectedTeam !== 'all' && (
                  <button
                    onClick={() => setSelectedTeam('all')}
                      className="text-xs px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all border border-white/10"
                  >
                    View All Teams
                  </button>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Players Display - Grid or List View */}
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchFilteredPlayers.length > 0 ? searchFilteredPlayers.map((player, idx) => {
                const team = teams.find(t => String(t.id) === String(player.teamId));
                const roleColors = {
                  'Batsman': 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
                  'Bowler': 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30',
                  'All-rounder': 'from-purple-500/20 to-pink-600/20 border-purple-500/30',
                  'Wicket-keeper': 'from-orange-500/20 to-red-600/20 border-orange-500/30'
                };
                const roleColor = roleColors[player.role] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
                
                return (
                  <div
                    key={`${player.id}-${player.teamId}-${selectedTeam}-${idx}`}
                    className={`group bg-gradient-to-br ${roleColor} rounded-2xl p-6 border backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-in fade-in slide-in-from-bottom-4`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => handleEditPlayer(player)}
                  >
                    {/* Player Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {player.nationality && (
                          <FlagImage nationality={player.nationality} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg truncate">{player.name}</h3>
                          <p className="text-gray-400 text-sm truncate">{player.nationality}</p>
                        </div>
                      </div>
                      {player.isCaptain && (
                        <div className="flex-shrink-0">
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" title="Captain" />
                        </div>
                      )}
                    </div>

                    {/* Team Badge */}
                    {team && (
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: team.colors.primary }}
                        >
                          {team.shortName}
                        </div>
                        <span className="text-gray-300 text-sm font-medium truncate">{team.name}</span>
                      </div>
                    )}

                    {/* Role Badge */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                        player.role === 'Batsman' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        player.role === 'Bowler' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        player.role === 'All-rounder' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {player.role}
                      </span>
                    </div>

                    {/* Stats Preview */}
                    {currentLeague !== 'wpl' && (
                      <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Runs</p>
                          <p className="text-ipl-gold font-bold text-lg">{player.stats.runs || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Wickets</p>
                          <p className="text-blue-400 font-bold text-lg">{player.stats.wickets || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Avg</p>
                          <p className="text-purple-400 font-semibold">{player.stats.average && player.stats.average > 0 ? player.stats.average.toFixed(2) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">SR</p>
                          <p className="text-gray-300 font-semibold">{player.stats.strikeRate && player.stats.strikeRate > 0 ? player.stats.strikeRate.toFixed(1) : '-'}</p>
                        </div>
                      </div>
                    )}

                    {/* Player Info */}
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-gray-400">
                        {player.jerseyNumber > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                            #{player.jerseyNumber}
                          </span>
                        )}
                        {player.age > 0 && (
                          <span>{player.age}y</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPlayer(player);
                          }}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlayer(player.id, player.name);
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-400/50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-white/10">
                    <Users className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-300 text-lg font-semibold mb-2">No players found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            /* List View - Modern Players Table */
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors group"
                      >
                        <User className="w-4 h-4" />
                        Name
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                      Jersey
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                      Role
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                      Team
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                      Age
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                      DOB ({currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'})
                      </div>
                    </th>
                    {currentLeague !== 'wpl' && (
                      <>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort('runs')}
                            className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors group"
                          >
                            <TrendingUp className="w-4 h-4" />
                            Runs
                            {sortField === 'runs' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort('wickets')}
                            className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors group"
                          >
                            <Target className="w-4 h-4" />
                            Wickets
                            {sortField === 'wickets' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort('battingAverage')}
                            className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors group"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Batting Avg
                            {sortField === 'battingAverage' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort('bowlingAverage')}
                            className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors group"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Bowling Avg
                            {sortField === 'bowlingAverage' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                          SR
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                          4s/6s
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                          50s/100s
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                          BBM
                          </div>
                        </th>
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                      Actions
                      </div>
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
                      <tr key={`${player.id}-${player.teamId}-${selectedTeam}-${idx}`} className="hover:bg-white/5 transition-colors duration-200 group">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {player.jerseyNumber > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                              {player.jerseyNumber}
                          </span>
                          ) : (
                            <span className="text-gray-500 italic text-xs">Jersey</span>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {player.age > 0 ? (
                            <span className="text-gray-300 font-semibold">{`${player.age}y`}</span>
                          ) : (
                            <span className="text-gray-500 italic text-xs">Age</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {player.dateOfBirth ? (
                            <span className="text-gray-300">
                              {currentLeague === 'wpl' 
                              ? formatDateMonthDDYYYY(player.dateOfBirth)
                                : formatDateDDMMYYYY(player.dateOfBirth)}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic text-xs">DOB</span>
                          )}
                        </td>
                        {currentLeague !== 'wpl' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {player.stats.runs > 0 ? (
                                <span className="text-ipl-gold font-bold">{player.stats.runs}</span>
                              ) : (
                                <span className="text-gray-500 italic">Runs</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {player.stats.wickets > 0 ? (
                                <span className="text-blue-400 font-bold">{player.stats.wickets}</span>
                              ) : (
                                <span className="text-gray-500 italic">Wickets</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {player.stats.average && player.stats.average > 0 ? (
                                <span className="text-purple-400 font-semibold">{player.stats.average.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-500 italic">Avg</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {(() => {
                                const bowlingAvg = player.stats.bowlingAverage ?? 
                                  (player.stats.wickets > 0 
                                    ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
                                    : 0);
                                return bowlingAvg > 0 ? (
                                  <span className="text-gray-300">{bowlingAvg.toFixed(2)}</span>
                                ) : (
                                  <span className="text-gray-500 italic">Bowl Avg</span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {player.stats.strikeRate && player.stats.strikeRate > 0 ? (
                                <span className="text-gray-300">{player.stats.strikeRate.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-500 italic">SR</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {(player.stats.fours > 0 || player.stats.sixes > 0) ? (
                                <span className="text-gray-300">{`${player.stats.fours}/${player.stats.sixes}`}</span>
                              ) : (
                                <span className="text-gray-500 italic">4s/6s</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {(player.stats.fifties > 0 || player.stats.hundreds > 0) ? (
                                <span className="text-gray-300">{`${player.stats.fifties}/${player.stats.hundreds}`}</span>
                              ) : (
                                <span className="text-gray-500 italic">50s/100s</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {player.stats.bestBowling && player.stats.bestBowling !== '-' && player.stats.bestBowling.trim() !== '' ? (
                                <span className="text-gray-300">{player.stats.bestBowling}</span>
                              ) : (
                                <span className="text-gray-500 italic">BBM</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditPlayer(player)}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 flex items-center gap-2 border border-blue-500/30 hover:border-blue-400/50 font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePlayer(player.id, player.name)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 flex items-center gap-2 border border-red-500/30 hover:border-red-400/50 font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={currentLeague === 'wpl' ? 7 : 12} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-white/10">
                            <Users className="w-10 h-10 text-gray-500" />
                          </div>
                          <p className="text-gray-300 text-lg font-semibold mb-2">No players found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Modern Summary Footer */}
          <div className="mt-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-300">
                <span className="font-bold text-white text-lg">{stats.total}</span> total players across <span className="font-bold text-white text-lg">{teams.length}</span> teams
            </div>
              <div className="flex gap-6 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-emerald-400 font-semibold">{stats.batsmen}</span>
                  <span className="text-gray-400">Batsmen</span>
              </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-cyan-400 font-semibold">{stats.bowlers}</span>
                  <span className="text-gray-400">Bowlers</span>
              </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-purple-400 font-semibold">{stats.allRounders}</span>
                  <span className="text-gray-400">All-rounders</span>
              </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-orange-400 font-semibold">{stats.wicketkeepers}</span>
                  <span className="text-gray-400">Wicket-keepers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Player Form Modal */}
          <ModernDialog
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={editingPlayer ? 'Edit Player' : 'Add New Player'}
            description={editingPlayer ? 'Update player information and statistics' : 'Add a new player to the database'}
            variant="info"
            size="xl"
            icon={<CustomEmoji type="cricket-stumps" size={24} />}
            contentClassName="max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-gray-700/50"
            footer={
              <div className="flex gap-4">
                <button
                  type="submit"
                  form="player-form"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {editingPlayer ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Update Player
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Player
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/10 bg-slate-800/60 hover:bg-slate-700/80 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            }
          >
            <form id="player-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Section Header */}
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" />
                        Basic Information
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Enter player's personal details and team assignment</p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Player Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full pl-4 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
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
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            setFormData({
                              ...formData, 
                              role: newRole,
                              // Reset allrounderType if role is not All-rounder
                              allrounderType: newRole === 'All-rounder' ? formData.allrounderType : ''
                            });
                          }}
                          className="w-full pl-4 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket-keeper">Wicket-keeper</option>
                        </select>
                      </div>

                      {formData.role === 'All-rounder' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            All-rounder Type
                          </label>
                          <select
                            value={formData.allrounderType}
                            onChange={(e) => setFormData({...formData, allrounderType: e.target.value as any})}
                            className="w-full pl-4 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            required
                          >
                            <option value="">Select type</option>
                            <option value="Batting All-rounder">Batting All-rounder</option>
                            <option value="Bowling All-rounder">Bowling All-rounder</option>
                          </select>
                        </div>
                      )}

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
                          value={formData.age === '0' || formData.age === 0 ? '' : formData.age}
                          onChange={(e) => {
                            // When admin manually changes age, clear the last calculated age
                            // so it won't be auto-overwritten
                            const newValue = e.target.value;
                            if (newValue !== lastCalculatedAge) {
                              setLastCalculatedAge('');
                            }
                            setFormData({...formData, age: newValue});
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Age"
                          required={!formData.dateOfBirth || formData.dateOfBirth.trim() === ''}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => {
                            if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
                              return 'Enter age manually or provide date of birth to auto-calculate';
                            }
                            
                            // Try to parse the date to see if it's valid
                            let parsedDate = '';
                            if (currentLeague === 'wpl') {
                              parsedDate = parseDateMonthDDYYYY(formData.dateOfBirth);
                            } else {
                              // For IPL, try DD/MM/YYYY format first
                              parsedDate = parseDateDDMMYYYY(formData.dateOfBirth);
                              // If that fails, try Month DD, YYYY format as fallback
                              if (!parsedDate) {
                                parsedDate = parseDateMonthDDYYYY(formData.dateOfBirth);
                              }
                            }
                            
                            if (parsedDate) {
                              // Debug: log the parsed date
                              console.log('Display - Parsed date:', parsedDate, 'Input:', formData.dateOfBirth);
                              const calculatedAge = calculateAge(parsedDate);
                              console.log('Display - Calculated age:', calculatedAge);
                              if (calculatedAge > 0) {
                                return `Age automatically calculated: ${calculatedAge} years (you can manually change if needed)`;
                              } else {
                                // Additional debugging
                                const testDate = new Date(parsedDate);
                                console.log('Display - Test date object:', testDate, 'Is valid:', !isNaN(testDate.getTime()));
                                // Check if parsedDate contains NaN (invalid parsing)
                                if (parsedDate.includes('NaN') || isNaN(testDate.getTime())) {
                                  return `⚠ Invalid date format. Please use ${currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY or Month DD, YYYY'} format.`;
                                }
                                return `⚠ Age calculation returned 0. Please check the date format.`;
                              }
                            } else {
                              return `Invalid date format. Use ${currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'} format (e.g., ${currentLeague === 'wpl' ? 'December 25, 1994' : '25/12/1994'})`;
                            }
                          })()}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date of Birth ({currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY or Month DD, YYYY'})
                        </label>
                        <input
                          type="text"
                          value={formData.dateOfBirth}
                          onChange={(e) => {
                            setFormData({...formData, dateOfBirth: e.target.value});
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder={currentLeague === 'wpl' ? 'December 25, 1994 (optional)' : '25/12/1994 or December 25, 1994 (optional)'}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {(() => {
                            if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
                              return 'Optional: If provided, age will be automatically calculated';
                            }
                            
                            // Try to parse the date
                            let parsedDate = '';
                            if (currentLeague === 'wpl') {
                              parsedDate = parseDateMonthDDYYYY(formData.dateOfBirth);
                            } else {
                              // For IPL, try DD/MM/YYYY format first
                              parsedDate = parseDateDDMMYYYY(formData.dateOfBirth);
                              // If that fails, try Month DD, YYYY format as fallback
                              if (!parsedDate) {
                                parsedDate = parseDateMonthDDYYYY(formData.dateOfBirth);
                              }
                            }
                            
                            if (parsedDate) {
                              const calculatedAge = calculateAge(parsedDate);
                              if (calculatedAge > 0) {
                                return `✓ Valid date. Age: ${calculatedAge} years`;
                              } else {
                                // If age is 0, the date might be in the future or there's a parsing issue
                                const testDate = new Date(parsedDate);
                                if (isNaN(testDate.getTime())) {
                                  return `⚠ Date parsing issue. Parsed: ${parsedDate}`;
                                }
                                const today = new Date();
                                if (testDate > today) {
                                  return `⚠ Date is in the future. Please check the date.`;
                                }
                                return `⚠ Age calculation returned 0. Parsed date: ${parsedDate}`;
                              }
                            } else {
                              return `⚠ Invalid format. Use ${currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'} (e.g., ${currentLeague === 'wpl' ? 'December 25, 1994' : '25/12/1994'})`;
                            }
                          })()}
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
                            placeholder="Matches"
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
                            placeholder="Runs"
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
                            placeholder="Wickets"
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
                            placeholder="e.g., 45.67"
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
                            placeholder="e.g., 25.50"
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
                            placeholder="e.g., 145.50"
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
                            placeholder="e.g., 8.50"
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
                            placeholder="Highest Score"
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
                            placeholder="Fours"
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
                            placeholder="Sixes"
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
                            placeholder="Fifties"
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
                            placeholder="Hundreds"
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

