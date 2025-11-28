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
  const uniqueId = `logo-${size}-${animated ? 'anim' : 'static'}`;

  return (
    <div className={`relative group ${animated ? 'float-animation' : ''}`}>
      <svg
        viewBox="0 0 200 200"
        className={`${sizeClass} ${className} drop-shadow-2xl ${animated ? 'animate-scale-in' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background circle for better visibility */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill={`url(#${uniqueId}-bg-gradient)`}
          stroke={`url(#${uniqueId}-border-gradient)`}
          strokeWidth="4"
        />

        {/* Hexagon shape - outer */}
        <g transform="translate(100, 100)">
          <polygon
            points="-70,-60 70,-60 100,0 70,60 -70,60 -100,0"
            fill={`url(#${uniqueId}-hex-bg)`}
            stroke={`url(#${uniqueId}-hex-border)`}
            strokeWidth="3"
            className={animated ? 'animate-pulse' : ''}
          />
          
          {/* Inner hexagon accent */}
          <polygon
            points="-55,-45 55,-45 75,0 55,45 -55,45 -75,0"
            fill="none"
            stroke={`url(#${uniqueId}-inner-accent)`}
            strokeWidth="2"
            opacity="0.7"
          />
        </g>

        {/* Cricket ball - centerpiece */}
        <g transform="translate(100, 100)">
          {/* Ball glow background */}
          <circle
            cx="0"
            cy="0"
            r="35"
            fill={`url(#${uniqueId}-ball-glow)`}
            opacity="0.5"
            className={animated ? 'animate-pulse' : ''}
          />
          
          {/* Main cricket ball */}
          <circle
            cx="0"
            cy="0"
            r="30"
            fill={`url(#${uniqueId}-ball-gradient)`}
            stroke={`url(#${uniqueId}-ball-stroke)`}
            strokeWidth="2.5"
          />
          
          {/* Cricket ball seam - horizontal curves */}
          <path
            d="M -22 -10 Q 0 -14 22 -10"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M -22 10 Q 0 14 22 10"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Cricket ball seam - vertical */}
          <path
            d="M 0 -24 Q 10 0 0 24"
            stroke={`url(#${uniqueId}-seam-gradient)`}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Dynamic energy lines - cardinal directions */}
        <g transform="translate(100, 100)" className={animated ? 'animate-spin-slow' : ''} style={{ transformOrigin: '100px 100px' }}>
          <line x1="0" y1="-88" x2="0" y2="-78" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="0" y1="78" x2="0" y2="88" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="-88" y1="0" x2="-78" y2="0" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="78" y1="0" x2="88" y2="0" stroke={`url(#${uniqueId}-energy-1)`} strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Diagonal energy lines */}
        <g transform="translate(100, 100)" className={animated ? 'animate-spin-slow' : ''} style={{ transformOrigin: '100px 100px', animationDirection: 'reverse' }}>
          <line x1="-62" y1="-62" x2="-52" y2="-52" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="-52" x2="62" y2="-62" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="-62" y1="62" x2="-52" y2="52" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="52" x2="62" y2="62" stroke={`url(#${uniqueId}-energy-2)`} strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Accent sparks */}
        <g className={animated ? 'opacity-100' : 'opacity-85'}>
          <circle cx="100" cy="28" r="3.5" fill="#00FFFF" className={animated ? 'animate-pulse' : ''} />
          <circle cx="172" cy="100" r="3" fill="#FF3366" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }} />
          <circle cx="100" cy="172" r="3.5" fill="#00FFFF" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }} />
          <circle cx="28" cy="100" r="3" fill="#FF3366" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }} />
        </g>

        <defs>
          {/* Background gradient */}
          <radialGradient id={`${uniqueId}-bg-gradient`} cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#0A0E27" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Border gradient - vibrant colors */}
          <linearGradient id={`${uniqueId}-border-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="25%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="75%" stopColor="#FF3366" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>

          {/* Hexagon background */}
          <radialGradient id={`${uniqueId}-hex-bg`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Hexagon border */}
          <linearGradient id={`${uniqueId}-hex-border`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Inner accent */}
          <linearGradient id={`${uniqueId}-inner-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0.7" />
          </linearGradient>

          {/* Cricket ball gradient */}
          <radialGradient id={`${uniqueId}-ball-gradient`} cx="40%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#1A1A2E" />
            <stop offset="40%" stopColor="#16213E" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Ball glow */}
          <radialGradient id={`${uniqueId}-ball-glow`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF3366" stopOpacity="0.3" />
          </radialGradient>

          {/* Ball stroke */}
          <linearGradient id={`${uniqueId}-ball-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Seam gradient */}
          <linearGradient id={`${uniqueId}-seam-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          {/* Energy lines gradient 1 */}
          <linearGradient id={`${uniqueId}-energy-1`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00FFFF" />
          </linearGradient>

          {/* Energy lines gradient 2 */}
          <linearGradient id={`${uniqueId}-energy-2`} x1="0%" y1="0%" x2="100%" y2="100%">
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
