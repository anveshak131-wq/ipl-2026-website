'use client';

import React from 'react';

interface FloatingBadgeProps {
  text: string;
  icon?: React.ReactNode;
  color?: 'gold' | 'blue' | 'purple' | 'green' | 'red';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animated?: boolean;
  className?: string;
}

export default function FloatingBadge({
  text,
  icon,
  color = 'gold',
  position = 'top-right',
  animated = true,
  className = '',
}: FloatingBadgeProps) {
  const colorMap = {
    gold: 'from-ipl-gold to-yellow-400 text-black',
    blue: 'from-blue-500 to-cyan-500 text-white',
    purple: 'from-purple-500 to-pink-500 text-white',
    green: 'from-green-500 to-emerald-500 text-white',
    red: 'from-red-500 to-orange-500 text-white',
  };

  const positionMap = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <>
      <style>{`
        @keyframes float-badge {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.05);
          }
        }
        .floating-badge {
          ${animated ? 'animation: float-badge 3s ease-in-out infinite;' : ''}
        }
      `}</style>
      <div
        className={`floating-badge fixed ${positionMap[position]} z-40 ${className}`}
      >
        <div
          className={`bg-gradient-to-r ${colorMap[color]} px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg backdrop-blur-sm border border-white/20`}
        >
          {icon && <span className="text-lg">{icon}</span>}
          <span>{text}</span>
          {/* Pulse dot */}
          <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
    </>
  );
}
