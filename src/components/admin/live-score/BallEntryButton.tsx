'use client';

import { motion } from 'framer-motion';

interface BallEntryButtonProps {
  value: number | string;
  label: string;
  color: 'green' | 'red' | 'orange' | 'blue' | 'gray';
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function BallEntryButton({
  value,
  label,
  color,
  onClick,
  disabled = false,
  size = 'lg'
}: BallEntryButtonProps) {
  const colorClasses = {
    green: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800',
    red: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800',
    gray: 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 active:from-gray-800 active:to-gray-900',
  };

  const sizeClasses = {
    sm: 'w-14 h-14 text-lg p-2',
    md: 'w-18 h-18 text-xl p-3',
    lg: 'w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl p-3 md:p-4',
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]}
        ${sizeClasses[size]}
        rounded-xl
        text-white font-black
        shadow-lg hover:shadow-xl active:scale-95
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex flex-col items-center justify-center
        border-2 border-white/20
        touch-manipulation
        min-h-[60px] min-w-[60px]
      `}
    >
      <span className="leading-none">{value}</span>
      <span className="text-xs font-normal mt-1 opacity-90">{label}</span>
    </motion.button>
  );
}

