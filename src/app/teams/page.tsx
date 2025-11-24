'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EnhancedTeamCard from '@/components/teams/EnhancedTeamCard';
import PlayerModal from '@/components/teams/PlayerModal';
import { Team, Player } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TeamCardSkeleton from '@/components/teams/TeamCardSkeleton';

type SortOption = 'name' | 'titles' | 'players';
type TitleFilter = 'all' | '0' | '1' | '2+';

export default function TeamsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [teams, setTeams] = useState<Team[]>([]);
    const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>((searchParams?.get('sort') as SortOption) || 'name');
    const [titleFilter, setTitleFilter] = useState<TitleFilter>((searchParams?.get('titles') as TitleFilter) || 'all');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showFavoritesFirst, setShowFavoritesFirst] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 200);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Update URL with filters
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (sortBy !== 'name') params.set('sort', sortBy);
        if (titleFilter !== 'all') params.set('titles', titleFilter);

        const newUrl = params.toString() ? `?${params.toString()}` : '/teams';
        window.history.replaceState({}, '', newUrl);
    }, [searchTerm, sortBy, titleFilter]);

    // Load favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('favoriteTeams');
        if (saved) setFavorites(JSON.parse(saved));
    }, []);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teamsData = await api.getTeams();
                const playersData = await api.getPlayers();

                const teamsWithPlayers = teamsData.map(team => ({
                    ...team,
                    players: playersData.filter(player => player.teamId === team.id)
                }));

                setTeams(teamsWithPlayers);
            } catch (error) {
                console.error('Failed to fetch teams:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const toggleFavorite = (teamId: string) => {
        const newFavorites = favorites.includes(teamId)
            ? favorites.filter(id => id !== teamId)
            : [...favorites, teamId];
        setFavorites(newFavorites);
        localStorage.setItem('favoriteTeams', JSON.stringify(newFavorites));
    };

    const handlePlayerClick = (player: Player) => {
        setSelectedPlayer(player);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlayer(null);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSortBy('name');
        setTitleFilter('all');
        setShowFavoritesFirst(false);
    };

    // Filter and sort teams
    const filteredAndSortedTeams = useMemo(() => {
        let result = teams;

        // Search filter
        if (debouncedSearch) {
            const normalized = debouncedSearch.trim().toLowerCase();
            result = result.filter((team) =>
                team.name.toLowerCase().includes(normalized) ||
                team.shortName.toLowerCase().includes(normalized)
            );
        }

        // Title filter
        if (titleFilter !== 'all') {
            result = result.filter((team) => {
                const trophyCount = team.trophies?.length || 0;
                if (titleFilter === '0') return trophyCount === 0;
                if (titleFilter === '1') return trophyCount === 1;
                if (titleFilter === '2+') return trophyCount >= 2;
                return true;
            });
        }

        // Sort
        result = [...result].sort((a, b) => {
            if (sortBy === 'titles') {
                return (b.trophies?.length || 0) - (a.trophies?.length || 0);
            }
            if (sortBy === 'players') {
                return (b.players?.length || 0) - (a.players?.length || 0);
            }
            return a.name.localeCompare(b.name);
        });

        // Favorites first
        if (showFavoritesFirst) {
            result = [
                ...result.filter(t => favorites.includes(t.id)),
                ...result.filter(t => !favorites.includes(t.id))
            ];
        }

        return result;
    }, [teams, debouncedSearch, sortBy, titleFilter, showFavoritesFirst, favorites]);

    const totalTeams = teams.length;
    const totalPlayers = teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
    const totalOverseas = teams.reduce(
        (sum, team) => sum + (team.players?.filter((p) => p.nationality !== 'India').length || 0),
        0
    );
    const totalCaptains = teams.reduce(
        (sum, team) => sum + (team.players?.filter((p) => p.isCaptain).length || 0),
        0
    );

    const hasActiveFilters = searchTerm || sortBy !== 'name' || titleFilter !== 'all' || showFavoritesFirst;

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="relative py-16 min-h-screen">
                <AuroraBackground />

                <div className="absolute top-20 left-10 w-96 h-96 bg-ipl-blue-light/10 rounded-full blur-3xl -z-10 animate-float" />
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Header */}
                    <div className="mb-8 animate-slide-up">
                        <div className="inline-flex items-center space-x-2 mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                                <Icon name="cricket" size={16} /> IPL 2026 TEAMS
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            Meet the <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Champions</span>
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl">
                            Explore all 10 elite franchises competing for glory in the world's biggest T20 league
                        </p>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 px-4 py-3 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <p className="text-xs uppercase tracking-wide text-blue-300 font-semibold">Teams</p>
                            <p className="text-2xl font-black text-white">{totalTeams}</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 px-4 py-3 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold">Players</p>
                            <p className="text-2xl font-black text-white">{totalPlayers}</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 px-4 py-3 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <p className="text-xs uppercase tracking-wide text-amber-300 font-semibold">Overseas</p>
                            <p className="text-2xl font-black text-white">{totalOverseas}</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 px-4 py-3 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">Captains</p>
                            <p className="text-2xl font-black text-white">{totalCaptains}</p>
                        </div>
                    </div>

                    {/* Sticky Filter Toolbar */}
                    <div className="sticky top-16 md:top-20 z-40 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 backdrop-blur-xl bg-slate-900/80 border-y border-white/10 py-4 shadow-lg">
                        <div className="flex flex-col gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search teams by name or abbreviation..."
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/30 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Filters and Sort Row */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Title Filter Chips */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Titles:</span>
                                    {(['all', '0', '1', '2+'] as TitleFilter[]).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setTitleFilter(filter)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${titleFilter === filter
                                                ? 'bg-ipl-gold text-slate-900 shadow-lg shadow-ipl-gold/40'
                                                : 'bg-slate-800/60 text-gray-300 border border-white/10 hover:border-ipl-gold/50'
                                                }`}
                                        >
                                            {filter === 'all' ? 'All' : filter === '2+' ? '2+ 🏆' : filter === '0' ? 'No titles' : '1 🏆'}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-6 w-px bg-white/10" />

                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-white border border-white/10 focus:border-ipl-gold focus:outline-none hover:border-ipl-gold/50 transition-all cursor-pointer"
                                    >
                                        <option value="name">Name (A-Z)</option>
                                        <option value="titles">Titles (Most first)</option>
                                        <option value="players">Squad size</option>
                                    </select>
                                </div>

                                <div className="h-6 w-px bg-white/10" />

                                {/* Favorites Toggle */}
                                {favorites.length > 0 && (
                                    <button
                                        onClick={() => setShowFavoritesFirst(!showFavoritesFirst)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showFavoritesFirst
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                                            : 'bg-slate-800/60 text-gray-300 border border-white/10 hover:border-rose-500/50'
                                            }`}
                                    >
                                        ⭐ Favorites first
                                    </button>
                                )}

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <>
                                        <div className="flex-1" />
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 transition-all"
                                        >
                                            Clear all
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Results Count */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">
                                    Showing <span className="font-bold text-white">{filteredAndSortedTeams.length}</span> of <span className="font-bold text-white">{totalTeams}</span> teams
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Teams Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <TeamCardSkeleton key={i} delay={i * 100} />
                            ))}
                        </div>
                    ) : filteredAndSortedTeams.length === 0 ? (
                        <div className="text-center py-20 animate-fade-in">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/60 border border-white/10 mb-6">
                                <Icon name="team" size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No teams found</h3>
                            <p className="text-gray-400 max-w-md mx-auto mb-8">
                                {searchTerm ? `No teams match "${searchTerm}"` : 'No teams match your filters'}
                            </p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-ipl-blue-light to-ipl-purple text-white font-bold hover:shadow-xl transition-all"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAndSortedTeams.map((team, index) => (
                                <div key={team.id} style={{ animationDelay: `${index * 50}ms` }}>
                                    <EnhancedTeamCard
                                        team={team}
                                        onPlayerClick={handlePlayerClick}
                                        isFavorite={favorites.includes(team.id)}
                                        onToggleFavorite={() => toggleFavorite(team.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Enhanced Statistics Section */}
                    {!isLoading && teams.length > 0 && (
                        <div className="mt-20 animate-fade-in">
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12 group hover:border-ipl-gold/50 transition-all duration-500">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10 animate-gradient" />
                                </div>

                                <div className="relative text-center">
                                    <div className="inline-flex items-center space-x-2 mb-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2">
                                            <Icon name="stats" size={16} /> LEAGUE INSIGHTS
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                        Championship <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Breakdown</span>
                                    </h2>
                                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                                        Historical performance metrics across all IPL franchises
                                    </p>

                                    {/* Trophy Distribution */}
                                    <div className="max-w-3xl mx-auto mb-8">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {teams
                                                .filter(t => t.trophies && t.trophies.length > 0)
                                                .sort((a, b) => (b.trophies?.length || 0) - (a.trophies?.length || 0))
                                                .slice(0, 5)
                                                .map((team) => (
                                                    <div key={team.id} className="text-center">
                                                        <div className="text-sm font-bold text-gray-400 mb-2">{team.shortName}</div>
                                                        <div className="flex items-center justify-center gap-1 text-2xl">
                                                            {[...Array(team.trophies?.length || 0)].map((_, i) => (
                                                                <span key={i}>🏆</span>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">{team.trophies?.length} titles</div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => router.push('/stats')}
                                        className="group relative overflow-hidden rounded-xl font-bold py-3.5 px-10 transition-all duration-500 transform hover:scale-105 cursor-pointer bg-gradient-to-r from-ipl-purple to-ipl-gold text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Explore Full Statistics
                                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <PlayerModal
                player={selectedPlayer}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                teamColors={selectedPlayer ? teams.find(t => t.id === selectedPlayer.teamId)?.colors : undefined}
                teamData={selectedPlayer ? teams.find(t => t.id === selectedPlayer.teamId) : undefined}
            />
        </div>
    );
}
