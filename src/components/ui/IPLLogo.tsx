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
    <div className={`relative group ${animated ? 'float-animation' : ''}`}>
      <svg
        viewBox="0 0 160 160"
        className={`${sizeClass} ${className} drop-shadow-2xl ${animated ? 'animate-scale-in' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx="80"
          cy="80"
          r="74"
          fill="none"
          stroke="url(#su-ring-gradient)"
          strokeWidth="3"
          className={animated ? 'animate-spin-slow' : ''}
          opacity="0.85"
        />

        {/* Main badge */}
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="url(#su-bg-gradient)"
          stroke="url(#su-ring-gradient)"
          strokeWidth="2.5"
        />

        {/* Inner subtle ring */}
        <circle
          cx="80"
          cy="80"
          r="56"
          fill="none"
          stroke="url(#su-inner-ring)"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Animated cricket arc */}
        <path
          d="M32 110 C 48 130 112 130 128 110"
          stroke="url(#su-arc-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          className={animated ? 'animate-pulse' : ''}
          opacity="0.7"
        />

        {/* Text: SportsUp */}
        <text
          x="80"
          y="74"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          letterSpacing="0.14em"
          fill="url(#su-text-gradient)"
        >
          SPORTS
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          letterSpacing="0.14em"
          fill="url(#su-text-gradient)"
        >
          UP
        </text>

        {/* 18 badge */}
        <g transform="translate(112, 52)">
          <circle
            cx="0"
            cy="0"
            r="14"
            fill="url(#su-99-bg)"
            stroke="rgba(15,23,42,0.8)"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#0B1120"
          >
            18
          </text>
        </g>

        {/* Subtle cricket ball */}
        <g transform="translate(46, 40) scale(0.9)">
          <circle cx="0" cy="0" r="8" fill="#F97316" stroke="#FDBA74" strokeWidth="1.5" />
          <path d="M -5 -2 Q 0 0 5 2" stroke="#FDBA74" strokeWidth="1.2" fill="none" />
          <path d="M -5 2 Q 0 0 5 -2" stroke="#FDBA74" strokeWidth="1.2" fill="none" />
        </g>

        {/* Subtle bat at bottom */}
        <g transform="translate(80, 112) scale(0.9)">
          <rect x="-8" y="-8" width="16" height="12" rx="2" fill="url(#su-bat-blade)" stroke="#4B5563" strokeWidth="1" />
          <rect x="-2" y="4" width="4" height="9" rx="1" fill="#0F172A" stroke="#020617" strokeWidth="1" />
          <rect x="-2.5" y="9" width="5" height="3" fill="#22C55E" />
        </g>

        {/* Tiny accent stars */}
        <g className="opacity-80">
          <circle cx="42" cy="58" r="2.1" fill="#FACC15" />
          <circle cx="116" cy="90" r="1.8" fill="#38BDF8" />
          <circle cx="54" cy="110" r="1.8" fill="#FACC15" />
        </g>

        <defs>
          <linearGradient id="su-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#22C55E" />
            <stop offset="80%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <radialGradient id="su-bg-gradient" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="60%" stopColor="#020617" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          <linearGradient id="su-inner-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4B5563" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="su-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <linearGradient id="su-text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="80%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <radialGradient id="su-99-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </radialGradient>

          <linearGradient id="su-bat-blade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Outer glow */}
      <div className="absolute inset-0 -z-10 blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300">
        <div className={`${sizeClass} bg-gradient-to-br from-ipl-blue-light via-ipl-gold to-ipl-purple rounded-full ${animated ? 'pulse-glow' : ''}`} />
      </div>
    </div>
  );
}
