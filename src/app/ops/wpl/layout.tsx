'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import GlobalSearch from '@/components/admin/GlobalSearch';
import { LeagueProvider } from '@/contexts/LeagueContext';
import { AdminDataProvider } from '@/contexts/AdminDataContext';
import {
  ADMIN_CSRF_HEADER,
  clearAdminCsrfToken,
  getAdminCsrfToken,
  installAdminCsrfFetch,
  setAdminCsrfToken,
} from '@/lib/admin/csrf';

const PLAYERS_ADMIN_PATHS = [
  '/ops/wpl/players',
  '/ops/wpl/batting-stats',
  '/ops/wpl/bowling-stats',
];

const isPlayersAdminPath = (path: string | null) =>
  Boolean(path && PLAYERS_ADMIN_PATHS.includes(path));

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hasCheckedAuth = useRef(false);
  const isIndexRoute = pathname === '/ops/wpl' || pathname === '/ops/wpl/';

  const getStoredAdminToken = () => {
    try {
      return (
        localStorage.getItem('adminToken') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('authToken')
      );
    } catch {
      return null;
    }
  };

  const storeAdminToken = (token: string) => {
    if (!token) return;

    try {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('authToken', token);
    } catch {
      // localStorage not available
    }
  };

  const parseRoleFromToken = (token: string) => {
    try {
      const tokenPayload = JSON.parse(atob(token));
      return tokenPayload.role || null;
    } catch {
      return null;
    }
  };

  const handleLogout = async () => {
    // Immediately update UI state
    setIsSearchOpen(false);
    setUserRole(null);
    setIsAuthenticated(false);

    const token = getStoredAdminToken();

    // Best-effort server logout (clears HttpOnly cookie + revokes token in KV when possible)
    try {
      const csrfToken = getAdminCsrfToken();
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: csrfToken ? { [ADMIN_CSRF_HEADER]: csrfToken } : undefined,
      });
    } catch {
      try {
        await fetch('/api/auth?action=signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {
        // ignore
      }
    }

    clearAdminCsrfToken();

    // Best-effort local cleanup
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
    } catch {
      // localStorage not available
    }

    router.replace('/ops/wpl');
  };

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    installAdminCsrfFetch();

    const checkAuth = async () => {
      try {
        const googleSessionResponse = await fetch('/api/admin/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (googleSessionResponse.ok) {
          const data = await googleSessionResponse.json();
          if (data.success && data.token) {
            storeAdminToken(data.token);
            setAdminCsrfToken(data.csrfToken);
            setIsAuthenticated(true);
            setUserRole(data.user?.role || 'super_admin');
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to the legacy token path for local development.
      }

      const token = getStoredAdminToken();

      try {
        if (!token) {
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }

        setIsAuthenticated(true);

        const fallbackRole = parseRoleFromToken(token);
        if (fallbackRole) {
          setUserRole(fallbackRole);
        }

        try {
          const response = await fetch(`/api/auth?action=verify&token=${encodeURIComponent(token)}`);
          const data = await response.json();

          if (response.ok && data.success) {
            setUserRole(data.user?.role || fallbackRole);
            return;
          }
        } catch {
          // Ignore verify failures and fall back to the token payload.
        }

        if (!fallbackRole) {
          clearAdminCsrfToken();

          try {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('authToken');
          } catch {
            // localStorage not available
          }
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.log('localStorage not available');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isIndexRoute) {
      router.replace(userRole === 'players_admin' ? '/ops/wpl/players' : '/ops/wpl/dashboard');
    }
  }, [isAuthenticated, isIndexRoute, isLoading, router, userRole]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole === 'players_admin' && !isPlayersAdminPath(pathname)) {
      router.replace('/ops/wpl/players');
    }
  }, [isAuthenticated, isLoading, pathname, router, userRole]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    setUserRole(parseRoleFromToken(token));
    storeAdminToken(token);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // For authenticated users at the index route, redirect to dashboard
  if (isIndexRoute) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Show admin layout with sidebar for authenticated users
  return (
    <LeagueProvider>
      <AdminDataProvider>
        <div className="flex min-h-screen bg-ipl-dark">
          {/* Single sidebar - show PlayersAdminSidebar for players_admin, else AdminSidebar */}
          {userRole === 'players_admin' ? (
            <PlayersAdminSidebar currentPage={pathname} onLogout={handleLogout} />
          ) : (
            <AdminSidebar currentPage={pathname} onLogout={handleLogout} />
          )}
          
          <div className="flex-1 flex flex-col">
            {userRole !== 'players_admin' && (
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="w-full max-w-md">
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
                      >
                        <Search size={18} />
                        <span className="text-sm">Search (⌘K)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <main className="p-6 overflow-y-auto flex-1">
              {children}
            </main>
            {userRole !== 'players_admin' && isSearchOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
                onClick={() => setIsSearchOpen(false)}
              >
                <div 
                  className="w-full max-w-2xl bg-slate-800 border border-slate-600 rounded-xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-600">
                    <div className="flex items-center gap-3">
                      <Search size={20} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search pages, teams, players..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                        autoFocus
                      />
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-center text-gray-400">
                    <p>Start typing to search...</p>
                    <p className="text-sm mt-2">Press ESC to close</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminDataProvider>
    </LeagueProvider>
  );
}
