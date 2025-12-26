'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';

interface ModernTeamLogoProps {
  teamId: string;
  shortName?: string;
  league?: 'ipl' | 'wpl';
  size?: number;
  className?: string;
  showHover?: boolean;
  animated?: boolean;
}

export default function ModernTeamLogo({
  teamId,
  shortName,
  league,
  size = 64,
  className = '',
  showHover = true,
  animated = true,
}: ModernTeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const animatedPath = getAnimatedLogoPath(teamId, shortName, league);
  const fallbackPath = getLogoPath(teamId);

  const logoPath = imageError ? fallbackPath : animatedPath;

  // Skip if it's a Lottie JSON file
  if (logoPath.endsWith('.json')) {
    return null;
  }

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => showHover && setIsHovered(true)}
      onMouseLeave={() => showHover && setIsHovered(false)}
      whileHover={showHover && animated ? { scale: 1.1, rotate: 5 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Glow effect on hover */}
      {isHovered && showHover && (
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Logo Container with backdrop */}
      <motion.div
        className="relative w-full h-full rounded-2xl backdrop-blur-sm flex items-center justify-center"
        style={{
          background: isHovered && showHover
            ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
            : 'transparent',
          border: isHovered && showHover ? '1px solid rgba(255,255,255,0.2)' : 'none',
          boxShadow: isHovered && showHover
            ? '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)'
            : 'none',
        }}
        animate={
          animated && isHovered
            ? {
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1.05, 1.1],
              }
            : {}
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Image
          src={logoPath}
          alt={`${shortName || 'Team'} logo`}
          width={size}
          height={size}
          className="object-contain relative z-10"
          onError={() => {
            if (!imageError) {
              setImageError(true);
            }
          }}
          priority
        />
      </motion.div>

      {/* Shimmer effect on hover */}
      {isHovered && showHover && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          }}
          initial={{ x: '-100%', y: '-100%' }}
          animate={{ x: '200%', y: '200%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  );
}

