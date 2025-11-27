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
        viewBox="0 0 120 120"
        className={`${animated ? 'transition-all duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.9)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
        }}
      >
        <defs>
          <linearGradient id="cricketGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          <linearGradient id="cricketGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>

          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes spin-ball {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes float-bat {
              0%, 100% { transform: translateY(0px) rotate(-15deg); }
              50% { transform: translateY(-4px) rotate(-15deg); }
            }
            @keyframes pulse-ring {
              0%, 100% { r: 55; opacity: 0.8; }
              50% { r: 60; opacity: 0.3; }
            }
            @keyframes shimmer {
              0% { stroke-dashoffset: 100; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes glow-pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            
            .cricket-ball {
              transform-origin: 60px 60px;
              animation: ${animated ? 'spin-ball 8s linear infinite' : 'none'};
            }
            .cricket-bat {
              transform-origin: 60px 60px;
              animation: ${animated ? 'float-bat 3s ease-in-out infinite' : 'none'};
            }
            .pulse-ring {
              animation: ${animated ? 'pulse-ring 2.5s ease-in-out infinite' : 'none'};
            }
            .glow-accent {
              animation: ${animated ? 'glow-pulse 2s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer ring with gradient */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#cricketGradient1)" strokeWidth="2" opacity="0.9"/>
        
        {/* Pulsing ring effect */}
        <circle cx="60" cy="60" r="55" fill="none" stroke="url(#cricketGradient2)" strokeWidth="1.5" opacity="0.4" className="pulse-ring"/>

        {/* Main background circle */}
        <circle cx="60" cy="60" r="52" fill="url(#cricketGradient2)" opacity="0.15"/>

        {/* Cricket Ball - Main Element */}
        <g className="cricket-ball">
          {/* Ball body */}
          <circle cx="60" cy="60" r="28" fill="url(#cricketGradient1)" filter="url(#glow)"/>
          
          {/* Ball shine */}
          <circle cx="50" cy="50" r="10" fill="#fef3c7" opacity="0.4"/>
          
          {/* Stitching pattern */}
          <path d="M 45 40 Q 60 35 75 40" stroke="#fed7aa" strokeWidth="1.5" fill="none" opacity="0.8" strokeLinecap="round"/>
          <path d="M 45 60 Q 60 65 75 60" stroke="#fed7aa" strokeWidth="1.5" fill="none" opacity="0.8" strokeLinecap="round"/>
          <path d="M 40 50 Q 45 60 50 70" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
          <path d="M 70 50 Q 75 60 80 70" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
        </g>

        {/* Cricket Bat */}
        <g className="cricket-bat">
          {/* Bat handle */}
          <rect x="56" y="20" width="8" height="35" rx="4" fill="url(#accentGradient)" opacity="0.9"/>
          
          {/* Bat blade */}
          <ellipse cx="60" cy="15" rx="12" ry="8" fill="url(#accentGradient)"/>
          
          {/* Bat detail */}
          <line x1="56" y1="25" x2="64" y2="25" stroke="#fbbf24" strokeWidth="1" opacity="0.6"/>
          <line x1="56" y1="32" x2="64" y2="32" stroke="#fbbf24" strokeWidth="1" opacity="0.6"/>
        </g>

        {/* Upward Arrow - Growth Indicator */}
        <g className="glow-accent">
          <path d="M 60 85 L 60 75 M 55 80 L 60 75 L 65 80" stroke="url(#accentGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        </g>

        {/* Number 18 Badge */}
        <g>
          <rect x="78" y="35" width="28" height="22" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="url(#cricketGradient1)" strokeWidth="1.5" opacity="0.9"/>
          <text x="92" y="51" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="800" fill="#fbbf24" textAnchor="middle">
            18
          </text>
        </g>

        {/* Accent dots for visual interest */}
        <circle cx="35" cy="35" r="2.5" fill="url(#cricketGradient1)" opacity="0.6" className={animated ? 'glow-accent' : ''}/>
        <circle cx="85" cy="85" r="2.5" fill="url(#cricketGradient2)" opacity="0.6" className={animated ? 'glow-accent' : ''} style={{ animationDelay: '0.5s' }}/>
      </svg>
    </div>
  );
}
