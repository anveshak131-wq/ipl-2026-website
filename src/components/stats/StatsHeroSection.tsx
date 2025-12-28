'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Zap, BarChart3, Award } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

interface StatsHeroSectionProps {
  totalPlayers: number;
  totalTeams: number;
  totalRuns: number;
  totalWickets: number;
}

export default function StatsHeroSection({
  totalPlayers,
  totalTeams,
  totalRuns,
  totalWickets,
}: StatsHeroSectionProps) {
  const stats = [
    { icon: Trophy, label: 'Players', value: totalPlayers, color: 'from-yellow-400 to-orange-500' },
    { icon: Target, label: 'Teams', value: totalTeams, color: 'from-purple-400 to-pink-500' },
    { icon: TrendingUp, label: 'Total Runs', value: totalRuns.toLocaleString(), color: 'from-blue-400 to-cyan-500' },
    { icon: Zap, label: 'Wickets', value: totalWickets.toLocaleString(), color: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-orange-900/20" />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6"
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">IPL 2026 STATISTICS</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-6"
          >
            <span className="block text-white mb-2">Cricket</span>
            <GradientText gradient="from-orange-400 via-yellow-400 to-orange-500" animate>
              Statistics Hub
            </GradientText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl"
          >
            Dive deep into player performances, team analytics, and championship insights. 
            Track Orange Cap, Purple Cap, and all the numbers that matter.
          </motion.p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.6 + index * 0.1,
                  type: 'spring',
                  stiffness: 100
                }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
              >
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'linear',
                  }}
                />

                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

