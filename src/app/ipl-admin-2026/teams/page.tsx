'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Team } from '@/types';
import { api } from '@/lib/data';
import { wplTeams } from '@/data/wpl-teams';
import { getAnimatedLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';

type SortField = 'name' | 'shortName';
type SortDirection = 'asc' | 'desc';

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function AdminTeams() {
    const router = useRouter();
    const { currentLeague } = useLeague();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [showSlideOver, setShowSlideOver] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        logo: '',
        description: '',
        league: 'ipl' as 'ipl' | 'wpl',
        colors: {
            primary: '#6B46C1',
            secondary: '#FFD700'
        },
        trophies: [] as { year: number; name: string }[],
        homeGrounds: [] as string[]
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
                fetchTeams();
            } catch (error) {
                router.push('/ipl-admin-2026');
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const fetchTeams = async () => {
        try {
            setIsLoading(true);
            const teamsData = await api.getTeams(currentLeague);
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch teams when league changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchTeams();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeague]);

    // Update formData.league when currentLeague changes (only if not editing)
    useEffect(() => {
        if (!editingTeam && showSlideOver) {
            setFormData(prev => ({
                ...prev,
                league: currentLeague
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeague]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedTeams = useMemo(() => {
        const filtered = teams.filter(team =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            team.shortName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            const aValue = a[sortField].toLowerCase();
            const bValue = b[sortField].toLowerCase();
            const comparison = aValue.localeCompare(bValue);
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [teams, searchQuery, sortField, sortDirection]);

    const handleAddTeam = () => {
        setEditingTeam(null);
        setFormData({
            name: '',
            shortName: '',
            logo: '',
            description: '',
            league: currentLeague, // Use current league from context
            colors: {
                primary: '#6B46C1',
                secondary: '#FFD700'
            },
            trophies: [],
            homeGrounds: []
        });
        setShowSlideOver(true);
        setError(null);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setFormData({
            name: team.name,
            shortName: team.shortName,
            logo: team.logo,
            description: team.description,
            league: team.league,
            colors: team.colors,
            trophies: team.trophies || [],
            homeGrounds: team.homeGrounds || []
        });
        setShowSlideOver(true);
        setSelectedTeams(new Set());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (editingTeam) {
                // When editing, preserve the team's existing league unless explicitly changed
                const updatedTeam = await api.updateTeam(editingTeam.id, formData);
                setTeams(teams.map(t => t.id === editingTeam.id ? updatedTeam : t));
                setSuccess('Team updated successfully');
            } else {
                // When creating, always use currentLeague from context to ensure correct league assignment
                const teamData = {
                    ...formData,
                    league: currentLeague // Force use current league from context
                };
                
                console.log('Creating team with league:', currentLeague, 'Team data:', teamData);
                
                const newTeam = await api.createTeam(teamData);
                
                // Refresh teams list to ensure we have the latest data
                const refreshedTeams = await api.getTeams(currentLeague);
                setTeams(refreshedTeams);
                
                setSuccess(`Team created successfully in ${currentLeague.toUpperCase()}`);
            }

            setShowSlideOver(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            const errorMessage = err?.message || (editingTeam ? 'Failed to update team' : 'Failed to create team');
            setError(errorMessage);
            console.error('Team submission error:', err);
            
            // Log additional details for debugging
            if (err?.message) {
                console.error('Error details:', {
                    message: err.message,
                    currentLeague,
                    formData: { ...formData, league: currentLeague }
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await api.deleteTeam(teamId);
            setTeams(teams.filter(t => t.id !== teamId));
            setSelectedTeams(prev => {
                const next = new Set(prev);
                next.delete(teamId);
                return next;
            });
            setSuccess('Team deleted successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to delete team');
            console.error('Team deletion error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTeams.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedTeams.size} team(s)?`)) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await Promise.all(Array.from(selectedTeams).map(id => api.deleteTeam(id)));
            setTeams(teams.filter(t => !selectedTeams.has(t.id)));
            setSelectedTeams(new Set());
            setSuccess(`${selectedTeams.size} team(s) deleted successfully`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to delete teams');
            console.error('Bulk deletion error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedTeams.size === filteredAndSortedTeams.length) {
            setSelectedTeams(new Set());
        } else {
            setSelectedTeams(new Set(filteredAndSortedTeams.map(t => t.id)));
        }
    };

    const toggleSelectTeam = (teamId: string) => {
        setSelectedTeams(prev => {
            const next = new Set(prev);
            if (next.has(teamId)) {
                next.delete(teamId);
            } else {
                next.add(teamId);
            }
            return next;
        });
    };

    const handleAddAllWPLTeams = async () => {
        if (!confirm('This will add all 5 WPL teams with their logos, colors, and descriptions. Continue?')) return;
        
        setIsSubmitting(true);
        setError(null);
        const results: string[] = [];

        try {
            for (const team of wplTeams) {
                try {
                    const teamData: Omit<Team, 'id' | 'players'> = {
                        ...team,
                        league: 'wpl' as const // Ensure WPL league with proper type
                    };
                    const newTeam = await api.createTeam(teamData);
                    results.push(`✅ ${newTeam.name}`);
                } catch (err: any) {
                    results.push(`❌ ${team.name}: ${err?.message || 'Failed'}`);
                }
            }
            
            // Refresh teams list
            await fetchTeams();
            
            setSuccess(`WPL teams added! ${results.join(', ')}`);
            setTimeout(() => setSuccess(null), 8000);
        } catch (err) {
            setError('Failed to add some WPL teams. Check console for details.');
            console.error('WPL teams addition error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
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

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <AuroraBackground />
            <AdminSidebar currentPage="/ipl-admin-2026/teams" />

            <div className="flex-1 relative z-10">
                <div className="p-6 lg:p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 backdrop-blur-sm">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                Teams
                            </h1>
                            <p className="text-gray-400">
                                Manage {currentLeague === 'wpl' ? 'WPL' : 'IPL'} 2026 teams
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {currentLeague === 'wpl' && teams.filter(t => t.league === 'wpl').length === 0 && (
                                <button
                                    onClick={handleAddAllWPLTeams}
                                    className="group relative px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                    title="Add all 5 WPL teams at once"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add All WPL Teams
                                </button>
                            )}
                            <button
                                onClick={handleAddTeam}
                                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add Team
                            </button>
                        </div>
                    </div>

                    {selectedTeams.size > 0 && (
                        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl backdrop-blur-sm flex items-center justify-between">
                            <span className="text-purple-300">{selectedTeams.size} team(s) selected</span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-all duration-200 disabled:opacity-50"
                            >
                                Delete Selected
                            </button>
                        </div>
                    )}

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 lg:p-6 border-b border-white/10 bg-white/5">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search teams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="p-12">
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                            <div className="w-12 h-12 bg-white/10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-5 bg-white/10 rounded w-1/4" />
                                                <div className="h-4 bg-white/10 rounded w-1/6" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : filteredAndSortedTeams.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {searchQuery ? 'No teams found' : 'No teams yet'}
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first team'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={handleAddTeam}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                                    >
                                        Add Your First Team
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-xl">
                                            <tr className="border-b border-white/10">
                                                <th className="px-6 py-4 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTeams.size === filteredAndSortedTeams.length && filteredAndSortedTeams.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/20"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 text-left">
                                                    <button
                                                        onClick={() => handleSort('name')}
                                                        className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                                                    >
                                                        Team
                                                        {sortField === 'name' && (
                                                            sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left">
                                                    <button
                                                        onClick={() => handleSort('shortName')}
                                                        className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                                                    >
                                                        Code
                                                        {sortField === 'shortName' && (
                                                            sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Colors
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredAndSortedTeams.map((team) => (
                                                <tr
                                                    key={team.id}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTeams.has(team.id)}
                                                            onChange={() => toggleSelectTeam(team.id)}
                                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/20"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                                                style={{ background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)` }}
                                                            >
                                                                {(() => {
                                                                    const anim = getAnimatedLogoPath(team.id);
                                                                    if (anim.endsWith('.json')) {
                                                                        return (
                                                                            <div className="w-8 h-8">
                                                                                <RCBLottie className="w-8 h-8" />
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (anim.endsWith('rcb_logo_premium.svg')) {
                                                                        return (
                                                                            <div className="w-8 h-8 flex items-center justify-center">
                                                                                <RCBLionLogo className="w-full h-full" />
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return team.logo ? (
                                                                        <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                                                                    ) : (
                                                                        team.shortName.substring(0, 2)
                                                                    );
                                                                })()}
                                                            </div>
                                                            <span className="font-semibold text-white">{team.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                            {team.shortName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-6 h-6 rounded border-2 border-white/20 shadow-sm"
                                                                style={{ backgroundColor: team.colors.primary }}
                                                                title={team.colors.primary}
                                                            />
                                                            <div
                                                                className="w-6 h-6 rounded border-2 border-white/20 shadow-sm"
                                                                style={{ backgroundColor: team.colors.secondary }}
                                                                title={team.colors.secondary}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-400 line-clamp-1 max-w-xs">
                                                            {team.description}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditTeam(team)}
                                                                disabled={isSubmitting}
                                                                className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 hover:text-purple-300 transition-all disabled:opacity-50"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTeam(team.id)}
                                                                disabled={isSubmitting}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="lg:hidden divide-y divide-white/5">
                                    {filteredAndSortedTeams.map((team) => (
                                        <div key={team.id} className="p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start gap-3 mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeams.has(team.id)}
                                                    onChange={() => toggleSelectTeam(team.id)}
                                                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/20"
                                                />
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)` }}
                                                >
                                                    {(() => {
                                                        const anim = getAnimatedLogoPath(team.id);
                                                        if (anim.endsWith('.json')) {
                                                            return (
                                                                <div className="w-10 h-10">
                                                                    <RCBLottie className="w-10 h-10" />
                                                                </div>
                                                            );
                                                        }

                                                        if (anim.endsWith('rcb_logo_premium.svg')) {
                                                            return (
                                                                <div className="w-10 h-10 flex items-center justify-center">
                                                                    <RCBLionLogo className="w-full h-full" />
                                                                </div>
                                                            );
                                                        }

                                                        return team.logo ? (
                                                            <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
                                                        ) : (
                                                            team.shortName.substring(0, 2)
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-white mb-1">{team.name}</h3>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                        {team.shortName}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{team.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded border-2 border-white/20"
                                                        style={{ backgroundColor: team.colors.primary }}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded border-2 border-white/20"
                                                        style={{ backgroundColor: team.colors.secondary }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditTeam(team)}
                                                        disabled={isSubmitting}
                                                        className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-all disabled:opacity-50"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeam(team.id)}
                                                        disabled={isSubmitting}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all disabled:opacity-50"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showSlideOver && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSlideOver(false)} />

                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md transform transition-all duration-300 ease-out">
                            <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border-l border-white/10 shadow-2xl">
                                <div className="px-6 py-6 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white">
                                            {editingTeam ? 'Edit Team' : 'Add Team'}
                                        </h2>
                                        <button
                                            onClick={() => setShowSlideOver(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                        >
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                placeholder="Royal Challengers Bengaluru"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Short Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.shortName}
                                                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                placeholder="RCB"
                                                maxLength={4}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Logo URL
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.logo}
                                                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                League
                                            </label>
                                            {editingTeam ? (
                                                // When editing, allow changing league
                                                <select
                                                    value={formData.league}
                                                    onChange={(e) => setFormData({ ...formData, league: e.target.value as 'ipl' | 'wpl' })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                    required
                                                >
                                                    <option value="ipl">IPL (Indian Premier League)</option>
                                                    <option value="wpl">WPL (Women's Premier League)</option>
                                                </select>
                                            ) : (
                                                // When creating, show current league as read-only
                                                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                                                    <span className="font-medium">
                                                        {currentLeague === 'wpl' ? 'WPL (Women\'s Premier League)' : 'IPL (Indian Premier League)'}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        (Based on current league selection)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                                placeholder="Enter team description"
                                                rows={4}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Primary Color
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={formData.colors.primary}
                                                        onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, primary: e.target.value } })}
                                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.colors.primary}
                                                        onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, primary: e.target.value } })}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                        placeholder="#6B46C1"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Secondary Color
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={formData.colors.secondary}
                                                        onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, secondary: e.target.value } })}
                                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.colors.secondary}
                                                        onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, secondary: e.target.value } })}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                        placeholder="#FFD700"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-sm text-gray-400 mb-3">Color Preview</p>
                                            <div
                                                className="h-24 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                                style={{ background: `linear-gradient(135deg, ${formData.colors.primary} 0%, ${formData.colors.secondary} 100%)` }}
                                            >
                                                {formData.shortName || 'TEAM'}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Trophy Information</h3>
                                            <div className="space-y-3 mb-4">
                                                {formData.trophies.map((trophy, index) => (
                                                    <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={trophy.year}
                                                                onChange={(e) => {
                                                                    const newTrophies = [...formData.trophies];
                                                                    newTrophies[index].year = parseInt(e.target.value) || 0;
                                                                    setFormData({ ...formData, trophies: newTrophies });
                                                                }}
                                                                className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                                placeholder="2023"
                                                                min="2007"
                                                                max={new Date().getFullYear()}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={trophy.name}
                                                                onChange={(e) => {
                                                                    const newTrophies = [...formData.trophies];
                                                                    newTrophies[index].name = e.target.value;
                                                                    setFormData({ ...formData, trophies: newTrophies });
                                                                }}
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                                placeholder="Trophy name"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, trophies: formData.trophies.filter((_, i) => i !== index) });
                                                            }}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, trophies: [...formData.trophies, { year: new Date().getFullYear(), name: '' }] });
                                                }}
                                                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add Trophy
                                            </button>
                                        </div>

                                        <div className="border-t border-white/10 pt-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Home Grounds</h3>
                                            <div className="space-y-3 mb-4">
                                                {formData.homeGrounds.map((ground, index) => (
                                                    <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <input
                                                            type="text"
                                                            value={ground}
                                                            onChange={(e) => {
                                                                const newGrounds = [...formData.homeGrounds];
                                                                newGrounds[index] = e.target.value;
                                                                setFormData({ ...formData, homeGrounds: newGrounds });
                                                            }}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                            placeholder="Home ground name"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, homeGrounds: formData.homeGrounds.filter((_, i) => i !== index) });
                                                            }}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (formData.homeGrounds.length < 3) {
                                                        setFormData({ ...formData, homeGrounds: [...formData.homeGrounds, ''] });
                                                    }
                                                }}
                                                disabled={formData.homeGrounds.length >= 3}
                                                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add Home Ground (Max 3)
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="px-6 py-6 border-t border-white/10 bg-white/5 flex gap-3">
                                    <button
                                        onClick={() => setShowSlideOver(false)}
                                        type="button"
                                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : (editingTeam ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
