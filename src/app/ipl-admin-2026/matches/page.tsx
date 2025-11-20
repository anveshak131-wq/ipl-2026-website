'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
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
    const [success, setSuccess] = useState<string | null>(null);
    const [formStep, setFormStep] = useState(1);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const [venueSearchQuery, setVenueSearchQuery] = useState('');

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
                    router.push('/admin');
                    return;
                }
                setIsAuthenticated(true);
                fetchInitialData();
            } catch (error) {
                router.push('/admin');
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [router]);

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
            setSuccess('Match deleted successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Failed to delete match:', error);
            setError('Failed to delete match');
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
                setSuccess('Match updated successfully');
            } else {
                const newMatch = await api.createMatch(formData);
                setMatches([...matches, newMatch]);
                setSuccess('Match created successfully');
            }

            resetForm();
            setTimeout(() => setSuccess(null), 3000);
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
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-ipl-accent/20 to-purple-500/20 text-ipl-accent border border-ipl-accent/30">
                        <span className="w-2 h-2 bg-ipl-accent rounded-full animate-pulse"></span>
                        Live
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        Completed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Scheduled
                    </span>
                );
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
                    <div className="text-white">Loading...</div>
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
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white">Loading matches...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0B0F13]">
            <AuroraBackground />
            <AdminSidebar currentPage="/ipl-admin-2026/matches" />

            <div className="flex-1 relative z-10">
                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 backdrop-blur-sm">
                            {success}
                        </div>
                    )}

                    {error && !showForm && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                        <div>
                            <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/dashboard')}
                                    className="hover:text-ipl-gold transition-colors"
                                >
                                    Admin
                                </button>
                                <span className="text-gray-600">/</span>
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/teams')}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass-effect rounded-xl p-4">
                            <div className="text-xs text-gray-400 mb-1">Total matches</div>
                            <div className="text-2xl font-bold text-white">{statusCounts.total}</div>
                        </div>
                        <div className="glass-effect rounded-xl p-4">
                            <div className="text-xs text-gray-400 mb-1">Upcoming</div>
                            <div className="text-2xl font-bold text-blue-400">{statusCounts.upcoming}</div>
                        </div>
                        <div className="glass-effect rounded-xl p-4">
                            <div className="text-xs text-gray-400 mb-1">Live</div>
                            <div className="text-2xl font-bold text-ipl-accent">{statusCounts.live}</div>
                        </div>
                        <div className="glass-effect rounded-xl p-4">
                            <div className="text-xs text-gray-400 mb-1">Completed</div>
                            <div className="text-2xl font-bold text-green-400">{statusCounts.completed}</div>
                        </div>
                    </div>

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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
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
                                        {filteredMatches.map((match) => (
                                            <tr key={match.id} className="hover:bg-white/5 transition-colors">
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMatches.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">No matches found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {matchesByDate.map(([date, dateMatches]) => (
                                <div key={date} className="glass-effect rounded-xl p-6 border border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-ipl-gold to-ipl-purple rounded-full"></div>
                                        {formatDate(date)}
                                    </h3>
                                    <div className="space-y-4">
                                        {dateMatches.map((match) => (
                                            <div
                                                key={match.id}
                                                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 border border-white/5"
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {matchesByDate.length === 0 && (
                                <div className="glass-effect rounded-xl p-12 text-center border border-white/10">
                                    <p className="text-gray-400">No matches found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
