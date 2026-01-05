'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import IPLLogo from '../ui/IPLLogo';
import AdminLeagueSwitcher from './AdminLeagueSwitcher';
import { useLeague } from '@/contexts/LeagueContext';
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
  iconType: string; // Store icon type instead of React element
  timestamp: number;
}

export default function AdminSidebar({ currentPage = '' }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLeague } = useLeague();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@ipl2026.com');
  const [searchQuery, setSearchQuery] = useState('');
  // Only expand Dashboard and Management by default for cleaner look
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Dashboard', 'Management']));
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
    if (href.includes('batting-stats')) return 'batting-stats';
    if (href.includes('bowling-stats')) return 'bowling-stats';
    if (href.includes('players')) return 'players';
    if (href.includes('coaches')) return 'coaches';
    if (href.includes('key-players')) return 'key-players';
    if (href.includes('news')) return 'news';
    if (href.includes('dataset-manager') || href.includes('datasets')) return 'datasets';
    if (href.includes('ml-lab')) return 'ml-lab';
    if (href.includes('content')) return 'content';
    if (href.includes('stats')) return 'stats';
    if (href.includes('analytics')) return 'analytics';
    if (href.includes('live-score')) return 'live-score';
    if (href.includes('playing-11')) return 'playing-11';
    if (href.includes('test-live-score')) return 'test-live-score';
    if (href.includes('moderation')) return 'moderation';
    if (href.includes('engagement')) return 'engagement';
    if (href.includes('settings')) return 'settings';
    if (href.includes('email-notifications')) return 'email';
    if (href.includes('legal')) return 'legal';
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
      coaches: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      'key-players': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      news: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      datasets: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h10M11 9h10M11 13h4M11 17h2M4 5h.01M4 9h.01M4 13h.01M4 17h.01M7 5h.01M7 9h.01M7 13h.01M7 17h.01" />
        </svg>
      ),
      'ml-lab': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12a7 7 0 0114 0 7 7 0 01-14 0zm7-5v10m-4-5h8" />
        </svg>
      ),
      content: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
        </svg>
      ),
      stats: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
        </svg>
      ),
      analytics: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
      'test-live-score': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      moderation: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      engagement: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      email: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      legal: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h6m-6 4h4M6 5a2 2 0 00-2 2v10.5A1.5 1.5 0 005.5 19H18a1 1 0 001-1V7a2 2 0 00-2-2H6z" />
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
        // Migrate old format (with icon) to new format (with iconType)
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
    if (!pathname || pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/') return;
    // Prevent duplicate updates for the same pathname
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
      // Check if this pathname is already in recent pages with recent timestamp
      const existing = prev.find((p) => p.href === pathname);
      if (existing && Date.now() - existing.timestamp < 1000) {
        // Already tracked within last second, skip update
        return prev;
      }
      const filtered = prev.filter((p) => p.href !== pathname);
      const updated = [newRecent, ...filtered].slice(0, 5);
      localStorage.setItem('admin_recent_pages', JSON.stringify(updated));
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // pathname dependency is needed, but we guard against duplicates

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

  // Consolidated menu groups for cleaner navigation
  const menuGroups: { [key: string]: MenuItem[] } = useMemo(() => ({
    Main: [
      {
        href: '/ipl-admin-2026/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        group: 'Main',
        shortcut: 'D',
      },
      {
        href: '/ipl-admin-2026/teams',
        label: 'Teams',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        group: 'Main',
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
        group: 'Main',
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
        group: 'Main',
        shortcut: 'P',
      },
      {
        href: '/ipl-admin-2026/batting-stats',
        label: 'Batting Stats',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        group: 'Main',
        shortcut: 'B',
      },
      {
        href: '/ipl-admin-2026/bowling-stats',
        label: 'Bowling Stats',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        group: 'Main',
        shortcut: 'W',
      },
    ],
    Content: [
      {
        href: '/ipl-admin-2026/content',
        label: 'Content',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h6m-2 4h12" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'C',
      },
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
        href: '/ipl-admin-2026/matchday',
        label: 'Match Day',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'D',
      },
      {
        href: '/ipl-admin-2026/stories',
        label: 'Fan Stories',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'F',
      },
      // Statistics - only show for IPL, not WPL
      ...(currentLeague !== 'wpl' ? [{
        href: '/ipl-admin-2026/stats',
        label: 'Statistics',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        group: 'Content',
        shortcut: 'S',
      }] : []),
      {
        href: '/ipl-admin-2026/predictions',
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
        href: '/ipl-admin-2026/players/upload',
        label: 'Upload Players CSV',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
        group: 'Tools',
      },
      {
        href: '/ipl-admin-2026/live-score',
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
        href: '/ipl-admin-2026/playing-11',
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
        href: '/ipl-admin-2026/test-live-score',
        label: 'Test Live Score',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Tools',
        shortcut: 'T',
      },
      {
        href: '/ipl-admin-2026/moderation',
        label: 'Moderation',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        group: 'Tools',
        badge: pendingCounts.moderation,
      },
      {
        href: '/ipl-admin-2026/dataset-manager',
        label: 'Data Lab',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h10M11 9h10M11 13h4M11 17h2M4 5h.01M4 9h.01M4 13h.01M4 17h.01M7 5h.01M7 9h.01M7 13h.01M7 17h.01" />
          </svg>
        ),
        group: 'Tools',
      },
    ],
    Settings: [
      {
        href: '/ipl-admin-2026/analytics',
        label: 'Analytics',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        group: 'Settings',
        shortcut: 'A',
      },
      {
        href: '/ipl-admin-2026/support',
        label: 'Support',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536-3.536m0 5.656l3.536-3.536M9.172 9.172L5.636 5.636m3.536 5.656l-3.536-3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        group: 'Management',
        shortcut: 'U',
      },
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
    ],
  }), [currentLeague]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      
      if (isInputFocused) return;

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

      // Single letter shortcuts - only work without modifier keys
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        
        // Find menu item by shortcut
        for (const items of Object.values(menuGroups)) {
          const item = items.find((i) => i.shortcut?.toLowerCase() === key);
          if (item) {
            e.preventDefault();
            router.push(item.href);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, menuGroups, router]);

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
      {/* Header - Redesigned with admin classes */}
      <div className={`admin-glass px-4 py-4 border-b border-white/8 ${collapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} transition-all duration-300`}>
          <div className="relative flex items-center justify-center">
            <IPLLogo size="sm" animated />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-base leading-tight">SportsUP18</span>
              <span className="text-gray-400 text-xs">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      {/* Search - Redesigned with admin classes */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="sidebar-search"
              type="text"
              placeholder="Search navigation... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input w-full pl-10 pr-8 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* League Switcher - Redesigned */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/8">
          <AdminLeagueSwitcher />
        </div>
      )}

      {/* Recent Pages - Only show when searching or collapsed */}
      {!collapsed && recentPages.length > 0 && searchQuery && (
        <div className="px-4 py-2 border-b border-[#2A3440]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 text-[#6B7280]" />
            <span className="text-xs text-[#6B7280]">Recent</span>
          </div>
          <div className="space-y-0.5">
            {recentPages.slice(0, 3).map((page) => {
              const isActive = currentPage === page.href || (!!currentPage && currentPage.startsWith(page.href + '/'));
              return (
                <button
                  key={page.href}
                  onClick={() => handleNavigation(page.href)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1A2332] text-[#E6EDF3]'
                      : 'text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22]'
                  }`}
                >
                  <span className={isActive ? 'text-[#2F6FED]' : 'text-[#6B7280]'}>
                    {renderIconFromType(page.iconType)}
                  </span>
                  <span className="flex-1 text-left truncate">{page.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation - Redesigned with admin classes */}
      <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {Object.entries(filteredMenuGroups).map(([groupName, items]) => {
          const isExpanded = expandedGroups.has(groupName);
          const hasActiveItem = items.some(
            (item) =>
              currentPage === item.href || (!!currentPage && currentPage.startsWith(item.href + '/'))
          );

          // For "Main" group, always show items (no collapse)
          if (groupName === 'Main') {
            return (
              <div key={groupName} className="space-y-1">
                {items.map((item) => {
                  const isActive =
                    currentPage === item.href ||
                    (!!currentPage && currentPage.startsWith(item.href + '/'));
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full group relative flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'admin-glass text-white'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                      )}
                      <span className={`relative flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-400'} transition-colors`}>
                        {item.icon}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="admin-badge admin-badge-error absolute -top-1 -right-1 text-[9px] px-1 py-0.5">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                          {item.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 rounded">
                              {item.shortcut}
                            </kbd>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          }

          // For other groups, show collapsible sections
          return (
            <div key={groupName}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-3 py-2 mb-2 group hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors">
                    {groupName}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
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
                          className={`w-full group relative flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'admin-glass text-white'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                          title={collapsed ? item.label : undefined}
                        >
                          {isActive && !collapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                          )}
                          <span className={`relative flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-400'} transition-colors`}>
                            {item.icon}
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="admin-badge admin-badge-error absolute -top-1 -right-1 text-[9px] px-1 py-0.5">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </span>
                          {!collapsed && (
                            <>
                              <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                              {item.shortcut && (
                                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 rounded">
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

      {/* Keyboard Shortcuts Help - Hidden by default, only show on hover/focus */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-[#2A3440] opacity-0 hover:opacity-100 transition-opacity group">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[#6B7280] hover:text-[#AEBAC7] hover:bg-[#141A22] rounded transition-all duration-200"
            title="Keyboard shortcuts"
          >
            <Command className="w-3.5 h-3.5" />
            {showShortcuts && (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-1.5 space-y-1 overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] px-2">
                  <span className="text-[#6B7280]">⌘K</span>
                  <span className="text-[#6B7280]">Search</span>
                </div>
                <div className="flex items-center justify-between text-[10px] px-2">
                  <span className="text-[#6B7280]">⌘B</span>
                  <span className="text-[#6B7280]">Toggle</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* User Profile & Actions - Redesigned */}
      <div className={`px-4 py-4 border-t border-white/8 space-y-3 ${collapsed ? 'px-3' : ''}`}>
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'justify-end px-3'} py-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-all duration-200`}
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
        </button>

        {/* User Profile */}
        <div className="admin-glass p-3 rounded-lg">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {adminInitials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{adminName}</div>
                <div className="text-gray-400 text-xs truncate">{adminEmail}</div>
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200`}
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

      {/* Mobile overlay - only visible on mobile when sidebar is open */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar - only visible on mobile screens */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 h-screen z-50
          bg-gray-950 border-r border-white/10
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-80'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgb(17 24 39) 0%, rgb(31 41 55) 100%)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar - only visible on desktop screens */}
      <aside
        className={`
          hidden md:flex sticky top-0 left-0 h-screen z-40
          bg-gray-950 border-r border-white/10
          flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-80'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgb(17 24 39) 0%, rgb(31 41 55) 100%)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
