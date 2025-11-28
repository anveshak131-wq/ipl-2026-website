'use client';

import { motion } from 'framer-motion';

export function TeamsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="aspect-square bg-white/5 rounded-2xl border border-white/10 animate-pulse"
        >
          <div className="p-6 h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/10 rounded-full mb-4" />
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MatchesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-white/10 rounded w-24" />
            <div className="h-4 bg-white/10 rounded w-16" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="h-4 bg-white/10 rounded w-20" />
            <div className="h-4 bg-white/10 rounded w-8" />
            <div className="w-12 h-12 bg-white/10 rounded-full" />
          </div>
          <div className="h-4 bg-white/10 rounded w-32" />
        </motion.div>
      ))}
    </div>
  );
}

export function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-white/5 rounded-xl border border-white/10 overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-white/10" />
          <div className="p-6">
            <div className="h-4 bg-white/10 rounded w-20 mb-3" />
            <div className="h-6 bg-white/10 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6 text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4" />
          <div className="h-8 bg-white/10 rounded w-20 mx-auto mb-2" />
          <div className="h-4 bg-white/10 rounded w-24 mx-auto" />
        </motion.div>
      ))}
    </div>
  );
}

