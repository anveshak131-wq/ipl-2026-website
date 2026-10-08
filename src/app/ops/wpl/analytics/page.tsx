'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  activeUsers: number;
  engagementRate: number;
  popularPages: { page: string; views: number }[];
  dailyStats: { date: string; views: number; users: number }[];
}

export default function WPLAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    activeUsers: 0,
    engagementRate: 0,
    popularPages: [],
    dailyStats: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalViews: 45678,
        activeUsers: 1234,
        engagementRate: 67.8,
        popularPages: [
          { page: '/wpl/dashboard', views: 12500 },
          { page: '/wpl/matches', views: 8900 },
          { page: '/wpl/teams', views: 6700 },
          { page: '/wpl/players', views: 5400 },
          { page: '/wpl/points-table', views: 3178 }
        ],
        dailyStats: [
          { date: '2026-01-15', views: 1200, users: 340 },
          { date: '2026-01-14', views: 1100, users: 320 },
          { date: '2026-01-13', views: 1300, users: 380 },
          { date: '2026-01-12', views: 980, users: 290 },
          { date: '2026-01-11', views: 1150, users: 330 }
        ]
      };
      setAnalytics(mockData);
    } catch (error) {
      setMessage('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <div className="lg:ml-64 p-6">
      <AnimatedSection>
        <GradientText className="text-4xl font-bold mb-8">
          WPL Analytics
        </GradientText>
        
        {message && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-white text-center">Loading analytics...</div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{analytics.activeUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-pink-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Engagement Rate</p>
                    <p className="text-2xl font-bold text-white">{analytics.engagementRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Avg. Daily Views</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(analytics.totalViews / 30).toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Popular Pages */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Popular Pages</h3>
              <div className="space-y-3">
                {analytics.popularPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{page.page}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                          style={{ width: `${(page.views / analytics.popularPages[0].views) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-sm w-16 text-right">{page.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Stats */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Daily Statistics</h3>
              <div className="space-y-3">
                {analytics.dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{stat.date}</span>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{stat.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{stat.users.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatedSection>
      </div>
    </div>
  );
}
