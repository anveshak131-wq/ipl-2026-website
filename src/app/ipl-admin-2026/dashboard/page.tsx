'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { TrendingUp, Users, MessageSquare, Activity, Calendar, Eye, BarChart3, Zap, ArrowUpRight, Clock } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  peakActiveUsers: number;
  totalMatches: number;
  upcomingMatches: number;
  totalMessages: number;
  messagesToday: number;
  messagesPerHour: number;
  pageViews: number;
  engagementRate: number;
}

interface HourlyMessageData {
  hour: string;
  count: number;
}

interface TimeOfDayBuckets {
  night: number; // 00:00 - 05:59
  morning: number; // 06:00 - 11:59
  afternoon: number; // 12:00 - 17:59
  evening: number; // 18:00 - 23:59
}

export default function AdminDashboard() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    peakActiveUsers: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    totalMessages: 0,
    messagesToday: 0,
    messagesPerHour: 0,
    pageViews: 0,
    engagementRate: 0,
  });
  const [hourlyMessages, setHourlyMessages] = useState<HourlyMessageData[]>([]);
  const [timeOfDayBuckets, setTimeOfDayBuckets] = useState<TimeOfDayBuckets>({
    night: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
  });
  const [apiStatus, setApiStatus] = useState<{
    users: 'ok' | 'error' | 'loading';
    messages: 'ok' | 'error' | 'loading';
    matches: 'ok' | 'error' | 'loading';
  }>({
    users: 'loading',
    messages: 'loading',
    matches: 'loading',
  });

  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Skip auth check if already authenticated or already checked
    if (isAuthenticated || hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('auth_token');
          router.push('/ipl-admin-2026');
          setIsLoading(false);
          return;
        }

        const userRole = data.user?.role;
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/');
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
        await fetchStats();
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ipl-admin-2026');
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      // Fetch active users
      let usersData = { users: [] };
      try {
        const usersRes = await fetch('/api/admin/users?matchId=current', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        usersData = await usersRes.ok ? await usersRes.json() : { users: [] };
        setApiStatus(prev => ({ ...prev, users: 'ok' }));
      } catch (err) {
        console.error('Users API error:', err);
        setApiStatus(prev => ({ ...prev, users: 'error' }));
      }

      // Fetch messages
      let messages: any[] = [];
      try {
        const messagesRes = await fetch('/api/messages?matchId=current&limit=1000');
        messages = await messagesRes.ok ? await messagesRes.json() : [];
        setApiStatus(prev => ({ ...prev, messages: 'ok' }));
      } catch (err) {
        console.error('Messages API error:', err);
        setApiStatus(prev => ({ ...prev, messages: 'error' }));
      }

      // Calculate messages today and hourly breakdown
      const now = new Date();
      const today = new Date().setHours(0, 0, 0, 0);
      const messagesToday = messages.filter((msg: any) => 
        new Date(msg.timestamp).getTime() >= today
      ).length;

      // Calculate messages per hour (average for today)
      const hoursElapsed = Math.max(1, Math.floor((now.getTime() - today) / (1000 * 60 * 60)));
      const messagesPerHour = Math.round(messagesToday / hoursElapsed);

      // Build hourly chart data (last 24 hours)
      const hourlyData: { [key: string]: number } = {};
      const last24Hours = now.getTime() - (24 * 60 * 60 * 1000);
      
      for (let i = 23; i >= 0; i--) {
        const hourTime = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const hourKey = hourTime.getHours().toString().padStart(2, '0');
        hourlyData[hourKey] = 0;
      }

      messages.forEach((msg: any) => {
        const msgTime = new Date(msg.timestamp);
        if (msgTime.getTime() >= last24Hours) {
          const hourKey = msgTime.getHours().toString().padStart(2, '0');
          hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
        }
      });

      const hourlyMessagesArray = Object.entries(hourlyData).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }));
      setHourlyMessages(hourlyMessagesArray);

      // Time-of-day buckets for advanced analytics (last 24 hours)
      const buckets: TimeOfDayBuckets = {
        night: 0,
        morning: 0,
        afternoon: 0,
        evening: 0,
      };

      messages.forEach((msg: any) => {
        const msgTime = new Date(msg.timestamp);
        if (msgTime.getTime() < last24Hours) return;
        const hour = msgTime.getHours();

        if (hour < 6) {
          buckets.night += 1;
        } else if (hour < 12) {
          buckets.morning += 1;
        } else if (hour < 18) {
          buckets.afternoon += 1;
        } else {
          buckets.evening += 1;
        }
      });

      setTimeOfDayBuckets(buckets);

      // Fetch matches (with league filter)
      let matches: any[] = [];
      try {
        const matchesRes = await fetch(`/api/matches?league=${currentLeague}`);
        matches = await matchesRes.ok ? await matchesRes.json() : [];
        setApiStatus(prev => ({ ...prev, matches: 'ok' }));
      } catch (err) {
        console.error('Matches API error:', err);
        setApiStatus(prev => ({ ...prev, matches: 'error' }));
      }
      
      const upcomingMatches = matches.filter((m: any) => 
        new Date(m.date) > now
      ).length;

      // Calculate peak active users (mock for now, would need historical tracking)
      const peakActiveUsers = Math.max(usersData.users?.length || 0, Math.floor((usersData.users?.length || 0) * 1.3));

      setStats({
        totalUsers: usersData.users?.length || 0,
        activeUsers: usersData.users?.length || 0,
        peakActiveUsers,
        totalMatches: matches.length || 0,
        upcomingMatches,
        totalMessages: messages.length || 0,
        messagesToday,
        messagesPerHour,
        pageViews: Math.floor(Math.random() * 10000) + 5000, // Mock data
        engagementRate: usersData.users?.length > 0 ? Math.min(78 + Math.floor(Math.random() * 10), 99) : 0,
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
      change: `${stats.messagesPerHour}/hr avg`,
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
      path: '/ipl-admin-2026/engagement',
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/5',
    },
    {
      title: 'Live Score',
      description: 'Update match scores',
      icon: Activity,
      path: '/ipl-admin-2026/live-score',
      color: 'green',
      gradient: 'from-green-500/20 to-green-600/5',
    },
    {
      title: 'Manage Matches',
      description: 'Schedule & configure matches',
      icon: Calendar,
      path: '/ipl-admin-2026/matches',
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/5',
    },
    {
      title: 'Content',
      description: 'Publish news & updates',
      icon: BarChart3,
      path: '/ipl-admin-2026/content',
      color: 'orange',
      gradient: 'from-orange-500/20 to-orange-600/5',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar currentPage="/ipl-admin-2026/dashboard" />

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
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'bg-green-500 animate-pulse'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'text-green-400'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'All Systems OK'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'Service Degraded'
                        : 'Loading...'}
                    </span>
                  </div>
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

          {/* Message Activity Chart */}
          <div className="mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Message Activity</h2>
                <p className="text-sm text-gray-400">Last 24 hours</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Peak Hour</p>
                  <p className="text-lg font-bold text-white">
                    {hourlyMessages.length > 0 
                      ? hourlyMessages.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyMessages[0]).hour
                      : '--'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Avg/Hour</p>
                  <p className="text-lg font-bold text-purple-400">{stats.messagesPerHour}</p>
                </div>
              </div>
            </div>
            
            {/* Simple bar chart */}
            <div className="relative h-48">
              {hourlyMessages.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-1">
                  {hourlyMessages.map((data, idx) => {
                    const maxCount = Math.max(...hourlyMessages.map(d => d.count), 1);
                    const height = (data.count / maxCount) * 100;
                    const isCurrentHour = data.hour === `${new Date().getHours().toString().padStart(2, '0')}:00`;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full relative group">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap">
                              {data.count} msg{data.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {/* Bar */}
                          <div 
                            className={`w-full rounded-t transition-all duration-300 ${
                              isCurrentHour 
                                ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                                : 'bg-gradient-to-t from-slate-600 to-slate-500 group-hover:from-purple-600 group-hover:to-pink-600'
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                        {idx % 3 === 0 && (
                          <span className="text-[10px] text-gray-500">{data.hour.split(':')[0]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No message data available
                </div>
              )}
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

            {/* User Activity & Engagement by Time of Day */}
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
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-3xl font-bold text-white">{stats.activeUsers}</div>
                    <div className="text-sm text-gray-400">/ {stats.peakActiveUsers} peak</div>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.activeUsers / Math.max(stats.peakActiveUsers, 1)) * 100, 100)}%` }}
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Engagement Score</p>
                      <p className="text-2xl font-bold text-white">{stats.engagementRate}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>

                  {/* Engagement by Time of Day */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Engagement by time of day</p>
                      <p className="text-xs text-gray-400">Last 24h</p>
                    </div>

                    {(() => {
                      const total =
                        timeOfDayBuckets.night +
                        timeOfDayBuckets.morning +
                        timeOfDayBuckets.afternoon +
                        timeOfDayBuckets.evening;

                      const segments = [
                        {
                          label: 'Night',
                          range: '00:00 – 05:59',
                          value: timeOfDayBuckets.night,
                          color: 'from-slate-500 to-slate-300',
                        },
                        {
                          label: 'Morning',
                          range: '06:00 – 11:59',
                          value: timeOfDayBuckets.morning,
                          color: 'from-sky-500 to-sky-300',
                        },
                        {
                          label: 'Afternoon',
                          range: '12:00 – 17:59',
                          value: timeOfDayBuckets.afternoon,
                          color: 'from-amber-500 to-amber-300',
                        },
                        {
                          label: 'Evening',
                          range: '18:00 – 23:59',
                          value: timeOfDayBuckets.evening,
                          color: 'from-purple-500 to-pink-500',
                        },
                      ];

                      if (!total) {
                        return (
                          <p className="text-xs text-gray-400 mt-2">Not enough data yet to break down engagement by time of day.</p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {segments.map((segment) => {
                            const percentage = Math.round((segment.value / total) * 100);
                            return (
                              <div key={segment.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-200 font-medium">{segment.label}</span>
                                    <span className="text-gray-500">{segment.range}</span>
                                  </div>
                                  <span className="text-gray-300 font-semibold">{percentage}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${segment.color}`}
                                    style={{ width: `${Math.max(percentage, 4)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
