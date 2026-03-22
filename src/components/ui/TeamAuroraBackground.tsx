'use client';

import { useMemo } from 'react';

interface TeamAuroraBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = String(hex || '').trim().replace('#', '');
  if (!cleaned) return null;

  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  }

  return null;
}

function toRgba(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return `rgba(255, 255, 255, ${clamp(alpha, 0, 1)})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

function mixHex(a: string, b: string, ratio = 0.5): string {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA && !rgbB) return '#FFFFFF';
  if (!rgbA) return b;
  if (!rgbB) return a;

  const t = clamp(ratio, 0, 1);
  const r = Math.round(rgbA.r * t + rgbB.r * (1 - t));
  const g = Math.round(rgbA.g * t + rgbB.g * (1 - t));
  const bl = Math.round(rgbA.b * t + rgbB.b * (1 - t));
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export default function TeamAuroraBackground({
  primaryColor = '#1D3D8D',
  secondaryColor = '#7C3AED',
}: TeamAuroraBackgroundProps) {
  const mixed = useMemo(() => mixHex(primaryColor, secondaryColor, 0.55), [primaryColor, secondaryColor]);

  const background = useMemo(
    () => `
      radial-gradient(1200px 800px at 10% 20%, ${toRgba(primaryColor, 0.18)}, transparent 60%),
      radial-gradient(900px 700px at 80% 30%, ${toRgba(secondaryColor, 0.14)}, transparent 60%),
      radial-gradient(800px 600px at 50% 80%, ${toRgba(mixed, 0.12)}, transparent 60%),
      linear-gradient(180deg, #0b0f1a 0%, #05070c 100%)
    `,
    [primaryColor, secondaryColor, mixed],
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 animate-aurora"
        style={{
          background,
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(120% 80% at 50% 120%, transparent 45%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}

