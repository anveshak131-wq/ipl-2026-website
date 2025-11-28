'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import GlobalSearch from '@/components/admin/GlobalSearch';
import AdminDashboard from './dashboard/page';
import AdminMatches from './matches/page';
import AdminTeams from './teams/page';
import AdminPlayers from './players/page';
import AdminContent from './content/page';
import AdminSettings from './settings/page';
import AdminLegalPage from './legal/page';
import AdminDatasets from './datasets/page';
import AdminDatasetManager from './dataset-manager/page';
import AdminMlLabPage from './ml-lab/page';

export default function AdminRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    
    // Check authentication and verify admin role
    const checkAuth = async () => {
      // Mark as checked immediately to prevent re-runs
      hasCheckedAuth.current = true;
      
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          // If already on the admin login page, don't push to the same route
          const isLoginPage = pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/' || pathname === '/ipl-admin-2026/setup';
          if (!isLoginPage) {
            router.push('/ipl-admin-2026');
          }
          setIsLoading(false);
          return;
        }

        // Verify token and check user role
        try {
          const response = await fetch(`/api/auth?action=verify&token=${token}`);
          const data = await response.json();

          if (!response.ok || !data.success) {
            // Invalid token, redirect to login
            localStorage.removeItem('adminToken');
            localStorage.removeItem('auth_token');
            const isLoginPage = pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/' || pathname === '/ipl-admin-2026/setup';
            if (!isLoginPage) {
              router.push('/ipl-admin-2026');
            }
            setIsLoading(false);
            return;
          }

          // Check if user has admin or super_admin role
          const userRole = data.user?.role;
          if (userRole !== 'admin' && userRole !== 'super_admin') {
            // Not an admin, redirect to home
            alert('Access denied. Admin privileges required.');
            router.push('/');
            setIsLoading(false);
            return;
          }

          // User is authenticated and has admin role
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.error('Auth verification error:', error);
          const isLoginPage = pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/' || pathname === '/ipl-admin-2026/setup';
          if (!isLoginPage) {
            router.push('/ipl-admin-2026');
          }
          setIsLoading(false);
        }
      } catch (error) {
        // localStorage not available, redirect to login
        const isLoginPage = pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/' || pathname === '/ipl-admin-2026/setup';
        if (!isLoginPage) {
          router.push('/ipl-admin-2026');
        }
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isLoading) {
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

  // Render the appropriate component based on pathname
  const renderPage = () => {
    if (
      pathname === '/ipl-admin-2026/dashboard' ||
      pathname === '/ipl-admin-2026/' ||
      pathname === '/ipl-admin-2026'
    ) {
      return <AdminDashboard />;
    } else if (pathname === '/ipl-admin-2026/matches') {
      return <AdminMatches />;
    } else if (pathname === '/ipl-admin-2026/teams') {
      return <AdminTeams />;
    } else if (pathname === '/ipl-admin-2026/players') {
      return <AdminPlayers />;
    } else if (pathname === '/ipl-admin-2026/content') {
      return <AdminContent />;
    } else if (pathname === '/ipl-admin-2026/datasets') {
      return <AdminDatasets />;
    } else if (pathname === '/ipl-admin-2026/dataset-manager') {
      return <AdminDatasetManager />;
    } else if (pathname === '/ipl-admin-2026/ml-lab') {
      return <AdminMlLabPage />;
    } else if (pathname === '/ipl-admin-2026/settings') {
      return <AdminSettings />;
    } else if (pathname === '/ipl-admin-2026/legal') {
      return <AdminLegalPage />;
    }
    return <AdminDashboard />;
  };

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage={pathname} />
      <div className="flex-1">
        {renderPage()}
      </div>
      <GlobalSearch />
    </div>
  );
}
