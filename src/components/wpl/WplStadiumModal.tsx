'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Compass,
  Droplets,
  Flame,
  Info,
  MapPin,
  Ruler,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { WplStadiumInfo } from '@/data/wplStadiums';

interface WplStadiumModalProps {
  stadium: WplStadiumInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WplStadiumModal({ stadium, isOpen, onClose }: WplStadiumModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined' || !stadium) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${stadium.officialName} stadium information`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#080D1D] text-white shadow-[0_32px_100px_rgba(0,0,0,0.85)]"
          >
            {/* Top Stadium Photography Hero */}
            <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-slate-900">
              <img
                src={stadium.image}
                alt={stadium.officialName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D1D] via-[#080D1D]/55 to-slate-950/35" />

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close stadium guide"
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hero Overlay Info */}
              <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    {stadium.shortName} • Official WPL Venue
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">
                    {stadium.officialName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    {stadium.alternateName} • {stadium.city}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-xs font-bold text-sky-200 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>{stadium.wpl2027Leg}</span>
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* 4 Headline Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Capacity
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1 tabular-nums">
                    {stadium.capacityNumeric}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{stadium.established}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Pitch Soil
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-200 mt-1">
                    {stadium.pitch.soilType}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">True T20 carry</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Avg 1st Inns
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-300 mt-1 tabular-nums">
                    {stadium.pitch.avgFirstInnings}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">WPL / T20 par score</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Droplets className="w-3.5 h-3.5 text-indigo-400" />
                    Dew Effect
                  </div>
                  <div className="text-sm font-black text-white mt-1">High Evening Dew</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {stadium.pitch.chaseAdvantage}
                  </div>
                </div>
              </div>

              {/* Pitch Analysis + Boundary Schematic */}
              <div className="grid grid-cols-1 md:grid-cols-[1.25fr_0.9fr] gap-5">
                {/* Pitch Report */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-300" />
                      Pitch &amp; Conditions Report
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">7:30 PM IST Conditions</span>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <p>
                      <strong className="text-white">Surface:</strong> {stadium.pitch.surfaceSummary}
                    </p>
                    <p>
                      <strong className="text-white">Batting:</strong> {stadium.pitch.battingVerdict}
                    </p>
                    <p>
                      <strong className="text-white">Pace &amp; Spin:</strong> {stadium.pitch.paceAndSpin}
                    </p>
                    <p>
                      <strong className="text-white">Dew Factor:</strong> {stadium.pitch.dewFactor}
                    </p>
                  </div>

                  {/* Pace vs Spin Split Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-sky-300">Pace Share ({stadium.pitch.paceSharePct}%)</span>
                      <span className="text-amber-300">Spin Share ({stadium.pitch.spinSharePct}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${stadium.pitch.paceSharePct}%` }}
                      />
                      <div className="h-full bg-amber-400 flex-1" />
                    </div>
                  </div>
                </div>

                {/* Ground & Boundary Dimensions Visual */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-emerald-400" />
                      Ground Dimensions
                    </h3>
                  </div>

                  {/* Minimal Clean SVG Cricket Oval */}
                  <div className="relative mx-auto w-full max-w-[230px] aspect-[4/3] flex items-center justify-center">
                    <svg viewBox="0 0 240 180" className="w-full h-full">
                      <ellipse
                        cx="120"
                        cy="90"
                        rx="105"
                        ry="78"
                        fill="rgba(16, 185, 129, 0.14)"
                        stroke="rgba(52, 211, 153, 0.45)"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                      <ellipse
                        cx="120"
                        cy="90"
                        rx="56"
                        ry="42"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.22)"
                        strokeWidth="1.2"
                      />
                      {/* Central Pitch Strip */}
                      <rect
                        x="114"
                        y="67"
                        width="12"
                        height="46"
                        rx="2"
                        fill={stadium.id === 'mumbai-cci' ? '#B45309' : '#D97706'}
                        stroke="#FDE68A"
                        strokeWidth="1"
                      />
                      <text
                        x="120"
                        y="26"
                        textAnchor="middle"
                        fill="#E2E8F0"
                        fontSize="10"
                        fontWeight="700"
                      >
                        Straight: {stadium.dimensions.straight}
                      </text>
                      <text
                        x="120"
                        y="162"
                        textAnchor="middle"
                        fill="#CBD5E1"
                        fontSize="9.5"
                        fontWeight="700"
                      >
                        Behind Sq: {stadium.dimensions.behindSquare}
                      </text>
                      <text
                        x="120"
                        y="94"
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="9"
                        fontWeight="800"
                      >
                        Sq: {stadium.dimensions.square}
                      </text>
                    </svg>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1 border-t border-white/10 pt-3">
                    <div>
                      <strong className="text-white">Outfield:</strong> {stadium.dimensions.outfield}
                    </div>
                    <div>
                      <strong className="text-white">Operator:</strong> {stadium.operator}
                    </div>
                  </div>
                </div>
              </div>

              {/* WPL 2027 Schedule & Venue Milestones */}
              <div className="rounded-2xl border border-white/10 bg-indigo-950/25 p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-300" />
                    WPL 2027 Window &amp; Venue Milestones
                  </h3>
                  <span className="text-xs font-bold text-amber-300">{stadium.wpl2027MatchesSummary}</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {stadium.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
