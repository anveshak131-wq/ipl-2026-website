'use client';

import { motion } from 'framer-motion';

interface OverProgressBarProps {
  currentOver: number;
  league?: 'ipl' | 'wpl';
}

export default function OverProgressBar({ currentOver, league = 'ipl' }: OverProgressBarProps) {
  // Extract over number and ball number
  const overNumber = Math.floor(currentOver);
  const ballNumber = Math.round((currentOver - overNumber) * 10);
  const progress = (ballNumber / 6) * 100;

  const colors = league === 'wpl' 
    ? {
        bg: 'bg-purple-500/20',
        fill: 'bg-gradient-to-r from-purple-500 to-pink-500',
        text: 'text-purple-300',
        border: 'border-purple-500/30'
      }
    : {
        bg: 'bg-blue-500/20',
        fill: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        text: 'text-blue-300',
        border: 'border-blue-500/30'
      };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-semibold ${colors.text}`}>
          Over {overNumber}.{ballNumber}
        </span>
        <span className="text-gray-400">
          {ballNumber}/6 balls
        </span>
      </div>
      <div className={`relative h-3 rounded-full ${colors.bg} border ${colors.border} overflow-hidden`}>
        <motion.div
          className={`h-full ${colors.fill} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Ball indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[1, 2, 3, 4, 5, 6].map((ball) => (
            <div
              key={ball}
              className={`w-1 h-1 rounded-full ${
                ball <= ballNumber ? 'bg-white' : 'bg-transparent'
              } transition-all duration-200`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

