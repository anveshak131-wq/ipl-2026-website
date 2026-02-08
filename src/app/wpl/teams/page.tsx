'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Sparkles, Trophy, Users, Target, Star, Zap, Shield, Crown, Flame, TrendingUp, Award, Medal } from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors, getWPLGlassmorphism, getWPLHoverGlow } from '@/lib/wplColors';

type SortOption = 'name' | 'titles' | 'players' | 'performance';
type TitleFilter = 'all' | '0' | '1' | '2+';
type ViewMode = 'grid' | 'list';

function WPLTeamsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentLeague, setCurrentLeague } = useLeague();
    
    // Enhanced mouse tracking for cursor animations
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);
    const [cursorVariant, setCursorVariant] = useState('default');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(heroRef, { once: false, amount: 0.3 });
    
    // Scroll-based animations
    const { scrollYProgress } = useScroll();
    const scaleValue = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
    const rotateValue = useTransform(scrollYProgress, [0, 1], [0, 5]);
    const opacityValue = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    
    // Spring animations for smooth interactions
    const springConfig = { damping: 25, stiffness: 300 };
    const scaleSpring = useSpring(scaleValue, springConfig);
    const rotateSpring = useSpring(rotateValue, springConfig);

    // Mouse tracking event handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setMousePosition({ x, y });
                cursorX.set(x);
                cursorY.set(y);
            }
        };

        const handleMouseEnter = () => setCursorVariant('hover');
        const handleMouseLeave = () => setCursorVariant('default');

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseenter', handleMouseEnter);
            container.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseenter', handleMouseEnter);
                container.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [cursorX, cursorY]);

    // Set league to WPL when page loads
    useEffect(() => {
        if (currentLeague !== 'wpl') {
            setCurrentLeague('wpl');
        }
    }, [currentLeague, setCurrentLeague]);

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

        const newUrl = params.toString() ? `?${params.toString()}` : '/wpl/teams';
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
            console.log('WPL Teams page: Fetching teams for league: wpl');
            try {
                const [teamsData, playersData, matchesData] = await Promise.all([
                    api.getTeams('wpl'),
                    api.getPlayers(undefined, 'wpl').catch((e) => {
                        console.warn('Failed to fetch players:', e);
                        return [];
                    }),
                    api.getMatches('wpl').catch((e) => {
                        console.warn('Failed to fetch matches:', e);
                        return [];
                    })
                ]);

                // Helper function to normalize team/player IDs for matching
                const normalizeId = (id: string | number | undefined): string => {
                    if (!id) return '';
                    const str = String(id).trim();
                    const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
                    return numMatch ? numMatch[0] : str.toLowerCase();
                };
                
                console.log('WPL Teams page: Fetched players:', playersData?.length || 0);
                
                // Deduplicate teams by shortName (API returns duplicates with string/number IDs)
                const uniqueTeamsMap = new Map();
                teamsData.forEach(team => {
                    if (!isPlaceholderTeam(team)) {
                        // Use shortName as key since some teams have duplicate IDs (as string vs number)
                        if (!uniqueTeamsMap.has(team.shortName)) {
                            uniqueTeamsMap.set(team.shortName, team);
                        }
                    }
                });
                const uniqueTeamsData = Array.from(uniqueTeamsMap.values());
                console.log(`WPL Teams: Original count: ${teamsData.length}, After deduplication: ${uniqueTeamsData.length}`);
                
                const teamsWithPlayers = uniqueTeamsData
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
                            const leagueMatch = !player.league || player.league === 'wpl';
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
                            console.log(`WPL Teams page: Matched ${fetchedPlayers.length} players for team ${team.name} (ID: ${team.id})`);
                        } else if (playersData && playersData.length > 0) {
                            console.warn(`WPL Teams page: No players matched for team ${team.name} (ID: ${team.id}). Sample player teamIds:`, 
                                playersData.slice(0, 3).map(p => p.teamId));
                        }
                        
                        // Preserve original players if they exist and fetched players is empty
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
                console.error('WPL Teams page: Error in fetchTeams:', error);
                try {
                    const teamsData = await api.getTeams('wpl');
                    setTeams(teamsData.map(team => ({ 
                        ...team, 
                        // Preserve original players if they exist
                        players: team.players || [] 
                    })));
                } catch (err) {
                    console.error('WPL Teams page: Complete failure:', err);
                    setTeams([]);
                }
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

    // Custom team ordering function for WPL
    const getCustomTeamOrder = (team: Team): number => {
        // Priority order: RCB-W first, then others
        const shortName = team.shortName.toLowerCase();
        
        // RCB-W gets highest priority (0)
        if (shortName === 'rcb-w') {
            return 0;
        }
        
        // All other teams get normal priority (1)
        return 1;
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

        if (showFavoritesFirst) {
            result = [
                ...result.filter(t => favorites.includes(t.id)),
                ...result.filter(t => !favorites.includes(t.id))
            ];
        }

        return result;
    }, [teams, debouncedSearch, sortBy, titleFilter, showFavoritesFirst, favorites, homeGroundFilter, matches]);

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
        <div className="min-h-screen wpl-teams-page">
            <Navbar />
            <div className="wpl-teams-aurora">
                <AuroraBackground />
            </div>
            <WPLFloatingParticles />

            <main className="relative py-16 min-h-screen wpl-teams-shell" ref={containerRef}>
                {/* Enhanced gradient overlays using exact WPL colors */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${WPLColors.gradientMid}1A, ${WPLColors.pinkRGBA[10]}, ${WPLColors.roseRGBA[10]})`,
                  }}
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to top, ${WPLColors.gradientMid}33, transparent, ${WPLColors.gradientEnd}33)`,
                  }}
                />
                
                {/* Enhanced floating orbs with mouse tracking */}
                <motion.div 
                  className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl"
                  style={{ 
                    background: `radial-gradient(circle, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[15]}, transparent)`,
                  }}
                  animate={{
                    y: [0, -25, 0],
                    x: [0, 15, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div 
                  className="absolute bottom-10 right-20 w-96 h-96 rounded-full blur-3xl"
                  style={{ 
                    background: `radial-gradient(circle, ${WPLColors.pinkRGBA[20]}, ${WPLColors.roseRGBA[10]}, transparent)`,
                  }}
                  animate={{
                    y: [0, 25, 0],
                    x: [0, -15, 0],
                    scale: [1, 1.12, 1],
                  }}
                  transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                />
                
                {/* Enhanced animated aurora effect */}
                <motion.div
                  className="absolute w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-40"
                  style={{
                    background: `conic-gradient(from 0deg, ${WPLColors.purple}, ${WPLColors.pink}, #06b6d4, ${WPLColors.purple})`,
                  }}
                  animate={{
                    x: ['0%', '40%', '20%', '0%'],
                    y: ['0%', '20%', '40%', '0%'],
                    rotate: [0, 180, 360],
                    scale: [1, 1.2, 0.9, 1],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none opacity-30"
                  style={{
                    background: `conic-gradient(from 180deg, #06b6d4, #8b5cf6, #f472b6, #06b6d4)`,
                  }}
                  animate={{
                    x: ['50%', '10%', '40%', '50%'],
                    y: ['50%', '30%', '10%', '50%'],
                    rotate: [360, 180, 0],
                    scale: [0.9, 1.1, 1, 0.9],
                  }}
                  transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Enhanced Hero Header with scroll animations */}
                    <motion.div 
                        ref={heroRef}
                        className="mb-12 text-center wpl-teams-hero"
                        style={{
                            scale: scaleSpring,
                            rotate: rotateSpring,
                            opacity: opacityValue,
                        }}
                    >
                        <div className="wpl-teams-hero-panel">
                            {/* Animated badge */}
                            <motion.div 
                                className="inline-flex items-center space-x-2 mb-6"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                whileHover={{ 
                                    scale: 1.05,
                                    boxShadow: `0 0 30px ${WPLColors.purpleRGBA[40]}`
                                }}
                            >
                                <motion.span 
                                    className="wpl-teams-badge px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 cursor-default"
                                    style={{
                                        ...getWPLGlassmorphism('purple', 25),
                                        color: WPLColors.textAccent,
                                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                                    }}
                                    whileHover={{
                                        background: WPLColors.purpleRGBA[35],
                                        borderColor: WPLColors.purpleRGBA[50],
                                    }}
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </motion.div>
                                    WPL 2026 ELITE TEAMS
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Crown className="w-4 h-4 text-yellow-400" />
                                    </motion.div>
                                </motion.span>
                            </motion.div>
                            
                            {/* Enhanced main heading with staggered animation */}
                            <motion.h1 
                                className="wpl-teams-title text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-none"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            >
                                <motion.span 
                                    className="block mb-2"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    Meet the
                                </motion.span>
                                <GradientText 
                                    gradient="from-purple-400 via-pink-400 to-rose-400" 
                                    animate
                                    className="block"
                                >
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.8, delay: 0.5 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        Champions
                                    </motion.span>
                                </GradientText>
                            </motion.h1>
                            
                            {/* Enhanced subtitle with icons */}
                            <motion.p 
                                className="wpl-teams-subtitle text-gray-300 text-xl max-w-3xl mx-auto mb-8 leading-relaxed"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                <motion.span 
                                    className="inline-flex items-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    Explore all elite franchises competing for glory in the Women's Premier League
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                </motion.span>
                            </motion.p>
                            
                            {/* Enhanced CTA buttons */}
                            <motion.div 
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                            >
                                <motion.button
                                    className="group relative px-8 py-4 rounded-xl font-bold text-white overflow-hidden transition-all duration-300"
                                    style={{
                                        background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[80]}, ${WPLColors.pinkRGBA[80]})`,
                                        boxShadow: `0 10px 30px ${WPLColors.purpleRGBA[30]}`,
                                    }}
                                    whileHover={{ 
                                        scale: 1.05,
                                        boxShadow: `0 15px 40px ${WPLColors.purpleRGBA[50]}`,
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Explore Teams
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                        </motion.div>
                                    </span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        initial={false}
                                        animate={{ opacity: [0, 0.3, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </motion.button>
                                
                                <motion.button
                                    className="px-8 py-4 rounded-xl font-bold text-white border-2 transition-all duration-300"
                                    style={{
                                        borderColor: WPLColors.purpleRGBA[50],
                                        background: getWPLGlassmorphism('purple', 15).background,
                                    }}
                                    whileHover={{ 
                                        scale: 1.05,
                                        borderColor: WPLColors.purpleRGBA[80],
                                        background: WPLColors.purpleRGBA[25],
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Compare Teams
                                    </span>
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Enhanced Quick Stats Cards with staggered animations */}
                    <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 wpl-teams-stats"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <motion.div
                            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[25]}, ${WPLColors.purpleRGBA[15]})`,
                                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: `0 20px 40px ${WPLColors.purpleRGBA[40]}`,
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[40]}, ${WPLColors.pinkRGBA[30]})`,
                                }}
                            />
                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="mb-3"
                                >
                                    <Shield className="w-6 h-6 text-purple-300" />
                                </motion.div>
                                <p className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-1">Teams</p>
                                <motion.p 
                                    className="text-3xl font-black text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.9 }}
                                >
                                    {totalTeams}
                                </motion.p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${WPLColors.pinkRGBA[25]}, ${WPLColors.pinkRGBA[15]})`,
                                border: `1px solid ${WPLColors.pinkRGBA[30]}`,
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: `0 20px 40px ${WPLColors.pinkRGBA[40]}`,
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${WPLColors.pinkRGBA[40]}, ${WPLColors.roseRGBA[30]})`,
                                }}
                            />
                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="mb-3"
                                >
                                    <Users className="w-6 h-6 text-pink-300" />
                                </motion.div>
                                <p className="text-xs uppercase tracking-wider text-pink-300 font-bold mb-1">Players</p>
                                <motion.p 
                                    className="text-3xl font-black text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 1.0 }}
                                >
                                    {totalPlayers}
                                </motion.p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${WPLColors.roseRGBA[25]}, ${WPLColors.roseRGBA[15]})`,
                                border: `1px solid ${WPLColors.roseRGBA[30]}`,
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: `0 20px 40px ${WPLColors.roseRGBA[40]}`,
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${WPLColors.roseRGBA[40]}, ${WPLColors.orangeRGBA[30]})`,
                                }}
                            />
                            <div className="relative z-10">
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="mb-3"
                                >
                                    <Star className="w-6 h-6 text-rose-300" />
                                </motion.div>
                                <p className="text-xs uppercase tracking-wider text-rose-300 font-bold mb-1">Overseas</p>
                                <motion.p 
                                    className="text-3xl font-black text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 1.1 }}
                                >
                                    {totalOverseas}
                                </motion.p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[25]}, ${WPLColors.pinkRGBA[15]})`,
                                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: `0 20px 40px ${WPLColors.purpleRGBA[40]}`,
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[40]}, ${WPLColors.pinkRGBA[30]})`,
                                }}
                            />
                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="mb-3"
                                >
                                    <Crown className="w-6 h-6 text-yellow-400" />
                                </motion.div>
                                <p className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-1">Captains</p>
                                <motion.p 
                                    className="text-3xl font-black text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 1.2 }}
                                >
                                    {totalCaptains}
                                </motion.p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Filter Toolbar - Same as teams page but with WPL styling */}
                    <div className="sticky top-16 md:top-20 z-40 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 backdrop-blur-xl bg-slate-900/80 border-y border-purple-500/20 py-4 shadow-lg wpl-teams-toolbar">
                        <div className="flex flex-col gap-4">
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
                                    placeholder="Search WPL teams..."
                                    className="wpl-teams-input w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-purple-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
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

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Titles:</span>
                                    {(['all', '0', '1', '2+'] as TitleFilter[]).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setTitleFilter(filter)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${titleFilter === filter
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40'
                                                : 'bg-slate-800/60 text-gray-300 border border-purple-500/20 hover:border-purple-400/50'
                                                }`}
                                        >
                                            {filter === 'all' ? 'All' : filter === '2+' ? (
                                                <span className="flex items-center gap-1">
                                                    2+ <CustomEmoji type="trophy" size={14} />
                                                </span>
                                            ) : filter === '0' ? 'No titles' : (
                                                <span className="flex items-center gap-1">
                                                    1 <CustomEmoji type="trophy" size={14} />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-6 w-px bg-purple-500/20" />

                                {allHomeGrounds.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Ground:</span>
                                            <select
                                                value={homeGroundFilter}
                                                onChange={(e) => setHomeGroundFilter(e.target.value)}
                                                className="wpl-teams-select px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-white border border-purple-500/20 focus:border-purple-400 focus:outline-none hover:border-purple-400/50 transition-all cursor-pointer"
                                            >
                                                <option value="all">All Grounds</option>
                                                {allHomeGrounds.map(ground => (
                                                    <option key={ground} value={ground}>{ground}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="h-6 w-px bg-purple-500/20" />
                                    </>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="wpl-teams-select px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-white border border-purple-500/20 focus:border-purple-400 focus:outline-none hover:border-purple-400/50 transition-all cursor-pointer"
                                    >
                                        <option value="name">Name (A-Z)</option>
                                        <option value="titles">Titles (Most first)</option>
                                        <option value="players">Squad size</option>
                                        <option value="performance">Recent Performance</option>
                                    </select>
                                </div>

                                <div className="h-6 w-px bg-purple-500/20" />

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">View:</span>
                                    <div className="flex rounded-lg border border-purple-500/20 overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-3 py-1.5 text-xs font-bold transition-all ${
                                                viewMode === 'grid'
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                    : 'bg-slate-800/60 text-gray-300 hover:bg-purple-500/20'
                                            }`}
                                        >
                                            Grid
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-3 py-1.5 text-xs font-bold transition-all ${
                                                viewMode === 'list'
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                    : 'bg-slate-800/60 text-gray-300 hover:bg-purple-500/20'
                                            }`}
                                        >
                                            List
                                        </button>
                                    </div>
                                </div>

                                <div className="h-6 w-px bg-purple-500/20" />

                                <button
                                    onClick={() => setShowComparison(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                                >
                                    <CustomEmoji type="target" size={14} /> Compare
                                </button>

                                {favorites.length > 0 && (
                                    <>
                                        <div className="h-6 w-px bg-purple-500/20" />
                                        <button
                                            onClick={() => setShowFavoritesFirst(!showFavoritesFirst)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showFavoritesFirst
                                                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                                                    : 'bg-slate-800/60 text-gray-300 border border-purple-500/20 hover:border-pink-500/50'
                                                }`}
                                        >
                                            <CustomEmoji type="star" size={14} /> Favorites first
                                        </button>
                                    </>
                                )}

                                {hasActiveFilters && (
                                    <>
                                        <div className="flex-1" />
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 transition-all"
                                        >
                                            Clear all
                                        </button>
                                    </>
                                )}
                            </div>

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
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/60 border border-purple-500/20 mb-6">
                                <Icon name="team" size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No teams found</h3>
                            <p className="text-gray-400 max-w-md mx-auto mb-8">
                                {searchTerm ? `No teams match "${searchTerm}"` : 'No teams match your filters'}
                            </p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-xl transition-all"
                            >
                                Clear all filters
                            </button>
                        </div>
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
                                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: index * 0.05,
                                        }}
                                        whileHover={{ 
                                            y: -12, 
                                            scale: 1.03,
                                            transition: { duration: 0.3 }
                                        }}
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

export default function WPLTeamsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen wpl-teams-page">
                <Navbar />
                <div className="wpl-teams-aurora">
                    <AuroraBackground />
                </div>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
                <Footer />
            </div>
        }>
            <WPLTeamsPageContent />
        </Suspense>
    );
}
