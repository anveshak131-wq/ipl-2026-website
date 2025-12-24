'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EnhancedTeamCard from '@/components/teams/EnhancedTeamCard';
import PlayerModal from '@/components/teams/PlayerModal';
import TeamComparisonTool from '@/components/teams/TeamComparisonTool';
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
import { Search, Filter, Grid3x3, List, X, Star, Trophy, Users, Globe, Award, TrendingUp, Sparkles } from 'lucide-react';

type SortOption = 'name' | 'titles' | 'players' | 'performance';
type TitleFilter = 'all' | '0' | '1' | '2+';
type ViewMode = 'grid' | 'list';

function TeamsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { currentLeague, setCurrentLeague } = useLeague();

    // Set league based on pathname
    useEffect(() => {
        if (pathname.startsWith('/wpl/teams') || pathname === '/wpl/teams') {
            setCurrentLeague('wpl');
        } else if (pathname === '/teams' && currentLeague === 'wpl') {
            router.push('/wpl/teams');
        } else if (pathname === '/teams' && currentLeague !== 'wpl') {
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
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showFavoritesFirst, setShowFavoritesFirst] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

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
            try {
                const [teamsData, playersData, matchesData] = await Promise.all([
                    api.getTeams(currentLeague),
                    api.getPlayers(undefined, currentLeague).catch(() => []),
                    api.getMatches(currentLeague).catch(() => [])
                ]);

                const normalizeId = (id: string | number | undefined): string => {
                    if (!id) return '';
                    const str = String(id).trim();
                    const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
                    return numMatch ? numMatch[0] : str.toLowerCase();
                };
                
                const teamsWithPlayers = teamsData
                    .filter(team => {
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
                        
                        const fetchedPlayers = (playersData || []).filter(player => {
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
                            
                            return teamIdVariations.some(tv => 
                                playerTeamIdVariations.some(pv => pv === tv)
                            );
                        });
                        
                        const finalPlayers = fetchedPlayers.length > 0 
                            ? fetchedPlayers 
                            : (team.players || []);
                        
                        return {
                            ...team,
                            players: finalPlayers
                        };
                    });

                setTeams(teamsWithPlayers);
                setMatches(matchesData || []);
            } catch (error) {
                console.error('Error fetching teams:', error);
                try {
                    const teamsData = await api.getTeams(currentLeague);
                    const filteredTeams = teamsData
                        .filter(team => {
                            if (currentLeague === 'wpl' && isPlaceholderTeam(team)) {
                                return false;
                            }
                            return true;
                        })
                        .map(team => ({ 
                            ...team, 
                            players: team.players || [] 
                        }));
                    setTeams(filteredTeams);
                } catch (err) {
                    console.error('Complete failure:', err);
                    setTeams([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, [currentLeague]);

    // Real-time player updates - refresh teams when players are updated
    useEffect(() => {
        const handlePlayerUpdate = async (event: CustomEvent) => {
            const { type } = event.detail || {};
            
            if (type === 'player-updated' || type === 'player-created' || type === 'player-deleted') {
                console.log('Player update detected, refreshing teams...');
                // Re-fetch teams and players
                try {
                    const [teamsData, playersData, matchesData] = await Promise.all([
                        api.getTeams(currentLeague),
                        api.getPlayers(undefined, currentLeague).catch(() => []),
                        api.getMatches(currentLeague).catch(() => [])
                    ]);

                    const normalizeId = (id: string | number | undefined): string => {
                        if (!id) return '';
                        const str = String(id).trim();
                        const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
                        return numMatch ? numMatch[0] : str.toLowerCase();
                    };
                    
                    const teamsWithPlayers = teamsData
                        .filter(team => {
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
                            
                            const fetchedPlayers = (playersData || []).filter(player => {
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
                                
                                return teamIdVariations.some(tv => 
                                    playerTeamIdVariations.some(pv => pv === tv)
                                );
                            });
                            
                            const finalPlayers = fetchedPlayers.length > 0 
                                ? fetchedPlayers 
                                : (team.players || []);
                            
                            return {
                                ...team,
                                players: finalPlayers
                            };
                        });

                    setTeams(teamsWithPlayers);
                    setMatches(matchesData || []);
                } catch (error) {
                    console.error('Error refreshing teams after player update:', error);
                }
            }
        };

        window.addEventListener('admin-data-updated', handlePlayerUpdate as EventListener);
        
        return () => {
            window.removeEventListener('admin-data-updated', handlePlayerUpdate as EventListener);
        };
    }, [currentLeague]);

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

    const allHomeGrounds = useMemo(() => {
        const grounds = new Set<string>();
        teams.forEach(team => {
            team.homeGrounds?.forEach(ground => grounds.add(ground));
        });
        return Array.from(grounds).sort();
    }, [teams]);

    const getCustomTeamOrder = (team: Team): number => {
        const shortName = team.shortName.toLowerCase();
        if (shortName === 'rcb') return 0;
        if (shortName === 'mi') return 1;
        if (shortName === 'csk') return 2;
        return 3;
    };

    const filteredAndSortedTeams = useMemo(() => {
        let result = teams;

        if (debouncedSearch) {
            const normalized = debouncedSearch.trim().toLowerCase();
            result = result.filter((team) =>
                team.name.toLowerCase().includes(normalized) ||
                team.shortName.toLowerCase().includes(normalized)
            );
        }

        if (titleFilter !== 'all') {
            result = result.filter((team) => {
                const trophyCount = team.trophies?.length || 0;
                if (titleFilter === '0') return trophyCount === 0;
                if (titleFilter === '1') return trophyCount === 1;
                if (titleFilter === '2+') return trophyCount >= 2;
                return true;
            });
        }

        if (homeGroundFilter !== 'all') {
            result = result.filter((team) => 
                team.homeGrounds?.some(ground => ground === homeGroundFilter)
            );
        }

        result = [...result].sort((a, b) => {
            const orderA = getCustomTeamOrder(a);
            const orderB = getCustomTeamOrder(b);
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
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

        if (showFavoritesFirst) {
            result = [
                ...result.filter(t => favorites.includes(t.id)),
                ...result.filter(t => !favorites.includes(t.id))
            ];
        }

        return result;
    }, [teams, debouncedSearch, sortBy, titleFilter, homeGroundFilter, showFavoritesFirst, favorites, matches]);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
            <Navbar />
                <AuroraBackground />

            <main className="relative">
                {/* Premium Hero Section */}
                <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
                    {/* Animated Background Orbs */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-40"
                            style={{
                                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)',
                                top: '-20%',
                                left: '-10%',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.4, 0.6, 0.4],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-30"
                            style={{
                                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4), rgba(236, 72, 153, 0.3), transparent)',
                                bottom: '-15%',
                                right: '-10%',
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                        />
                    </div>

                    {/* Animated Grid Pattern */}
                    <div 
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '50px 50px'
                        }}
                    />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center py-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-8"
                        >
                            <motion.span
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl"
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                <Sparkles className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {currentLeague === 'wpl' ? 'WPL 2026' : 'IPL 2026'} TEAMS
                                </span>
                            </motion.span>
                            </motion.div>

                            <motion.h1 
                            className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <span className="block text-white mb-4">Elite</span>
                            <GradientText 
                                gradient="from-blue-400 via-purple-400 to-pink-400" 
                                animate 
                                className="text-8xl md:text-9xl lg:text-[10rem]"
                            >
                                Franchises
                            </GradientText>
                            </motion.h1>

                            <motion.p 
                            className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            style={{
                                textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)'
                            }}
                            >
                            Discover the <span className="font-bold text-white">{totalTeams} powerhouse teams</span> competing for cricket supremacy. 
                            Explore squads, track performances, and dive into championship legacies.
                            </motion.p>

                        {/* Premium Quick Stats */}
                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            {[
                                { 
                                    label: 'Teams', 
                                    value: totalTeams, 
                                    icon: Users, 
                                    color: 'from-blue-500/30 to-blue-600/20',
                                    borderColor: 'border-blue-500/40',
                                    textColor: 'text-blue-300',
                                    glow: 'rgba(59, 130, 246, 0.3)'
                                },
                                { 
                                    label: 'Players', 
                                    value: totalPlayers, 
                                    icon: Users, 
                                    color: 'from-purple-500/30 to-purple-600/20',
                                    borderColor: 'border-purple-500/40',
                                    textColor: 'text-purple-300',
                                    glow: 'rgba(168, 85, 247, 0.3)'
                                },
                                { 
                                    label: 'Overseas', 
                                    value: totalOverseas, 
                                    icon: Globe, 
                                    color: 'from-amber-500/30 to-amber-600/20',
                                    borderColor: 'border-amber-500/40',
                                    textColor: 'text-amber-300',
                                    glow: 'rgba(245, 158, 11, 0.3)'
                                },
                                { 
                                    label: 'Captains', 
                                    value: totalCaptains, 
                                    icon: Award, 
                                    color: 'from-emerald-500/30 to-emerald-600/20',
                                    borderColor: 'border-emerald-500/40',
                                    textColor: 'text-emerald-300',
                                    glow: 'rgba(16, 185, 129, 0.3)'
                                },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className={`group relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 ${stat.borderColor} bg-gradient-to-br ${stat.color} p-8`}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                                    whileHover={{ scale: 1.1, y: -10 }}
                                    style={{
                                        boxShadow: `0 20px 60px ${stat.glow}`
                                    }}
                                >
                                    {/* Hover glow */}
                                    <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                                        style={{ background: stat.glow }}
                                    />
                                    
                                    <div className="relative z-10">
                                        <motion.div
                                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} border-2 ${stat.borderColor} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                                            style={{ boxShadow: `0 8px 30px ${stat.glow}` }}
                                        >
                                            <stat.icon className={`w-8 h-8 ${stat.textColor}`} />
                        </motion.div>
                                        <p className={`text-5xl font-black mb-2 text-white`} style={{ textShadow: `0 4px 20px ${stat.glow}` }}>
                                            {stat.value}
                                        </p>
                                        <p className={`text-sm font-bold uppercase tracking-widest ${stat.textColor}`}>
                                            {stat.label}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            className="flex flex-wrap items-center justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                        >
                            <motion.button
                                onClick={() => setShowComparison(true)}
                                className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-black text-lg shadow-2xl"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    boxShadow: '0 20px 60px rgba(168, 85, 247, 0.5)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative z-10 flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5" />
                                    Compare Teams
                                </span>
                            </motion.button>
                            
                            <motion.button
                                onClick={() => router.push('/stats')}
                                className="px-8 py-4 rounded-2xl backdrop-blur-2xl border-2 border-white/20 bg-white/5 text-white font-black text-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Trophy className="w-5 h-5" />
                                View Statistics
                            </motion.button>
                        </motion.div>
                        </div>
                </section>

                {/* Premium Filter & Search Section */}
                <section className="relative z-20 -mt-20 mb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="relative rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{
                                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10 p-6 md:p-8">
                                {/* Premium Search Bar */}
                                <div className="relative mb-6 group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl opacity-0 group-focus-within:opacity-50 transition-opacity duration-500" />
                            <div className="relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search teams by name or abbreviation..."
                                            className="w-full pl-16 pr-14 py-5 rounded-2xl bg-slate-800/60 border-2 border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg font-medium"
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
                            </div>

                                {/* Filters Row */}
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Title Filter */}
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Titles:</span>
                                <div className="flex items-center gap-2">
                                    {(['all', '0', '1', '2+'] as TitleFilter[]).map((filter) => (
                                                <motion.button
                                            key={filter}
                                            onClick={() => setTitleFilter(filter)}
                                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                        titleFilter === filter
                                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg'
                                                            : 'bg-slate-800/60 text-gray-300 border-2 border-white/10 hover:border-amber-500/50 hover:bg-slate-700/60'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {filter === 'all' ? 'All' : filter === '2+' ? '2+' : filter === '0' ? 'None' : '1'}
                                                </motion.button>
                                            ))}
                                        </div>
                                                </div>

                                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                                {/* Home Ground Filter */}
                                {allHomeGrounds.length > 0 && (
                                    <>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Ground:</span>
                                            <select
                                                value={homeGroundFilter}
                                                onChange={(e) => setHomeGroundFilter(e.target.value)}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer"
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

                                    {/* Sort */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer"
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
                                        <span className="text-sm font-bold uppercase tracking-wider text-gray-300">View:</span>
                                        <div className="flex rounded-xl border-2 border-white/10 overflow-hidden bg-slate-800/60">
                                            <motion.button
                                            onClick={() => setViewMode('grid')}
                                                className={`px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                                                viewMode === 'grid'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                        : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                                <Grid3x3 className="w-4 h-4" />
                                            Grid
                                            </motion.button>
                                            <motion.button
                                            onClick={() => setViewMode('list')}
                                                className={`px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                                                viewMode === 'list'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                        : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                                <List className="w-4 h-4" />
                                            List
                                            </motion.button>
                                    </div>
                                </div>

                                {/* Favorites Toggle */}
                                {favorites.length > 0 && (
                                        <>
                                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                                            <motion.button
                                        onClick={() => setShowFavoritesFirst(!showFavoritesFirst)}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                                    showFavoritesFirst
                                                        ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-rose-300 border-2 border-rose-500/50 shadow-lg'
                                                        : 'bg-slate-800/60 text-gray-300 border-2 border-white/10 hover:border-rose-500/50 hover:bg-slate-700/60'
                                                }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Star className={`w-4 h-4 ${showFavoritesFirst ? 'fill-rose-300' : ''}`} />
                                                Favorites
                                            </motion.button>
                                        </>
                                        )}

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <>
                                        <div className="flex-1" />
                                            <motion.button
                                            onClick={clearFilters}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-2 border-red-500/50 hover:from-red-500/30 hover:to-red-600/30 transition-all flex items-center gap-2"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                                <X className="w-4 h-4" />
                                            Clear all
                                            </motion.button>
                                    </>
                                )}
                            </div>

                            {/* Results Count */}
                                <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400">
                                            Showing <span className="font-black text-white text-lg">{filteredAndSortedTeams.length}</span> of <span className="font-black text-white text-lg">{totalTeams}</span> teams
                                </span>
                                        {hasActiveFilters && (
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                Filtered
                                            </span>
                                        )}
                            </div>
                        </div>
                    </div>
                        </motion.div>
                    </div>
                </section>

                {/* Premium Teams Grid */}
                <section className="relative z-10 pb-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                className="text-center py-32"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <motion.div 
                                    className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-white/10 mb-8"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <Users className="w-20 h-20 text-gray-400" />
                                </motion.div>
                                <h3 className="text-4xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    No teams found
                                </h3>
                                <p className="text-gray-400 text-xl max-w-md mx-auto mb-10">
                                {searchTerm ? `No teams match "${searchTerm}"` : 'No teams match your filters'}
                            </p>
                                <motion.button
                                onClick={clearFilters}
                                    className="px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                            >
                                    <X className="w-5 h-5" />
                                Clear all filters
                                </motion.button>
                            </motion.div>
                    ) : (
                        <motion.div 
                            className={viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                    : "space-y-6"
                            }
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                            staggerChildren: 0.08,
                                    },
                                },
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredAndSortedTeams.map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        layout
                                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                        transition={{
                                                duration: 0.6,
                                            delay: index * 0.05,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        whileHover={{ 
                                                y: -15, 
                                                scale: 1.05,
                                            transition: { duration: 0.3 }
                                        }}
                                            className="relative group"
                                        >
                                            {/* Enhanced Glow effect */}
                                            <div 
                                                className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10"
                                                style={{
                                                    background: `linear-gradient(135deg, ${team.colors.primary}50, ${team.colors.secondary}50)`
                                                }}
                                            />
                                            
                                        <EnhancedTeamCard
                                            team={team}
                                            onPlayerClick={handlePlayerClick}
                                            isFavorite={favorites.includes(team.id)}
                                            onToggleFavorite={() => toggleFavorite(team.id)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                    </div>
                </section>

                {/* Premium Statistics Section */}
                    {!isLoading && teams.length > 0 && (
                    <section className="relative z-10 py-24">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <motion.div
                                className="relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-12 md:p-16 group"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                style={{
                                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                {/* Animated Background */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                                    <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                                </div>

                                <div className="relative z-10">
                                    <motion.div 
                                        className="text-center mb-16"
                                        initial={{ opacity: 0, y: -20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <motion.span
                                            className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 mb-8"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <Trophy className="w-5 h-5 text-blue-400" />
                                            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                CHAMPIONSHIP LEGACY
                                        </span>
                                        </motion.span>
                                        
                                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                                            Trophy{' '}
                                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                Champions
                                            </span>
                                    </h2>
                                        
                                        <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                                            Historical performance metrics and championship legacy across all franchises
                                    </p>
                                    </motion.div>

                                    {/* Trophy Distribution */}
                                    <motion.div 
                                        className="max-w-5xl mx-auto mb-12"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                                            {teams
                                                .filter(t => t.trophies && t.trophies.length > 0)
                                                .sort((a, b) => (b.trophies?.length || 0) - (a.trophies?.length || 0))
                                                .slice(0, 5)
                                                .map((team, index) => (
                                                    <motion.div 
                                                        key={team.id} 
                                                        className="text-center group"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                        whileHover={{ scale: 1.15, y: -10 }}
                                                    >
                                                        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border-2 border-white/10 group-hover:border-amber-500/50 transition-all duration-300 backdrop-blur-xl">
                                                            <div className="text-xl font-black text-white mb-4" style={{ color: team.colors.primary }}>
                                                                {team.shortName}
                                                            </div>
                                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                            {[...Array(team.trophies?.length || 0)].map((_, i) => (
                                                                    <motion.span
                                                                        key={i}
                                                                        initial={{ scale: 0, rotate: -180 }}
                                                                        whileInView={{ scale: 1, rotate: 0 }}
                                                                        viewport={{ once: true }}
                                                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                                                        whileHover={{ scale: 1.5, rotate: 20 }}
                                                                    >
                                                                        <Trophy className="w-10 h-10 text-amber-400 fill-amber-400" />
                                                                    </motion.span>
                                                            ))}
                                                        </div>
                                                            <div className="text-base font-bold text-amber-300">
                                                                {team.trophies?.length} {team.trophies?.length === 1 ? 'Title' : 'Titles'}
                                                    </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                </div>
                                    </motion.div>

                                    <motion.div
                                        className="text-center"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <motion.button
                                        onClick={() => router.push('/stats')}
                                            className="group relative overflow-hidden rounded-2xl font-black py-5 px-12 text-lg transition-all duration-500 cursor-pointer bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl"
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                boxShadow: '0 20px 60px rgba(168, 85, 247, 0.5)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative z-10 flex items-center gap-3">
                                            Explore Full Statistics
                                                <TrendingUp className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
                                        </span>
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </motion.div>
                            </div>
                    </section>
                    )}
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
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner />
                </div>
                <Footer />
            </div>
        }>
            <TeamsPageContent />
        </Suspense>
    );
}
