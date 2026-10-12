'use client';

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Search,
  Command,
  Radio,
  Calendar,
  Users,
  Coins,
  FileText,
  BarChart3,
  TrendingUp,
  Shield,
  MapPin,
  Settings,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
  ArrowUpRight,
  Award
} from 'lucide-react';
import WPLAdminSidebarNew from './WPLAdminSidebarNew';

// --- Theme Context ---
type ThemeMode = 'dark' | 'light';
interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => {} });
export const useAdminTheme = () => useContext(ThemeContext);

interface ShellProps {
  children: React.ReactNode;
}

export default function WPLAdminShell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Dark/Light mode state with localStorage sync
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('wpl_admin_theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('wpl_admin_theme', next);
  };

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navRoutes = [
    { label: 'Dashboard', path: '/ops/wpl/dashboard', icon: Award, category: 'Overview' },
    { label: 'Matches & Fixtures', path: '/ops/wpl/matches', icon: Calendar, category: 'Live Ops' },
    { label: 'Playing 11 Confirmation', path: '/ops/wpl/playing-11', icon: Users, category: 'Live Ops' },
    { label: 'Toss Submission', path: '/ops/wpl/toss', icon: Coins, category: 'Live Ops' },
    { label: 'Live Scorer Console', path: '/ops/wpl/live-score', icon: Radio, category: 'Live Ops' },
    { label: 'Scorecard Review', path: '/ops/wpl/scorecard', icon: FileText, category: 'Live Ops' },
    { label: 'Points Table', path: '/ops/wpl/points-table', icon: BarChart3, category: 'Live Ops' },
    { label: 'Teams Roster', path: '/ops/wpl/teams', icon: Shield, category: 'League Data' },
    { label: 'Players Directory', path: '/ops/wpl/players', icon: Users, category: 'League Data' },
    { label: 'Batting Stats', path: '/ops/wpl/batting-stats', icon: TrendingUp, category: 'League Data' },
    { label: 'Bowling Stats', path: '/ops/wpl/bowling-stats', icon: TrendingUp, category: 'League Data' },
    { label: 'Venues', path: '/ops/wpl/venues', icon: MapPin, category: 'League Data' },
    { label: 'Ops Settings', path: '/ops/wpl/settings', icon: Settings, category: 'System' },
  ];

  const filteredRoutes = useMemo(() => {
    if (!cmdSearch.trim()) return navRoutes;
    const q = cmdSearch.toLowerCase();
    return navRoutes.filter((r) => r.label.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [cmdSearch]);

  const breadcrumbs = useMemo(() => {
    const parts = (pathname || '').split('/').filter(Boolean);
    return parts.map((part, index) => {
      const url = '/' + parts.slice(0, index + 1).join('/');
      const label = part === 'ops' ? 'Operations' : part === 'wpl' ? 'WPL 2027' : part.replace(/-/g, ' ');
      return { url, label };
    });
  }, [pathname]);

  // CSS variables for clean dark / light styling
  const themeStyles = theme === 'dark' ? {
    '--ops-bg': '#030712',
    '--ops-card': '#0b0f19',
    '--ops-card-border': 'rgba(255, 255, 255, 0.08)',
    '--ops-text-main': '#f9fafb',
    '--ops-text-muted': '#9ca3af',
    '--ops-accent': '#f43f5e',
    '--ops-topbar-bg': 'rgba(11, 15, 25, 0.75)',
  } as React.CSSProperties : {
    '--ops-bg': '#f8fafc',
    '--ops-card': '#ffffff',
    '--ops-card-border': 'rgba(0, 0, 0, 0.08)',
    '--ops-text-main': '#0f172a',
    '--ops-text-muted': '#64748b',
    '--ops-accent': '#e11d48',
    '--ops-topbar-bg': 'rgba(255, 255, 255, 0.85)',
  } as React.CSSProperties;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div 
        style={themeStyles} 
        className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}
      >
        <div className="flex">
          {/* Main Sidebar */}
          <div className="hidden lg:block shrink-0">
            <WPLAdminSidebarNew />
          </div>

          {/* Core Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 h-16 border-b border-white/5 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between"
              style={{ backgroundColor: 'var(--ops-topbar-bg)', borderColor: 'var(--ops-card-border)' }}
            >
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs md:text-sm">
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.url}>
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Link
                      href={b.url}
                      className={`capitalize transition-colors font-medium ${
                        i === breadcrumbs.length - 1
                          ? 'text-rose-500 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b.label}
                    </Link>
                  </React.Fragment>
                ))}
              </div>

              {/* Quick Action Toolbar */}
              <div className="flex items-center gap-3">
                {/* Command Palette Trigger */}
                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all shadow-sm"
                  style={{ backgroundColor: 'var(--ops-card)', borderColor: 'var(--ops-card-border)' }}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search ops...</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">⌘K</kbd>
                </button>

                {/* Live Sync Status Indicator */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Live</span>
                </div>

                {/* Dark / Light Toggle */}
                {mounted && (
                  <button
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    className="p-2 rounded-xl border transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--ops-card)', borderColor: 'var(--ops-card-border)' }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                )}
              </div>
            </header>

            {/* Main Page Slot */}
            <main className="flex-1 p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>

        {/* Command Palette Modal (⌘K) */}
        <AnimatePresence>
          {isCommandOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--ops-card)', borderColor: 'var(--ops-card-border)' }}
              >
                <div className="flex items-center px-4 border-b border-white/10 gap-3">
                  <Search className="w-4 h-4 text-rose-500" />
                  <input
                    type="text"
                    value={cmdSearch}
                    onChange={(e) => setCmdSearch(e.target.value)}
                    placeholder="Search WPL console routes, match ops, or tools..."
                    autoFocus
                    className="w-full py-3.5 bg-transparent text-sm focus:outline-none"
                    style={{ color: 'var(--ops-text-main)' }}
                  />
                  <button onClick={() => setIsCommandOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
                  {filteredRoutes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No navigation routes found.</div>
                  ) : (
                    filteredRoutes.map((route) => {
                      const Icon = route.icon;
                      return (
                        <div
                          key={route.path}
                          onClick={() => {
                            setIsCommandOpen(false);
                            router.push(route.path);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 group-hover:border-rose-500/30">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{route.label}</div>
                              <div className="text-[10px] text-slate-400">{route.category}</div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  );
}
