'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, CheckCircle2, Users, TrendingUp, CheckSquare, Square, BarChart3, Calendar as CalendarIcon, MapPin, Grid3x3, Copy, ExternalLink } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { PageTransition, StaggeredList, SkeletonLoader, LoadingSpinner } from '@/components/admin/animations';
import { EmptyStateIllustration, AnimatedStatusIcon, StatusBadge } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import BulkOperationsToolbar from '@/components/admin/BulkOperationsToolbar';
import BulkEditModal from '@/components/admin/BulkEditModal';
import BatchDeleteModal from '@/components/admin/BatchDeleteModal';
import InteractiveChart, { ChartDataPoint } from '@/components/admin/InteractiveChart';
import { 
    exportToCSV, 
    exportToJSON, 
    exportToExcel, 
    exportToICal,
    exportToGoogleCalendar,
    exportToOutlookCalendar,
    generateICalFeedUrl,
    copyICalFeedUrl,
    CalendarEvent,
    prepareExportData, 
    formatDateForExport 
} from '@/lib/admin/exportUtils';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';

const IconTable = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const IconTimeline = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const IconPlus = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconX = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Official IPL Venues
const IPL_VENUES = [
    'Wankhede Stadium, Mumbai',
    'M. A. Chidambaram Stadium, Chennai',
    'M. Chinnaswamy Stadium, Bengaluru',
    'Eden Gardens, Kolkata',
    'Arun Jaitley Stadium, Delhi',
    'Sawai Mansingh Stadium, Jaipur',
    'Narendra Modi Stadium, Ahmedabad',
    'Rajiv Gandhi International Stadium, Hyderabad',
    'Punjab Cricket Association Stadium, Mohali',
    'Himachal Pradesh Cricket Association Stadium, Dharamsala',
    'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam',
    'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
    'Maharashtra Cricket Association Stadium, Pune',
    'Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur',
    'Barsapara Cricket Stadium, Guwahati',
    'Holkar Cricket Stadium, Indore',
    'JSCA International Stadium Complex, Ranchi',
    'Green Park, Kanpur',
    'Barabati Stadium, Cuttack',
    'ACA Stadium, Barsapara'
];

