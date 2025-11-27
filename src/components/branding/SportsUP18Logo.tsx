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
    sm: { width: 32, height: 32, textSize: 'text-sm' },
    md: { width: 48, height: 48, textSize: 'text-base' },
    lg: { width: 64, height: 64, textSize: 'text-lg' },
    xl: { width: 96, height: 96, textSize: 'text-2xl' },
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* SVG Logo */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className={`${animated ? 'transition-transform duration-300' : ''} ${
          isHovered && animated ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && animated ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none',
        }}
      >
        {/* Define gradients */}
        <defs>
          <linearGradient id="sportsup-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="sportsup-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="sportsup-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>{`
            @keyframes spin-slow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            @keyframes float-up {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            .logo-spin {
              animation: spin-slow 20s linear infinite;
              transform-origin: 50px 50px;
            }
            .logo-pulse {
              animation: pulse-glow 2s ease-in-out infinite;
            }
            .logo-float {
              animation: float-up 3s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Background circle with gradient */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#sportsup-gradient-1)"
          opacity="0.1"
          className={animated ? 'logo-pulse' : ''}
        />

        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#sportsup-gradient-1)"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Inner decorative circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#sportsup-gradient-2)"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Cricket bat shape (stylized) */}
        <g className={animated ? 'logo-float' : ''}>
          {/* Bat handle */}
          <rect
            x="45"
            y="35"
            width="10"
            height="30"
            rx="5"
            fill="url(#sportsup-gradient-1)"
            opacity="0.9"
          />

          {/* Bat blade */}
          <ellipse
            cx="50"
            cy="28"
            rx="12"
            ry="8"
            fill="url(#sportsup-gradient-1)"
            opacity="0.95"
          />
        </g>

        {/* Cricket ball (stylized) */}
        <g className={animated ? 'logo-spin' : ''}>
          <circle cx="50" cy="65" r="8" fill="url(#sportsup-gradient-2)" opacity="0.9" />
          {/* Ball seam */}
          <path
            d="M 42 65 Q 50 70 58 65"
            stroke="url(#sportsup-gradient-3)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
        </g>

        {/* Upward arrow (dynamic element) */}
        <g className={animated ? 'logo-float' : ''} style={{ animationDelay: '0.5s' }}>
          <path
            d="M 65 55 L 70 50 L 75 55"
            stroke="url(#sportsup-gradient-3)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          <line
            x1="70"
            y1="50"
            x2="70"
            y2="60"
            stroke="url(#sportsup-gradient-3)"
            strokeWidth="2"
            opacity="0.8"
            strokeLinecap="round"
          />
        </g>

        {/* Number 18 indicator (subtle) */}
        <circle
          cx="75"
          cy="30"
          r="6"
          fill="url(#sportsup-gradient-3)"
          opacity="0.7"
        />
        <text
          x="75"
          y="33"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="white"
          opacity="0.9"
        >
          18
        </text>
      </svg>

      {/* Logo text with animation */}
      <style>{`
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
          50% { text-shadow: 0 0 15px rgba(251, 191, 36, 0.8); }
        }
        .sportsup-text {
          ${animated ? 'animation: text-glow 2s ease-in-out infinite;' : ''}
        }
      `}</style>
    </div>
  );
}
