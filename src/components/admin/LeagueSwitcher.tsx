'use client';

import { useLeague } from '@/contexts/LeagueContext';
import { motion } from 'framer-motion';

export default function LeagueSwitcher() {
  const { currentLeague, setCurrentLeague } = useLeague();

  return (
    <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentLeague('ipl')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          currentLeague === 'ipl'
            ? 'bg-orange-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        IPL 2026
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentLeague('wpl')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          currentLeague === 'wpl'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        WPL 2024
      </motion.button>
    </div>
  );
}
