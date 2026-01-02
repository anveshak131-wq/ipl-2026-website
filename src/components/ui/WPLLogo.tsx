'use client';

import { motion } from 'framer-motion';

interface WPLLogoProps {
  size?: number;
  className?: string;
}

export default function WPLLogo({ size = 32, className = '' }: WPLLogoProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* WPL Shield Background */}
        <motion.path
          d="M50 5 L85 20 L85 60 Q85 75 50 95 Q15 75 15 60 L15 20 Z"
          fill="url(#wplGradient)"
          stroke="#14B8A6"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        {/* WPL Text */}
        <motion.text
          x="50"
          y="40"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          WPL
        </motion.text>
        
        {/* Cricket Ball */}
        <motion.circle
          cx="50"
          cy="60"
          r="8"
          fill="#FFD700"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        />
        <motion.path
          d="M46 60 Q50 56 54 60"
          stroke="#14B8A6"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="wplGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
