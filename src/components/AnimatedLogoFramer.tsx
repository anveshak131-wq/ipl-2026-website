"use client"

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  size?: number
  animated?: boolean
  variant?: 'compact' | 'horizontal' | 'stacked' | 'inline'
}

// Clean, responsive logo component with optional animation.
export default function AnimatedLogoFramer({ size = 120, animated = true, variant = 'inline' }: Props) {
  const px = `${size}px`
  const pathRef = useRef<SVGPathElement | null>(null)
  const [coords, setCoords] = useState<{ xs: number[]; ys: number[] } | null>(null)

  useEffect(() => {
    if (!animated || typeof window === 'undefined') return
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const path = pathRef.current
    if (!path) return
    try {
      const len = path.getTotalLength()
      const steps = 40
      const xs: number[] = []
      const ys: number[] = []
      for (let i = 0; i <= steps; i++) {
        const pt = path.getPointAtLength((i / steps) * len)
        xs.push(pt.x)
        ys.push(pt.y)
      }
      setCoords({ xs, ys })
    } catch (e) {
      // ignore
    }
  }, [animated])

  // Provide static SVG fallbacks for alternate variants
  if (variant !== 'inline') {
    const map: Record<string, string> = {
      compact: '/logo/sportsup18_monogram_compact.svg',
      horizontal: '/logo/sportsup18_scoreboard.svg',
      stacked: '/logo/sportsup18_crest.svg',
      inline: '/logo/sportsup18_animated.svg'
    }
    const src = map[variant]
    return <img src={src} alt="SportsUP18 logo" style={{ width: px, height: 'auto' }} />
  }

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doAnimate = animated && !prefersReduced && coords && coords.xs.length > 0

  // Responsive viewBox: 400x120 base
  return (
    <div style={{ width: px, height: 'auto', display: 'inline-block' }} aria-hidden={false}>
      <svg width={size * 3.3} height={size} viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="aTitle">
        <title id="aTitle">SportsUP18 Animated Logo</title>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#0B7A3F"/>
            <stop offset="100%" stopColor="#0FA67A"/>
          </linearGradient>
          <path ref={pathRef} id="arcPath" d="M30 90 C150 10, 250 10, 370 90" />
        </defs>

        <rect width="100%" height="100%" fill="transparent" />

        {/* Ball along arc (animated via sampled coords) */}
        {doAnimate ? (
          <motion.circle r={10} fill="#E63946" stroke="#C12A3A" strokeWidth={2}
            initial={{ cx: coords!.xs[0], cy: coords!.ys[0] }}
            animate={{ cx: coords!.xs, cy: coords!.ys }}
            transition={{ duration: 1.1, ease: 'easeInOut', times: coords!.xs.map((_, i) => i / (coords!.xs.length - 1)) }}
          />
        ) : (
          <circle r={10} fill="#E63946" stroke="#C12A3A" strokeWidth={2} cx={30} cy={90} />
        )}

        {/* Wordmark (fade in) */}
        <motion.g initial={{ opacity: doAnimate ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
          <text x="20" y="80" fontFamily="Bebas Neue, Arial, Helvetica, sans-serif" fontSize="48" fill="url(#g1)">Sports</text>
          <text x="260" y="80" fontFamily="Bebas Neue, Arial, Helvetica, sans-serif" fontSize="48" fill="#111827">UP</text>
          <text x="320" y="80" fontFamily="Bebas Neue, Arial, Helvetica, sans-serif" fontSize="48" fill="#E63946">18</text>
        </motion.g>
      </svg>
    </div>
  )
}
