'use client';

import { motion } from 'framer-motion';
import { Trophy, Calendar } from 'lucide-react';
import { Team } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface TrophyShowcaseGalleryProps {
  team: Team;
  primaryColor: string;
  secondaryColor: string;
}

export default function TrophyShowcaseGallery({ team, primaryColor, secondaryColor }: TrophyShowcaseGalleryProps) {
  const trophies = team.trophies || [];

  if (trophies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-semibold mb-2">No Trophies Yet</p>
        <p className="text-sm">This team is still chasing their first championship title.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6" style={{ color: primaryColor }} />
          Trophy Collection
        </h3>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <span className="text-amber-400 font-bold text-lg">{trophies.length} Title{trophies.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trophies.map((trophy, index) => (
          <motion.div
            key={`${trophy.year}-${index}`}
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5, rotateY: 5 }}
            className="relative group"
          >
            <div
              className="relative p-8 rounded-2xl border-2 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                borderColor: `${primaryColor}40`,
                boxShadow: `0 10px 30px ${primaryColor}20`,
              }}
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at center, ${primaryColor}30, transparent)`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Trophy Icon */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  className="mb-4"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
                      boxShadow: `0 0 40px ${primaryColor}40`,
                    }}
                  >
                    <CustomEmoji type="trophy" size={64} animate={true} />
                  </div>
                </motion.div>

                <h4 className="text-xl font-black text-white mb-2">{trophy.name}</h4>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span className="font-bold text-lg" style={{ color: primaryColor }}>
                    {trophy.year}
                  </span>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: primaryColor }} />
                <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: secondaryColor }} />
              </div>

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                style={{ transform: 'skewX(-20deg)' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trophy Stats */}
      <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-white mb-1">{trophies.length}</div>
            <div className="text-sm text-gray-400">Total Titles</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white mb-1">
              {trophies.length > 0 ? Math.min(...trophies.map(t => t.year)) : 'N/A'}
            </div>
            <div className="text-sm text-gray-400">First Title</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white mb-1">
              {trophies.length > 0 ? Math.max(...trophies.map(t => t.year)) : 'N/A'}
            </div>
            <div className="text-sm text-gray-400">Latest Title</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white mb-1">
              {trophies.length > 1
                ? Math.max(...trophies.map(t => t.year)) - Math.min(...trophies.map(t => t.year))
                : 0}
            </div>
            <div className="text-sm text-gray-400">Years Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}

