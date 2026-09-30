'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight, Shield, MapPin, Users, Sparkles } from 'lucide-react';
import type { Team } from '@/types';

interface ModernTeamsShowcaseProps {
  teams: Team[];
  isLoading?: boolean;
}

const WPL_FRANCHISE_DETAILS: Record<string, {
  shortName: string;
  name: string;
  city: string;
  watermark: string;
  logo: string;
  primary: string;
  secondary: string;
  glow: string;
  borderGlow: string;
  titles: string[];
  venue: string;
}> = {
  rcb: {
    shortName: 'RCB-W',
    name: 'Royal Challengers Bengaluru',
    city: 'Bengaluru',
    watermark: 'RCB',
    logo: '/logos/wpl_rcb_logo_modern.svg',
    primary: '#DC2626',
    secondary: '#D97706',
    glow: 'rgba(220, 38, 38, 0.45)',
    borderGlow: 'hover:border-red-500/80 hover:shadow-[0_0_35px_rgba(220,38,38,0.4)]',
    titles: ['2024', '2026'],
    venue: 'M. Chinnaswamy Stadium',
  },
  mi: {
    shortName: 'MI-W',
    name: 'Mumbai Indians',
    city: 'Mumbai',
    watermark: 'MI',
    logo: '/logos/wpl_mi_logo_modern.svg',
    primary: '#2563EB',
    secondary: '#EAB308',
    glow: 'rgba(37, 99, 235, 0.45)',
    borderGlow: 'hover:border-blue-500/80 hover:shadow-[0_0_35px_rgba(37,99,235,0.4)]',
    titles: ['2023', '2025'],
    venue: 'Wankhede Stadium',
  },
  dc: {
    shortName: 'DC-W',
    name: 'Delhi Capitals',
    city: 'Delhi',
    watermark: 'DC',
    logo: '/logos/wpl_dc_logo_modern.svg',
    primary: '#0284C7',
    secondary: '#DC2626',
    glow: 'rgba(2, 132, 199, 0.45)',
    borderGlow: 'hover:border-sky-500/80 hover:shadow-[0_0_35px_rgba(2,132,199,0.4)]',
    titles: [],
    venue: 'Arun Jaitley Stadium',
  },
  gg: {
    shortName: 'GG',
    name: 'Gujarat Giants',
    city: 'Ahmedabad',
    watermark: 'GIANTS',
    logo: '/logos/wpl_gg_logo_modern.svg',
    primary: '#EA580C',
    secondary: '#F59E0B',
    glow: 'rgba(234, 88, 12, 0.45)',
    borderGlow: 'hover:border-orange-500/80 hover:shadow-[0_0_35px_rgba(234,88,12,0.4)]',
    titles: [],
    venue: 'Narendra Modi Stadium',
  },
  upw: {
    shortName: 'UPW',
    name: 'UP Warriorz',
    city: 'Lucknow',
    watermark: 'UPW',
    logo: '/logos/wpl_upw_logo_modern.svg',
    primary: '#9333EA',
    secondary: '#EAB308',
    glow: 'rgba(147, 51, 234, 0.45)',
    borderGlow: 'hover:border-purple-500/80 hover:shadow-[0_0_35px_rgba(147,51,234,0.4)]',
    titles: [],
    venue: 'BRSABV Ekana Stadium',
  },
};

function getTeamMeta(team: Team) {
  const key = (team.shortName || team.id || team.name || '').toLowerCase();
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru')) return WPL_FRANCHISE_DETAILS.rcb;
  if (key.includes('mi') || key.includes('mumbai')) return WPL_FRANCHISE_DETAILS.mi;
  if (key.includes('dc') || key.includes('delhi')) return WPL_FRANCHISE_DETAILS.dc;
  if (key.includes('gg') || key.includes('gujarat')) return WPL_FRANCHISE_DETAILS.gg;
  if (key.includes('up') || key.includes('warrior')) return WPL_FRANCHISE_DETAILS.upw;

  return {
    shortName: team.shortName || 'WPL',
    name: team.name,
    city: 'Franchise',
    watermark: 'WPL',
    logo: team.logo || '/logos/tba_logo.svg',
    primary: '#38BDF8',
    secondary: '#818CF8',
    glow: 'rgba(56, 189, 248, 0.35)',
    borderGlow: 'hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.4)]',
    titles: [],
    venue: 'Official TBA',
  };
}

