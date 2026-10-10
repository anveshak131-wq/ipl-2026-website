'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LeagueProvider } from '@/contexts/LeagueContext';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import WPLPointsTable from './points-table/page';
import GlobalSearch from '@/components/admin/GlobalSearch';
import WPLAdminDashboard from './dashboard/page';
import WPLBattingStats from './batting-stats/page';
import WPLBowlingStats from './bowling-stats/page';
import WPLPlaying11 from './playing-11/page';
import WPLScorecard from './scorecard/page';
import WPLPlayers from './players/page';
import WPLTeams from './teams/page';
import WPLMatches from './matches/page';

export default function WPLAdminRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Update current page based on pathname (auth is handled by page.tsx)
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

  // Render the appropriate page based on current route
  const renderCurrentPage = () => {
    if (pathname.includes('/matchday')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Match day admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }
    
    if (pathname.includes('/venues')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Venues admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }
    
    if (pathname.includes('/stories')) {
      return (
        <div>
          <WPLAdminSidebarNew />
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
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Live score admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }
    
    if (pathname.includes('/predictions')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              {/* Predictions admin page will be rendered by Next.js routing */}
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/points-table')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLPointsTable />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/batting-stats')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLBattingStats />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/bowling-stats')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLBowlingStats />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/playing-11')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLPlaying11 />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/scorecard')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLScorecard />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/players')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLPlayers />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/teams')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLTeams />
            </div>
          </div>
        </div>
      );
    }

    if (pathname.includes('/matches')) {
      return (
        <div>
          <WPLAdminSidebarNew />
          <div className="ml-64">
            <GlobalSearch />
            <div className="p-6">
              <WPLMatches />
            </div>
          </div>
        </div>
      );
    }

    // Default dashboard
    return (
      <div>
        <WPLAdminSidebarNew />
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
