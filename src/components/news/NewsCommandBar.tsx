'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Team } from '@/types';
import { resolveTeamRef } from './newsTheme';

export type NewsCategoryFilter =
  | 'all'
  | 'breaking'
  | 'team'
  | 'match'
  | 'player'
  | 'general'
  | 'saved';

export type NewsSortOption = 'latest' | 'important' | 'quick';
export type NewsViewMode = 'grid' | 'editorial';

interface NewsCommandBarProps {
  selectedCategory: NewsCategoryFilter;
  onSelectCategory: (category: NewsCategoryFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTeam: string;
  onSelectTeam: (teamId: string) => void;
  sortBy: NewsSortOption;
  onSortChange: (sort: NewsSortOption) => void;
  viewMode: NewsViewMode;
  onViewModeChange: (mode: NewsViewMode) => void;
  teams: Team[];
  leagueScope: 'all' | 'ipl' | 'wpl';
  savedCount: number;
  totalMatching: number;
  onResetAll: () => void;
}

const CATEGORIES: { id: NewsCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Stories' },
  { id: 'breaking', label: 'Breaking & Auction' },
  { id: 'team', label: 'Trades & Squads' },
  { id: 'match', label: 'Schedule & Matches' },
  { id: 'player', label: 'Player Watch' },
  { id: 'general', label: '2027 Outlook' },
  { id: 'saved', label: 'Saved' },
];

export default function NewsCommandBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedTeam,
  onSelectTeam,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  teams,
  leagueScope,
  savedCount,
  totalMatching,
  onResetAll,
}: NewsCommandBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const scopedTeams = teams.filter((team) => {
    if (leagueScope === 'all') return true;
    return (team.league || 'ipl') === leagueScope;
  });

  const activeTeamMeta = selectedTeam !== 'all' ? resolveTeamRef(selectedTeam, teams) : null;
  const activeExtraCount =
    (selectedTeam !== 'all' ? 1 : 0) + (sortBy !== 'latest' ? 1 : 0);
  const hasAnyFilter =
    selectedCategory !== 'all' ||
    searchQuery.trim().length > 0 ||
    selectedTeam !== 'all' ||
    sortBy !== 'latest';

  return (
    <div className="sticky top-[72px] z-30 rounded-2xl border border-white/15 bg-slate-950/90 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl shadow-black/40 space-y-3">
      {/* Row 1: Animated Category Tabs + Search & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Horizontally scrollable spring category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors shrink-0 ${
                  active ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="newsCatActivePill"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 32 }
                    }
                    className="absolute inset-0 rounded-xl bg-white/12 border border-amber-400/45 shadow-sm"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {cat.id === 'saved' && (
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        active ? 'text-amber-300 fill-amber-300' : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span>{cat.label}</span>
                  {cat.id === 'saved' && savedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">
                      {savedCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search + Team Filter Drawer Toggle + View Switch */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64 lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search trades, Goa auction, WPL..."
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-10 pr-12 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.07] transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-400 border border-white/10">
                /
              </kbd>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              drawerOpen || activeExtraCount > 0
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
                : 'border-white/15 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Franchise & Sort</span>
            {activeExtraCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black leading-none">
                {activeExtraCount}
              </span>
            )}
          </button>

          {/* Grid / Editorial Feed Toggle */}
          <div
            role="group"
            aria-label="Article layout mode"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] p-1"
          >
            <button
              type="button"
              aria-label="Grid layout"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Editorial feed layout"
              onClick={() => onViewModeChange('editorial')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'editorial'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Team Crests & Sort Panel */}
      <AnimatePresence initial={false}>
        {drawerOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Franchise Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Franchise:
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTeam('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    selectedTeam === 'all'
                      ? 'bg-white text-slate-950 border-white'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  All Teams
                </button>
                {scopedTeams.map((team) => {
                  const isSelected = selectedTeam === String(team.id);
                  const teamRef = resolveTeamRef(String(team.id), teams);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() =>
                        onSelectTeam(isSelected ? 'all' : String(team.id))
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-200 border-amber-400/60'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {teamRef && (
                        <img
                          src={teamRef.logo}
                          alt={teamRef.shortName}
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      <span>{team.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sort:
                </span>
                {(
                  [
                    { id: 'latest', label: 'Latest' },
                    { id: 'important', label: 'Lead Stories' },
                    { id: 'quick', label: 'Quick Reads' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSortChange(opt.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      sortBy === opt.id
                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/50'
                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Status Strip */}
      {hasAnyFilter && (
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">
              Showing <strong className="text-white">{totalMatching}</strong> matching 2027 stories
            </span>
            {activeTeamMeta && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-200 font-semibold">
                <img src={activeTeamMeta.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                {activeTeamMeta.shortName}
                <button
                  type="button"
                  aria-label="Clear team filter"
                  onClick={() => onSelectTeam('all')}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-200 font-semibold">
                &ldquo;{searchQuery.trim()}&rdquo;
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => onSearchChange('')}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
