'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
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

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  const labels = ['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  return { score, label: labels[score] || 'Weak' };
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authFormData, setAuthFormData] = useState({ email: '', password: '', name: '' });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const passwordStrength = getPasswordStrength(authFormData.password);

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

  // Initialize Cloudflare Turnstile widget when signup modal is open
  useEffect(() => {
    if (!turnstileReady || !showAuthModal || authMode !== 'signup') {
      return;
    }

    if (typeof window === 'undefined') return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      return;
    }

    const anyWindow = window as any;
    if (!anyWindow.turnstile) {
      return;
    }

    const container = document.getElementById('turnstile-container');
    if (!container) {
      return;
    }
    // Clear any previous widget
    container.innerHTML = '';

    anyWindow.turnstile.render('#turnstile-container', {
      sitekey: siteKey,
      callback: (token: string) => {
        setTurnstileToken(token);
      },
      'error-callback': () => {
        setTurnstileToken(null);
      },
    } as any);
  }, [turnstileReady, showAuthModal, authMode]);

  // Handle auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'signup') {
      if (!authFormData.password || authFormData.password.length < 12) {
        alert('Password must be at least 12 characters long.');
        return;
      }
      if (!turnstileToken) {
        alert('Please complete the human verification before creating an account.');
        return;
      }
    }

    try {
      // Always POST to /api/auth; the server infers signup vs signin from body fields
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          authMode === 'signin'
            ? { email: authFormData.email, password: authFormData.password }
            : { ...authFormData, turnstileToken },
        ),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthFormData({ email: '', password: '', name: '' });
        setTurnstileToken(null);
        // Reload page to refresh account data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Error during authentication');
    }
  };

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
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Account</h1>
            <p className="text-gray-300 text-sm mb-8">
              Sign in or create an account to manage your profile, favorites, and security settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode('signin');
                }}
                className="px-6 py-3 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-semibold rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode('signup');
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </main>
        <Footer />

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
            <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authFormData.name}
                    onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={authFormData.email}
                  onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authFormData.password}
                  onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                  required
                  minLength={12}
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                />

                {authMode === 'signup' && authFormData.password && (
                  <div className="space-y-1 text-xs mt-1">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Password strength</span>
                      <span
                        className={
                          passwordStrength.label === 'Weak'
                            ? 'text-red-400'
                            : passwordStrength.label === 'Medium'
                            ? 'text-yellow-400'
                            : 'text-emerald-400'
                        }
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={
                          'h-full transition-all ' +
                          (passwordStrength.label === 'Weak'
                            ? 'bg-red-500'
                            : passwordStrength.label === 'Medium'
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500')
                        }
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Use at least 12 characters with a mix of letters, numbers, and symbols.
                    </p>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="mt-3 space-y-1">
                    <div id="turnstile-container" className="flex justify-center" />
                    <p className="text-[11px] text-gray-500 text-center">
                      This quick check helps keep the platform free from bots and spam.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-semibold rounded-lg transition-colors"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-ipl-gold hover:text-ipl-gold/80 text-sm"
                >
                  {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-ipl-dark">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple flex items-center justify-center text-black font-bold text-lg">
            {avatarInitials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Account settings</h1>
            <p className="text-sm text-gray-400">Manage your profile, favorites, and security.</p>
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

        {/* Support & Issues */}
        <section className="mt-10 bg-blue-900/20 border border-blue-500/40 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-2">Support & Issues</h2>
          <p className="text-xs text-blue-100 mb-3">
            Having problems? Report issues, track status, and find answers to common questions.
          </p>
          <div className="space-y-3">
            <a
              href="/issues"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/40 transition-all"
            >
              Report an Issue
            </a>
            <a
              href="/issues?tab=faq"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-600 text-white hover:bg-gray-500 shadow-md shadow-gray-900/40 transition-all"
            >
              View FAQ
            </a>
          </div>
        </section>

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
