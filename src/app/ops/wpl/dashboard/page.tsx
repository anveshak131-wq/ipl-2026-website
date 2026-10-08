'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import { TrendingUp, Users, MessageSquare, Activity, Calendar, BarChart3, Target, Database, Shield, CheckCircle2, AlertTriangle, FileText, Route } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  peakActiveUsers: number;
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  totalMessages: number;
  messagesToday: number;
  messagesPerHour: number;
  pageViews: number;
  totalPageViews: number;
  uniqueVisitors: number;
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

interface PublishStatus {
  publishedScorecards: number;
  draftScorecards: number;
  totalScorecards: number;
  lastPublishedAt: string | null;
}

interface ApiServiceStatus {
  name: string;
  status: 'ok' | 'error';
  latencyMs: number;
  detail: string;
}

interface RecentAction {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  action: string;
  details: string;
  entityType: string | null;
  entityId: string | null;
}

interface TopRoute {
  path: string;
  views: number;
}

interface DashboardApiResponse {
  stats: DashboardStats;
  hourlyMessages: HourlyMessageData[];
  hourlyTraffic: HourlyMessageData[];
  timeOfDayBuckets: TimeOfDayBuckets;
  publishStatus: PublishStatus;
  apiHealth: {
    overall: 'ok' | 'error';
    services: ApiServiceStatus[];
  };
  traffic: {
    topRoutes: TopRoute[];
    adminPageViewsToday: number;
  };
  recentActions: RecentAction[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    peakActiveUsers: 0,
    totalMatches: 0,
    liveMatches: 0,
    upcomingMatches: 0,
    totalMessages: 0,
    messagesToday: 0,
    messagesPerHour: 0,
    pageViews: 0,
    totalPageViews: 0,
    uniqueVisitors: 0,
    engagementRate: 0,
  });
  const [hourlyMessages, setHourlyMessages] = useState<HourlyMessageData[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyMessageData[]>([]);
  const [timeOfDayBuckets, setTimeOfDayBuckets] = useState<TimeOfDayBuckets>({
    night: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
  });
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    publishedScorecards: 0,
    draftScorecards: 0,
    totalScorecards: 0,
    lastPublishedAt: null,
  });
  const [apiHealth, setApiHealth] = useState<{
    overall: 'ok' | 'error' | 'loading';
    services: ApiServiceStatus[];
  }>({
    overall: 'loading',
    services: [],
  });
  const [topRoutes, setTopRoutes] = useState<TopRoute[]>([]);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [apiStatus, setApiStatus] = useState<{
    dashboard: 'ok' | 'error' | 'loading';
    traffic: 'ok' | 'error' | 'loading';
    scorecards: 'ok' | 'error' | 'loading';
  }>({
    dashboard: 'loading',
    traffic: 'loading',
    scorecards: 'loading',
  });

  const getStoredAdminToken = () =>
    localStorage.getItem('auth_token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('authToken');

  // Fetch stats on mount (auth is handled by layout)
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeague]);

  const fetchStats = async () => {
    setIsLoading(true);
    setApiStatus({
      dashboard: 'loading',
      traffic: 'loading',
      scorecards: 'loading',
    });
    setApiHealth({ overall: 'loading', services: [] });

    try {
      const token = getStoredAdminToken();
      const response = await fetch(`/api/admin/dashboard?league=${currentLeague}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.status}`);
      }

      const data = (await response.json()) as DashboardApiResponse;

      setStats(data.stats);
      setHourlyMessages(data.hourlyMessages || []);
      setHourlyTraffic(data.hourlyTraffic || []);
      setTimeOfDayBuckets(data.timeOfDayBuckets);
      setPublishStatus(data.publishStatus);
      setApiHealth(data.apiHealth);
      setTopRoutes(data.traffic?.topRoutes || []);
      setRecentActions(data.recentActions || []);
      setApiStatus({
        dashboard: 'ok',
        traffic: 'ok',
        scorecards: 'ok',
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setApiStatus({
        dashboard: 'error',
        traffic: 'error',
        scorecards: 'error',
      });
      setApiHealth({ overall: 'error', services: [] });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="admin-glass p-8 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
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
      change: `${stats.peakActiveUsers.toLocaleString()} peak`,
      icon: Users,
      gradient: 'from-pink-500 to-indigo-600',
      bgGradient: 'from-pink-500/5 to-indigo-600/5',
      borderColor: 'border-pink-500/20',
      glowColor: 'shadow-pink-500/20',
    },
    {
      title: 'Public Views Today',
      value: stats.pageViews,
      subtitle: `${stats.uniqueVisitors.toLocaleString()} unique visitors`,
      change: `${stats.totalPageViews.toLocaleString()} total`,
      icon: Route,
      gradient: 'from-pink-500 to-sky-600',
      bgGradient: 'from-pink-500/5 to-sky-600/5',
      borderColor: 'border-pink-500/20',
      glowColor: 'shadow-pink-500/20',
    },
    {
      title: 'Live Matches',
      value: stats.liveMatches,
      subtitle: 'In progress',
      change: `${stats.upcomingMatches.toLocaleString()} upcoming`,
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
      change: `${stats.totalMessages.toLocaleString()} total`,
      icon: Target,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-500/5 to-orange-600/5',
      borderColor: 'border-amber-500/20',
      glowColor: 'shadow-amber-500/20',
    },
    {
      title: 'Engagement Rate',
      value: stats.engagementRate,
      suffix: '%',
      subtitle: 'Messages + active users / views',
      change: `${stats.messagesPerHour.toLocaleString()} msg/hr`,
      icon: MessageSquare,
      gradient: 'from-fuchsia-500 to-pink-600',
      bgGradient: 'from-fuchsia-500/5 to-pink-600/5',
      borderColor: 'border-fuchsia-500/20',
      glowColor: 'shadow-fuchsia-500/20',
    },
    {
      title: 'Published Scorecards',
      value: publishStatus.publishedScorecards,
      subtitle: `${publishStatus.draftScorecards.toLocaleString()} drafts waiting`,
      change: `${publishStatus.totalScorecards.toLocaleString()} total`,
      icon: FileText,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-500/5 to-purple-600/5',
      borderColor: 'border-violet-500/20',
      glowColor: 'shadow-violet-500/20',
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Monitor engagement & user activity',
      icon: Users,
      path: '/ops/wpl/engagement',
      color: 'blue',
      gradient: 'from-pink-500/10 to-purple-600/5',
      borderColor: 'border-pink-500/20',
      hoverColor: 'hover:shadow-pink-500/25',
      bgColor: 'bg-pink-500/5',
    },
    {
      title: 'Live Scoring',
      description: 'Update real-time match scores',
      icon: Activity,
      path: '/ops/wpl/live-score',
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
      path: '/ops/wpl/matches',
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
      path: '/ops/wpl/content',
      color: 'amber',
      gradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      hoverColor: 'hover:shadow-amber-500/25',
      bgColor: 'bg-amber-500/5',
    },
  ];

  const formatTimestamp = (value: string | null) => {
    if (!value) return 'Not published yet';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const formatActionLabel = (value: string) =>
    value
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const maxTrafficCount = Math.max(...hourlyTraffic.map((item) => item.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header - Redesigned */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-gray-400 text-lg lg:text-xl">
                  Real-time insights and analytics for your WPL platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
                <h3 className="text-3xl font-bold text-white mb-1">
                  {stat.value.toLocaleString()}{'suffix' in stat ? stat.suffix : ''}
                </h3>
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
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
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
                        className={`bg-gradient-to-t from-purple-600 to-blue-400 rounded-t transition-all duration-300 hover:from-pink-500 hover:to-blue-300 ${isCurrentHour ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
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
                color: 'from-pink-500 to-cyan-400',
                bgColor: 'bg-pink-500/10',
                borderColor: 'border-pink-500/20',
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

      {/* Operational Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-semibold text-white">API Health</h3>
              <p className="text-xs text-gray-400">Live checks from dashboard aggregation</p>
            </div>
            {apiHealth.overall === 'ok' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div className="space-y-3">
            {apiHealth.services.length === 0 ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                Dashboard API unavailable
              </div>
            ) : (
              apiHealth.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <p className="text-xs text-gray-400">{service.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      service.status === 'ok'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-red-500/15 text-red-300'
                    }`}>
                      {service.status.toUpperCase()}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{service.latencyMs}ms</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-semibold text-white">Publish Status</h3>
              <p className="text-xs text-gray-400">Scorecards visible to end users</p>
            </div>
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200">Published</p>
              <p className="mt-1 text-3xl font-bold text-white">{publishStatus.publishedScorecards}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-200">Drafts</p>
              <p className="mt-1 text-3xl font-bold text-white">{publishStatus.draftScorecards}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-gray-400">Last published</p>
            <p className="mt-1 text-sm font-medium text-white">{formatTimestamp(publishStatus.lastPublishedAt)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-semibold text-white">Recent Admin Actions</h3>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <Database className="w-6 h-6 text-violet-400" />
          </div>
          <div className="space-y-3">
            {recentActions.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                No recent admin actions have been recorded yet.
              </div>
            ) : (
              recentActions.slice(0, 5).map((action) => (
                <div key={action.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatActionLabel(action.action)}</p>
                      <p className="mt-1 text-xs text-gray-400">{action.details || action.entityType || 'Admin update'}</p>
                    </div>
                    <p className="shrink-0 text-right text-[11px] text-gray-500">{formatTimestamp(action.timestamp)}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">{action.adminEmail || action.adminName}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Traffic Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Hourly Traffic</h3>
            <span className={`text-xs rounded-full px-2 py-1 ${
              apiStatus.traffic === 'ok' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
            }`}>
              {apiStatus.traffic === 'ok' ? 'Recording' : 'Offline'}
            </span>
          </div>
          <div className="flex items-end justify-between h-40 gap-1">
            {hourlyTraffic.map((item, index) => {
              const height = (item.count / maxTrafficCount) * 100;
              return (
                <div key={`${item.hour}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-sky-300" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-[10px] text-gray-500">{item.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Top Routes Today</h3>
            <Route className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="space-y-3">
            {topRoutes.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                No page views recorded today yet.
              </div>
            ) : (
              topRoutes.map((route) => {
                const percentage = stats.pageViews > 0 ? Math.round((route.views / stats.pageViews) * 100) : 0;
                return (
                  <div key={route.path} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="truncate text-sm font-medium text-white">{route.path}</p>
                      <span className="text-sm font-bold text-cyan-300">{route.views}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-sky-400" style={{ width: `${Math.max(percentage, 4)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
