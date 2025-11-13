/**
 * Color contrast utilities for WCAG-compliant text color selection
 * Based on WCAG 2.1 guidelines for relative luminance and contrast ratio
 */

/**
 * Normalizes an RGB component value for luminance calculation
 */
function normalizeRGBComponent(value: number): number {
  const normalized = value / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Calculates the relative luminance of a color (WCAG 2.1 formula)
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns Relative luminance value (0-1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rNorm = normalizeRGBComponent(r);
  const gNorm = normalizeRGBComponent(g);
  const bNorm = normalizeRGBComponent(b);
  
  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
}

/**
 * Parses a hex color string to RGB values
 * @param hex Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns RGB values as [r, g, b] or null if invalid
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return [r, g, b];
  }
  
  return null;
}

/**
 * Parses an rgba color string to RGB values
 * @param rgba RGBA color string (e.g., "rgba(255, 0, 0, 0.5)")
 * @returns RGB values as [r, g, b] or null if invalid
 */
export function rgbaToRgb(rgba: string): [number, number, number] | null {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return null;
}

/**
 * Extracts RGB values from various color formats
 * @param color Color string (hex, rgba, or rgb)
 * @returns RGB values as [r, g, b] or null if invalid
 */
export function parseColorToRgb(color: string): [number, number, number] | null {
  if (!color) return null;
  
  // Try hex first
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  
  // Try rgba/rgb
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return rgbaToRgb(color);
  }
  
  // Try hex without #
  if (/^[0-9A-Fa-f]{3,6}$/.test(color)) {
    return hexToRgb('#' + color);
  }
  
  return null;
}

/**
 * Calculates contrast ratio between two colors
 * @param color1 First color (any format)
 * @param color2 Second color (any format)
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColorToRgb(color1);
  const rgb2 = parseColorToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    // Default to low contrast if parsing fails
    return 1;
  }
  
  const lum1 = getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines the optimal text color (white or black) for a given background
 * @param backgroundColor Background color (hex, rgba, or rgb)
 * @returns '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds
 */
export function getOptimalTextColor(backgroundColor: string): string {
  const rgb = parseColorToRgb(backgroundColor);
  
  if (!rgb) {
    // Default to white if parsing fails
    return '#FFFFFF';
  }
  
  const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
  
  // Compare contrast with white and black
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');
  
  // Choose the color with better contrast
  // Also consider luminance threshold (0.5) as a fallback
  if (whiteContrast >= blackContrast && whiteContrast >= 4.5) {
    return '#FFFFFF';
  } else if (blackContrast >= 4.5) {
    return '#000000';
  } else {
    // Fallback: use luminance threshold
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}

/**
 * Gets optimal text color for a gradient background
 * Extracts the average color from gradient or uses the darker color
 * @param gradientString CSS gradient string (e.g., "linear-gradient(135deg, #FF0000, #0000FF)")
 * @returns Optimal text color
 */
export function getOptimalTextColorForGradient(gradientString: string): string {
  // Extract colors from gradient
  const colorMatches = gradientString.match(/#[0-9A-Fa-f]{6}|rgba?\([^)]+\)/g);
  
  if (!colorMatches || colorMatches.length === 0) {
    return '#FFFFFF'; // Default
  }
  
  // Calculate average luminance of all colors in gradient
  let totalLuminance = 0;
  let validColors = 0;
  
  for (const color of colorMatches) {
    const rgb = parseColorToRgb(color);
    if (rgb) {
      totalLuminance += getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      validColors++;
    }
  }
  
  if (validColors === 0) {
    return '#FFFFFF';
  }
  
  const avgLuminance = totalLuminance / validColors;
  
  // Use the darker color from gradient for better contrast calculation
  let darkestColor = colorMatches[0];
  let darkestLuminance = Infinity;
  
  for (const color of colorMatches) {
    const rgb = parseColorToRgb(color);
    if (rgb) {
      const lum = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      if (lum < darkestLuminance) {
        darkestLuminance = lum;
        darkestColor = color;
      }
    }
  }
  
  // Use the darkest color for contrast calculation
  return getOptimalTextColor(darkestColor);
}

