'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Database, 
  Zap, 
  Clock, 
  Server,
  GitBranch,
  Package,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Download,
  Filter,
  Calendar,
  Target
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useLeague } from '@/contexts/LeagueContext';

// Mock data for demonstration
const mockAnalyticsData = {
  pipeline: {
    status: 'active',
    throughput: 15420,
    latency: 85,
    errorRate: 0.02,
    uptime: 99.95
  },
  kafka: {
    topics: 12,
    messagesPerSecond: 847,
    consumerGroups: 5,
    storageUsed: '2.4 TB'
  },
  redis: {
    connections: 342,
    hitRate: 94.7,
    memoryUsed: '1.8 GB',
    operationsPerSecond: 12500
  },
  elasticsearch: {
    indices: 8,
    documents: 1250000,
    queryTime: 12,
    indexingRate: 450
  },
  realTimeMetrics: [
    { timestamp: '10:00:00', matches: 45, users: 12500, events: 84720 },
    { timestamp: '10:05:00', matches: 48, users: 13200, events: 89340 },
    { timestamp: '10:10:00', matches: 52, users: 14100, events: 95680 },
    { timestamp: '10:15:00', matches: 47, users: 12800, events: 86520 },
    { timestamp: '10:20:00', matches: 51, users: 13900, events: 94200 }
  ]
};

export default function AnalyticsPage() {
  const { currentLeague } = useLeague();
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(mockAnalyticsData);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [currentLeague, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchAnalyticsData();
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
            {change && (
              <div className={`flex items-center gap-1 text-sm ${
                change > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(change)}%
              </div>
            )}
            <span className="text-gray-400 text-xs">{subtitle}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PipelineStatus = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Pipeline Status</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm">Active</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Throughput"
          value={`${analyticsData.pipeline.throughput.toLocaleString()}`}
          change={12.5}
          icon={Activity}
          color="bg-blue-500/20"
          subtitle="events/min"
        />
        <MetricCard
          title="Latency"
          value={`${analyticsData.pipeline.latency}ms`}
          change={-8.3}
          icon={Clock}
          color="bg-green-500/20"
          subtitle="avg response"
        />
        <MetricCard
          title="Error Rate"
          value={`${(analyticsData.pipeline.errorRate * 100).toFixed(2)}%`}
          change={-15.2}
          icon={AlertCircle}
          color="bg-yellow-500/20"
          subtitle="last hour"
        />
        <MetricCard
          title="Uptime"
          value={`${analyticsData.pipeline.uptime}%`}
          change={0.1}
          icon={CheckCircle}
          color="bg-emerald-500/20"
          subtitle="last 30 days"
        />
      </div>
    </div>
  );

  const SystemComponents = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">System Components</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kafka */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <GitBranch className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Apache Kafka</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Topics</span>
              <span className="text-white font-medium">{analyticsData.kafka.topics}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Messages/sec</span>
              <span className="text-white font-medium">{analyticsData.kafka.messagesPerSecond}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Consumer Groups</span>
              <span className="text-white font-medium">{analyticsData.kafka.consumerGroups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Storage Used</span>
              <span className="text-white font-medium">{analyticsData.kafka.storageUsed}</span>
            </div>
          </div>
        </div>

        {/* Redis */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Database className="w-5 h-5 text-red-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Redis Cache</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Connections</span>
              <span className="text-white font-medium">{analyticsData.redis.connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hit Rate</span>
              <span className="text-white font-medium">{analyticsData.redis.hitRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Memory Used</span>
              <span className="text-white font-medium">{analyticsData.redis.memoryUsed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ops/sec</span>
              <span className="text-white font-medium">{analyticsData.redis.operationsPerSecond.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Elasticsearch */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Elasticsearch</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Indices</span>
              <span className="text-white font-medium">{analyticsData.elasticsearch.indices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Documents</span>
              <span className="text-white font-medium">{(analyticsData.elasticsearch.documents / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Query Time</span>
              <span className="text-white font-medium">{analyticsData.elasticsearch.queryTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Indexing Rate</span>
              <span className="text-white font-medium">{analyticsData.elasticsearch.indexingRate}/sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RealTimeMetrics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Real-time Metrics</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Active Matches</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Users Online</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Events/Min</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.realTimeMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white font-mono text-sm">{metric.timestamp}</td>
                  <td className="py-3 px-4 text-white">{metric.matches}</td>
                  <td className="py-3 px-4 text-white">{metric.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-white">{metric.events.toLocaleString()}</td>
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
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                  <p className="text-gray-400">Real-time data pipeline and system performance monitoring</p>
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
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-slate-800/50 p-1 rounded-lg w-fit">
              {['overview', 'pipeline', 'components', 'realtime'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <PipelineStatus />
                  <SystemComponents />
                </div>
              )}
              
              {activeTab === 'pipeline' && <PipelineStatus />}
              {activeTab === 'components' && <SystemComponents />}
              {activeTab === 'realtime' && <RealTimeMetrics />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
