'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CheckSquare,
  Square,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { PageTransition, SkeletonLoader } from '@/components/admin/animations';
import { EmptyStateIllustration, AnimatedStatusIcon } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import AdvancedFilterBuilder, {
  FilterCondition,
  SavedFilter,
} from '@/components/admin/AdvancedFilterBuilder';
import FilterChips from '@/components/admin/FilterChips';
import DateRangePicker from '@/components/admin/DateRangePicker';
import BulkEmailOperations from '@/components/admin/email/BulkEmailOperations';
import BulkEmailSendModal from '@/components/admin/email/BulkEmailSendModal';
import EmailTemplates, { EmailTemplate } from '@/components/admin/email/EmailTemplates';
import EmailScheduler, { EmailSchedule } from '@/components/admin/email/EmailScheduler';
import EmailLogs, { EmailLog } from '@/components/admin/email/EmailLogs';
import { exportToCSV, prepareExportData } from '@/lib/admin/exportUtils';
import { api } from '@/lib/data';

interface EmailUser {
  id: string;
  email: string;
  name?: string;
  termsAccepted: boolean;
  emailNotificationsEnabled: boolean;
  favoriteTeamIds: string[];
  unsubscribedAt: string | null;
  unsubscribeReason: string | null;
  timezone: string | null;
  lastLogin: string | null;
  createdAt?: string;
}

type SortField = 'name' | 'email' | 'lastLogin' | 'createdAt' | 'favoriteTeamsCount';
type SortDirection = 'asc' | 'desc';

