'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Play, Zap, TrendingUp, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Match } from '@/types';
import CountdownTimer from '@/components/ui/CountdownTimer';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface ModernHeroSectionProps {
  matches?: Match[];
  nextMatch?: Match | null;
  liveMatchCount?: number;
  enableVideoBackground?: boolean;
  videoUrl?: string;
}

export default function ModernHeroSection({ 
  matches = [], 
  nextMatch = null,
  liveMatchCount = 0,
  enableVideoBackground = false,
  videoUrl = ''
}: ModernHeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950">
      {/* Video Background (optional) */}
      {enableVideoBackground && videoUrl && (
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-blue-950/60 to-slate-950/80" />
        </div>
      )}
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${-mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl opacity-10" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ipl-gold/30 bg-ipl-gold/5 transition-all duration-700 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Zap className="w-4 h-4 text-ipl-gold animate-pulse" />
              <span className="text-sm font-semibold text-ipl-gold">IPL 2026</span>
            </div>
            
            {/* Live Match Count Badge */}
            {liveMatchCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/50 bg-red-500/20"
              >
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">
                  <AnimatedCounter value={liveMatchCount} /> Live Match{liveMatchCount > 1 ? 'es' : ''}
                </span>
              </motion.div>
            )}
          </div>
          
          {/* Next Match Countdown */}
          {nextMatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/20"
            >
              <p className="text-sm text-gray-400 mb-2">Next Match</p>
              <p className="text-lg font-bold text-white mb-3">
                {nextMatch.team1.shortName} vs {nextMatch.team2.shortName}
              </p>
              <CountdownTimer targetDate={nextMatch.date} />
            </motion.div>
          )}

          {/* Main heading */}
          <h1
            className={`text-5xl md:text-7xl font-black mb-6 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #60a5fa 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Cricket Redefined
          </h1>

          {/* Subheading */}
          <p
            className={`text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Experience the ultimate IPL 2026 platform with live scores, real-time updates, expert predictions, and
            immersive fan engagement.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link
              href="/live-score"
              className="group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ipl-gold to-yellow-400 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative flex items-center justify-center gap-2 text-black">
                <Play className="w-5 h-5" />
                Watch Live
              </div>
            </Link>

            <Link
              href="/matches"
              className="group relative px-8 py-4 rounded-xl font-bold text-lg border border-white/20 hover:border-ipl-gold/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-ipl-gold/10 rounded-xl transition-colors" />
              <div className="relative flex items-center justify-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                View Schedule
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-4 md:gap-8 transition-all duration-700 delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {[
              { label: 'Teams', value: 10 },
              { label: 'Matches', value: 74 },
              { label: 'Players', value: 500, suffix: '+' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur">
                <div className="text-2xl md:text-3xl font-bold text-ipl-gold mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} />
                </div>
                <div className="text-xs md:text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-ipl-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
