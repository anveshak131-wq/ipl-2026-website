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
        className="absolute rounded-full bg-gradient-to-br from-blue-600/30 to-orange-500/30 border border-yellow-400/50 backdrop-blur-md"
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
          filter: isHovered && animated ? 'drop-shadow(0 0 25px rgba(251, 191, 36, 0.9)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.6))' : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))',
        }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#22C55E" />
            <stop offset="80%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <radialGradient id="bgGradient" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          <linearGradient id="batGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>{`
            @keyframes spin-ring {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 1; }
            }
            @keyframes swing-bat {
              0%, 100% { transform: rotate(-20deg); }
              50% { transform: rotate(20deg); }
            }
            @keyframes bounce-ball {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            @keyframes rotate-glove {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes float-wicket {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-2px); }
            }
            
            .ring {
              animation: ${animated ? 'spin-ring 8s linear infinite' : 'none'};
              transform-origin: 60px 60px;
            }
            .glow {
              animation: ${animated ? 'pulse-glow 2.5s ease-in-out infinite' : 'none'};
            }
            .bat {
              animation: ${animated ? 'swing-bat 2s ease-in-out infinite' : 'none'};
              transform-origin: 60px 60px;
            }
            .ball {
              animation: ${animated ? 'bounce-ball 2s ease-in-out infinite' : 'none'};
            }
            .glove {
              animation: ${animated ? 'rotate-glove 4s linear infinite' : 'none'};
              transform-origin: 60px 60px;
            }
            .wicket {
              animation: ${animated ? 'float-wicket 3s ease-in-out infinite' : 'none'};
            }
          `}</style>
        </defs>

        {/* Outer rotating ring */}
        <circle cx="60" cy="60" r="58" fill="none" stroke="url(#ringGradient)" strokeWidth="2" opacity="0.9" className="ring"/>

        {/* Main background */}
        <circle cx="60" cy="60" r="56" fill="url(#bgGradient)" stroke="url(#ringGradient)" strokeWidth="2"/>

        {/* Inner ring */}
        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ringGradient)" strokeWidth="1" opacity="0.4" className="glow"/>

        {/* Cricket Ball - Top Left (Bouncing) */}
        <g className="ball" transform="translate(35, 35)">
          <circle cx="0" cy="0" r="6" fill="#F97316" stroke="#FDBA74" strokeWidth="1" filter="url(#glow)"/>
          <path d="M -3 -1 Q 0 0 3 1" stroke="#FDBA74" strokeWidth="0.8" fill="none"/>
          <path d="M -3 1 Q 0 0 3 -1" stroke="#FDBA74" strokeWidth="0.8" fill="none"/>
        </g>

        {/* Cricket Bat - Left Side (Swinging) */}
        <g className="bat" transform="translate(25, 60)">
          <rect x="-4" y="-6" width="8" height="10" rx="1" fill="url(#batGradient)" stroke="#4B5563" strokeWidth="0.8"/>
          <rect x="-1.5" y="4" width="3" height="6" rx="0.5" fill="#0F172A" stroke="#020617" strokeWidth="0.5"/>
          <rect x="-1.8" y="10" width="3.6" height="2" fill="#22C55E"/>
        </g>

        {/* Wickets - Right Side (Floating) */}
        <g className="wicket" transform="translate(90, 60)">
          {/* Left stump */}
          <rect x="-5" y="-8" width="1.5" height="16" fill="#FACC15" rx="0.5"/>
          {/* Middle stump */}
          <rect x="-1.5" y="-8" width="1.5" height="16" fill="#FACC15" rx="0.5"/>
          {/* Right stump */}
          <rect x="3" y="-8" width="1.5" height="16" fill="#FACC15" rx="0.5"/>
          {/* Bails */}
          <rect x="-5" y="-9" width="13.5" height="1.2" fill="#F97316" rx="0.5"/>
        </g>

        {/* Cricket Glove - Bottom Left (Rotating) */}
        <g className="glove" transform="translate(35, 90)">
          <ellipse cx="0" cy="0" rx="5" ry="6" fill="#22C55E" stroke="#16A34A" strokeWidth="0.8"/>
          <circle cx="-2" cy="-3" r="1.2" fill="#16A34A"/>
          <circle cx="0" cy="-4" r="1.2" fill="#16A34A"/>
          <circle cx="2" cy="-3" r="1.2" fill="#16A34A"/>
          <path d="M -4 2 L -5 5" stroke="#16A34A" strokeWidth="1" strokeLinecap="round"/>
        </g>

        {/* Cricket Bowl - Bottom Right (Pulsing) */}
        <g className="glow" transform="translate(85, 90)">
          <circle cx="0" cy="0" r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" filter="url(#glow)"/>
          <circle cx="0" cy="0" r="3" fill="none" stroke="#60A5FA" strokeWidth="0.5" opacity="0.6"/>
          <path d="M -2 -2 L 2 2 M 2 -2 L -2 2" stroke="#60A5FA" strokeWidth="0.5" opacity="0.4"/>
        </g>

        {/* Center accent - pulsing */}
        <circle cx="60" cy="60" r="8" fill="url(#ringGradient)" opacity="0.3" className="glow" filter="url(#glow)"/>

        {/* Decorative dots */}
        <g opacity="0.7">
          <circle cx="50" cy="45" r="1.5" fill="#FACC15"/>
          <circle cx="70" cy="75" r="1.5" fill="#38BDF8"/>
        </g>
      </svg>
    </div>
  );
}
