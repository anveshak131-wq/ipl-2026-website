'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Team } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';

interface ProfileResponse {
  profile?: {
    id: string;
    email: string;
    name?: string;
    displayName?: string;
    favoriteTeamIds?: string[];
    favoritePlayerIds?: string[];
  };
}

interface SessionsResponse {
  sessions?: { id: string }[];
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [sessionCount, setSessionCount] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avatarInitials = useMemo(() => {
    const source = displayName || email || '';
    const parts = source.split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
    return initials || 'U';
  }, [displayName, email]);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const load = async () => {
      try {
        const [teamsData, profileRes, sessionsRes] = await Promise.all([
          api.getTeams(),
          fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : {} as ProfileResponse)),
          fetch('/api/account/sessions', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : {} as SessionsResponse)),
        ]);

        setTeams(teamsData);

        const profileData = profileRes as ProfileResponse;
        const p = profileData.profile;
        if (p) {
          setEmail(p.email);
          setDisplayName(p.displayName || p.name || p.email);
          setFavoriteTeamIds(p.favoriteTeamIds || []);
        }

        const sessionsData = sessionsRes as SessionsResponse;
        if (Array.isArray(sessionsData.sessions)) {
          setSessionCount(sessionsData.sessions.length);
        }
      } catch (e) {
        console.error('Failed to load account data:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleToggleTeam = (teamId: string) => {
    setFavoriteTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  const handleSaveProfile = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setError('You must be signed in to update your profile.');
      return;
    }

    setSavingProfile(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          favoriteTeamIds,
        }),
      });

      if (!res.ok) {
        setError('Failed to update profile');
        return;
      }

      setFeedback('Profile updated successfully.');
    } catch (e) {
      console.error('Failed to update profile:', e);
      setError('Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setError('You must be signed in to change your password.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }

      setFeedback('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      console.error('Failed to change password:', e);
      setError('Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSessions = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setError('You must be signed in to manage sessions.');
      return;
    }

    setRevokingSessions(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch('/api/account/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError('Failed to revoke sessions');
        return;
      }

      setFeedback('Signed out of all sessions. You may need to sign in again on other devices.');
      setSessionCount(1); // current token remains
    } catch (e) {
      console.error('Failed to revoke sessions:', e);
      setError('Error revoking sessions');
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setError('You must be signed in to delete your account.');
      return;
    }

    if (!confirm('This will permanently delete your account and anonymize your messages. Continue?')) {
      return;
    }

    try {
      const res = await fetch('/api/account?action=delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError('Failed to delete account');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('adminToken');
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Failed to delete account:', e);
      setError('Error deleting account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ipl-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ipl-dark">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Account</h1>
          <p className="text-gray-300 text-sm">
            Please sign in from the live score or chat page to manage your account settings.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ipl-dark">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple flex items-center justify-center text-black font-bold text-lg">
              {avatarInitials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Account settings</h1>
              <p className="text-sm text-gray-400">Manage your profile, favorites, and security.</p>
            </div>
          </div>
        </div>

        {(feedback || error) && (
          <div className="mb-6">
            {feedback && (
              <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                {feedback}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile */}
          <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="team" size={16} /> Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                  placeholder="How you appear in chat and personalized areas"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                <input
                  type="text"
                  value={email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Favorite teams</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {teams.map((team) => {
                    const active = favoriteTeamIds.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => handleToggleTeam(team.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-ipl-gold/20 text-ipl-gold border-ipl-gold/60'
                            : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {team.shortName}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  These teams will be used to personalize your For You feed and match reminders.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-ipl-gold to-ipl-purple text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Icon name="stats" size={16} /> Security
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Passwords must be at least 12 characters. Avoid common phrases like "password" or "123456".
              </p>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Changing…' : 'Change password'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs text-gray-300">
              <div className="flex items-center justify-between">
                <span>Active sessions</span>
                <span className="text-gray-100 font-semibold">
                  {sessionCount === null ? '—' : sessionCount}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRevokeSessions}
                disabled={revokingSessions}
                className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full"
              >
                {revokingSessions ? 'Revoking sessions…' : 'Sign out of all sessions'}
              </button>
            </div>
          </section>
        </div>

        {/* Danger zone */}
        <section className="mt-10 bg-red-900/20 border border-red-500/40 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-red-300 mb-2">Danger zone</h2>
          <p className="text-xs text-red-100 mb-3">
            Deleting your account will remove your profile and anonymize your chat messages. This
            action cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/40 transition-all"
          >
            Delete my account
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