export default function AdminMatches() {
    const router = useRouter();
    const { currentLeague } = useLeague();
    const { toasts, success: showSuccess, error: showError, closeToast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'timeline' | 'analytics'>('table');
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formStep, setFormStep] = useState(1);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const [venueSearchQuery, setVenueSearchQuery] = useState('');
    const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        team: 'all',
        venue: 'all'
    });

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        venue: '',
        team1Id: '',
        team2Id: '',
        status: 'upcoming' as 'upcoming' | 'live' | 'completed' | 'cancelled',
        league: 'ipl' as 'ipl' | 'wpl' // Will be set from currentLeague when adding
    });

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    router.push('/ipl-admin-2026');
                    return;
                }
                setIsAuthenticated(true);
                fetchInitialData();
            } catch (error) {
                router.push('/ipl-admin-2026');
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    // Clear selection when filters change
    useEffect(() => {
        setSelectedMatches(new Set());
    }, [filters]);

    // Use ref to store current matches to avoid dependency issues
    const matchesRef = useRef<Match[]>([]);
    useEffect(() => {
        matchesRef.current = matches;
    }, [matches]);

    // Automatic status update based on match time
    useEffect(() => {
        const updateMatchStatuses = async () => {
            const currentMatches = matchesRef.current;
            const now = new Date();
            const updates: { matchId: string; newStatus: 'upcoming' | 'live' }[] = [];

            currentMatches.forEach(match => {
                // Skip if match is already completed or cancelled (manual status)
                if (match.status === 'completed' || match.status === 'cancelled') {
                    return;
                }

                try {
                    const [hours, minutes] = match.time.split(':').map(Number);
                    const matchDate = new Date(match.date);
                    matchDate.setHours(hours, minutes || 0, 0, 0);
                    
                    // Calculate 30 minutes before match
                    const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                    
                    // If current time is 30 minutes before match or later, and match hasn't started yet (within 4 hours)
                    const fourHoursAfter = new Date(matchDate.getTime() + 4 * 60 * 60 * 1000);
                    
                    if (now >= thirtyMinutesBefore && now <= fourHoursAfter) {
                        // Should be live
                        if (match.status !== 'live') {
                            updates.push({ matchId: match.id, newStatus: 'live' });
                        }
                    } else if (now < thirtyMinutesBefore) {
                        // Should be upcoming
                        if (match.status !== 'upcoming') {
                            updates.push({ matchId: match.id, newStatus: 'upcoming' });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing match ${match.id}:`, error);
                }
            });

            // Apply updates
            if (updates.length > 0) {
                try {
                    const updatePromises = updates.map(({ matchId, newStatus }) => {
                        const match = currentMatches.find(m => m.id === matchId);
                        if (!match) return Promise.resolve();
                        
                        return api.updateMatch(matchId, {
                            date: match.date,
                            time: match.time,
                            venue: match.venue,
                            team1Id: match.team1.id,
                            team2Id: match.team2.id,
                            status: newStatus,
                            league: match.league
                        });
                    });

                    await Promise.all(updatePromises);
                    
                    // Refresh matches
                    const updatedMatches = await api.getMatches(currentLeague);
                    setMatches(updatedMatches);
                } catch (error) {
                    console.error('Failed to update match statuses:', error);
                }
            }
        };

        // Run immediately
        updateMatchStatuses();

        // Then run every minute
        const interval = setInterval(updateMatchStatuses, 60 * 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount, then check every minute

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [matchesData, teamsData] = await Promise.all([
                api.getMatches(currentLeague),
                api.getTeams(currentLeague)
            ]);
            setMatches(matchesData);
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setError('Failed to load matches');
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch data when league changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchInitialData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeague]);

    const venues = useMemo(() => {
      const uniqueVenues = Array.from(new Set(matches.map(m => m.venue)));
      return uniqueVenues;
    }, [matches]);

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            if (filters.status !== 'all' && match.status !== filters.status) return false;
            if (filters.dateFrom && match.date < filters.dateFrom) return false;
            if (filters.dateTo && match.date > filters.dateTo) return false;
            if (filters.team !== 'all' && match.team1.id !== filters.team && match.team2.id !== filters.team) return false;
            if (filters.venue !== 'all' && match.venue !== filters.venue) return false;
            return true;
        });
    }, [matches, filters]);

    const matchesByDate = useMemo(() => {
        const grouped: { [key: string]: Match[] } = {};
        filteredMatches.forEach(match => {
            if (!grouped[match.date]) {
                grouped[match.date] = [];
            }
            grouped[match.date].push(match);
        });
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredMatches]);

    const statusCounts = useMemo(() => {
        const total = matches.length;
        const upcoming = matches.filter(m => m.status === 'upcoming').length;
        const live = matches.filter(m => m.status === 'live').length;
        const completed = matches.filter(m => m.status === 'completed').length;

        return { total, upcoming, live, completed };
    }, [matches]);

    // Chart data computations
    const matchesByStatusChart = useMemo<ChartDataPoint[]>(() => {
        return [
            { label: 'Scheduled', value: statusCounts.upcoming, color: '#2F6FED' },
            { label: 'Live', value: statusCounts.live, color: '#EF4444' },
            { label: 'Completed', value: statusCounts.completed, color: '#10B981' }
        ];
    }, [statusCounts]);

    const matchesByMonthChart = useMemo<ChartDataPoint[]>(() => {
        const monthCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            const date = new Date(match.date);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });
        return Object.entries(monthCounts)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    const matchesByVenueChart = useMemo<ChartDataPoint[]>(() => {
        const venueCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            venueCounts[match.venue] = (venueCounts[match.venue] || 0) + 1;
        });
        return Object.entries(venueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    const matchesByTeamChart = useMemo<ChartDataPoint[]>(() => {
        const teamCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            teamCounts[match.team1.shortName] = (teamCounts[match.team1.shortName] || 0) + 1;
            teamCounts[match.team2.shortName] = (teamCounts[match.team2.shortName] || 0) + 1;
        });
        return Object.entries(teamCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    // Statistics dashboard data
    const statisticsData = useMemo(() => {
        const totalMatches = matches.length;
        const matchesPerTeam = teams.map(team => {
            const count = matches.filter(m => m.team1.id === team.id || m.team2.id === team.id).length;
            return { team: team.shortName, count };
        }).sort((a, b) => b.count - a.count);

        const dates = matches.map(m => new Date(m.date));
        const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
        const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
        const daysDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const avgMatchesPerDay = totalMatches / daysDiff;

        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingThisWeek = matches.filter(m => {
            const matchDate = new Date(m.date);
            return matchDate >= now && matchDate <= weekFromNow && m.status === 'upcoming';
        }).length;

        const completedPercentage = totalMatches > 0 ? (statusCounts.completed / totalMatches) * 100 : 0;

        return {
            totalMatches,
            matchesPerTeam,
            avgMatchesPerDay: avgMatchesPerDay.toFixed(1),
            upcomingThisWeek,
            completedPercentage: completedPercentage.toFixed(1)
        };
    }, [matches, teams, statusCounts]);

    // Team match matrix data
    const teamMatchMatrix = useMemo(() => {
        const matrix: { [key: string]: { [key: string]: number } } = {};
        teams.forEach(team1 => {
            matrix[team1.id] = {};
            teams.forEach(team2 => {
                if (team1.id !== team2.id) {
                    const count = matches.filter(m => 
                        (m.team1.id === team1.id && m.team2.id === team2.id) ||
                        (m.team1.id === team2.id && m.team2.id === team1.id)
                    ).length;
                    matrix[team1.id][team2.id] = count;
                }
            });
        });
        return matrix;
    }, [matches, teams]);

    const resetForm = () => {
        setFormData({
            date: '',
            time: '',
            venue: '',
            team1Id: '',
            team2Id: '',
            status: 'upcoming',
            league: 'ipl'
        });
        setEditingId(null);
        setShowForm(false);
        setFormStep(1);
        setError(null);
    };

    // Bulk selection handlers
    const toggleSelectMatch = (matchId: string) => {
        setSelectedMatches(prev => {
            const next = new Set(prev);
            if (next.has(matchId)) {
                next.delete(matchId);
            } else {
                next.add(matchId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMatches.size === filteredMatches.length) {
            setSelectedMatches(new Set());
        } else {
            setSelectedMatches(new Set(filteredMatches.map(m => m.id)));
        }
    };

    const clearSelection = () => {
        setSelectedMatches(new Set());
    };

    // Bulk operations handlers
    const handleBulkStatusUpdate = async (status: 'upcoming' | 'live' | 'completed') => {
        if (selectedMatches.size === 0) return;

        try {
            setIsSubmitting(true);
            const selectedIds = Array.from(selectedMatches);
            const updatePromises = selectedIds.map(matchId => {
                const match = matches.find(m => m.id === matchId);
                if (!match) return Promise.resolve();
                return api.updateMatch(matchId, {
                    date: match.date,
                    time: match.time,
                    venue: match.venue,
                    team1Id: match.team1.id,
                    team2Id: match.team2.id,
                    status,
                    league: match.league
                });
            });

            await Promise.all(updatePromises);
            
            // Update matches in state
            setMatches(matches.map(match => 
                selectedMatches.has(match.id) 
                    ? { ...match, status } 
                    : match
            ));

            showSuccess(`${selectedMatches.size} match(es) status updated to ${status}`);
            clearSelection();
        } catch (error) {
            console.error('Failed to update match statuses:', error);
            showError('Failed to update match statuses');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedMatches.size === 0) return;

        // Filter out mock matches
        const realMatches = Array.from(selectedMatches).filter(matchId => {
            const match = matches.find(m => m.id === matchId);
            return match && !(match as any)._isMock;
        });

        const mockMatches = Array.from(selectedMatches).filter(matchId => {
            const match = matches.find(m => m.id === matchId);
            return match && (match as any)._isMock;
        });

        if (mockMatches.length > 0) {
            showError(`Cannot delete ${mockMatches.length} sample match(es). Only real matches can be deleted.`);
            // Remove mock matches from selection
            setSelectedMatches(prev => {
                const next = new Set(prev);
                mockMatches.forEach(id => next.delete(id));
                return next;
            });
            setShowBulkDeleteModal(false);
            return;
        }

        if (realMatches.length === 0) {
            showError('No real matches selected for deletion.');
            setSelectedMatches(new Set());
            setShowBulkDeleteModal(false);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setShowBulkDeleteModal(false);

            const deletePromises = realMatches.map(matchId => 
                api.deleteMatch(matchId)
            );

            await Promise.all(deletePromises);
            
            // Remove from local state immediately
            setMatches(prev => prev.filter(m => !realMatches.includes(m.id)));
            setSelectedMatches(new Set());
            
            // Refresh matches from API
            try {
                const updatedMatches = await api.getMatches(currentLeague);
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.warn('Failed to refresh matches after bulk deletion:', refreshError);
            }
            
            showSuccess(`${realMatches.length} match(es) deleted successfully`);
        } catch (error: any) {
            console.error('Failed to delete matches:', error);
            let errorMessage = error?.message || 'Failed to delete matches';
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'Some matches were not found. They may have already been deleted.';
            }
            showError(errorMessage);
            
            // Refresh matches to get current state
            try {
                const updatedMatches = await api.getMatches(currentLeague);
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.error('Failed to refresh matches after error:', refreshError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkExport = (format: 'csv' | 'json' | 'excel' | 'ical') => {
        if (selectedMatches.size === 0) return;

        const selectedMatchesData = matches.filter(m => selectedMatches.has(m.id));
        
        if (format === 'ical') {
            const calendarEvents: CalendarEvent[] = selectedMatchesData.map(match => {
                const [hours, minutes] = match.time.split(':');
                const startDate = new Date(match.date);
                startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 3); // 3 hour match duration

                return {
                    title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                    description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                    location: match.venue,
                    startDate,
                    endDate,
                };
            });

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `ipl_matches_${timestamp}.ics`;
            exportToICal(calendarEvents, filename);
            showSuccess(`Exported ${selectedMatches.size} match(es) to iCal file`);
            return;
        }
        
        const headers = ['Date', 'Time', 'Team 1', 'Team 2', 'Venue', 'Status'];
        const rows = selectedMatchesData.map(match => [
            formatDateForExport(match.date),
            match.time,
            match.team1.shortName,
            match.team2.shortName,
            match.venue,
            match.status
        ]);

        const exportData = { headers, rows, title: 'Matches Export' };

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `matches_${timestamp}.${format === 'json' ? 'json' : format === 'excel' ? 'xlsx' : 'csv'}`;

        if (format === 'json') {
            exportToJSON(selectedMatchesData, filename);
        } else if (format === 'excel') {
            exportToExcel(exportData, filename);
        } else {
            exportToCSV(exportData, filename);
        }

        showSuccess(`Exported ${selectedMatches.size} match(es) to ${format.toUpperCase()}`);
    };

    // Calendar export handlers
    const handleExportToGoogleCalendar = (match: Match) => {
        const [hours, minutes] = match.time.split(':');
        const startDate = new Date(match.date);
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3);

        exportToGoogleCalendar({
            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
            description: `IPL 2026 Match\nVenue: ${match.venue}\nStatus: ${match.status}`,
            location: match.venue,
            startDate,
            endDate,
        });
    };

    const handleExportToOutlookCalendar = (match: Match) => {
        const [hours, minutes] = match.time.split(':');
        const startDate = new Date(match.date);
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3);

        exportToOutlookCalendar({
            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
            description: `IPL 2026 Match\nVenue: ${match.venue}\nStatus: ${match.status}`,
            location: match.venue,
            startDate,
            endDate,
        });
    };

    const handleCopyICalFeedUrl = async () => {
        try {
            await copyICalFeedUrl({
                team: filters.team !== 'all' ? filters.team : undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
            });
            showSuccess('iCal feed URL copied to clipboard!');
        } catch (error) {
            showError('Failed to copy URL to clipboard');
        }
    };

    const iCalFeedUrl = generateICalFeedUrl({
        team: filters.team !== 'all' ? filters.team : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
    });

    const handleBulkEdit = async (values: { [key: string]: any }) => {
        if (selectedMatches.size === 0) return;

        try {
            setIsSubmitting(true);
            const updatePromises = Array.from(selectedMatches).map(matchId => {
                const match = matches.find(m => m.id === matchId);
                if (!match) return Promise.resolve();

                const updateData: any = {
                    date: match.date,
                    time: match.time,
                    venue: match.venue,
                    team1Id: match.team1.id,
                    team2Id: match.team2.id,
                    status: match.status
                };

                if (values.status) updateData.status = values.status;
                if (values.venue) updateData.venue = values.venue;
                if (values.dateShift && !isNaN(Number(values.dateShift))) {
                    const currentDate = new Date(match.date);
                    currentDate.setDate(currentDate.getDate() + Number(values.dateShift));
                    updateData.date = currentDate.toISOString().split('T')[0];
                }

                return api.updateMatch(matchId, updateData);
            });

            await Promise.all(updatePromises);
            
            // Refresh matches
            const updatedMatches = await api.getMatches(currentLeague);
            setMatches(updatedMatches);

            showSuccess(`${selectedMatches.size} match(es) updated successfully`);
            clearSelection();
            setShowBulkEditModal(false);
        } catch (error) {
            console.error('Failed to update matches:', error);
            showError('Failed to update matches');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (match: Match) => {
        setFormData({
            date: match.date,
            time: match.time,
            venue: match.venue,
            team1Id: match.team1.id,
            team2Id: match.team2.id,
            status: match.status,
            league: match.league
        });
        setEditingId(match.id);
        setShowForm(true);
        setFormStep(1);
        setError(null);
    };

    const handleDelete = async (matchId: string) => {
        // Check if this is a mock match
        const match = matches.find(m => m.id === matchId);
        if (match && (match as any)._isMock) {
            showError('Cannot delete sample/demo matches. Please create real matches first.');
            return;
        }

        if (!confirm(`Are you sure you want to delete this match? This action cannot be undone.`)) return;

        try {
            setIsSubmitting(true);
            setError(null);
            
            console.log(`Attempting to delete match with ID: ${matchId}`);
            await api.deleteMatch(matchId);
            console.log(`Match ${matchId} deleted successfully`);
            
            // Remove from local state immediately for better UX
            setMatches(prev => prev.filter(m => m.id !== matchId));
            setSelectedMatches(prev => {
                const next = new Set(prev);
                next.delete(matchId);
                return next;
            });
            
            // Refresh matches from API to ensure consistency
            try {
                const updatedMatches = await api.getMatches(currentLeague);
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.warn('Failed to refresh matches after deletion, but deletion was successful:', refreshError);
            }
            
            showSuccess('Match deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete match:', error);
            let errorMessage = error?.message || 'Failed to delete match. Please try again.';
            
            // Provide more helpful error message for 404
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'Match not found. It may have already been deleted or is a sample match.';
            }
            
            showError(errorMessage);
            setError(errorMessage);
            
            // Refresh matches to get current state
            try {
                const updatedMatches = await api.getMatches(currentLeague);
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.error('Failed to refresh matches after error:', refreshError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.date || !formData.time || !formData.venue || !formData.team1Id || !formData.team2Id) {
            setError('All fields are required');
            return;
        }

        if (formData.team1Id === formData.team2Id) {
            setError('Teams must be different');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Ensure league is set from currentLeague context
            const matchData = {
                ...formData,
                league: currentLeague
            };

            if (editingId) {
                const updatedMatch = await api.updateMatch(editingId, matchData);
                setMatches(matches.map(m => m.id === editingId ? updatedMatch : m));
                showSuccess('Match updated successfully');
            } else {
                const newMatch = await api.createMatch(matchData);
                setMatches([...matches, newMatch]);
                showSuccess('Match created successfully');
            }

            resetForm();
        } catch (error) {
            console.error('Failed to save match:', error);
            setError(editingId ? 'Failed to update match' : 'Failed to create match');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return <StatusBadge status="live" label="Live" />;
            case 'completed':
                return <StatusBadge status="success" label="Completed" />;
            case 'cancelled':
                return <StatusBadge status="error" label="Cancelled" />;
            default:
                return <StatusBadge status="pending" label="Scheduled" />;
        }
    };

    // Manual status update handlers
    const handleMarkAsCompleted = async (matchId: string) => {
        try {
            setIsSubmitting(true);
            const match = matches.find(m => m.id === matchId);
            if (!match) return;

            await api.updateMatch(matchId, {
                date: match.date,
                time: match.time,
                venue: match.venue,
                team1Id: match.team1.id,
                team2Id: match.team2.id,
                status: 'completed',
                league: match.league
            });

            const updatedMatches = await api.getMatches(currentLeague);
            setMatches(updatedMatches);
            showSuccess('Match marked as completed');
        } catch (error) {
            console.error('Failed to update match status:', error);
            showError('Failed to update match status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsCancelled = async (matchId: string) => {
        try {
            setIsSubmitting(true);
            const match = matches.find(m => m.id === matchId);
            if (!match) return;

            await api.updateMatch(matchId, {
                date: match.date,
                time: match.time,
                venue: match.venue,
                team1Id: match.team1.id,
                team2Id: match.team2.id,
                status: 'cancelled',
                league: match.league
            });

            const updatedMatches = await api.getMatches(currentLeague);
            setMatches(updatedMatches);
            showSuccess('Match marked as cancelled');
        } catch (error) {
            console.error('Failed to update match status:', error);
            showError('Failed to update match status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen bg-[#0B0F13]">
                <AuroraBackground />
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner size="lg" color="#FFD700" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-[#0B0F13]">
                <AuroraBackground />
                <AdminSidebar currentPage="/ipl-admin-2026/matches" />
                <div className="flex-1 relative z-10 p-8">
                    <div className="space-y-6">
                        {/* Header skeleton */}
                        <div className="space-y-4">
                            <SkeletonLoader height="2rem" width="12rem" />
                            <SkeletonLoader height="1rem" width="8rem" />
                        </div>
                        
                        {/* Stats cards skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="glass-effect rounded-xl p-4">
                                    <SkeletonLoader height="0.75rem" width="6rem" className="mb-2" />
                                    <SkeletonLoader height="2rem" width="4rem" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Table skeleton */}
                        <div className="glass-effect rounded-xl p-6">
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <SkeletonLoader height="3rem" width="100%" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0B0F13]">
            <AuroraBackground />
            <AdminSidebar currentPage="/ipl-admin-2026/matches" />
            <ToastContainer toasts={toasts} onClose={closeToast} />

            <PageTransition className="flex-1 relative z-10">
                <div className="p-8">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                        <div>
                            <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => router.push('/ipl-admin-2026/dashboard')}
                                    className="hover:text-ipl-gold transition-colors"
                                >
                                    Admin
                                </button>
                                <span className="text-gray-600">/</span>
                                <button
                                    type="button"
                                    onClick={() => router.push('/ipl-admin-2026/teams')}
                                    className="hover:text-ipl-gold transition-colors"
                                >
                                    Competition
                                </button>
                                <span className="text-gray-600">/</span>
                                <span className="text-gray-300">Matches</span>
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                                Manage Matches
                            </h1>
                            <p className="text-gray-400">{filteredMatches.length} matches found</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="glass-effect rounded-lg p-1 flex items-center gap-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded transition-all duration-200 ${viewMode === 'table'
                                            ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="Table View"
                                >
                                    <IconTable className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`p-2 rounded transition-all duration-200 ${viewMode === 'timeline'
                                            ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="Timeline View"
                                >
                                    <IconTimeline className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('analytics')}
                                    className={`p-2 rounded transition-all duration-200 ${viewMode === 'analytics'
                                            ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="Analytics & Charts"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`glass-effect p-2.5 rounded-lg transition-all duration-200 ${showFilters ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <IconFilter className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                {/* Calendar Export Dropdown */}
                                <div className="relative group">
                                    <button
                                        className="glass-effect px-4 py-2.5 rounded-lg text-gray-300 hover:text-white font-semibold hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        <span className="hidden sm:inline">Calendar</span>
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-72 glass-effect rounded-lg border border-white/10 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => {
                                                    const events: CalendarEvent[] = filteredMatches.map(match => {
                                                        const [hours, minutes] = match.time.split(':');
                                                        const startDate = new Date(match.date);
                                                        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                        const endDate = new Date(startDate);
                                                        endDate.setHours(endDate.getHours() + 3);
                                                        return {
                                                            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                                                            description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                                                            location: match.venue,
                                                            startDate,
                                                            endDate,
                                                        };
                                                    });
                                                    const timestamp = new Date().toISOString().split('T')[0];
                                                    exportToICal(events, `ipl_matches_${timestamp}.ics`);
                                                    showSuccess(`Exported ${filteredMatches.length} match(es) to iCal file`);
                                                }}
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                <span>Download iCal File</span>
                                            </button>
                                            <button
                                                onClick={handleCopyICalFeedUrl}
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Copy iCal Feed URL</span>
                                            </button>
                                            <div className="border-t border-white/10 my-1"></div>
                                            <div className="px-4 py-2 text-xs text-gray-400">
                                                <div className="font-semibold mb-1 text-white">Subscribe via URL:</div>
                                                <div className="break-all text-xs bg-black/30 p-2 rounded font-mono text-gray-300">
                                                    {iCalFeedUrl}
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(iCalFeedUrl);
                                                            showSuccess('iCal feed URL copied!');
                                                        } catch (error) {
                                                            showError('Failed to copy URL');
                                                        }
                                                    }}
                                                    className="mt-2 text-xs text-ipl-gold hover:text-ipl-purple transition-colors flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copy URL</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <button
                                onClick={() => setShowForm(true)}
                                className="ipl-button flex items-center gap-2"
                            >
                                <IconPlus className="w-5 h-5" />
                                Create Match
                            </button>
                            </div>
                            <a
                                href="/matches"
                                target="_blank"
                                rel="noreferrer"
                                className="glass-effect px-3 py-2 rounded-lg text-[11px] text-gray-200 hover:bg-white/10 border border-white/15"
                            >
                                View public /matches
                            </a>
                        </div>
                    </div>

                    {/* Global status summary */}
                    <StaggeredList className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" staggerDelay={0.1}>
                        <motion.div 
                            className="glass-effect rounded-xl p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => setFilters({ ...filters, status: 'all' })}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-400">Total matches</div>
                                <Calendar className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{statusCounts.total}</div>
                        </motion.div>
                        <motion.div 
                            className="glass-effect rounded-xl p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => setFilters({ ...filters, status: 'upcoming' })}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-400">Upcoming</div>
                                <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                            <div className="text-2xl font-bold text-blue-400">{statusCounts.upcoming}</div>
                        </motion.div>
                        <motion.div 
                            className="glass-effect rounded-xl p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => setFilters({ ...filters, status: 'live' })}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-400">Live</div>
                                <Zap className="w-4 h-4 text-ipl-accent" />
                        </div>
                            <div className="text-2xl font-bold text-ipl-accent">{statusCounts.live}</div>
                        </motion.div>
                        <motion.div 
                            className="glass-effect rounded-xl p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => setFilters({ ...filters, status: 'completed' })}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-400">Completed</div>
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                            <div className="text-2xl font-bold text-green-400">{statusCounts.completed}</div>
                        </motion.div>
                    </StaggeredList>

                    {/* Venue Filter Dropdown */}
                    <div className="mb-6 relative max-w-xs">
                        <button
                            onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                            className="glass-effect px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-3 w-full hover:bg-white/10 transition-all duration-300 group"
                        >
                            <svg 
                                className="w-5 h-5 text-ipl-gold" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="flex-1 text-left truncate">
                                {filters.venue === 'all' ? 'All Venues' : filters.venue}
                            </span>
                            <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isVenueDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div 
                            className={`absolute left-0 right-0 mt-2 glass-effect rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top z-20 ${
                                isVenueDropdownOpen 
                                    ? 'opacity-100 scale-y-100 max-h-[450px]' 
                                    : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
                            }`}
                        >
                            <div className="py-2 max-h-[430px] overflow-y-auto scrollbar-thin scrollbar-thumb-ipl-gold/50 scrollbar-track-white/5">
                                {/* All Venues Option */}
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, venue: 'all' });
                                        setIsVenueDropdownOpen(false);
                                    }}
                                    className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center space-x-3 ${
                                        filters.venue === 'all' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">All Venues</div>
                                        <div className="text-xs text-gray-400">{matches.length} matches</div>
                                    </div>
                                    {filters.venue === 'all' && (
                                        <svg className="w-5 h-5 text-ipl-gold" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                {/* Venue Options */}
                                <div className="border-t border-white/10 mt-2 pt-2">
                                    {venues.map((venue) => {
                                        const venueMatchesCount = matches.filter(m => m.venue === venue).length;
                                        // Extract city from venue string (usually after the comma)
                                        const venueParts = venue.split(',');
                                        const stadiumName = venueParts[0].trim();
                                        const city = venueParts[1]?.trim() || '';
                                        
                                        return (
                                            <button
                                                key={venue}
                                                onClick={() => {
                                                    setFilters({ ...filters, venue: venue });
                                                    setIsVenueDropdownOpen(false);
                                                }}
                                                className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${
                                                    filters.venue === venue ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-ipl-purple/30 text-white shadow-lg">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate">{stadiumName}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                                        {city && <span>📍 {city}</span>}
                                                        <span>•</span>
                                                        <span>{venueMatchesCount} match{venueMatchesCount !== 1 ? 'es' : ''}</span>
                                                    </div>
                                                </div>
                                                {filters.venue === venue && (
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

                    {showFilters && (
                        <div className="glass-effect rounded-xl p-6 mb-6 border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="upcoming">Scheduled</option>
                                        <option value="live">Live</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Date From</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Date To</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
                                    <select
                                        value={filters.team}
                                        onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                    >
                                        <option value="all">All Teams</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.shortName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                                    <select
                                        value={filters.venue}
                                        onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                    >
                                        <option value="all">All Venues</option>
                                        {venues.map(venue => (
                                            <option key={venue} value={venue}>{venue}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })}
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {showForm && (
                        <div className="glass-effect rounded-xl p-8 mb-8 border border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {editingId ? 'Edit Match' : 'Create New Match'}
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Step {formStep} of 3</p>
                                </div>
                                <button onClick={resetForm} className="text-gray-400 hover:text-white transition-colors">
                                    <IconX className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6 flex gap-2">
                                {[1, 2, 3].map(step => (
                                    <div
                                        key={step}
                                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step <= formStep ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple' : 'bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {formStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">Match Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                                                    <input
                                                        type="date"
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                                                    <input
                                                        type="time"
                                                        value={formData.time}
                                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setFormStep(2)}
                                                className="ipl-button"
                                            >
                                                Next Step
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {formStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">Select Teams</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Team 1</label>
                                                    <select
                                                        value={formData.team1Id}
                                                        onChange={(e) => setFormData({ ...formData, team1Id: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                        required
                                                    >
                                                        <option value="">Select Team</option>
                                                        {teams.map(team => (
                                                            <option key={team.id} value={team.id} disabled={team.id === formData.team2Id}>
                                                                {team.shortName} - {team.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Team 2</label>
                                                    <select
                                                        value={formData.team2Id}
                                                        onChange={(e) => setFormData({ ...formData, team2Id: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                        required
                                                    >
                                                        <option value="">Select Team</option>
                                                        {teams.map(team => (
                                                            <option key={team.id} value={team.id} disabled={team.id === formData.team1Id}>
                                                                {team.shortName} - {team.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setFormStep(1)}
                                                className="glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-all duration-200"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormStep(3)}
                                                className="ipl-button"
                                            >
                                                Next Step
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {formStep === 3 && (
                                   <div className="space-y-6">
                                       <div>
                                           <h3 className="text-lg font-semibold text-white mb-4">Venue & Status</h3>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                               <div className="md:col-span-2 relative">
                                                   <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                                                   <div className="relative">
                                                       <input
                                                           type="text"
                                                           value={formData.venue}
                                                           onChange={(e) => {
                                                               setFormData({ ...formData, venue: e.target.value });
                                                               setVenueSearchQuery(e.target.value);
                                                           }}
                                                           onFocus={() => setVenueSearchQuery(formData.venue)}
                                                           className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                           placeholder="Search or select venue..."
                                                           required
                                                       />
                                                       <svg 
                                                           className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                                           fill="none" 
                                                           stroke="currentColor" 
                                                           viewBox="0 0 24 24"
                                                       >
                                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                       </svg>
                                                   </div>
                                                   
                                                   {/* Venue Suggestions Dropdown */}
                                                   {venueSearchQuery && (
                                                       <div className="absolute z-20 w-full mt-2 glass-effect rounded-lg shadow-xl border border-white/10 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-ipl-gold/50 scrollbar-track-white/5">
                                                           {IPL_VENUES
                                                               .filter(venue => 
                                                                   venue.toLowerCase().includes(venueSearchQuery.toLowerCase())
                                                               )
                                                               .map((venue, index) => {
                                                                   const [stadiumName, city] = venue.split(',').map(s => s.trim());
                                                                   return (
                                                                       <button
                                                                           key={index}
                                                                           type="button"
                                                                           onClick={() => {
                                                                               setFormData({ ...formData, venue });
                                                                               setVenueSearchQuery('');
                                                                           }}
                                                                           className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 border-b border-white/5 last:border-0"
                                                                       >
                                                                           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-ipl-purple/30 flex-shrink-0">
                                                                               <svg className="w-5 h-5 text-ipl-gold" fill="currentColor" viewBox="0 0 20 20">
                                                                                   <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                               </svg>
                                                                           </div>
                                                                           <div className="flex-1 min-w-0">
                                                                               <div className="text-white font-medium truncate">{stadiumName}</div>
                                                                               <div className="text-xs text-gray-400">📍 {city}</div>
                                                                           </div>
                                                                       </button>
                                                                   );
                                                               })}
                                                           {IPL_VENUES.filter(venue => 
                                                               venue.toLowerCase().includes(venueSearchQuery.toLowerCase())
                                                           ).length === 0 && (
                                                               <div className="px-4 py-8 text-center text-gray-400">
                                                                   <svg className="w-12 h-12 mx-auto mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                   </svg>
                                                                   <p>No venues found</p>
                                                                   <p className="text-xs mt-1">Type to search or enter custom venue</p>
                                                               </div>
                                                           )}
                                                       </div>
                                                   )}
                                               </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'upcoming' | 'live' | 'completed' | 'cancelled' })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                    >
                                                        <option value="upcoming">Scheduled</option>
                                                        <option value="live">Live</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setFormStep(2)}
                                                className="glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-all duration-200"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="ipl-button disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Saving...' : editingId ? 'Update Match' : 'Create Match'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {viewMode === 'table' ? (
                        // Table View
                        <div className="glass-effect rounded-xl overflow-hidden border border-white/10">
                            <BulkOperationsToolbar
                                selectedCount={selectedMatches.size}
                                totalCount={filteredMatches.length}
                                onSelectAll={toggleSelectAll}
                                onDeselectAll={clearSelection}
                                onBulkEdit={() => setShowBulkEditModal(true)}
                                onBulkDelete={() => setShowBulkDeleteModal(true)}
                                onBulkExport={() => {
                                    // Show export format menu
                                    const format = prompt('Select export format:\n1. CSV\n2. JSON\n3. Excel\n4. iCal\n\nEnter 1-4:');
                                    if (format === '1') {
                                        handleBulkExport('csv');
                                    } else if (format === '2') {
                                        handleBulkExport('json');
                                    } else if (format === '3') {
                                        handleBulkExport('excel');
                                    } else if (format === '4') {
                                        handleBulkExport('ical');
                                    }
                                }}
                                onBulkStatusUpdate={(status) => handleBulkStatusUpdate(status as 'upcoming' | 'live' | 'completed')}
                                statusOptions={[
                                    { value: 'upcoming', label: 'Set to Scheduled' },
                                    { value: 'live', label: 'Set to Live' },
                                    { value: 'completed', label: 'Set to Completed' }
                                ]}
                                showSelectAll={true}
                            />
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-left">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="flex items-center"
                                                    title={selectedMatches.size === filteredMatches.length ? 'Deselect All' : 'Select All'}
                                                >
                                                    {selectedMatches.size === filteredMatches.length && filteredMatches.length > 0 ? (
                                                        <CheckSquare className="w-5 h-5 text-ipl-gold" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Match
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Venue
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMatches.map((match, index) => (
                                            <motion.tr 
                                                key={match.id} 
                                                className="hover:bg-white/5 transition-colors"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMatches.has(match.id)}
                                                        onChange={() => toggleSelectMatch(match.id)}
                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-ipl-gold focus:ring-ipl-gold/20 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-white font-medium">{formatDate(match.date)}</div>
                                                    <div className="text-xs text-gray-400">{formatTime(match.time)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            {match.team1.id === '1' ? (
                                                              <div className="w-8 h-8 flex items-center justify-center">
                                                                <RCBLionLogo className="w-8 h-8" />
                                                              </div>
                                                            ) : (
                                                              <img src={match.team1.logo} alt={match.team1.shortName} className="w-8 h-8 object-contain" />
                                                            )}
                                                            <span className="text-white font-semibold">{match.team1.shortName}</span>
                                                        </div>
                                                        <span className="text-gray-500 font-bold">vs</span>
                                                        <div className="flex items-center gap-2">
                                                            {match.team2.id === '1' ? (
                                                              <div className="w-8 h-8 flex items-center justify-center">
                                                                <RCBLionLogo className="w-8 h-8" />
                                                              </div>
                                                            ) : (
                                                              <img src={match.team2.logo} alt={match.team2.shortName} className="w-8 h-8 object-contain" />
                                                            )}
                                                            <span className="text-white font-semibold">{match.team2.shortName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-300 max-w-xs truncate">
                                                        {match.venue}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(match.status)}
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={match.status === 'completed'}
                                                                    onChange={() => {
                                                                        if (match.status === 'completed') {
                                                                            // Uncheck - revert to automatic status
                                                                            const [hours, minutes] = match.time.split(':').map(Number);
                                                                            const matchDate = new Date(match.date);
                                                                            matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                            const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                            const now = new Date();
                                                                            const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                            handleBulkStatusUpdate(newStatus);
                                                                        } else {
                                                                            handleMarkAsCompleted(match.id);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/20 cursor-pointer"
                                                                    disabled={isSubmitting}
                                                                />
                                                                <span className="text-xs text-gray-400 group-hover:text-green-400 transition-colors">Completed</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={match.status === 'cancelled'}
                                                                    onChange={() => {
                                                                        if (match.status === 'cancelled') {
                                                                            // Uncheck - revert to automatic status
                                                                            const [hours, minutes] = match.time.split(':').map(Number);
                                                                            const matchDate = new Date(match.date);
                                                                            matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                            const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                            const now = new Date();
                                                                            const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                            handleBulkStatusUpdate(newStatus);
                                                                        } else {
                                                                            handleMarkAsCancelled(match.id);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/20 cursor-pointer"
                                                                    disabled={isSubmitting}
                                                                />
                                                                <span className="text-xs text-gray-400 group-hover:text-red-400 transition-colors">Cancelled</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group">
                                                            <button
                                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                                disabled={isSubmitting}
                                                                title="Export to Calendar"
                                                            >
                                                                <Calendar className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute right-0 top-full mt-1 w-56 glass-effect rounded-lg border border-white/10 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                                <button
                                                                    onClick={() => handleExportToGoogleCalendar(match)}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Google Calendar</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExportToOutlookCalendar(match)}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Outlook Calendar</span>
                                                                </button>
                                                                <div className="border-t border-white/10 my-1"></div>
                                                                <button
                                                                    onClick={() => {
                                                                        const [hours, minutes] = match.time.split(':');
                                                                        const startDate = new Date(match.date);
                                                                        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                                        const endDate = new Date(startDate);
                                                                        endDate.setHours(endDate.getHours() + 3);
                                                                        const event: CalendarEvent = {
                                                                            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                                                                            description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                                                                            location: match.venue,
                                                                            startDate,
                                                                            endDate,
                                                                        };
                                                                        exportToICal([event], `match_${match.id}.ics`);
                                                                        showSuccess('Match exported to iCal file');
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>Download iCal</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEdit(match)}
                                                            className="p-2 text-ipl-gold hover:bg-ipl-gold/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            disabled={isSubmitting}
                                                            title="Edit Match"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(match.id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            disabled={isSubmitting || (match as any)._isMock}
                                                            title={(match as any)._isMock ? 'Cannot delete sample match' : 'Delete Match'}
                                                        >
                                                            <IconTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMatches.length === 0 && (
                                <EmptyStateIllustration
                                    type="matches"
                                    title="No matches found"
                                    description={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') 
                                            ? "Try adjusting your filters to see more matches."
                                            : "Get started by creating your first match."
                                    }
                                    action={
                                        Object.values(filters).some(v => v !== 'all' && v !== '')
                                            ? {
                                                label: "Clear Filters",
                                                onClick: () => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })
                                            }
                                            : {
                                                label: "Create Match",
                                                onClick: () => setShowForm(true)
                                            }
                                    }
                                />
                            )}
                        </div>
                    ) : viewMode === 'timeline' ? (
                        <div className="space-y-6">
                            {matchesByDate.length > 0 ? (
                                <StaggeredList className="space-y-6" staggerDelay={0.1}>
                            {matchesByDate.map(([date, dateMatches]) => (
                                        <motion.div 
                                            key={date} 
                                            className="glass-effect rounded-xl p-6 border border-white/10"
                                            whileHover={{ scale: 1.01 }}
                                        >
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-ipl-gold to-ipl-purple rounded-full"></div>
                                        {formatDate(date)}
                                    </h3>
                                            <StaggeredList className="space-y-4" staggerDelay={0.05}>
                                        {dateMatches.map((match) => (
                                                    <motion.div
                                                key={match.id}
                                                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 border border-white/5"
                                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-sm text-gray-400 font-medium min-w-[80px]">
                                                            {formatTime(match.time)}
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                {match.team1.id === '1' ? (
                                                                  <div className="w-10 h-10 flex items-center justify-center">
                                                                    <RCBLionLogo className="w-10 h-10" />
                                                                  </div>
                                                                ) : (
                                                                  <img src={match.team1.logo} alt={match.team1.shortName} className="w-10 h-10 object-contain" />
                                                                )}
                                                                <span className="text-white font-bold">{match.team1.shortName}</span>
                                                            </div>
                                                            <span className="text-gray-500 font-bold text-lg">vs</span>
                                                            <div className="flex items-center gap-2">
                                                                {match.team2.id === '1' ? (
                                                                  <div className="w-10 h-10 flex items-center justify-center">
                                                                    <RCBLionLogo className="w-10 h-10" />
                                                                  </div>
                                                                ) : (
                                                                  <img src={match.team2.logo} alt={match.team2.shortName} className="w-10 h-10 object-contain" />
                                                                )}
                                                                <span className="text-white font-bold">{match.team2.shortName}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="text-sm text-gray-400">
                                                            📍 {match.venue}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {getStatusBadge(match.status)}
                                                            <div className="flex items-center gap-2 ml-2">
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={match.status === 'completed'}
                                                                        onChange={() => {
                                                                            if (match.status === 'completed') {
                                                                                const [hours, minutes] = match.time.split(':').map(Number);
                                                                                const matchDate = new Date(match.date);
                                                                                matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                                const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                                const now = new Date();
                                                                                const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                                handleBulkStatusUpdate(newStatus);
                                                                            } else {
                                                                                handleMarkAsCompleted(match.id);
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/20 cursor-pointer"
                                                                        disabled={isSubmitting}
                                                                    />
                                                                    <span className="text-xs text-gray-400 group-hover:text-green-400 transition-colors">Completed</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={match.status === 'cancelled'}
                                                                        onChange={() => {
                                                                            if (match.status === 'cancelled') {
                                                                                const [hours, minutes] = match.time.split(':').map(Number);
                                                                                const matchDate = new Date(match.date);
                                                                                matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                                const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                                const now = new Date();
                                                                                const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                                handleBulkStatusUpdate(newStatus);
                                                                            } else {
                                                                                handleMarkAsCancelled(match.id);
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/20 cursor-pointer"
                                                                        disabled={isSubmitting}
                                                                    />
                                                                    <span className="text-xs text-gray-400 group-hover:text-red-400 transition-colors">Cancelled</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEdit(match)}
                                                                className="p-2 text-ipl-gold hover:bg-ipl-gold/10 rounded-lg transition-all duration-200"
                                                                title="Edit"
                                                            >
                                                                <IconEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(match.id)}
                                                            disabled={isSubmitting || (match as any)._isMock}
                                                            title={(match as any)._isMock ? 'Cannot delete sample match' : 'Delete Match'}
                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                                disabled={isSubmitting || (match as any)._isMock}
                                                                title={(match as any)._isMock ? 'Cannot delete sample match' : 'Delete'}
                                                            >
                                                                <IconTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                    </motion.div>
                                                ))}
                                            </StaggeredList>
                                        </motion.div>
                                    ))}
                                </StaggeredList>
                            ) : (
                                <EmptyStateIllustration
                                    type="matches"
                                    title="No matches found"
                                    description={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') 
                                            ? "Try adjusting your filters to see more matches."
                                            : "Get started by creating your first match."
                                    }
                                    action={
                                        Object.values(filters).some(v => v !== 'all' && v !== '')
                                            ? {
                                                label: "Clear Filters",
                                                onClick: () => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })
                                            }
                                            : {
                                                label: "Create Match",
                                                onClick: () => setShowForm(true)
                                            }
                                    }
                                />
                            )}
                        </div>
                    ) : (
                        // Analytics View
                        <div className="space-y-6">
                            {/* Statistics Dashboard */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Statistics Dashboard</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Total Matches</div>
                                        <div className="text-2xl font-bold text-white">{statisticsData.totalMatches}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Avg per Day</div>
                                        <div className="text-2xl font-bold text-blue-400">{statisticsData.avgMatchesPerDay}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">This Week</div>
                                        <div className="text-2xl font-bold text-purple-400">{statisticsData.upcomingThisWeek}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Completed %</div>
                                        <div className="text-2xl font-bold text-green-400">{statisticsData.completedPercentage}%</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Top Team</div>
                                        <div className="text-lg font-bold text-ipl-gold">
                                            {statisticsData.matchesPerTeam[0]?.team || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {statisticsData.matchesPerTeam[0]?.count || 0} matches
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Interactive Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <InteractiveChart
                                    data={matchesByStatusChart}
                                    type="bar"
                                    title="Matches by Status"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByMonthChart}
                                    type="bar"
                                    title="Matches by Month"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByVenueChart}
                                    type="bar"
                                    title="Top 10 Venues"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByTeamChart}
                                    type="bar"
                                    title="Matches by Team Participation"
                                    height={250}
                                />
                                </div>

                            {/* Team Match Matrix */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Grid3x3 className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Team Match Matrix</h2>
                                    <p className="text-sm text-gray-400 ml-auto">Click to filter matches</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <div className="inline-block min-w-full">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase border-b border-white/10"></th>
                                                    {teams.map(team => (
                                                        <th 
                                                            key={team.id}
                                                            className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase border-b border-white/10 min-w-[80px]"
                                                        >
                                                            {team.shortName}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teams.map(team1 => (
                                                    <tr key={team1.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-semibold text-white border-r border-white/10">
                                                            {team1.shortName}
                                                        </td>
                                                        {teams.map(team2 => (
                                                            <td 
                                                                key={team2.id}
                                                                className="px-4 py-3 text-center border-r border-white/10 last:border-r-0"
                                                            >
                                                                {team1.id === team2.id ? (
                                                                    <span className="text-gray-600">-</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            const team1Matches = matches.filter(m => 
                                                                                (m.team1.id === team1.id && m.team2.id === team2.id) ||
                                                                                (m.team1.id === team2.id && m.team2.id === team1.id)
                                                                            );
                                                                            if (team1Matches.length > 0) {
                                                                                setFilters({ ...filters, team: team1.id });
                                                                                setViewMode('table');
                                                                            }
                                                                        }}
                                                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                                                            teamMatchMatrix[team1.id]?.[team2.id] > 0
                                                                                ? 'bg-ipl-gold/20 text-ipl-gold hover:bg-ipl-gold/30 cursor-pointer'
                                                                                : 'text-gray-600 cursor-default'
                                                                        }`}
                                                                    >
                                                                        {teamMatchMatrix[team1.id]?.[team2.id] || 0}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                        </div>
                                </div>
                            </div>

                            {/* Venue Heatmap */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <MapPin className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Venue Distribution</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {venues.slice(0, 12).map(venue => {
                                        const venueMatches = matches.filter(m => m.venue === venue);
                                        const count = venueMatches.length;
                                        const intensity = Math.min(1, count / 10); // Normalize to 0-1
                                        return (
                                            <motion.button
                                                key={venue}
                                                onClick={() => {
                                                    setFilters({ ...filters, venue });
                                                    setViewMode('table');
                                                }}
                                                className="glass-effect rounded-lg p-4 text-left hover:bg-white/10 transition-all border border-white/10"
                                                whileHover={{ scale: 1.05 }}
                                                style={{
                                                    backgroundColor: `rgba(255, 215, 0, ${intensity * 0.2})`,
                                                    borderColor: `rgba(255, 215, 0, ${intensity * 0.5})`
                                                }}
                                            >
                                                <div className="text-sm font-semibold text-white mb-1 truncate">
                                                    {venue.split(',')[0]}
                                                </div>
                                                <div className="text-xs text-gray-400 mb-2">
                                                    {venue.split(',')[1]?.trim() || ''}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-ipl-gold">{count}</span>
                                                    <span className="text-xs text-gray-400">matches</span>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Match Calendar View */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <CalendarIcon className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Match Calendar</h2>
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                    {(() => {
                                        const calendarDays: JSX.Element[] = [];
                                        const now = new Date();
                                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                        const startDate = new Date(firstDay);
                                        startDate.setDate(startDate.getDate() - startDate.getDay());

                                        for (let i = 0; i < 42; i++) {
                                            const currentDate = new Date(startDate);
                                            currentDate.setDate(startDate.getDate() + i);
                                            const dateStr = currentDate.toISOString().split('T')[0];
                                            const dayMatches = matches.filter(m => m.date === dateStr);
                                            const isCurrentMonth = currentDate.getMonth() === now.getMonth();
                                            
                                            calendarDays.push(
                                                <motion.button
                                                    key={i}
                                                    onClick={() => {
                                                        if (dayMatches.length > 0) {
                                                            setFilters({ ...filters, dateFrom: dateStr, dateTo: dateStr });
                                                            setViewMode('table');
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg text-sm transition-all ${
                                                        !isCurrentMonth 
                                                            ? 'text-gray-600' 
                                                            : dayMatches.length > 0
                                                            ? 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30 hover:bg-ipl-gold/30'
                                                            : 'text-gray-400 hover:bg-white/5'
                                                    }`}
                                                    whileHover={dayMatches.length > 0 ? { scale: 1.1 } : {}}
                                                    disabled={dayMatches.length === 0}
                                                >
                                                    <div>{currentDate.getDate()}</div>
                                                    {dayMatches.length > 0 && (
                                                        <div className="text-xs mt-1 font-bold">{dayMatches.length}</div>
                                                    )}
                                                </motion.button>
                                            );
                                        }
                                        return calendarDays;
                                    })()}
                </div>
            </div>
                        </div>
                    )}

                    {/* Bulk Edit Modal */}
                    <BulkEditModal
                        isOpen={showBulkEditModal}
                        onClose={() => setShowBulkEditModal(false)}
                        onSave={handleBulkEdit}
                        selectedCount={selectedMatches.size}
                        title="Bulk Edit Matches"
                        fields={[
                            {
                                name: 'status',
                                label: 'Status',
                                type: 'select',
                                options: [
                                    { value: 'upcoming', label: 'Scheduled' },
                                    { value: 'live', label: 'Live' },
                                    { value: 'completed', label: 'Completed' }
                                ]
                            },
                            {
                                name: 'venue',
                                label: 'Venue',
                                type: 'text',
                                placeholder: 'Enter new venue...'
                            },
                            {
                                name: 'dateShift',
                                label: 'Date Shift (days)',
                                type: 'number',
                                placeholder: 'e.g., 2 for +2 days, -1 for -1 day'
                            }
                        ]}
                    />

                    {/* Bulk Delete Modal */}
                    <BatchDeleteModal
                        isOpen={showBulkDeleteModal}
                        onClose={() => setShowBulkDeleteModal(false)}
                        onConfirm={handleBulkDelete}
                        itemCount={selectedMatches.size}
                        itemType="matches"
                        warningMessage="All match data, including scores and statistics, will be permanently deleted."
                    />
                </div>
            </PageTransition>
        </div>
    );
}
