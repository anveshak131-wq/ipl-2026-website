'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLeague } from '@/contexts/LeagueContext';
import { 
  Play, 
  Calendar, 
  Flame, 
  ChevronUp,
  Trophy,
  Sparkles
} from 'lucide-react';

export default function QuickActionBar() {
  const router = useRouter();
  const { currentLeague, setCurrentLeague } = useLeague();
  const [isVisible, setIsVisible] = useState(false);
  const [showLeagueSwitch, setShowLeagueSwitch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show bar after scrolling down 300px
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLeague = () => {
    setCurrentLeague(currentLeague === 'ipl' ? 'wpl' : 'ipl');
    setShowLeagueSwitch(false);
  };

  const quickActions = [
    {
      label: 'Live Scores',
      icon: Play,
      href: '/live-score',
      color: 'from-red-500 to-orange-500',
      hoverColor: 'hover:from-red-600 hover:to-orange-600'
    },
    {
      label: 'Matches',
      icon: Calendar,
      href: currentLeague === 'wpl' ? '/wpl/matches' : '/matches',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600'
    },
    {
      label: 'News',
      icon: Flame,
      href: '/news',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600'
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="relative">
            {/* Main Action Bar */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* League Quick Switch */}
              <div className="relative">
                <button
                  onClick={() => setShowLeagueSwitch(!showLeagueSwitch)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                    currentLeague === 'ipl'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}
                >
                  {currentLeague === 'ipl' ? (
                    <>
                      <Trophy className="w-4 h-4" />
                      <span>IPL</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>WPL</span>
                    </>
                  )}
                </button>

                {/* League Switch Dropdown */}
                <AnimatePresence>
                  {showLeagueSwitch && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-0 mb-2 w-32 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
                    >
                      <button
                        onClick={toggleLeague}
                        className={`w-full px-4 py-3 flex items-center gap-2 font-semibold text-sm transition-all duration-200 ${
                          currentLeague === 'wpl'
                            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Switch to IPL</span>
                      </button>
                      <button
                        onClick={toggleLeague}
                        className={`w-full px-4 py-3 flex items-center gap-2 font-semibold text-sm transition-all duration-200 ${
                          currentLeague === 'ipl'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Switch to WPL</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                {quickActions.map((action, idx) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`group relative px-4 py-2 rounded-xl bg-gradient-to-r ${action.color} text-white font-semibold text-sm transition-all duration-300 ${action.hoverColor} shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </span>
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100`}
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                ))}
              </div>

              {/* Scroll to Top Button */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300 hover:scale-110"
                aria-label="Scroll to top"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>

            {/* Click outside to close league switch */}
            {showLeagueSwitch && (
              <div
                className="fixed inset-0 -z-10"
                onClick={() => setShowLeagueSwitch(false)}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

