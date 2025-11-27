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
        className="absolute rounded-full bg-gradient-to-br from-blue-600/25 to-cyan-600/25 border border-blue-400/40 backdrop-blur-md"
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
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 40px rgba(34, 197, 234, 0.5))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes float-up {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            @keyframes rotate-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-scale {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 0.4; }
            }
            
            .arrow-up {
              animation: ${animated ? 'float-up 2s ease-in-out infinite' : 'none'};
            }
            .rotating-ring {
              animation: ${animated ? 'rotate-slow 8s linear infinite' : 'none'};
            }
            .pulse-circle {
              animation: ${animated ? 'pulse-scale 2.5s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Rotating outer ring */}
        <g className="rotating-ring">
          <circle cx="60" cy="60" r="56" fill="none" stroke="url(#mainGradient)" strokeWidth="1.5" opacity="0.6" strokeDasharray="5,5"/>
        </g>

        {/* Pulsing background circle */}
        <circle cx="60" cy="60" r="52" fill="url(#mainGradient)" opacity="0.08" className="pulse-circle"/>

        {/* Central hexagon - modern tech feel */}
        <g opacity="0.9">
          <path d="M 60 35 L 75 42.5 L 75 57.5 L 60 65 L 45 57.5 L 45 42.5 Z" fill="url(#mainGradient)" filter="url(#softGlow)"/>
          <path d="M 60 35 L 75 42.5 L 75 57.5 L 60 65 L 45 57.5 L 45 42.5 Z" fill="none" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.6"/>
        </g>

        {/* Upward arrow - growth/momentum */}
        <g className="arrow-up" opacity="0.95">
          {/* Arrow shaft */}
          <line x1="60" y1="75" x2="60" y2="85" stroke="url(#accentGradient)" strokeWidth="2.5" strokeLinecap="round"/>
          
          {/* Arrow head */}
          <path d="M 55 80 L 60 75 L 65 80" fill="none" stroke="url(#accentGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* Side accent lines - dynamic feel */}
        <g opacity="0.5">
          <line x1="35" y1="50" x2="40" y2="50" stroke="url(#accentGradient)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="35" y1="60" x2="40" y2="60" stroke="url(#accentGradient)" strokeWidth="1.5" strokeLinecap="round"/>
          
          <line x1="80" y1="50" x2="85" y2="50" stroke="url(#accentGradient)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="80" y1="60" x2="85" y2="60" stroke="url(#accentGradient)" strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        {/* Bottom accent dots */}
        <g opacity="0.7">
          <circle cx="50" cy="95" r="1.5" fill="url(#accentGradient)"/>
          <circle cx="60" cy="98" r="1.5" fill="url(#accentGradient)"/>
          <circle cx="70" cy="95" r="1.5" fill="url(#accentGradient)"/>
        </g>
      </svg>
    </div>
  );
}