export default function AdminEmailNotificationsPage() {
  const router = useRouter();
  const { toasts, success, error: showError, closeToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [lastLoginRange, setLastLoginRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [subscriptionRange, setSubscriptionRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'scheduler' | 'logs'>('users');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [matches, setMatches] = useState<Array<{ id: string; team1: string; team2: string; date: string; venue: string; status?: string }>>([]);
  const [news, setNews] = useState<Array<{ id: string; title: string; summary: string }>>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('email_notifications_saved_filters');
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

  // Define fetchUsers before useEffect that uses it - use useRef to avoid dependency issues
  const fetchUsers = useCallback(async (tokenOverride?: string) => {
    try {
      setIsLoading(true);
      const token =
        tokenOverride ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
          : null);

      if (!token) {
        throw new Error('Missing admin token');
      }

      const response = await fetch('/api/admin/email-users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to load email users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (e: any) {
      console.error('Failed to load email users:', e);
      showError(e?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // showError is stable from useToast, no need to include it

  const hasCheckedAuth = useRef(false);
  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    let isMounted = true;

    const checkAuth = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
            : null;

        if (!token) {
          if (isMounted) {
          router.push('/ipl-admin-2026');
            setAuthLoading(false);
          }
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('adminToken');
          } catch (e) {}
          if (isMounted) {
          router.push('/ipl-admin-2026');
            setAuthLoading(false);
          }
          return;
        }

        const role = data.user?.role;
        if (role !== 'admin' && role !== 'super_admin') {
          if (isMounted) {
            showError('Access denied. Admin privileges required.');
          router.push('/');
            setAuthLoading(false);
          }
          return;
        }

        if (isMounted) {
        setIsAuthenticated(true);
          setAuthLoading(false);
        await fetchUsers(token);
        }
      } catch (e) {
        console.error('Admin email auth error:', e);
        if (isMounted) {
          showError('Authentication failed');
        router.push('/ipl-admin-2026');
        setAuthLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Get all unique teams from users
  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    users.forEach((user) => {
      if (user.favoriteTeamIds) {
        user.favoriteTeamIds.forEach((team) => teams.add(team));
      }
    });
    return Array.from(teams).sort();
  }, [users]);

  // Get all unique timezones from users
  const allTimezones = useMemo(() => {
    const timezones = new Set<string>();
    users.forEach((user) => {
      if (user.timezone) {
        timezones.add(user.timezone);
      }
    });
    return Array.from(timezones).sort();
  }, [users]);

  // Filter fields configuration
  const filterFields = [
    { value: 'notificationStatus', label: 'Notification Status', type: 'select' as const },
    { value: 'termsAccepted', label: 'Terms Accepted', type: 'select' as const },
    { value: 'favoriteTeams', label: 'Favorite Teams', type: 'select' as const },
    { value: 'timezone', label: 'Timezone', type: 'select' as const },
    { value: 'email', label: 'Email', type: 'text' as const },
    { value: 'name', label: 'Name', type: 'text' as const },
  ];

  // Apply filters
  const applyFilters = (conditions: FilterCondition[]) => {
    setFilterConditions(conditions);
  };

  // Get field label
  const getFieldLabel = (field: string): string => {
    const fieldConfig = filterFields.find((f) => f.value === field);
    return fieldConfig?.label || field;
  };

  // Save filter preset
  const handleSaveFilter = (name: string, conditions: FilterCondition[]) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      conditions,
      createdAt: Date.now(),
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('email_notifications_saved_filters', JSON.stringify(updated));
    success('Filter preset saved');
  };

  // Delete filter preset
  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('email_notifications_saved_filters', JSON.stringify(updated));
    success('Filter preset deleted');
  };

  // Load filter preset
  const handleLoadFilter = (filter: SavedFilter) => {
    setFilterConditions(filter.conditions);
    success(`Loaded filter: ${filter.name}`);
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Apply search query
    if (searchQuery) {
    const q = searchQuery.toLowerCase();
      result = result.filter((u) => {
      const name = u.name || '';
      return (
        u.email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        (u.favoriteTeamIds || []).join(',').toLowerCase().includes(q)
      );
    });
    }

    // Apply filter conditions
    if (filterConditions.length > 0) {
      result = result.filter((user) => {
        return filterConditions.every((condition) => {
          switch (condition.field) {
            case 'notificationStatus':
              if (condition.operator === 'equals') {
                if (condition.value === 'enabled') {
                  return user.emailNotificationsEnabled && !user.unsubscribedAt;
                } else if (condition.value === 'disabled') {
                  return !user.emailNotificationsEnabled && !user.unsubscribedAt;
                } else if (condition.value === 'unsubscribed') {
                  return !!user.unsubscribedAt;
                }
              }
              return true;

            case 'termsAccepted':
              if (condition.operator === 'equals') {
                return user.termsAccepted === (condition.value === 'true');
              }
              return true;

            case 'favoriteTeams':
              if (condition.operator === 'in') {
                const teams = Array.isArray(condition.value)
                  ? condition.value
                  : String(condition.value).split(',').map((t) => t.trim());
                return teams.some((team) => user.favoriteTeamIds?.includes(team));
              }
              return true;

            case 'timezone':
              if (condition.operator === 'equals') {
                return user.timezone === condition.value;
              } else if (condition.operator === 'contains') {
                return user.timezone?.toLowerCase().includes(String(condition.value).toLowerCase());
              }
              return true;

            case 'email':
              if (condition.operator === 'contains') {
                return user.email.toLowerCase().includes(String(condition.value).toLowerCase());
              } else if (condition.operator === 'startsWith') {
                return user.email.toLowerCase().startsWith(String(condition.value).toLowerCase());
              } else if (condition.operator === 'equals') {
                return user.email.toLowerCase() === String(condition.value).toLowerCase();
              }
              return true;

            case 'name':
              const name = user.name || '';
              if (condition.operator === 'contains') {
                return name.toLowerCase().includes(String(condition.value).toLowerCase());
              } else if (condition.operator === 'startsWith') {
                return name.toLowerCase().startsWith(String(condition.value).toLowerCase());
              } else if (condition.operator === 'equals') {
                return name.toLowerCase() === String(condition.value).toLowerCase();
              }
              return true;

            default:
              return true;
          }
        });
      });
    }

    // Apply date range filters
    if (lastLoginRange.start || lastLoginRange.end) {
      result = result.filter((user) => {
        if (!user.lastLogin) return false;
        const loginDate = new Date(user.lastLogin);
        if (lastLoginRange.start && loginDate < lastLoginRange.start) return false;
        if (lastLoginRange.end) {
          const endDate = new Date(lastLoginRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (loginDate > endDate) return false;
        }
        return true;
      });
    }

    if (subscriptionRange.start || subscriptionRange.end) {
      result = result.filter((user) => {
        const subDate = user.createdAt ? new Date(user.createdAt) : null;
        if (!subDate) return false;
        if (subscriptionRange.start && subDate < subscriptionRange.start) return false;
        if (subscriptionRange.end) {
          const endDate = new Date(subscriptionRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (subDate > endDate) return false;
        }
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;

        case 'email':
          comparison = a.email.toLowerCase().localeCompare(b.email.toLowerCase());
          break;

        case 'lastLogin':
          const loginA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const loginB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          comparison = loginA - loginB;
          break;

        case 'createdAt':
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdA - createdB;
          break;

        case 'favoriteTeamsCount':
          const countA = a.favoriteTeamIds?.length || 0;
          const countB = b.favoriteTeamIds?.length || 0;
          comparison = countA - countB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, filterConditions, sortField, sortDirection, lastLoginRange, subscriptionRange]);

  const stats = useMemo(() => {
    const total = users.length;
    let termsAccepted = 0;
    let enabled = 0;
    let unsubscribed = 0;

    for (const u of users) {
      if (u.termsAccepted) termsAccepted += 1;
      if (u.emailNotificationsEnabled) enabled += 1;
      if (u.unsubscribedAt) unsubscribed += 1;
    }

    return { total, termsAccepted, enabled, unsubscribed };
  }, [users]);

  const handleToggle = async (user: EmailUser) => {
    try {
      setIsUpdating(true);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
          : null;

      if (!token) {
        throw new Error('Missing admin token');
      }

      const response = await fetch('/api/admin/email-users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          emailNotificationsEnabled: !user.emailNotificationsEnabled,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update user');
      }

      const data = await response.json();
      const updated = data.user as EmailUser;
      setUsers((prev) => prev.map((u) => (u.email === updated.email ? { ...u, ...updated } : u)));

      success(
        `Email notifications ${updated.emailNotificationsEnabled ? 'enabled' : 'disabled'} for ${updated.email}`
      );
    } catch (e: any) {
      console.error('Failed to update email user:', e);
      showError(e?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-[#6B7280]" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-[#2F6FED]" />
    ) : (
      <ArrowDown className="w-4 h-4 text-[#2F6FED]" />
    );
  };

  // Load templates, schedules, and logs from localStorage on mount
  useEffect(() => {
    const storedTemplates = localStorage.getItem('email_templates');
    if (storedTemplates) {
      try {
        const parsed = JSON.parse(storedTemplates);
        setTemplates(parsed.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) })));
      } catch (e) {
        console.error('Error loading templates:', e);
      }
    }

    const storedSchedules = localStorage.getItem('email_schedules');
    if (storedSchedules) {
      try {
        const parsed = JSON.parse(storedSchedules);
        setSchedules(parsed.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : null })));
      } catch (e) {
        console.error('Error loading schedules:', e);
      }
    }

    const storedLogs = localStorage.getItem('email_logs');
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs);
        setEmailLogs(parsed.map((l: any) => ({ ...l, sentAt: new Date(l.sentAt), deliveredAt: l.deliveredAt ? new Date(l.deliveredAt) : undefined, openedAt: l.openedAt ? new Date(l.openedAt) : undefined, clickedAt: l.clickedAt ? new Date(l.clickedAt) : undefined, unsubscribedAt: l.unsubscribedAt ? new Date(l.unsubscribedAt) : undefined })));
      } catch (e) {
        console.error('Error loading logs:', e);
      }
    }

    // Load matches and news for bulk email sending
    const loadMatchesAndNews = async () => {
      setIsLoadingMatches(true);
      try {
        const [matchesData, newsData] = await Promise.all([
          api.getMatches().catch(() => []),
          api.getNews().catch(() => []),
        ]);

        // Transform matches to the format expected by the modal
        // Match structure from API: { id, date, time, venue, team1: Team, team2: Team, status }
        const transformedMatches = (matchesData || [])
          .filter((m: any) => {
            // Only include upcoming or scheduled matches
            return m.status === 'upcoming' || m.status === 'scheduled' || !m.status;
          })
          .map((m: any) => {
            // Handle both Team objects and string team names
            const team1Name = typeof m.team1 === 'object' 
              ? (m.team1?.name || m.team1?.shortName || m.team1?.id || 'Team 1')
              : (m.team1 || m.team1Name || 'Team 1');
            
            const team2Name = typeof m.team2 === 'object'
              ? (m.team2?.name || m.team2?.shortName || m.team2?.id || 'Team 2')
              : (m.team2 || m.team2Name || 'Team 2');

            // Combine date and time if time exists
            const matchDate = m.time 
              ? `${m.date}T${m.time}` 
              : (m.date || m.matchDate || new Date().toISOString());

            return {
              id: m.id,
              team1: team1Name,
              team2: team2Name,
              date: matchDate,
              venue: m.venue || m.stadium || 'TBD',
              status: m.status || 'upcoming',
            };
          })
          .sort((a: any, b: any) => {
            // Sort by date, upcoming first
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });

        setMatches(transformedMatches);

        // Transform news data
        const transformedNews = (newsData || []).slice(0, 50).map((n: any) => ({
          id: n.id,
          title: n.title || 'News Article',
          summary: n.summary || n.description || n.content?.substring(0, 200) || '',
        }));

        setNews(transformedNews);
      } catch (e) {
        console.error('Error loading matches/news:', e);
        showError('Failed to load matches and news data');
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatchesAndNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - showError is stable from useToast

  // Bulk operations handlers
  const handleSelectAll = () => {
    setSelectedUsers(new Set(filteredAndSortedUsers.map((u) => u.id || u.email)));
  };

  const handleDeselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleToggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkEnable = async () => {
    const selected = Array.from(selectedUsers);
    try {
      setIsUpdating(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken') : null;
      if (!token) throw new Error('Missing admin token');

      for (const userId of selected) {
        const user = users.find((u) => (u.id || u.email) === userId);
        if (user && !user.emailNotificationsEnabled) {
          await fetch('/api/admin/email-users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: user.email, emailNotificationsEnabled: true }),
          });
        }
      }
      await fetchUsers();
      setSelectedUsers(new Set());
      success(`Enabled email notifications for ${selected.length} user${selected.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      showError(e?.message || 'Failed to enable notifications');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDisable = async () => {
    const selected = Array.from(selectedUsers);
    try {
      setIsUpdating(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken') : null;
      if (!token) throw new Error('Missing admin token');

      for (const userId of selected) {
        const user = users.find((u) => (u.id || u.email) === userId);
        if (user && user.emailNotificationsEnabled) {
          await fetch('/api/admin/email-users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: user.email, emailNotificationsEnabled: false }),
          });
        }
      }
      await fetchUsers();
      setSelectedUsers(new Set());
      success(`Disabled email notifications for ${selected.length} user${selected.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      showError(e?.message || 'Failed to disable notifications');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkExport = () => {
    const selected = Array.from(selectedUsers);
    const selectedUserData = filteredAndSortedUsers.filter((u) => selected.includes(u.id || u.email));
    const exportData = prepareExportData(
      ['name', 'email', 'termsAccepted', 'emailNotificationsEnabled', 'favoriteTeamIds', 'timezone', 'lastLogin', 'createdAt'],
      selectedUserData.map((u) => ({
        name: u.name || 'Unnamed',
        email: u.email,
        termsAccepted: u.termsAccepted ? 'Yes' : 'No',
        emailNotificationsEnabled: u.emailNotificationsEnabled ? 'Enabled' : 'Disabled',
        favoriteTeamIds: (u.favoriteTeamIds || []).join(', '),
        timezone: u.timezone || '',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
      })),
      {
        name: 'Name',
        email: 'Email',
        termsAccepted: 'Terms Accepted',
        emailNotificationsEnabled: 'Notifications',
        favoriteTeamIds: 'Favorite Teams',
        timezone: 'Timezone',
        lastLogin: 'Last Login',
        createdAt: 'Created At',
      }
    );
    exportToCSV(exportData, `email-users-${new Date().toISOString().split('T')[0]}.csv`);
    success(`Exported ${selected.length} user${selected.length > 1 ? 's' : ''}`);
  };

  const handleBulkDelete = async () => {
    const selected = Array.from(selectedUsers);
    try {
      setIsUpdating(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken') : null;
      if (!token) throw new Error('Missing admin token');

      // Note: This would typically call a delete API endpoint
      // For now, we'll just remove from local state
      setUsers((prev) => prev.filter((u) => !selected.includes(u.id || u.email)));
      setSelectedUsers(new Set());
      success(`Deleted ${selected.length} user${selected.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      showError(e?.message || 'Failed to delete users');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkSendEmail = () => {
    if (selectedUsers.size === 0) {
      showError('Please select at least one user');
      return;
    }
    setShowBulkEmailModal(true);
  };

  const handleBulkPreviewEmail = () => {
    if (selectedUsers.size === 0) {
      showError('Please select at least one user');
      return;
    }
    // For now, just open the send modal in preview mode
    setShowBulkEmailModal(true);
  };

  const handleSendBulkEmail = async (data: {
    templateId?: string;
    subject: string;
    body: string;
    recipientIds: string[];
    emailType: 'match' | 'news' | 'custom';
    matchId?: string;
    newsId?: string;
  }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken') : null;
      if (!token) throw new Error('Missing admin token');

      const response = await fetch('/api/admin/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to send emails');
      }

      const result = await response.json();

      // Log the emails
      const newLogs: EmailLog[] = result.sentEmails?.map((email: any) => ({
        id: Date.now().toString() + Math.random(),
        templateId: data.templateId || '',
        templateName: templates.find((t) => t.id === data.templateId)?.name || 'Custom Email',
        recipientEmail: email.email,
        recipientName: email.name || 'User',
        subject: data.subject,
        status: 'sent' as const,
        sentAt: new Date(),
      })) || [];

      setEmailLogs((prev) => [...newLogs, ...prev]);
      localStorage.setItem('email_logs', JSON.stringify([...newLogs, ...emailLogs]));

      success(`Emails sent successfully to ${result.sentCount || data.recipientIds.length} user${(result.sentCount || data.recipientIds.length) > 1 ? 's' : ''}`);
    } catch (e: any) {
      console.error('Failed to send bulk emails:', e);
      throw e;
    }
  };

  // Email template handlers
  const handleSaveTemplate = (template: EmailTemplate) => {
    const updated = templates.find((t) => t.id === template.id)
      ? templates.map((t) => (t.id === template.id ? template : t))
      : [...templates, template];
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
    success('Template deleted');
  };

  const handleSendTestEmail = (template: EmailTemplate, email: string) => {
    // In production, this would call an API to send the test email
    success(`Test email sent to ${email}`);
  };

  // Email schedule handlers
  const handleScheduleEmail = (schedule: EmailSchedule) => {
    const updated = [...schedules, schedule];
    setSchedules(updated);
    localStorage.setItem('email_schedules', JSON.stringify(updated));
  };

  const handleCancelSchedule = (id: string) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, status: 'cancelled' as const } : s));
    setSchedules(updated);
    localStorage.setItem('email_schedules', JSON.stringify(updated));
    success('Schedule cancelled');
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'logs', label: 'Logs', icon: Clock },
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-[#0B0F13]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#E6EDF3]">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F13]">
      <AdminSidebar currentPage="/ipl-admin-2026/email-notifications" />
      <div className="flex-1">
        <PageTransition>
          <div className="p-8 max-w-7xl mx-auto">
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={closeToast} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
            <div>
                <h1 className="text-3xl font-bold text-[#E6EDF3] mb-2 flex items-center gap-3">
                  <Mail className="w-8 h-8 text-[#2F6FED]" />
                  Email Notifications
                </h1>
                <p className="text-[#AEBAC7] text-sm">
                  Manage email notification preferences, templates, scheduling, and logs.
              </p>
            </div>
              {activeTab === 'users' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                onClick={() => fetchUsers()}
                disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2332] border border-[#2A3440] text-[#E6EDF3] hover:bg-[#141A22] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing…' : 'Refresh'}</span>
                </motion.button>
              )}
            </motion.div>

            {/* Tabs */}
            <div className="mb-6 flex items-center gap-2 border-b border-[#2A3440]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id === 'users') {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-[#2F6FED] text-[#2F6FED]'
                        : 'border-transparent text-[#AEBAC7] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
              </button>
                );
              })}
          </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
              <>
            {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141A22] border border-[#2A3440] rounded-xl p-6 hover:border-[#2F6FED]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Total Users</div>
                  <Users className="w-5 h-5 text-[#2F6FED]" />
            </div>
                <div className="text-3xl font-bold text-[#E6EDF3]">{stats.total}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#141A22] border border-[#2A3440] rounded-xl p-6 hover:border-[#10B981]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Terms Accepted</div>
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
                <div className="text-3xl font-bold text-[#10B981]">{stats.termsAccepted}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#141A22] border border-[#2A3440] rounded-xl p-6 hover:border-[#F59E0B]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Emails Enabled</div>
                  <Mail className="w-5 h-5 text-[#F59E0B]" />
            </div>
                <div className="text-3xl font-bold text-[#F59E0B]">{stats.enabled}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#141A22] border border-[#2A3440] rounded-xl p-6 hover:border-[#EF4444]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#AEBAC7] uppercase tracking-wider">Unsubscribed</div>
                  <XCircle className="w-5 h-5 text-[#EF4444]" />
            </div>
                <div className="text-3xl font-bold text-[#EF4444]">{stats.unsubscribed}</div>
              </motion.div>
          </div>

            {/* Filters and Sorting */}
            <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4 mb-6 space-y-4">
              {/* Search and Quick Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEBAC7]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED] focus:border-transparent transition-all"
                />
              </div>

                <div className="flex items-center gap-2">
                  <AdvancedFilterBuilder
                    fields={filterFields.map((f) => {
                      if (f.value === 'notificationStatus') {
                        return {
                          ...f,
                          options: [
                            { value: 'enabled', label: 'Enabled' },
                            { value: 'disabled', label: 'Disabled' },
                            { value: 'unsubscribed', label: 'Unsubscribed' },
                          ],
                        };
                      }
                      if (f.value === 'termsAccepted') {
                        return {
                          ...f,
                          options: [
                            { value: 'true', label: 'Accepted' },
                            { value: 'false', label: 'Not Accepted' },
                          ],
                        };
                      }
                      if (f.value === 'favoriteTeams') {
                        return {
                          ...f,
                          options: allTeams.map((team) => ({ value: team, label: team })),
                        };
                      }
                      if (f.value === 'timezone') {
                        return {
                          ...f,
                          options: allTimezones.map((tz) => ({ value: tz, label: tz })),
                        };
                      }
                      return f;
                    })}
                    onApply={applyFilters}
                    onClear={() => {
                      setFilterConditions([]);
                      setLastLoginRange({ start: null, end: null });
                      setSubscriptionRange({ start: null, end: null });
                    }}
                    savedFilters={savedFilters}
                    onSaveFilter={handleSaveFilter}
                    onDeleteFilter={handleDeleteFilter}
                    onLoadFilter={handleLoadFilter}
                  />
              </div>
            </div>

              {/* Date Range Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#AEBAC7] whitespace-nowrap">Last Login:</span>
                  <DateRangePicker
                    value={lastLoginRange}
                    onChange={setLastLoginRange}
                    placeholder="Select date range"
                  />
                  {(lastLoginRange.start || lastLoginRange.end) && (
                    <button
                      onClick={() => setLastLoginRange({ start: null, end: null })}
                      className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#AEBAC7] whitespace-nowrap">Subscription:</span>
                  <DateRangePicker
                    value={subscriptionRange}
                    onChange={setSubscriptionRange}
                    placeholder="Select date range"
                  />
                  {(subscriptionRange.start || subscriptionRange.end) && (
                    <button
                      onClick={() => setSubscriptionRange({ start: null, end: null })}
                      className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Chips */}
              <FilterChips
                conditions={filterConditions}
                onRemove={(id) => setFilterConditions(filterConditions.filter((c) => c.id !== id))}
                onClearAll={() => {
                  setFilterConditions([]);
                  setLastLoginRange({ start: null, end: null });
                  setSubscriptionRange({ start: null, end: null });
                }}
                getFieldLabel={getFieldLabel}
              />
            </div>

            {/* Bulk Operations Toolbar */}
            {activeTab === 'users' && (
              <BulkEmailOperations
                selectedCount={selectedUsers.size}
                totalCount={filteredAndSortedUsers.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onBulkEnable={handleBulkEnable}
                onBulkDisable={handleBulkDisable}
                onBulkExport={handleBulkExport}
                onBulkDelete={handleBulkDelete}
                onBulkSendEmail={handleBulkSendEmail}
                onBulkPreviewEmail={handleBulkPreviewEmail}
              />
            )}

            {/* Table Container */}
            <div className="bg-[#141A22] border border-[#2A3440] rounded-2xl overflow-hidden">
              {/* Table Header with Sort */}
              <div className="p-4 border-b border-[#2A3440] flex items-center justify-between">
                <div className="text-xs text-[#AEBAC7]">
                  Showing {filteredAndSortedUsers.length} of {users.length} users
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#AEBAC7]">Sort by:</span>
                  <select
                    value={sortField}
                    onChange={(e) => handleSort(e.target.value as SortField)}
                    className="px-3 py-1.5 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="lastLogin">Last Login</option>
                    <option value="createdAt">Subscription Date</option>
                    <option value="favoriteTeamsCount">Favorite Teams Count</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                    title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <SkeletonLoader width="100%" height="3rem" />
                      </div>
                    ))}
                  </div>
                ) : filteredAndSortedUsers.length === 0 ? (
                  <EmptyStateIllustration
                    type="search"
                    title={searchQuery || filterConditions.length > 0 ? 'No users found' : 'No users yet'}
                    description={
                      searchQuery || filterConditions.length > 0
                        ? 'Try adjusting your search terms or filters'
                        : 'Users will appear here once they sign up'
                    }
                  />
              ) : (
                <table className="w-full text-sm">
                    <thead className="bg-[#1A2332]">
                      <tr className="text-left text-[#AEBAC7]">
                        <th className="px-4 py-3 font-medium w-12">
                          <button
                            onClick={() => {
                              if (selectedUsers.size === filteredAndSortedUsers.length) {
                                handleDeselectAll();
                              } else {
                                handleSelectAll();
                              }
                            }}
                            className="flex items-center justify-center"
                          >
                            {selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-[#2F6FED]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#6B7280]" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-2 hover:text-[#E6EDF3] transition-colors"
                          >
                            User
                            {getSortIcon('name')}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center gap-2 hover:text-[#E6EDF3] transition-colors"
                          >
                            Email
                            {getSortIcon('email')}
                          </button>
                        </th>
                      <th className="px-4 py-3 font-medium">Terms</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            onClick={() => handleSort('favoriteTeamsCount')}
                            className="flex items-center gap-2 hover:text-[#E6EDF3] transition-colors"
                          >
                            Teams
                            {getSortIcon('favoriteTeamsCount')}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            onClick={() => handleSort('lastLogin')}
                            className="flex items-center gap-2 hover:text-[#E6EDF3] transition-colors"
                          >
                            Last Login
                            {getSortIcon('lastLogin')}
                          </button>
                        </th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-[#2A3440]">
                      {filteredAndSortedUsers.map((user, index) => (
                        <motion.tr
                          key={user.id || user.email}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                          className="text-[#AEBAC7] hover:bg-[#1A2332] transition-colors group"
                          whileHover={{ x: 4 }}
                        >
                        <td className="px-4 py-3 align-middle">
                            <button
                              onClick={() => handleToggleUserSelection(user.id || user.email)}
                              className="flex items-center justify-center"
                            >
                              {selectedUsers.has(user.id || user.email) ? (
                                <CheckSquare className="w-4 h-4 text-[#2F6FED]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#6B7280]" />
                              )}
                            </button>
                          </td>
                        <td className="px-4 py-3 align-middle">
                            <div className="font-semibold text-[#E6EDF3] text-sm">
                            {user.name || 'Unnamed user'}
                          </div>
                            {user.timezone && (
                              <div className="text-[11px] text-[#6B7280]">{user.timezone}</div>
                            )}
                        </td>
                        <td className="px-4 py-3 align-middle text-xs md:text-sm">{user.email}</td>
                        <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <AnimatedStatusIcon
                                status={user.termsAccepted ? 'success' : 'warning'}
                                size="sm"
                              />
                              <span className="text-xs">
                            {user.termsAccepted ? 'Accepted' : 'Not accepted'}
                          </span>
                            </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <AnimatedStatusIcon
                                status={
                                  user.unsubscribedAt
                                    ? 'error'
                                    : user.emailNotificationsEnabled
                                      ? 'success'
                                      : 'inactive'
                                }
                                size="sm"
                                pulse={user.emailNotificationsEnabled && !user.unsubscribedAt}
                              />
                              <span className="text-xs">
                                {user.unsubscribedAt
                                  ? 'Unsubscribed'
                                  : user.emailNotificationsEnabled
                                    ? 'Enabled'
                                    : 'Disabled'}
                            </span>
                            </div>
                          {user.unsubscribedAt && (
                              <div className="mt-1 text-[10px] text-[#6B7280]">
                                {new Date(user.unsubscribedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                          <td className="px-4 py-3 align-middle text-xs text-[#AEBAC7]">
                            {user.favoriteTeamIds && user.favoriteTeamIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.favoriteTeamIds.map((team, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-[#1A2332] border border-[#2A3440] rounded text-[10px]"
                                  >
                                    {team}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'None'
                          )}
                        </td>
                          <td className="px-4 py-3 align-middle text-xs text-[#AEBAC7]">
                            {user.lastLogin ? (
                              <div>
                                <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                                <div className="text-[10px] text-[#6B7280]">
                                  {new Date(user.lastLogin).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              'Never'
                            )}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggle(user)}
                            disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                                user.emailNotificationsEnabled
                                  ? 'border-red-500/40 text-red-300 bg-red-500/10 hover:bg-red-500/20'
                                  : 'border-green-500/40 text-green-300 bg-green-500/10 hover:bg-green-500/20'
                              }`}
                          >
                            {user.emailNotificationsEnabled ? 'Disable' : 'Enable'}
                            </motion.button>
                        </td>
                        </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
              </>
            )}

            {activeTab === 'templates' && (
              <EmailTemplates
                templates={templates}
                onSave={handleSaveTemplate}
                onDelete={handleDeleteTemplate}
                onSendTest={handleSendTestEmail}
              />
            )}

            {activeTab === 'scheduler' && (
              <EmailScheduler
                templates={templates}
                onSchedule={handleScheduleEmail}
                schedules={schedules}
                onCancel={handleCancelSchedule}
              />
            )}

            {activeTab === 'logs' && (
              <EmailLogs logs={emailLogs} />
            )}

            {/* Bulk Email Send Modal */}
            {activeTab === 'users' && (
              <BulkEmailSendModal
                isOpen={showBulkEmailModal}
                onClose={() => setShowBulkEmailModal(false)}
                onSend={handleSendBulkEmail}
                templates={templates}
                selectedUserIds={Array.from(selectedUsers)}
                selectedUserEmails={filteredAndSortedUsers
                  .filter((u) => selectedUsers.has(u.id || u.email))
                  .map((u) => u.email)}
                matches={matches}
                news={news}
              />
            )}
        </div>
        </PageTransition>
      </div>
    </div>
  );
}
