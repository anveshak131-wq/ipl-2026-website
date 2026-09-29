'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Command, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

interface UnifiedAdminSidebarProps {
  currentPage?: string;
  onLogout?: () => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: string;
  badge?: number;
  shortcut?: string;
}

interface RecentPage {
  href: string;
  label: string;
  iconType: string;
  timestamp: number;
}

export default function UnifiedAdminSidebar({ currentPage = '', onLogout }: UnifiedAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLeague } = useLeague();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@sportsup18.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Overview', 'League Data']));
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<{ [key: string]: number }>({});

  // Load admin details
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
        if (!token) return;

        const res = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.user) return;

        const user = data.user;
        const name = user.name || user.username || 'Admin';
        const email = user.email || adminEmail;

        setAdminName(name);
        setAdminEmail(email);
      } catch (err) {
        console.error('Error loading admin details:', err);
      }
    };

    loadAdmin();
  }, []);

  // Helper to get icon type from href
  const getIconTypeFromHref = (href: string): string => {
    if (href.includes('dashboard')) return 'dashboard';
    if (href.includes('teams')) return 'teams';
    if (href.includes('matches')) return 'matches';
    if (href.includes('points-table')) return 'points-table';
    if (href.includes('batting-stats')) return 'batting-stats';
    if (href.includes('bowling-stats')) return 'bowling-stats';
    if (href.includes('players')) return 'players';
    if (href.includes('live-score')) return 'live-score';
    if (href.includes('playing-11')) return 'playing-11';
    if (href.includes('scorecard')) return 'scorecard';
    return 'default';
  };

  // Helper to render icon from type
  const renderIconFromType = (iconType: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      teams: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      matches: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      'points-table': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      players: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'batting-stats': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'bowling-stats': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'live-score': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'playing-11': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      scorecard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      default: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };
    return iconMap[iconType] || iconMap.default;
  };

  // Load recent pages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_recent_pages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((page: any) => ({
          ...page,
          iconType: page.iconType || getIconTypeFromHref(page.href),
        }));
        setRecentPages(migrated);
      } catch (e) {
        console.error('Error loading recent pages:', e);
      }
    }
  }, []);

  // Track current page as recent
  const lastTrackedPathname = useRef<string>('');
  useEffect(() => {
    if (!pathname || pathname === '/admin-2026' || pathname === '/admin-2026/') return;
    if (lastTrackedPathname.current === pathname) return;
    lastTrackedPathname.current = pathname;

    const currentItem = findMenuItemByHref(pathname);
    if (!currentItem) return;

    const newRecent: RecentPage = {
      href: pathname,
      label: currentItem.label,
      iconType: getIconTypeFromHref(pathname),
      timestamp: Date.now(),
    };

    setRecentPages((prev) => {
      const existing = prev.find((p) => p.href === pathname);
      if (existing && Date.now() - existing.timestamp < 1000) {
        return prev;
      }
      const filtered = prev.filter((p) => p.href !== pathname);
      const updated = [newRecent, ...filtered].slice(0, 5);
      localStorage.setItem('admin_recent_pages', JSON.stringify(updated));
      return updated;
    });
  }, [pathname]);

  // Unified menu groups for both leagues
  const menuGroups: { [key: string]: MenuItem[] } = useMemo(() => ({
    Overview: [
      {
        href: '/admin-2026/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        group: 'Overview',
        shortcut: 'D',
      },
    ],
    'League Data': [
      {
        href: '/admin-2026/teams',
        label: 'Teams',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'League Data',
        shortcut: 'T',
      },
      {
        href: '/admin-2026/matches',
        label: 'Matches',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        group: 'League Data',
        shortcut: 'M',
      },
      {
        href: '/admin-2026/players',
        label: 'Players',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        group: 'League Data',
        shortcut: 'P',
      },
      {
        href: '/admin-2026/points-table',
        label: 'Points Table',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        group: 'League Data',
        shortcut: 'P',
      },
    ],
    'Live Ops': [
      {
        href: '/admin-2026/live-score',
        label: 'Live Score',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Live Ops',
        shortcut: 'L',
      },
      {
        href: '/admin-2026/playing-11',
        label: 'Playing 11',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'Live Ops',
        shortcut: 'P',
      },
      {
        href: '/admin-2026/scorecard',
        label: 'Scorecard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        group: 'Live Ops',
        shortcut: 'S',
      },
    ],
  }), [currentLeague]);

  const findMenuItemByHref = (href: string): MenuItem | null => {
    try {
      for (const items of Object.values(menuGroups)) {
        if (Array.isArray(items)) {
          const item = items.find((i) => i.href === href || href.startsWith(i.href + '/'));
          if (item) return item;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding menu item by href:', error);
      return null;
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleNavigation = (href: string) => {
    const menuItem = findMenuItemByHref(href);
    if (menuItem) {
      const recentPage: RecentPage = {
        href,
        label: menuItem.label,
        iconType: getIconTypeFromHref(href),
        timestamp: Date.now(),
      };
      
      setRecentPages((prev) => {
        const filtered = prev.filter((p) => p.href !== href);
        return [recentPage, ...filtered].slice(0, 5);
      });
    }
    
    router.push(href);
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AD';

  // Filter menu items based on search
  const filteredMenuGroups = useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;

    const query = searchQuery.toLowerCase();
    const filtered: { [key: string]: MenuItem[] } = {};

    Object.entries(menuGroups).forEach(([groupName, items]) => {
      const matchingItems = items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.href.toLowerCase().includes(query)
      );
      if (matchingItems.length > 0) {
        filtered[groupName] = matchingItems;
      }
    });

    return filtered;
  }, [searchQuery, menuGroups]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setSearchQuery('');
          (document.querySelector('input[placeholder="Search..."]') as HTMLInputElement)?.focus();
        }

        if (e.key === 'Escape' && searchQuery) {
          setSearchQuery('');
          (document.activeElement as HTMLElement)?.blur();
        }

        const key = e.key.toLowerCase();
        
        try {
          for (const items of Object.values(menuGroups)) {
            if (Array.isArray(items)) {
              const item = items.find((i) => i.shortcut?.toLowerCase() === key);
              if (item) {
                e.preventDefault();
                router.push(item.href);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error handling keyboard shortcut:', error);
        }
      } catch (err) {
        console.error('Error in handleKeyDown:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, menuGroups, router]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-gray-800/95 backdrop-blur-md rounded-lg border border-gray-600 text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full bg-gray-900/95 backdrop-blur-md border-r border-gray-700 z-50 transition-all duration-300 
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0`}
        initial={false}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">
                  {currentLeague === 'ipl' ? 'IPL 2026' : 'WPL 2024'}
                </h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-lg font-bold text-white text-center">
                {currentLeague === 'ipl' ? 'IPL' : 'WPL'}
              </h1>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-white transition-colors w-full"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 mx-auto" />
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 text-white rounded-lg pl-10 pr-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2">
          {Object.entries(filteredMenuGroups).map(([groupName, items]) => (
            <div key={groupName} className="mb-4">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  {groupName}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      expandedGroups.has(groupName) ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === item.href
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                    {item.badge && (
                      <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Pages */}
        {!collapsed && recentPages.length > 0 && (
          <div className="px-4 pb-4 border-t border-gray-700">
            <div className="flex items-center gap-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              Recent
            </div>
            <div className="space-y-1">
              {recentPages.map((page) => (
                <button
                  key={page.href}
                  onClick={() => handleNavigation(page.href)}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors text-sm"
                >
                  {renderIconFromType(page.iconType)}
                  <span className="truncate">{page.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 pb-4 border-t border-gray-700">
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {adminInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{adminName}</div>
                <div className="text-xs text-gray-400 truncate">{adminEmail}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
