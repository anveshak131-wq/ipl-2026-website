'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/data';
import type { Team, Player, Match, News } from '@/types';
import Emoji from '../emoji/Emoji';

interface SearchResult {
  type: 'match' | 'team' | 'player' | 'news';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
}

interface NavbarSearchProps {
  onClose?: () => void;
}

export default function NavbarSearch({ onClose }: NavbarSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allData, setAllData] = useState<{
    teams: Team[];
    players: Player[];
    matches: Match[];
    news: News[];
  }>({
    teams: [],
    players: [],
    matches: [],
    news: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [teams, players, matches, news] = await Promise.all([
          api.getTeams().catch(() => []),
          api.getPlayers().catch(() => []),
          api.getMatches().catch(() => []),
          api.getNews().catch(() => []),
        ]);
        setAllData({ teams, players, matches, news });
      } catch (error) {
        console.error('Error loading search data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const lowerQuery = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search Teams
    allData.teams.forEach((team) => {
      if (
        team.name.toLowerCase().includes(lowerQuery) ||
        team.shortName.toLowerCase().includes(lowerQuery) ||
        team.description?.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          type: 'team',
          id: team.id,
          title: team.name,
          subtitle: team.shortName,
          href: `/teams/${team.id}`,
          icon: 'trophy',
        });
      }
    });

    // Search Players
    allData.players.forEach((player) => {
      if (
        player.name.toLowerCase().includes(lowerQuery) ||
        player.role?.toLowerCase().includes(lowerQuery) ||
        player.teamId?.toLowerCase().includes(lowerQuery)
      ) {
        const team = allData.teams.find((t) => t.id === player.teamId);
        searchResults.push({
          type: 'player',
          id: player.id,
          title: player.name,
          subtitle: `${player.role}${team ? ` • ${team.shortName}` : ''}`,
          href: `/players/${player.id}`,
          icon: 'people',
        });
      }
    });

    // Search Matches
    allData.matches.forEach((match) => {
      const team1 = match.team1;
      const team2 = match.team2;
      const matchText = `${team1?.name || ''} vs ${team2?.name || ''} ${match.venue || ''}`.toLowerCase();
      
      if (matchText.includes(lowerQuery) || match.venue?.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: 'match',
          id: match.id,
          title: `${team1?.shortName || 'T1'} vs ${team2?.shortName || 'T2'}`,
          subtitle: `${match.venue || 'Venue TBD'} • ${new Date(match.date).toLocaleDateString()}`,
          href: `/matches#${match.id}`,
          icon: 'cricket-bat',
        });
      }
    });

    // Search News
    allData.news.forEach((article) => {
      if (
        article.title.toLowerCase().includes(lowerQuery) ||
        article.summary?.toLowerCase().includes(lowerQuery) ||
        article.content?.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          type: 'news',
          id: article.id,
          title: article.title,
          subtitle: article.summary || article.category,
          href: `/news/${article.id}`,
          icon: 'fire',
        });
      }
    });

    // Sort results: exact matches first, then by type priority
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === lowerQuery;
      const bExact = b.title.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const typeOrder = { team: 0, player: 1, match: 2, news: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
    setIsOpen(searchResults.length > 0);
    setIsLoading(false);
  }, [allData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with "/"
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        onClose?.();
      }

      // Navigate results with arrow keys
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          const href = results[selectedIndex].href;
          setIsOpen(false);
          setQuery('');
          setSelectedIndex(0);
          router.push(href);
          onClose?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleResultClick = (href: string) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    router.push(href);
    onClose?.();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      team: 'Team',
      player: 'Player',
      match: 'Match',
      news: 'News',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      team: 'from-blue-500 to-cyan-500',
      player: 'from-purple-500 to-pink-500',
      match: 'from-green-500 to-emerald-500',
      news: 'from-orange-500 to-red-500',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-2 md:mx-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (query.trim()) {
              performSearch(query);
            }
          }}
          placeholder="Search teams, players, matches, news..."
          className="w-full pl-10 pr-20 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-white/10 border border-white/20 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.trim() || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 w-full bg-[rgba(10,14,39,0.98)] backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[100] max-h-[min(500px,calc(100vh-200px))] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div ref={resultsRef} className="py-2">
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 ${
                      index === selectedIndex
                        ? 'bg-white/10 border-l-2 border-blue-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)} flex items-center justify-center`}>
                      <Emoji name={result.icon as any} size={20} animate={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{result.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getTypeColor(result.type)} bg-opacity-20 text-gray-300 font-medium`}>
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <div className="flex-shrink-0 text-gray-400 text-xs">
                        <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded">↵</kbd>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-8 text-center text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1 text-gray-500">Try searching for teams, players, matches, or news</p>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400">
                <p className="text-sm">Start typing to search...</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-full border border-white/10">Teams</span>
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-full border border-white/10">Players</span>
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-full border border-white/10">Matches</span>
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-full border border-white/10">News</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

