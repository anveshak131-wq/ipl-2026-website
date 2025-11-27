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
    sm: { main: 'text-xs', sub: 'text-[8px]' },
    md: { main: 'text-sm', sub: 'text-[10px]' },
    lg: { main: 'text-lg', sub: 'text-xs' },
    xl: { main: 'text-2xl', sub: 'text-sm' },
  };

  const textSize = textSizeMap[size];

  const containerClass =
    textPosition === 'right'
      ? 'flex items-center gap-2 md:gap-3'
      : 'flex flex-col items-center gap-1 md:gap-2';

  return (
    <div
      className={`${containerClass} cursor-pointer ${className} ${animated ? 'transition-all duration-300 hover:scale-105' : ''}`}
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
            @keyframes text-glow {
              0%, 100% { text-shadow: 0 0 10px rgba(251, 191, 36, 0.3); }
              50% { text-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 30px rgba(59, 130, 246, 0.3); }
            }
            .sportsup-brand-text {
              background: linear-gradient(
                135deg,
                #fbbf24 0%,
                #f59e0b 25%,
                #3b82f6 50%,
                #ec4899 75%,
                #fbbf24 100%
              );
              background-size: 200% 200%;
              ${animated ? 'animation: text-gradient-shift 5s ease infinite;' : ''}
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: 900;
              letter-spacing: -0.5px;
            }
            .sportsup-subtitle {
              background: linear-gradient(
                90deg,
                #60a5fa 0%,
                #ec4899 100%
              );
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              ${animated ? 'animation: text-glow 3s ease-in-out infinite;' : ''}
            }
          `}</style>

          <div className={`${textSize.main} sportsup-brand-text`}>
            SportsUP18
          </div>
          <div className={`${textSize.sub} font-bold tracking-widest sportsup-subtitle`}>
            LIVE CRICKET
          </div>
        </div>
      )}
    </div>
  );
}
