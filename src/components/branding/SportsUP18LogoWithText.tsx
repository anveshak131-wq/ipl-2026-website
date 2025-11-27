'use client';

import React, { useState } from 'react';
import SportsUP18Logo from './SportsUP18Logo';

interface SportsUP18LogoWithTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
}

export default function SportsUP18LogoWithText({
  size = 'md',
  animated = true,
  className = '',
  onClick,
  showText = true,
  textPosition = 'right',
}: SportsUP18LogoWithTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const textSize = textSizeMap[size];

  const containerClass =
    textPosition === 'right'
      ? 'flex items-center gap-2 md:gap-3'
      : 'flex flex-col items-center gap-1 md:gap-2';

  return (
    <div
      className={`${containerClass} cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <SportsUP18Logo size={size} animated={animated} />

      {showText && (
        <div className={`${animated ? 'transition-all duration-300' : ''}`}>
          <style>{`
            @keyframes text-gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .sportsup-brand-text {
              background: linear-gradient(
                90deg,
                #fbbf24 0%,
                #f59e0b 25%,
                #60a5fa 50%,
                #a78bfa 75%,
                #fbbf24 100%
              );
              background-size: 200% 200%;
              ${animated ? 'animation: text-gradient-shift 4s ease infinite;' : ''}
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          `}</style>

          <div className={`${textSize} font-black tracking-tight sportsup-brand-text`}>
            SportsUP18
          </div>
          <div className="text-[10px] md:text-xs font-semibold text-gray-400 tracking-widest">
            LIVE CRICKET
          </div>
        </div>
      )}
    </div>
  );
}
