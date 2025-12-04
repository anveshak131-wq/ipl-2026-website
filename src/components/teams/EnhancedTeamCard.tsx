'use client';

import Image from 'next/image';
import { Team } from '@/types';
import { useRouter } from 'next/navigation';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColorForGradient } from '@/lib/colorUtils';
import { motion } from 'framer-motion';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { useState } from 'react';

interface EnhancedTeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function EnhancedTeamCard({ team, onPlayerClick, isFavorite = false, onToggleFavorite }: EnhancedTeamCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const animatedLogo = getAnimatedLogoPath(team.id, team.shortName, team.league);
  const fallbackLogo = getLogoPath(team.id);
  const isRCBStaticExport = animatedLogo.endsWith('rcb_logo_premium.svg');

  const trophyCount = team.trophies?.length || 0;
  const playerCount = team.players?.length || 0;
  const captain = team.players?.find(p => p.isCaptain);
  const overseasCount = team.players?.filter(p => p.nationality !== 'India').length || 0;

  const handleViewFullSquad = () => {
    const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
    // Use league-specific route for WPL teams
    const basePath = team.league === 'wpl' ? '/wpl/teams' : '/teams';
    router.push(`${basePath}/${teamRoute}`);
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/matches?team=${team.shortName}`);
  };

  const handleStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/stats?team=${team.shortName}`);
  };

  return (
    <motion.article
      className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: `linear-gradient(135deg, ${team.colors.primary}15, ${team.colors.secondary}25)`,
        boxShadow: `0 0 0 1px ${team.colors.primary}20`
      }}
    >
      {/* Gradient Background Overlay */}
      <div 
        className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${team.colors.primary}40 0%, ${team.colors.secondary}60 100%)`
        }}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{ transform: 'skewX(-20deg)' }}
        />
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header: Logo + Favorite */}
        <div className="flex items-start justify-between">
          {/* Team Logo */}
          <div className="relative w-20 h-20 flex items-center justify-center rounded-xl bg-slate-900/40 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-xl"
              style={{
                background: `radial-gradient(circle, ${team.colors.primary}60, transparent)`
              }}
            />
            
            {animatedLogo.endsWith('.json') ? (
              <div className="relative z-10 w-16 h-16">
                <RCBLottie className="w-full h-full" />
              </div>
            ) : isRCBStaticExport ? (
              <div className="relative z-10 w-16 h-16">
                <RCBLionLogo className="w-full h-full" />
              </div>
            ) : (
              <Image
                src={imageError ? fallbackLogo : animatedLogo}
                alt={`${team.shortName} logo`}
                width={64}
                height={64}
                className="object-contain relative z-10"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="relative w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-sm border border-white/20 hover:border-rose-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <motion.span
                className="text-xl"
                animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <CustomEmoji type={isFavorite ? 'star' : 'star-outline'} size={20} />
              </motion.span>
            </button>
          )}
        </div>

        {/* Team Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 
              className="text-2xl font-black"
              style={{
                color: '#FFFFFF',
                textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 20px ${team.colors.primary}60`
              }}
            >
              {team.shortName}
            </h3>
            {trophyCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-xs font-bold text-amber-300">
                <CustomEmoji type="trophy" size={16} /> {trophyCount}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-200">
            {team.name}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center gap-3 flex-wrap">
            {/* Players */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-white/10 backdrop-blur-sm">
                <CustomEmoji type="people" size={16} />
                <span className="text-xs font-bold text-white">{playerCount}</span>
            </div>

            {/* Overseas */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-white/10 backdrop-blur-sm">
                <CustomEmoji type="globe" size={16} />
                <span className="text-xs font-bold text-white">{overseasCount}</span>
            </div>

            {/* Captain */}
            {captain && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-white/10 backdrop-blur-sm">
                    <CustomEmoji type="lightning" size={16} />
                    <span className="text-xs font-bold text-white truncate max-w-[100px]">
                        {captain.name.split(' ').pop()}
                    </span>
                </div>
            )}
        </div>

        {/* Team Colors */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Colors:</span>
          <div className="flex gap-2">
            <div 
              className="w-8 h-8 rounded-lg border-2 border-white/30 hover:scale-125 transition-transform cursor-pointer"
              style={{ 
                backgroundColor: team.colors.primary,
                boxShadow: `0 0 15px ${team.colors.primary}40`
              }}
              title={team.colors.primary}
            />
            <div 
              className="w-8 h-8 rounded-lg border-2 border-white/30 hover:scale-125 transition-transform cursor-pointer"
              style={{ 
                backgroundColor: team.colors.secondary,
                boxShadow: `0 0 15px ${team.colors.secondary}40`
              }}
              title={team.colors.secondary}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-300 line-clamp-2">
          {team.description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {/* Primary CTA */}
          <motion.button
            onClick={handleViewFullSquad}
            className="flex-1 relative overflow-hidden rounded-lg font-bold text-sm py-3 cursor-pointer group/btn"
            style={{
              background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
              boxShadow: `0 4px 20px ${team.colors.primary}40`,
              color: getOptimalTextColorForGradient(`linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`),
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              View Squad
              <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </motion.button>

          {/* Secondary Actions */}
          <button
            onClick={handleSchedule}
            className="w-11 h-11 rounded-lg bg-slate-900/60 border border-white/10 hover:border-white/30 flex items-center justify-center text-lg hover:scale-110 transition-all"
            aria-label="View schedule"
            title="Schedule"
          >
            📅
          </button>
          <button
            onClick={handleStats}
            className="w-11 h-11 rounded-lg bg-slate-900/60 border border-white/10 hover:border-white/30 flex items-center justify-center text-lg hover:scale-110 transition-all"
            aria-label="View stats"
            title="Statistics"
          >
            <CustomEmoji type="chart" size={20} />
          </button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div 
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-lg"
        style={{
          background: `linear-gradient(135deg, ${team.colors.primary}40, ${team.colors.secondary}40)`
        }}
      />
    </motion.article>
  );
}
