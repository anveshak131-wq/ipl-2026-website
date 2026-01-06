'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const quickActions = [
    {
      title: 'User Management',
      description: 'Monitor engagement & user activity',
      path: '/ipl-admin-2026/engagement',
      color: 'blue',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 text-white"></div>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
