'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import WPLAdminSidebar from '@/components/admin/WPLAdminSidebar';
import { LeagueProvider } from '@/contexts/LeagueContext';
import { AdminDataProvider } from '@/contexts/AdminDataContext';

export default function WPLOpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [pathname]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
    } catch {}
    setIsAuthenticated(false);
    router.push('/ops/wpl');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-gray-400">
        Loading WPL Admin...
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/ops/wpl') {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <LeagueProvider>
      <AdminDataProvider>
        <div className="flex min-h-screen bg-[#0B0E14] text-white">
          <WPLAdminSidebar currentPage={pathname} onLogout={handleLogout} />
          <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </AdminDataProvider>
    </LeagueProvider>
  );
}
