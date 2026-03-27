'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, Trophy, Settings, BarChart3, Calendar } from 'lucide-react';

export default function AdminIPLPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const adminSections = [
    {
      title: 'Live Score',
      description: 'Manage live cricket scores and commentary',
      icon: Activity,
      href: '/admin/ipl/live-score',
      color: 'bg-cyan-600 hover:bg-cyan-700'
    },
    {
      title: 'Matches',
      description: 'Manage IPL matches and fixtures',
      icon: Calendar,
      href: '/admin/ipl/matches',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Players',
      description: 'Manage player profiles and statistics',
      icon: Users,
      href: '/admin/ipl/players',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Teams',
      description: 'Manage IPL teams and squad information',
      icon: Trophy,
      href: '/admin/ipl/teams',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Statistics',
      description: 'View detailed statistics and analytics',
      icon: BarChart3,
      href: '/admin/ipl/stats',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Settings',
      description: 'Configure admin settings and preferences',
      icon: Settings,
      href: '/admin/ipl/settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">IPL Admin Panel</h1>
          <p className="text-gray-400">Manage IPL 2026 tournament administration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.href}
                onClick={() => router.push(section.href)}
                className={`p-6 rounded-lg text-left transition-colors ${section.color}`}
              >
                <div className="flex items-center mb-4">
                  <Icon className="w-8 h-8 text-white mr-3" />
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                </div>
                <p className="text-gray-100 text-sm">{section.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
