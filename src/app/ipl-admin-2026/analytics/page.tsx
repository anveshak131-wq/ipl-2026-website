'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  TrendingUp, 
  Target, 
  Award, 
  Activity, 
  Zap, 
  Clock, 
  BarChart3,
  Trophy,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Calendar,
  Search,
  Users,
  Shield,
  Heart
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useLeague } from '@/contexts/LeagueContext';
import { useAdminData } from '@/contexts/AdminDataContext';

export default function AnalyticsPage() {
  const { currentLeague } = useLeague();
  const { players, teams, loading, error, refreshData } = useAdminData();
  const [selectedTimeRange, setSelectedTimeRange] = useState('season');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate analytics data from real player data
  const analyticsData = useMemo(() => {
    if (!players.length || !teams.length) {
      return {
        overview: {
          totalPlayers: 0,
          activePlayers: 0,
          averageRating: 0,
          topPerformers: 0,
          emergingTalent: 0
        },
        performanceMetrics: [],
        teamStats: [],
        playerCategories: {
          batsmen: 0,
          bowlers: 0,
          allRounders: 0,
          wicketKeepers: 0
        },
        recentActivity: []
      };
    }

    // Calculate player categories
    const playerCategories = players.reduce((acc, player) => {
      const role = player.role?.toLowerCase() || '';
      if (role.includes('batsman') || role.includes('batting')) {
        acc.batsmen++;
      } else if (role.includes('bowler') || role.includes('bowling')) {
        acc.bowlers++;
      } else if (role.includes('all-rounder') || role.includes('all rounder')) {
        acc.allRounders++;
      } else if (role.includes('wicket keeper') || role.includes('keeper')) {
        acc.wicketKeepers++;
      }
      return acc;
    }, { batsmen: 0, bowlers: 0, allRounders: 0, wicketKeepers: 0 });

    // Calculate active players (players with stats)
    const activePlayers = players.filter(player => 
      player.stats && Object.keys(player.stats).length > 0
    ).length;

    // Calculate performance metrics for top performers
    const performanceMetrics = players
      .filter(player => player.stats && (player.stats.runs || player.stats.wickets))
      .map(player => {
        const stats = player.stats!;
        const team = teams.find(t => t.id === player.teamId);
        
        // Calculate a simple rating based on performance
        let rating = 5.0; // Base rating
        if (stats.runs) {
          rating += Math.min(stats.runs / 100, 3); // Up to 3 points for runs
        }
        if (stats.wickets) {
          rating += Math.min(stats.wickets / 5, 2); // Up to 2 points for wickets
        }
        if (stats.battingAverage) {
          const avg = parseFloat(stats.battingAverage);
          if (!isNaN(avg)) {
            rating += Math.min(avg / 20, 2); // Up to 2 points for average
          }
        }
        if (stats.economy) {
          const econ = parseFloat(stats.economy);
          if (!isNaN(econ) && econ < 8) {
            rating += Math.min((8 - econ) / 2, 1); // Up to 1 point for good economy
          }
        }
        
        // Determine trend based on recent performance (simplified)
        let trend = 'stable';
        if (stats.runs && stats.runs > 300) trend = 'up';
        else if (stats.runs && stats.runs < 100) trend = 'down';
        
        return {
          id: player.id,
          name: player.name,
          team: team?.name || 'Unknown',
          runs: stats.runs || 0,
          average: stats.battingAverage ? parseFloat(stats.battingAverage) || 0 : 0,
          strikeRate: stats.battingStrikeRate ? parseFloat(stats.battingStrikeRate) || 0 : 0,
          wickets: stats.wickets || 0,
          economy: stats.economy ? parseFloat(stats.economy) || 0 : 0,
          rating: Math.min(rating, 10),
          trend
        };
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    // Calculate team statistics
    const teamStats = teams.map(team => {
      const teamPlayers = players.filter(p => p.teamId === team.id);
      const totalRuns = teamPlayers.reduce((sum, p) => sum + (p.stats?.runs || 0), 0);
      const totalWickets = teamPlayers.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
      const avgRating = teamPlayers.length > 0 
        ? teamPlayers.reduce((sum, p) => {
            const rating = performanceMetrics.find(pm => pm.id === p.id)?.rating || 5;
            return sum + rating;
          }, 0) / teamPlayers.length
        : 0;

      return {
        team: team.name,
        players: teamPlayers.length,
        avgRating,
        totalRuns,
        totalWickets
      };
    });

    // Calculate overview metrics
    const topPerformers = performanceMetrics.filter(p => p.rating >= 8.5).length;
    const averageRating = performanceMetrics.length > 0 
      ? performanceMetrics.reduce((sum, p) => sum + p.rating, 0) / performanceMetrics.length 
      : 0;

    // Generate recent activity (mock for now, but could be based on recent updates)
    const recentActivity = performanceMetrics.slice(0, 5).map(player => ({
      player: player.name,
      action: player.runs > 0 ? `Scored ${player.runs} runs` : `Took ${player.wickets} wickets`,
      match: `${player.team} vs Opponent`,
      time: 'Recently',
      impact: player.rating >= 9 ? 'high' : 'medium'
    }));

    return {
      overview: {
        totalPlayers: players.length,
        activePlayers,
        averageRating,
        topPerformers,
        emergingTalent: players.filter(p => p.age && parseInt(p.age) <= 25).length
      },
      performanceMetrics,
      teamStats,
      playerCategories,
      recentActivity
    };
  }, [players, teams]);

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
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
            {change && <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>}
            <span className="text-gray-400 text-xs">{subtitle}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PlayerOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Players"
          value={analyticsData.overview.totalPlayers}
          change={8.2}
          icon={Users}
          color="bg-blue-500/20"
          subtitle="registered players"
        />
        <MetricCard
          title="Active Players"
          value={analyticsData.overview.activePlayers}
          change={12.5}
          icon={Activity}
          color="bg-green-500/20"
          subtitle="with statistics"
        />
        <MetricCard
          title="Average Rating"
          value={analyticsData.overview.averageRating.toFixed(1)}
          change={3.8}
          icon={Star}
          color="bg-yellow-500/20"
          subtitle="performance score"
        />
        <MetricCard
          title="Top Performers"
          value={analyticsData.overview.topPerformers}
          change={15.3}
          icon={Trophy}
          color="bg-purple-500/20"
          subtitle="rating 8.5+"
        />
        <MetricCard
          title="Emerging Talent"
          value={analyticsData.overview.emergingTalent}
          change={22.1}
          icon={Target}
          color="bg-orange-500/20"
          subtitle="age 25 or under"
        />
      </div>

      {/* Player Categories */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Player Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{analyticsData.playerCategories.batsmen}</div>
            <div className="text-sm text-gray-400 mt-1">Batsmen</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{analyticsData.playerCategories.bowlers}</div>
            <div className="text-sm text-gray-400 mt-1">Bowlers</div>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{analyticsData.playerCategories.allRounders}</div>
            <div className="text-sm text-gray-400 mt-1">All-Rounders</div>
          </div>
          <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{analyticsData.playerCategories.wicketKeepers}</div>
            <div className="text-sm text-gray-400 mt-1">Wicket Keepers</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopPerformers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Top Performers</h3>
        <div className="flex items-center gap-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="season">This Season</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Player</th>
                <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                <th className="text-left p-4 text-gray-400 font-medium">Runs</th>
                <th className="text-left p-4 text-gray-400 font-medium">Average</th>
                <th className="text-left p-4 text-gray-400 font-medium">Strike Rate</th>
                <th className="text-left p-4 text-gray-400 font-medium">Rating</th>
                <th className="text-left p-4 text-gray-400 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.performanceMetrics.map((player, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{player.team}</td>
                  <td className="p-4 text-white font-medium">{player.runs || '-'}</td>
                  <td className="p-4 text-gray-300">{player.average || '-'}</td>
                  <td className="p-4 text-gray-300">{player.strikeRate || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-yellow-400 font-medium">{player.rating}</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(player.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-sm ${
                      player.trend === 'up' ? 'text-green-400' : 
                      player.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {player.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
                       player.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : 
                       <div className="w-4 h-4 flex items-center justify-center">—</div>}
                      {player.trend === 'up' ? 'Rising' : player.trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const TeamAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Team Analytics</h3>
        <button
          onClick={handleRefreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analyticsData.teamStats.map((team, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{team.team}</h4>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">{team.avgRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-xl font-bold text-blue-400">{team.players}</div>
                <div className="text-xs text-gray-400">Players</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-xl font-bold text-green-400">{team.totalRuns}</div>
                <div className="text-xs text-gray-400">Total Runs</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-xl font-bold text-purple-400">{team.totalWickets}</div>
                <div className="text-xs text-gray-400">Total Wickets</div>
              </div>
              <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                <div className="text-xl font-bold text-orange-400">{team.players > 0 ? (team.totalRuns / team.players).toFixed(0) : 0}</div>
                <div className="text-xs text-gray-400">Avg Runs/Player</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const RecentActivity = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Recent Player Activity</h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          Last 24 hours
        </div>
      </div>

      <div className="space-y-3">
        {analyticsData.recentActivity.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.impact === 'high' ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{activity.player}</span>
                    <span className="text-gray-400 text-sm">{activity.action}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{activity.match}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">{activity.time}</div>
                <div className={`text-xs mt-1 ${
                  activity.impact === 'high' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {activity.impact === 'high' ? 'High Impact' : 'Medium Impact'}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Player Analytics</h1>
                <p className="text-gray-400">Comprehensive player performance analysis and insights</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-400 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={handleRefreshData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/50 border border-white/10 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'performers', label: 'Top Performers', icon: Trophy },
                { id: 'teams', label: 'Team Analytics', icon: Users },
                { id: 'activity', label: 'Recent Activity', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {loading || isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && <PlayerOverview />}
                {activeTab === 'performers' && <TopPerformers />}
                {activeTab === 'teams' && <TeamAnalytics />}
                {activeTab === 'activity' && <RecentActivity />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
