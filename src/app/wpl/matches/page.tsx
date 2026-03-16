'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import { Match, Player } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import { Sparkles } from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors } from '@/lib/wplColors';

export default function WPLMatchesPage() {
  const TARGET_CALENDAR_SEASON = 2026;
  const { currentLeague, setCurrentLeague } = useLeague();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches('wpl'),
          api.getPlayers(undefined, 'wpl')
        ]);
        setMatches(matchesData);
        setPlayers(playersData);
        setFilteredMatches(matchesData.filter((match) => getMatchYear(match.date) === TARGET_CALENDAR_SEASON));
      } catch (error) {
        console.error('Failed to fetch WPL matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMatches(matches.filter((match) => getMatchYear(match.date) === TARGET_CALENDAR_SEASON));
    } else {
      setFilteredMatches(
        matches.filter(
          (match) => match.status === filter && getMatchYear(match.date) === TARGET_CALENDAR_SEASON
        )
      );
    }
  }, [filter, matches]);

  if (isLoading) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
        }}
      >
        <Navbar />
        <AuroraBackground />
        <WPLFloatingParticles />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
      }}
    >
      <AuroraBackground />
      <WPLFloatingParticles />
      <Navbar />
      
      <main className="relative py-16 min-h-screen">
        {/* Enhanced gradient overlays using exact WPL colors */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${WPLColors.gradientMid}1A, ${WPLColors.pinkRGBA[10]}, ${WPLColors.roseRGBA[10]})`,
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${WPLColors.gradientMid}33, transparent, ${WPLColors.gradientEnd}33)`,
          }}
        />
        
        <motion.div 
          className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${WPLColors.purpleRGBA[30]}, ${WPLColors.pinkRGBA[20]}, transparent)`,
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
            background: `radial-gradient(circle, ${WPLColors.roseRGBA[20]}, ${WPLColors.pinkRGBA[15]}, transparent)`,
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
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition-all duration-300 cursor-default"
                style={{
                  background: WPLColors.purpleRGBA[20],
                  border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  color: WPLColors.textAccent,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = WPLColors.purpleRGBA[30];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = WPLColors.purpleRGBA[20];
                }}
              >
                <Sparkles className="w-4 h-4" /> WPL MATCH SCHEDULE
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
              WPL 2026 <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>Fixtures</GradientText>
            </motion.h1>
            <motion.p 
              className="text-slate-200 text-lg max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Live scores, upcoming matches, and detailed fixtures for the entire WPL 2026 season
            </motion.p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-start mb-12 overflow-x-auto">
            <div 
              className="inline-flex space-x-2 p-1.5 rounded-xl backdrop-blur-xl border-2 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.violetRGBA[10]}, ${WPLColors.pinkRGBA[10]})`,
                borderColor: WPLColors.purpleRGBA[20],
              }}
            >
              {[
                { key: 'all', label: 'All Matches', icon: 'stats' as const, color: WPLColors.violet },
                { key: 'upcoming', label: 'Upcoming', icon: 'target' as const, color: WPLColors.pink },
                { key: 'live', label: 'Live', icon: 'cricket' as const, color: WPLColors.rose },
                { key: 'completed', label: 'Completed', icon: 'trophy' as const, color: WPLColors.violet }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'upcoming' | 'live' | 'completed')}
                  className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-bold transition-all duration-500 whitespace-nowrap flex items-center gap-2 transform hover:scale-105 ${
                    filter === tab.key ? 'scale-105' : ''
                  }`}
                  style={filter === tab.key ? {
                    background: `linear-gradient(135deg, ${tab.color}, ${tab.color}DD)`,
                    color: WPLColors.textPrimary,
                    boxShadow: `0 10px 30px ${tab.color}50, 0 0 50px ${tab.color}30`,
                    border: `2px solid ${tab.color}80`,
                  } : {
                    background: `linear-gradient(135deg, ${WPLColors.violetRGBA[10]}, ${WPLColors.pinkRGBA[10]})`,
                    color: WPLColors.textSecondary,
                    border: `2px solid ${WPLColors.violetRGBA[20]}`,
                  }}
                >
                  {filter === tab.key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  
                  <Icon name={tab.icon} size={16} />
                  <span className="relative z-10">{tab.label}</span>
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
                    <MatchCard
                      match={match}
                      index={index}
                      players={players}
                      detailHref={`/wpl/matches/${match.id}`}
                    />
                  </motion.div>
                ))}
              </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
