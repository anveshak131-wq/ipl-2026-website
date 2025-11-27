'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Zap, TrendingUp } from 'lucide-react';

export default function ModernHeroSection() {
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
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ipl-gold/30 bg-ipl-gold/5 mb-8 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Zap className="w-4 h-4 text-ipl-gold animate-pulse" />
            <span className="text-sm font-semibold text-ipl-gold">IPL 2026 - Live Now</span>
          </div>

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
              { label: 'Teams', value: '10' },
              { label: 'Matches', value: '74' },
              { label: 'Players', value: '500+' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur">
                <div className="text-2xl md:text-3xl font-bold text-ipl-gold mb-1">{stat.value}</div>
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
