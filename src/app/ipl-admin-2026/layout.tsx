'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { LeagueProvider } from '@/contexts/LeagueContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // localStorage not available, continue with login
        console.log('localStorage not available');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Store token in localStorage
    try {
      localStorage.setItem('adminToken', token);
    } catch (error) {
      console.log('localStorage not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ipl-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Show admin layout with sidebar for authenticated users
  return (
    <LeagueProvider>
      <div className="min-h-screen bg-ipl-dark">
        <AdminSidebar />
        <div className="lg:pl-64">
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
          <main className="p-6">
            {children}
          </main>
        </div>
        {isSearchOpen && (
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
    </LeagueProvider>
  );
}
