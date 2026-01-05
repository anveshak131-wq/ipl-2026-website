'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  Target,
  Zap,
  Trophy,
  Star,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  Play,
  Pause
} from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

// Mock data for demonstration
const mockUserAnalytics = {
  overview: {
    totalMatches: 156,
    totalPlayers: 480,
    totalTeams: 10,
    activeUsers: 12500,
    engagementRate: 87.3,
    avgSessionDuration: '15:42'
  },
  popularMatches: [
    {
      id: '1',
      teams: 'MI vs CSK',
      date: '2024-05-15',
      viewers: 45000,
      engagement: 94.2,
      trending: 'up'
    },
    {
      id: '2',
      teams: 'RCB vs KKR',
      date: '2024-05-14',
      viewers: 38000,
      engagement: 91.8,
      trending: 'up'
    },
    {
      id: '3',
      teams: 'DC vs SRH',
      date: '2024-05-13',
      viewers: 32000,
      engagement: 89.5,
      trending: 'down'
    }
  ],
  playerStats: [
    {
      name: 'Virat Kohli',
      team: 'RCB',
      runs: 542,
      strikeRate: 145.8,
      popularity: 98.5,
      trending: 'up'
    },
    {
      name: 'Rohit Sharma',
      team: 'MI',
      runs: 489,
      strikeRate: 138.2,
      popularity: 96.3,
      trending: 'stable'
    },
    {
      name: 'KL Rahul',
      team: 'LSG',
      runs: 456,
      strikeRate: 142.1,
      popularity: 94.7,
      trending: 'down'
    }
  ],
  realTimeActivity: [
    { time: '10:00', activeUsers: 8200, liveViews: 45000, interactions: 1250 },
    { time: '10:15', activeUsers: 9100, liveViews: 52000, interactions: 1450 },
    { time: '10:30', activeUsers: 8900, liveViews: 48000, interactions: 1380 },
    { time: '10:45', activeUsers: 9500, liveViews: 58000, interactions: 1620 },
    { time: '11:00', activeUsers: 10200, liveViews: 62000, interactions: 1780 }
  ],
  engagementMetrics: {
    views: 2450000,
    likes: 185000,
    shares: 45000,
    comments: 12000,
    avgWatchTime: '12:34'
  }
};

export default function AnalyticsPage() {
  const { currentLeague } = useLeague();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(mockUserAnalytics);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [currentLeague, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockUserAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchAnalyticsData();
  };

  const MetricCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="flex items-center gap-2">
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {trend === 'up' ? <ChevronUp className="w-4 h-4" /> : trend === 'down' ? <ChevronDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {Math.abs(trend.value || 0)}%
              </div>
            )}
            <span className="text-gray-400 text-xs">{subtitle}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Matches"
          value={analyticsData.overview.totalMatches}
          icon={Target}
          color="bg-blue-500/20"
          subtitle="this season"
          trend={{ value: 12.5, direction: 'up' }}
        />
        <MetricCard
          title="Active Players"
          value={analyticsData.overview.totalPlayers}
          icon={Users}
          color="bg-green-500/20"
          subtitle="registered"
          trend={{ value: 8.3, direction: 'up' }}
        />
        <MetricCard
          title="Live Viewers"
          value={analyticsData.overview.activeUsers.toLocaleString()}
          icon={Eye}
          color="bg-purple-500/20"
          subtitle="currently online"
          trend={{ value: 15.2, direction: 'up' }}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analyticsData.overview.engagementRate}%`}
          icon={Heart}
          color="bg-red-500/20"
          subtitle="avg interaction"
          trend={{ value: 3.1, direction: 'up' }}
        />
        <MetricCard
          title="Session Duration"
          value={analyticsData.overview.avgSessionDuration}
          icon={Clock}
          color="bg-yellow-500/20"
          subtitle="average time"
          trend={{ value: -2.4, direction: 'down' }}
        />
        <MetricCard
          title="Total Teams"
          value={analyticsData.overview.totalTeams}
          icon={Trophy}
          color="bg-indigo-500/20"
          subtitle="participating"
          trend={{ value: 0, direction: 'stable' }}
        />
      </div>

      {/* Engagement Metrics */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-3">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(analyticsData.engagementMetrics.views / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-400 text-sm">Total Views</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg mx-auto mb-3">
              <Heart className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(analyticsData.engagementMetrics.likes / 1000).toFixed(0)}K
            </div>
            <div className="text-gray-400 text-sm">Likes</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-3">
              <Share2 className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(analyticsData.engagementMetrics.shares / 1000).toFixed(0)}K
            </div>
            <div className="text-gray-400 text-sm">Shares</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(analyticsData.engagementMetrics.comments / 1000).toFixed(1)}K
            </div>
            <div className="text-gray-400 text-sm">Comments</div>
          </div>
        </div>
      </div>
    </div>
  );

  const PopularMatchesTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Trending Matches</h3>
      <div className="space-y-4">
        {analyticsData.popularMatches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h4 className="text-lg font-semibold text-white">{match.teams}</h4>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    match.trending === 'up' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {match.trending === 'up' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {match.trending === 'up' ? 'Trending' : 'Declining'}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span>{match.date}</span>
                  <span>{match.viewers.toLocaleString()} viewers</span>
                  <span>{match.engagement}% engagement</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const PlayerStatsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Top Performers</h3>
      <div className="space-y-4">
        {analyticsData.playerStats.map((player, index) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{player.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{player.team}</span>
                    <span>{player.runs} runs</span>
                    <span>SR: {player.strikeRate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">{player.popularity}%</div>
                  <div className="text-sm text-gray-400">popularity</div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  player.trending === 'up' 
                    ? 'bg-green-500/20 text-green-400' 
                    : player.trending === 'down'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {player.trending === 'up' ? <ChevronUp className="w-3 h-3" /> : 
                   player.trending === 'down' ? <ChevronDown className="w-3 h-3" /> : 
                   <Minus className="w-3 h-3" />}
                  {player.trending}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const RealTimeActivityTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Real-time Activity</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Time</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Active Users</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Live Views</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Interactions</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.realTimeActivity.map((activity, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white font-mono text-sm">{activity.time}</td>
                  <td className="py-3 px-4 text-white">{activity.activeUsers.toLocaleString()}</td>
                  <td className="py-3 px-4 text-white">{activity.liveViews.toLocaleString()}</td>
                  <td className="py-3 px-4 text-white">{activity.interactions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">Real-time insights and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800/50 p-1 rounded-lg w-fit">
          {['overview', 'matches', 'players', 'realtime'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 
               tab === 'matches' ? 'Popular Matches' :
               tab === 'players' ? 'Top Players' : 'Real-time'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'matches' && <PopularMatchesTab />}
          {activeTab === 'players' && <PlayerStatsTab />}
          {activeTab === 'realtime' && <RealTimeActivityTab />}
        </div>
      </div>
    </div>
  );
}
