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
        className={`${animated ? 'transition-transform duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.65))' : 'none',
        }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="65%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="sStrokeGradient" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.45)" />
            <stop offset="65%" stopColor="rgba(24, 24, 27, 0.15)" />
            <stop offset="100%" stopColor="rgba(24, 24, 27, 0)" />
          </radialGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>{`
            @keyframes orbit {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulseRing {
              0%, 100% { opacity: 0.35; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.07); }
            }
            @keyframes shimmerStroke {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -180; }
            }
            @keyframes flareBlink {
              0%, 100% { opacity: 0; transform: scale(0.6); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
            .logo-ring {
              animation: pulseRing 4s ease-in-out infinite;
              transform-origin: 50px 50px;
            }
            .logo-s {
              animation: shimmerStroke 6s linear infinite;
            }
            .logo-orbit {
              animation: orbit 7.5s linear infinite;
              transform-origin: 50px 50px;
            }
            .logo-flare {
              animation: flareBlink 2.8s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Ambient glow */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#glowGradient)"
          className={animated ? 'logo-ring' : ''}
          style={{ animationDuration: animated ? (isHovered ? '2.4s' : '4s') : undefined }}
        />

        {/* Stadium arc ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="120 40"
          className={animated ? 'logo-ring' : ''}
          style={{
            animationDuration: animated ? (isHovered ? '2.2s' : '4.6s') : undefined,
            filter: 'url(#softGlow)',
          }}
        />

        {/* Dynamic energy orbit trail */}
        <path
          d="M20 58c4 12 18 22 32 22s28-10 32-22"
          fill="none"
          stroke="rgba(56, 189, 248, 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Stylised "S" stroke */}
        <path
          d="M70 28c-10-12-36-12-46 0-8 10-2 22 14 24 18 2 22 12 10 20-10 7-26 4-34-6"
          fill="none"
          stroke="url(#sStrokeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={animated ? '120 40' : 'none'}
          className={animated ? 'logo-s' : ''}
          style={{
            filter: 'url(#softGlow)',
            animationDuration: animated ? (isHovered ? '3.2s' : '6s') : undefined,
          }}
        />

        {/* Cricket stump pulse */}
        <g
          className={animated ? 'logo-flare' : ''}
          style={{
            transformOrigin: '68px 35px',
            animationDuration: animated ? (isHovered ? '1.8s' : '2.8s') : undefined,
          }}
        >
          <rect x="65" y="30" width="4" height="18" rx="2" fill="#fde68a" opacity="0.85" />
        </g>

        {/* Cricket ball orbit */}
        <g
          className={animated ? 'logo-orbit' : ''}
          style={{
            transformOrigin: '50px 50px',
            animationDuration: animated ? (isHovered ? '3s' : '7.5s') : undefined,
          }}
        >
          <g transform="translate(50 10)">
            <circle r="6"
              fill="#f97316"
              stroke="#fff7ed"
              strokeWidth="1.2"
              filter="url(#softGlow)"
            />
            <path
              d="M-4 -1c2.2.8 4.4.8 6.8 0"
              stroke="#fde68a"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <circle r="2.8" cx="-1.6" cy="-1.8" fill="rgba(255, 255, 255, 0.6)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
