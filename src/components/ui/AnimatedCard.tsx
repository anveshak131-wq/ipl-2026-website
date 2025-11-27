'use client';

import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: 'lift' | 'glow' | 'scale' | 'none';
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = 'lift',
  onClick,
}: AnimatedCardProps) {
  const hoverClasses = {
    lift: 'hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2',
    glow: 'hover:shadow-lg hover:shadow-ipl-gold/50 hover:border-ipl-gold/50',
    scale: 'hover:scale-105',
    none: '',
  };

  return (
    <div
      className={`
        relative rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]
        backdrop-blur-sm transition-all duration-500 ease-out
        ${hoverClasses[hover]}
        ${className}
      `}
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay * 0.1}s both`,
      }}
      onClick={onClick}
    >
      {children}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
