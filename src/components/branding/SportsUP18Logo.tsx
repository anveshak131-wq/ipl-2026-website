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
    sm: { width: 48, height: 48, padding: 6 },
    md: { width: 64, height: 64, padding: 8 },
    lg: { width: 80, height: 80, padding: 10 },
    xl: { width: 120, height: 120, padding: 12 },
  };

  const { width, height, padding } = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background circle */}
      <div
        className="absolute rounded-full bg-gradient-to-br from-yellow-500/20 to-blue-500/20 border border-yellow-400/40 backdrop-blur-md"
        style={{
          width: width + padding * 2,
          height: height + padding * 2,
        }}
      />
      
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        className={`${animated ? 'transition-all duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>

          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          <style>{`
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 1; }
            }
            @keyframes slide-left {
              0%, 100% { transform: translateX(0px); }
              50% { transform: translateX(-2px); }
            }
            @keyframes slide-right {
              0%, 100% { transform: translateX(0px); }
              50% { transform: translateX(2px); }
            }
            
            .glow-element {
              animation: ${animated ? 'pulse-glow 2s ease-in-out infinite' : 'none'};
            }
            .slide-left {
              animation: ${animated ? 'slide-left 2.5s ease-in-out infinite' : 'none'};
            }
            .slide-right {
              animation: ${animated ? 'slide-right 2.5s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer ring */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#goldGradient)" strokeWidth="2" opacity="1"/>

        {/* Background circle */}
        <circle cx="60" cy="60" r="56" fill="#030712" opacity="0.5"/>

        {/* Top left triangle - Gold */}
        <polygon points="35,35 55,35 45,50" fill="url(#goldGradient)" opacity="1" className="glow-element"/>

        {/* Bottom right triangle - Blue */}
        <polygon points="65,70 85,70 75,85" fill="url(#blueGradient)" opacity="1" className="glow-element" style={{ animationDelay: '0.3s' }}/>

        {/* Center chevron - Purple */}
        <g className="slide-left" opacity="1">
          <polygon points="50,50 58,58 50,62 42,58" fill="url(#purpleGradient)"/>
        </g>

        {/* Upper S curve - Gold segments */}
        <g className="slide-right" opacity="0.9">
          <polygon points="45,40 55,40 52,45 48,45" fill="url(#goldGradient)"/>
          <polygon points="52,43 62,43 59,48 55,48" fill="url(#goldGradient)"/>
        </g>

        {/* Lower S curve - Blue segments */}
        <g opacity="0.9">
          <polygon points="48,72 58,72 55,77 51,77" fill="url(#blueGradient)"/>
          <polygon points="45,77 55,77 52,82 48,82" fill="url(#blueGradient)"/>
        </g>

        {/* Right accent line - Gold */}
        <line x1="70" y1="40" x2="82" y2="52" stroke="url(#goldGradient)" strokeWidth="3" strokeLinecap="round" opacity="1" className="slide-right" style={{ animationDelay: '0.2s' }}/>

        {/* Bottom accent line - Blue */}
        <line x1="38" y1="75" x2="50" y2="87" stroke="url(#blueGradient)" strokeWidth="3" strokeLinecap="round" opacity="1" className="slide-left" style={{ animationDelay: '0.4s' }}/>

        {/* Corner accent dots */}
        <g opacity="1" className="glow-element" style={{ animationDelay: '0.6s' }}>
          <circle cx="38" cy="38" r="2" fill="url(#goldGradient)"/>
          <circle cx="82" cy="82" r="2" fill="url(#blueGradient)"/>
        </g>
      </svg>
    </div>
  );
}
