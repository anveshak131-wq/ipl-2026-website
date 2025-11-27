"use client"

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'

type Props = {
  size?: number
  animated?: boolean
}

export default function AnimatedScoreboard({ size = 120, animated = true }: Props) {
  const controls = useAnimation()
  const boxW = Math.round(size * 3.2)
  const boxH = Math.round(size * 0.9)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!animated) return
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) return
      while (mounted) {
        await controls.start({ rotate: [0, 2, 0], transition: { duration: 1.2, ease: 'easeInOut' } })
        await controls.start({ rotate: [0], transition: { duration: 0.6 } })
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
    run()
    return () => { mounted = false }
  }, [animated, controls])

  return (
    <motion.div style={{ width: boxW, height: boxH }} animate={controls} aria-hidden={false}>
      <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="as">
        <title id="as">SportsUP Scoreboard</title>
        <rect x="0" y="0" width="100%" height="100%" rx="10" fill="#071022" stroke="#0b3b2b" />
        <g transform={`translate(${Math.round(boxW * 0.04)}, ${Math.round(boxH * 0.18)})`}>
          <text x="0" y="0" fontFamily="Inter, Arial" fontSize={Math.round(size * 0.18)} fill="#9EECD9">SPORTS</text>
          <text x="0" y={Math.round(size * 0.46)} fontFamily="Bebas Neue, Arial" fontSize={Math.round(size * 0.36)} fill="#F8FAFC">UP</text>
        </g>

        {/* animated digit block */}
        <g transform={`translate(${Math.round(boxW * 0.55)}, ${Math.round(boxH * 0.18)})`}>
          <rect x="0" y="0" width={Math.round(boxW * 0.28)} height={Math.round(boxH * 0.64)} rx="8" fill="#0b1f3a" stroke="#0FA67A" strokeWidth={2} />

          <motion.text initial={{ y: 0 }} animate={{ y: [-8,0] }} transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 0.9 }} x={Math.round(boxW * 0.14)} y={Math.round(boxH * 0.46)} fontFamily="Bebas Neue, Arial" fontSize={Math.round(size * 0.36)} fill="#E63946" textAnchor="middle">18</motion.text>
        </g>
      </svg>
    </motion.div>
  )
}
