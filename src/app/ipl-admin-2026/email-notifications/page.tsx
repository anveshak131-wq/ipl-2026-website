'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
}

export default function AdminEmailNotificationsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
            : null;

        if (!token) {
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('adminToken');
          } catch (e) {}
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        if (role !== 'admin' && role !== 'super_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
        await fetchUsers(token);
      } catch (e) {
        console.error('Admin email auth error:', e);
        router.push('/ipl-admin-2026');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async (tokenOverride?: string) => {
    try {
      setIsLoading(true);
      setError(null);
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
      setError(e?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const name = u.name || '';
      return (
        u.email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        (u.favoriteTeamIds || []).join(',').toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

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
      setError(null);
      setSuccess(null);
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
      setSuccess(
        `${updated.emailNotificationsEnabled ? 'Enabled' : 'Disabled'} email notifications for ${
          updated.email
        }`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      console.error('Failed to update email user:', e);
      setError(e?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/ipl-admin-2026/email-notifications" />
      <div className="flex-1">
        <div className="p-8 max-w-6xl mx-auto">
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Email Notifications</h1>
              <p className="text-gray-400 text-sm">
                View who will receive match reminder emails and toggle notifications per user.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchUsers()}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white border border-white/20 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/70 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Total users</div>
              <div className="text-2xl font-semibold text-white">{stats.total}</div>
            </div>
            <div className="bg-slate-800/70 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Accepted terms</div>
              <div className="text-2xl font-semibold text-emerald-400">{stats.termsAccepted}</div>
            </div>
            <div className="bg-slate-800/70 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Emails enabled</div>
              <div className="text-2xl font-semibold text-ipl-gold">{stats.enabled}</div>
            </div>
            <div className="bg-slate-800/70 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Unsubscribed</div>
              <div className="text-2xl font-semibold text-red-400">{stats.unsubscribed}</div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search by name, email, or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-black/30 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ipl-gold/60"
                />
              </div>
              <div className="text-xs text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading users…</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80">
                    <tr className="text-left text-gray-400">
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Terms</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Teams</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id || user.email} className="text-gray-200">
                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-white text-sm">
                            {user.name || 'Unnamed user'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {user.lastLogin ? `Last login: ${new Date(user.lastLogin).toLocaleString()}` : 'No login yet'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs md:text-sm">{user.email}</td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                              user.termsAccepted
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                                : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/40'
                            }`}
                          >
                            {user.termsAccepted ? 'Accepted' : 'Not accepted'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {user.emailNotificationsEnabled ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-ipl-gold/15 text-ipl-gold border border-ipl-gold/40">
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-300 border border-red-500/40">
                              Disabled
                            </span>
                          )}
                          {user.unsubscribedAt && (
                            <div className="mt-1 text-[10px] text-gray-500">
                              Unsubscribed {new Date(user.unsubscribedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-xs text-gray-300">
                          {user.favoriteTeamIds && user.favoriteTeamIds.length > 0
                            ? user.favoriteTeamIds.join(', ')
                            : 'None'}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <button
                            onClick={() => handleToggle(user)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/20 text-white bg-white/5 hover:bg-white/15 disabled:opacity-50"
                          >
                            {user.emailNotificationsEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
