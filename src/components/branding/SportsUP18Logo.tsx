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
        className="absolute rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-400/50 backdrop-blur-md"
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
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.5))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          <linearGradient id="ballGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
          
          <linearGradient id="batGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <radialGradient id="glowGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes rotate-ball {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
            @keyframes swing-bat {
              0%, 100% { transform: rotate(-25deg); }
              50% { transform: rotate(15deg); }
            }
            
            .ball {
              transform-origin: 60px 60px;
              animation: ${animated ? 'rotate-ball 6s linear infinite' : 'none'};
            }
            .bat {
              transform-origin: 60px 60px;
              animation: ${animated ? 'swing-bat 2s ease-in-out infinite' : 'none'};
            }
            .glow {
              animation: ${animated ? 'pulse-glow 2.5s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer glow ring */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#ballGradient)" strokeWidth="1.5" opacity="0.5" className="glow"/>
        
        {/* Main background */}
        <circle cx="60" cy="60" r="56" fill="url(#glowGradient)" opacity="0.08"/>

        {/* Cricket Ball */}
        <g className="ball">
          {/* Ball body */}
          <circle cx="60" cy="60" r="26" fill="url(#ballGradient)" filter="url(#softGlow)"/>
          
          {/* Ball highlight */}
          <circle cx="48" cy="48" r="8" fill="#93c5fd" opacity="0.5"/>
          
          {/* Stitching - curved lines */}
          <path d="M 45 50 Q 60 42 75 50" stroke="#bfdbfe" strokeWidth="1.5" fill="none" opacity="0.7" strokeLinecap="round"/>
          <path d="M 45 70 Q 60 78 75 70" stroke="#bfdbfe" strokeWidth="1.5" fill="none" opacity="0.7" strokeLinecap="round"/>
          <path d="M 50 45 Q 55 60 50 75" stroke="#bfdbfe" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"/>
          <path d="M 70 45 Q 65 60 70 75" stroke="#bfdbfe" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"/>
        </g>

        {/* Cricket Bat */}
        <g className="bat">
          {/* Bat blade - wider at top */}
          <path d="M 54 25 L 66 25 L 64 42 L 56 42 Z" fill="url(#batGradient)" opacity="0.95"/>
          
          {/* Bat handle */}
          <rect x="57" y="42" width="6" height="28" rx="3" fill="url(#batGradient)" opacity="0.9"/>
          
          {/* Bat edge highlight */}
          <line x1="54" y1="28" x2="66" y2="28" stroke="#f472b6" strokeWidth="1" opacity="0.6"/>
        </g>

        {/* Upward arrow - growth indicator */}
        <g opacity="0.8">
          <path d="M 60 92 L 60 82 M 55 87 L 60 82 L 65 87" stroke="url(#batGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* Decorative corner accent */}
        <g opacity="0.6">
          <circle cx="85" cy="35" r="3" fill="url(#batGradient)"/>
          <circle cx="82" cy="38" r="2" fill="url(#batGradient)"/>
        </g>
      </svg>
    </div>
  );
}
