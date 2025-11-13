'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { api } from '@/lib/data';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesCount: 0,
    contentCount: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin');
          return;
        }
        setIsAuthenticated(true);
        fetchStats();
      } catch (error) {
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [teams, matches, content] = await Promise.all([
        api.getTeams(),
        api.getMatches(),
        api.getContent()
      ]);
      
      setStats({
        teamsCount: teams.length,
        matchesCount: matches.length,
        contentCount: content.length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
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

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/dashboard" />
      
      <div className="flex-1">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            Admin Dashboard
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🏏</span>
                <span className="text-green-400 text-sm font-medium">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.teamsCount}</h3>
              <p className="text-gray-400 text-sm">Total Teams</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">�</span>
                <span className="text-green-400 text-sm font-medium">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.matchesCount}</h3>
              <p className="text-gray-400 text-sm">Matches Scheduled</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">�</span>
                <span className="text-green-400 text-sm font-medium">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.contentCount}</h3>
              <p className="text-gray-400 text-sm">Content Items</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⚙️</span>
                <span className="text-green-400 text-sm font-medium">Live</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Online</h3>
              <p className="text-gray-400 text-sm">System Status</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-effect rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => router.push('/admin/matches')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">➕</span>
                <span className="text-white font-medium">Add Match</span>
                <span className="text-gray-400 text-sm block">Schedule new match</span>
              </button>

              <button 
                onClick={() => router.push('/admin/teams')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">�</span>
                <span className="text-white font-medium">Manage Teams</span>
                <span className="text-gray-400 text-sm block">Add or edit teams</span>
              </button>

              <button 
                onClick={() => router.push('/admin/content')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">📝</span>
                <span className="text-white font-medium">Add Content</span>
                <span className="text-gray-400 text-sm block">Manage banners & news</span>
              </button>

              <button 
                onClick={() => router.push('/admin/settings')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">⚙️</span>
                <span className="text-white font-medium">Settings</span>
                <span className="text-gray-400 text-sm block">Configure system</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white">Teams API</span>
                </div>
                <span className="text-green-400 text-sm">Operational</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white">Matches API</span>
                </div>
                <span className="text-green-400 text-sm">Operational</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white">Content API</span>
                </div>
                <span className="text-green-400 text-sm">Operational</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white">Settings API</span>
                </div>
                <span className="text-green-400 text-sm">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
