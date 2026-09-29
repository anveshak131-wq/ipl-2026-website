'use client';

import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';

export default function AdminLeagueSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLeague, setCurrentLeague, isIPL, isWPL } = useLeague();

  const handleSwitch = (target: 'ipl' | 'wpl') => {
    setCurrentLeague(target);
    if (!pathname) return;

    if (target === 'wpl' && pathname.includes('/ops/ipl')) {
      router.push(pathname.replace('/ops/ipl', '/ops/wpl'));
    } else if (target === 'ipl' && pathname.includes('/ops/wpl')) {
      router.push(pathname.replace('/ops/wpl', '/ops/ipl'));
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
      {/* IPL Button */}
      <motion.button
        onClick={() => handleSwitch('ipl')}
        className={`
          relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300
          flex items-center gap-2 whitespace-nowrap overflow-hidden group
          ${isIPL
            ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 border border-blue-400/30'
            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-blue-500/30'
          }
        `}
        whileHover={!isIPL ? { scale: 1.05 } : {}}
        whileTap={{ scale: 0.98 }}
      >
        {isIPL && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <Trophy className={`w-4 h-4 relative z-10 ${isIPL ? 'text-white' : 'text-gray-400'}`} />
        <span className="relative z-10">IPL</span>
        {isIPL && (
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>

      {/* WPL Button */}
      <motion.button
        onClick={() => handleSwitch('wpl')}
        className={`
          relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300
          flex items-center gap-2 whitespace-nowrap overflow-hidden group
          ${isWPL
            ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/50 border border-purple-400/30'
            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-purple-500/30'
          }
        `}
        whileHover={!isWPL ? { scale: 1.05 } : {}}
        whileTap={{ scale: 0.98 }}
      >
        {isWPL && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <Sparkles className={`w-4 h-4 relative z-10 ${isWPL ? 'text-white' : 'text-gray-400'}`} />
        <span className="relative z-10">WPL</span>
        {isWPL && (
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>
    </div>
  );
}
