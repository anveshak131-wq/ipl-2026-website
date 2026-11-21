'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { Team } from '@/types';

interface MatchTeamCrestProps {
  team?: Team | null;
  size?: number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
  fallbackText?: string;
}

export default function MatchTeamCrest({
  team,
  size = 56,
  className = '',
  glow = true,
  priority = false,
  fallbackText,
}: MatchTeamCrestProps) {
  const [hasError, setHasError] = useState(false);

  if (!team) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-slate-900/80 border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logos/tba_logo.svg"
          alt="TBA"
          width={Math.round(size * 0.7)}
          height={Math.round(size * 0.7)}
          className="object-contain"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Canonical logo resolver
  const resolveLogoSrc = (): string => {
    const short = (team.shortName || '').toUpperCase();
    const name = (team.name || '').toLowerCase();
    const id = String(team.id || '');

    // Is it RCB?
    if (short === 'RCB' || id === '1' || name.includes('royal challengers')) {
      return '/logos/rcb_logo_premium.svg';
    }

    // Is it TBA / TBD?
    if (
      id.includes('tbd') ||
      short === 'TBD' ||
      short === 'TBA' ||
      short.includes('PLACE') ||
      name.includes('to be announced') ||
      name.includes('opponent tba')
    ) {
      return '/logos/tba_logo.svg';
    }

    if (team.logo && team.logo.trim() !== '' && !team.logo.endsWith('.json')) {
      return team.logo;
    }

    return getAnimatedLogoPath(team.id, team.shortName, team.league);
  };

  const logoSrc = resolveLogoSrc();
  const shortName = team.shortName || team.name?.substring(0, 3)?.toUpperCase() || fallbackText || 'TBD';

  // Primary team accent color for glowing crest pods
  const getTeamColor = (): string => {
    const short = (team.shortName || '').toUpperCase();
    switch (short) {
      case 'RCB':
        return '#dc2626'; // Crimson
      case 'CSK':
        return '#eab308'; // Canary Gold
      case 'MI':
        return '#2563eb'; // Blue
      case 'KKR':
        return '#7c3aed'; // Purple
      case 'SRH':
        return '#f97316'; // Sunrise Orange
      case 'GT':
        return '#0284c7'; // Navy/Cyan
      case 'RR':
        return '#ec4899'; // Royal Pink
      case 'PBKS':
        return '#e11d48'; // Crimson Rose
      case 'LSG':
        return '#06b6d4'; // Cyan
      case 'DC':
        return '#3b82f6'; // Capitals Blue
      default:
        return '#6366f1'; // Indigo
    }
  };

  const accentColor = getTeamColor();

  return (
    <div
      className={`relative group flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Ambient Glow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-75 pointer-events-none"
          style={{ background: accentColor }}
        />
      )}

      {/* Glass Inner Container */}
      <div
        className="relative w-full h-full rounded-2xl bg-gradient-to-br from-black/80 to-slate-950/90 border border-white/15 p-2 flex items-center justify-center overflow-hidden shadow-inner"
        style={{
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.5)`,
        }}
      >
        {!hasError ? (
          <Image
            src={logoSrc}
            alt={`${team.name || shortName} logo`}
            width={Math.round(size * 0.8)}
            height={Math.round(size * 0.8)}
            className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-108"
            priority={priority}
            onError={() => {
              // Try fallback path if custom logo fails
              if (!logoSrc.includes('rcb_logo_premium.svg')) {
                setHasError(true);
              }
            }}
          />
        ) : (
          /* High-Fidelity Vector Monogram Fallback - guaranteed to never crash */
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className="font-black text-sm sm:text-base tracking-tighter"
              style={{
                color: accentColor,
                textShadow: `0 0 12px ${accentColor}80`,
              }}
            >
              {shortName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
