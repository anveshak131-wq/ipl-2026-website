/**
 * WPL Color Palette
 * Centralized color system for Women's Premier League pages
 * Based on WPL_ALL_PAGES_DESIGN_RECOMMENDATIONS.md
 */

export const WPLColors = {
  // Enhanced Primary Colors - High Contrast Modern Sports Palette
  primary: '#FF6B35',      // Vibrant Orange - High Energy
  secondary: '#004E89',    // Deep Blue - Professional
  accent: '#FFD700',       // Gold - Championship
  success: '#00C896',      // Emerald Green - Victory
  warning: '#FFB800',      // Amber - Alert
  danger: '#FF4757',       // Coral Red - Intensity
  
  // Team-Specific Colors - Enhanced Visibility
  purple: '#8B5CF6',       // RCB Purple - Enhanced
  pink: '#EC4899',         // Bright Pink - High Contrast
  rose: '#F43F5E',         // Rose Red - Vibrant
  violet: '#7C3AED',       // Deep Violet - Rich
  fuchsia: '#D946EF',      // Fuchsia - Bold
  orange: '#FB923C',       // Orange - Warm
  blue: '#3B82F6',         // Blue - Clear
  green: '#10B981',        // Green - Fresh

  // Enhanced Background Colors - Better Contrast
  base: '#0A0E27',          // Deep Navy - Professional
  gradientStart: '#1A1F3A', // Dark Blue-Gray
  gradientMid: '#2D3561',   // Medium Blue
  gradientEnd: '#1E293B',   // Slate Dark
  surface: '#1E293B',       // Surface Dark
  card: '#334155',          // Card Background

  // Enhanced Text Colors - Maximum Readability
  textPrimary: '#FFFFFF',    // Pure White
  textSecondary: '#F1F5F9',  // Light Slate
  textMuted: '#CBD5E1',      // Muted Light
  textAccent: '#FBBF24',     // Accent Yellow
  textInverse: '#0F172A',     // Dark Text

  // Status Colors - Clear Indicators
  win: '#10B981',           // Victory Green
  loss: '#EF4444',          // Defeat Red
  draw: '#F59E0B',          // Draw Yellow
  active: '#22D3EE',        // Active Cyan

  // Enhanced RGBA variants for transparency
  purpleRGBA: {
    10: 'rgba(139, 92, 246, 0.1)',
    15: 'rgba(139, 92, 246, 0.15)',
    20: 'rgba(139, 92, 246, 0.2)',
    30: 'rgba(139, 92, 246, 0.3)',
    40: 'rgba(139, 92, 246, 0.4)',
    50: 'rgba(139, 92, 246, 0.5)',
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
    10: 'rgba(124, 58, 237, 0.1)',
    15: 'rgba(124, 58, 237, 0.15)',
    20: 'rgba(124, 58, 237, 0.2)',
    30: 'rgba(124, 58, 237, 0.3)',
    40: 'rgba(124, 58, 237, 0.4)',
    50: 'rgba(124, 58, 237, 0.5)',
  },
  orangeRGBA: {
    10: 'rgba(251, 146, 60, 0.1)',
    15: 'rgba(251, 146, 60, 0.15)',
    20: 'rgba(251, 146, 60, 0.2)',
    30: 'rgba(251, 146, 60, 0.3)',
    40: 'rgba(251, 146, 60, 0.4)',
    50: 'rgba(251, 146, 60, 0.5)',
  },
  blueRGBA: {
    10: 'rgba(59, 130, 246, 0.1)',
    15: 'rgba(59, 130, 246, 0.15)',
    20: 'rgba(59, 130, 246, 0.2)',
    30: 'rgba(59, 130, 246, 0.3)',
    40: 'rgba(59, 130, 246, 0.4)',
    50: 'rgba(59, 130, 246, 0.5)',
  },
  greenRGBA: {
    10: 'rgba(16, 185, 129, 0.1)',
    15: 'rgba(16, 185, 129, 0.15)',
    20: 'rgba(16, 185, 129, 0.2)',
    30: 'rgba(16, 185, 129, 0.3)',
    40: 'rgba(16, 185, 129, 0.4)',
    50: 'rgba(16, 185, 129, 0.5)',
  },
  primaryRGBA: {
    10: 'rgba(255, 107, 53, 0.1)',
    15: 'rgba(255, 107, 53, 0.15)',
    20: 'rgba(255, 107, 53, 0.2)',
    30: 'rgba(255, 107, 53, 0.3)',
    40: 'rgba(255, 107, 53, 0.4)',
    50: 'rgba(255, 107, 53, 0.5)',
  },
  secondaryRGBA: {
    10: 'rgba(0, 78, 137, 0.1)',
    15: 'rgba(0, 78, 137, 0.15)',
    20: 'rgba(0, 78, 137, 0.2)',
    30: 'rgba(0, 78, 137, 0.3)',
    40: 'rgba(0, 78, 137, 0.4)',
    50: 'rgba(0, 78, 137, 0.5)',
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
 * Get glassmorphism style object - Enhanced with new colors
 */
export const getWPLGlassmorphism = (color: 'purple' | 'pink' | 'rose' | 'violet' | 'orange' | 'blue' | 'green' | 'primary' | 'secondary' = 'purple', opacity: 10 | 15 | 20 = 20) => {
  const colorMap = {
    purple: WPLColors.purpleRGBA,
    pink: WPLColors.pinkRGBA,
    rose: WPLColors.roseRGBA,
    violet: WPLColors.violetRGBA,
    orange: WPLColors.orangeRGBA,
    blue: WPLColors.blueRGBA,
    green: WPLColors.greenRGBA,
    primary: WPLColors.primaryRGBA,
    secondary: WPLColors.secondaryRGBA,
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
 * Get hover glow style object - Enhanced with new colors
 */
export const getWPLHoverGlow = (color: 'purple' | 'pink' | 'rose' | 'violet' | 'orange' | 'blue' | 'green' | 'primary' | 'secondary' = 'purple') => {
  const colorMap = {
    purple: WPLColors.purpleRGBA,
    pink: WPLColors.pinkRGBA,
    rose: WPLColors.roseRGBA,
    violet: WPLColors.violetRGBA,
    orange: WPLColors.orangeRGBA,
    blue: WPLColors.blueRGBA,
    green: WPLColors.greenRGBA,
    primary: WPLColors.primaryRGBA,
    secondary: WPLColors.secondaryRGBA,
  };

  return {
    '&:hover': {
      boxShadow: `0 0 30px ${colorMap[color][40]}, 0 0 60px ${colorMap[color][30]}`,
      transform: 'translateY(-2px)',
    },
  };
};
