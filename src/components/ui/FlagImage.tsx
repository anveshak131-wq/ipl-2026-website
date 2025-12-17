'use client';

import React from 'react';

interface FlagImageProps {
  nationality: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

// NOTE: This component now renders Unicode emoji flags instead of SVG images.
// The older `/public/flags/cricket/*.svg` assets are no longer used by this
// component and can be considered deprecated.

const sizeClasses: Record<NonNullable<FlagImageProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl'
};

const nationalityToEmoji: { [key: string]: string } = {
  India: '🇮🇳',
  Australia: '🇦🇺',
  // Use GB flag for broad support; England regional flag often renders as plain black on many platforms.
  England: '🇬🇧',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Sri Lanka': '🇱🇰',
  // No official emoji for West Indies; use tropical island to reflect the team identity.
  'West Indies': '🏝️',
  Bangladesh: '🇧🇩',
  Afghanistan: '🇦🇫',
  Ireland: '🇮🇪',
  Netherlands: '🇳🇱',
  Scotland: '🏴', // Saltire flag support varies; use basic flag emoji
  Zimbabwe: '🇿🇼',
  Nepal: '🇳🇵',
  Oman: '🇴🇲',
  UAE: '🇦🇪',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Kenya: '🇰🇪',
  Namibia: '🇳🇦',
  'Papua New Guinea': '🇵🇬',
  'Hong Kong': '🇭🇰'
};

const FlagImage: React.FC<FlagImageProps> = ({
  nationality,
  size = 'md',
  className = '',
  alt
}) => {
  // For IPL/WPL, Pakistan is banned – do not render any flag or label for it.
  if (nationality === 'Pakistan') {
    return null;
  }

  const emoji = nationalityToEmoji[nationality] || '🌐';
  const defaultAlt = `${nationality || 'Unknown'} flag`;

  return (
    <span
      role="img"
      aria-label={alt || defaultAlt}
      title={nationality}
      className={`${sizeClasses[size]} inline-block align-middle ${className}`}
    >
      {emoji}
    </span>
  );
};

export default FlagImage;
