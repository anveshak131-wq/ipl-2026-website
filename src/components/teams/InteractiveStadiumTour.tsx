'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowRight, X } from 'lucide-react';
import { Team } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface InteractiveStadiumTourProps {
  team: Team;
  primaryColor: string;
  secondaryColor: string;
}

interface StadiumInfo {
  name: string;
  city: string;
  capacity: string;
  established: string;
  description: string;
  image?: string;
  features: string[];
}

// Mock stadium data - in production, this would come from team data
const getStadiumInfo = (teamId: string, homeGrounds?: string[]): StadiumInfo[] => {
  const stadiums: { [key: string]: StadiumInfo[] } = {
    '1': [
      {
        name: 'M. Chinnaswamy Stadium',
        city: 'Bangalore',
        capacity: '40,000',
        established: '1969',
        description:
          'One of the most iconic cricket stadiums in India, known for its electric atmosphere and passionate RCB fans.',
        features: ['Floodlights', 'Dugouts', 'VIP Boxes', 'Media Center', 'Fan Zone'],
      },
      {
        name: 'Shaheed Veer Narayan Singh International Cricket Stadium',
        city: 'New Raipur',
        capacity: 'N/A',
        established: 'N/A',
        description:
          'A modern international cricket venue used for hosting major fixtures and tournaments.',
        features: ['Modern Facilities', 'Practice Nets', 'VIP Boxes', 'Media Center'],
      },
    ],
    '2': [{
      name: 'Wankhede Stadium',
      city: 'Mumbai',
      capacity: '33,000',
      established: '1974',
      description: 'The fortress of Mumbai Indians, where they have won multiple championships. Known for its sea-facing location.',
      features: ['Sea View', 'Modern Facilities', 'VIP Lounges', 'Fan Park', 'Museum'],
    }],
    // Add more stadiums as needed
  };

  return (
    stadiums[teamId] ||
    (homeGrounds?.map((ground) => {
      const raw = String(ground || '').trim();
      const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
      const name = parts[0] || raw || 'Stadium';
      const city = parts.slice(1).join(', ') || 'Unknown';

      return {
        name,
        city,
        capacity: 'N/A',
        established: 'N/A',
        description: 'Official home stadium.',
        features: ['Standard Facilities'],
      };
    }) || [])
  );
};

export default function InteractiveStadiumTour({ team, primaryColor, secondaryColor }: InteractiveStadiumTourProps) {
  const [selectedStadium, setSelectedStadium] = useState<StadiumInfo | null>(null);
  const stadiums = getStadiumInfo(team.id.replace('team', ''), team.homeGrounds);

  if (stadiums.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No stadium information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
          Home Stadium{stadiums.length > 1 ? 's' : ''}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stadiums.map((stadium, index) => (
          <motion.div
            key={stadium.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setSelectedStadium(stadium)}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group overflow-hidden"
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
              }}
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">{stadium.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{stadium.city}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Capacity</div>
                  <div className="font-bold text-white">{stadium.capacity}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Established</div>
                  <div className="font-bold text-white">{stadium.established}</div>
                </div>
              </div>

              <p className="text-sm text-gray-300 mt-4 line-clamp-2">{stadium.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stadium Detail Modal */}
      <AnimatePresence>
        {selectedStadium && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedStadium(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-4 z-50 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/20 p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-white">{selectedStadium.name}</h3>
                <button
                  onClick={() => setSelectedStadium(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Stadium Image Placeholder */}
                <div
                  className="w-full h-64 rounded-xl overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-24 h-24 opacity-20" style={{ color: primaryColor }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Capacity</div>
                    <div className="text-2xl font-bold text-white">{selectedStadium.capacity}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">City</div>
                    <div className="text-lg font-bold text-white">{selectedStadium.city}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Established</div>
                    <div className="text-lg font-bold text-white">{selectedStadium.established}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Features</div>
                    <div className="text-lg font-bold text-white">{selectedStadium.features.length}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white mb-3">Description</h4>
                  <p className="text-gray-300 leading-relaxed">{selectedStadium.description}</p>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <CustomEmoji type="star" size={20} />
                    Key Features
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedStadium.features.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                      >
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
