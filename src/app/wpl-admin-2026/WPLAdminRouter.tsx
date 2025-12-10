'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LeagueProvider } from '@/contexts/LeagueContext';
import WPLAdminSidebar from '@/components/admin/WPLAdminSidebar';
import GlobalSearch from '@/components/admin/GlobalSearch';
import WPLAdminDashboard from './dashboard/page';

export default function WPLAdminRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
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
          const isLoginPage = pathname === '/wpl-admin-2026' || pathname === '/wpl-admin-2026/';
          if (!isLoginPage) {
            router.push('/wpl-admin-2026');
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
            const isLoginPage = pathname === '/wpl-admin-2026' || pathname === '/wpl-admin-2026/';
            if (!isLoginPage) {
              router.push('/wpl-admin-2026');
            }
            setIsLoading(false);
            return;
          }

          // Check if user has admin or super_admin role
          const userRole = data.user?.role;
          if (userRole !== 'admin' && userRole !== 'super_admin') {
            // Not an admin, redirect to home
            alert('Access denied. Admin privileges required.');
            router.push('/wpl');
            setIsLoading(false);
            return;
          }

          // User is authenticated and has admin role
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.error('Auth verification error:', error);
          const isLoginPage = pathname === '/wpl-admin-2026' || pathname === '/wpl-admin-2026/';
          if (!isLoginPage) {
            router.push('/wpl-admin-2026');
          }
          setIsLoading(false);
        }
      } catch (error) {
        // localStorage not available, redirect to login
        const isLoginPage = pathname === '/wpl-admin-2026' || pathname === '/wpl-admin-2026/';
        if (!isLoginPage) {
          router.push('/wpl-admin-2026');
        }
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update current page based on pathname
  useEffect(() => {
    if (pathname.includes('/matchday')) {
      setCurrentPage('matchday');
    } else if (pathname.includes('/stories')) {
      setCurrentPage('stories');
    } else if (pathname.includes('/live-score')) {
      setCurrentPage('live-score');
    } else {
      setCurrentPage('dashboard');
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be handled by the main page component
  }

  // Render the appropriate page based on current route
  const renderCurrentPage = () => {
    if (pathname.includes('/matchday')) {
      return (
        <div>
          <WPLAdminSidebar currentPage="matchday" />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Match day admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }
    
    if (pathname.includes('/stories')) {
      return (
        <div>
          <WPLAdminSidebar currentPage="stories" />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Stories admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }
    
    if (pathname.includes('/live-score')) {
      return (
        <div>
          <WPLAdminSidebar currentPage="live-score" />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Live score admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }

    // Default dashboard
    return (
      <div>
        <WPLAdminSidebar currentPage="dashboard" />
        <div className="ml-64">
          <GlobalSearch />
          <WPLAdminDashboard />
        </div>
      </div>
    );
  };

  return (
    <LeagueProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
        {renderCurrentPage()}
      </div>
    </LeagueProvider>
  );
}
