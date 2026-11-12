'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Info, MapPin, Users } from 'lucide-react';
import { resolveWplStadium } from '@/data/wplStadiums';
import WplStadiumModal from './WplStadiumModal';

interface WplStadiumTriggerProps {
  venue?: string | null;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  iconClassName?: string;
}

export default function WplStadiumTrigger({
  venue,
  children,
  className = '',
  showIcon = true,
  iconClassName = 'w-3.5 h-3.5 text-sky-400 shrink-0',
}: WplStadiumTriggerProps) {
  const stadium = resolveWplStadium(venue);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clearTimers = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  useEffect(() => clearTimers, []);

  if (!stadium) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {showIcon && <MapPin className={iconClassName} />}
        <span>{children ?? venue ?? 'TBA'}</span>
      </span>
    );
  }

  const updatePopoverPosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 310;
    const estimatedHeight = 225;
    const placeAbove = rect.bottom + estimatedHeight > window.innerHeight - 16 && rect.top > estimatedHeight;
    const rawLeft = rect.left + rect.width / 2 - cardWidth / 2;
    const clampedLeft = Math.max(12, Math.min(rawLeft, window.innerWidth - cardWidth - 12));
    const top = placeAbove ? rect.top - 10 : rect.bottom + 10;
    setPopoverCoords({ top, left: clampedLeft, above: placeAbove });
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      updatePopoverPosition();
      setIsHovered(true);
    }, 110);
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  const openModal = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimers();
    setIsHovered(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openModal(e);
        }}
        title={`${stadium.officialName} — Hover or click for pitch, capacity & stadium guide`}
        className={`inline-flex items-center gap-1.5 cursor-pointer underline decoration-dotted decoration-sky-400/60 underline-offset-4 hover:text-white transition-colors ${className}`}
      >
        {showIcon && <MapPin className={iconClassName} />}
        <span>{children ?? venue}</span>
        <Info className="w-3 h-3 opacity-70 text-amber-300 shrink-0" />
      </span>

      {/* Floating Hover Preview Card (Portaled outside overflow-hidden containers) */}
      {typeof document !== 'undefined' &&
        isHovered &&
        popoverCoords &&
        !isModalOpen &&
        createPortal(
          <div
            onMouseEnter={() => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
            onClick={openModal}
            style={{
              position: 'fixed',
              top: popoverCoords.top,
              left: popoverCoords.left,
              transform: popoverCoords.above ? 'translateY(-100%)' : 'translateY(0)',
              width: 310,
              zIndex: 110,
            }}
            className="cursor-pointer rounded-2xl border border-white/20 bg-[#0A1024]/98 p-3.5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <img
                src={stadium.image}
                alt={stadium.officialName}
                className="w-16 h-14 rounded-xl object-cover border border-white/15 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {stadium.shortName}
                </div>
                <div className="text-sm font-black text-white truncate">{stadium.officialName}</div>
                <div className="text-[11px] text-slate-400 truncate">{stadium.city}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-slate-400 font-semibold">
                  <Users className="w-3 h-3 text-sky-400" />
                  Capacity
                </div>
                <div className="font-black text-white mt-0.5">{stadium.capacityNumeric}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-slate-400 font-semibold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Avg 1st Inns
                </div>
                <div className="font-black text-emerald-300 mt-0.5">
                  {stadium.pitch.avgFirstInnings}
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] text-slate-300 leading-snug line-clamp-2">
              <strong className="text-white">{stadium.pitch.soilType}:</strong>{' '}
              {stadium.pitch.surfaceSummary}
            </p>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-sky-300">
              <span>Boundaries: {stadium.dimensions.straight} straight</span>
              <span>Click for full guide →</span>
            </div>
          </div>,
          document.body
        )}

      <WplStadiumModal
        stadium={stadium}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
