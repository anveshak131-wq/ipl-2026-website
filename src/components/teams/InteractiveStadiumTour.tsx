'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowRight, X } from 'lucide-react';
import { Team } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';
import { createPortal } from 'react-dom';

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

function hexToRgba(raw: string, alpha: number): string {
  const value = String(raw || '').trim();
  const hex = value.startsWith('#') ? value : `#${value}`;
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return `rgba(124, 58, 237, ${alpha})`;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const raw = String(value).trim();
  return raw ? raw : '—';
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="text-white/70">{icon}</span>
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const stadiums = getStadiumInfo(team.id.replace('team', ''), team.homeGrounds);

  useEffect(() => {
    if (!selectedStadium) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedStadium(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStadium]);

  useEffect(() => {
    if (!selectedStadium) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedStadium]);

  const primary = useMemo(() => (String(primaryColor || '').trim() ? primaryColor : '#7C3AED'), [primaryColor]);
  const secondary = useMemo(
    () => (String(secondaryColor || '').trim() ? secondaryColor : primary),
    [secondaryColor, primary],
  );

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
          typeof document === 'undefined'
            ? null
            : createPortal(
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedStadium(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 18 }}
                    transition={{ duration: 0.18 }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed inset-3 z-50 mx-auto max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl md:inset-6"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-80"
                      style={{
                        background: `radial-gradient(900px circle at 10% 10%, ${hexToRgba(
                          primary,
                          0.22,
                        )}, transparent 55%), radial-gradient(900px circle at 90% 35%, ${hexToRgba(
                          secondary,
                          0.16,
                        )}, transparent 55%)`,
                      }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
                              style={{ boxShadow: `0 18px 40px ${hexToRgba(primary, 0.18)}` }}
                            >
                              <MapPin className="h-6 w-6" style={{ color: primary }} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-2xl md:text-3xl font-black text-white">
                                {selectedStadium.name}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-semibold">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {displayValue(selectedStadium.city)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-semibold">
                                  <Users className="h-3.5 w-3.5" />
                                  Capacity {displayValue(selectedStadium.capacity)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-semibold">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Est. {displayValue(selectedStadium.established)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          ref={closeButtonRef}
                          onClick={() => setSelectedStadium(null)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 transition-colors hover:bg-white/[0.08]"
                          aria-label="Close"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                          <Section title="Overview" icon={<CustomEmoji type="stadium" size={18} />}>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <MetricCard label="City" value={displayValue(selectedStadium.city)} />
                              <MetricCard label="Capacity" value={displayValue(selectedStadium.capacity)} />
                              <MetricCard label="Established" value={displayValue(selectedStadium.established)} />
                              <MetricCard label="Features" value={String(selectedStadium.features.length)} />
                            </div>
                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75 leading-relaxed">
                              {displayValue(selectedStadium.description)}
                            </div>
                          </Section>
                        </div>

                        <Section title="Key Features" icon={<CustomEmoji type="star" size={18} />}>
                          <div className="flex flex-wrap gap-2">
                            {(selectedStadium.features || []).map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/75"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </Section>
                      </div>
                    </div>
                  </motion.div>
                </>,
                document.body,
              )
        )}
      </AnimatePresence>
    </div>
  );
}
