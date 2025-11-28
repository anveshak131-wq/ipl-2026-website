'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import IPLLogo from '../ui/IPLLogo';
import { Search, X, Clock, Command, ChevronDown, ChevronRight, Bell } from 'lucide-react';

interface AdminSidebarProps {
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
  icon: React.ReactNode;
  timestamp: number;
}

export default function AdminSidebar({ currentPage = '' }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@ipl2026.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Dashboard', 'Management', 'Content', 'Live', 'Settings']));
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

  // Load recent pages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_recent_pages');
    if (stored) {
      try {
        setRecentPages(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent pages:', e);
      }
    }
  }, []);

  // Track current page as recent
  useEffect(() => {
    if (!pathname || pathname === '/ipl-admin-2026') return;

    const currentItem = findMenuItemByHref(pathname);
    if (!currentItem) return;

    const newRecent: RecentPage = {
      href: pathname,
      label: currentItem.label,
      icon: currentItem.icon,
      timestamp: Date.now(),
    };

    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.href !== pathname);
      const updated = [newRecent, ...filtered].slice(0, 5);
      localStorage.setItem('admin_recent_pages', JSON.stringify(updated));
      return updated;
    });
  }, [pathname]);

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
        if (!token) return;

        // Fetch moderation pending count
        try {
          const modRes = await fetch('/api/admin/moderation?status=pending', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (modRes.ok) {
            const modData = await modRes.json();
            const pendingMessages = Array.isArray(modData.messages) ? modData.messages.length : 0;
            setPendingCounts((prev) => ({ ...prev, moderation: pendingMessages }));
          }
        } catch (e) {
          console.error('Error fetching moderation count:', e);
        }

        // Add more pending count fetches here (news drafts, pending matches, etc.)
      } catch (e) {
        console.error('Error fetching pending counts:', e);
      }
    };

    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!collapsed) {
          const searchInput = document.getElementById('sidebar-search');
          searchInput?.focus();
        }
      }

      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed(!collapsed);
      }

      // Escape to close search
      if (e.key === 'Escape' && document.activeElement?.id === 'sidebar-search') {
        setSearchQuery('');
        (document.activeElement as HTMLElement).blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed]);

  const menuGroups: { [key: string]: MenuItem[] } = {
    Dashboard: [
      {
        href: '/ipl-admin-2026/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        group: 'Dashboard',
        shortcut: 'D',
      },
    ],
    Management: [
      {
        href: '/ipl-admin-2026/teams',
        label: 'Teams',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'Management',
        shortcut: 'T',
      },
      {
        href: '/ipl-admin-2026/matches',
        label: 'Matches',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        group: 'Management',
        shortcut: 'M',
      },
      {
        href: '/ipl-admin-2026/players',
        label: 'Players',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        group: 'Management',
        shortcut: 'P',
      },
      {
        href: '/ipl-admin-2026/coaches',
        label: 'Coaching Staff',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        group: 'Management',
      },
      {
        href: '/ipl-admin-2026/key-players',
        label: 'Key Players',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ),
        group: 'Management',
      },
    ],
    Content: [
      {
        href: '/ipl-admin-2026/news',
        label: 'News',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'N',
      },
      {
        href: '/ipl-admin-2026/dataset-manager',
        label: 'Data Lab (Edit)',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h10M11 9h10M11 13h4M11 17h2M4 5h.01M4 9h.01M4 13h.01M4 17h.01M7 5h.01M7 9h.01M7 13h.01M7 17h.01" />
          </svg>
        ),
        group: 'Content',
      },
      {
        href: '/ipl-admin-2026/datasets',
        label: 'Data Lab (CSV)',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
          </svg>
        ),
        group: 'Content',
      },
      {
        href: '/ipl-admin-2026/ml-lab',
        label: 'ML Lab',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12a7 7 0 0114 0 7 7 0 01-14 0zm7-5v10m-4-5h8" />
          </svg>
        ),
        group: 'Content',
      },
      {
        href: '/ipl-admin-2026/content',
        label: 'Content Hub',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'C',
      },
      {
        href: '/ipl-admin-2026/stats',
        label: 'Stats Hub',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
          </svg>
        ),
        group: 'Content',
      },
    ],
    Live: [
      {
        href: '/ipl-admin-2026/live-score',
        label: 'Live Score',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Live',
        shortcut: 'L',
      },
      {
        href: '/ipl-admin-2026/moderation',
        label: 'Moderation',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Live',
        badge: pendingCounts.moderation,
        shortcut: 'R',
      },
      {
        href: '/ipl-admin-2026/engagement',
        label: 'Engagement',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Live',
      },
    ],
    Settings: [
      {
        href: '/ipl-admin-2026/settings',
        label: 'Settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        group: 'Settings',
        shortcut: 'S',
      },
      {
        href: '/ipl-admin-2026/email-notifications',
        label: 'Email Notifications',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        group: 'Settings',
      },
      {
        href: '/ipl-admin-2026/legal',
        label: 'Legal Pages',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h6m-6 4h4M6 5a2 2 0 00-2 2v10.5A1.5 1.5 0 005.5 19H18a1 1 0 001-1V7a2 2 0 00-2-2H6z" />
          </svg>
        ),
        group: 'Settings',
      },
    ],
  };

  const findMenuItemByHref = (href: string): MenuItem | null => {
    for (const items of Object.values(menuGroups)) {
      const item = items.find((i) => i.href === href || href.startsWith(i.href + '/'));
      if (item) return item;
    }
    return null;
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
    router.push(href);
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
    setSearchQuery('');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('auth_token');
    router.push('/ipl-admin-2026');
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
  }, [searchQuery]);

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={`p-6 border-b border-[#2A3440] ${collapsed ? 'px-4' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} transition-all duration-300`}>
          <div className="relative flex items-center justify-center">
            <IPLLogo size="sm" animated />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[#E6EDF3] font-bold text-lg leading-tight">SportsUP18</span>
              <span className="text-[#AEBAC7] text-xs">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4 border-b border-[#2A3440]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEBAC7]" />
            <input
              id="sidebar-search"
              type="text"
              placeholder="Search menu... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Pages */}
      {!collapsed && recentPages.length > 0 && !searchQuery && (
        <div className="p-4 border-b border-[#2A3440]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#AEBAC7]" />
              <span className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider">Recent</span>
            </div>
          </div>
          <div className="space-y-1">
            {recentPages.map((page) => {
              const isActive = currentPage === page.href || (!!currentPage && currentPage.startsWith(page.href + '/'));
              return (
                <button
                  key={page.href}
                  onClick={() => handleNavigation(page.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1A2332] text-[#E6EDF3]'
                      : 'text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22]'
                  }`}
                >
                  <span className={isActive ? 'text-[#2F6FED]' : ''}>{page.icon}</span>
                  <span className="flex-1 text-left truncate">{page.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {Object.entries(filteredMenuGroups).map(([groupName, items]) => {
          const isExpanded = expandedGroups.has(groupName);
          const hasActiveItem = items.some(
            (item) =>
              currentPage === item.href || (!!currentPage && currentPage.startsWith(item.href + '/'))
          );

          return (
            <div key={groupName}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-3 mb-2 group"
                >
                  <span className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider group-hover:text-[#E6EDF3] transition-colors">
                    {groupName}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#AEBAC7] group-hover:text-[#E6EDF3] transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#AEBAC7] group-hover:text-[#E6EDF3] transition-colors" />
                  )}
                </button>
              )}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {items.map((item) => {
                      const isActive =
                        currentPage === item.href ||
                        (!!currentPage && currentPage.startsWith(item.href + '/'));
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full group relative flex items-center ${collapsed ? 'justify-center px-3' : 'space-x-3 px-3'} py-3 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-[#1A2332] text-[#E6EDF3]'
                              : 'text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22]'
                          }`}
                          title={collapsed ? item.label : undefined}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2F6FED] rounded-r-full shadow-lg shadow-blue-500/50" />
                          )}
                          <span className={`relative ${isActive ? 'text-[#2F6FED]' : ''} transition-colors`}>
                            {item.icon}
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0B0F13]">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </span>
                          {!collapsed && (
                            <>
                              <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                              {item.shortcut && (
                                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-[#6B7280] bg-[#141A22] border border-[#2A3440] rounded">
                                  {item.shortcut}
                                </kbd>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Help */}
      {!collapsed && (
        <div className="p-4 border-t border-[#2A3440]">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="w-full flex items-center justify-between px-3 py-2 text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22] rounded-lg transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <Command className="w-4 h-4" />
              <span className="text-xs font-medium">Shortcuts</span>
            </div>
            {showShortcuts ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#AEBAC7]">Search</span>
                  <kbd className="px-2 py-1 bg-[#141A22] border border-[#2A3440] rounded text-[#E6EDF3]">
                    ⌘K
                  </kbd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#AEBAC7]">Toggle Sidebar</span>
                  <kbd className="px-2 py-1 bg-[#141A22] border border-[#2A3440] rounded text-[#E6EDF3]">
                    ⌘B
                  </kbd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#AEBAC7]">Dashboard</span>
                  <kbd className="px-2 py-1 bg-[#141A22] border border-[#2A3440] rounded text-[#E6EDF3]">
                    D
                  </kbd>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* User Profile & Actions */}
      <div className={`p-4 border-t border-[#2A3440] space-y-3 ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3' : 'space-x-3 px-3'} py-3 rounded-lg text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22] transition-all duration-200`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="font-medium text-sm">Collapse</span>}
        </button>

        {/* Enhanced User Profile */}
        <div className={`${collapsed ? 'px-3' : 'px-3'} py-3 rounded-lg bg-[#141A22] backdrop-blur-xl border border-[#2A3440]`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2F6FED] to-[#7B61FF] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {adminInitials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#141A22] rounded-full"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[#E6EDF3] font-medium text-sm truncate">{adminName}</div>
                <div className="text-[#AEBAC7] text-xs truncate">{adminEmail}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-[#6B7280]">Online</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3' : 'space-x-3 px-3'} py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200`}
          title={collapsed ? 'Logout' : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#12171D] border border-[#2A3440] text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-40
          bg-[#0B0F13] border-r border-[#2A3440]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-72'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0B0F13 0%, #12171D 100%)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
