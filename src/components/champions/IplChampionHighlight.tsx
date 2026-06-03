'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, Crown, Sparkles, Star, Trophy } from 'lucide-react';
import { IPL_REIGNING_CHAMPION } from '@/lib/reigningChampion';

type IplChampionHighlightProps = {
  variant?: 'hero' | 'compact' | 'pill';
  align?: 'left' | 'center';
  className?: string;
  showLinks?: boolean;
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function IplChampionHighlight({
  variant = 'compact',
  align = 'left',
  className = '',
  showLinks = true,
}: IplChampionHighlightProps) {
  const isCentered = align === 'center';
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const mirroredPointerX = useTransform(pointerX, (value) => 100 - value);
  const mirroredPointerY = useTransform(pointerY, (value) => 100 - value);
  const rotateX = useSpring(useTransform(pointerY, [0, 100], [7, -7]), {
    stiffness: 140,
    damping: 22,
    mass: 0.45,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 100], [-7, 7]), {
    stiffness: 140,
    damping: 22,
    mass: 0.45,
  });

  const spotlight = useMotionTemplate`
    radial-gradient(circle at ${pointerX}% ${pointerY}%, rgba(241, 169, 72, 0.22), transparent 30%),
    radial-gradient(circle at ${mirroredPointerX}% ${mirroredPointerY}%, rgba(52, 118, 128, 0.18), transparent 34%)
  `;

  const shimmerShift = prefersReducedMotion ? '0%' : isHovered ? '100%' : '0%';

  const summaryText =
    variant === 'hero'
      ? `${IPL_REIGNING_CHAMPION.teamShortName} closed IPL ${IPL_REIGNING_CHAMPION.season} on top and carry the crown forward.`
      : `${IPL_REIGNING_CHAMPION.teamShortName} carry the IPL crown.`;

  const containerClasses =
    variant === 'hero'
      ? 'rounded-[32px] border border-[#b58646]/28 px-6 py-6 md:px-7 md:py-7 shadow-[0_24px_90px_rgba(3,10,14,0.55)]'
      : 'rounded-[28px] border border-[#b58646]/24 px-4 py-4 md:px-5 md:py-5 shadow-[0_18px_55px_rgba(3,10,14,0.42)]';

  const titleClasses =
    variant === 'hero'
      ? 'text-2xl md:text-[2rem] font-black tracking-[-0.03em] text-[#f7eed9]'
      : 'text-lg md:text-[1.35rem] font-black tracking-[-0.03em] text-[#f7eed9]';

  const summaryClasses =
    variant === 'hero'
      ? 'max-w-2xl text-sm md:text-[15px] leading-7 text-[#d8d2c2]'
      : 'max-w-xl text-sm leading-6 text-[#cbc4b4]';

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || variant === 'pill') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const nextY = ((event.clientY - bounds.top) / bounds.height) * 100;

    pointerX.set(Math.max(0, Math.min(100, nextX)));
    pointerY.set(Math.max(0, Math.min(100, nextY)));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    pointerX.set(50);
    pointerY.set(50);
  };

  if (variant === 'pill') {
    return (
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.02 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={joinClasses(
          'relative inline-flex overflow-hidden rounded-full border border-[#c3924f]/28 bg-[linear-gradient(135deg,rgba(9,25,31,0.96),rgba(17,46,54,0.94),rgba(73,44,18,0.9))] px-3.5 py-1.5 shadow-[0_14px_30px_rgba(6,14,19,0.35)]',
          className
        )}
      >
        <span className="pointer-events-none absolute inset-0 opacity-80 [background:linear-gradient(120deg,transparent_15%,rgba(255,214,138,0.16)_50%,transparent_85%)]" />
        <span className="relative z-10 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#f4deae]">
          <Crown className="h-3.5 w-3.5 text-[#f0b24d]" />
          <span>{IPL_REIGNING_CHAMPION.teamShortName}</span>
          <span className="text-[#d6a769]/80">IPL {IPL_REIGNING_CHAMPION.season}</span>
        </span>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={joinClasses('group relative block overflow-hidden', containerClasses, className)}
      style={{
        background:
          'linear-gradient(145deg, rgba(8,19,24,0.98) 0%, rgba(12,34,41,0.96) 38%, rgba(43,29,17,0.92) 100%)',
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: spotlight }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.25))',
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 bg-[linear-gradient(100deg,transparent,rgba(255,221,162,0.18),transparent)] blur-2xl"
        animate={prefersReducedMotion ? undefined : { x: ['0%', '175%'] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(248,197,112,0.95),rgba(67,144,156,0.75),transparent)]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-5%] top-[-10%] h-40 w-40 rounded-full border border-[#d6a769]/16"
        animate={
          prefersReducedMotion
            ? undefined
            : { rotate: 360, scale: isHovered ? 1.04 : 1, opacity: isHovered ? 0.78 : 0.52 }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { rotate: { duration: 18, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.3 }, opacity: { duration: 0.3 } }
        }
      >
        <motion.div
          className="absolute inset-[18px] rounded-full border border-dashed border-[#4d8790]/24"
          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
          transition={prefersReducedMotion ? undefined : { duration: 22, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      <div
        className={joinClasses(
          'relative z-10 grid gap-5',
          variant === 'hero' ? 'md:grid-cols-[minmax(0,1fr)_220px] md:items-center' : 'md:grid-cols-[minmax(0,1fr)_180px] md:items-center'
        )}
      >
        <div className={joinClasses('min-w-0', isCentered && 'md:text-center')}>
          <motion.div
            className={joinClasses(
              'inline-flex items-center gap-2 rounded-full border border-[#c89552]/26 bg-[rgba(194,136,67,0.12)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#edc57f]',
              isCentered && 'mx-auto'
            )}
            animate={prefersReducedMotion ? undefined : { boxShadow: isHovered ? '0 0 0 1px rgba(237,197,127,0.12), 0 0 28px rgba(194,136,67,0.18)' : '0 0 0 1px rgba(237,197,127,0.04)' }}
            transition={{ duration: 0.25 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#f0b24d]" />
            Reigning Champions
          </motion.div>

          <div className={joinClasses('mt-4 flex gap-4', isCentered ? 'items-center md:justify-center' : 'items-start')}>
            <motion.div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-[#cb9756]/26 bg-[linear-gradient(160deg,rgba(177,110,44,0.24),rgba(14,38,45,0.65))] shadow-[inset_0_1px_0_rgba(255,223,162,0.12)]"
              animate={prefersReducedMotion ? undefined : { y: isHovered ? -2 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                aria-hidden="true"
                className="absolute inset-1 rounded-[16px] border border-[#f1c36b]/16"
                animate={prefersReducedMotion ? undefined : { opacity: [0.35, 0.65, 0.35] }}
                transition={prefersReducedMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Trophy className="relative z-10 h-7 w-7 text-[#f2bd56]" />
            </motion.div>

            <div className={joinClasses('min-w-0', isCentered && 'text-center')}>
              <div className={joinClasses('flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#8eb2b9]', isCentered && 'justify-center')}>
                <span>IPL {IPL_REIGNING_CHAMPION.season}</span>
                <span className="text-[#edc57f]">Gold Mark</span>
              </div>

              <h3 className={joinClasses('mt-2', titleClasses)}>{IPL_REIGNING_CHAMPION.teamName}</h3>

              <p className={joinClasses('mt-2', summaryClasses)}>{summaryText}</p>

              <div className={joinClasses('mt-4 flex flex-wrap gap-2', isCentered && 'justify-center')}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#c89552]/22 bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-semibold text-[#f3dfb8]">
                  <Crown className="h-3.5 w-3.5 text-[#f0b24d]" />
                  Defending champions
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#4d8790]/22 bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-semibold text-[#b7d1d5]">
                  <Star className="h-3.5 w-3.5 text-[#5fa9b4]" />
                  RCB • 2026
                </span>
              </div>
            </div>
          </div>

          {showLinks && (
            <div className={joinClasses('mt-5 flex flex-wrap gap-3', isCentered && 'justify-center')}>
              <Link
                href={IPL_REIGNING_CHAMPION.teamRoute}
                className="group/link relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-[#cf9d5e]/28 bg-[linear-gradient(135deg,rgba(180,112,44,0.22),rgba(27,64,73,0.2))] px-4 py-2.5 text-sm font-bold text-[#f8e8c6] transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,223,162,0.18)_50%,transparent_82%)] transition-transform duration-500 group-hover/link:translate-x-5"
                  style={{ transform: `translateX(${shimmerShift})` }}
                />
                <span className="relative z-10">Explore RCB</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5" />
              </Link>

              <Link
                href={IPL_REIGNING_CHAMPION.pointsTableRoute}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 text-sm font-bold text-[#d9dfdf] transition-all duration-200 hover:border-[#4d8790]/35 hover:bg-white/[0.075]"
              >
                Title race table
              </Link>
            </div>
          )}
        </div>

        <motion.div
          className={joinClasses(
            'relative ml-auto flex w-full max-w-[220px] flex-col justify-between overflow-hidden rounded-[26px] border border-[#c89552]/18 bg-[linear-gradient(180deg,rgba(19,46,55,0.84),rgba(8,16,20,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            isCentered && 'mr-auto md:mr-0'
          )}
          animate={prefersReducedMotion ? undefined : { y: isHovered ? -6 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(242,189,86,0.22),transparent_70%)]"
          />
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7ba3aa]">
              Champion Seal
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black tracking-[-0.06em] text-[#f3dfb8]">
                {IPL_REIGNING_CHAMPION.season}
              </span>
              <span className="pb-1 text-xs font-bold uppercase tracking-[0.22em] text-[#b88a4c]">
                Gold
              </span>
            </div>
          </div>

          <motion.div
            className="relative z-10 mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 px-3 py-3"
            animate={prefersReducedMotion ? undefined : { borderColor: isHovered ? 'rgba(240, 178, 77, 0.25)' : 'rgba(255,255,255,0.08)' }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#7ba3aa]">
                Club
              </div>
              <div className="mt-1 text-lg font-black text-[#f6ead0]">
                {IPL_REIGNING_CHAMPION.teamShortName}
              </div>
            </div>

            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#c89552]/22 bg-[rgba(184,138,76,0.14)]"
              animate={prefersReducedMotion ? undefined : { rotate: isHovered ? 8 : 0, scale: isHovered ? 1.04 : 1 }}
              transition={{ duration: 0.25 }}
            >
              <Crown className="h-5 w-5 text-[#f0b24d]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
