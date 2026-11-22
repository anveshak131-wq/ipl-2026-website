'use client';

import React from 'react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

export function getPlayerInitials(name: string): string {
  if (!name) return 'IPL';
  const clean = name.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // 3+ parts: e.g. Mahendra Singh Dhoni -> MSD, Kannaur Lokesh Rahul -> KLR
  if (parts.length >= 3) {
    const p1 = parts[0][0];
    const p2 = parts[1][0];
    const pLast = parts[parts.length - 1][0];
    return (p1 + p2 + pLast).toUpperCase().slice(0, 3);
  }
  return clean.slice(0, 2).toUpperCase();
}

interface PlayerMonogramAvatarProps {
  name: string;
  teamShortName?: string;
  teamId?: string;
  team?: string;
  jerseyNumber?: number | string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function PlayerMonogramAvatar({
  name,
  teamShortName,
  teamId,
  team,
  jerseyNumber,
  size = 'md',
  className = '',
}: PlayerMonogramAvatarProps) {
  const metaTeam = resolveIpl2027Team(teamShortName || teamId || team);
  const initials = getPlayerInitials(name);

  // Authentic franchise gradients
  const primaryColor = metaTeam?.primaryColor || '#334155';
  const secondaryColor = metaTeam?.secondaryColor || '#1e293b';

  const sizeClasses = {
    sm: 'h-8 w-8 rounded-lg text-xs tracking-tight',
    md: 'h-14 w-14 rounded-2xl text-base tracking-normal',
    lg: 'h-18 w-18 rounded-2xl text-xl tracking-normal',
    xl: 'h-24 w-24 rounded-3xl text-2xl tracking-normal',
  };

  const jerseySizeClasses = {
    sm: 'text-[8px] px-1 py-0.2 -bottom-1 -right-1',
    md: 'text-[9px] px-1.5 py-0.5 bottom-0.5 right-0.5',
    lg: 'text-[10px] px-2 py-0.5 bottom-1 right-1',
    xl: 'text-[11px] px-2.5 py-0.5 bottom-1.5 right-1.5',
  };

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} relative flex items-center justify-center font-black text-white shadow-lg overflow-hidden border border-white/20 transition-transform duration-300`}
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          boxShadow: `0 8px 24px ${primaryColor}40`,
        }}
      >
        {/* Subtle inner highlight glow */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 70%)',
          }}
        />

        {/* Textured diagonal watermark pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 8px)',
          }}
        />

        <span className="relative z-10 font-black drop-shadow-md">{initials}</span>
      </div>

      {jerseyNumber && String(jerseyNumber).trim() !== '' && (
        <span
          className={`absolute rounded-full bg-slate-950/90 font-black text-[#f2d39a] border border-[#f2d39a]/40 shadow-md ${jerseySizeClasses[size]}`}
          title={`Jersey #${jerseyNumber}`}
        >
          #{jerseyNumber}
        </span>
      )}
    </div>
  );
}
