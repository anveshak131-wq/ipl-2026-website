'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import ModernMatchesGrid from '@/components/home/ModernMatchesGrid';
import { Match } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';

export default function MatchesPage() {
  const { currentLeague } = useLeague();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesData = await api.getMatches(currentLeague);
        setMatches(matchesData);
        setFilteredMatches(matchesData);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [currentLeague]); // Re-fetch when league changes

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.status === filter));
    }
  }, [filter, matches]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Navbar />
      
      <main className="relative py-16 min-h-screen section-match-bg">
        {/* Enhanced floating orbs with vibrant colors */}
        <motion.div 
          className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2), transparent)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-80 h-80 rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25), rgba(245, 158, 11, 0.15), transparent)',
          }}
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.15), transparent)',
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default animate-bounce-in">
                <Icon name="cricket" size={16} /> MATCH SCHEDULE
              </span>
            </div>
            <motion.h1 
              className="text-5xl md:text-6xl font-black mb-4 tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              IPL 2026 <GradientText gradient="from-indigo-400 via-purple-400 to-pink-400" animate>Fixtures</GradientText>
            </motion.h1>
            <motion.p 
              className="text-slate-200 text-lg max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Live scores, upcoming matches, and detailed fixtures for the entire IPL 2026 season
            </motion.p>
          </div>

          {/* Filter Tabs - Premium Design */}
          <div className="flex justify-start mb-12 overflow-x-auto animate-fade-in" style={{ animationDelay: '160ms' }}>
            <div className="inline-flex space-x-2 p-1.5 rounded-xl backdrop-blur-xl border-2 border-white/10 shadow-xl transition-all duration-300"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                 }}>
              {[
                { key: 'all', label: 'All Matches', icon: 'stats' as const, color: '#6366f1', gradient: 'from-indigo-500 to-purple-500' },
                { key: 'upcoming', label: 'Upcoming', icon: 'target' as const, color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500' },
                { key: 'live', label: 'Live', icon: 'cricket' as const, color: '#ef4444', gradient: 'from-red-500 to-pink-500' },
                { key: 'completed', label: 'Completed', icon: 'trophy' as const, color: '#10b981', gradient: 'from-emerald-500 to-teal-500' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'upcoming' | 'live' | 'completed')}
                  className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-bold transition-all duration-500 whitespace-nowrap flex items-center gap-2 transform hover:scale-105 ${
                    filter === tab.key ? 'scale-105' : ''
                  }`}
                  style={filter === tab.key ? {
                    background: `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)`,
                    color: '#fff',
                    boxShadow: `0 10px 30px ${tab.color}50, 0 0 50px ${tab.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                    border: `2px solid ${tab.color}80`,
                  } : {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                    color: '#cbd5e1',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== tab.key) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.background = `linear-gradient(135deg, ${tab.color}25, ${tab.color}15)`;
                      e.currentTarget.style.borderColor = `${tab.color}50`;
                      e.currentTarget.style.boxShadow = `0 4px 16px ${tab.color}20`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== tab.key) {
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Shimmer effect for active tab */}
                  {filter === tab.key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  
                  <Icon name={tab.icon} size={16} />
                  <span className="relative z-10">{tab.label}</span>
                  
                  {/* Pulse effect for active tab */}
                  {filter === tab.key && (
                    <div 
                      className="absolute inset-0 rounded-lg border-2 opacity-0 group-hover:opacity-100 animate-ping"
                      style={{ borderColor: tab.color }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Matches Grid */}
          <AnimatePresence mode="wait">
            {filteredMatches.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {filteredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <MatchCard match={match} index={index} />
                  </motion.div>
                ))}
              </motion.div>
          ) : (
            <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '220ms' }}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-300 text-lg font-semibold">
                  No {filter} matches found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try selecting a different filter
                </p>
              </div>
            </div>
          )}
          </AnimatePresence>

          {/* Pagination - Premium Design */}
          {filteredMatches.length > 0 && (
            <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={() => alert('Loading more matches...')} 
                className="group relative overflow-hidden rounded-xl font-bold text-lg px-10 py-4 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
                  boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
                  border: '2px solid rgba(124, 58, 237, 0.5)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)';
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.6), transparent)',
                  }}
                />
                
                <span className="relative z-10 flex items-center justify-center gap-2 font-black tracking-tight">
                  Load More Matches
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                
                {/* Pulse animation ring */}
                <div className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 animate-ping border-purple-500" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
