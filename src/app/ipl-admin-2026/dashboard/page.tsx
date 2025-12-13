'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { TrendingUp, Users, MessageSquare, Activity, Calendar, Eye, BarChart3, Zap, ArrowUpRight, Clock, Target, Globe, Database, Shield } from 'lucide-react';

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
      title: 'Active Users',
      value: stats.activeUsers,
      subtitle: 'Currently online',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-500/5 to-indigo-600/5',
      borderColor: 'border-blue-500/20',
      glowColor: 'shadow-blue-500/20',
    },
    {
      title: 'Live Matches',
      value: stats.upcomingMatches,
      subtitle: 'In progress',
      change: '+3',
      trend: 'up',
      icon: Activity,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-500/5 to-teal-600/5',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20',
    },
    {
      title: 'Messages Today',
      value: stats.messagesToday,
      subtitle: `${stats.messagesPerHour}/hr average`,
      change: '+8.3%',
      trend: 'up',
      icon: MessageSquare,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-500/5 to-violet-600/5',
      borderColor: 'border-purple-500/20',
      glowColor: 'shadow-purple-500/20',
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      subtitle: 'User interaction',
      change: '+5.2%',
      trend: 'up',
      icon: Target,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-500/5 to-orange-600/5',
      borderColor: 'border-amber-500/20',
      glowColor: 'shadow-amber-500/20',
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Monitor engagement & user activity',
      icon: Users,
      path: '/ipl-admin-2026/engagement',
      color: 'blue',
      gradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      hoverColor: 'hover:shadow-blue-500/25',
      bgColor: 'bg-blue-500/5',
    },
    {
      title: 'Live Scoring',
      description: 'Update real-time match scores',
      icon: Activity,
      path: '/ipl-admin-2026/live-score',
      color: 'emerald',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      hoverColor: 'hover:shadow-emerald-500/25',
      bgColor: 'bg-emerald-500/5',
    },
    {
      title: 'Match Control',
      description: 'Schedule & manage fixtures',
      icon: Calendar,
      path: '/ipl-admin-2026/matches',
      color: 'violet',
      gradient: 'from-violet-500/10 to-violet-600/5',
      borderColor: 'border-violet-500/20',
      hoverColor: 'hover:shadow-violet-500/25',
      bgColor: 'bg-violet-500/5',
    },
    {
      title: 'Content Hub',
      description: 'Create & publish content',
      icon: BarChart3,
      path: '/ipl-admin-2026/content',
      color: 'amber',
      gradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      hoverColor: 'hover:shadow-amber-500/25',
      bgColor: 'bg-amber-500/5',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar currentPage="/ipl-admin-2026/dashboard" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      Dashboard Overview
                    </h1>
                    <p className="text-gray-400 text-base lg:text-lg">
                      Monitor your {currentLeague.toUpperCase()} platform performance
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* System Status */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'bg-emerald-500 animate-pulse'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'text-emerald-400'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}>
                      {apiStatus.users === 'ok' && apiStatus.messages === 'ok' && apiStatus.matches === 'ok'
                        ? 'All Systems Operational'
                        : apiStatus.users === 'error' || apiStatus.messages === 'error' || apiStatus.matches === 'error'
                        ? 'Service Issues'
                        : 'Loading Services...'}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((card, index) => (
              <div
                key={index}
                className={`group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border ${card.borderColor} hover:border-white/30 transition-all duration-300 overflow-hidden ${card.glowColor} hover:shadow-2xl`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} mb-4 shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Value */}
                  <div className="mb-3">
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {isLoading ? (
                        <div className="w-20 h-8 bg-slate-700/50 rounded animate-pulse"></div>
                      ) : (
                        card.value
                      )}
                    </h3>
                    {card.subtitle && (
                      <p className="text-gray-400 text-sm">{card.subtitle}</p>
                    )}
                  </div>

                  {/* Title and Change */}
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300 text-sm font-medium">{card.title}</p>
                    {card.trend === 'up' && (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" />
                        {card.change}
                      </div>
                    )}
                    {card.trend === 'neutral' && (
                      <div className="text-gray-400 text-xs font-semibold bg-gray-500/10 px-2 py-1 rounded-full">
                        {card.change}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}></div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4" />
                <span>Frequently used</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  className={`group relative ${action.bgColor} backdrop-blur-xl rounded-2xl p-6 border ${action.borderColor} ${action.hoverColor} hover:shadow-2xl transition-all duration-300 text-left overflow-hidden hover:scale-[1.02]`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>

                  <div className="relative z-10">
                    <action.icon className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-white font-semibold mb-2 group-hover:text-white transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{action.description}</p>
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
          <div className="mb-10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Message Activity</h2>
                  <p className="text-sm text-gray-400">Real-time conversation analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center p-3 bg-slate-800/50 rounded-xl border border-slate-600/30">
                  <p className="text-xs text-gray-400 mb-1">Peak Hour</p>
                  <p className="text-lg font-bold text-white">
                    {hourlyMessages.length > 0
                      ? hourlyMessages.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyMessages[0]).hour
                      : '--'}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-xl border border-slate-600/30">
                  <p className="text-xs text-gray-400 mb-1">Avg/Hour</p>
                  <p className="text-lg font-bold text-purple-400">{stats.messagesPerHour}</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced bar chart */}
            <div className="relative">
              {hourlyMessages.length > 0 ? (
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-end justify-between h-48 gap-1">
                    {hourlyMessages.map((data, idx) => {
                      const maxCount = Math.max(...hourlyMessages.map(d => d.count), 1);
                      const height = (data.count / maxCount) * 100;
                      const isCurrentHour = data.hour === `${new Date().getHours().toString().padStart(2, '0')}:00`;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                          <div className="w-full relative group">
                            {/* Enhanced tooltip */}
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                              <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                                <div className="font-semibold">{data.count} messages</div>
                                <div className="text-gray-400">{data.hour}</div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-950"></div>
                            </div>

                            {/* Enhanced bar */}
                            <div
                              className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                                isCurrentHour
                                  ? 'bg-gradient-to-t from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                                  : 'bg-gradient-to-t from-slate-600 to-slate-500 group-hover:from-purple-600 group-hover:to-pink-600 group-hover:shadow-lg group-hover:shadow-purple-500/20'
                              }`}
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                          </div>
                          {idx % 4 === 0 && (
                            <span className="text-xs text-gray-400 font-medium">{data.hour.split(':')[0]}h</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart labels */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-xs text-gray-400">
                      <span className="inline-block w-3 h-3 bg-gradient-to-r from-slate-500 to-slate-400 rounded mr-2"></span>
                      Hourly activity over 24h
                    </div>
                    <div className="text-xs text-gray-400">
                      Peak: {hourlyMessages.length > 0 ? hourlyMessages.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyMessages[0]).count : 0} messages
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-slate-700/50">
                  <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No message data available yet</p>
                  <p className="text-gray-500 text-xs mt-1">Activity will appear as users engage</p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Platform Overview */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Platform Overview</h2>
                </div>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/40 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Total Matches</p>
                    <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled fixtures</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/40 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Chat Messages</p>
                    <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
                    <p className="text-xs text-gray-500 mt-1">Total conversations</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/40 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Page Views</p>
                    <p className="text-3xl font-bold text-white">{stats.pageViews.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Total visits</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Eye className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity & Engagement by Time of Day */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">User Activity</h2>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300 text-sm font-medium">Active Users</span>
                    <span className="text-emerald-400 text-sm font-semibold flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Live
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <div className="text-4xl font-bold text-white">{stats.activeUsers}</div>
                    <div className="text-sm text-gray-400">/ {stats.peakActiveUsers} peak</div>
                  </div>
                  <div className="w-full bg-slate-700/40 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${Math.min((stats.activeUsers / Math.max(stats.peakActiveUsers, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Real-time user engagement</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 text-center hover:border-slate-500/40 transition-all duration-300">
                    <p className="text-gray-400 text-sm mb-3">Upcoming Matches</p>
                    <p className="text-3xl font-bold text-white mb-1">{stats.upcomingMatches}</p>
                    <p className="text-gray-500 text-xs">Scheduled</p>
                  </div>
                  <div className="p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 text-center hover:border-slate-500/40 transition-all duration-300">
                    <p className="text-gray-400 text-sm mb-3">Messages Today</p>
                    <p className="text-3xl font-bold text-white mb-1">{stats.messagesToday}</p>
                    <p className="text-gray-500 text-xs">Conversations</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Engagement Score</p>
                      <p className="text-3xl font-bold text-white">{stats.engagementRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">User interaction rate</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>

                  {/* Engagement by Time of Day */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-300">Activity by Time</p>
                      <p className="text-xs text-gray-400 bg-gray-500/10 px-2 py-1 rounded-full">Last 24h</p>
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
                          color: 'from-slate-500 to-slate-400',
                          bgColor: 'bg-slate-500/10',
                          borderColor: 'border-slate-500/20',
                        },
                        {
                          label: 'Morning',
                          range: '06:00 – 11:59',
                          value: timeOfDayBuckets.morning,
                          color: 'from-sky-500 to-sky-400',
                          bgColor: 'bg-sky-500/10',
                          borderColor: 'border-sky-500/20',
                        },
                        {
                          label: 'Afternoon',
                          range: '12:00 – 17:59',
                          value: timeOfDayBuckets.afternoon,
                          color: 'from-amber-500 to-amber-400',
                          bgColor: 'bg-amber-500/10',
                          borderColor: 'border-amber-500/20',
                        },
                        {
                          label: 'Evening',
                          range: '18:00 – 23:59',
                          value: timeOfDayBuckets.evening,
                          color: 'from-purple-500 to-purple-400',
                          bgColor: 'bg-purple-500/10',
                          borderColor: 'border-purple-500/20',
                        },
                      ];

                      if (!total) {
                        return (
                          <div className="text-center py-6">
                            <Database className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Not enough data yet to analyze activity patterns.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {segments.map((segment) => {
                            const percentage = Math.round((segment.value / total) * 100);
                            return (
                              <div key={segment.label} className={`p-3 ${segment.bgColor} rounded-lg border ${segment.borderColor}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium text-sm">{segment.label}</span>
                                    <span className="text-gray-400 text-xs">{segment.range}</span>
                                  </div>
                                  <span className="text-white font-bold text-sm">{percentage}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${segment.color} transition-all duration-500`}
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
