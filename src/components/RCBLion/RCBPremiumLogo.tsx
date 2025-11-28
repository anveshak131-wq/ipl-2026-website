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
  maneGold: '#FFA500',
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
  const gradientId4 = `rcb-gradient-4-${uniqueId.current}`;
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
        viewBox="0 0 400 400"
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

          {/* Mane Gradient */}
          <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={RCB_COLORS.gold} stopOpacity="0.95" />
            <stop offset="50%" stopColor={RCB_COLORS.maneGold} stopOpacity="0.9" />
            <stop offset="100%" stopColor={RCB_COLORS.orange} stopOpacity="0.85" />
          </linearGradient>

          {/* Body Gradient */}
          <linearGradient id={gradientId3} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={RCB_COLORS.primary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={RCB_COLORS.darkRed} stopOpacity="0.95" />
          </linearGradient>

          {/* Glow Gradient */}
          <radialGradient id={gradientId4} cx="50%" cy="50%">
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

        {/* Shield Background */}
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
            d="M200 40 L320 80 L320 200 C320 260 280 300 200 320 C120 300 80 260 80 200 L80 80 Z"
            fill={`url(#${gradientId1})`}
            stroke={RCB_COLORS.gold}
            strokeWidth="2.5"
            opacity="0.95"
          />
        </motion.g>

        {/* Crown at Top */}
        <motion.g
          transform="translate(200, 60)"
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
            d="M-50 -20 L-40 -8 L-25 -15 L-15 -8 L0 -20 L15 -8 L25 -15 L40 -8 L50 -20 L0 -30 Z"
            fill={`url(#${gradientId2})`}
            stroke={RCB_COLORS.secondary}
            strokeWidth="2"
            filter={`url(#${glowFilterId})`}
          />
          {[-30, 0, 30].map((x, i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={-23}
              r="4"
              fill={RCB_COLORS.primary}
              animate={animated ? {
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.3, 1],
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

        {/* Full Lion Body - Fierce and Powerful */}
        <motion.g
          transform="translate(200, 200)"
          animate={animated ? {
            y: [0, -3, 0],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Lion Mane - Flowing and Dynamic */}
          <motion.g
            animate={animated ? {
              rotate: [-3, 3, -3],
            } : {}}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Left Side Mane - Multiple Layers */}
            <path
              d="M-80 -40 Q-100 -50 -110 -70 Q-115 -90 -100 -110 Q-85 -120 -70 -110 Q-55 -105 -45 -100 Q-35 -95 -25 -90"
              fill="none"
              stroke={`url(#${gradientId2})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
              filter={`url(#${glowFilterId})`}
            />
            <path
              d="M-70 -30 Q-90 -40 -100 -60 Q-105 -80 -90 -100 Q-75 -110 -60 -100 Q-45 -95 -35 -90 Q-25 -85 -15 -80"
              fill="none"
              stroke={`url(#${gradientId2})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <path
              d="M-60 -20 Q-80 -30 -90 -50 Q-95 -70 -80 -90 Q-65 -100 -50 -90 Q-35 -85 -25 -80"
              fill="none"
              stroke={RCB_COLORS.gold}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Right Side Mane - Multiple Layers */}
            <path
              d="M80 -40 Q100 -50 110 -70 Q115 -90 100 -110 Q85 -120 70 -110 Q55 -105 45 -100 Q35 -95 25 -90"
              fill="none"
              stroke={`url(#${gradientId2})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
              filter={`url(#${glowFilterId})`}
            />
            <path
              d="M70 -30 Q90 -40 100 -60 Q105 -80 90 -100 Q75 -110 60 -100 Q45 -95 35 -90 Q25 -85 15 -80"
              fill="none"
              stroke={`url(#${gradientId2})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <path
              d="M60 -20 Q80 -30 90 -50 Q95 -70 80 -90 Q65 -100 50 -90 Q35 -85 25 -80"
              fill="none"
              stroke={RCB_COLORS.gold}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Top Mane Flow */}
            <path
              d="M-40 -30 Q-20 -35 0 -40 Q20 -35 40 -30"
              fill="none"
              stroke={RCB_COLORS.gold}
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.9"
            />
          </motion.g>

          {/* Lion Head - Fierce and Bold */}
          <motion.g>
            {/* Head Shape */}
            <ellipse
              cx="0"
              cy="-20"
              rx="55"
              ry="60"
              fill={RCB_COLORS.secondary}
              opacity="0.98"
              filter={`url(#${shadowFilterId})`}
            />

            {/* Fierce Eyes */}
            <motion.g>
              {/* Left Eye */}
              <motion.ellipse
                cx="-18"
                cy="-25"
                rx="10"
                ry="12"
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
                cx="-18"
                cy="-25"
                r="6"
                fill={RCB_COLORS.primary}
                animate={animated ? {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <circle cx="-18" cy="-25" r="2.5" fill={RCB_COLORS.secondary} />
              {/* Eye Glow */}
              <circle cx="-18" cy="-25" r="8" fill={RCB_COLORS.primary} opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Right Eye */}
              <motion.ellipse
                cx="18"
                cy="-25"
                rx="10"
                ry="12"
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
                cx="18"
                cy="-25"
                r="6"
                fill={RCB_COLORS.primary}
                animate={animated ? {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.1,
                }}
              />
              <circle cx="18" cy="-25" r="2.5" fill={RCB_COLORS.secondary} />
              {/* Eye Glow */}
              <circle cx="18" cy="-25" r="8" fill={RCB_COLORS.primary} opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.1s" />
              </circle>
            </motion.g>

            {/* Nose - Bold */}
            <path
              d="M-6 5 Q0 12 6 5"
              fill="none"
              stroke={RCB_COLORS.gold}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Mouth - Roaring Expression */}
            <path
              d="M-25 15 Q0 25 25 15 Q20 35 0 30 Q-20 35 -25 15"
              fill={RCB_COLORS.primary}
              opacity="0.9"
            />
            <path
              d="M-20 20 Q0 28 20 20"
              fill="none"
              stroke={RCB_COLORS.gold}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Whiskers */}
            <g stroke={RCB_COLORS.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
              <line x1="-35" y1="-5" x2="-50" y2="-8" />
              <line x1="-35" y1="0" x2="-50" y2="0" />
              <line x1="-35" y1="5" x2="-50" y2="8" />
              <line x1="35" y1="-5" x2="50" y2="-8" />
              <line x1="35" y1="0" x2="50" y2="0" />
              <line x1="35" y1="5" x2="50" y2="8" />
            </g>
          </motion.g>

          {/* Lion Body - Powerful and Muscular */}
          <motion.g>
            {/* Chest and Front Body */}
            <ellipse
              cx="0"
              cy="40"
              rx="45"
              ry="50"
              fill={`url(#${gradientId3})`}
              opacity="0.95"
              filter={`url(#${shadowFilterId})`}
            />

            {/* Front Legs */}
            <path
              d="M-30 50 L-35 90 L-25 90 Z"
              fill={RCB_COLORS.secondary}
              opacity="0.9"
            />
            <path
              d="M30 50 L35 90 L25 90 Z"
              fill={RCB_COLORS.secondary}
              opacity="0.9"
            />

            {/* Back Body */}
            <ellipse
              cx="0"
              cy="80"
              rx="40"
              ry="45"
              fill={`url(#${gradientId3})`}
              opacity="0.9"
            />

            {/* Hind Legs */}
            <path
              d="M-25 85 L-30 120 L-20 120 Z"
              fill={RCB_COLORS.secondary}
              opacity="0.9"
            />
            <path
              d="M25 85 L30 120 L20 120 Z"
              fill={RCB_COLORS.secondary}
              opacity="0.9"
            />

            {/* Tail - Curved and Dynamic */}
            <motion.path
              d="M25 75 Q50 60 60 40 Q65 25 55 15"
              fill="none"
              stroke={`url(#${gradientId2})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              filter={`url(#${glowFilterId})`}
              animate={animated ? {
                pathLength: [0.8, 1, 0.8],
                opacity: [0.8, 1, 0.8],
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Tail Tuft */}
            <circle cx="55" cy="15" r="6" fill={RCB_COLORS.gold} opacity="0.9" />
          </motion.g>
        </motion.g>

        {/* RCB Text - Bold and Dynamic */}
        <motion.g transform="translate(200, 340)">
          <motion.text
            x="0"
            y="0"
            fontSize="36"
            fontWeight="900"
            fill={`url(#${gradientId1})`}
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="5"
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
            fontSize="36"
            fontWeight="900"
            fill="none"
            stroke={RCB_COLORS.secondary}
            strokeWidth="1.5"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="5"
            opacity="0.4"
          >
            RCB
          </text>
        </motion.g>

        {/* Energy Particles */}
        {showParticles && animated && (
          <>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const radius = 140;
              const x = 200 + Math.cos(angle) * radius;
              const y = 200 + Math.sin(angle) * radius;
              
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={i % 2 === 0 ? RCB_COLORS.primary : RCB_COLORS.gold}
                  opacity="0.6"
                  animate={{
                    scale: [0.5, 1.8, 0.5],
                    opacity: [0.3, 0.9, 0.3],
                    x: [x, x + Math.cos(angle) * 15, x],
                    y: [y, y + Math.sin(angle) * 15, y],
                  }}
                  transition={{
                    duration: 2.5 + Math.random(),
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
