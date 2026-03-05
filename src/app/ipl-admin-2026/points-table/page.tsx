'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Trophy, TrendingUp, TrendingDown, Info, Award, Users, Calendar, Clock, Search, X, Edit, Save, RefreshCw, Download, FileText, Table, Database } from 'lucide-react';
import { api } from '@/lib/data';
import { Team } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GradientText from '@/components/ui/GradientText';
import {
  exportPointsTableToCSV,
  exportPointsTableToExcel,
  exportPointsTableToPDF,
  exportPointsTableToDatabase,
  exportPointsTableAllFormats,
  type PointsTableExportData,
  validateExportData,
  getExportStatistics
} from './points-table-export';

// IPL Teams by Season - mapped to the CURRENT IPL team IDs returned by `/api/teams`
// Team IDs (from `functions/api/teams.js`):
// 1=RCB, 2=MI, 3=SRH, 4=GT, 5=PBKS, 6=DC, 7=LSG, 8=RR, 9=KKR, 10=CSK
//
// Note: historical franchises (Kochi, Pune, Gujarat Lions, RPS) are not present in the current Teams API,
// so for now season-specific tables vary by showing/hiding current franchises (8-team era vs 10-team era).
const IPL_TEAMS_BY_SEASON: Record<number, string[]> = {
  // 8-team era (use SRH slot as Deccan/SRH continuity)
  2008: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2009: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2010: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2011: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2012: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2013: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2014: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2015: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2016: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2017: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2018: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2019: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2020: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2021: ['1', '2', '3', '5', '6', '8', '9', '10'],

  // 10-team era (adds GT + LSG)
  2022: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2023: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2024: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2025: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2026: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

const IPL_STORAGE_KEY = 'iplPointsTableStats';

export default function IPLAdminPointsTablePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'losses' | 'nrr'>('points');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch IPL teams
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const teamsData = await api.getTeams('ipl');
        setTeams(teamsData || []);
      } catch {
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate available years (2008 to current year for IPL)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 2008; year <= currentYear; year++) {
      years.push(year);
    }
    setAvailableYears(years);
    setSelectedYear(currentYear);
  }, []);

  // Force re-render when year changes to reload data
  useEffect(() => {
    // This will trigger the pointsTable useMemo to recalculate with new year
  }, [selectedYear]);

  // Calculate dropdown position relative to button
  const updateDropdownPosition = () => {
    if (exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 224 // 224 is dropdown width
      });
    }
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as Element;
        if (!target.closest('.export-menu-container')) {
          setShowExportMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Calculate points table - filter teams by selected year first, then use year-based localStorage
  const pointsTable = useMemo(() => {
    // Get teams for the selected season
    const seasonTeamIds = IPL_TEAMS_BY_SEASON[selectedYear] || [];
    const seasonTeams = teams.filter((team) => seasonTeamIds.includes(team.id));

    type SavedRow = {
      matchesPlayed?: number;
      wins?: number;
      losses?: number;
      noResult?: number;
      points?: number;
      netRunRate?: number;
      qualified?: boolean;
    };

    let savedStats: Record<string, SavedRow> = {};
    if (typeof window !== 'undefined') {
      try {
        // Get ALL years' stats from localStorage
        const allStats = JSON.parse(localStorage.getItem(IPL_STORAGE_KEY) || '{}') || {};

        // Ensure we have a proper year-based structure
        if (!allStats[selectedYear] || typeof allStats[selectedYear] !== 'object') {
          // Initialize this year's data if it doesn't exist
          allStats[selectedYear] = {};
          localStorage.setItem(IPL_STORAGE_KEY, JSON.stringify(allStats));
        }

        // Get stats for the current year only
        savedStats = (allStats[selectedYear] as Record<string, SavedRow>) || {};
      } catch {
        /* ignore */
      }
    }

    return seasonTeams.map((team) => {
      const displayShortName = team.shortName || team.name.split(' ').map((w) => w[0]).join('');
      const displayName = team.name || '';
      const row = savedStats[team.id] || {};

      return {
        ...team,
        shortName: displayShortName,
        name: displayName,
        matchesPlayed: row.matchesPlayed ?? null,
        wins: row.wins ?? null,
        losses: row.losses ?? null,
        noResult: row.noResult ?? null,
        points: row.points ?? null,
        netRunRate: row.netRunRate ?? null,
        qualified: row.qualified ?? false,
      };
    });
  }, [teams, selectedYear]);

  const sortedPointsTable = useMemo(() => {
    let result = [...pointsTable];

    if (searchTerm) {
      const n = searchTerm.trim().toLowerCase();
      result = result.filter(team =>
        team.name.toLowerCase().includes(n) ||
        (team.shortName || '').toLowerCase().includes(n)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'points') {
        const aPoints = a.points ?? 0;
        const bPoints = b.points ?? 0;
        if (bPoints !== aPoints) return bPoints - aPoints;
        const aNrr = a.netRunRate ?? 0;
        const bNrr = b.netRunRate ?? 0;
        return bNrr - aNrr;
      }
      if (sortBy === 'wins') {
        const aWins = a.wins ?? 0;
        const bWins = b.wins ?? 0;
        return bWins - aWins;
      }
      if (sortBy === 'losses') {
        const aLosses = a.losses ?? 0;
        const bLosses = b.losses ?? 0;
        return aLosses - bLosses;
      }
      if (sortBy === 'nrr') {
        const aNrr = a.netRunRate ?? 0;
        const bNrr = b.netRunRate ?? 0;
        return bNrr - aNrr;
      }
      return 0;
    });

    return result;
  }, [pointsTable, searchTerm, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('points');
  };

  const handleEdit = (teamId: string) => {
    const team = pointsTable.find(t => t.id === teamId);
    if (team) {
      setEditingTeam(teamId);
      setEditData({
        matchesPlayed: team.matchesPlayed,
        wins: team.wins,
        losses: team.losses,
        noResult: (team as any).noResult ?? 0,
        points: team.points,
        netRunRate: team.netRunRate
      });
    }
  };

  const handleToggleQualified = async (teamId: string, qualified: boolean) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) return;

      const teamToUpdate = teams.find(t => t.id === teamId);
      if (!teamToUpdate) return;

      const updated = {
        ...teamToUpdate,
        stats: { ...(teamToUpdate.stats as object || {}), qualified }
      };

      // Save to localStorage for current year
      const allSavedStats = JSON.parse(localStorage.getItem(IPL_STORAGE_KEY) || '{}');
      if (!allSavedStats[selectedYear]) {
        allSavedStats[selectedYear] = {};
      }
      if (!allSavedStats[selectedYear][teamId]) {
        allSavedStats[selectedYear][teamId] = {};
      }
      allSavedStats[selectedYear][teamId].qualified = qualified;
      localStorage.setItem(IPL_STORAGE_KEY, JSON.stringify(allSavedStats));

      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${base}/api/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(teams.map(t => t.id === teamId ? updatedTeam : t));
      }
    } catch {
      /* ignore */
    }
  };

  const handleSave = async (teamId: string) => {
    try {
      const dataToSave = {
        ...editData,
        netRunRate: parseFloat(String(editData.netRunRate)) || 0
      };

      const teamToUpdate = teams.find(t => t.id === teamId);
      if (!teamToUpdate) return;

      const updatedTeam = {
        ...teamToUpdate,
        stats: {
          matchesPlayed: Number(dataToSave.matchesPlayed) || 0,
          wins: Number(dataToSave.wins) || 0,
          losses: Number(dataToSave.losses) || 0,
          noResult: Number((dataToSave as { noResult?: number }).noResult) || 0,
          points: Number(dataToSave.points) || 0,
          netRunRate: Number(dataToSave.netRunRate) || 0,
          qualified: Boolean((dataToSave as { qualified?: boolean }).qualified)
        }
      };

      setTeams(teams.map(t => t.id === teamId ? updatedTeam : t));

      const allSavedStats = JSON.parse(localStorage.getItem(IPL_STORAGE_KEY) || '{}');
      
      // Ensure year-based structure exists
      if (!allSavedStats[selectedYear]) {
        allSavedStats[selectedYear] = {};
      }
      
      allSavedStats[selectedYear][teamId] = updatedTeam.stats;
      localStorage.setItem(IPL_STORAGE_KEY, JSON.stringify(allSavedStats));

      setEditingTeam(null);
      setEditData({});

      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (token) {
        try {
          const base = typeof window !== 'undefined' ? window.location.origin : '';
          await fetch(`${base}/api/teams`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id: teamId, ...teamToUpdate, stats: updatedTeam.stats })
          });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  };

  const handleCancel = () => {
    setEditingTeam(null);
    setEditData({});
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const teamsData = await api.getTeams('ipl');
      setTeams(teamsData || []);
    } catch {
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Export functions
  const prepareExportData = (): PointsTableExportData => {
    return {
      teams: sortedPointsTable.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName || team.name,
        matchesPlayed: team.matchesPlayed,
        wins: team.wins,
        losses: team.losses,
        noResult: (team as any).noResult || 0,
        points: team.points,
        netRunRate: team.netRunRate,
        qualified: team.qualified,
        logo: team.logo
      })),
      year: selectedYear,
      filtered: !!searchTerm,
      searchTerm: searchTerm || undefined,
      sortBy: sortBy
    };
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'database' | 'all') => {
    setIsExporting(true);
    try {
      const exportData = prepareExportData();
      
      console.log('Export data:', exportData); // Debug log
      
      if (!validateExportData(exportData)) {
        console.log('Export data validation failed'); // Debug log
        alert('Invalid export data');
        return;
      }

      console.log('Export data validation passed'); // Debug log
      console.log('Export format:', format); // Debug log

      switch (format) {
        case 'csv':
          console.log('Calling CSV export'); // Debug log
          exportPointsTableToCSV(exportData);
          break;
        case 'excel':
          console.log('Calling Excel export'); // Debug log
          await exportPointsTableToExcel(exportData);
          break;
        case 'pdf':
          console.log('Calling PDF export'); // Debug log
          await exportPointsTableToPDF(exportData);
          break;
        case 'database':
          console.log('Calling Database export'); // Debug log
          exportPointsTableToDatabase(exportData);
          break;
        case 'all':
          console.log('Calling All exports'); // Debug log
          exportPointsTableToCSV(exportData);
          await exportPointsTableToExcel(exportData);
          await exportPointsTableToPDF(exportData);
          exportPointsTableToDatabase(exportData);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const getExportStats = () => {
    const exportData = prepareExportData();
    return getExportStatistics(exportData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-900 to-black">
      <main className="flex-1 relative z-10">
        <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 backdrop-blur-2xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                <GradientText gradient="from-amber-400 via-orange-400 to-amber-400">
                  IPL Points Table Admin
                </GradientText>
              </h1>
              <p className="text-gray-300">Manage IPL championship standings</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={refreshData}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              
              {/* Export Button */}
              <div className="relative export-menu-container" style={{ zIndex: 9999999999 }}>
                <button
                  type="button"
                  ref={exportButtonRef}
                  onClick={() => {
                    updateDropdownPosition();
                    setShowExportMenu(!showExportMenu);
                  }}
                  disabled={isExporting || sortedPointsTable.length === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
                
                {/* Export Dropdown */}
                {showExportMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      transform: 'translateX(-50%)',
                      zIndex: 9999999999,
                      backgroundColor: '#1e293b',
                      border: '2px solid #374151',
                      borderRadius: '12px',
                      padding: '8px',
                      minWidth: '224px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>
                      Export Format
                    </div>
                    
                    <button
                      onClick={() => {
                        handleExport('csv');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#059669',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: '#fbbf24' }}>📄</span>
                      CSV Format
                    </button>
                    
                    <button
                      onClick={() => {
                        handleExport('excel');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#107c10',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: '#fbbf24' }}>📊</span>
                      Excel Format
                    </button>
                    
                    <button
                      onClick={() => {
                        handleExport('pdf');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: '#fbbf24' }}>📑</span>
                      PDF Format
                    </button>
                    
                    <button
                      onClick={() => {
                        handleExport('database');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: '#fbbf24' }}>🗄️</span>
                      Database Format
                    </button>
                    
                    <button
                      onClick={() => {
                        handleExport('all');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#6f42c1',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: '#fbbf24' }}>📦</span>
                      All Formats
                    </button>
                  </div>
                )}
              </div>
              
              <motion.button
                onClick={() => {
                  if (confirm(`Clear all points table data for ${selectedYear}? This cannot be undone.`)) {
                    const allStats = JSON.parse(localStorage.getItem(IPL_STORAGE_KEY) || '{}');
                    if (allStats[selectedYear]) {
                      delete allStats[selectedYear];
                      localStorage.setItem(IPL_STORAGE_KEY, JSON.stringify(allStats));
                      refreshData();
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
                Clear {selectedYear}
              </motion.button>
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  isEditing
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-amber-500 text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Save All' : 'Edit Mode'}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <motion.div
            className="relative rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-2xl overflow-hidden mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10 p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-bold uppercase tracking-wider text-gray-300 mb-2">Season Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-slate-800/60 border-2 border-white/15 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all text-lg font-medium"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative mb-6 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search IPL teams..."
                  className="w-full pl-16 pr-14 py-4 rounded-2xl bg-slate-800/60 border-2 border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all text-lg font-medium"
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'points' | 'wins' | 'losses' | 'nrr')}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                  >
                    <option value="points">Points (High to Low)</option>
                    <option value="wins">Wins (Most first)</option>
                    <option value="losses">Losses (Least first)</option>
                    <option value="nrr">Net Run Rate</option>
                  </select>
                </div>
                {searchTerm && (
                  <motion.button
                    onClick={clearFilters}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-300 border-2 border-amber-500/50 hover:from-amber-500/30 hover:to-orange-600/30 transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </motion.button>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                <span className="text-sm text-gray-400">
                  Showing <span className="font-black text-white text-lg">{sortedPointsTable.length}</span> of <span className="font-black text-white text-lg">{(IPL_TEAMS_BY_SEASON[selectedYear] || []).length}</span> IPL teams for Season {selectedYear}
                </span>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Season {selectedYear}
                  </span>
                  {searchTerm && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Filtered
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <motion.div className="text-center py-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 text-xl mt-8">Loading IPL points table...</p>
            </motion.div>
          ) : sortedPointsTable.length === 0 ? (
            <motion.div className="text-center py-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Trophy className="w-20 h-20 text-gray-400 mx-auto mb-8" />
              <h3 className="text-4xl font-black text-white mb-4">No IPL teams found</h3>
              <p className="text-gray-400 text-xl mb-10">
                {searchTerm ? `No teams match "${searchTerm}"` : 'No IPL teams in database'}
              </p>
              <motion.button
                onClick={clearFilters}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg flex items-center gap-3 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
                Clear filters
              </motion.button>
            </motion.div>
          ) : (
            <motion.div className="space-y-4" initial="hidden" animate="visible">
              <div className="grid grid-cols-[40px_200px_1fr_90px_80px_80px_80px_80px_100px_120px_140px] gap-4 px-6 py-4 rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 text-sm font-bold uppercase tracking-wider text-gray-300 max-w-full overflow-x-auto">
                <div className="flex items-center justify-center">Rank</div>
                <div className="flex items-center gap-2">Team <Info className="w-4 h-4 text-gray-500" /></div>
                <div>Name</div>
                <div>Played</div>
                <div>Wins</div>
                <div>Losses</div>
                <div className="text-center">NR</div>
                <div>Points</div>
                <div>NRR</div>
                <div className="flex justify-center">Qualified</div>
                <div className="flex justify-center">Actions</div>
              </div>

              <AnimatePresence mode="popLayout">
                {sortedPointsTable.map((team, index) => {
                  const rank = index + 1;
                  const isTop4 = rank <= 4;
                  const isBottom2 = rank >= sortedPointsTable.length - 1;
                  const isCurrentlyEditing = editingTeam === team.id;
                  const nrr = team.netRunRate ?? null;

                  return (
                    <motion.div
                      key={team.id}
                      layout
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`relative group grid grid-cols-[40px_200px_1fr_90px_80px_80px_80px_80px_100px_120px_140px] gap-4 items-center px-6 py-5 rounded-3xl backdrop-blur-2xl border-2 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 max-w-full overflow-x-auto ${
                        isTop4 ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/30 via-orange-800/20 to-amber-900/30' :
                        isBottom2 ? 'border-orange-500/50 bg-gradient-to-br from-orange-900/30 via-amber-800/20 to-orange-900/30' :
                        'hover:border-amber-500/50'
                      }`}
                    >
                      <div className={`flex justify-center text-2xl font-black ${isTop4 ? 'text-amber-400' : isBottom2 ? 'text-orange-400' : 'text-white'}`}>
                        {rank}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg overflow-hidden">
                          <img 
                            src={team.logo} 
                            alt={team.shortName || team.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to text if logo fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center text-white font-black text-lg">
                            {(team.shortName || 'IPL').slice(0, 2)}
                          </div>
                        </div>
                        <span className="text-xl font-black text-white">{team.shortName || team.name}</span>
                      </div>

                      <div className="text-white font-semibold truncate">{team.name}</div>

                      <div className="text-white font-bold">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.matchesPlayed ?? ''}
                            onChange={(e) => setEditData({ ...editData, matchesPlayed: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 px-2 py-1 bg-slate-700 border border-amber-500 rounded text-center"
                            min={0}
                          />
                        ) : (
                          team.matchesPlayed !== null ? team.matchesPlayed : ''
                        )}
                      </div>

                      <div className="text-green-400 font-bold flex items-center gap-1">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.wins ?? ''}
                            onChange={(e) => setEditData({ ...editData, wins: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 px-2 py-1 bg-slate-700 border border-green-500 rounded text-center"
                            min={0}
                          />
                        ) : (
                          team.wins !== null ? (
                            <>
                              <TrendingUp className="w-4 h-4" />
                              {team.wins}
                            </>
                          ) : ''
                        )}
                      </div>

                      <div className="text-red-400 font-bold flex items-center gap-1">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.losses ?? ''}
                            onChange={(e) => setEditData({ ...editData, losses: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 px-2 py-1 bg-slate-700 border border-red-500 rounded text-center"
                            min={0}
                          />
                        ) : (
                          team.losses !== null ? (
                            <>
                              <TrendingDown className="w-4 h-4" />
                              {team.losses}
                            </>
                          ) : ''
                        )}
                      </div>

                      <div className="text-blue-300 font-bold">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.noResult ?? ''}
                            onChange={(e) => setEditData({ ...editData, noResult: parseInt(e.target.value, 10) || 0 })}
                            className="w-16 px-2 py-1 bg-slate-700 border border-blue-500 rounded text-center"
                            min={0}
                          />
                        ) : (
                          (team as any).noResult !== null && (team as any).noResult !== undefined ? (team as any).noResult : ''
                        )}
                      </div>

                      <div className="text-amber-400 font-black text-xl">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.points ?? ''}
                            onChange={(e) => setEditData({ ...editData, points: parseInt(e.target.value, 10) || 0 })}
                            className="w-20 px-2 py-1 bg-slate-700 border border-amber-500 rounded text-center font-black"
                            min={0}
                          />
                        ) : (
                          team.points !== null ? team.points : ''
                        )}
                      </div>

                      <div className={`font-bold ${nrr > 0 ? 'text-green-400' : nrr < 0 ? 'text-red-400' : 'text-white'}`}>
                        {isCurrentlyEditing ? (
                          <input
                            type="text"
                            value={editData.netRunRate ?? ''}
                            onChange={(e) => setEditData({ ...editData, netRunRate: e.target.value })}
                            className="w-20 px-2 py-1 bg-slate-700 border border-white rounded text-center"
                            placeholder="0.00"
                          />
                        ) : (
                          nrr !== null ? (nrr > 0 ? `+${nrr.toFixed(2)}` : nrr.toFixed(2)) : '-'
                        )}
                      </div>

                      <div className="flex justify-center">
                        {isCurrentlyEditing ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean((editData as { qualified?: boolean }).qualified)}
                              onChange={(e) => setEditData({ ...editData, qualified: e.target.checked })}
                              className="w-5 h-5 rounded text-amber-500"
                            />
                            <span className="text-sm text-gray-300">Qualified</span>
                          </label>
                        ) : (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(team.qualified)}
                              onChange={(e) => handleToggleQualified(team.id, e.target.checked)}
                              className="w-5 h-5 rounded text-amber-500"
                            />
                          </label>
                        )}
                      </div>

                      <div className="flex justify-center gap-2">
                        {isCurrentlyEditing ? (
                          <>
                            <motion.button
                              onClick={() => handleSave(team.id)}
                              className="p-2 rounded-full bg-green-500 text-white"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Save className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={handleCancel}
                              className="p-2 rounded-full bg-red-500 text-white"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            onClick={() => handleEdit(team.id)}
                            disabled={!isEditing}
                            className={`p-2 rounded-full transition-all ${
                              isEditing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                            }`}
                            whileHover={isEditing ? { scale: 1.2 } : {}}
                            whileTap={isEditing ? { scale: 0.9 } : {}}
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { label: 'IPL Teams', value: (IPL_TEAMS_BY_SEASON[selectedYear] || []).length, icon: Users, color: 'from-amber-500 to-orange-500' },
              { label: 'Total Points', value: pointsTable.reduce((sum, t) => sum + (t.points ?? 0), 0), icon: Award, color: 'from-orange-500 to-amber-500' },
              { label: 'Season', value: selectedYear, icon: Calendar, color: 'from-amber-500 to-orange-500' },
              { label: 'Showing', value: sortedPointsTable.length, icon: Clock, color: 'from-orange-500 to-amber-500' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-6"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-black mb-2 text-white">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      
      {/* Export Dropdown at End of Page */}
      {showExportMenu && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 999999999
          }}
          className="w-56 rounded-2xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 shadow-2xl overflow-hidden"
        >
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10 mb-2">
              Export Format
            </div>
            
            <button
              onClick={() => {
                console.log('CSV button clicked'); // Debug log
                alert('CSV export clicked!'); // Test alert
                handleExport('csv');
              }}
              className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium text-white hover:bg-amber-500/20 flex items-center gap-3 transition-all"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              CSV Format
              <span className="ml-auto text-xs text-gray-400">.csv</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
