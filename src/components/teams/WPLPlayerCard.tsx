'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';
import { WPLColors } from '@/lib/wplColors';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';

interface WPLPlayerCardProps {
  player: Player;
  onClick: () => void;
  index?: number;
}

export default function WPLPlayerCard({ player, onClick, index = 0 }: WPLPlayerCardProps) {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    
    setTiltX(rotateX);
    setTiltY(rotateY);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="relative overflow-hidden rounded-3xl backdrop-blur-xl p-6 border transition-all duration-300 hover:border-pink-500/50"
        style={{
          background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))`,
          borderColor: WPLColors.purpleRGBA[30],
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${WPLColors.purpleRGBA[20]}`,
        }}
      >
        {/* Animated border glow on hover */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div 
            className="absolute inset-0 rounded-3xl blur-sm"
            style={{
              background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink}, ${WPLColors.rose})`,
              padding: '2px',
            }}
          />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: WPLColors.pink,
                opacity: 0.15,
              }}
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
              }}
              animate={{
                y: [null, Math.random() * 100 + '%'],
                x: [null, Math.random() * 100 + '%'],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Jersey Number Badge */}
          <div
            className="absolute top-3 right-3 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(20, 184, 166, 0.7))`,
              boxShadow: `0 4px 20px ${WPLColors.purpleRGBA[50]}`,
            }}
          >
            {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
          </div>

          {/* Player Avatar Circle with Gradient */}
          <div className="mb-4 w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-black transform group-hover:scale-110 transition-transform duration-300 relative"
               style={{
                 background: `linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(20, 184, 166, 0.6))`,
                 boxShadow: `0 10px 40px ${WPLColors.purpleRGBA[40]}`,
                 color: '#FFFFFF'
               }}>
            <span>{getInitials(player.name)}</span>
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"
              style={{
                background: `radial-gradient(circle, rgba(20, 184, 166, 0.4), transparent)`,
              }}
            />
          </div>

          {/* Player Name */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {player.nationality && (
              <FlagImage nationality={player.nationality} size="sm" />
            )}
          <h3 
              className="text-xl font-bold text-center transition-colors"
            style={{ color: WPLColors.textPrimary }}
          >
            {player.name}
          </h3>
          </div>
          
          {/* Role Badge */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border"
              style={{
                background: WPLColors.purpleRGBA[20],
                borderColor: WPLColors.purpleRGBA[40],
                color: WPLColors.textAccent,
              }}
            >
              {player.role}
            </span>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {player.isCaptain && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  background: WPLColors.roseRGBA[20],
                  borderColor: WPLColors.roseRGBA[40],
                  color: WPLColors.rose,
                }}
              >
                <span>👑</span> Captain
              </span>
            )}
            {player.nationality !== 'India' && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  background: WPLColors.pinkRGBA[20],
                  borderColor: WPLColors.pinkRGBA[40],
                  color: WPLColors.pink,
                }}
              >
                <CustomEmoji type="globe" size={14} /> Overseas
              </span>
            )}
          </div>

          {/* Basic Info (No Stats for WPL) */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t"
               style={{ borderColor: WPLColors.purpleRGBA[30] }}>
            <div className="text-center">
              <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                Batting
              </p>
              <p className="text-sm font-semibold" style={{ color: WPLColors.textPrimary }}>
                {player.battingStyle}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                Bowling
              </p>
              <p className="text-sm font-semibold" style={{ color: WPLColors.textPrimary }}>
                {player.bowlingStyle || 'N/A'}
              </p>
            </div>
          </div>

          {/* View Profile CTA */}
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors"
            style={{ color: WPLColors.textAccent }}
            whileHover={{ x: 5 }}
          >
            <span>View Profile</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        {/* Hover shimmer effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent, ${WPLColors.pinkRGBA[10]}, transparent)`,
            transform: 'skewX(-20deg) translateX(-100%)',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: skewX(-20deg) translateX(-100%); }
          100% { transform: skewX(-20deg) translateX(200%); }
        }
      `}</style>
    </motion.div>
  );
}

