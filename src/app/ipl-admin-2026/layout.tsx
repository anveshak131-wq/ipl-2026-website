'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import GlobalSearch from '@/components/admin/GlobalSearch';
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
            <div className="px-6 py-4">
              <GlobalSearch />
            </div>
          </div>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </LeagueProvider>
  );
}
