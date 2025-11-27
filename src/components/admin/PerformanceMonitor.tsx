'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Zap, Activity, AlertTriangle } from 'lucide-react';
import type { PerformanceStats, PerformanceAlert } from '@/lib/performance-monitor';

interface PerformanceMonitorProps {
  stats: PerformanceStats;
  alerts: PerformanceAlert[];
  onResolveAlert?: (alertId: string) => void;
}

export default function PerformanceMonitor({
  stats,
  alerts,
  onResolveAlert,
}: PerformanceMonitorProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getHealthStatus = () => {
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) return { status: 'critical', color: 'text-red-400', bg: 'bg-red-500/10' };

    const warningAlerts = alerts.filter((a) => a.severity === 'warning' && !a.resolved);
    if (warningAlerts.length > 0) return { status: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };

    return { status: 'healthy', color: 'text-green-400', bg: 'bg-green-500/10' };
  };

  const health = getHealthStatus();

  const MetricCard = ({
    title,
    icon: Icon,
    metrics,
    metricKey,
  }: {
    title: string;
    icon: React.ReactNode;
    metrics: Record<string, any>;
    metricKey: string;
  }) => {
    const isExpanded = expandedMetric === metricKey;
    const data = metrics[metricKey];

    return (
      <div
        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition-all"
        onClick={() => setExpandedMetric(isExpanded ? null : metricKey)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-blue-400">{Icon}</div>
            <h3 className="text-white font-semibold">{title}</h3>
          </div>
          <div className={`text-2xl font-bold ${data.current > 500 ? 'text-orange-400' : 'text-green-400'}`}>
            {typeof data.current === 'number' ? formatTime(data.current) : data.current}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {data.avg !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">Average</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.avg)}</p>
                </div>
              )}
              {data.min !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">Minimum</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.min)}</p>
                </div>
              )}
              {data.max !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">Maximum</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.max)}</p>
                </div>
              )}
              {data.p95 !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">P95</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.p95)}</p>
                </div>
              )}
              {data.p99 !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">P99</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.p99)}</p>
                </div>
              )}
              {data.peak !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs">Peak</p>
                  <p className="text-white font-mono text-sm">{formatTime(data.peak)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <div className={`${health.bg} border border-slate-700/50 rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`w-6 h-6 ${health.color}`} />
            <div>
              <p className="text-gray-400 text-sm">System Health</p>
              <p className={`text-lg font-semibold ${health.color}`}>
                {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Uptime</p>
            <p className="text-white font-mono">{formatUptime(stats.uptime)}</p>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Active Alerts ({alerts.filter((a) => !a.resolved).length})
          </h3>

          <div className="space-y-2">
            {alerts
              .filter((a) => !a.resolved)
              .slice(0, 5)
              .map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border flex items-start justify-between ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {onResolveAlert && (
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="ml-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Message Latency"
          icon={<Zap className="w-5 h-5" />}
          metrics={stats}
          metricKey="messageLatency"
        />

        <MetricCard
          title="API Response Time"
          icon={<Activity className="w-5 h-5" />}
          metrics={stats}
          metricKey="apiResponseTime"
        />

        <MetricCard
          title="Server Load"
          icon={<TrendingUp className="w-5 h-5" />}
          metrics={stats}
          metricKey="serverLoad"
        />

        <MetricCard
          title="Error Rate"
          icon={<AlertCircle className="w-5 h-5" />}
          metrics={stats}
          metricKey="errorRate"
        />
      </div>

      {/* Connections */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-2">Active Connections</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{stats.activeConnections.current}</span>
              <span className="text-gray-400 text-sm">/ {stats.activeConnections.peak} peak</span>
            </div>
          </div>

          <div className="w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(stats.activeConnections.current / stats.activeConnections.peak) * 282.7} 282.7`}
                className="text-blue-400 transition-all duration-500"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" textAnchor="middle" className="text-sm font-bold fill-white">
                {Math.round((stats.activeConnections.current / stats.activeConnections.peak) * 100)}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Performance Summary</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
            <span className="text-gray-300">Avg Message Latency</span>
            <span className={`font-mono font-semibold ${stats.messageLatency.avg > 1000 ? 'text-orange-400' : 'text-green-400'}`}>
              {formatTime(stats.messageLatency.avg)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
            <span className="text-gray-300">Avg API Response</span>
            <span className={`font-mono font-semibold ${stats.apiResponseTime.avg > 500 ? 'text-orange-400' : 'text-green-400'}`}>
              {formatTime(stats.apiResponseTime.avg)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
            <span className="text-gray-300">Error Rate</span>
            <span className={`font-mono font-semibold ${stats.errorRate.current > 5 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.errorRate.current.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
            <span className="text-gray-300">System Uptime</span>
            <span className="font-mono font-semibold text-green-400">{formatUptime(stats.uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
