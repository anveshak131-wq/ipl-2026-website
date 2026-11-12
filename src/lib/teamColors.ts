/**
 * Centralized team color utilities ensuring no pink/magenta/rose hues appear
 * across franchise pages, player panels, cards, or modals.
 */

const KNOWN_PINK_HEXES = new Set([
  '#EA1A85',
  '#EC4899',
  '#DB2777',
  '#F472B6',
  '#F43F5E',
  '#E11D48',
  '#E91E63',
  '#F06292',
  '#D946EF',
  '#C026D3',
  '#FF2E93',
  '#FF1493',
  '#FF69B4',
]);

export function normalizeHex(raw: string | undefined, fallback = '#1D4ED8'): string {
  const value = String(raw || '').trim();
  if (!value) return fallback;
  const withHash = value.startsWith('#') ? value : `#${value}`;
  const shortMatch = withHash.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const longMatch = withHash.match(/^#([0-9a-fA-F]{6})$/);
  if (longMatch) return withHash.toUpperCase();
  return fallback;
}

/**
 * Returns true if a hex color sits in the magenta / pink / rose hue band.
 */
export function isPinkishHex(raw?: string): boolean {
  const hex = normalizeHex(raw, '');
  if (!hex || hex.length !== 7) return false;
  if (KNOWN_PINK_HEXES.has(hex)) return true;

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return false;

  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  if (s < 0.25) return false;

  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  // Magenta / Fuchsia / Pink / Rose hues sit between 285deg and 346deg
  return h >= 285 && h <= 346;
}

export function sanitizeNoPinkHex(raw: string | undefined, fallback = '#1D4ED8'): string {
  const safeFallback = isPinkishHex(fallback) ? '#1D4ED8' : normalizeHex(fallback, '#1D4ED8');
  const hex = normalizeHex(raw, safeFallback);
  if (isPinkishHex(hex)) return safeFallback;
  return hex;
}

export function getSafeTeamPalette(team?: {
  shortName?: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const short = String(team?.shortName || '').toUpperCase();
  if (short === 'RR') {
    return { primary: '#1D4ED8', secondary: '#F59E0B', accent: '#38BDF8' };
  }
  const rawPrimary = team?.colors?.primary || team?.primaryColor;
  const rawSecondary = team?.colors?.secondary || team?.secondaryColor;
  const rawAccent = team?.colors?.accent;

  return {
    primary: sanitizeNoPinkHex(rawPrimary, '#1D4ED8'),
    secondary: sanitizeNoPinkHex(rawSecondary, '#F59E0B'),
    accent: sanitizeNoPinkHex(rawAccent, '#38BDF8'),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const safe = sanitizeNoPinkHex(hex, '#1D4ED8');
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getHexLuminance(hex: string): number {
  const safe = sanitizeNoPinkHex(hex, '#1D4ED8');
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(safe.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function mixHex(hexA: string, hexB: string, ratioB: number): string {
  const a = normalizeHex(hexA, '#1D4ED8');
  const b = normalizeHex(hexB, '#FFFFFF');
  const t = Math.max(0, Math.min(1, ratioB));
  const lerp = (idx: number) =>
    Math.round(parseInt(a.slice(idx, idx + 2), 16) * (1 - t) + parseInt(b.slice(idx, idx + 2), 16) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${lerp(1)}${lerp(3)}${lerp(5)}`.toUpperCase();
}

export function getTeamAccentTheme(primary?: string, secondary?: string) {
  const safePrimary = sanitizeNoPinkHex(primary, '#1D4ED8');
  const rawSecondary = sanitizeNoPinkHex(secondary, safePrimary);
  // Avoid near-black secondary collapsing a pill gradient into black
  const safeSecondary =
    getHexLuminance(rawSecondary) < 0.03 || rawSecondary === safePrimary
      ? mixHex(safePrimary, '#0F172A', 0.28)
      : rawSecondary;

  const avgLum = (getHexLuminance(safePrimary) + getHexLuminance(safeSecondary)) / 2;
  const isLightGradient = avgLum > 0.36;

  return {
    primary: safePrimary,
    secondary: safeSecondary,
    gradient: `linear-gradient(135deg, ${safePrimary} 0%, ${safeSecondary} 100%)`,
    borderColor: hexToRgba(safePrimary, 0.55),
    subtleBg: hexToRgba(safePrimary, 0.14),
    subtleBorder: hexToRgba(safePrimary, 0.35),
    shadow: `0 8px 24px ${hexToRgba(safePrimary, 0.35)}`,
    highlightText: getHexLuminance(safePrimary) < 0.28 ? mixHex(safePrimary, '#FFFFFF', 0.42) : safePrimary,
    secondaryHighlight:
      getHexLuminance(safeSecondary) < 0.28 ? mixHex(safeSecondary, '#FFFFFF', 0.48) : safeSecondary,
    textColor: isLightGradient ? '#0F172A' : '#FFFFFF',
    badgeBg: isLightGradient ? 'rgba(15, 23, 42, 0.16)' : 'rgba(0, 0, 0, 0.28)',
    badgeText: isLightGradient ? '#0F172A' : '#FFFFFF',
  };
}
