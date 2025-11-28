'use client';

import { motion } from 'framer-motion';

export default function NavbarSkeleton() {
  return (
    <div className="flex items-center gap-2">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="h-9 w-20 bg-white/10 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

