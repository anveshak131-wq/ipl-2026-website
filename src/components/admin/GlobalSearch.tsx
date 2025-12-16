'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Command, ArrowRight, FileText, Users, Calendar, Trophy } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

interface SearchResult {
  id: string;
  type: 'page' | 'team' | 'player' | 'match' | 'news';
  title: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { isIPL, isWPL } = useLeague();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history
  useEffect(() => {
    const stored = localStorage.getItem('admin_search_history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        const searchResults: SearchResult[] = [];

        // Search pages
        const pageResults = searchPages(query);
        searchResults.push(...pageResults);

        // Search teams
        try {
          const league = isIPL ? 'ipl' : isWPL ? 'wpl' : undefined;
          const teamsUrl = league ? `/api/teams?league=${league}` : '/api/teams';
          const teamsRes = await fetch(teamsUrl);
          if (teamsRes.ok) {
            const teams = await teamsRes.json();
            console.log('GlobalSearch - League context:', { isIPL, isWPL });
            console.log('GlobalSearch - Total teams before filtering:', teams.length);
            
            // No need for client-side filtering - API already filters by league
            const filteredTeams = teams;
            
            const teamMatches = filteredTeams
              .filter((team: any) =>
                team.name?.toLowerCase().includes(query.toLowerCase()) ||
                team.shortName?.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 3)
              .map((team: any) => ({
                id: team.id,
                type: 'team' as const,
                title: team.name,
                description: team.shortName,
                href: `/ipl-admin-2026/teams`,
                icon: <Users className="w-4 h-4" />,
              }));
            searchResults.push(...teamMatches);
          }
        } catch (e) {
          console.error('Error searching teams:', e);
        }

        // Search players
        try {
          const league = isIPL ? 'ipl' : isWPL ? 'wpl' : undefined;
          const playersUrl = league ? `/api/players?league=${league}` : '/api/players';
          const playersRes = await fetch(playersUrl);
          if (playersRes.ok) {
            const players = await playersRes.json();
            console.log('GlobalSearch - League context:', { isIPL, isWPL });
            console.log('GlobalSearch - Total players before filtering:', players.length);
            
            // No need for client-side filtering - API already filters by league
            const filteredPlayers = players;
            
            console.log('GlobalSearch - Players after filtering:', filteredPlayers.length);
            
            const playerMatches = filteredPlayers
              .filter((player: any) =>
                player.name?.toLowerCase().includes(query.toLowerCase()) ||
                player.role?.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 3)
              .map((player: any) => ({
                id: player.id,
                type: 'player' as const,
                title: player.name,
                description: `${player.role} • ${player.team?.name || 'Free Agent'}`,
                href: `/ipl-admin-2026/players`,
                icon: <Users className="w-4 h-4" />,
              }));
            searchResults.push(...playerMatches);
          }
        } catch (e) {
          console.error('Error searching players:', e);
        }

        // Search matches
        try {
          const matchesRes = await fetch('/api/matches');
          if (matchesRes.ok) {
            const matches = await matchesRes.json();
            const matchMatches = matches
              .filter((match: any) =>
                match.team1?.name?.toLowerCase().includes(query.toLowerCase()) ||
                match.team2?.name?.toLowerCase().includes(query.toLowerCase()) ||
                match.venue?.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 3)
              .map((match: any) => ({
                id: match.id,
                type: 'match' as const,
                title: `${match.team1?.shortName} vs ${match.team2?.shortName}`,
                description: match.venue || match.date,
                href: `/ipl-admin-2026/matches`,
                icon: <Calendar className="w-4 h-4" />,
              }));
            searchResults.push(...matchMatches);
          }
        } catch (e) {
          console.error('Error searching matches:', e);
        }

        setResults(searchResults.slice(0, 10));
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const searchPages = (query: string): SearchResult[] => {
    const pages: { title: string; href: string; icon: React.ReactNode }[] = [
      { title: 'Dashboard', href: '/ipl-admin-2026/dashboard', icon: <FileText className="w-4 h-4" /> },
      { title: 'Teams', href: '/ipl-admin-2026/teams', icon: <Users className="w-4 h-4" /> },
      { title: 'Matches', href: '/ipl-admin-2026/matches', icon: <Calendar className="w-4 h-4" /> },
      { title: 'Players', href: '/ipl-admin-2026/players', icon: <Users className="w-4 h-4" /> },
      { title: 'News', href: '/ipl-admin-2026/news', icon: <FileText className="w-4 h-4" /> },
      { title: 'Content Hub', href: '/ipl-admin-2026/content', icon: <FileText className="w-4 h-4" /> },
      { title: 'Moderation', href: '/ipl-admin-2026/moderation', icon: <Trophy className="w-4 h-4" /> },
      { title: 'Settings', href: '/ipl-admin-2026/settings', icon: <FileText className="w-4 h-4" /> },
    ];

    return pages
      .filter((page) => page.title.toLowerCase().includes(query.toLowerCase()))
      .map((page) => ({
        id: page.href,
        type: 'page' as const,
        title: page.title,
        href: page.href,
        icon: page.icon,
      }));
  };

  const handleSelect = (result: SearchResult) => {
    // Save to search history
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const updated = [query.trim(), ...searchHistory].slice(0, 10);
      setSearchHistory(updated);
      localStorage.setItem('admin_search_history', JSON.stringify(updated));
    }

    router.push(result.href);
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#0B0F13] border border-[#2A3440] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="relative p-4 border-b border-[#2A3440]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#AEBAC7]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, teams, players, matches... (⌘K)"
              className="w-full pl-12 pr-20 py-3 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED] focus:border-transparent"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-1 text-xs font-semibold text-[#6B7280] bg-[#141A22] border border-[#2A3440] rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && results.length > 0 && (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      index === selectedIndex
                        ? 'bg-[#1A2332] text-[#E6EDF3]'
                        : 'text-[#AEBAC7] hover:bg-[#141A22] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <span className="text-[#2F6FED]">{result.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-[#6B7280] mt-0.5">{result.description}</div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="p-8 text-center text-[#AEBAC7]">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No results found</p>
              </div>
            )}

            {!query && searchHistory.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Clock className="w-4 h-4 text-[#AEBAC7]" />
                  <span className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider">Recent Searches</span>
                </div>
                <div className="space-y-1">
                  {searchHistory.slice(0, 5).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(term)}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[#AEBAC7] hover:bg-[#141A22] hover:text-[#E6EDF3] transition-all duration-200"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!query && searchHistory.length === 0 && (
              <div className="p-8 text-center text-[#AEBAC7]">
                <Command className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start typing to search...</p>
                <p className="text-xs text-[#6B7280] mt-2">Press ⌘K to open this search anytime</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

