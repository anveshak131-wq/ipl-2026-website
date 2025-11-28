'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// RCB Brand Colors
const RCB_COLORS = {
  primary: '#EC1C24',      // RCB Red
  secondary: '#000000',     // Black
  gold: '#FFD700',          // Gold
  darkRed: '#B91C1C',
  lightRed: '#FEE2E2',
  orange: '#FF8C00',
};

interface RCBPremiumLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showParticles?: boolean;
}

export default function RCBPremiumLogo({ 
  className = '', 
  size = 'md',
  animated = true,
  showParticles = true 
}: RCBPremiumLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const inView = useInView(containerRef, { once: true, margin: '-100px' });

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96',
  };

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
      controls.start('visible');
    }
  }, [inView, controls]);

  useEffect(() => {
    if (isHovered && animated) {
      controls.start('hover');
    } else {
      controls.start('visible');
    }
  }, [isHovered, animated, controls]);

  // Generate unique IDs for gradients to avoid conflicts
  const uniqueId = useRef(Math.random().toString(36).substring(7));
  const gradientId1 = `rcb-gradient-1-${uniqueId.current}`;
  const gradientId2 = `rcb-gradient-2-${uniqueId.current}`;
  const gradientId3 = `rcb-gradient-3-${uniqueId.current}`;
  const glowFilterId = `rcb-glow-${uniqueId.current}`;
  const shadowFilterId = `rcb-shadow-${uniqueId.current}`;

  return (
    <div
      ref={containerRef}
      className={`relative ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Glow */}
      {showParticles && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${RCB_COLORS.primary}40, transparent)`,
            filter: 'blur(20px)',
          }}
        />
      )}

      {/* Main Logo Container */}
      <motion.svg
        viewBox="0 0 300 300"
        className="relative z-10 w-full h-full"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: {
            opacity: 0,
            scale: 0.8,
            rotate: -10,
          },
          visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            },
          },
          hover: {
            scale: 1.1,
            rotate: 5,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
        }}
      >
        <defs>
          {/* Primary Gradient - Red to Gold */}
          <linearGradient id={gradientId1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={RCB_COLORS.primary}>
              {animated && (
                <animate
                  attributeName="stop-color"
                  values={`${RCB_COLORS.primary};${RCB_COLORS.orange};${RCB_COLORS.primary}`}
                  dur="4s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="50%" stopColor={RCB_COLORS.gold}>
              {animated && (
                <animate
                  attributeName="stop-color"
                  values={`${RCB_COLORS.gold};${RCB_COLORS.primary};${RCB_COLORS.gold}`}
                  dur="4s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="100%" stopColor={RCB_COLORS.darkRed}>
              {animated && (
                <animate
                  attributeName="stop-color"
                  values={`${RCB_COLORS.darkRed};${RCB_COLORS.primary};${RCB_COLORS.darkRed}`}
                  dur="4s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
          </linearGradient>

          {/* Secondary Gradient - Gold Accent */}
          <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={RCB_COLORS.gold} stopOpacity="0.9" />
            <stop offset="100%" stopColor={RCB_COLORS.orange} stopOpacity="0.9" />
          </linearGradient>

          {/* Radial Gradient for Glow */}
          <radialGradient id={gradientId3} cx="50%" cy="50%">
            <stop offset="0%" stopColor={RCB_COLORS.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={RCB_COLORS.primary} stopOpacity="0" />
          </radialGradient>

          {/* Glow Filter */}
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shadow Filter */}
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Glow Ring */}
        <motion.circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke={`url(#${gradientId1})`}
          strokeWidth="3"
          opacity="0.3"
          filter={`url(#${glowFilterId})`}
          animate={animated ? {
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Shield Background with 3D Effect */}
        <motion.g
          filter={`url(#${shadowFilterId})`}
          animate={animated ? {
            y: [0, -2, 0],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M150 30 L250 70 L250 150 C250 200 220 240 150 260 C80 240 50 200 50 150 L50 70 Z"
            fill={`url(#${gradientId1})`}
            stroke={RCB_COLORS.gold}
            strokeWidth="2"
            opacity="0.95"
          />
          {/* Inner highlight for 3D effect */}
          <path
            d="M150 30 L250 70 L250 150 C250 200 220 240 150 260 C80 240 50 200 50 150 L50 70 Z"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        </motion.g>

        {/* Crown/Coronet at Top */}
        <motion.g
          transform="translate(150, 50)"
          animate={animated ? {
            y: [0, -3, 0],
            rotate: [0, 2, 0],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M-40 -15 L-30 -5 L-20 -10 L-10 -5 L0 -15 L10 -5 L20 -10 L30 -5 L40 -15 L0 -25 Z"
            fill={`url(#${gradientId2})`}
            stroke={RCB_COLORS.secondary}
            strokeWidth="1.5"
            filter={`url(#${glowFilterId})`}
          />
          {/* Crown jewels */}
          {[-20, 0, 20].map((x, i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={-18}
              r="3"
              fill={RCB_COLORS.primary}
              animate={animated ? {
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.g>

        {/* Lion Mane - Dynamic Flowing Animation */}
        <motion.g
          transform="translate(150, 120)"
          animate={animated ? {
            rotate: [-2, 2, -2],
          } : {}}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Left Mane */}
          <motion.path
            d="M-60 -20 Q-80 -30 -85 -45 Q-90 -65 -75 -75 Q-60 -80 -45 -70 Q-30 -65 -20 -60"
            fill="none"
            stroke={`url(#${gradientId1})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
            filter={`url(#${glowFilterId})`}
            animate={animated ? {
              pathLength: [0.8, 1, 0.8],
              opacity: [0.7, 1, 0.7],
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Right Mane */}
          <motion.path
            d="M60 -20 Q80 -30 85 -45 Q90 -65 75 -75 Q60 -80 45 -70 Q30 -65 20 -60"
            fill="none"
            stroke={`url(#${gradientId1})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
            filter={`url(#${glowFilterId})`}
            animate={animated ? {
              pathLength: [0.8, 1, 0.8],
              opacity: [0.7, 1, 0.7],
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
          {/* Center Mane Flow */}
          <motion.path
            d="M-30 -10 Q-10 -15 0 -20 Q10 -15 30 -10"
            fill="none"
            stroke={RCB_COLORS.gold}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
            animate={animated ? {
              pathLength: [0, 1, 0],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Lion Face - Bold and Regal */}
        <motion.g
          transform="translate(150, 140)"
          animate={animated ? {
            y: [0, -2, 0],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Face Shape */}
          <motion.ellipse
            cx="0"
            cy="0"
            rx="45"
            ry="50"
            fill={RCB_COLORS.secondary}
            opacity="0.95"
            filter={`url(#${shadowFilterId})`}
          />

          {/* Eyes - Animated Blink */}
          <motion.g>
            {/* Left Eye */}
            <motion.ellipse
              cx="-15"
              cy="-5"
              rx="8"
              ry="10"
              fill="#FFFFFF"
              animate={animated ? {
                scaleY: [1, 0.1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx="-15"
              cy="-5"
              r="5"
              fill={RCB_COLORS.primary}
              animate={animated ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <circle cx="-15" cy="-5" r="2" fill={RCB_COLORS.secondary} />

            {/* Right Eye */}
            <motion.ellipse
              cx="15"
              cy="-5"
              rx="8"
              ry="10"
              fill="#FFFFFF"
              animate={animated ? {
                scaleY: [1, 0.1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx="15"
              cy="-5"
              r="5"
              fill={RCB_COLORS.primary}
              animate={animated ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.1,
              }}
            />
            <circle cx="15" cy="-5" r="2" fill={RCB_COLORS.secondary} />
          </motion.g>

          {/* Nose */}
          <motion.path
            d="M-5 10 Q0 15 5 10"
            fill="none"
            stroke={RCB_COLORS.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={animated ? {
              strokeWidth: [2.5, 3, 2.5],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Mouth/Chin */}
          <path
            d="M-20 25 Q0 30 20 25"
            fill="none"
            stroke={RCB_COLORS.gold}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </motion.g>

        {/* RCB Text - Bold and Dynamic */}
        <motion.g transform="translate(150, 230)">
          <motion.text
            x="0"
            y="0"
            fontSize="32"
            fontWeight="900"
            fill={`url(#${gradientId1})`}
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="4"
            filter={`url(#${glowFilterId})`}
            animate={animated ? {
              opacity: [0.9, 1, 0.9],
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            RCB
          </motion.text>
          {/* Text Shadow/Outline */}
          <text
            x="0"
            y="0"
            fontSize="32"
            fontWeight="900"
            fill="none"
            stroke={RCB_COLORS.secondary}
            strokeWidth="1"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="4"
            opacity="0.3"
          >
            RCB
          </text>
        </motion.g>

        {/* Energy Particles */}
        {showParticles && animated && (
          <>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const radius = 100;
              const x = 150 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={i % 2 === 0 ? RCB_COLORS.primary : RCB_COLORS.gold}
                  opacity="0.6"
                  animate={{
                    scale: [0.5, 1.5, 0.5],
                    opacity: [0.3, 0.8, 0.3],
                    x: [x, x + Math.cos(angle) * 10, x],
                    y: [y, y + Math.sin(angle) * 10, y],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </>
        )}
      </motion.svg>

      {/* Hover Glow Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle, ${RCB_COLORS.primary}30, transparent)`,
            filter: 'blur(30px)',
          }}
        />
      )}
    </div>
  );
}

