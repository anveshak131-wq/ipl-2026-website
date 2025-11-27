import React from 'react'

type Props = {
  size?: number
  animated?: boolean
  variant?: 'batball' | 'scoreboard' | 'stadium' | 'inline'
}

export default function AnimatedLogo({ size = 120, animated = true, variant = 'inline' }: Props) {
  const px = `${size}px`

  if (variant === 'inline') {
    return (
      <div style={{ width: px, height: 'auto', display: 'inline-block' }} aria-hidden={false}>
        {/* Inline animated SVG (keeps styles encapsulated) */}
        <svg width={size * 3.3} height={size} viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="aTitle">
          <title id="aTitle">SportsUP18 Animated Logo</title>
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#0B7A3F"/>
              <stop offset="100%" stopColor="#0FA67A"/>
            </linearGradient>

            <mask id="revealMask">
              <rect x="0" y="0" width="400" height="120" fill="#fff"/>
              <rect id="maskRect" x="0" y="0" width="0" height="120" fill="#000" />
            </mask>

            <path id="arcPath" d="M30 90 C150 10, 250 10, 370 90" />
          </defs>

          <rect width="100%" height="100%" fill="transparent"/>

          <g>
            <circle id="ball" r="10" fill="#E63946" stroke="#C12A3A" strokeWidth="2">
              {animated ? (
                <animateMotion dur="1.1s" begin="0s" fill="freeze" keySplines="0.42 0 0.58 1" calcMode="spline">
                  <mpath xlinkHref="#arcPath" />
                </animateMotion>
              ) : null}
            </circle>
          </g>

          <g mask="url(#revealMask)">
            <text x="20" y="80" fontFamily="'Bebas Neue',Arial,Helvetica,sans-serif" fontSize="48" fill="url(#g1)">Sports</text>
            <text x="260" y="80" fontFamily="'Bebas Neue',Arial,Helvetica,sans-serif" fontSize="48" fill="#111827">UP</text>
            <text x="320" y="80" fontFamily="'Bebas Neue',Arial,Helvetica,sans-serif" fontSize="48" fill="#E63946">18</text>
          </g>

          <style>{`
            @keyframes reveal { from { width: 0; } to { width: 400px; } }
            #maskRect { animation: reveal 1.2s ease-out forwards; }
            @media (prefers-reduced-motion: reduce) { #ball, #maskRect { animation: none; } #maskRect { width: 400px; } }
          `}</style>
        </svg>
      </div>
    )
  }

  // For other variants, load static SVGs from public/logo
  const map: Record<string, string> = {
    batball: '/logo/sportsup18-batball.svg',
    scoreboard: '/logo/sportsup18-scoreboard.svg',
    stadium: '/logo/sportsup18-stadium.svg',
    inline: '/logo/sportsup18-animated.svg'
  }

  const src = map[variant]
  return (
    <img src={src} alt="SportsUP18 logo" style={{ width: px, height: 'auto' }} />
  )
}
