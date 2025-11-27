'use client';

import React, { useState } from 'react';
import SportsUP18Logo from './SportsUP18Logo';

interface SportsUP18LogoWithTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
}

export default function SportsUP18LogoWithText({
  size = 'md',
  animated = true,
  className = '',
  onClick,
  showText = false,
  textPosition = 'right',
}: SportsUP18LogoWithTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  const containerClass =
    textPosition === 'right'
      ? 'flex items-center gap-2 md:gap-3'
      : 'flex flex-col items-center gap-1 md:gap-2';

  return (
    <div
      className={`${containerClass} cursor-pointer ${className} ${animated ? 'transition-all duration-300 hover:scale-105' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <SportsUP18Logo size={size} animated={animated} />
    </div>
  );
}
