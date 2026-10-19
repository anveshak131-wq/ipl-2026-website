'use client';

import React from 'react';
import PerformanceMonitor from '@/components/admin/PerformanceMonitor';

export default function PerformancePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Performance Monitoring</h1>
          <p className="text-sm text-slate-400">Live operational latency, p95/p99 statistics, and active threshold alerts</p>
        </div>
      </div>
      <PerformanceMonitor />
    </div>
  );
}
