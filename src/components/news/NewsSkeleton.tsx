'use client';

import { motion } from 'framer-motion';

export default function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: i * 0.1, 
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 animate-pulse"
        >
          {/* Glassmorphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md" />
          
          {/* Image skeleton */}
          <div className="h-48 bg-gradient-to-br from-white/10 via-white/5 to-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          
          {/* Content skeleton */}
          <div className="relative p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-white/10 rounded-full w-20" />
              <div className="h-4 bg-white/10 rounded-full w-16" />
            </div>
            <div className="h-6 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-4/6" />
            <div className="h-10 bg-white/10 rounded-lg w-32 mt-4" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

