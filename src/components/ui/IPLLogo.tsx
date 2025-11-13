'use client';

interface IPLLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export default function IPLLogo({ size = 'md', className = '', animated = false }: IPLLogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const sizeClass = sizes[size];
  const animatedClass = animated ? 'animate-spin' : '';

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${sizeClass} ${animatedClass} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#ipl-gradient)" strokeWidth="2" />

      {/* Inner Diamond Background */}
      <path
        d="M50 10 L90 50 L50 90 L10 50 Z"
        fill="url(#ipl-gradient-fill)"
        opacity="0.2"
      />

      {/* IPL Text */}
      <text
        x="50"
        y="45"
        fontSize="28"
        fontWeight="bold"
        textAnchor="middle"
        fill="url(#ipl-gradient)"
        fontFamily="Arial, sans-serif"
      >
        IPL
      </text>

      {/* Cricket Bat Icon */}
      <g>
        {/* Bat handle */}
        <line x1="50" y1="52" x2="50" y2="72" stroke="url(#ipl-gradient)" strokeWidth="3" strokeLinecap="round" />
        
        {/* Bat head */}
        <path
          d="M40 52 Q50 48 60 52 Q55 55 50 55 Q45 55 40 52"
          fill="url(#ipl-gradient)"
          opacity="0.8"
        />
      </g>

      {/* Ball - Small Circle */}
      <circle cx="65" cy="35" r="4" fill="url(#ipl-gradient)" />

      {/* Decorative Lines */}
      <line x1="50" y1="12" x2="50" y2="20" stroke="url(#ipl-gradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="50" y1="80" x2="50" y2="88" stroke="url(#ipl-gradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="12" y1="50" x2="20" y2="50" stroke="url(#ipl-gradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="80" y1="50" x2="88" y2="50" stroke="url(#ipl-gradient)" strokeWidth="1.5" opacity="0.6" />

      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="ipl-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="ipl-gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
    </svg>
  );
}
