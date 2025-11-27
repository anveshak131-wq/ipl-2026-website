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
        className="absolute rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/40 backdrop-blur-md"
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
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.8)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.5))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          <linearGradient id="cricketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes spin-fast {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-ring {
              0%, 100% { r: 55; opacity: 0.8; }
              50% { r: 60; opacity: 0.3; }
            }
            @keyframes shimmer {
              0% { opacity: 0.5; }
              50% { opacity: 1; }
              100% { opacity: 0.5; }
            }
            
            .cricket-ball {
              transform-origin: 60px 60px;
              animation: ${animated ? 'spin-fast 4s linear infinite' : 'none'};
            }
            .pulse-ring {
              animation: ${animated ? 'pulse-ring 2s ease-in-out infinite' : 'none'};
            }
            .shimmer {
              animation: ${animated ? 'shimmer 2.5s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer ring */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#cricketGradient)" strokeWidth="2" opacity="0.9"/>
        
        {/* Pulsing ring effect */}
        <circle cx="60" cy="60" r="55" fill="none" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.4" className="pulse-ring"/>

        {/* Main background circle */}
        <circle cx="60" cy="60" r="52" fill="url(#cricketGradient)" opacity="0.08"/>

        {/* Cricket Ball - Spinning */}
        <g className="cricket-ball">
          {/* Ball body */}
          <circle cx="60" cy="60" r="24" fill="url(#cricketGradient)" filter="url(#glow)"/>
          
          {/* Ball shine */}
          <circle cx="52" cy="52" r="7" fill="#fef3c7" opacity="0.5" className="shimmer"/>
          
          {/* Stitching pattern - red cricket ball style */}
          <path d="M 48 55 Q 60 50 72 55" stroke="#fed7aa" strokeWidth="1.5" fill="none" opacity="0.8" strokeLinecap="round"/>
          <path d="M 48 65 Q 60 70 72 65" stroke="#fed7aa" strokeWidth="1.5" fill="none" opacity="0.8" strokeLinecap="round"/>
          <path d="M 55 48 Q 60 60 55 72" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
          <path d="M 65 48 Q 60 60 65 72" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
        </g>

        {/* Wickets - Three Stumps */}
        <g opacity="0.9">
          {/* Left stump */}
          <rect x="40" y="75" width="2.5" height="20" fill="url(#accentGradient)" rx="1"/>
          {/* Middle stump */}
          <rect x="58.75" y="75" width="2.5" height="20" fill="url(#accentGradient)" rx="1"/>
          {/* Right stump */}
          <rect x="77.5" y="75" width="2.5" height="20" fill="url(#accentGradient)" rx="1"/>
          
          {/* Bails - top */}
          <rect x="40" y="73" width="40" height="2" fill="url(#accentGradient)" opacity="0.8" rx="1"/>
        </g>

        {/* Bat - Angled */}
        <g opacity="0.85" transform="translate(60, 60) rotate(-35) translate(-60, -60)">
          {/* Bat blade */}
          <rect x="54" y="25" width="12" height="28" fill="url(#accentGradient)" rx="2"/>
          
          {/* Bat handle */}
          <rect x="56" y="53" width="8" height="18" fill="url(#accentGradient)" opacity="0.9" rx="2"/>
          
          {/* Bat grip detail */}
          <line x1="54" y1="58" x2="66" y2="58" stroke="#fef3c7" strokeWidth="1" opacity="0.6"/>
          <line x1="54" y1="63" x2="66" y2="63" stroke="#fef3c7" strokeWidth="1" opacity="0.6"/>
        </g>

        {/* Decorative accent - star */}
        <g opacity="0.7">
          <path d="M 100 30 L 103 37 L 111 37 L 105 42 L 107 49 L 100 44 L 93 49 L 95 42 L 89 37 L 97 37 Z" fill="url(#accentGradient)"/>
        </g>
      </svg>
    </div>
  );
}
