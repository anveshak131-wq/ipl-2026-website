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
        viewBox="0 0 200 200"
        className={`${sizeClass} ${className} drop-shadow-2xl ${animated ? 'animate-scale-in' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dynamic energy background - hexagon shape */}
        <g transform="translate(100, 100)">
          {/* Outer hexagon with gradient */}
          <polygon
            points="-70,-60 70,-60 100,0 70,60 -70,60 -100,0"
            fill="url(#new-bg-gradient)"
            stroke="url(#new-border-gradient)"
            strokeWidth="3"
            className={animated ? 'animate-pulse' : ''}
          />
          
          {/* Inner hexagon accent */}
          <polygon
            points="-55,-45 55,-45 75,0 55,45 -55,45 -75,0"
            fill="none"
            stroke="url(#new-inner-accent)"
            strokeWidth="2"
            opacity="0.6"
          />
        </g>

        {/* Cricket ball - centerpiece */}
        <g transform="translate(100, 100)">
          {/* Ball shadow/glow */}
          <circle
            cx="0"
            cy="0"
            r="32"
            fill="url(#ball-glow)"
            opacity="0.4"
            className={animated ? 'animate-pulse' : ''}
          />
          
          {/* Main cricket ball */}
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="url(#ball-gradient)"
            stroke="url(#ball-stroke)"
            strokeWidth="2"
          />
          
          {/* Cricket ball seam - top curve */}
          <path
            d="M -20 -8 Q 0 -12 20 -8"
            stroke="url(#seam-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Cricket ball seam - bottom curve */}
          <path
            d="M -20 8 Q 0 12 20 8"
            stroke="url(#seam-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Cricket ball seam - vertical */}
          <path
            d="M 0 -20 Q 8 0 0 20"
            stroke="url(#seam-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Dynamic energy lines - top */}
        <g transform="translate(100, 100)" className={animated ? 'animate-spin-slow' : ''} style={{ transformOrigin: '100px 100px' }}>
          <line x1="0" y1="-85" x2="0" y2="-75" stroke="url(#energy-gradient)" strokeWidth="4" strokeLinecap="round" />
          <line x1="0" y1="75" x2="0" y2="85" stroke="url(#energy-gradient)" strokeWidth="4" strokeLinecap="round" />
          <line x1="-85" y1="0" x2="-75" y2="0" stroke="url(#energy-gradient)" strokeWidth="4" strokeLinecap="round" />
          <line x1="75" y1="0" x2="85" y2="0" stroke="url(#energy-gradient)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Diagonal energy lines */}
        <g transform="translate(100, 100)" className={animated ? 'animate-spin-slow' : ''} style={{ transformOrigin: '100px 100px', animationDirection: 'reverse' }}>
          <line x1="-60" y1="-60" x2="-50" y2="-50" stroke="url(#energy-gradient-2)" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="-50" x2="60" y2="-60" stroke="url(#energy-gradient-2)" strokeWidth="3" strokeLinecap="round" />
          <line x1="-60" y1="60" x2="-50" y2="50" stroke="url(#energy-gradient-2)" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="50" x2="60" y2="60" stroke="url(#energy-gradient-2)" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Accent sparks */}
        <g className={animated ? 'opacity-100' : 'opacity-80'}>
          <circle cx="100" cy="30" r="3" fill="#00FFFF" className={animated ? 'animate-pulse' : ''} />
          <circle cx="170" cy="100" r="2.5" fill="#FF3366" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }} />
          <circle cx="100" cy="170" r="3" fill="#00FFFF" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }} />
          <circle cx="30" cy="100" r="2.5" fill="#FF3366" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }} />
        </g>

        <defs>
          {/* Background gradient - dark with vibrant edges */}
          <radialGradient id="new-bg-gradient" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#0A0E27" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Border gradient - electric colors */}
          <linearGradient id="new-border-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="25%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="75%" stopColor="#FF3366" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>

          {/* Inner accent */}
          <linearGradient id="new-inner-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0.6" />
          </linearGradient>

          {/* Cricket ball gradient */}
          <radialGradient id="ball-gradient" cx="40%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#1A1A2E" />
            <stop offset="40%" stopColor="#16213E" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Ball glow */}
          <radialGradient id="ball-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF3366" stopOpacity="0.2" />
          </radialGradient>

          {/* Ball stroke */}
          <linearGradient id="ball-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Seam gradient */}
          <linearGradient id="seam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          {/* Energy lines gradient */}
          <linearGradient id="energy-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00FFFF" />
          </linearGradient>

          {/* Energy lines gradient 2 */}
          <linearGradient id="energy-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3366" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>
        </defs>
      </svg>

      {/* Outer glow effect */}
      <div className="absolute inset-0 -z-10 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-300">
        <div className={`${sizeClass} bg-gradient-to-br from-[#0066FF] via-[#FF3366] to-[#00FFFF] rounded-full ${animated ? 'pulse-glow' : ''}`} />
      </div>
    </div>
  );
}
