'use client';

import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

export type EmojiType = 
  | 'trophy' 
  | 'cricket' 
  | 'fire' 
  | 'star' 
  | 'star-outline'
  | 'people' 
  | 'globe' 
  | 'lightning' 
  | 'calendar' 
  | 'chart' 
  | 'target'
  | 'sparkles'
  | 'party'
  | 'clock'
  | 'crown'
  | 'flag-india'
  | 'stadium'
  | 'glove'
  | 'warning'
  | 'heart'
  | 'cricket-bat'
  | 'venue'
  | 'art'
  | 'energy'
  | 'medal-gold'
  | 'medal-silver'
  | 'medal-bronze'
  | 'cricket-ball'
  | 'cricket-stumps'
  | 'bat-ball'
  | 'clap'
  | 'rocket'
  | 'wow'
  | 'thumbs-up';

interface CustomEmojiProps {
  type: EmojiType;
  size?: number | string;
  className?: string;
  animate?: boolean;
  color?: string;
  gradient?: boolean;
}

export default function CustomEmoji({ 
  type, 
  size = 20, 
  className = '', 
  animate = true,
  color,
  gradient = true
}: CustomEmojiProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  const getGradient = (colors: string[]) => {
    if (!gradient) return colors[0];
    return `linear-gradient(135deg, ${colors.join(', ')})`;
  };

  const animations = animate ? {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15 }
    },
    whileHover: { 
      scale: 1.2, 
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    }
  } : {};

  const svgProps: CSSProperties = {
    width: sizeValue,
    height: sizeValue,
    display: 'inline-block',
    verticalAlign: 'middle'
  };

  const renderIcon = () => {
    switch (type) {
      case 'trophy':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="trophy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FFD700', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#FFA500', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="trophy-glow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <motion.path
              d="M7 8C6.45 8 6 8.45 6 9V10C6 11.66 7.34 13 9 13H9.5C9.78 13.61 10.35 14 11 14H13C13.65 14 14.22 13.61 14.5 13H15C16.66 13 18 11.66 18 10V9C18 8.45 17.55 8 17 8H16V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V8H7Z"
              fill={gradient ? "url(#trophy-gradient)" : (color || "#FFD700")}
              filter="url(#trophy-glow)"
              animate={animate ? { 
                y: [0, -2, 0],
                filter: [
                  "drop-shadow(0 0 2px #FFD700)",
                  "drop-shadow(0 0 8px #FFD700)", 
                  "drop-shadow(0 0 2px #FFD700)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M10 15V19H11V21H13V19H14V15H10Z"
              fill={gradient ? "url(#trophy-gradient)" : (color || "#B8860B")}
              animate={animate ? { opacity: [1, 0.8, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M9 21H15V22C15 22.55 14.55 23 14 23H10C9.45 23 9 22.55 9 22V21Z"
              fill={gradient ? "url(#trophy-gradient)" : (color || "#8B7500")}
            />
          </svg>
        );

      case 'cricket':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="cricket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FF4444', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#CC0000', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="8"
              fill={gradient ? "url(#cricket-gradient)" : (color || "#FF4444")}
              animate={animate ? { 
                scale: [1, 1.05, 1],
                rotate: 360
              } : {}}
              transition={{ 
                scale: { duration: 1.5, repeat: Infinity },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" }
              }}
            />
            <motion.path
              d="M12 4 L12 20 M4 12 L20 12"
              stroke="white"
              strokeWidth="0.8"
              animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {animate && (
              <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke={color || "#FF4444"}
                strokeWidth="0.5"
                fill="none"
                opacity="0.3"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </svg>
        );

      case 'fire':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="fire-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#FF6B00', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FF0000', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M12 2C11.5 7 8 8 8 13C8 16.31 9.79 19 12 19C14.21 19 16 16.31 16 13C16 8 12.5 7 12 2Z"
              fill={gradient ? "url(#fire-gradient)" : (color || "#FF6B00")}
              animate={animate ? { 
                scaleY: [1, 1.1, 1],
                scaleX: [1, 0.95, 1]
              } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M12 8C11.5 11 10 12 10 14C10 15.66 10.9 17 12 17C13.1 17 14 15.66 14 14C14 12 12.5 11 12 8Z"
              fill="#FFD700"
              animate={animate ? { 
                scale: [1, 1.15, 1],
                opacity: [0.8, 1, 0.8]
              } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </svg>
        );

      case 'star':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FFD700', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#FFA500', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="star-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <motion.path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill={gradient ? "url(#star-gradient)" : (color || "#FFD700")}
              filter="url(#star-glow)"
              animate={animate ? { 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              } : {}}
              transition={{ 
                scale: { duration: 1.5, repeat: Infinity },
                rotate: { duration: 3, repeat: Infinity, ease: "linear" }
              }}
            />
          </svg>
        );

      case 'star-outline':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <motion.path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke={color || "#FFD700"}
              strokeWidth="2"
              fill="none"
              animate={animate ? { 
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        );

      case 'people':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="people-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#60A5FA', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#3B82F6', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="9"
              cy="6"
              r="2.5"
              fill={gradient ? "url(#people-gradient)" : (color || "#60A5FA")}
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="15"
              cy="6"
              r="2.5"
              fill={gradient ? "url(#people-gradient)" : (color || "#60A5FA")}
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.path
              d="M9 11C6.5 11 4.5 12.5 4.5 14.5V17H13.5V14.5C13.5 12.5 11.5 11 9 11Z"
              fill={gradient ? "url(#people-gradient)" : (color || "#60A5FA")}
              animate={animate ? { y: [0, -1, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M15 11C12.5 11 10.5 12.5 10.5 14.5V17H19.5V14.5C19.5 12.5 17.5 11 15 11Z"
              fill={gradient ? "url(#people-gradient)" : (color || "#3B82F6")}
              animate={animate ? { y: [0, -1, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </svg>
        );

      case 'globe':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="globe-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#10B981', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#059669', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="9"
              fill={gradient ? "url(#globe-gradient)" : (color || "#10B981")}
              animate={animate ? { rotate: 360 } : {}}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.path
              d="M12 3 L12 21 M3 12 L21 12 M7 7 Q12 10 17 7 M7 17 Q12 14 17 17"
              stroke="white"
              strokeWidth="1"
              opacity="0.6"
              animate={animate ? { opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </svg>
        );

      case 'lightning':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FBBF24', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#F59E0B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill={gradient ? "url(#lightning-gradient)" : (color || "#FBBF24")}
              animate={animate ? { 
                scale: [1, 1.1, 1],
                filter: [
                  "drop-shadow(0 0 2px #FBBF24)",
                  "drop-shadow(0 0 8px #FBBF24)",
                  "drop-shadow(0 0 2px #FBBF24)"
                ]
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </svg>
        );

      case 'calendar':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="calendar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#8B5CF6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#7C3AED', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.rect
              x="4"
              y="5"
              width="16"
              height="16"
              rx="2"
              fill={gradient ? "url(#calendar-gradient)" : (color || "#8B5CF6")}
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.rect x="4" y="5" width="16" height="4" fill="#6D28D9" />
            <motion.line x1="9" y1="3" x2="9" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <motion.line x1="15" y1="3" x2="15" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <motion.path
              d="M7 12H9M7 15H9M11 12H13M11 15H13M15 12H17M15 15H17"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        );

      case 'chart':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#06B6D4', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#0891B2', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.rect
              x="6"
              y="12"
              width="3"
              height="8"
              rx="1"
              fill={gradient ? "url(#chart-gradient)" : (color || "#06B6D4")}
              animate={animate ? { scaleY: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.rect
              x="11"
              y="8"
              width="3"
              height="12"
              rx="1"
              fill={gradient ? "url(#chart-gradient)" : (color || "#06B6D4")}
              animate={animate ? { scaleY: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.rect
              x="16"
              y="4"
              width="3"
              height="16"
              rx="1"
              fill={gradient ? "url(#chart-gradient)" : (color || "#06B6D4")}
              animate={animate ? { scaleY: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </svg>
        );

      case 'target':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="target-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#EF4444', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#DC2626', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="9"
              stroke={gradient ? "url(#target-gradient)" : (color || "#EF4444")}
              strokeWidth="1.5"
              fill="none"
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="6"
              stroke={gradient ? "url(#target-gradient)" : (color || "#EF4444")}
              strokeWidth="1.5"
              fill="none"
              animate={animate ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="3"
              fill={gradient ? "url(#target-gradient)" : (color || "#EF4444")}
              animate={animate ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </svg>
        );

      case 'sparkles':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <motion.path
              d="M12 2L13 7L18 8L13 9L12 14L11 9L6 8L11 7L12 2Z"
              fill={color || "#FFD700"}
              animate={animate ? { 
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
                opacity: [1, 0.6, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M18 14L18.5 16.5L21 17L18.5 17.5L18 20L17.5 17.5L15 17L17.5 16.5L18 14Z"
              fill={color || "#FFA500"}
              animate={animate ? { 
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.path
              d="M6 16L6.5 18.5L9 19L6.5 19.5L6 22L5.5 19.5L3 19L5.5 18.5L6 16Z"
              fill={color || "#FF6B00"}
              animate={animate ? { 
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
          </svg>
        );

      case 'party':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            {[...Array(8)].map((_, i) => (
              <motion.circle
                key={i}
                cx="12"
                cy="12"
                r="2"
                fill={['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F'][i % 4]}
                animate={animate ? {
                  x: [0, Math.cos(i * Math.PI / 4) * 8, 0],
                  y: [0, Math.sin(i * Math.PI / 4) * 8, 0],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </svg>
        );

      case 'clock':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="clock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#60A5FA', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#3B82F6', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="9"
              stroke={gradient ? "url(#clock-gradient)" : (color || "#60A5FA")}
              strokeWidth="2"
              fill="none"
            />
            <motion.path
              d="M12 6V12L16 14"
              stroke={gradient ? "url(#clock-gradient)" : (color || "#60A5FA")}
              strokeWidth="2"
              strokeLinecap="round"
              animate={animate ? { rotate: 360 } : {}}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '12px 12px' }}
            />
          </svg>
        );

      case 'crown':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="crown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FFD700', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#FFA500', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M2 18L5 9L9 13L12 6L15 13L19 9L22 18H2Z"
              fill={gradient ? "url(#crown-gradient)" : (color || "#FFD700")}
              animate={animate ? { 
                y: [0, -3, 0],
                filter: [
                  "drop-shadow(0 0 4px #FFD700)",
                  "drop-shadow(0 0 12px #FFD700)",
                  "drop-shadow(0 0 4px #FFD700)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle cx="5" cy="9" r="1.5" fill="#FFF" />
            <motion.circle cx="12" cy="6" r="1.5" fill="#FFF" />
            <motion.circle cx="19" cy="9" r="1.5" fill="#FFF" />
          </svg>
        );

      case 'flag-india':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <motion.rect x="6" y="4" width="14" height="4" fill="#FF9933" />
            <motion.rect x="6" y="8" width="14" height="4" fill="#FFFFFF" />
            <motion.rect x="6" y="12" width="14" height="4" fill="#138808" />
            <motion.circle cx="13" cy="10" r="2" stroke="#000080" strokeWidth="0.5" fill="none" />
            <motion.line x1="5" y1="4" x2="5" y2="20" stroke="#8B4513" strokeWidth="1" />
            {animate && (
              <motion.path
                d="M6 4L20 4L20 16L6 16"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
                fill="none"
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}
          </svg>
        );

      case 'stadium':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="stadium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#A855F7', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#7C3AED', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.ellipse
              cx="12"
              cy="16"
              rx="9"
              ry="3"
              fill={gradient ? "url(#stadium-gradient)" : (color || "#A855F7")}
              opacity="0.3"
            />
            <motion.path
              d="M5 10C5 7 8 4 12 4C16 4 19 7 19 10V16H5V10Z"
              stroke={gradient ? "url(#stadium-gradient)" : (color || "#A855F7")}
              strokeWidth="2"
              fill="none"
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.path
              d="M8 10V16 M12 7V16 M16 10V16"
              stroke={gradient ? "url(#stadium-gradient)" : (color || "#A855F7")}
              strokeWidth="1.5"
              opacity="0.5"
            />
          </svg>
        );

      case 'glove':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="glove-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#F59E0B', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#D97706', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M8 4C6 4 4 6 4 8V14C4 16 6 18 8 18H10V14C10 12 12 10 14 10V6C14 4 12 4 10 4H8Z"
              fill={gradient ? "url(#glove-gradient)" : (color || "#F59E0B")}
              animate={animate ? { 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M14 6V10H16V8C16 6 15 6 14 6Z"
              fill={gradient ? "url(#glove-gradient)" : (color || "#D97706")}
            />
            <motion.circle
              cx="8"
              cy="10"
              r="1.5"
              fill="#8B4513"
              animate={animate ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </svg>
        );

      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="warning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FBBF24', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#F59E0B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M12 2L22 20H2L12 2Z"
              fill={gradient ? "url(#warning-gradient)" : (color || "#FBBF24")}
              animate={animate ? { 
                scale: [1, 1.05, 1],
                filter: [
                  "drop-shadow(0 0 2px #FBBF24)",
                  "drop-shadow(0 0 8px #FBBF24)",
                  "drop-shadow(0 0 2px #FBBF24)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="12"
              cy="15"
              r="1.5"
              fill="#FFFFFF"
              animate={animate ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.rect
              x="11"
              y="9"
              width="2"
              height="4"
              rx="1"
              fill="#FFFFFF"
              animate={animate ? { scaleY: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'heart':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#EF4444', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#DC2626', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={gradient ? "url(#heart-gradient)" : (color || "#EF4444")}
              animate={animate ? { 
                scale: [1, 1.1, 1],
                filter: [
                  "drop-shadow(0 0 2px #EF4444)",
                  "drop-shadow(0 0 8px #EF4444)",
                  "drop-shadow(0 0 2px #EF4444)"
                ]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'cricket-bat':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="cricket-bat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#8B4513', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#654321', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M18 2L20 4L16 8L14 6L18 2Z"
              fill={gradient ? "url(#cricket-bat-gradient)" : (color || "#8B4513")}
              animate={animate ? { rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M14 6L16 8L8 16L6 14L14 6Z"
              fill={gradient ? "url(#cricket-bat-gradient)" : (color || "#8B4513")}
            />
            <motion.path
              d="M6 14L8 16L4 20L2 18L6 14Z"
              fill={gradient ? "url(#cricket-bat-gradient)" : (color || "#654321")}
            />
            <motion.circle
              cx="5"
              cy="19"
              r="1.5"
              fill="#FFD700"
              animate={animate ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'venue':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="venue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#10B981', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#059669', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.ellipse
              cx="12"
              cy="18"
              rx="10"
              ry="4"
              fill={gradient ? "url(#venue-gradient)" : (color || "#10B981")}
              opacity="0.2"
            />
            <motion.path
              d="M6 8C6 5 8 3 12 3C16 3 18 5 18 8V18H6V8Z"
              stroke={gradient ? "url(#venue-gradient)" : (color || "#10B981")}
              strokeWidth="2"
              fill="none"
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.path
              d="M9 8V18 M12 5V18 M15 8V18"
              stroke={gradient ? "url(#venue-gradient)" : (color || "#10B981")}
              strokeWidth="1.5"
              opacity="0.6"
            />
            <motion.circle
              cx="12"
              cy="11"
              r="2"
              fill={gradient ? "url(#venue-gradient)" : (color || "#10B981")}
              opacity="0.3"
              animate={animate ? { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        );

      case 'art':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="art-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#A855F7', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#7C3AED', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M12 2L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9L12 2Z"
              fill={gradient ? "url(#art-gradient)" : (color || "#A855F7")}
              animate={animate ? { 
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="3"
              fill="#FFFFFF"
              opacity="0.3"
              animate={animate ? { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        );

      case 'energy':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="energy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color || '#FBBF24', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: color || '#F59E0B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill={gradient ? "url(#energy-gradient)" : (color || "#FBBF24")}
              animate={animate ? { 
                scale: [1, 1.15, 1],
                filter: [
                  "drop-shadow(0 0 2px #FBBF24)",
                  "drop-shadow(0 0 12px #FBBF24)",
                  "drop-shadow(0 0 2px #FBBF24)"
                ]
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {animate && (
              <>
                <motion.circle
                  cx="13"
                  cy="8"
                  r="2"
                  fill="#FBBF24"
                  opacity="0.6"
                  animate={{ scale: [0, 2, 0], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.circle
                  cx="17"
                  cy="12"
                  r="1.5"
                  fill="#F59E0B"
                  opacity="0.5"
                  animate={{ scale: [0, 1.5, 0], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </svg>
        );

      case 'medal-gold':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="medal-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
              </linearGradient>
              <radialGradient id="medal-gold-shine" cx="50%" cy="30%">
                <stop offset="0%" style={{ stopColor: '#FFF', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#FFF', stopOpacity: 0 }} />
              </radialGradient>
              <filter id="medal-gold-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-gold-gradient)"
              filter="url(#medal-gold-glow)"
              animate={animate ? { 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-gold-shine)"
              opacity="0.6"
            />
            <motion.text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#FFF"
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              1
            </motion.text>
            <motion.path
              d="M12 4L13.5 8.5L18 9.5L14.5 12.5L15 17L12 15L9 17L9.5 12.5L6 9.5L10.5 8.5L12 4Z"
              fill="#FFF"
              opacity="0.3"
              animate={animate ? { rotate: [0, 360] } : {}}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        );

      case 'medal-silver':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="medal-silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#808080', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#606060', stopOpacity: 1 }} />
              </linearGradient>
              <radialGradient id="medal-silver-shine" cx="50%" cy="30%">
                <stop offset="0%" style={{ stopColor: '#FFF', stopOpacity: 0.7 }} />
                <stop offset="100%" style={{ stopColor: '#FFF', stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-silver-gradient)"
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-silver-shine)"
              opacity="0.5"
            />
            <motion.text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#FFF"
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              2
            </motion.text>
          </svg>
        );

      case 'medal-bronze':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="medal-bronze-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
              </linearGradient>
              <radialGradient id="medal-bronze-shine" cx="50%" cy="30%">
                <stop offset="0%" style={{ stopColor: '#FFF', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#FFF', stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-bronze-gradient)"
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#medal-bronze-shine)"
              opacity="0.4"
            />
            <motion.text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#FFF"
              animate={animate ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              3
            </motion.text>
          </svg>
        );

      case 'cricket-ball':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="cricket-ball-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#3E2723', stopOpacity: 1 }} />
              </linearGradient>
              <radialGradient id="cricket-ball-shine" cx="30%" cy="30%">
                <stop offset="0%" style={{ stopColor: '#D4A574', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#cricket-ball-gradient)"
              animate={animate ? { 
                rotate: [0, 360],
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#cricket-ball-shine)"
            />
            <motion.path
              d="M6 8 Q8 6 10 8 Q12 6 14 8 Q16 6 18 8"
              stroke="#654321"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
              animate={animate ? { pathLength: [0, 1, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M6 16 Q8 18 10 16 Q12 18 14 16 Q16 18 18 16"
              stroke="#654321"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
              animate={animate ? { pathLength: [0, 1, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </svg>
        );

      case 'cricket-stumps':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="stumps-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.rect
              x="10"
              y="4"
              width="1.5"
              height="16"
              rx="0.75"
              fill="url(#stumps-gradient)"
              animate={animate ? { y: [4, 3, 4] } : {}}
              transition={{ duration: 0.1, repeat: Infinity }}
            />
            <motion.rect
              x="11.25"
              y="4"
              width="1.5"
              height="16"
              rx="0.75"
              fill="url(#stumps-gradient)"
              animate={animate ? { y: [4, 3, 4] } : {}}
              transition={{ duration: 0.1, repeat: Infinity, delay: 0.05 }}
            />
            <motion.rect
              x="12.5"
              y="4"
              width="1.5"
              height="16"
              rx="0.75"
              fill="url(#stumps-gradient)"
              animate={animate ? { y: [4, 3, 4] } : {}}
              transition={{ duration: 0.1, repeat: Infinity, delay: 0.1 }}
            />
            <motion.rect
              x="8"
              y="3"
              width="8"
              height="1"
              rx="0.5"
              fill="#D4A574"
              opacity="0.8"
            />
            <motion.rect
              x="8"
              y="18"
              width="8"
              height="2"
              rx="1"
              fill="#654321"
            />
          </svg>
        );

      case 'bat-ball':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="bat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M4 8 L18 4 L20 6 L6 10 Z"
              fill="url(#bat-gradient)"
              animate={animate ? { rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: '12px 7px' }}
            />
            <motion.circle
              cx="18"
              cy="5"
              r="3"
              fill="#8B4513"
              animate={animate ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 360]
              } : {}}
              transition={{ 
                scale: { duration: 1.5, repeat: Infinity },
                rotate: { duration: 2, repeat: Infinity, ease: "linear" }
              }}
            />
            <motion.path
              d="M17 4.5 L19 5.5 M18.5 3.5 L18.5 6.5"
              stroke="#654321"
              strokeWidth="0.5"
              opacity="0.6"
            />
          </svg>
        );

      case 'clap':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="clap-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            {[...Array(6)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${8 + i * 1.5} ${10 + Math.sin(i) * 2} L${9 + i * 1.5} ${14 + Math.sin(i) * 2} L${7 + i * 1.5} ${14 + Math.sin(i) * 2} Z`}
                fill="url(#clap-gradient)"
                animate={animate ? {
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                  y: [0, -2, 0]
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </svg>
        );

      case 'rocket':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="rocket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FF6B6B', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#FF8E53', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FF6B6B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M12 2 L14 8 L20 10 L14 12 L12 18 L10 12 L4 10 L10 8 Z"
              fill="url(#rocket-gradient)"
              animate={animate ? {
                y: [0, -5, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {animate && (
              <>
                <motion.circle
                  cx="12"
                  cy="20"
                  r="2"
                  fill="#FFD700"
                  opacity="0.8"
                  animate={{ scale: [0, 2, 0], opacity: [0.8, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.circle
                  cx="12"
                  cy="20"
                  r="1"
                  fill="#FF6B6B"
                  opacity="0.6"
                  animate={{ scale: [0, 1.5, 0], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </svg>
        );

      case 'wow':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="wow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="url(#wow-gradient)"
              animate={animate ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="9"
              cy="10"
              r="2"
              fill="#FFF"
              animate={animate ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.circle
              cx="15"
              cy="10"
              r="2"
              fill="#FFF"
              animate={animate ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.ellipse
              cx="12"
              cy="16"
              rx="3"
              ry="2"
              fill="none"
              stroke="#FFF"
              strokeWidth="2"
              animate={animate ? { scaleX: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </svg>
        );

      case 'thumbs-up':
        return (
          <svg viewBox="0 0 24 24" fill="none" style={svgProps} className={className}>
            <defs>
              <linearGradient id="thumbs-up-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4ECDC4', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#44A08D', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M7 10V20C7 21.1 7.9 22 9 22H16C17.1 22 18 21.1 18 20V12L14 8H12C11.45 8 11 8.45 11 9V10H7Z"
              fill="url(#thumbs-up-gradient)"
              animate={animate ? { 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ transformOrigin: '12px 15px' }}
            />
            <motion.path
              d="M5 10H7V20H5C4.45 20 4 19.55 4 19V11C4 10.45 4.45 10 5 10Z"
              fill="url(#thumbs-up-gradient)"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <motion.span 
      className={`inline-flex items-center justify-center ${className}`}
      {...animations}
      style={{ display: 'inline-flex', verticalAlign: 'middle' }}
    >
      {renderIcon()}
    </motion.span>
  );
}
