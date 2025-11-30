/**
 * WPL Color Palette
 * Centralized color system for Women's Premier League pages
 * Based on WPL_ALL_PAGES_DESIGN_RECOMMENDATIONS.md
 */

export const WPLColors = {
  // Primary Colors
  purple: '#9333EA',
  pink: '#EC4899',
  rose: '#F43F5E',
  violet: '#A855F7',
  fuchsia: '#D946EF',

  // Background Colors
  base: '#0F172A',        // Slate 950
  gradientStart: '#1E1B4B', // Indigo 950
  gradientMid: '#581C87',   // Purple 900
  gradientEnd: '#831843',   // Rose 900

  // Text Colors
  textPrimary: '#FFFFFF',   // White
  textSecondary: '#E2E8F0', // Slate 200
  textMuted: '#94A3B8',     // Slate 400
  textAccent: '#C084FC',    // Purple 300

  // RGBA variants for transparency
  purpleRGBA: {
    10: 'rgba(147, 51, 234, 0.1)',
    15: 'rgba(147, 51, 234, 0.15)',
    20: 'rgba(147, 51, 234, 0.2)',
    30: 'rgba(147, 51, 234, 0.3)',
    40: 'rgba(147, 51, 234, 0.4)',
    50: 'rgba(147, 51, 234, 0.5)',
  },
  pinkRGBA: {
    10: 'rgba(236, 72, 153, 0.1)',
    15: 'rgba(236, 72, 153, 0.15)',
    20: 'rgba(236, 72, 153, 0.2)',
    30: 'rgba(236, 72, 153, 0.3)',
    40: 'rgba(236, 72, 153, 0.4)',
    50: 'rgba(236, 72, 153, 0.5)',
  },
  roseRGBA: {
    10: 'rgba(244, 63, 94, 0.1)',
    15: 'rgba(244, 63, 94, 0.15)',
    20: 'rgba(244, 63, 94, 0.2)',
    30: 'rgba(244, 63, 94, 0.3)',
    40: 'rgba(244, 63, 94, 0.4)',
    50: 'rgba(244, 63, 94, 0.5)',
  },
  violetRGBA: {
    10: 'rgba(168, 85, 247, 0.1)',
    15: 'rgba(168, 85, 247, 0.15)',
    20: 'rgba(168, 85, 247, 0.2)',
    30: 'rgba(168, 85, 247, 0.3)',
    40: 'rgba(168, 85, 247, 0.4)',
    50: 'rgba(168, 85, 247, 0.5)',
  },
} as const;

/**
 * Get gradient string for backgrounds
 */
export const getWPLGradient = (direction: 'to-r' | 'to-b' | 'to-br' | 'to-t' = 'to-br') => {
  const gradients = {
    'to-r': `linear-gradient(to right, ${WPLColors.gradientStart}, ${WPLColors.gradientMid}, ${WPLColors.gradientEnd})`,
    'to-b': `linear-gradient(to bottom, ${WPLColors.gradientStart}, ${WPLColors.gradientMid}, ${WPLColors.gradientEnd})`,
    'to-br': `linear-gradient(135deg, ${WPLColors.gradientStart}, ${WPLColors.gradientMid}, ${WPLColors.gradientEnd})`,
    'to-t': `linear-gradient(to top, ${WPLColors.gradientEnd}, ${WPLColors.gradientMid}, ${WPLColors.gradientStart})`,
  };
  return gradients[direction];
};

/**
 * Get glassmorphism style object
 */
export const getWPLGlassmorphism = (color: 'purple' | 'pink' | 'rose' | 'violet' = 'purple', opacity: 10 | 15 | 20 = 20) => {
  const colorMap = {
    purple: WPLColors.purpleRGBA,
    pink: WPLColors.pinkRGBA,
    rose: WPLColors.roseRGBA,
    violet: WPLColors.violetRGBA,
  };

  // Map opacity to a valid lower opacity value
  const lowerOpacityMap: Record<10 | 15 | 20, 10 | 15 | 20 | 30 | 40 | 50> = {
    10: 10,
    15: 10,
    20: 10,
  };
  const lowerOpacity = lowerOpacityMap[opacity];

  return {
    background: `linear-gradient(135deg, ${colorMap[color][opacity]}, ${colorMap[color][lowerOpacity]})`,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${colorMap[color][30]}`,
    boxShadow: `0 8px 32px 0 ${colorMap[color][20]}`,
  };
};

/**
 * Get hover glow effect
 */
export const getWPLHoverGlow = (color: 'purple' | 'pink' | 'rose' | 'violet' = 'purple') => {
  const colorMap = {
    purple: WPLColors.purple,
    pink: WPLColors.pink,
    rose: WPLColors.rose,
    violet: WPLColors.violet,
  };

  return {
    boxShadow: `0 12px 40px 0 ${WPLColors[`${color}RGBA` as keyof typeof WPLColors][30]}`,
  };
};

