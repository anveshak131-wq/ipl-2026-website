 'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { News, Team, Player, Match } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import NewsModal from '@/components/news/NewsModal';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import NewsSkeleton from '@/components/news/NewsSkeleton';

export default function NewsPage() {
  const { currentLeague, setCurrentLeague } = useLeague();
  const [news, setNews] = useState<News[]>([]);

  // Default to IPL for news page
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/wpl/')) {
      setCurrentLeague('ipl');
    }
  }, [setCurrentLeague]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'match' | 'team' | 'player' | 'general' | 'breaking' | 'inspiration' | 'behind-the-scenes'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Advanced search states
  const [searchType, setSearchType] = useState<'all' | 'player' | 'team' | 'match'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'read'>('latest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Data for filters
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch all data in parallel
        const [newsData, teamsData, playersData, matchesData] = await Promise.all([
          api.getNews(),
          api.getTeams(currentLeague),
          api.getPlayers(undefined, currentLeague),
          api.getMatches(currentLeague)
        ]);
        
        // Filter news by league
        const filtered = newsData.filter(item => 
          !item.league || item.league === currentLeague || item.league === 'both'
        );
        
        setNews(filtered);
        setFilteredNews(filtered);
        setTeams(teamsData);
        setPlayers(playersData);
        setMatches(matchesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLeague]); // Re-fetch when league changes

  useEffect(() => {
    let filtered = [...news];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Advanced search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        // Basic search in title and summary
        if ((item.title || '').toLowerCase().includes(query) ||
            (item.summary || '').toLowerCase().includes(query) ||
            (item.content || '').toLowerCase().includes(query)) {
          return true;
        }
        
        // Search by player name
        if (searchType === 'player' || searchType === 'all') {
          if (item.linkedPlayerIds && item.linkedPlayerIds.length > 0) {
            const linkedPlayers = players.filter(p => item.linkedPlayerIds?.includes(p.id));
            if (linkedPlayers.some(p => p.name.toLowerCase().includes(query))) {
              return true;
            }
          }
        }
        
        // Search by team name
        if (searchType === 'team' || searchType === 'all') {
          if (item.linkedTeamIds && item.linkedTeamIds.length > 0) {
            const linkedTeams = teams.filter(t => item.linkedTeamIds?.includes(t.id));
            if (linkedTeams.some(t => t.name.toLowerCase().includes(query) || t.shortName.toLowerCase().includes(query))) {
              return true;
            }
          }
        }
        
        // Search by match number
        if (searchType === 'match' || searchType === 'all') {
          if (item.linkedMatchId) {
            const linkedMatch = matches.find(m => m.id === item.linkedMatchId);
            if (linkedMatch && linkedMatch.matchNumber && linkedMatch.matchNumber.toLowerCase().includes(query)) {
              return true;
            }
          }
        }
        
        return false;
      });
    }

    // Team filter
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(item => 
        item.linkedTeamIds && item.linkedTeamIds.includes(selectedTeam)
      );
    }

    // Player filter
    if (selectedPlayer !== 'all') {
      filtered = filtered.filter(item => 
        item.linkedPlayerIds && item.linkedPlayerIds.includes(selectedPlayer)
      );
    }

    // Match filter
    if (selectedMatch !== 'all') {
      filtered = filtered.filter(item =>
        item.linkedMatchId === selectedMatch
      );
    }

    // Time-based filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      filtered = filtered.filter(item => {
        const publishDate = item.publishedAt || item.createdAt;
        if (!publishDate) return false;
        const date = new Date(publishDate);

        switch (timeFilter) {
          case 'today':
            return date >= today;
          case 'week':
            return date >= weekAgo;
          case 'month':
            return date >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'popular':
        // Sort by isImportant first, then by date
        filtered.sort((a, b) => {
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'read':
        // For now, same as latest (can be enhanced with read count if available)
        filtered.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
    
    return undefined;
    return undefined;
    return undefined;}

    setFilteredNews(filtered);
  }, [selectedCategory, searchQuery, searchType, selectedTeam, selectedPlayer, selectedMatch, timeFilter, sortBy, news, teams, players, matches]);

  const featuredImportant = filteredNews.find((item) => item.isImportant);
  const remainingNews = featuredImportant
    ? filteredNews.filter((item) => item.id !== featuredImportant.id)
    : filteredNews;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlaceholderImage = () => 
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  const getImageSrc = (input?: string | { imageUrl?: string; image?: string; image_url?: string; img?: string }): string => {
    try {
      let url: string | undefined;
      
      if (!input) {
        return getPlaceholderImage();
      }
      
      if (typeof input === 'string') {
        url = input;
      } else if (typeof input === 'object') {
        url = input.image || input.imageUrl || input.image_url || input.img;
      }

      if (!url || typeof url !== 'string') {
        return getPlaceholderImage();
      }

      const trimmed = url.trim();
      if (!trimmed) return getPlaceholderImage();
      
      // Validate URL format
      try {
        new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      } catch {
        return getPlaceholderImage();
      }

      if (trimmed.startsWith('//')) return (typeof window !== 'undefined' ? window.location.protocol : 'https:') + trimmed;
      if (trimmed.startsWith('/')) return (typeof window !== 'undefined' ? window.location.origin : 'http://localhost') + trimmed;
      return trimmed;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return getPlaceholderImage();
    }
  };

  const getCategoryColor = (category: string) => {
    if (currentLeague === 'wpl') {
      // WPL color scheme: Purple/Pink theme
      switch (category) {
        case 'match':
          return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'team':
          return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
        case 'player':
          return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        case 'general':
          return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
        case 'breaking':
          return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'inspiration':
          return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
        case 'behind-the-scenes':
          return 'bg-purple-600/20 text-purple-300 border-purple-600/30';
        default:
          return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    } else {
      // IPL color scheme: Blue/Gold theme
    switch (category) {
      case 'match':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'team':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'player':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'general':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'breaking':
          return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'inspiration':
          return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'behind-the-scenes':
          return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
    }
  };

  // Dynamic title and description based on league
  const pageTitle = currentLeague === 'wpl' 
    ? 'WPL News & Updates' 
    : 'IPL News & Updates';
  
  const pageDescription = currentLeague === 'wpl'
    ? 'Stay updated with the latest news, match reports, and exclusive player insights from WPL 2026. Empowering Women\'s Cricket.'
    : 'Stay updated with the latest news, match reports, and exclusive player insights from IPL 2026';

  // League-specific colors
  const leagueColors = currentLeague === 'wpl' ? {
    primary: '#9333EA',      // Purple
    secondary: '#EC4899',     // Pink
    accent: '#F43F5E',        // Rose
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    badge: 'text-purple-300',
    hoverText: 'group-hover:text-purple-400',
    border: 'border-purple-500/50',
    hoverBorder: 'hover:border-purple-500/60',
    shadow: 'shadow-purple-500/20',
    featuredBorder: 'border-purple-500/40',
    featuredHoverBorder: 'hover:border-purple-500/60',
    featuredShadow: 'hover:shadow-purple-500/30',
    buttonGradient: 'from-purple-500 to-pink-500',
    searchFocus: 'focus:border-purple-500/50 focus:ring-purple-500/20',
  } : {
    primary: '#3B82F6',      // Blue
    secondary: '#F59E0B',     // Gold
    accent: '#6366F1',        // Indigo
    gradient: 'from-indigo-400 via-purple-400 to-pink-400',
    badge: 'text-amber-300',
    hoverText: 'group-hover:text-ipl-gold',
    border: 'border-ipl-gold/50',
    hoverBorder: 'hover:border-ipl-gold/50',
    shadow: 'shadow-ipl-gold/20',
    featuredBorder: 'border-ipl-gold/40',
    featuredHoverBorder: 'hover:border-ipl-gold/60',
    featuredShadow: 'hover:shadow-ipl-gold/30',
    buttonGradient: 'from-blue-500 to-purple-500',
    searchFocus: 'focus:border-ipl-gold/50 focus:ring-ipl-gold/20',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className={`relative py-16 min-h-screen overflow-hidden section-news-bg ${currentLeague === 'wpl' ? 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950' : ''}`}>
          <AuroraBackground />
          {currentLeague === 'wpl' && <WPLFloatingParticles />}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NewsSkeleton />
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className={`relative py-16 min-h-screen overflow-hidden section-news-bg ${currentLeague === 'wpl' ? 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950' : ''}`}>
        <AuroraBackground />
        
        {/* WPL Floating Particles */}
        {currentLeague === 'wpl' && <WPLFloatingParticles />}
        
        {/* Enhanced WPL gradient background overlay with multiple layers */}
        {currentLeague === 'wpl' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/5 to-rose-900/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.15),transparent_50%)] pointer-events-none" />
          </>
        )}
        
        {/* Enhanced floating orbs - League-aware colors */}
        <motion.div 
          className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: currentLeague === 'wpl'
              ? 'radial-gradient(circle, rgba(147, 51, 234, 0.25), rgba(236, 72, 153, 0.15), transparent)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15), transparent)',
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
          className="absolute bottom-20 left-10 w-80 h-80 rounded-full blur-3xl"
          style={{ 
            background: currentLeague === 'wpl'
              ? 'radial-gradient(circle, rgba(236, 72, 153, 0.2), rgba(244, 63, 94, 0.12), transparent)'
              : 'radial-gradient(circle, rgba(236, 72, 153, 0.2), rgba(245, 158, 11, 0.12), transparent)',
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection direction="down" delay={0.1}>
            <div className="mb-12">
              {/* League Logo and Badge */}
              <motion.div 
                className="inline-flex items-center gap-3 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {currentLeague === 'wpl' ? (
                  <div className="relative group">
                    {/* WPL Logo Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 border border-purple-500/40 backdrop-blur-sm">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xs font-black">W</span>
                      </div>
                      <span className="text-purple-300 font-bold text-sm tracking-wider">WPL</span>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                ) : (
                  <div className="w-8 h-8">
                    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="95" fill="url(#ipl-bg)" stroke="url(#ipl-border)" strokeWidth="4" />
                      <defs>
                        <radialGradient id="ipl-bg" cx="50%" cy="50%" r="80%">
                          <stop offset="0%" stopColor="#0A0E27" />
                          <stop offset="100%" stopColor="#1E293B" />
                        </radialGradient>
                        <linearGradient id="ipl-border" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0066FF" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#FF3366" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
                <motion.div 
                  className="inline-flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className={`px-3 py-1 rounded-full text-xs font-bold glass-effect ${leagueColors.badge} flex items-center gap-2 hover:bg-white/20 transition-all duration-300 cursor-default`}>
                  <Icon name="news" size={16} /> LATEST UPDATES
                </span>
                </motion.div>
              </motion.div>

              {/* Enhanced Header with Gradient Background */}
              <div className={`relative mb-8 p-8 rounded-3xl overflow-hidden ${currentLeague === 'wpl' ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-rose-900/30' : 'bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-purple-900/30'} backdrop-blur-sm border ${currentLeague === 'wpl' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                {/* Animated gradient overlay */}
                <div className={`absolute inset-0 opacity-50 ${currentLeague === 'wpl' ? 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10' : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10'} animate-pulse`} />
                
              <motion.h1 
                  className="relative text-5xl md:text-6xl font-black mb-4 tracking-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                  {currentLeague === 'wpl' ? 'WPL' : 'IPL'} News & <GradientText gradient={currentLeague === 'wpl' ? "from-purple-400 via-pink-400 to-rose-400" : "from-indigo-400 via-purple-400 to-pink-400"} animate>Updates</GradientText>
              </motion.h1>
              <motion.p 
                  className="relative text-slate-200 text-lg max-w-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                  {pageDescription}
              </motion.p>
                
                {/* Decorative icons for WPL */}
                {currentLeague === 'wpl' && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-20">
                    <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                    <svg className="w-8 h-8 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>

          <div className="mb-12 space-y-6 animate-fade-in">
            {/* Search Bar */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
              <input
                type="text"
                    placeholder={
                      searchType === 'player' ? 'Search by player name...' :
                      searchType === 'team' ? 'Search by team name...' :
                      searchType === 'match' ? 'Search by match number...' :
                      'Search news by title, content, player, team, or match...'
                    }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl px-6 py-3.5 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${leagueColors.searchFocus} transition-all duration-300 backdrop-blur-sm`}
                  />
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none ${leagueColors.searchFocus}`}
                  >
                    <option value="all">All</option>
                    <option value="player">Player</option>
                    <option value="team">Team</option>
                    <option value="match">Match</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                    showAdvancedFilters 
                      ? `${currentLeague === 'wpl' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`
                      : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  <Icon name="stats" size={20} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden rounded-xl border backdrop-blur-sm ${currentLeague === 'wpl' ? 'bg-purple-900/20 border-purple-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}
                >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${currentLeague === 'wpl' ? 'text-purple-300' : 'text-blue-300'}`}>
                      Advanced Filters
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedTeam('all');
                        setSelectedPlayer('all');
                        setSelectedMatch('all');
                        setTimeFilter('all');
                        setSortBy('latest');
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Team Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Filter by Team</label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${leagueColors.searchFocus}`}
                      >
                        <option value="all">All Teams</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.shortName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Player Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Filter by Player</label>
                      <select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${leagueColors.searchFocus}`}
                      >
                        <option value="all">All Players</option>
                        {players.slice(0, 50).map(player => (
                          <option key={player.id} value={player.id}>{player.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Match Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Filter by Match</label>
                      <select
                        value={selectedMatch}
                        onChange={(e) => setSelectedMatch(e.target.value)}
                        className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${leagueColors.searchFocus}`}
                      >
                        <option value="all">All Matches</option>
                        {matches.slice(0, 30).map(match => (
                          <option key={match.id} value={match.id}>
                            {match.matchNumber || `Match ${match.id}`} - {match.team1?.shortName} vs {match.team2?.shortName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Time Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Time Period</label>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as any)}
                        className={`w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${leagueColors.searchFocus}`}
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Sort By</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'latest', label: 'Latest', icon: 'news' as const },
                        { key: 'popular', label: 'Most Popular', icon: 'trophy' as const },
                        { key: 'read', label: 'Most Read', icon: 'stats' as const }
                      ].map(option => (
                        <button
                          key={option.key}
                          onClick={() => setSortBy(option.key as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            sortBy === option.key
                              ? `${currentLeague === 'wpl' ? 'bg-purple-500/30 text-purple-300 border-purple-500/50' : 'bg-blue-500/30 text-blue-300 border-blue-500/50'} border`
                              : 'bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <Icon name={option.icon} size={16} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-3">
              {(currentLeague === 'wpl' ? [
                { 
                  key: 'all', 
                  label: 'All News', 
                  icon: 'news' as const, 
                  color: '#9333EA' 
                },
                { 
                  key: 'breaking', 
                  label: 'Breaking', 
                  icon: 'trophy' as const, 
                  color: '#EF4444' 
                },
                { 
                  key: 'match', 
                  label: 'Match Reports', 
                  icon: 'cricket' as const, 
                  color: '#9333EA' 
                },
                { 
                  key: 'player', 
                  label: 'Player Spotlights', 
                        icon: 'user' as const,
                  color: '#F43F5E' 
                },
                { 
                  key: 'team', 
                  label: 'Team Updates', 
                  icon: 'trophy' as const, 
                  color: '#EC4899' 
                },
                { 
                  key: 'inspiration', 
                  label: 'Inspiration', 
                  icon: 'news' as const, 
                  color: '#D946EF' 
                },
                { 
                  key: 'behind-the-scenes', 
                  label: 'Behind Scenes', 
                  icon: 'news' as const, 
                  color: '#9333EA' 
                },
                { 
                  key: 'general', 
                  label: 'General', 
                  icon: 'news' as const, 
                  color: '#A855F7' 
                }
              ] : [
                { 
                  key: 'all', 
                  label: 'All News', 
                  icon: 'stats' as const, 
                  color: '#7C3AED' 
                },
                { 
                  key: 'match', 
                  label: 'Match', 
                  icon: 'cricket' as const, 
                  color: '#3B82F6' 
                },
                { 
                  key: 'team', 
                  label: 'Team', 
                  icon: 'team' as const, 
                  color: '#8B5CF6' 
                },
                { 
                  key: 'player', 
                  label: 'Player', 
                  icon: 'trophy' as const, 
                  color: '#10B981' 
                },
                { 
                  key: 'general', 
                  label: 'General', 
                  icon: 'news' as const, 
                  color: '#F59E0B' 
                }
              ]).map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key as any)}
                  className={`group relative overflow-hidden px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-500 flex items-center gap-2 transform hover:scale-105 ${
                    selectedCategory === category.key ? 'scale-105' : ''
                  }`}
                  style={selectedCategory === category.key ? {
                    background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                    color: '#fff',
                    boxShadow: `0 10px 30px ${category.color}40, 0 0 40px ${category.color}20`,
                    border: `2px solid ${category.color}60`,
                  } : {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: '#9CA3AF',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.key) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.background = `linear-gradient(135deg, ${category.color}20, ${category.color}10)`;
                      e.currentTarget.style.borderColor = `${category.color}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.key) {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {selectedCategory === category.key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  <Icon name={category.icon} size={16} />
                  <span className="relative z-10">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Featured news block (driven by isImportant, but not labeled as such for end users) */}
          {featuredImportant && (
            <section className="mt-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
              <motion.article
                className={`group relative overflow-hidden rounded-3xl border ${leagueColors.featuredBorder} ${leagueColors.featuredHoverBorder} transition-all duration-500 cursor-pointer`}
                style={{
                  background: currentLeague === 'wpl'
                    ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.15))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                }}
                whileHover={{ 
                  scale: 1.01,
                  boxShadow: currentLeague === 'wpl' 
                    ? '0 20px 60px 0 rgba(147, 51, 234, 0.4)' 
                    : '0 20px 60px 0 rgba(245, 158, 11, 0.4)',
                  transition: { duration: 0.3 }
                }}
                onClick={() => {
                  setSelectedNewsId(featuredImportant.id);
                  setIsModalOpen(true);
                }}
              >
                {/* Enhanced glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                
                <div className="h-64 md:h-80 lg:h-96 relative">
                  <motion.img
                    src={getImageSrc((featuredImportant as any).image || (featuredImportant as any).imageUrl)}
                    alt={featuredImportant.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Crect fill="%23333" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${currentLeague === 'wpl' ? 'from-black/90 via-purple-900/50 to-transparent' : 'from-black/90 via-black/50 to-transparent'}`} />
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentLeague === 'wpl' ? 'bg-gradient-to-t from-purple-500/40 via-pink-500/30 to-transparent' : 'bg-gradient-to-t from-yellow-500/30 via-blue-500/30 to-transparent'}`} />

                  {featuredImportant.category && (
                    <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${getCategoryColor(featuredImportant.category)}`}>
                        {featuredImportant.category === 'match' && <Icon name="cricket" size={10} />}
                        {featuredImportant.category === 'team' && <Icon name={currentLeague === 'wpl' ? 'trophy' : 'team'} size={10} />}
                        {featuredImportant.category === 'player' && <Icon name={currentLeague === 'wpl' ? 'user' : 'trophy'} size={10} />}
                        {featuredImportant.category === 'general' && <Icon name="news" size={10} />}
                        {featuredImportant.category === 'breaking' && <Icon name="news" size={10} />}
                        {featuredImportant.category === 'inspiration' && <Icon name="news" size={10} />}
                        {featuredImportant.category === 'behind-the-scenes' && <Icon name="news" size={10} />}
                        {(() => {
                          const cat = featuredImportant.category;
                          if (cat === 'behind-the-scenes') return 'BEHIND SCENES';
                          return cat?.toUpperCase() || '';
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 space-y-3">
                  <time className="text-xs text-gray-300 uppercase tracking-wide">
                    {formatDate(featuredImportant.publishedAt || featuredImportant.createdAt)}
                  </time>
                  <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight line-clamp-2 ${leagueColors.hoverText} transition-colors duration-300`}>
                    {featuredImportant.title}
                  </h2>
                  <p className="hidden md:block text-sm md:text-base text-gray-200 max-w-2xl line-clamp-2">
                    {featuredImportant.summary || featuredImportant.content}
                  </p>
                  <button
                    className={`mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r ${leagueColors.buttonGradient} text-white shadow-lg group-hover:shadow-xl transition-all`}
                  >
                    Read featured story
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </motion.article>
            </section>
          )}

          {filteredNews.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                {remainingNews.map((item, index) => (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ 
                      y: -12, 
                      scale: 1.03,
                      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                    }}
                    className={`group relative overflow-hidden rounded-2xl border ${leagueColors.hoverBorder} transition-all duration-500 cursor-pointer`}
                    style={{
                      background: currentLeague === 'wpl' 
                        ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(236, 72, 153, 0.1))'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    }}
                  >
                  {/* Enhanced glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentLeague === 'wpl' ? 'bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-rose-500/20' : 'bg-gradient-to-br from-yellow-500/10 via-blue-500/10 to-purple-500/10'}`} />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="h-48 overflow-hidden relative">
                    {/* Image with enhanced hover effect */}
                    <motion.img 
                      src={getImageSrc((item as any).image || (item as any).imageUrl)} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'; }} 
                    />
                    {/* Enhanced gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${currentLeague === 'wpl' ? 'from-black/80 via-purple-900/40 to-transparent' : 'from-black/80 via-black/40 to-transparent'}`} />
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentLeague === 'wpl' ? 'bg-gradient-to-t from-purple-500/30 via-pink-500/20 to-transparent' : 'bg-gradient-to-t from-yellow-500/20 via-blue-500/20 to-transparent'}`} />
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor((item as any).category)}`}>
                        {(item as any).category === 'match' && <Icon name="cricket" size={12} />}
                        {(item as any).category === 'team' && <Icon name={currentLeague === 'wpl' ? 'trophy' : 'team'} size={12} />}
                        {(item as any).category === 'player' && <Icon name={currentLeague === 'wpl' ? 'user' : 'trophy'} size={12} />}
                        {(item as any).category === 'general' && <Icon name="news" size={12} />}
                        {(item as any).category === 'breaking' && <Icon name="news" size={12} />}
                        {(item as any).category === 'inspiration' && <Icon name="news" size={12} />}
                        {(item as any).category === 'behind-the-scenes' && <Icon name="news" size={12} />}
                        {(() => {
                          const cat = (item as any).category;
                          if (cat === 'behind-the-scenes') return 'Behind Scenes';
                          if (cat === 'breaking') return 'Breaking';
                          return cat || 'general';
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="relative p-6 space-y-3 z-10">
                    <div className="flex items-center justify-between text-xs">
                      <time className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{formatDate(item.publishedAt)}</time>
                    </div>

                    <motion.h3 
                      className={`text-lg font-black text-white line-clamp-2 ${leagueColors.hoverText} transition-colors duration-300`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.title}
                    </motion.h3>

                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed group-hover:text-gray-200 transition-colors">{item.summary}</p>

                    <button 
                      onClick={() => {
                      setSelectedNewsId(item.id);
                      setIsModalOpen(true);
                      }} 
                      className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-500 transform hover:scale-105 relative overflow-hidden"
                      style={currentLeague === 'wpl' ? {
                        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.1))',
                        border: '1px solid rgba(147, 51, 234, 0.3)',
                        color: '#A855F7'
                      } : {
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(147, 51, 234, 0.1))',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        color: '#A855F7'
                      }}
                      onMouseEnter={(e) => {
                        if (currentLeague === 'wpl') {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))';
                          e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.5)';
                          e.currentTarget.style.color = '#C084FC';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(147, 51, 234, 0.2))';
                          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                          e.currentTarget.style.color = '#C084FC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentLeague === 'wpl') {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.1))';
                          e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                          e.currentTarget.style.color = '#A855F7';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(147, 51, 234, 0.1))';
                          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
                          e.currentTarget.style.color = '#A855F7';
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                      <span className="relative z-10">Read Story</span>
                      <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-gray-300 text-lg font-semibold">No news found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* News Modal */}
      <NewsModal
        isOpen={isModalOpen}
        newsId={selectedNewsId || ''}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNewsId(null);
        }}
      />
    </div>
  );
}
