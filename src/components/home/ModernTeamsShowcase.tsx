'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight } from 'lucide-react';
import type { Team } from '@/types';

interface ModernTeamsShowcaseProps {
  teams: Team[];
  isLoading?: boolean;
}

const WPL_FRANCHISE_DETAILS: Record<string, {
  shortName: string;
  name: string;
  logo: string;
  primary: string;
  glow: string;
  border: string;
  titles: string[];
}> = {
  rcb: {
    shortName: 'RCB-W',
    name: 'Royal Challengers Bengaluru',
    logo: '/logos/wpl_rcb_logo_modern.svg',
    primary: '#DC2626',
    glow: 'rgba(220, 38, 38, 0.35)',
    border: 'group-hover:border-red-500/60',
    titles: ['2024', '2026'],
  },
  mi: {
    shortName: 'MI-W',
    name: 'Mumbai Indians',
    logo: '/logos/wpl_mi_logo_modern.svg',
    primary: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.35)',
    border: 'group-hover:border-blue-500/60',
    titles: ['2023', '2025'],
  },
  dc: {
    shortName: 'DC-W',
    name: 'Delhi Capitals',
    logo: '/logos/wpl_dc_logo_modern.svg',
    primary: '#0284C7',
    glow: 'rgba(2, 132, 199, 0.35)',
    border: 'group-hover:border-sky-500/60',
    titles: [],
  },
  gg: {
    shortName: 'GG',
    name: 'Gujarat Giants',
    logo: '/logos/wpl_gg_logo_modern.svg',
    primary: '#EA580C',
    glow: 'rgba(234, 88, 12, 0.35)',
    border: 'group-hover:border-orange-500/60',
    titles: [],
  },
  upw: {
    shortName: 'UPW',
    name: 'UP Warriorz',
    logo: '/logos/wpl_upw_logo_modern.svg',
    primary: '#9333EA',
    glow: 'rgba(147, 51, 234, 0.35)',
    border: 'group-hover:border-purple-500/60',
    titles: [],
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
    logo: team.logo || '/logos/tba_logo.svg',
    primary: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.25)',
    border: 'group-hover:border-sky-400/50',
    titles: [],
  };
}

export default function ModernTeamsShowcase({ teams, isLoading = false }: ModernTeamsShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-64 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  // Ensure all 5 official WPL teams are represented
  const displayTeams = teams.length >= 5 ? teams.slice(0, 5) : teams;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
      {displayTeams.map((team, idx) => {
        const meta = getTeamMeta(team);
        const isHovered = hoveredId === team.id;
        const linkHref = team.league === 'wpl' ? `/wpl/teams/${team.id}` : `/teams/${team.id}`;

        return (
          <motion.div
            key={team.id || idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            onMouseEnter={() => setHoveredId(team.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group relative"
          >
            <Link href={linkHref} className="block h-full">
              <div
                className={`relative h-64 p-5 rounded-3xl bg-[#090c15]/90 border border-white/10 ${meta.border} backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col items-center justify-between text-center`}
                style={{
                  boxShadow: isHovered
                    ? `0 20px 45px -10px ${meta.glow}, 0 0 0 1px ${meta.primary}40`
                    : '0 10px 30px -15px rgba(0,0,0,0.6)',
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                }}
              >
                {/* Dynamic radial ambient glow behind logo */}
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-60"
                  style={{ backgroundColor: meta.primary }}
                />

                {/* Top Badge: Championship Star or Status */}
                <div className="w-full flex items-center justify-between z-10">
                  {meta.titles.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      {meta.titles.length}x
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Contender
                    </span>
                  )}
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                {/* Center: Modern Logo with 3D Float Animation */}
                <div className="relative my-auto flex items-center justify-center">
                  <motion.div
                    className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-2 rounded-2xl bg-black/30 border border-white/5 shadow-inner"
                    animate={isHovered ? { scale: 1.12, rotate: [0, -3, 3, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <Image
                      src={meta.logo}
                      alt={`${meta.name} crest`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                      priority={idx < 3}
                    />
                  </motion.div>
                </div>

                {/* Bottom: Team Titles & Typography */}
                <div className="w-full z-10 pt-2 border-t border-white/5">
                  <h3 className="font-black text-base sm:text-lg text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    {meta.shortName}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 truncate w-full mt-0.5">
                    {meta.name}
                  </p>
                </div>

                {/* Hover rim shine highlight */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
