'use client';

import { motion } from 'framer-motion';
import { Trophy, Calendar, Award } from 'lucide-react';
import { Team } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface TeamHistoryTimelineProps {
  team: Team;
  primaryColor: string;
}

export default function TeamHistoryTimeline({ team, primaryColor }: TeamHistoryTimelineProps) {
  const trophies = team.trophies || [];
  const foundedYear = 2008; // IPL started in 2008, adjust per team if needed

  // Create timeline events
  const timelineEvents = [
    {
      year: foundedYear,
      type: 'founded' as const,
      title: 'Team Founded',
      description: `${team.name} was established as part of the inaugural IPL season.`,
    },
    ...trophies.map((trophy) => ({
      year: trophy.year,
      type: 'trophy' as const,
      title: trophy.name,
      description: `${team.shortName} won the ${trophy.name} in ${trophy.year}.`,
    })),
  ].sort((a, b) => b.year - a.year);

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No history available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-8 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: `${primaryColor}40` }}
      />

      <div className="space-y-8">
        {timelineEvents.map((event, index) => (
          <motion.div
            key={`${event.year}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-6"
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-900"
                style={{
                  backgroundColor: event.type === 'trophy' ? primaryColor : `${primaryColor}60`,
                  boxShadow: `0 0 20px ${primaryColor}40`,
                }}
              >
                {event.type === 'trophy' ? (
                  <Trophy className="w-6 h-6 text-white" />
                ) : (
                  <Calendar className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-2xl font-black"
                  style={{ color: primaryColor }}
                >
                  {event.year}
                </span>
                {event.type === 'trophy' && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <CustomEmoji type="trophy" size={12} />
                    Champion
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{event.title}</h4>
              <p className="text-sm text-gray-300">{event.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

