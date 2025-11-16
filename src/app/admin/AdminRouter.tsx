'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboard from './dashboard/page';
import AdminMatches from './matches/page';
import AdminTeams from './teams/page';
import AdminPlayers from './players/page';
import AdminContent from './content/page';
import AdminSettings from './settings/page';
import AdminLegalPage from './legal/page';

export default function AdminRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication and verify admin role
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          // If already on the admin login page, don't push to the same route
          if (pathname !== '/admin' && pathname !== '/admin/' && pathname !== '/admin/setup') {
            router.push('/admin');
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
            if (pathname !== '/admin' && pathname !== '/admin/' && pathname !== '/admin/setup') {
              router.push('/admin');
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
        } catch (error) {
          console.error('Auth verification error:', error);
          if (pathname !== '/admin' && pathname !== '/admin/' && pathname !== '/admin/setup') {
            router.push('/admin');
          }
        }
      } catch (error) {
        // localStorage not available, redirect to login
        if (pathname !== '/admin' && pathname !== '/admin/' && pathname !== '/admin/setup') {
          router.push('/admin');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

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
    if (pathname === '/admin/dashboard' || pathname === '/admin/') {
      return <AdminDashboard />;
    } else if (pathname === '/admin/matches') {
      return <AdminMatches />;
    } else if (pathname === '/admin/teams') {
      return <AdminTeams />;
    } else if (pathname === '/admin/players') {
      return <AdminPlayers />;
    } else if (pathname === '/admin/content') {
      return <AdminContent />;
    } else if (pathname === '/admin/settings') {
      return <AdminSettings />;
    } else if (pathname === '/admin/legal') {
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
    </div>
  );
}
