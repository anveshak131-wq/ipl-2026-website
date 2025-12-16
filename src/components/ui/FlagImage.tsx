'use client';

import React from 'react';

interface FlagImageProps {
  nationality: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: 'w-4 h-3',
  md: 'w-6 h-4', 
  lg: 'w-8 h-6',
  xl: 'w-12 h-9'
};

const FlagImage: React.FC<FlagImageProps> = ({ 
  nationality, 
  size = 'md', 
  className = '',
  alt 
}) => {
  // Map nationalities to flag file names
  const getFlagFileName = (nationality: string): string => {
    const flagMap: { [key: string]: string } = {
      'India': 'india.svg',
      'Australia': 'australia.svg',
      'England': 'england.svg',
      'South Africa': 'south-africa.svg',
      'New Zealand': 'new-zealand.svg',
      'Pakistan': 'pakistan.svg',
      'Sri Lanka': 'sri-lanka.svg',
      'West Indies': 'west-indies.svg',
      'Bangladesh': 'bangladesh.svg',
      'Afghanistan': 'afghanistan.svg',
      'Ireland': 'ireland.svg',
      'Netherlands': 'netherlands.svg',
      'Scotland': 'scotland.svg',
      'Zimbabwe': 'zimbabwe.svg',
      'Nepal': 'nepal.svg',
      'Oman': 'oman.svg',
      'UAE': 'uae.svg',
      'USA': 'usa.svg',
      'United States': 'usa.svg',
      'Canada': 'canada.svg',
      'Kenya': 'kenya.svg',
      'Namibia': 'namibia.svg',
      'Papua New Guinea': 'papua-new-guinea.svg',
      'Hong Kong': 'hong-kong.svg'
    };

    return flagMap[nationality] || 'india.svg'; // Default to India if not found
  };

  const flagFileName = getFlagFileName(nationality);
  const flagPath = `/flags/cricket/${flagFileName}`;
  const defaultAlt = `${nationality} flag`;
  
  // Handle West Indies - use a special cricket-specific flag
  if (nationality === 'West Indies') {
    return (
      <img
        src={flagPath}
        alt={alt || defaultAlt}
        className={`${sizeClasses[size]} object-cover rounded-sm ${className}`}
        title={nationality}
        onError={(e) => {
          // Fallback to India flag if West Indies flag fails to load
          const target = e.target as HTMLImageElement;
          target.src = '/flags/cricket/india.svg';
        }}
      />
    );
  }

  return (
    <img
      src={flagPath}
      alt={alt || defaultAlt}
      className={`${sizeClasses[size]} object-cover rounded-sm ${className}`}
      title={nationality}
      onError={(e) => {
        // Fallback to India flag if specific flag fails to load
        const target = e.target as HTMLImageElement;
        target.src = '/flags/cricket/india.svg';
      }}
    />
  );
};

export default FlagImage;
