'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Calendar, TrendingUp, Star, Heart, MessageCircle, Eye, Trophy } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function WPLAdminDashboard() {
  const [stats, setStats] = useState({
    totalStories: 156,
    pendingStories: 23,
    approvedStories: 133,
    featuredStories: 12,
    totalViews: 45678,
    totalLikes: 8934,
    totalComments: 2341,
    activeUsers: 892
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'story_submitted',
      title: 'New story: "My First WPL Match"',
      author: 'Priya Sharma',
      time: '2 minutes ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'story_approved',
      title: 'Story approved: "Meeting Harmanpreet Kaur"',
      author: 'Anjali Patel',
      time: '15 minutes ago',
      status: 'approved'
    },
    {
      id: 3,
      type: 'story_featured',
      title: 'Story featured: "WPL Final Experience"',
      author: 'Rashmi Desai',
      time: '1 hour ago',
      status: 'featured'
    }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <AuroraBackground />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
                WPL Admin Dashboard
              </GradientText>
              <p className="text-gray-300 text-lg">
                Women's Premier League Administration Panel
              </p>
            </div>
          </AnimatedSection>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnimatedSection delay={0.1}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <Users className="text-purple-400" size={24} />
                  </div>
                  <span className="text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded-full">
                    +12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalStories}</div>
                <div className="text-gray-300 text-sm">Total Stories</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-600/20 rounded-lg">
                    <Calendar className="text-yellow-400" size={24} />
                  </div>
                  <span className="text-xs text-yellow-300 bg-yellow-600/20 px-2 py-1 rounded-full">
                    {stats.pendingStories}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.pendingStories}</div>
                <div className="text-gray-300 text-sm">Pending Review</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <Trophy className="text-green-400" size={24} />
                  </div>
                  <span className="text-xs text-green-300 bg-green-600/20 px-2 py-1 rounded-full">
                    {stats.featuredStories}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.featuredStories}</div>
                <div className="text-gray-300 text-sm">Featured Stories</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <TrendingUp className="text-blue-400" size={24} />
                  </div>
                  <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full">
                    +28%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.activeUsers}</div>
                <div className="text-gray-300 text-sm">Active Users</div>
              </motion.div>
            </AnimatedSection>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <AnimatedSection delay={0.5}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Engagement Overview</h3>
                  <BarChart3 className="text-purple-400" size={20} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Views</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Heart className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Likes</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Comments</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalComments.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.6}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Story Status</h3>
                  <Star className="text-purple-400" size={20} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Approved</span>
                      <span className="text-white">{stats.approvedStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Pending</span>
                      <span className="text-white">{stats.pendingStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Featured</span>
                      <span className="text-white">{stats.featuredStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.7}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    className="p-3 bg-purple-600/20 rounded-lg text-purple-300 hover:bg-purple-600/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Review Stories
                  </motion.button>
                  <motion.button
                    className="p-3 bg-purple-600/20 rounded-lg text-purple-300 hover:bg-purple-600/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Venues
                  </motion.button>
                </div>
              </motion.div>
            </AnimatedSection>

          {/* Recent Activity */}
          <AnimatedSection delay={0.8}>
            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <TrendingUp className="text-purple-400" size={20} />
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-400/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{activity.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activity.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                          activity.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-purple-400/20 text-purple-400'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        by {activity.author} • {activity.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
