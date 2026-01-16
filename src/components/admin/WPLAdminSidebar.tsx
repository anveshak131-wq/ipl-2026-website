'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import WPLLogo from '../ui/WPLLogo';
import { Search, X, Clock, Command, ChevronDown, ChevronRight, Bell } from 'lucide-react';

interface WPLAdminSidebarProps {
  currentPage?: string;
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

export default function WPLAdminSidebar({ currentPage = '' }: WPLAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('WPL Admin');
  const [adminEmail, setAdminEmail] = useState('admin@wpl2024.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Dashboard', 'Content']));
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
        const name = user.name || user.username || 'WPL Admin';
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
    if (href.includes('matchday')) return 'matchday';
    if (href.includes('stories')) return 'stories';
    if (href.includes('live-score')) return 'live-score';
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
      matchday: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      stories: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      liveScore: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      scorecard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      default: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
        </svg>
      ),
    };
    return iconMap[iconType] || iconMap.default;
  };

  // Consolidated menu groups for WPL admin
  const menuGroups: { [key: string]: MenuItem[] } = useMemo(() => ({
    Main: [
      {
        href: '/wpl-admin-2026/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        group: 'Main',
        shortcut: 'D',
      },
    ],
    Content: [
      {
        href: '/wpl-admin-2026/matchday',
        label: 'Match Day',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'M',
      },
      {
        href: '/wpl-admin-2026/matches',
        label: 'Matches',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'A',
      },
      {
        href: '/wpl-admin-2026/teams',
        label: 'Teams',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'E',
      },
      {
        href: '/wpl-admin-2026/players',
        label: 'Players',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'Y',
      },
      {
        href: '/wpl-admin-2026/venues',
        label: 'Venues',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'V',
      },
      {
        href: '/wpl-admin-2026/stories',
        label: 'Fan Stories',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'F',
      },
      {
        href: '/wpl-admin-2026/predictions',
        label: 'Predictions',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'R',
      },
    ],
    Tools: [
      {
        href: '/wpl-admin-2026/live-score',
        label: 'Live Score',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'L',
      },
      {
        href: '/wpl-admin-2026/playing-11',
        label: 'Playing 11',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'P',
      },
      {
        href: '/wpl-admin-2026/points-table',
        label: 'Points Table',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'T',
      },
      {
        href: '/wpl-admin-2026/batting-stats',
        label: 'Batting Stats',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'B',
      },
      {
        href: '/wpl-admin-2026/bowling-stats',
        label: 'Bowling Stats',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'W',
      },
      {
        href: '/wpl-admin-2026/scorecard',
        label: 'Scorecard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'S',
      },
    ],
  }), []);

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
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleNavigation = (href: string) => {
    // Add to recent pages
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
    .join('') || 'WA';

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
        // Cmd/Ctrl + K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setSearchQuery('');
          (document.querySelector('input[placeholder="Search..."]') as HTMLInputElement)?.focus();
        }

        // Escape to clear search
        if (e.key === 'Escape' && searchQuery) {
          setSearchQuery('');
          (document.activeElement as HTMLElement)?.blur();
        }

        // Shortcut navigation - letter keys
        const key = e.key.toLowerCase();
        
        try {
          // Find menu item by shortcut
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
        className={`fixed left-0 top-0 h-full bg-purple-900/95 backdrop-blur-md border-r border-purple-400/20 z-50 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        initial={false}
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-400/20">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WPLLogo size={32} />
                <div>
                  <h1 className="text-lg font-bold text-white">WPL Admin</h1>
                  <p className="text-xs text-purple-300">2024</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-purple-800/50 text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <WPLLogo size={32} />
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-purple-800/50 text-white transition-colors w-full"
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-purple-800/50 text-white rounded-lg pl-10 pr-4 py-2 text-sm border border-purple-400/20 focus:outline-none focus:border-purple-400/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(filteredMenuGroups).map(([groupName, items]) => (
            <div key={groupName} className="mb-6">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-purple-300 uppercase tracking-wider hover:text-white transition-colors"
                >
                  {groupName}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      expandedGroups.has(groupName) ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              )}
              
              <AnimatePresence>
                {collapsed || expandedGroups.has(groupName) ? (
                  <motion.div
                    initial={collapsed ? {} : { height: 0, opacity: 0 }}
                    animate={collapsed ? {} : { height: 'auto', opacity: 1 }}
                    exit={collapsed ? {} : { height: 0, opacity: 0 }}
                    className="space-y-1"
                  >
                    {items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <motion.button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-purple-600/30 text-white border-l-2 border-purple-400'
                              : 'text-purple-300 hover:bg-purple-800/30 hover:text-white'
                          } ${collapsed ? 'justify-center' : ''}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {item.icon}
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              {item.badge && (
                                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* User Profile */}
        {!collapsed && (
          <div className="p-4 border-t border-purple-400/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {adminInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{adminName}</p>
                <p className="text-xs text-purple-300 truncate">{adminEmail}</p>
              </div>
            </div> md:hidden
          </div>
        )}

        {/* Mobile menu button */}
        {collapsed && (
          <div className="p-4 border-t border-purple-400/20">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-full p-2 rounded-lg hover:bg-purple-800/50 text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
