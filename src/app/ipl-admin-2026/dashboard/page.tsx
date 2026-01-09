'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LoadingSpinner } from '@/components/admin/animations';
import { useLeague } from '@/contexts/LeagueContext';
import { 
  BarChart3, 
  Users, 
  Activity, 
  Calendar, 
  Target,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Mock stats data
  const [stats] = useState([
    {
      label: 'Total Users',
      value: '2,847',
      icon: Users,
      trend: 'up',
      trendColor: 'text-green-400',
      bgGradient: 'from-green-500/10 to-green-600/5',
      borderColor: 'border-green-500/20',
      hoverColor: 'hover:shadow-green-500/25',
      bgColor: 'bg-green-500/5',
    },
    {
      label: 'Active Matches',
      value: '24',
      icon: Activity,
      trend: 'up',
      trendColor: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      hoverColor: 'hover:shadow-blue-500/25',
      bgColor: 'bg-blue-500/5',
    },
    {
      label: 'Engagement Rate',
      value: '87%',
      icon: Target,
      trend: 'up',
      trendColor: 'text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      hoverColor: 'hover:shadow-emerald-500/25',
      bgColor: 'bg-emerald-500/5',
    },
    {
      label: 'Avg. Session Time',
      value: '4m 32s',
      icon: Clock,
      trend: 'down',
      trendColor: 'text-amber-400',
      bgGradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      hoverColor: 'hover:shadow-amber-500/25',
      bgColor: 'bg-amber-500/5',
    },
  ]);

  const quickActions = [
    {
      title: 'User Management',
      description: 'Monitor engagement & user activity',
      icon: Users,
      path: '/ipl-admin-2026/engagement',
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
      path: '/ipl-admin-2026/live-score',
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
      path: '/ipl-admin-2026/matches',
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
      path: '/ipl-admin-2026/content',
      color: 'amber',
      gradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      hoverColor: 'hover:shadow-amber-500/25',
      bgColor: 'bg-amber-500/5',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-ipl-dark to-black">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color="#FFD700" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ipl-dark to-black">
      <AuroraBackground />
      <AdminSidebar currentPage="/ipl-admin-2026/dashboard" />
      
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
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
                      Monitor your {currentLeague.toUpperCase()} platform performance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="admin-glass px-4 py-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">System Operational</h3>
                  <p className="text-sm text-gray-300">All systems functioning normally</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.path}
                  className={`
                    relative overflow-hidden group rounded-xl p-6 transition-all duration-300
                    ${action.borderColor} ${action.hoverColor}
                    hover:scale-105 hover:shadow-2xl
                  `}
                  style={{
                    background: action.gradient,
                  }}
                >
                  <div className="relative z-10">
                    <action.icon className={`w-6 h-6 ${action.bgColor} transition-colors group-hover:text-white`} />
                    <div className="mt-3">
                      <h3 className="font-bold text-white mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-300">{action.description}</p>
                    </div>
                  </div>
                  
                  {/* Decorative gradient overlay */}
                  <div className={`
                    absolute inset-0 opacity-0 group-hover:opacity-20 
                    transition-opacity duration-300
                    ${action.bgColor}
                  `} />
                </a>
              ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`
                    admin-glass p-6 rounded-xl
                    ${stat.borderColor} ${stat.hoverColor}
                    hover:scale-105
                  `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                  </div>
                  
                  {stat.trend && (
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className={`w-4 h-4 ${stat.trendColor}`} />
                      <span className={`text-sm ${stat.trendColor}`}>
                        {stat.trend === 'up' ? 'Increasing' : 'Decreasing'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
