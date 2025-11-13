'use client';

interface IPLLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export default function IPLLogo({ size = 'md', className = '', animated = false }: IPLLogoProps) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const sizeClass = sizes[size];

  return (
    <div className="relative group">
      <svg
        viewBox="0 0 120 120"
        className={`${sizeClass} ${className} drop-shadow-2xl ${animated ? 'animate-pulse' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Glow Circle */}
        <circle 
          cx="60" 
          cy="60" 
          r="56" 
          fill="none" 
          stroke="url(#ipl-gradient-bright)" 
          strokeWidth="3"
          className="animate-pulse"
          opacity="0.6"
        />
        
        {/* Main Circle */}
        <circle 
          cx="60" 
          cy="60" 
          r="52" 
          fill="url(#ipl-bg-gradient)" 
          stroke="url(#ipl-gradient-bright)" 
          strokeWidth="2.5"
        />

        {/* Inner Circle Decoration */}
        <circle 
          cx="60" 
          cy="60" 
          r="45" 
          fill="none" 
          stroke="url(#ipl-gradient-bright)" 
          strokeWidth="1" 
          opacity="0.3"
        />

        {/* IPL Text - Large and Bold */}
        <text
          x="60"
          y="58"
          fontSize="36"
          fontWeight="900"
          textAnchor="middle"
          fill="url(#ipl-text-gradient)"
          fontFamily="Arial Black, sans-serif"
          letterSpacing="2"
          className="drop-shadow-lg"
        >
          IPL
        </text>

        {/* Cricket Ball - Top Right */}
        <g transform="translate(82, 30)">
          <circle cx="0" cy="0" r="8" fill="#FF4444" stroke="#CC0000" strokeWidth="1.5" />
          <path d="M -6 -2 Q 0 0 6 2" stroke="#CC0000" strokeWidth="1.5" fill="none" />
          <path d="M -6 2 Q 0 0 6 -2" stroke="#CC0000" strokeWidth="1.5" fill="none" />
        </g>

        {/* Cricket Bat - Bottom */}
        <g transform="translate(60, 78)">
          {/* Bat blade */}
          <rect x="-8" y="-8" width="16" height="12" rx="2" fill="url(#bat-gradient)" stroke="#8B4513" strokeWidth="1" />
          {/* Bat handle */}
          <rect x="-2" y="4" width="4" height="10" rx="1" fill="#654321" stroke="#4A2511" strokeWidth="1" />
          {/* Grip */}
          <rect x="-2.5" y="10" width="5" height="3" fill="#1D3D8D" />
        </g>

        {/* Decorative Stars */}
        <g className="animate-pulse">
          <circle cx="30" cy="35" r="2.5" fill="#FFD700" opacity="0.8" />
          <circle cx="90" cy="55" r="2" fill="#5091CD" opacity="0.8" />
          <circle cx="35" cy="85" r="2" fill="#FFD700" opacity="0.8" />
        </g>

        {/* Gradient Definitions */}
        <defs>
          {/* Bright gradient for borders and text */}
          <linearGradient id="ipl-gradient-bright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E5FBD" stopOpacity="1" />
            <stop offset="40%" stopColor="#6BB3FF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFE14D" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
          </linearGradient>

          {/* Text gradient - vibrant */}
          <linearGradient id="ipl-text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#6BB3FF" />
            <stop offset="70%" stopColor="#FFE14D" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Background gradient */}
          <radialGradient id="ipl-bg-gradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1D3D8D" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0F1F4D" stopOpacity="1" />
          </radialGradient>

          {/* Bat gradient */}
          <linearGradient id="bat-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D2B48C" />
            <stop offset="100%" stopColor="#8B7355" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300">
        <div className={`${sizeClass} bg-gradient-to-br from-ipl-blue-light via-ipl-gold to-ipl-purple rounded-full`} />
      </div>
    </div>
  );
}
