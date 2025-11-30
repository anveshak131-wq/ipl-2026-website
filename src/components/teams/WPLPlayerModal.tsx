'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Team } from '@/types';
import { WPLColors } from '@/lib/wplColors';
import { formatDateDDMMYYYY, calculateAge } from '@/lib/dateUtils';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { X } from 'lucide-react';

interface WPLPlayerModalProps {
  player: Player | null;
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WPLPlayerModal({ player, team, isOpen, onClose }: WPLPlayerModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animated gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}
            onClick={handleBackdropClick}
          >
            {/* Animated background gradient */}
            <div
              className="absolute inset-0 opacity-30 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${WPLColors.purpleRGBA[40]}, ${WPLColors.pinkRGBA[40]}, transparent)`,
              }}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.base}, ${WPLColors.gradientStart})`,
                borderColor: WPLColors.purpleRGBA[40],
                boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 60px ${WPLColors.purpleRGBA[30]}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: WPLColors.purpleRGBA[20],
                  border: `1px solid ${WPLColors.purpleRGBA[40]}`,
                  color: WPLColors.textPrimary,
                }}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Section with Gradient */}
              <div
                className="relative p-8 pb-12"
                style={{
                  background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[20]})`,
                }}
              >
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden rounded-t-3xl pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        background: WPLColors.pink,
                        opacity: 0.4,
                      }}
                      initial={{
                        x: Math.random() * 100 + '%',
                        y: Math.random() * 100 + '%',
                      }}
                      animate={{
                        y: [null, Math.random() * 100 + '%'],
                        x: [null, Math.random() * 100 + '%'],
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar Circle */}
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl relative"
                    style={{
                      background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink}, ${WPLColors.rose})`,
                      boxShadow: `0 15px 50px ${WPLColors.purpleRGBA[50]}`,
                    }}
                  >
                    <span>{getInitials(player.name)}</span>
                    {/* Glow ring */}
                    <div
                      className="absolute inset-0 rounded-full border-2"
                      style={{
                        borderColor: WPLColors.pinkRGBA[50],
                        boxShadow: `0 0 30px ${WPLColors.pinkRGBA[30]}`,
                      }}
                    />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2
                      className="text-3xl md:text-4xl font-black mb-2"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      {player.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-4">
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
                        style={{
                          background: WPLColors.purpleRGBA[20],
                          borderColor: WPLColors.purpleRGBA[40],
                          color: WPLColors.textAccent,
                        }}
                      >
                        {player.role}
                      </span>
                      {player.isCaptain && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                          style={{
                            background: WPLColors.roseRGBA[20],
                            borderColor: WPLColors.roseRGBA[40],
                            color: WPLColors.rose,
                          }}
                        >
                          <span>👑</span> Captain
                        </span>
                      )}
                      {player.jerseyNumber > 0 && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                          style={{
                            background: WPLColors.pinkRGBA[20],
                            borderColor: WPLColors.pinkRGBA[40],
                            color: WPLColors.pink,
                          }}
                        >
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                    {team && (
                      <p className="text-sm" style={{ color: WPLColors.textSecondary }}>
                        {team.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3
                    className="text-xl font-bold mb-4 flex items-center gap-2"
                    style={{ color: WPLColors.textPrimary }}
                  >
                    <div
                      className="w-1 h-6 rounded-full"
                      style={{
                        background: `linear-gradient(to bottom, ${WPLColors.purple}, ${WPLColors.pink})`,
                      }}
                    />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                    >
                      <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                        Age
                      </p>
                      <p className="text-lg font-bold" style={{ color: WPLColors.textPrimary }}>
                        {age} years
                        {player.dateOfBirth && (
                          <span className="text-sm font-normal ml-2" style={{ color: WPLColors.textMuted }}>
                            ({formatDateDDMMYYYY(player.dateOfBirth)})
                          </span>
                        )}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        background: WPLColors.pinkRGBA[10],
                        borderColor: WPLColors.pinkRGBA[30],
                      }}
                    >
                      <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                        Nationality
                      </p>
                      <p className="text-lg font-bold" style={{ color: WPLColors.textPrimary }}>
                        {player.nationality}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      }}
                    >
                      <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                        Batting Style
                      </p>
                      <p className="text-lg font-bold" style={{ color: WPLColors.textPrimary }}>
                        {player.battingStyle}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        background: WPLColors.pinkRGBA[10],
                        borderColor: WPLColors.pinkRGBA[30],
                      }}
                    >
                      <p className="text-xs uppercase mb-1" style={{ color: WPLColors.textMuted }}>
                        Bowling Style
                      </p>
                      <p className="text-lg font-bold" style={{ color: WPLColors.textPrimary }}>
                        {player.bowlingStyle || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

