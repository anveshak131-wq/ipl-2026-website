'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EnhancedTeamCard from '@/components/teams/EnhancedTeamCard';
import PlayerModal from '@/components/teams/PlayerModal';
import TeamComparisonTool from '@/components/teams/TeamComparisonTool';
import TeamQuickStatsPreview from '@/components/teams/TeamQuickStatsPreview';
import { Team, Player, Match } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import TeamCardSkeleton from '@/components/teams/TeamCardSkeleton';
import { CustomEmoji } from '@/components/emoji/Emoji';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';

type SortOption = 'name' | 'titles' | 'players' | 'performance';
type TitleFilter = 'all' | '0' | '1' | '2+';
type ViewMode = 'grid' | 'list';

function TeamsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { currentLeague, setCurrentLeague } = useLeague();

    // Set league based on pathname, but preserve current league if already set
    useEffect(() => {
        if (pathname.startsWith('/wpl/teams') || pathname === '/wpl/teams') {
            setCurrentLeague('wpl');
        } else if (pathname === '/teams' && currentLeague === 'wpl') {
            // If user is on WPL and navigates to /teams, redirect to /wpl/teams
            router.push('/wpl/teams');
        } else if (pathname === '/teams' && currentLeague !== 'wpl') {
            // Only set to IPL if not already on WPL
            setCurrentLeague('ipl');
        }
    }, [pathname, setCurrentLeague, currentLeague, router]);

    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>((searchParams?.get('sort') as SortOption) || 'name');
    const [titleFilter, setTitleFilter] = useState<TitleFilter>((searchParams?.get('titles') as TitleFilter) || 'all');
    const [homeGroundFilter, setHomeGroundFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showComparison, setShowComparison] = useState(false);
    const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
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
            setIsLoading(true);
            console.log('Teams page: Fetching teams for league:', currentLeague);
            console.log('Teams page: Current teams state:', teams.length);
            try {
                const [teamsData, playersData, matchesData] = await Promise.all([
                    api.getTeams(currentLeague),
                    api.getPlayers(undefined, currentLeague).catch((e) => {
                        console.warn('Failed to fetch players:', e);
                        return [];
                    }),
                    api.getMatches(currentLeague).catch((e) => {
                        console.warn('Failed to fetch matches:', e);
                        return [];
                    })
                ]);

                console.log(`Teams page: Loaded ${teamsData.length} teams, ${playersData.length} players, ${matchesData.length} matches for ${currentLeague}`);
                console.log('Teams page: Teams data:', teamsData);

                if (teamsData.length === 0) {
                    console.warn('Teams page: No teams returned! Check API or fallback data.');
                }

                // Helper function to normalize team/player IDs for matching
                const normalizeId = (id: string | number | undefined): string => {
                    if (!id) return '';
                    const str = String(id).trim();
                    const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
                    return numMatch ? numMatch[0] : str.toLowerCase();
                };
                
                const teamsWithPlayers = teamsData
                    .filter(team => {
                        // For WPL, filter out placeholder teams
                        if (currentLeague === 'wpl' && isPlaceholderTeam(team)) {
                            return false;
                        }
                        return true;
                    })
                    .map(team => {
                        const normalizedTeamId = normalizeId(team.id);
                        const teamIdVariations = [
                            String(team.id),
                            normalizedTeamId,
                            `team${normalizedTeamId}`,
                            String(team.id).replace(/^team/i, ''),
                            String(team.id).toLowerCase(),
                            String(team.id).toUpperCase()
                        ];
                        
                        // Get players from fetched data, matching by teamId with comprehensive variations
                        const fetchedPlayers = (playersData || []).filter(player => {
                            // Check if player league matches
                            const leagueMatch = !player.league || !currentLeague || player.league === currentLeague;
                            if (!leagueMatch) return false;
                            
                            const normalizedPlayerTeamId = normalizeId(player.teamId);
                            const playerTeamIdVariations = [
                                String(player.teamId),
                                normalizedPlayerTeamId,
                                `team${normalizedPlayerTeamId}`,
                                String(player.teamId).replace(/^team/i, ''),
                                String(player.teamId).toLowerCase(),
                                String(player.teamId).toUpperCase()
                            ];
                            
                            // Check if any variation matches
                            return teamIdVariations.some(tv => 
                                playerTeamIdVariations.some(pv => pv === tv)
                            );
                        });
                        
                        if (fetchedPlayers.length > 0) {
                            console.log(`Teams page: Matched ${fetchedPlayers.length} players for team ${team.name} (ID: ${team.id})`);
                        } else if (playersData && playersData.length > 0) {
                            console.warn(`Teams page: No players matched for team ${team.name} (ID: ${team.id}). Sample player teamIds:`, 
                                playersData.slice(0, 3).map(p => p.teamId));
                        }
                        
                        // Always use fetched players if available, otherwise use team's original players
                        const finalPlayers = fetchedPlayers.length > 0 
                            ? fetchedPlayers 
                            : (team.players || []);
                        
                        return {
                            ...team,
                            players: finalPlayers
                        };
                    });

                console.log('Teams page: Setting teams state with', teamsWithPlayers.length, 'teams');
                setTeams(teamsWithPlayers);
                setMatches(matchesData || []);
            } catch (error) {
                console.error('Teams page: Error in fetchTeams:', error);
                // Still try to display teams even if players fail
                try {
                    const teamsData = await api.getTeams(currentLeague);
                    console.log(`Teams page: Fallback - Loaded ${teamsData.length} teams for ${currentLeague}`);
                    if (teamsData.length === 0) {
                        console.error('Teams page: Even fallback returned 0 teams!');
                    }
                    const filteredTeams = teamsData
                        .filter(team => {
                            // For WPL, filter out placeholder teams
                            if (currentLeague === 'wpl' && isPlaceholderTeam(team)) {
                                return false;
                            }
                            return true;
                        })
                        .map(team => ({ 
                            ...team, 
                            // Preserve original players if they exist
                            players: team.players || [] 
                        }));
                    setTeams(filteredTeams);
                } catch (err) {
                    console.error('Teams page: Complete failure:', err);
                    setTeams([]); // Set empty array so UI shows "no teams" message
                }
            } finally {
                setIsLoading(false);
            }
        
        return undefined;
        return undefined;
        return undefined;
        return undefined;
        return undefined;};

        fetchTeams();
    }, [currentLeague]); // Re-fetch when league changes

    // Debug: Log when teams state changes
    useEffect(() => {
        console.log('Teams page: Teams state updated. Count:', teams.length);
        if (teams.length > 0) {
            console.log('Teams page: First team:', teams[0]);
        }
    }, [teams]);

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
        setHomeGroundFilter('all');
        setShowFavoritesFirst(false);
    };

    // Calculate team performance (win rate from recent matches)
    const calculateTeamPerformance = (team: Team): number => {
        const teamMatches = matches.filter(
            (m) => m.status === 'completed' && (m.team1.id === team.id || m.team2.id === team.id)
        );
        if (teamMatches.length === 0) return 0;
        const wins = teamMatches.filter((m) => {
            if (!m.result) return false;
            return m.result.includes(team.shortName) || m.result.includes(team.name);
        }).length;
        return (wins / teamMatches.length) * 100;
    };

    // Get all unique home grounds
    const allHomeGrounds = useMemo(() => {
        const grounds = new Set<string>();
        teams.forEach(team => {
            team.homeGrounds?.forEach(ground => grounds.add(ground));
        });
        return Array.from(grounds).sort();
    }, [teams]);

    // Custom team ordering function
    const getCustomTeamOrder = (team: Team): number => {
        // Priority order: RCB, MI, CSK first, then others
        const shortName = team.shortName.toLowerCase();
        
        // RCB gets highest priority (0)
        if (shortName === 'rcb') {
            return 0;
        }
        
        // MI gets second priority (1)
        if (shortName === 'mi') {
            return 1;
        }
        
        // CSK gets third priority (2)
        if (shortName === 'csk') {
            return 2;
        }
        
        // All other teams get normal priority (3)
        return 3;
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

        // Home ground filter
        if (homeGroundFilter !== 'all') {
            result = result.filter((team) => 
                team.homeGrounds?.some(ground => ground === homeGroundFilter)
            );
        }

        // Sort with custom ordering
        result = [...result].sort((a, b) => {
            // First apply custom ordering
            const orderA = getCustomTeamOrder(a);
            const orderB = getCustomTeamOrder(b);
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            // If same custom order, apply regular sort
            if (sortBy === 'titles') {
                return (b.trophies?.length || 0) - (a.trophies?.length || 0);
            }
            if (sortBy === 'players') {
                return (b.players?.length || 0) - (a.players?.length || 0);
            }
            if (sortBy === 'performance') {
                return calculateTeamPerformance(b) - calculateTeamPerformance(a);
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

    const hasActiveFilters = searchTerm || sortBy !== 'name' || titleFilter !== 'all' || homeGroundFilter !== 'all' || showFavoritesFirst;

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="relative py-16 min-h-screen">
                <AuroraBackground />

                <div className="absolute top-20 left-10 w-96 h-96 bg-ipl-blue-light/10 rounded-full blur-3xl -z-10 animate-float" />
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Enhanced Hero Header */}
                    <AnimatedSection direction="down" delay={0.1}>
                        <motion.div 
                            className="mb-12 relative"
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Background Glow Effect */}
                            <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
                            
                            <div className="relative z-10">
                            <motion.div 
                                    className="inline-flex items-center space-x-2 mb-6 group"
                                whileHover={{ scale: 1.05 }}
                            >
                                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/20 backdrop-blur-xl text-white flex items-center gap-2 hover:from-blue-500/30 hover:via-purple-500/30 hover:to-pink-500/30 transition-all duration-300 shadow-lg shadow-blue-500/20">
                                        <Icon name="cricket" size={18} /> 
                                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold">
                                            IPL 2026 TEAMS
                                        </span>
                                </span>
                            </motion.div>
                                
                            <motion.h1 
                                    className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-tight"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                    <span className="block mb-2">Meet the</span>
                                    <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate className="text-7xl md:text-8xl lg:text-9xl">
                                        Champions
                                    </GradientText>
                            </motion.h1>
                                
                            <motion.p 
                                    className="text-gray-300 text-xl md:text-2xl max-w-3xl leading-relaxed mb-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                    Explore all <span className="font-bold text-white">{totalTeams} elite franchises</span> competing for glory in the world's biggest T20 league. Discover squads, stats, and legendary moments.
                            </motion.p>
                                
                                {/* Quick Action Buttons */}
                                <motion.div 
                                    className="flex flex-wrap items-center gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <motion.button
                                        onClick={() => setShowComparison(true)}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2 group"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CustomEmoji type="target" size={20} />
                                        Compare Teams
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={() => router.push('/stats')}
                                        className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CustomEmoji type="chart" size={20} />
                                        View Statistics
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatedSection>

                    {/* Enhanced Quick Stats Cards */}
                    <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <motion.div 
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-600/15 to-blue-700/10 border border-blue-500/30 backdrop-blur-xl p-6 hover:border-blue-400/50 transition-all duration-500"
                            whileHover={{ scale: 1.05, y: -5 }}
                            style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icon name="team" size={24} className="text-blue-300" />
                        </div>
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                                <p className="text-xs uppercase tracking-wider text-blue-300 font-bold mb-2">Teams</p>
                                <p className="text-4xl font-black text-white mb-1">{totalTeams}</p>
                                <p className="text-xs text-blue-200/70">Elite Franchises</p>
                        </div>
                        </motion.div>
                        
                        <motion.div 
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-600/15 to-purple-700/10 border border-purple-500/30 backdrop-blur-xl p-6 hover:border-purple-400/50 transition-all duration-500"
                            whileHover={{ scale: 1.05, y: -5 }}
                            style={{ boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CustomEmoji type="people" size={24} />
                        </div>
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    </div>
                                <p className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">Players</p>
                                <p className="text-4xl font-black text-white mb-1">{totalPlayers}</p>
                                <p className="text-xs text-purple-200/70">Total Squad Size</p>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/15 to-amber-700/10 border border-amber-500/30 backdrop-blur-xl p-6 hover:border-amber-400/50 transition-all duration-500"
                            whileHover={{ scale: 1.05, y: -5 }}
                            style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CustomEmoji type="globe" size={24} />
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                                <p className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-2">Overseas</p>
                                <p className="text-4xl font-black text-white mb-1">{totalOverseas}</p>
                                <p className="text-xs text-amber-200/70">International Stars</p>
                        </div>
                        </motion.div>
                        
                        <motion.div 
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/15 to-emerald-700/10 border border-emerald-500/30 backdrop-blur-xl p-6 hover:border-emerald-400/50 transition-all duration-500"
                            whileHover={{ scale: 1.05, y: -5 }}
                            style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CustomEmoji type="lightning" size={24} />
                        </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                                <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-2">Captains</p>
                                <p className="text-4xl font-black text-white mb-1">{totalCaptains}</p>
                                <p className="text-xs text-emerald-200/70">Team Leaders</p>
                    </div>
                        </motion.div>
                    </motion.div>

                    {/* Enhanced Sticky Filter Toolbar */}
                    <motion.div 
                        className="sticky top-16 md:top-20 z-40 -mx-4 px-4 sm:mx-0 sm:px-0 mb-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <div className="relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-white/10 shadow-2xl">
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10 p-6 flex flex-col gap-6">
                                {/* Enhanced Search Bar */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                            <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-blue-400 transition-colors">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search teams by name or abbreviation..."
                                            className="w-full pl-14 pr-12 py-4 rounded-xl bg-slate-800/60 border-2 border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                                />
                                {searchTerm && (
                                            <motion.button
                                        onClick={() => setSearchTerm('')}
                                                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                    >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                            </motion.button>
                                )}
                                    </div>
                            </div>

                                {/* Enhanced Filters and Sort Row */}
                                <div className="flex flex-wrap items-center gap-4">
                                {/* Title Filter Chips */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider flex items-center gap-2">
                                            <CustomEmoji type="trophy" size={18} />
                                            Titles:
                                        </span>
                                <div className="flex items-center gap-2">
                                    {(['all', '0', '1', '2+'] as TitleFilter[]).map((filter) => (
                                                <motion.button
                                            key={filter}
                                            onClick={() => setTitleFilter(filter)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                        titleFilter === filter
                                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/50'
                                                            : 'bg-slate-800/60 text-gray-300 border-2 border-white/10 hover:border-amber-500/50 hover:bg-slate-700/60'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                {filter === 'all' ? 'All' : filter === '2+' ? (
                                                        <span className="flex items-center gap-1.5">
                                                            2+ <CustomEmoji type="trophy" size={16} />
                                                    </span>
                                                ) : filter === '0' ? 'No titles' : (
                                                        <span className="flex items-center gap-1.5">
                                                            1 <CustomEmoji type="trophy" size={16} />
                                                    </span>
                                                )}
                                                </motion.button>
                                                ))}
                                        </div>
                                                </div>

                                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                                {/* Home Ground Filter */}
                                {allHomeGrounds.length > 0 && (
                                    <>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-300 font-bold uppercase tracking-wider">Ground:</span>
                                            <select
                                                value={homeGroundFilter}
                                                onChange={(e) => setHomeGroundFilter(e.target.value)}
                                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer"
                                            >
                                                <option value="all">All Grounds</option>
                                                {allHomeGrounds.map(ground => (
                                                    <option key={ground} value={ground}>{ground}</option>
                                                ))}
                                            </select>
                                        </div>
                                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                                    </>
                                )}

                                {/* Sort Dropdown */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer"
                                    >
                                        <option value="name">Name (A-Z)</option>
                                        <option value="titles">Titles (Most first)</option>
                                        <option value="players">Squad size</option>
                                        <option value="performance">Recent Performance</option>
                                    </select>
                                </div>

                                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                                {/* View Toggle */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider">View:</span>
                                        <div className="flex rounded-xl border-2 border-white/10 overflow-hidden bg-slate-800/60">
                                            <motion.button
                                            onClick={() => setViewMode('grid')}
                                                className={`px-4 py-2 text-sm font-bold transition-all ${
                                                viewMode === 'grid'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                        : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                            Grid
                                            </motion.button>
                                            <motion.button
                                            onClick={() => setViewMode('list')}
                                                className={`px-4 py-2 text-sm font-bold transition-all ${
                                                viewMode === 'list'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                        : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                            List
                                            </motion.button>
                                    </div>
                                </div>

                                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                                {/* Favorites Toggle */}
                                {favorites.length > 0 && (
                                        <motion.button
                                        onClick={() => setShowFavoritesFirst(!showFavoritesFirst)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                                showFavoritesFirst
                                                    ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-rose-300 border-2 border-rose-500/50 shadow-lg shadow-rose-500/20'
                                                    : 'bg-slate-800/60 text-gray-300 border-2 border-white/10 hover:border-rose-500/50 hover:bg-slate-700/60'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <CustomEmoji type="star" size={18} /> 
                                            <span>Favorites</span>
                                        </motion.button>
                                        )}

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <>
                                        <div className="flex-1" />
                                            <motion.button
                                            onClick={clearFilters}
                                                className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-2 border-red-500/50 hover:from-red-500/30 hover:to-red-600/30 transition-all flex items-center gap-2"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            Clear all
                                            </motion.button>
                                    </>
                                )}
                            </div>

                                {/* Enhanced Results Count */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400">
                                            Showing <span className="font-bold text-white text-base">{filteredAndSortedTeams.length}</span> of <span className="font-bold text-white text-base">{totalTeams}</span> teams
                                </span>
                                        {hasActiveFilters && (
                                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                Filtered
                                            </span>
                                        )}
                            </div>
                        </div>
                    </div>
                        </div>
                    </motion.div>

                    {/* Enhanced Teams Grid */}
                    {isLoading ? (
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {[...Array(6)].map((_, i) => (
                                <TeamCardSkeleton key={i} delay={i * 100} />
                            ))}
                        </motion.div>
                    ) : filteredAndSortedTeams.length === 0 ? (
                        <motion.div 
                            className="text-center py-20"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div 
                                className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-white/10 mb-8"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                <Icon name="team" size={64} className="text-gray-400" />
                            </motion.div>
                            <h3 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                No teams found
                            </h3>
                            <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
                                {searchTerm ? `No teams match "${searchTerm}"` : 'No teams match your filters'}
                            </p>
                            <motion.button
                                onClick={clearFilters}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center gap-2 mx-auto"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear all filters
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className={viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                : "space-y-4"
                            }
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.1,
                                    },
                                },
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredAndSortedTeams.map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        layout
                                        initial={{ opacity: 0, y: 50, scale: 0.9, rotateY: -15 }}
                                        animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: index * 0.05,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        whileHover={{ 
                                            y: -12, 
                                            scale: 1.03,
                                            rotateY: 5,
                                            transition: { duration: 0.3 }
                                        }}
                                        style={{ perspective: 1000 }}
                                        className="relative"
                                        onMouseEnter={() => setHoveredTeam(team.id)}
                                        onMouseLeave={() => setHoveredTeam(null)}
                                    >
                                        <EnhancedTeamCard
                                            team={team}
                                            onPlayerClick={handlePlayerClick}
                                            isFavorite={favorites.includes(team.id)}
                                            onToggleFavorite={() => toggleFavorite(team.id)}
                                        />
                                        {hoveredTeam === team.id && (
                                            <TeamQuickStatsPreview team={team} matches={matches} />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
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
                                                        <div className="flex items-center justify-center gap-1">
                                                            {[...Array(team.trophies?.length || 0)].map((_, i) => (
                                                                <CustomEmoji key={i} type="trophy" size={24} />
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

            {showComparison && (
                <TeamComparisonTool
                    teams={teams}
                    onClose={() => setShowComparison(false)}
                />
            )}
        </div>
    );
}

export default function TeamsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ipl-gold"></div>
                </div>
                <Footer />
            </div>
        }>
            <TeamsPageContent />
        </Suspense>
    );
}