export default function ModernTeamsShowcase({ teams, isLoading = false }: ModernTeamsShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-80 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  // Canonical fallback to guarantee all 5 franchises always render
  const franchiseKeys = Object.keys(WPL_FRANCHISE_DETAILS);
  const sourceTeams = teams && teams.length >= 5 ? teams.slice(0, 5) : franchiseKeys.map(k => ({
    id: k,
    name: WPL_FRANCHISE_DETAILS[k].name,
    shortName: WPL_FRANCHISE_DETAILS[k].shortName,
    league: 'wpl' as const,
  }));

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {sourceTeams.map((team, idx) => {
          const meta = getTeamMeta(team as Team);
          const isHovered = hoveredId === (team.id || String(idx));
          const linkHref = `/wpl/teams/${team.id}`;

          return (
            <motion.div
              key={team.id || idx}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoveredId(team.id || String(idx))}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative"
            >
              <Link href={linkHref} className="block h-full outline-none focus:ring-2 focus:ring-amber-400 rounded-3xl">
                <div
                  className={`relative h-[340px] p-6 rounded-3xl bg-gradient-to-b from-[#111728]/90 via-[#0a0d18]/95 to-[#06080f] border border-white/10 ${meta.borderGlow} backdrop-blur-2xl overflow-hidden transition-all duration-500 flex flex-col justify-between`}
                  style={{
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
                    boxShadow: isHovered 
                      ? `0 28px 60px -15px ${meta.glow}, 0 0 0 1px ${meta.primary}60`
                      : '0 14px 40px -15px rgba(0,0,0,0.7)',
                  }}
                >
                  {/* Subtle Background Watermark Typography */}
                  <span
                    className="absolute -right-4 -bottom-6 text-7xl font-black tracking-tighter select-none pointer-events-none opacity-[0.035] group-hover:opacity-[0.08] transition-opacity duration-500"
                    style={{ color: meta.primary }}
                  >
                    {meta.watermark}
                  </span>

                  {/* Top Ambient Light Flare */}
                  <div
                    className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-75"
                    style={{ backgroundColor: meta.primary }}
                  />

                  {/* Diagonal Glass Reflection Ray */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Card Header */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-md"
                      style={{ 
                        backgroundColor: `${meta.primary}18`, 
                        borderColor: `${meta.primary}40`,
                        color: meta.primary === '#DC2626' ? '#FCA5A5' : meta.primary === '#2563EB' ? '#93C5FD' : meta.primary === '#0284C7' ? '#7DD3FC' : meta.primary === '#EA580C' ? '#FDBA74' : '#D8B4FE'
                      }}
                    >
                      {meta.shortName}
                    </span>

                    {meta.titles.length > 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/35 text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>{meta.titles.length}x Champs</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Contender
                      </span>
                    )}
                  </div>

                  {/* Center Emblem Stage */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                    <motion.div
                      className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center p-3 rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-md"
                      animate={isHovered ? { scale: 1.12, rotate: [0, -4, 4, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                      {/* Pulse Ring Behind Logo on Hover */}
                      {isHovered && (
                        <div
                          className="absolute inset-0 rounded-2xl animate-ping opacity-25 pointer-events-none"
                          style={{ borderColor: meta.primary, borderStyle: 'solid', borderWidth: '2px' }}
                        />
                      )}

                      <Image
                        src={meta.logo}
                        alt={`${meta.name} crest`}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                        priority={idx < 3}
                      />
                    </motion.div>
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
                        {meta.name}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{meta.venue}</span>
                    </div>

                    {/* Animated Explore Bar on hover */}
                    <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full w-0 group-hover:w-full transition-all duration-500 rounded-full"
                        style={{ backgroundColor: meta.primary }}
                      />
                    </div>
                  </div>

                  {/* Corner Chrome Sheen */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-tr-3xl pointer-events-none" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
