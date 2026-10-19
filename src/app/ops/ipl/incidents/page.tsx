'use client';

import React from 'react';
import IncidentLog from '@/components/admin/IncidentLog';

export default function IncidentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incident Management</h1>
          <p className="text-sm text-slate-400">Track outages, severity levels, timeline events, and resolution logs</p>
        </div>
      </div>
      <IncidentLog />
    </div>
  );
}
