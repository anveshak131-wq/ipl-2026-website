'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import ModernDialog from '@/components/admin/ModernDialog';
import LeagueSwitch from '@/components/admin/LeagueSwitch';
import WPLTeamsManager from '@/components/admin/WPLTeamsManager';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { parseDateDDMMYYYY, calculateAge, isValidDate, formatDateMonthDDYYYY, parseDateMonthDDYYYY, isValidDateForLeague } from '@/lib/dateUtils';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';
import CustomSelect from '@/components/ui/CustomSelect';
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
      // Batting-specific stats
      battingInnings: string;
      notOuts: string;
      ballsFaced: string;
      battingAverage: string;
      battingStrikeRate: string;
      // Bowling-specific stats
      bowlingInnings: string;
      balls: string;
      maidens: string;
      runsConceded: string;
      bowlingStrikeRate: string;
      fiveWickets: string;
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
      bestBowling: '',
      // Batting-specific stats
      battingInnings: '',
      notOuts: '',
      ballsFaced: '',
      battingAverage: '',
      battingStrikeRate: '',
      // Bowling-specific stats
      bowlingInnings: '',
      balls: '',
      maidens: '',
      runsConceded: '',
      bowlingStrikeRate: '',
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
        
        // Always use Month DD, YYYY format for both IPL and WPL
          dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
        
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

  // Listen for real-time data updates
  useEffect(() => {
    const handleDataUpdate = async (event: CustomEvent) => {
      const { type } = event.detail || {};
      
      if (type === 'player-updated' || type === 'player-created' || type === 'player-deleted') {
        console.log('Players page: Data update detected, refreshing...');
        // Immediate refresh
        await fetchData();
      }
    };

    window.addEventListener('admin-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('admin-data-updated', handleDataUpdate as EventListener);
    };
  }, [currentLeague]); // Include currentLeague to ensure we refresh with correct league

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
        bestBowling: '',
        // Batting-specific stats
        battingInnings: '',
        notOuts: '',
        ballsFaced: '',
        battingAverage: '',
        battingStrikeRate: '',
        // Bowling-specific stats
        bowlingInnings: '',
        balls: '',
        maidens: '',
        runsConceded: '',
        bowlingStrikeRate: '',
        fiveWickets: ''
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
          : formatDateMonthDDYYYY(player.dateOfBirth))
      : '';
    
    if (dobFormatted) {
      // Always use Month DD, YYYY format for both IPL and WPL
      const dateISO = parseDateMonthDDYYYY(dobFormatted);
      
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
        bestBowling: player.stats.bestBowling && player.stats.bestBowling !== '-' && player.stats.bestBowling.trim() !== '' ? player.stats.bestBowling : '',
        // Batting-specific stats
        battingInnings: player.stats.battingInnings > 0 ? player.stats.battingInnings.toString() : '',
        notOuts: player.stats.notOuts > 0 ? player.stats.notOuts.toString() : '',
        ballsFaced: player.stats.ballsFaced > 0 ? player.stats.ballsFaced.toString() : '',
        battingAverage: player.stats.battingAverage && player.stats.battingAverage !== '0' && player.stats.battingAverage !== '-' ? player.stats.battingAverage : '',
        battingStrikeRate: player.stats.battingStrikeRate && player.stats.battingStrikeRate !== '0' && player.stats.battingStrikeRate !== '-' ? player.stats.battingStrikeRate : '',
        // Bowling-specific stats
        bowlingInnings: player.stats.bowlingInnings > 0 ? player.stats.bowlingInnings.toString() : '',
        balls: player.stats.balls > 0 ? player.stats.balls.toString() : '',
        maidens: player.stats.maidens > 0 ? player.stats.maidens.toString() : '',
        runsConceded: player.stats.runsConceded > 0 ? player.stats.runsConceded.toString() : '',
        bowlingStrikeRate: player.stats.bowlingStrikeRate && player.stats.bowlingStrikeRate !== '0' && player.stats.bowlingStrikeRate !== '-' ? player.stats.bowlingStrikeRate : '',
        fiveWickets: player.stats.fiveWickets > 0 ? player.stats.fiveWickets.toString() : ''
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
        // Always use Month DD, YYYY format for both IPL and WPL
          dateOfBirthISO = parseDateMonthDDYYYY(formData.dateOfBirth);
        
        // Validate the parsed date
        if (!dateOfBirthISO) {
          const expectedFormat = 'Month DD, YYYY (e.g., December 25, 1994)';
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

      // For WPL, stats are not required - set all to 0
      const statsForPlayer = formData.league === 'wpl' ? {
        matches: 0,
        runs: 0,
        wickets: 0,
        average: 0,
        bowlingAverage: 0,
        strikeRate: 0,
        economy: 0,
        highest: 0,
        fours: 0,
        sixes: 0,
        fifties: 0,
        hundreds: 0,
        bestBowling: '-',
        battingInnings: 0,
        notOuts: 0,
        ballsFaced: 0,
        bowlingInnings: 0,
        balls: 0,
        maidens: 0,
        runsConceded: 0,
        bowlingStrikeRate: '',
        fiveWickets: 0,
        battingAverage: '',
        battingStrikeRate: '',
      } : {
          matches: formData.stats.matches ? parseInt(formData.stats.matches) || 0 : 0,
          runs: formData.stats.runs ? parseInt(formData.stats.runs) || 0 : 0,
          wickets: formData.stats.wickets ? parseInt(formData.stats.wickets) || 0 : 0,
          // Calculate average and strikeRate from base stats if not provided
          average: (() => {
            if (formData.stats.average && formData.stats.average.trim() !== '') {
              return parseFloat(formData.stats.average) || 0;
            }
            // Calculate from runs, battingInnings, notOuts
            const runs = formData.stats.runs ? parseInt(formData.stats.runs) || 0 : 0;
            const battingInnings = formData.stats.battingInnings ? parseInt(formData.stats.battingInnings) || 0 : 0;
            const notOuts = formData.stats.notOuts ? parseInt(formData.stats.notOuts) || 0 : 0;
            const dismissals = battingInnings - notOuts;
            if (dismissals > 0 && runs > 0) {
              return runs / dismissals;
            }
            return 0;
          })(),
          strikeRate: (() => {
            if (formData.stats.strikeRate && formData.stats.strikeRate.trim() !== '') {
              return parseFloat(formData.stats.strikeRate) || 0;
            }
            // Calculate from runs and ballsFaced
            const runs = formData.stats.runs ? parseInt(formData.stats.runs) || 0 : 0;
            const ballsFaced = formData.stats.ballsFaced ? parseInt(formData.stats.ballsFaced) || 0 : 0;
            if (ballsFaced > 0 && runs > 0) {
              return (runs * 100) / ballsFaced;
            }
            return 0;
          })(),
          // Bowling stats - calculate if not provided
          bowlingAverage: (() => {
            if (formData.stats.bowlingAverage && formData.stats.bowlingAverage.trim() !== '') {
              return parseFloat(formData.stats.bowlingAverage) || 0;
            }
            // Calculate from wickets and runsConceded
            const wickets = formData.stats.wickets ? parseInt(formData.stats.wickets) || 0 : 0;
            const runsConceded = formData.stats.runsConceded ? parseInt(formData.stats.runsConceded) || 0 : 0;
            if (wickets > 0 && runsConceded >= 0) {
              return runsConceded / wickets;
            }
            return 0;
          })(),
          economy: (() => {
            if (formData.stats.economy && formData.stats.economy.trim() !== '') {
              return parseFloat(formData.stats.economy) || 0;
            }
            // Calculate from balls and runsConceded
            const balls = formData.stats.balls ? parseInt(formData.stats.balls) || 0 : 0;
            const runsConceded = formData.stats.runsConceded ? parseInt(formData.stats.runsConceded) || 0 : 0;
            if (balls > 0 && runsConceded >= 0) {
              return (runsConceded * 6) / balls;
            }
            return 0;
          })(),
          highest: formData.stats.highest ? parseInt(formData.stats.highest) || 0 : 0,
          fours: formData.stats.fours ? parseInt(formData.stats.fours) || 0 : 0,
          sixes: formData.stats.sixes ? parseInt(formData.stats.sixes) || 0 : 0,
          fifties: formData.stats.fifties ? parseInt(formData.stats.fifties) || 0 : 0,
          hundreds: formData.stats.hundreds ? parseInt(formData.stats.hundreds) || 0 : 0,
          bestBowling: formData.stats.bestBowling || '-',
          // Batting-specific stats
          battingInnings: formData.stats.battingInnings ? parseInt(formData.stats.battingInnings) || 0 : 0,
          notOuts: formData.stats.notOuts ? parseInt(formData.stats.notOuts) || 0 : 0,
          ballsFaced: formData.stats.ballsFaced ? parseInt(formData.stats.ballsFaced) || 0 : 0,
          battingAverage: formData.stats.battingAverage && formData.stats.battingAverage.trim() !== '' ? formData.stats.battingAverage : '',
          battingStrikeRate: formData.stats.battingStrikeRate && formData.stats.battingStrikeRate.trim() !== '' ? formData.stats.battingStrikeRate : '',
          // Bowling-specific stats
          bowlingInnings: formData.stats.bowlingInnings ? parseInt(formData.stats.bowlingInnings) || 0 : 0,
          balls: formData.stats.balls ? parseInt(formData.stats.balls) || 0 : 0,
          maidens: formData.stats.maidens ? parseInt(formData.stats.maidens) || 0 : 0,
          runsConceded: formData.stats.runsConceded ? parseInt(formData.stats.runsConceded) || 0 : 0,
          bowlingStrikeRate: formData.stats.bowlingStrikeRate && formData.stats.bowlingStrikeRate.trim() !== '' ? formData.stats.bowlingStrikeRate : '',
          fiveWickets: formData.stats.fiveWickets ? parseInt(formData.stats.fiveWickets) || 0 : 0,
      };

      // Ensure allrounderType is properly set for All-rounders
      const allrounderTypeValue = formData.role === 'All-rounder' && formData.allrounderType && formData.allrounderType.trim() !== '' 
        ? formData.allrounderType 
        : undefined;
      
      console.log('Saving player - Role:', formData.role, 'All-rounder Type:', allrounderTypeValue, 'Form allrounderType:', formData.allrounderType);

      const playerData = {
        name: formData.name,
        role: formData.role,
        allrounderType: allrounderTypeValue,
        teamId: formData.teamId,
        league: formData.league,
        dateOfBirth: dateOfBirthISO || undefined,
        age: calculatedAge,
        nationality: formData.nationality,
        jerseyNumber: parseInt(formData.jerseyNumber) || 0,
        isCaptain: formData.isCaptain,
        bowlingStyle: finalBowlingStyle,
        battingStyle: formData.battingStyle,
        stats: statsForPlayer,
        transferInfo: {
          lastAuctionYear: formData.lastAuctionYear ? Number(formData.lastAuctionYear) : undefined,
          acquiredVia: formData.acquiredVia,
          transferable: !!formData.transferable,
          transferFee: formData.transferFee ? parseFloat(String(formData.transferFee)) : undefined,
          notes: formData.transferNotes || undefined
        }
      };

      if (editingPlayer) {
        // Update existing player - CRITICAL: Preserve ALL existing fields first, then override with form data
        const updatePayload = {
          ...editingPlayer, // Preserve ALL existing player fields first
          ...playerData,    // Then override with form data
          id: editingPlayer.id, // Ensure ID is always set
          // Explicitly preserve fields that might not be in form
          dateOfBirth: dateOfBirthISO || editingPlayer.dateOfBirth,
          nationality: formData.nationality || editingPlayer.nationality,
          battingStyle: formData.battingStyle || editingPlayer.battingStyle,
          bowlingStyle: finalBowlingStyle || editingPlayer.bowlingStyle,
          jerseyNumber: parseInt(formData.jerseyNumber) || editingPlayer.jerseyNumber || 0,
          isCaptain: formData.isCaptain !== undefined ? formData.isCaptain : editingPlayer.isCaptain,
          // Preserve transferInfo structure
          transferInfo: {
            ...editingPlayer.transferInfo, // Preserve existing transfer info
            ...(formData.lastAuctionYear && { lastAuctionYear: Number(formData.lastAuctionYear) }),
            ...(formData.acquiredVia && { acquiredVia: formData.acquiredVia }),
            transferable: formData.transferable !== undefined ? !!formData.transferable : (editingPlayer.transferInfo?.transferable || false),
            ...(formData.transferFee && { transferFee: parseFloat(String(formData.transferFee)) }),
            ...(formData.transferNotes && { notes: formData.transferNotes }),
          },
          // Preserve stats structure - merge existing stats with new ones
          stats: {
            ...editingPlayer.stats, // Preserve ALL existing stats first
            ...statsForPlayer,     // Then override with form stats
          },
        };
        
        const response = await fetch('/api/players', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update player' }));
          throw new Error(errorData.error || 'Failed to update player');
        }
        
        const updatedPlayer = await response.json();
        console.log('Player updated successfully:', updatedPlayer);
        
        // Dispatch real-time update event FIRST to notify other pages
        console.log('Dispatching admin-data-updated event for player:', editingPlayer.id);
        window.dispatchEvent(new CustomEvent('admin-data-updated', {
          detail: { type: 'player-updated', playerId: editingPlayer.id }
        }));
        
        // Then refresh this page's data
        await fetchData();
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
        
        const newPlayer = await response.json();
        
        // Dispatch real-time update event FIRST to notify other pages
        console.log('Dispatching admin-data-updated event for new player:', newPlayer.id);
        window.dispatchEvent(new CustomEvent('admin-data-updated', {
          detail: { type: 'player-created', playerId: newPlayer.id }
        }));
        
        // Then refresh this page's data
      await fetchData();
      }
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

      const deletedPlayerId = deleteTarget.id;
      const response = await fetch(`/api/players?id=${deletedPlayerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      // Dispatch real-time update event FIRST to notify other pages
      console.log('Dispatching admin-data-updated event for deleted player:', deletedPlayerId);
      window.dispatchEvent(new CustomEvent('admin-data-updated', {
        detail: { type: 'player-deleted', playerId: deletedPlayerId }
      }));
      
      // Then refresh this page's data
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
      <div className="flex-1 relative">
        <div className="p-6 lg:p-8 relative">
          {/* Enhanced Modern Header */}
          <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/30 to-purple-900/30 rounded-3xl p-8 mb-8 border border-white/10 backdrop-blur-xl shadow-2xl">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
              </div>
              
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl lg:text-6xl font-extrabold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Player Management
                </h1>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30">
                          {currentLeague === 'wpl' ? 'WPL' : 'IPL'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                        Manage and track all {currentLeague === 'wpl' ? 'WPL' : 'IPL'} players across {teams.length} teams
                </p>
              </div>
                  </div>
                </div>
                
                {/* Action Buttons Group */}
                <div className="flex items-center gap-3 flex-wrap">
                <LeagueSwitch size="md" showLabel={false} />
                  
                  {/* View Toggle - Enhanced */}
                  <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm rounded-xl p-1.5 border border-white/10 shadow-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-lg transition-all duration-300 ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-lg transition-all duration-300 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                      title="List View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleOpenBackupModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl border border-white/10 hover:border-white/20"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Backups</span>
                  </button>
                  
                  <button
                    onClick={handleDeleteAllPlayers}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                    disabled={players.length === 0}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Delete All</span>
                  </button>
                  
                <button
                  onClick={handleAddPlayer}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-2xl hover:scale-105 border border-white/20"
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

            {/* Enhanced Statistics Cards with Progress Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Total Players - Enhanced */}
              <div className="group relative bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-blue-700/30 rounded-2xl p-6 border border-blue-500/40 backdrop-blur-xl hover:border-blue-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-600/30 animate-ping"></div>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-white mb-1">{stats.total}</p>
                      <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Total Players</p>
                  </div>
                </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all duration-1000"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-blue-500/30">
                    <span className="text-xs text-blue-100 font-medium">All Teams</span>
                    <div className="px-3 py-1 bg-blue-500/40 rounded-full text-xs font-bold text-white border border-blue-400/50 backdrop-blur-sm">
                      {teams.length} Teams
                    </div>
                  </div>
                </div>
              </div>

              {/* Batsmen - Enhanced */}
              <div className="group relative bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-700/30 rounded-2xl p-6 border border-emerald-500/40 backdrop-blur-xl hover:border-emerald-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-white mb-1">{stats.batsmen}</p>
                      <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Batsmen</p>
                  </div>
                </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-1.5 bg-emerald-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.batsmen / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-emerald-500/30">
                    <span className="text-xs text-emerald-100 font-medium">Run Scorers</span>
                    <div className="px-3 py-1 bg-emerald-500/40 rounded-full text-xs font-bold text-white border border-emerald-400/50 backdrop-blur-sm">
                    {stats.total > 0 ? ((stats.batsmen / stats.total) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowlers - Enhanced */}
              <div className="group relative bg-gradient-to-br from-cyan-600/30 via-blue-600/20 to-cyan-700/30 rounded-2xl p-6 border border-cyan-500/40 backdrop-blur-xl hover:border-cyan-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-white mb-1">{stats.bowlers}</p>
                      <p className="text-xs text-cyan-200 font-semibold uppercase tracking-wider">Bowlers</p>
                  </div>
                </div>
                  
                  <div className="mb-3">
                    <div className="h-1.5 bg-cyan-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.bowlers / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-cyan-500/30">
                    <span className="text-xs text-cyan-100 font-medium">Wicket Takers</span>
                    <div className="px-3 py-1 bg-cyan-500/40 rounded-full text-xs font-bold text-white border border-cyan-400/50 backdrop-blur-sm">
                    {stats.total > 0 ? ((stats.bowlers / stats.total) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* All-rounders - Enhanced */}
              <div className="group relative bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-purple-700/30 rounded-2xl p-6 border border-purple-500/40 backdrop-blur-xl hover:border-purple-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-white mb-1">{stats.allRounders}</p>
                      <p className="text-xs text-purple-200 font-semibold uppercase tracking-wider">All-rounders</p>
                  </div>
                </div>
                  
                  <div className="mb-3">
                    <div className="h-1.5 bg-purple-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.allRounders / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-purple-500/30">
                    <span className="text-xs text-purple-100 font-medium">Versatile</span>
                    <div className="px-3 py-1 bg-purple-500/40 rounded-full text-xs font-bold text-white border border-purple-400/50 backdrop-blur-sm">
                    {stats.total > 0 ? ((stats.allRounders / stats.total) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Wicket-keepers - Enhanced */}
              <div className="group relative bg-gradient-to-br from-orange-600/30 via-red-600/20 to-orange-700/30 rounded-2xl p-6 border border-orange-500/40 backdrop-blur-xl hover:border-orange-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-4xl font-extrabold text-white mb-1">{stats.wicketkeepers}</p>
                      <p className="text-xs text-orange-200 font-semibold uppercase tracking-wider">Wicket-keepers</p>
                  </div>
                </div>
                  
                  <div className="mb-3">
                    <div className="h-1.5 bg-orange-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.wicketkeepers / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-orange-500/30">
                    <span className="text-xs text-orange-100 font-medium">Behind Stumps</span>
                    <div className="px-3 py-1 bg-orange-500/40 rounded-full text-xs font-bold text-white border border-orange-400/50 backdrop-blur-sm">
                    {stats.total > 0 ? ((stats.wicketkeepers / stats.total) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Section */}
          <div className="mb-8 relative z-10">
            <div className="relative bg-gradient-to-br from-slate-800/80 via-gray-800/60 to-slate-900/80 rounded-2xl p-6 border border-white/10 backdrop-blur-xl shadow-2xl overflow-visible">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex gap-4 flex-col md:flex-row items-stretch">
                {/* Enhanced Search Bar */}
                <div className="relative flex-1 group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Search className={`w-5 h-5 transition-colors duration-300 ${searchQuery ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
                  </div>
                <input
                  type="text"
                  placeholder="Search by player name, nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-900/70 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:border-white/20 shadow-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Role Filter - Enhanced */}
              <div className="relative md:min-w-[200px] z-[100]" data-filter-dropdown>
                <button
                  onClick={() => {
                    setShowAdvancedFilters(!showAdvancedFilters);
                    setIsDropdownOpen(false); // Close team dropdown when role filter opens
                  }}
                  className={`w-full bg-gray-900/70 border px-6 py-4 rounded-xl text-white font-medium flex items-center space-x-3 transition-all duration-300 h-full shadow-lg ${
                    selectedRole !== 'all' 
                      ? 'border-purple-500/50 bg-purple-500/10 hover:border-purple-400/60' 
                      : 'border-white/10 hover:border-white/20 hover:bg-gray-800/70'
                  }`}
                >
                  <Award className={`w-5 h-5 flex-shrink-0 transition-colors ${selectedRole !== 'all' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left truncate">
                    {selectedRole === 'all' ? 'All Roles' : selectedRole}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-all duration-300 flex-shrink-0 ${showAdvancedFilters ? 'rotate-180 text-purple-400' : 'text-gray-400'}`} />
                </button>
                {showAdvancedFilters && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[9999]">
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
              <div className="relative md:min-w-[320px] z-[100]" data-filter-dropdown>
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setShowAdvancedFilters(false); // Close role filter when team dropdown opens
                  }}
                    className={`w-full bg-gray-900/70 border px-6 py-4 rounded-xl text-white font-medium flex items-center space-x-3 transition-all duration-300 group h-full shadow-lg ${
                      selectedTeam !== 'all'
                        ? 'border-blue-500/50 bg-blue-500/10 hover:border-blue-400/60'
                        : 'border-white/10 hover:border-white/20 hover:bg-gray-800/70'
                    }`}
                  >
                    <Filter className={`w-5 h-5 flex-shrink-0 transition-colors ${selectedTeam !== 'all' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left truncate flex items-center gap-2">
                    {selectedTeam === 'all' 
                        ? <>All Teams</>
                        : <>{teams.find(t => t.id === selectedTeam)?.shortName || 'Select Team'}</>
                    }
                  </span>
                    <ChevronDown className={`w-5 h-5 transition-all duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180 text-blue-400' : 'text-gray-400'}`} />
                </button>

                  {/* Enhanced Dropdown Menu */}
                {isDropdownOpen && (
                <div 
                    className="absolute left-0 right-0 top-full mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[9999]"
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
                )}
              </div>
            </div>

            {/* Enhanced Results Info and Quick Actions */}
              <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm text-gray-300">
                    Showing <span className="font-bold text-white text-base">{searchFilteredPlayers.length}</span> of <span className="font-bold text-white text-base">{filteredPlayers.length}</span> players
                  </div>
                {selectedTeam !== 'all' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-blue-300 font-medium">{teams.find(t => t.id === selectedTeam)?.name}</span>
                    </div>
                  )}
                  {selectedRole !== 'all' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs text-purple-300 font-medium">{selectedRole}</span>
              </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                      className="text-xs px-4 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-white/10 hover:border-white/20 shadow-md hover:shadow-lg"
                  >
                      <X className="w-3 h-3 inline mr-1" />
                    Clear Search
                  </button>
                )}
                  {selectedRole !== 'all' && (
                    <button
                      onClick={() => setSelectedRole('all')}
                      className="text-xs px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-100 transition-all border border-purple-500/30 hover:border-purple-400/50 shadow-md hover:shadow-lg"
                    >
                      All Roles
                  </button>
                )}
                {selectedTeam !== 'all' && (
                  <button
                    onClick={() => setSelectedTeam('all')}
                      className="text-xs px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-100 transition-all border border-blue-500/30 hover:border-blue-400/50 shadow-md hover:shadow-lg"
                  >
                      All Teams
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
              {searchFilteredPlayers.length > 0 ? (
                searchFilteredPlayers.map((player, idx) => {
                  const team = teams.find(t => String(t.id) === String(player.teamId));
                  
                  // Determine role colors with special handling for All-rounder types
                  let roleColors: string;
                  let roleBadgeColors: string;
                  let roleLabel: string;
                  let roleIcon: React.ReactNode = null;
                  
                  if (player.role === 'All-rounder') {
                    if (player.allrounderType === 'Batting All-rounder') {
                      // Batting All-rounder: Green/Emerald gradient (batting-focused) - MORE PROMINENT
                      roleColors = 'from-emerald-600/30 via-green-500/25 to-emerald-500/30 border-emerald-300/50';
                      roleBadgeColors = 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-emerald-100 border-2 border-emerald-300/60 shadow-xl shadow-emerald-500/30';
                      roleLabel = 'Batting All-rounder';
                      roleIcon = (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    } else if (player.allrounderType === 'Bowling All-rounder') {
                      // Bowling All-rounder: Blue/Cyan gradient (bowling-focused) - MORE PROMINENT
                      roleColors = 'from-cyan-600/30 via-blue-500/25 to-cyan-500/30 border-cyan-300/50';
                      roleBadgeColors = 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-cyan-100 border-2 border-cyan-300/60 shadow-xl shadow-cyan-500/30';
                      roleLabel = 'Bowling All-rounder';
                      roleIcon = (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      );
                    } else {
                      // Generic All-rounder: Purple/Pink gradient (default)
                      roleColors = 'from-purple-500/20 to-pink-600/20 border-purple-500/30';
                      roleBadgeColors = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                      roleLabel = 'All-rounder';
                      roleIcon = <Award className="w-4 h-4" />;
                    }
                  } else if (player.role === 'Batsman') {
                    // Batsman: Amber/Yellow gradient (different from Batting All-rounder's green)
                    roleColors = 'from-amber-600/30 via-yellow-500/25 to-orange-500/30 border-amber-300/50';
                    roleBadgeColors = 'bg-gradient-to-r from-amber-500/40 to-yellow-500/40 text-amber-100 border-2 border-amber-300/60 shadow-xl shadow-amber-500/30';
                    roleLabel = 'Batsman';
                    roleIcon = (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    );
                  } else if (player.role === 'Bowler') {
                    // Bowler: Teal/Turquoise gradient (fresh and distinct from cyan)
                    roleColors = 'from-teal-600/30 via-cyan-500/25 to-teal-500/30 border-teal-300/50';
                    roleBadgeColors = 'bg-gradient-to-r from-teal-500/40 to-cyan-500/40 text-teal-100 border-2 border-teal-300/60 shadow-xl shadow-teal-500/30';
                    roleLabel = 'Bowler';
                    roleIcon = (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    );
                  } else if (player.role === 'Wicket-keeper') {
                    // Wicket-keeper: Rose/Pink gradient
                    roleColors = 'from-rose-600/30 via-pink-500/25 to-red-500/30 border-rose-300/50';
                    roleBadgeColors = 'bg-gradient-to-r from-rose-500/40 to-pink-500/40 text-rose-100 border-2 border-rose-300/60 shadow-xl shadow-rose-500/30';
                    roleLabel = 'Wicket-keeper';
                    roleIcon = <Shield className="w-4 h-4" />;
                  } else {
                    // Default/Unknown role
                    roleColors = 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
                    roleBadgeColors = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                    roleLabel = player.role;
                  }
                  
                  return (
                    <div
                      key={`${player.id}-${player.teamId}-${selectedTeam}-${idx}`}
                      className={`group relative bg-gradient-to-br ${roleColors} rounded-2xl p-6 border backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] cursor-pointer overflow-hidden`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => handleEditPlayer(player)}
                    >
                      {/* Animated background glow on hover - Enhanced for all role types */}
                      <div className={`absolute inset-0 transition-opacity duration-500 ${
                        player.role === 'All-rounder' && player.allrounderType === 'Batting All-rounder' 
                          ? 'bg-gradient-to-br from-emerald-500/0 to-green-500/10 opacity-0 group-hover:opacity-100' :
                        player.role === 'All-rounder' && player.allrounderType === 'Bowling All-rounder'
                          ? 'bg-gradient-to-br from-cyan-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100' :
                        player.role === 'Batsman'
                          ? 'bg-gradient-to-br from-amber-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100' :
                        player.role === 'Bowler'
                          ? 'bg-gradient-to-br from-teal-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100' :
                        player.role === 'Wicket-keeper'
                          ? 'bg-gradient-to-br from-rose-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100' :
                        'bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100'
                      }`}></div>
                      
                      {/* Prominent accent border for all role types */}
                      {player.role === 'All-rounder' && player.allrounderType && (
                        <div className={`absolute top-0 left-0 right-0 h-2 ${
                          player.allrounderType === 'Batting All-rounder'
                            ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 shadow-lg shadow-emerald-500/50'
                            : 'bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 shadow-lg shadow-cyan-500/50'
                        }`}></div>
                      )}
                      {player.role === 'Batsman' && (
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/50"></div>
                      )}
                      {player.role === 'Bowler' && (
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 shadow-lg shadow-teal-500/50"></div>
                      )}
                      {player.role === 'Wicket-keeper' && (
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 shadow-lg shadow-rose-500/50"></div>
                      )}
                      
                      {/* Content */}
                      <div className="relative z-10">
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

                        {/* Role Badge - Enhanced with all role types */}
                        <div className="mb-4">
                          <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-300 hover:scale-110 ${roleBadgeColors}`}>
                            {/* Icon based on role type */}
                            {roleIcon}
                            <span className="font-extrabold">{roleLabel}</span>
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
                              className="p-2.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-100 rounded-xl transition-all duration-300 border border-blue-500/30 hover:border-blue-400/60 hover:scale-110 shadow-lg hover:shadow-blue-500/20 group/btn"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlayer(player.id, player.name);
                              }}
                              className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-400/60 hover:scale-110 shadow-lg hover:shadow-red-500/20 group/btn"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
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
            /* List View - Enhanced Modern Players Table */
            <div className="relative bg-gradient-to-br from-slate-800/80 via-gray-800/60 to-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-900/90 via-slate-900/90 to-gray-900/90 border-b border-white/10 backdrop-blur-sm sticky top-0 z-10">
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
                  {searchFilteredPlayers.length > 0 ? (
                    searchFilteredPlayers
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
                      <tr key={`${player.id}-${player.teamId}-${selectedTeam}-${idx}`} className="hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 group border-b border-white/5">
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
                          {(() => {
                            // Determine role badge colors with special handling for All-rounder types
                            let roleBadgeColors: string;
                            let roleLabel: string;
                            
                            if (player.role === 'All-rounder') {
                              if (player.allrounderType === 'Batting All-rounder') {
                                roleBadgeColors = 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-200 border-emerald-400/50 shadow-lg shadow-emerald-500/20';
                                roleLabel = 'Batting All-rounder';
                              } else if (player.allrounderType === 'Bowling All-rounder') {
                                roleBadgeColors = 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-500/20';
                                roleLabel = 'Bowling All-rounder';
                              } else {
                                roleBadgeColors = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                                roleLabel = 'All-rounder';
                              }
                            } else {
                              const roleColorMap = {
                                'Batsman': 'bg-gradient-to-r from-amber-500/40 to-yellow-500/40 text-amber-100 border-2 border-amber-300/60 shadow-xl shadow-amber-500/30',
                                'Bowler': 'bg-gradient-to-r from-teal-500/40 to-cyan-500/40 text-teal-100 border-2 border-teal-300/60 shadow-xl shadow-teal-500/30',
                                'Wicket-keeper': 'bg-gradient-to-r from-rose-500/40 to-pink-500/40 text-rose-100 border-2 border-rose-300/60 shadow-xl shadow-rose-500/30'
                              };
                              roleBadgeColors = roleColorMap[player.role as keyof typeof roleColorMap] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                              roleLabel = player.role;
                            }
                            
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${roleBadgeColors}`}>
                                {/* Icon based on role type */}
                                {player.role === 'All-rounder' && player.allrounderType === 'Batting All-rounder' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                                {player.role === 'All-rounder' && player.allrounderType === 'Bowling All-rounder' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {player.role === 'All-rounder' && !player.allrounderType && (
                                  <Award className="w-3.5 h-3.5" />
                                )}
                                {player.role === 'Batsman' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                                {player.role === 'Bowler' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {player.role === 'Wicket-keeper' && (
                                  <Shield className="w-3.5 h-3.5" />
                                )}
                                <span className="font-extrabold">{roleLabel}</span>
                          </span>
                            );
                          })()}
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
                                : formatDateMonthDDYYYY(player.dateOfBirth)}
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
                              className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-100 rounded-xl transition-all duration-300 flex items-center gap-2 border border-blue-500/30 hover:border-blue-400/60 font-medium shadow-lg hover:shadow-blue-500/20 hover:scale-105 group/btn"
                            >
                              <Edit2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePlayer(player.id, player.name)}
                              className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 rounded-xl transition-all duration-300 flex items-center gap-2 border border-red-500/30 hover:border-red-400/60 font-medium shadow-lg hover:shadow-red-500/20 hover:scale-105 group/btn"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  ) : (
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
            contentClassName="max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-gray-700/50"
            footer={
              <div className="flex gap-4">
                <button
                  type="submit"
                  form="player-form"
                  className="flex-1 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white font-semibold py-3.5 px-8 rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2.5 group"
                >
                  {editingPlayer ? (
                    <>
                      <Edit2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Update Player</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Add Player</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-white/20 bg-slate-800/80 hover:bg-slate-700/90 hover:border-white/30 text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            }
          >
            <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Section Header - Enhanced */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center shadow-lg">
                          <User className="w-7 h-7 text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            Basic Information
                          </h3>
                          <p className="text-sm text-gray-300 mt-1">Enter player's personal details and team assignment</p>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info - Enhanced Card Layout */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                          Player Name
                            <span className="text-red-400">*</span>
                        </label>
                          <div className="relative">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                          placeholder="Enter player name"
                          required
                        />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                      </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-400" />
                          Role
                            <span className="text-red-400">*</span>
                        </label>
                          <CustomSelect
                          value={formData.role}
                            onChange={(newRole) => {
                            console.log('Role changed to:', newRole, 'Current allrounderType:', formData.allrounderType);
                            setFormData({
                              ...formData, 
                                role: newRole as any,
                              // Reset allrounderType if role is not All-rounder, otherwise keep it
                              allrounderType: newRole === 'All-rounder' ? (formData.allrounderType || '') : ''
                            });
                          }}
                            options={[
                              { value: 'Batsman', label: 'Batsman' },
                              { value: 'Bowler', label: 'Bowler' },
                              { value: 'All-rounder', label: 'All-rounder' },
                              { value: 'Wicket-keeper', label: 'Wicket-keeper' },
                            ]}
                            placeholder="Select role"
                            icon={<Award className="w-5 h-5" />}
                            iconColor="text-purple-400"
                            required
                          />
                      </div>

                      {formData.role === 'All-rounder' && (
                          <div className="group md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Target className="w-4 h-4 text-orange-400" />
                            All-rounder Type
                              <span className="text-red-400">*</span>
                          </label>
                            <CustomSelect
                            key={`allrounder-type-${editingPlayer?.id || 'new'}-${formData.allrounderType}`}
                            value={formData.allrounderType || ''}
                              onChange={(value) => {
                                console.log('All-rounder type changed to:', value, 'Current formData:', formData);
                                setFormData(prev => {
                                  const updated = {...prev, allrounderType: value as any};
                                  console.log('Updated formData:', updated);
                                  return updated;
                                });
                              }}
                              options={[
                                { value: 'Batting All-rounder', label: 'Batting All-rounder' },
                                { value: 'Bowling All-rounder', label: 'Bowling All-rounder' },
                              ]}
                              placeholder="Select type"
                              icon={<Target className="w-5 h-5" />}
                              iconColor="text-orange-400"
                            required
                            />
                        </div>
                      )}

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                          League
                            <span className="text-red-400">*</span>
                        </label>
                          <CustomSelect
                          value={formData.league}
                            onChange={(value) => setFormData({...formData, league: value as 'ipl' | 'wpl'})}
                            options={[
                              { value: 'ipl', label: 'IPL (Indian Premier League)' },
                              { value: 'wpl', label: 'WPL (Women\'s Premier League)' },
                            ]}
                            placeholder="Select league"
                            icon={<Shield className="w-5 h-5" />}
                            iconColor="text-emerald-400"
                          required
                          />
                      </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                          Team
                            <span className="text-red-400">*</span>
                        </label>
                          <CustomSelect
                          value={formData.teamId}
                            onChange={(value) => setFormData({...formData, teamId: value})}
                            options={teams
                              .filter(team => team.league === formData.league)
                              .map(team => ({
                                value: team.id,
                                label: team.name,
                              }))}
                            placeholder="Select a team"
                            icon={<Users className="w-5 h-5" />}
                            iconColor="text-cyan-400"
                          required
                            searchable
                          />
                        </div>
                      </div>
                      </div>

                    {/* Personal Details Section */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center shadow-lg">
                            <Calendar className="w-7 h-7 text-purple-300" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white">Personal Details</h3>
                            <p className="text-sm text-gray-300 mt-1">Player's age, date of birth, and nationality</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              Age
                              {(!formData.dateOfBirth || formData.dateOfBirth.trim() === '') && <span className="text-red-400">*</span>}
                        </label>
                            <div className="relative">
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
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                                placeholder="Enter age"
                          required={!formData.dateOfBirth || formData.dateOfBirth.trim() === ''}
                        />
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                          {(() => {
                            if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
                                  return (
                                    <>
                                      <span className="text-gray-500">💡</span>
                                      <span>Enter age manually or provide date of birth to auto-calculate</span>
                                    </>
                                  );
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
                              const calculatedAge = calculateAge(parsedDate);
                              if (calculatedAge > 0) {
                                    return (
                                      <>
                                        <span className="text-emerald-400">✓</span>
                                        <span className="text-emerald-300">Age automatically calculated: {calculatedAge} years (you can manually change if needed)</span>
                                      </>
                                    );
                              } else {
                                const testDate = new Date(parsedDate);
                                if (parsedDate.includes('NaN') || isNaN(testDate.getTime())) {
                                      return (
                                        <>
                                          <span className="text-yellow-400">⚠</span>
                                          <span className="text-yellow-300">Invalid date format. Please use Month DD, YYYY format.</span>
                                        </>
                                      );
                                    }
                                    return (
                                      <>
                                        <span className="text-yellow-400">⚠</span>
                                        <span className="text-yellow-300">Age calculation returned 0. Please check the date format.</span>
                                      </>
                                    );
                              }
                            } else {
                                  return (
                                    <>
                                      <span className="text-yellow-400">⚠</span>
                                      <span className="text-yellow-300">Invalid date format. Use Month DD, YYYY format (e.g., December 25, 1994)</span>
                                    </>
                                  );
                            }
                          })()}
                        </p>
                      </div>

                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-pink-400" />
                              Date of Birth
                              <span className="text-xs text-gray-400 font-normal">(Month DD, YYYY)</span>
                        </label>
                            <div className="relative">
                        <input
                          type="text"
                          value={formData.dateOfBirth}
                          onChange={(e) => {
                            setFormData({...formData, dateOfBirth: e.target.value});
                          }}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                          placeholder="December 25, 1994 (optional)"
                        />
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                          {(() => {
                            if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
                                  return (
                                    <>
                                      <span className="text-gray-500">💡</span>
                                      <span>Optional: If provided, age will be automatically calculated</span>
                                    </>
                                  );
                            }
                            
                            // Try to parse the date - always use Month DD, YYYY format
                            const parsedDate = parseDateMonthDDYYYY(formData.dateOfBirth);
                            
                            if (parsedDate) {
                              const calculatedAge = calculateAge(parsedDate);
                              if (calculatedAge > 0) {
                                    return (
                                      <>
                                        <span className="text-emerald-400">✓</span>
                                        <span className="text-emerald-300">Valid date. Age: {calculatedAge} years</span>
                                      </>
                                    );
                              } else {
                                const testDate = new Date(parsedDate);
                                if (isNaN(testDate.getTime())) {
                                      return (
                                        <>
                                          <span className="text-yellow-400">⚠</span>
                                          <span className="text-yellow-300">Date parsing issue. Parsed: {parsedDate}</span>
                                        </>
                                      );
                                }
                                const today = new Date();
                                if (testDate > today) {
                                      return (
                                        <>
                                          <span className="text-yellow-400">⚠</span>
                                          <span className="text-yellow-300">Date is in the future. Please check the date.</span>
                                        </>
                                      );
                                    }
                                    return (
                                      <>
                                        <span className="text-yellow-400">⚠</span>
                                        <span className="text-yellow-300">Age calculation returned 0. Parsed date: {parsedDate}</span>
                                      </>
                                    );
                              }
                            } else {
                                  return (
                                    <>
                                      <span className="text-yellow-400">⚠</span>
                                      <span className="text-yellow-300">Invalid format. Use {currentLeague === 'wpl' ? 'Month DD, YYYY' : 'DD/MM/YYYY'} (e.g., {currentLeague === 'wpl' ? 'December 25, 1994' : '25/12/1994'})</span>
                                    </>
                                  );
                            }
                          })()}
                        </p>
                      </div>

                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <FlagImage nationality={formData.nationality || 'India'} size="sm" />
                          Nationality
                              <span className="text-red-400">*</span>
                        </label>
                            <CustomSelect
                          value={formData.nationality}
                              onChange={(value) => setFormData({ ...formData, nationality: value })}
                              options={CRICKET_COUNTRIES.map((country) => ({
                                value: country,
                                label: country,
                                icon: <FlagImage nationality={country} size="sm" />,
                              }))}
                              placeholder="Select nationality"
                              icon={<FlagImage nationality={formData.nationality || 'India'} size="sm" />}
                              iconColor="text-orange-400"
                          required
                              searchable
                            />
                          </div>
                        </div>
                      </div>
                      </div>

                    {/* Player Details Section */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center shadow-lg">
                            <Shirt className="w-7 h-7 text-cyan-300" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white">Player Details</h3>
                            <p className="text-sm text-gray-300 mt-1">Jersey number, playing styles, and captain status</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Hash className="w-4 h-4 text-cyan-400" />
                          Jersey Number
                        </label>
                        <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                          <input
                            type="number"
                            value={formData.jerseyNumber}
                            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                                  placeholder="Enter jersey number"
                          />
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                              </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, jerseyNumber: '' })}
                                className="px-4 py-3.5 rounded-xl text-sm font-semibold border-2 border-white/20 bg-gray-800/60 text-gray-200 hover:bg-gray-700/80 hover:border-white/30 transition-all"
                          >
                            N/A
                          </button>
                        </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                              <span className="text-gray-500">💡</span>
                              <span>Use N/A if a jersey number is not assigned yet</span>
                            </p>
                      </div>

                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-blue-400" />
                          Bowling Style
                        </label>
                            <CustomSelect
                          value={formData.bowlingStyle}
                              onChange={(value) => setFormData({ ...formData, bowlingStyle: value })}
                              options={BOWLING_STYLES.map((style) => ({
                                value: style,
                                label: style,
                              }))}
                              placeholder="Select bowling style"
                              icon={<Zap className="w-5 h-5" />}
                              iconColor="text-blue-400"
                              searchable
                            />
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                              <span className="text-gray-500">💡</span>
                              <span>If the exact style is not in the list, enter a custom bowling style below</span>
                            </p>
                            <div className="relative mt-3">
                        <input
                          type="text"
                          value={formData.customBowlingStyle}
                          onChange={(e) => setFormData({ ...formData, customBowlingStyle: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:border-white/20"
                          placeholder="Custom bowling style (optional)"
                        />
                              <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                      </div>

                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-indigo-400" />
                          Batting Style
                        </label>
                            <CustomSelect
                          value={formData.battingStyle}
                              onChange={(value) => setFormData({ ...formData, battingStyle: value })}
                              options={BATTING_STYLES.map((style) => ({
                                value: style,
                                label: style,
                              }))}
                              placeholder="Select batting style"
                              icon={<Activity className="w-5 h-5" />}
                              iconColor="text-indigo-400"
                              searchable
                            />
                      </div>

                          <div className="group md:col-span-2">
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border-2 border-yellow-500/20 hover:border-yellow-500/30 transition-all">
                        <input
                          type="checkbox"
                          id="player-isCaptain"
                          checked={formData.isCaptain}
                          onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                                className="w-5 h-5 rounded bg-gray-800/60 border-2 border-white/20 text-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 cursor-pointer transition-all"
                        />
                              <label htmlFor="player-isCaptain" className="flex items-center gap-2 text-sm font-semibold text-gray-200 cursor-pointer">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <span>Is Captain</span>
                        </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>

                    {/* Transfer / Auction Info Section */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-7 h-7 text-amber-300" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white">Transfer / Auction Info</h3>
                            <p className="text-sm text-gray-300 mt-1">Player acquisition details and transfer information</p>
                          </div>
                        </div>
                        {/* Determine if player is auction-locked for CURRENT_SEASON */}
                        {(() => {
                          const isAuctionLocked = typeof formData.lastAuctionYear !== 'undefined' &&
                            formData.lastAuctionYear === 2026 &&
                            formData.acquiredVia === 'auction' &&
                            CURRENT_SEASON === 2027;
                          return (
                            <>
                              {isAuctionLocked && (
                                <div className="mb-4 p-4 bg-yellow-500/20 border-2 border-yellow-500/30 rounded-xl flex items-center gap-3">
                                  <span className="text-2xl">⚠️</span>
                                  <p className="text-sm text-yellow-200 font-medium">Players bought at the IPL 2026 auction cannot be traded for the 2027 season (auction-locked).</p>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="group">
                                  <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-400" />
                                    Last Auction Year
                                  </label>
                                  <div className="relative">
                                  <input
                                    type="number"
                                    value={formData.lastAuctionYear ?? ''}
                                    onChange={(e) => setFormData({ ...formData, lastAuctionYear: e.target.value ? Number(e.target.value) : undefined })}
                                      className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                                    placeholder="e.g., 2026"
                                  />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                                </div>
                                <div className="group">
                                  <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                                    Acquired Via
                                  </label>
                                  <CustomSelect
                                    value={formData.acquiredVia}
                                    onChange={(value) => setFormData({ ...formData, acquiredVia: value as any })}
                                    options={[
                                      { value: 'auction', label: 'Auction' },
                                      { value: 'retention', label: 'Retention' },
                                      { value: 'trade', label: 'Trade' },
                                      { value: 'swap', label: 'Swap' },
                                      { value: 'transfer', label: 'Transfer' },
                                    ]}
                                    placeholder="Select acquisition method"
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    iconColor="text-yellow-400"
                                  />
                                </div>
                                <div className="group">
                                  <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-orange-400" />
                                    Transferable
                                  </label>
                                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border-2 border-orange-500/20 hover:border-orange-500/30 transition-all">
                                  <input
                                    type="checkbox"
                                    checked={!!formData.transferable}
                                    onChange={(e) => setFormData({ ...formData, transferable: e.target.checked })}
                                    disabled={typeof formData.lastAuctionYear !== 'undefined' && formData.lastAuctionYear === 2026 && formData.acquiredVia === 'auction' && CURRENT_SEASON === 2027}
                                      className="w-5 h-5 rounded bg-gray-800/60 border-2 border-white/20 text-orange-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                    <span className="text-sm font-semibold text-gray-200">Allow Transfer</span>
                                </div>
                                </div>
                                <div className="group md:col-span-2">
                                  <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-amber-400" />
                                    Transfer Fee
                                  </label>
                                  <div className="relative">
                                  <input
                                    type="text"
                                    value={formData.transferFee ?? ''}
                                    onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                                      className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                                    placeholder="Optional cash deal value"
                                  />
                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                                </div>
                                <div className="group md:col-span-3">
                                  <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-yellow-400" />
                                    Notes
                                  </label>
                                  <div className="relative">
                                  <input
                                    type="text"
                                    value={formData.transferNotes ?? ''}
                                    onChange={(e) => setFormData({ ...formData, transferNotes: e.target.value })}
                                      className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                                    placeholder="E.g., Confirmed trade, cash deal details"
                                  />
                                    <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Stats - Only show for IPL */}
                    {formData.league !== 'wpl' && (
                      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50"></div>
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center shadow-lg">
                              <BarChart3 className="w-7 h-7 text-emerald-300" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white">Player Statistics</h3>
                              <p className="text-sm text-gray-300 mt-1">Performance metrics and career statistics</p>
                            </div>
                          </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-400" />
                            Matches
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.matches}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, matches: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Matches"
                          />
                                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            Runs
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.runs}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, runs: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Runs"
                          />
                                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Target className="w-4 h-4 text-teal-400" />
                            Wickets
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.wickets}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, wickets: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Wickets"
                          />
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-cyan-400" />
                            Batting Average
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.average}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, average: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="e.g., 45.67"
                          />
                                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Target className="w-4 h-4 text-teal-400" />
                            Bowling Average
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.bowlingAverage}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bowlingAverage: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="e.g., 25.50"
                          />
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                              <p className="text-xs text-gray-400 mt-2">Runs conceded per wicket</p>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-cyan-400" />
                            Strike Rate
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.strikeRate}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, strikeRate: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="e.g., 145.50"
                          />
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-teal-400" />
                            Economy
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.economy}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, economy: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="e.g., 8.50"
                          />
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-400" />
                            Highest Score
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.highest}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, highest: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Highest Score"
                          />
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-cyan-400" />
                            Fours
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.fours}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fours: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Fours"
                          />
                                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-teal-400" />
                            Sixes
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.sixes}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, sixes: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Sixes"
                          />
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-400" />
                            Fifties (50s)
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.fifties}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fifties: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Fifties"
                          />
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Star className="w-4 h-4 text-cyan-400" />
                            Hundreds (100s)
                          </label>
                              <div className="relative">
                          <input
                            type="number"
                            value={formData.stats.hundreds}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, hundreds: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="Hundreds"
                          />
                                <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                            </div>
                            <div className="group md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
                                <Target className="w-4 h-4 text-teal-400" />
                            Best Bowling (BBM)
                          </label>
                              <div className="relative">
                          <input
                            type="text"
                            value={formData.stats.bestBowling}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bestBowling: e.target.value}})}
                                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/60 border-2 border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all hover:border-white/20 group-hover:bg-gray-800/70"
                            placeholder="e.g., 4/21 or 3/45"
                          />
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
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


