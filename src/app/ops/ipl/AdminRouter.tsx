'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminDashboard from './dashboard/page';
import AdminMatches from './matches/page';
import AdminTeams from './teams/page';
import AdminContent from './content/page';
import AdminSettings from './settings/page';
import AdminDatasets from './datasets/page';
import AdminDatasetManager from './dataset-manager/page';
import AdminMlLabPage from './ml-lab/page';
import AdminEngagement from './engagement/page';
import AdminTestLiveScore from './test-live-score/page';
import AdminKeyPlayers from './key-players/page';
import AdminPlaying11 from './playing-11/page';
import AdminNews from './news/page';
import AdminModeration from './moderation/page';
import AdminCoaches from './coaches/page';
import AdminMatchday from './components/AdminMatchday';
import AdminStories from './components/AdminStories';
import AdminPredictions from './predictions/page';
import AdminAnalytics from './analytics/page';
import AdminPointsTable from './points-table/page';

export default function AdminRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
          const isLoginPage = pathname === '/ops/ipl' || pathname === '/ops/ipl/' || pathname === '/ops/ipl/setup';
          if (!isLoginPage) {
            router.push('/ops/ipl');
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
            const isLoginPage = pathname === '/ops/ipl' || pathname === '/ops/ipl/' || pathname === '/ops/ipl/setup';
            if (!isLoginPage) {
              router.push('/ops/ipl');
            }
            setIsLoading(false);
            return;
          }

          const role = data.user?.role;
          setUserRole(role);

          // Check if user has valid admin role
          if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
            alert('Access denied. Admin privileges required.');
            router.push('/');
            setIsLoading(false);
            return;
          }

          // For players_admin, restrict to players pages only
          const allowedPlayersPages = [
            '/ops/ipl/players',
            '/ops/ipl/batting-stats',
            '/ops/ipl/bowling-stats'
          ];
          if (role === 'players_admin' && !allowedPlayersPages.includes(pathname)) {
            router.push('/ops/ipl/players');
            setIsLoading(false);
            return;
          }

          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.error('Auth verification error:', error);
          // If API call fails, try to validate token format as fallback
          try {
            // Parse token to see if it's a valid base64 admin token
            const tokenPayload = JSON.parse(atob(token));
            if (tokenPayload.role === 'admin' || tokenPayload.role === 'super_admin' || tokenPayload.role === 'players_admin') {
              setUserRole(tokenPayload.role);
              
              // For players_admin, restrict to players pages only even in fallback
              const allowedPlayersPages = [
                '/ops/ipl/players',
                '/ops/ipl/batting-stats',
                '/ops/ipl/bowling-stats'
              ];
              if (tokenPayload.role === 'players_admin' && !allowedPlayersPages.includes(pathname)) {
                router.push('/ops/ipl/players');
                setIsLoading(false);
                return;
              }
              
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          } catch {
            // Token is not valid base64, continue to redirect
          }
          
          const isLoginPage = pathname === '/ops/ipl' || pathname === '/ops/ipl/' || pathname === '/ops/ipl/setup';
          if (!isLoginPage) {
            router.push('/ops/ipl');
          }
          setIsLoading(false);
        }
      } catch {
        // localStorage not available, redirect to login
        const isLoginPage = pathname === '/ops/ipl' || pathname === '/ops/ipl/' || pathname === '/ops/ipl/setup';
        if (!isLoginPage) {
          router.push('/ops/ipl');
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
      pathname === '/ops/ipl/dashboard' ||
      pathname === '/ops/ipl/' ||
      pathname === '/ops/ipl'
    ) {
      return <AdminDashboard />;
    } else if (pathname === '/ops/ipl/matches') {
      return <AdminMatches />;
    } else if (pathname === '/ops/ipl/teams') {
      return <AdminTeams />;
    } else if (pathname === '/ops/ipl/players') {
      return <AdminPlayers />;
    } else if (pathname === '/ops/ipl/points-table') {
      return <AdminPointsTable />;
    } else if (pathname === '/ops/ipl/content') {
      return <AdminContent />;
    } else if (pathname === '/ops/ipl/datasets') {
      return <AdminDatasets />;
    } else if (pathname === '/ops/ipl/dataset-manager') {
      return <AdminDatasetManager />;
    } else if (pathname === '/ops/ipl/ml-lab') {
      return <AdminMlLabPage />;
    } else if (pathname === '/ops/ipl/settings') {
      return <AdminSettings />;
    } else if (pathname === '/ops/ipl/legal') {
      return <AdminLegalPage />;
    } else if (pathname === '/ops/ipl/engagement') {
      return <AdminEngagement />;
    } else if (pathname === '/ops/ipl/test-live-score') {
      return <AdminTestLiveScore />;
    } else if (pathname === '/ops/ipl/key-players') {
      return <AdminKeyPlayers />;
    } else if (pathname === '/ops/ipl/playing-11') {
      return <AdminPlaying11 />;
    } else if (pathname === '/ops/ipl/news') {
      return <AdminNews />;
    } else if (pathname === '/ops/ipl/moderation') {
      return <AdminModeration />;
    } else if (pathname === '/ops/ipl/coaches') {
      return <AdminCoaches />;
    } else if (pathname === '/ops/ipl/matchday') {
      return <AdminMatchday />;
    } else if (pathname === '/ops/ipl/stories') {
      return <AdminStories />;
    } else if (pathname === '/ops/ipl/predictions') {
      return <AdminPredictions />;
    } else if (pathname === '/ops/ipl/analytics') {
      return <AdminAnalytics />;
    }
    return <AdminDashboard />;
  };

  // Check if current page is accessible by players_admin
  const isPlayersPage = [
    '/ops/ipl/players',
    '/ops/ipl/batting-stats',
    '/ops/ipl/bowling-stats'
  ].includes(pathname);

  return (
    <div className="flex-1">
      {renderPage()}
    </div>
  );
}
