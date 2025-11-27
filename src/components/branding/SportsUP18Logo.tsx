'use client';

import React, { useState } from 'react';

interface SportsUP18LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function SportsUP18Logo({
  size = 'md',
  animated = true,
  className = '',
  onClick,
}: SportsUP18LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className={`${animated ? 'transition-all duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.8))' : 'none',
        }}
      >
        <defs>
          <style>{`
            @keyframes sharpPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes slideRight {
              0% { transform: translateX(-5px); }
              50% { transform: translateX(0); }
              100% { transform: translateX(-5px); }
            }
            .logo-pulse {
              animation: sharpPulse 2s ease-in-out infinite;
            }
            .logo-slide {
              animation: slideRight 2s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Bold geometric background - sharp angles */}
        {/* Top left triangle */}
        <polygon
          points="0,0 40,0 0,40"
          fill="#fbbf24"
          opacity="0.9"
          className={animated ? 'logo-pulse' : ''}
        />

        {/* Bottom right triangle */}
        <polygon
          points="100,100 60,100 100,60"
          fill="#3b82f6"
          opacity="0.9"
          className={animated ? 'logo-pulse' : ''}
          style={{ animationDelay: '0.3s' }}
        />

        {/* Center geometric shape - sharp S */}
        <g className={animated ? 'logo-slide' : ''}>
          {/* Upper S curve - angular */}
          <polygon
            points="35,25 55,25 50,35 40,35"
            fill="#fbbf24"
          />
          <polygon
            points="45,30 65,30 60,40 50,40"
            fill="#fbbf24"
          />

          {/* Lower S curve - angular */}
          <polygon
            points="40,60 60,60 55,70 45,70"
            fill="#3b82f6"
          />
          <polygon
            points="35,65 55,65 50,75 40,75"
            fill="#3b82f6"
          />
        </g>

        {/* Center accent - upward chevron (18 indicator) */}
        <g className={animated ? 'logo-pulse' : ''} style={{ animationDelay: '0.6s' }}>
          <polygon
            points="50,35 58,45 50,50 42,45"
            fill="#a78bfa"
            opacity="0.95"
          />
        </g>

        {/* Right accent line - sharp */}
        <line
          x1="70"
          y1="30"
          x2="85"
          y2="45"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
          className={animated ? 'logo-slide' : ''}
          style={{ animationDelay: '0.2s' }}
        />

        {/* Bottom accent line - sharp */}
        <line
          x1="30"
          y1="70"
          x2="45"
          y2="85"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
          className={animated ? 'logo-slide' : ''}
          style={{ animationDelay: '0.4s' }}
        />
      </svg>
    </div>
  );
}
