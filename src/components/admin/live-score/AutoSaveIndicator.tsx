'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  league?: 'ipl' | 'wpl';
  className?: string;
}

export default function AutoSaveIndicator({ status, league = 'ipl', className = '' }: AutoSaveIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: Save,
      text: 'Ready',
      colors: league === 'wpl'
        ? 'text-purple-400'
        : 'text-blue-400',
      show: false
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      colors: 'text-yellow-400',
      show: true
    },
    saved: {
      icon: CheckCircle2,
      text: 'Saved',
      colors: 'text-green-400',
      show: true
    },
    error: {
      icon: AlertCircle,
      text: 'Save Failed',
      colors: 'text-red-400',
      show: true
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {config.show && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border ${
            status === 'saving' 
              ? 'bg-yellow-500/20 border-yellow-500/30'
              : status === 'saved'
              ? 'bg-green-500/20 border-green-500/30'
              : 'bg-red-500/20 border-red-500/30'
          } ${className}`}
        >
          <motion.div
            animate={status === 'saving' ? { rotate: 360 } : {}}
            transition={status === 'saving' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <Icon className={`w-4 h-4 ${config.colors}`} />
          </motion.div>
          <span className={`text-sm font-semibold ${config.colors}`}>
            {config.text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

