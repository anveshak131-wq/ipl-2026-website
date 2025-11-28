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
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 80, height: 80 },
    xl: { width: 120, height: 120 },
  };

  const { width, height } = sizeMap[size];
  const uniqueId = `sportsup-logo-${size}-${animated ? 'anim' : 'static'}-${Math.random().toString(36).substr(2, 9)}`;

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
        viewBox="0 0 200 200"
        className={`${animated ? 'transition-all duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 25px rgba(0, 102, 255, 0.9)) drop-shadow(0 0 50px rgba(255, 51, 102, 0.6))' : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Background gradient */}
          <radialGradient id={`${uniqueId}-bg-gradient`} cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#0A0E27" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Border gradient - vibrant colors */}
          <linearGradient id={`${uniqueId}-border-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="25%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="75%" stopColor="#FF3366" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>

          {/* Hexagon background */}
          <radialGradient id={`${uniqueId}-hex-bg`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Hexagon border */}
          <linearGradient id={`${uniqueId}-hex-border`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Inner accent */}
          <linearGradient id={`${uniqueId}-inner-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0.7" />
          </linearGradient>

          {/* Cricket ball gradient */}
          <radialGradient id={`${uniqueId}-ball-gradient`} cx="40%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#1A1A2E" />
            <stop offset="40%" stopColor="#16213E" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Ball glow */}
          <radialGradient id={`${uniqueId}-ball-glow`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF3366" stopOpacity="0.3" />
          </radialGradient>

          {/* Ball stroke */}
          <linearGradient id={`${uniqueId}-ball-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Seam gradient */}
          <linearGradient id={`${uniqueId}-seam-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          {/* Energy lines gradient 1 */}
          <linearGradient id={`${uniqueId}-energy-1`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00FFFF" />
          </linearGradient>

          {/* Energy lines gradient 2 */}
          <linearGradient id={`${uniqueId}-energy-2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3366" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          <style>{`
            @keyframes spin-slow-${uniqueId} {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-${uniqueId} {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 0.8; }
            }
            
            .energy-lines-1-${uniqueId} {
              animation: ${animated ? `spin-slow-${uniqueId} 8s linear infinite` : 'none'};
              transform-origin: 100px 100px;
            }
            .energy-lines-2-${uniqueId} {
              animation: ${animated ? `spin-slow-${uniqueId} 8s linear infinite reverse` : 'none'};
              transform-origin: 100px 100px;
            }
            .pulse-${uniqueId} {
              animation: ${animated ? `pulse-${uniqueId} 2s ease-in-out infinite` : 'none'};
            }
          `}</style>
        </defs>

        {/* Background circle for better visibility */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill={`url(#${uniqueId}-bg-gradient)`}
          stroke={`url(#${uniqueId}-border-gradient)`}
          strokeWidth="4"
        />

        {/* Hexagon shape - outer */}
        <g transform="translate(100, 100)">
          <polygon
            points="-70,-60 70,-60 100,0 70,60 -70,60 -100,0"
            fill={`url(#${uniqueId}-hex-bg)`}
            stroke={`url(#${uniqueId}-hex-border)`}
            strokeWidth="3"
            className={`pulse-${uniqueId}`}
          />
          
          {/* Inner hexagon accent */}
          <polygon
            points="-55,-45 55,-45 75,0 55,45 -55,45 -75,0"
            fill="none"
            stroke={`url(#${uniqueId}-inner-accent)`}
            strokeWidth="2"
            opacity="0.7"
          />
        </g>

        {/* Cricket ball - centerpiece */}
        <g transform="translate(100, 100)">
          {/* Ball glow background */}
          <circle
            cx="0"
            cy="0"
            r="35"
            fill={`url(#${uniqueId}-ball-glow)`}
            opacity="0.5"
            className={`pulse-${uniqueId}`}
          />
          
          {/* Main cricket ball */}
          <circle
            cx="0"
            cy="0"
            r="30"
            fill={`url(#${uniqueId}-ball-gradient)`}
            stroke={`url(#${uniqueId}-ball-stroke)`}
            strokeWidth="2.5"
          />
          
          {/* Cricket ball seam - horizontal curves */}
          <path
            d="M -22 -10 Q 0 -14 22 -10"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M -22 10 Q 0 14 22 10"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Cricket ball seam - vertical */}
          <path
            d="M 0 -24 Q 10 0 0 24"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Dynamic energy lines - cardinal directions */}
        <g transform="translate(100, 100)" className={`energy-lines-1-${uniqueId}`}>
          <line x1="0" y1="-88" x2="0" y2="-78" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="0" y1="78" x2="0" y2="88" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="-88" y1="0" x2="-78" y2="0" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="78" y1="0" x2="88" y2="0" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Diagonal energy lines */}
        <g transform="translate(100, 100)" className={`energy-lines-2-${uniqueId}`}>
          <line x1="-62" y1="-62" x2="-52" y2="-52" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="-52" x2="62" y2="-62" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="-62" y1="62" x2="-52" y2="52" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="52" x2="62" y2="62" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Accent sparks */}
        <g className={animated ? 'opacity-100' : 'opacity-85'}>
          <circle cx="100" cy="28" r="3.5" fill="#00FFFF" className={`pulse-${uniqueId}`} />
          <circle cx="172" cy="100" r="3" fill="#FF3366" className={`pulse-${uniqueId}`} style={{ animationDelay: '0.2s' }} />
          <circle cx="100" cy="172" r="3.5" fill="#00FFFF" className={`pulse-${uniqueId}`} style={{ animationDelay: '0.4s' }} />
          <circle cx="28" cy="100" r="3" fill="#FF3366" className={`pulse-${uniqueId}`} style={{ animationDelay: '0.6s' }} />
        </g>
      </svg>
    </div>
  );
}
