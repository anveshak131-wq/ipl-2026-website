'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { PageTransition, StaggeredList, SkeletonLoader, LoadingSpinner } from '@/components/admin/animations';
import { EmptyStateIllustration, AnimatedStatusIcon, StatusBadge } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import BulkOperationsToolbar from '@/components/admin/BulkOperationsToolbar';
import BulkEditModal from '@/components/admin/BulkEditModal';
import BatchDeleteModal from '@/components/admin/BatchDeleteModal';
import { exportToCSV, exportToJSON, exportToExcel, prepareExportData, formatDateForExport } from '@/lib/admin/exportUtils';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';
import { CheckSquare, Square } from 'lucide-react';

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
    const { toasts, success: showSuccess, error: showError, closeToast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
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
        status: 'upcoming' as 'upcoming' | 'live' | 'completed'
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

    const fetchInitialData = async () => {
        try {
            const [matchesData, teamsData] = await Promise.all([
                api.getMatches(),
                api.getTeams()
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

    const resetForm = () => {
        setFormData({
            date: '',
            time: '',
            venue: '',
            team1Id: '',
            team2Id: '',
            status: 'upcoming'
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
                    status
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

        try {
            setIsSubmitting(true);
            const deletePromises = Array.from(selectedMatches).map(matchId => 
                api.deleteMatch(matchId)
            );

            await Promise.all(deletePromises);
            setMatches(matches.filter(m => !selectedMatches.has(m.id)));
            showSuccess(`${selectedMatches.size} match(es) deleted successfully`);
            clearSelection();
            setShowBulkDeleteModal(false);
        } catch (error) {
            console.error('Failed to delete matches:', error);
            showError('Failed to delete matches');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkExport = (format: 'csv' | 'json' | 'excel') => {
        if (selectedMatches.size === 0) return;

        const selectedMatchesData = matches.filter(m => selectedMatches.has(m.id));
        
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
            const updatedMatches = await api.getMatches();
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
            status: match.status
        });
        setEditingId(match.id);
        setShowForm(true);
        setFormStep(1);
        setError(null);
    };

    const handleDelete = async (matchId: string) => {
        if (!confirm('Are you sure you want to delete this match?')) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await api.deleteMatch(matchId);
            setMatches(matches.filter(m => m.id !== matchId));
            showSuccess('Match deleted successfully');
        } catch (error) {
            console.error('Failed to delete match:', error);
            showError('Failed to delete match');
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

            if (editingId) {
                const updatedMatch = await api.updateMatch(editingId, formData);
                setMatches(matches.map(m => m.id === editingId ? updatedMatch : m));
                showSuccess('Match updated successfully');
            } else {
                const newMatch = await api.createMatch(formData);
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
            default:
                return <StatusBadge status="pending" label="Scheduled" />;
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
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`glass-effect p-2.5 rounded-lg transition-all duration-200 ${showFilters ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <IconFilter className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setShowForm(true)}
                                className="ipl-button flex items-center gap-2"
                            >
                                <IconPlus className="w-5 h-5" />
                                Create Match
                            </button>
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
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'upcoming' | 'live' | 'completed' })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-colors"
                                                    >
                                                        <option value="upcoming">Scheduled</option>
                                                        <option value="live">Live</option>
                                                        <option value="completed">Completed</option>
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
                        <div className="glass-effect rounded-xl overflow-hidden border border-white/10">
                            <BulkOperationsToolbar
                                selectedCount={selectedMatches.size}
                                totalCount={filteredMatches.length}
                                onSelectAll={toggleSelectAll}
                                onDeselectAll={clearSelection}
                                onBulkEdit={() => setShowBulkEditModal(true)}
                                onBulkDelete={() => setShowBulkDeleteModal(true)}
                                onBulkExport={() => {
                                    // Show export menu or directly export CSV
                                    handleBulkExport('csv');
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
                                                    {getStatusBadge(match.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
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
                                                            disabled={isSubmitting}
                                                            title="Delete Match"
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
                    ) : (
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
                                                                {getStatusBadge(match.status)}
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
                                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                                                        title="Delete"
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
