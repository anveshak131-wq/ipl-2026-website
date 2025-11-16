'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { TrendingUp, Users, MessageSquare, Activity, Calendar, Eye, BarChart3, Zap, ArrowUpRight, Clock } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  upcomingMatches: number;
  totalMessages: number;
  messagesToday: number;
  pageViews: number;
  engagementRate: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    totalMessages: 0,
    messagesToday: 0,
    pageViews: 0,
    engagementRate: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      try {
        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('auth_token');
          router.push('/admin');
          return;
        }

        const userRole = data.user?.role;
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
        await fetchStats();
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/admin');
      }
    };

    checkAuth();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      // Fetch active users
      const usersRes = await fetch('/api/admin/users?matchId=current', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = await usersRes.ok ? await usersRes.json() : { users: [] };

      // Fetch messages
      const messagesRes = await fetch('/api/messages?matchId=current&limit=1000');
      const messages = await messagesRes.ok ? await messagesRes.json() : [];

      // Calculate messages today
      const today = new Date().setHours(0, 0, 0, 0);
      const messagesToday = messages.filter((msg: any) => 
        new Date(msg.timestamp).getTime() >= today
      ).length;

      // Fetch matches
      const matchesRes = await fetch('/api/matches');
      const matches = await matchesRes.ok ? await matchesRes.json() : [];
      
      const now = new Date();
      const upcomingMatches = matches.filter((m: any) => 
        new Date(m.date) > now
      ).length;

      setStats({
        totalUsers: usersData.users?.length || 0,
        activeUsers: usersData.users?.length || 0,
        totalMatches: matches.length || 0,
        upcomingMatches,
        totalMessages: messages.length || 0,
        messagesToday,
        pageViews: Math.floor(Math.random() * 10000) + 5000, // Mock data
        engagementRate: usersData.users?.length > 0 ? 78 : 0, // Mock calculation
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 text-lg">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Active Users',
      value: stats.activeUsers,
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      title: 'Live Matches',
      value: stats.upcomingMatches,
      change: '+3',
      trend: 'up',
      icon: Activity,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
    },
    {
      title: 'Messages Today',
      value: stats.messagesToday,
      change: `${stats.totalMessages} total`,
      trend: 'neutral',
      icon: MessageSquare,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
    },
  ];

  const quickActions = [
    {
      title: 'User Engagement',
      description: 'Monitor live chat & active users',
      icon: Users,
      path: '/admin/engagement',
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/5',
    },
    {
      title: 'Live Score',
      description: 'Update match scores',
      icon: Activity,
      path: '/admin/live-score',
      color: 'green',
      gradient: 'from-green-500/20 to-green-600/5',
    },
    {
      title: 'Manage Matches',
      description: 'Schedule & configure matches',
      icon: Calendar,
      path: '/admin/matches',
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/5',
    },
    {
      title: 'Content',
      description: 'Publish news & updates',
      icon: BarChart3,
      path: '/admin/content',
      color: 'orange',
      gradient: 'from-orange-500/20 to-orange-600/5',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar currentPage="/admin/dashboard" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back! 👋
                </h1>
                <p className="text-gray-400 text-lg">
                  Here's what's happening with your IPL platform today
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">System Online</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} mb-4`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Value */}
                  <div className="mb-2">
                    <h3 className="text-3xl font-bold text-white">
                      {isLoading ? (
                        <div className="w-20 h-8 bg-slate-700/50 rounded animate-pulse"></div>
                      ) : (
                        card.value
                      )}
                    </h3>
                  </div>

                  {/* Title and Change */}
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                    {card.trend === 'up' && (
                      <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                        <ArrowUpRight className="w-3 h-3" />
                        {card.change}
                      </div>
                    )}
                    {card.trend === 'neutral' && (
                      <div className="text-gray-400 text-xs font-semibold">
                        {card.change}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4" />
                <span>Frequently used</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  className={`group relative bg-gradient-to-br ${action.gradient} hover:from-white/10 hover:to-white/5 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 text-left overflow-hidden`}
                >
                  <div className="relative z-10">
                    <action.icon className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{action.description}</p>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Platform Overview */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Platform Overview</h2>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Matches</p>
                    <p className="text-2xl font-bold text-white">{stats.totalMatches}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Chat Messages</p>
                    <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Page Views</p>
                    <p className="text-2xl font-bold text-white">{stats.pageViews.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Eye className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">User Activity</h2>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">Active Now</span>
                    <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stats.activeUsers}</div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.activeUsers * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 text-center">
                    <p className="text-gray-400 text-xs mb-2">Upcoming</p>
                    <p className="text-2xl font-bold text-white">{stats.upcomingMatches}</p>
                    <p className="text-gray-500 text-xs mt-1">Matches</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 text-center">
                    <p className="text-gray-400 text-xs mb-2">Today</p>
                    <p className="text-2xl font-bold text-white">{stats.messagesToday}</p>
                    <p className="text-gray-500 text-xs mt-1">Messages</p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Engagement Score</p>
                      <p className="text-2xl font-bold text-white">{stats.engagementRate}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
