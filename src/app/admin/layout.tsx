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

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    storeAdminToken(token);
  };

  const handleLogout = async () => {
    // Immediately update UI state
    setIsSearchOpen(false);
    setUserRole(null);
    setIsAuthenticated(false);

    let token: string | null = null;
    try {
      token =
        localStorage.getItem('adminToken') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('authToken');
    } catch {
      // localStorage not available
    }

    // Best-effort server logout (clears HttpOnly cookie + revokes token in KV when possible)
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      try {
        await fetch('/api/auth?action=signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {
        // Network errors - continue with local cleanup
      }
    }

    // Clear local storage
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
    } catch {
      // localStorage not available
    }

    // Redirect to admin login
    router.push('/admin/ipl');
  };

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

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
            setIsAuthenticated(true);
            setUserRole(data.user?.role || 'super_admin');
            return;
          }
        }

        let token: string | null = null;
        try {
          token =
            localStorage.getItem('adminToken') ||
            localStorage.getItem('auth_token') ||
            localStorage.getItem('authToken');
        } catch {
          // localStorage not available
        }

        if (!token) {
          setIsLoading(false);
          return;
        }

        // Verify token with server
        const response = await fetch(`/api/auth?action=verify&token=${encodeURIComponent(token)}`);

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.user?.role || 'admin');
        } else {
          // Token invalid, clear it
          try {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('authToken');
          } catch {
            // localStorage not available
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const isPlayersPage = pathname?.includes('/players');
  const isIPLAdmin = pathname?.includes('/admin/ipl');

  return (
    <LeagueProvider>
      <AdminDataProvider>
        <div className="flex min-h-screen bg-gray-900">
          {/* Sidebar */}
          {isIPLAdmin ? (
            <AdminSidebar onLogout={handleLogout} />
          ) : isPlayersPage ? (
            <PlayersAdminSidebar onLogout={handleLogout} />
          ) : (
            <AdminSidebar onLogout={handleLogout} />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">
                  {isIPLAdmin ? 'IPL Admin' : 'Admin Panel'}
                </h1>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>

          {/* Global Search */}
          {isSearchOpen && (
            <GlobalSearch onClose={() => setIsSearchOpen(false)} />
          )}
        </div>
      </AdminDataProvider>
    </LeagueProvider>
  );
}
