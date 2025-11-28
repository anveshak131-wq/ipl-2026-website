'use client';

import { Team } from '@/types';
import { useRouter } from 'next/navigation';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColorForGradient } from '@/lib/colorUtils';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useState } from 'react';
import { CustomEmoji } from '@/components/emoji/Emoji';

interface AnimatedTeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  index: number;
}

export default function AnimatedTeamCard({ team, onPlayerClick, isFavorite = false, onToggleFavorite, index }: AnimatedTeamCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const animatedLogo = getAnimatedLogoPath(team.id);
  const fallbackLogo = getLogoPath(team.id);
  const isRCBStaticExport = animatedLogo.endsWith('rcb_logo_premium.svg');

  const trophyCount = team.trophies?.length || 0;
  const playerCount = team.players?.length || 0;
  const captain = team.players?.find(p => p.isCaptain);
  const overseasCount = team.players?.filter(p => p.nationality !== 'India').length || 0;

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleViewFullSquad = () => {
    const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
    router.push(`/teams/${teamRoute}`);
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/matches?team=${team.shortName}`);
  };

  const handleStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/stats?team=${team.shortName}`);
  };

  // Card entrance animation
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
        duration: 0.6
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <motion.article
        className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          background: `linear-gradient(135deg, ${team.colors.primary}15, ${team.colors.secondary}25)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ 
          scale: 1.05,
          boxShadow: `0 20px 60px ${team.colors.primary}40, 0 0 80px ${team.colors.secondary}30`,
          transition: { duration: 0.3 }
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 opacity-50"
          animate={{
            background: [
              `linear-gradient(135deg, ${team.colors.primary}30 0%, ${team.colors.secondary}50 100%)`,
              `linear-gradient(135deg, ${team.colors.secondary}50 0%, ${team.colors.primary}30 100%)`,
              `linear-gradient(135deg, ${team.colors.primary}30 0%, ${team.colors.secondary}50 100%)`,
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Shimmer effect */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%', skewX: -20 }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />

        {/* Radial glow on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${team.colors.primary}40, transparent 50%)`
          }}
        />

        {/* Content */}
        <div className="relative p-6 space-y-5" style={{ transform: 'translateZ(50px)' }}>
          {/* Header: Logo + Favorite */}
          <div className="flex items-start justify-between">
            {/* Animated Logo */}
            <motion.div 
              className="relative w-20 h-20 flex items-center justify-center rounded-xl bg-slate-900/40 backdrop-blur-sm border border-white/20"
              whileHover={{ 
                scale: 1.2, 
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
              }}
            >
              <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-xl"
                animate={{
                  boxShadow: [
                    `0 0 20px ${team.colors.primary}60`,
                    `0 0 40px ${team.colors.secondary}80`,
                    `0 0 20px ${team.colors.primary}60`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
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
                <motion.img
                  src={imageError ? fallbackLogo : animatedLogo}
                  alt={`${team.shortName} logo`}
                  className="w-16 h-16 object-contain relative z-10"
                  onError={() => setImageError(true)}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>

            {/* Animated Favorite Toggle */}
            {onToggleFavorite && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="relative w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-sm border border-white/20 hover:border-rose-500/50 flex items-center justify-center"
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <motion.span
                  className="text-xl"
                  animate={isFavorite ? {
                    scale: [1, 1.5, 1],
                    rotate: [0, 360],
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <CustomEmoji type={isFavorite ? 'star' : 'star-outline'} size={20} animate={isFavorite} />
                </motion.span>
              </motion.button>
            )}
          </div>

          {/* Team Info with stagger animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <motion.h3 
                className="text-2xl font-black"
                style={{
                  color: '#FFFFFF',
                  textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 20px ${team.colors.primary}60`
                }}
                whileHover={{ scale: 1.1, color: team.colors.primary }}
              >
                {team.shortName}
              </motion.h3>
              {trophyCount > 0 && (
                <motion.span 
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-xs font-bold text-amber-300"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                >
                  <CustomEmoji type="trophy" size={14} /> {trophyCount}
                </motion.span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-200">
              {team.name}
            </p>
          </motion.div>

          {/* Quick Stats with stagger */}
          <motion.div 
            className="flex items-center gap-3 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.4 }}
          >
            {[
              { type: 'people' as const, value: playerCount, label: 'Players' },
              { type: 'globe' as const, value: overseasCount, label: 'Overseas' },
              { type: 'lightning' as const, value: captain?.name.split(' ').pop() || 'TBA', label: 'Captain' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-white/10 backdrop-blur-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5 + i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
              >
                <CustomEmoji type={stat.type} size={16} />
                <span className="text-xs font-bold text-white truncate max-w-[100px]">
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated Team Colors */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.6 }}
          >
            <span className="text-xs text-gray-400 font-semibold">Colors:</span>
            <div className="flex gap-2">
              {[team.colors.primary, team.colors.secondary].map((color, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-lg border-2 border-white/30 cursor-pointer"
                  style={{ backgroundColor: color }}
                  whileHover={{ 
                    scale: 1.3, 
                    rotate: 360,
                    boxShadow: `0 0 20px ${color}80`
                  }}
                  transition={{ duration: 0.3 }}
                  title={color}
                />
              ))}
            </div>
          </motion.div>

          {/* Description */}
          <motion.p 
            className="text-sm leading-relaxed text-gray-300 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.7 }}
          >
            {team.description}
          </motion.p>

          {/* Actions with bounce */}
          <motion.div 
            className="flex items-center gap-2 pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.8 }}
          >
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleViewFullSquad(); }}
              className="flex-1 relative overflow-hidden rounded-lg font-bold text-sm py-3 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
                boxShadow: `0 4px 20px ${team.colors.primary}40`,
                color: getOptimalTextColorForGradient(`linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`),
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 8px 30px ${team.colors.primary}60`
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                View Squad
                <motion.svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </motion.svg>
              </span>
            </motion.button>

            {[
              { type: 'calendar' as const, onClick: handleSchedule, label: 'Schedule' },
              { type: 'chart' as const, onClick: handleStats, label: 'Stats' }
            ].map((action, i) => (
              <motion.button
                key={i}
                onClick={(e) => { e.stopPropagation(); action.onClick(e); }}
                className="w-11 h-11 rounded-lg bg-slate-900/60 border border-white/10 hover:border-white/30 flex items-center justify-center text-lg"
                aria-label={action.label}
                title={action.label}
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <CustomEmoji type={action.type} size={20} />
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Glow Effect */}
        <motion.div 
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${team.colors.primary}60, ${team.colors.secondary}60)`
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.article>
    </motion.div>
  );
}
