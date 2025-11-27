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
        className="absolute rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-500/30 border border-blue-400/50 backdrop-blur-md"
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
          filter: isHovered && animated ? 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.9)) drop-shadow(0 0 50px rgba(34, 197, 234, 0.6))' : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))',
        }}
      >
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>

          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>

          <filter id="brightGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes spin-smooth {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-bright {
              0%, 100% { opacity: 0.9; }
              50% { opacity: 1; }
            }
            @keyframes float-bounce {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-2px); }
            }
            
            .spin-element {
              transform-origin: 60px 60px;
              animation: ${animated ? 'spin-smooth 6s linear infinite' : 'none'};
            }
            .pulse-element {
              animation: ${animated ? 'pulse-bright 2.5s ease-in-out infinite' : 'none'};
            }
            .float-element {
              animation: ${animated ? 'float-bounce 3s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer rotating ring */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.6" className="spin-element" strokeDasharray="8,4"/>

        {/* Inner glow circle */}
        <circle cx="60" cy="60" r="52" fill="url(#centerGlow)" opacity="0.12" className="pulse-element"/>

        {/* Main badge background */}
        <circle cx="60" cy="60" r="50" fill="url(#primaryGradient)" opacity="0.15" filter="url(#brightGlow)"/>

        {/* Central play/arrow icon - modern sports symbol */}
        <g className="float-element" opacity="1">
          {/* Left triangle (play button style) */}
          <polygon points="45,45 45,75 70,60" fill="url(#accentGradient)" filter="url(#brightGlow)"/>
        </g>

        {/* Top accent bar */}
        <rect x="35" y="38" width="50" height="3" rx="1.5" fill="url(#accentGradient)" opacity="0.8" className="pulse-element"/>

        {/* Bottom accent bar */}
        <rect x="35" y="79" width="50" height="3" rx="1.5" fill="url(#accentGradient)" opacity="0.8" className="pulse-element" style={{ animationDelay: '0.3s' }}/>

        {/* Left side dot */}
        <circle cx="32" cy="60" r="2.5" fill="url(#accentGradient)" opacity="0.9" className="pulse-element" style={{ animationDelay: '0.6s' }}/>

        {/* Right side dot */}
        <circle cx="88" cy="60" r="2.5" fill="url(#accentGradient)" opacity="0.9" className="pulse-element" style={{ animationDelay: '0.9s' }}/>

        {/* Decorative corner elements */}
        <g opacity="0.7">
          <circle cx="40" cy="40" r="1.5" fill="url(#accentGradient)"/>
          <circle cx="80" cy="80" r="1.5" fill="url(#accentGradient)"/>
        </g>
      </svg>
    </div>
  );
}
