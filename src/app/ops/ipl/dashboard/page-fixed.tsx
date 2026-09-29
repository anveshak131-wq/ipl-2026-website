'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
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
        router.push('/ops/ipl');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem('adminToken');
          router.push('/ops/ipl');
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
        await fetchStats();
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ops/ipl');
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

      // Calculate time of day buckets
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
      <div className="flex min-h-screen bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="admin-glass p-8 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-white text-lg font-medium">Loading Dashboard...</p>
                <p className="text-gray-400 text-sm">Fetching your analytics data</p>
              </div>
            </div>
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
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-500/5 to-green-600/5',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20',
    },
    {
      title: 'Messages Today',
      value: stats.messagesToday,
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
      path: '/ops/ipl/engagement',
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
      path: '/ops/ipl/live-score',
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
      path: '/ops/ipl/matches',
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
      path: '/ops/ipl/content',
      color: 'amber',
      gradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      hoverColor: 'hover:shadow-amber-500/25',
      bgColor: 'bg-amber-500/5',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header - Redesigned */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-gray-400 text-lg lg:text-xl">
                  Real-time insights and analytics for your IPL platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glowColor}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-green-400">{stat.change}</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</h3>
                <p className="text-gray-300 text-sm font-medium">{stat.title}</p>
                <p className="text-gray-500 text-xs">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.path)}
              className={`p-6 rounded-xl border ${action.borderColor} bg-gradient-to-br ${action.gradient} hover:${action.hoverColor} transition-all duration-300 group`}
            >
              <div className={`p-3 rounded-lg ${action.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">{action.title}</h3>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity Chart */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Hourly Activity</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-400">Messages per hour</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-end justify-between h-48 gap-1">
              {hourlyMessages.map((data, idx) => {
                const maxCount = Math.max(...hourlyMessages.map(d => d.count), 1);
                const height = (data.count / maxCount) * 100;
                const isCurrentHour = data.hour === `${new Date().getHours().toString().padStart(2, '0')}:00`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full relative group">
                      <div 
                        className={`bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-500 hover:to-blue-300 ${isCurrentHour ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.count} messages
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs ${isCurrentHour ? 'text-blue-400 font-semibold' : 'text-gray-500'}`}>
                      {data.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 bg-gray-500/10 px-2 py-1 rounded-full">Last 24h</p>
          </div>
        </div>

        {/* Time of Day Distribution */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Time of Day Distribution</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-400">Activity patterns</span>
            </div>
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
                color: 'from-yellow-500 to-orange-400',
                bgColor: 'bg-yellow-500/10',
                borderColor: 'border-yellow-500/20',
              },
              {
                label: 'Afternoon',
                range: '12:00 – 17:59',
                value: timeOfDayBuckets.afternoon,
                color: 'from-blue-500 to-cyan-400',
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/20',
              },
              {
                label: 'Evening',
                range: '18:00 – 23:59',
                value: timeOfDayBuckets.evening,
                color: 'from-purple-500 to-pink-400',
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
  );
}
