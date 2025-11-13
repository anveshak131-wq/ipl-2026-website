'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

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
                <span className="text-green-400 text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">10</h3>
              <p className="text-gray-400 text-sm">Total Teams</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <span className="text-green-400 text-sm font-medium">+8%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">3</h3>
              <p className="text-gray-400 text-sm">Players Added</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📅</span>
                <span className="text-green-400 text-sm font-medium">+25%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">3</h3>
              <p className="text-gray-400 text-sm">Matches Scheduled</p>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📰</span>
                <span className="text-green-400 text-sm font-medium">+15%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">2</h3>
              <p className="text-gray-400 text-sm">News Articles</p>
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
                onClick={() => router.push('/admin/players')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">🏃</span>
                <span className="text-white font-medium">Add Player</span>
                <span className="text-gray-400 text-sm block">Register new player</span>
              </button>

              <button 
                onClick={() => router.push('/admin/content')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
              >
                <span className="text-2xl mb-2 block">📝</span>
                <span className="text-white font-medium">Add News</span>
                <span className="text-gray-400 text-sm block">Publish news article</span>
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

          {/* Recent Activity */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-ipl-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-ipl-gold">🏏</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Match added: CSK vs RCB</p>
                  <p className="text-gray-400 text-sm">Scheduled for March 23, 2026</p>
                </div>
                <span className="text-gray-500 text-sm">2h ago</span>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-ipl-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-ipl-gold">🏃</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Player added: Jasprit Bumrah</p>
                  <p className="text-gray-400 text-sm">Joined Mumbai Indians</p>
                </div>
                <span className="text-gray-500 text-sm">4h ago</span>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-ipl-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-ipl-gold">📰</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">News published: IPL 2026 Schedule</p>
                  <p className="text-gray-400 text-sm">Announcement article</p>
                </div>
                <span className="text-gray-500 text-sm">6h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
