/**
 * Performance Monitoring System
 * Tracks metrics for chat, API, and server performance
 */

export type MetricType = 'messageLatency' | 'apiResponseTime' | 'serverLoad' | 'errorRate' | 'activeConnections';

export interface PerformanceMetric {
  type: MetricType;
  value: number;
  timestamp: number;
  label?: string;
}

export interface PerformanceStats {
  messageLatency: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  apiResponseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  serverLoad: {
    current: number;
    avg: number;
    peak: number;
  };
  errorRate: {
    current: number;
    avg: number;
    total: number;
  };
  activeConnections: {
    current: number;
    peak: number;
  };
  uptime: number;
}

export interface PerformanceAlert {
  id: string;
  type: MetricType;
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: Map<string, PerformanceAlert> = new Map();
  private startTime: number = Date.now();
  private maxMetricsSize: number = 10000; // Keep last 10k metrics
  private thresholds = {
    messageLatency: 1000, // 1 second
    apiResponseTime: 500, // 500ms
    serverLoad: 80, // 80%
    errorRate: 5, // 5%
    activeConnections: 1000, // 1000 connections
  };

  /**
   * Record a metric
   */
  public recordMetric(type: MetricType, value: number, label?: string): void {
    const metric: PerformanceMetric = {
      type,
      value,
      timestamp: Date.now(),
      label,
    };

    this.metrics.push(metric);

    // Keep metrics size manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Check thresholds
    this.checkThreshold(type, value);
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(type: MetricType, value: number): void {
    const threshold = this.thresholds[type];
    if (!threshold) return;

    const alertId = `alert_${type}`;
    const existingAlert = this.alerts.get(alertId);

    if (value > threshold) {
      if (!existingAlert) {
        const alert: PerformanceAlert = {
          id: alertId,
          type,
          severity: value > threshold * 1.5 ? 'critical' : 'warning',
          message: `${type} exceeded threshold: ${value.toFixed(2)} > ${threshold}`,
          threshold,
          currentValue: value,
          timestamp: Date.now(),
        };
        this.alerts.set(alertId, alert);
      } else {
        // Update existing alert
        existingAlert.currentValue = value;
        existingAlert.severity = value > threshold * 1.5 ? 'critical' : 'warning';
      }
    } else if (existingAlert && !existingAlert.resolved) {
      // Resolve alert if value is back to normal
      existingAlert.resolved = true;
      existingAlert.resolvedAt = Date.now();
    }
  }

  /**
   * Get statistics for a metric type
   */
  private getMetricStats(type: MetricType): number[] {
    return this.metrics
      .filter((m) => m.type === type)
      .map((m) => m.value)
      .sort((a, b) => a - b);
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Get comprehensive performance statistics
   */
  public getStats(): PerformanceStats {
    const messageLatencyStats = this.getMetricStats('messageLatency');
    const apiResponseStats = this.getMetricStats('apiResponseTime');
    const serverLoadStats = this.getMetricStats('serverLoad');
    const errorRateStats = this.getMetricStats('errorRate');
    const activeConnStats = this.getMetricStats('activeConnections');

    const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = (arr: number[]) => arr.length === 0 ? 0 : Math.min(...arr);
    const max = (arr: number[]) => arr.length === 0 ? 0 : Math.max(...arr);

    return {
      messageLatency: {
        avg: avg(messageLatencyStats),
        min: min(messageLatencyStats),
        max: max(messageLatencyStats),
        p95: this.calculatePercentile(messageLatencyStats, 95),
        p99: this.calculatePercentile(messageLatencyStats, 99),
      },
      apiResponseTime: {
        avg: avg(apiResponseStats),
        min: min(apiResponseStats),
        max: max(apiResponseStats),
        p95: this.calculatePercentile(apiResponseStats, 95),
        p99: this.calculatePercentile(apiResponseStats, 99),
      },
      serverLoad: {
        current: activeConnStats.length > 0 ? activeConnStats[activeConnStats.length - 1] : 0,
        avg: avg(serverLoadStats),
        peak: max(serverLoadStats),
      },
      errorRate: {
        current: errorRateStats.length > 0 ? errorRateStats[errorRateStats.length - 1] : 0,
        avg: avg(errorRateStats),
        total: this.metrics.filter((m) => m.type === 'errorRate').length,
      },
      activeConnections: {
        current: activeConnStats.length > 0 ? activeConnStats[activeConnStats.length - 1] : 0,
        peak: max(activeConnStats),
      },
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get recent metrics for charting
   */
  public getRecentMetrics(type: MetricType, limit: number = 60): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.type === type)
      .slice(-limit);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter((a) => !a.resolved)
      .sort((a, b) => {
        const severityOrder = { warning: 0, critical: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get all alerts (including resolved)
   */
  public getAllAlerts(limit: number = 100): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Resolve an alert manually
   */
  public resolveAlert(alertId: string): PerformanceAlert | null {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
    return alert || null;
  }

  /**
   * Set custom threshold
   */
  public setThreshold(type: MetricType, value: number): void {
    this.thresholds[type] = value;
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): Record<MetricType, number> {
    return { ...this.thresholds };
  }

  /**
   * Clear old metrics (older than specified time in ms)
   */
  public clearOldMetrics(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    const initialLength = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);
    return initialLength - this.metrics.length;
  }

  /**
   * Export metrics as CSV
   */
  public exportMetricsAsCSV(): string {
    const headers = ['timestamp', 'type', 'value', 'label'];
    const rows = this.metrics.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.type,
      m.value.toFixed(2),
      m.label || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }

  /**
   * Reset monitor
   */
  public reset(): void {
    this.metrics = [];
    this.alerts.clear();
    this.startTime = Date.now();
  }
}

// Singleton instance
let instance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!instance) {
    instance = new PerformanceMonitor();
  }
  return instance;
}

export function resetPerformanceMonitor(): void {
  instance = null;
}
