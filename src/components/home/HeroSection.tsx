'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';
import IPLLogo from '../ui/IPLLogo';

export default function HeroSection() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const highlights = [
    {
      id: 1,
      title: 'IPL 2026',
      subtitle: 'THE BIGGEST CRICKET FESTIVAL',
      tagline: 'Experience the Thrills. Chase the Glory.',
      stats: { teams: '10', matches: '74', cities: '12' },
      gradient: 'from-orange-600 via-red-600 to-pink-600',
      accentColor: '#F97316'
    },
    {
      id: 2,
      title: 'ELITE SQUADS',
      subtitle: 'WORLD-CLASS TALENT ASSEMBLY',
      tagline: 'Watch cricket legends battle on the biggest stage.',
      stats: { players: '200+', nations: '15+', records: '∞' },
      gradient: 'from-blue-600 via-purple-600 to-indigo-700',
      accentColor: '#3B82F6'
    },
    {
      id: 3,
      title: 'EPIC MOMENTS',
      subtitle: 'HIGH-OCTANE CRICKET ACTION',
      tagline: 'Last-ball finishes. Record-breaking performances.',
      stats: { matches: '74', venues: '12', fans: '500M+' },
      gradient: 'from-purple-600 via-pink-600 to-red-600',
      accentColor: '#A855F7'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlights.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [highlights.length, isLoading]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMounted) {
        const x = e.clientX / (typeof window !== 'undefined' ? window.innerWidth : 1);
        const y = e.clientY / (typeof window !== 'undefined' ? window.innerHeight : 1);
        setMousePosition({ x, y });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMounted]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentHighlight = highlights[currentSlide];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentHighlight.gradient} opacity-25 transition-all duration-1000 blur-3xl scale-150`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.15)_25%,rgba(255,255,255,0.15)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.15)_75%,rgba(255,255,255,0.15)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.15)_25%,rgba(255,255,255,0.15)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.15)_75%,rgba(255,255,255,0.15)_76%,transparent_77%,transparent)] bg-[length:60px_60px]" />
      </div>

      {/* Floating Orbs with Mouse Parallax */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 transition-all duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentHighlight.accentColor}80, transparent)`,
          top: isMounted ? `${20 + mousePosition.y * 10}%` : '20%',
          left: isMounted ? `${70 + mousePosition.x * 10}%` : '70%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15 transition-all duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentHighlight.accentColor}60, transparent)`,
          bottom: isMounted ? `${10 - mousePosition.y * 10}%` : '10%',
          left: isMounted ? `${20 - mousePosition.x * 10}%` : '20%',
          transform: 'translate(-50%, 50%)'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 h-full min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-10 animate-fade-in">
              {/* Live Badge */}
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl px-5 py-3 rounded-full border border-white/20 shadow-xl hover:scale-105 transition-transform duration-300 cursor-default">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-bold text-white tracking-wider">SEASON 2026 • LIVE</span>
              </div>

              {/* Highlight Media Panel */}
              <div className="relative mt-6">
                <div className="h-48 sm:h-56 md:h-64 w-full rounded-3xl bg-gradient-to-br from-sky-500/30 via-indigo-500/40 to-purple-600/30 backdrop-blur-2xl border border-white/15 shadow-[0_40px_120px_rgba(15,23,42,0.9)] overflow-hidden animate-scale-in">
                  <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.3),transparent_55%)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                </div>
                <div className="absolute -top-3 left-6 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-gray-200 uppercase">
                  SportsUP18 • Season 2026
                </div>
              </div>

              {/* Main Headline - Ultra Bold Typography */}
              <div className="space-y-4">
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tighter animate-slide-up"
                    style={{
                      textShadow: `0 0 80px ${currentHighlight.accentColor}60, 0 0 40px ${currentHighlight.accentColor}40`,
                      background: `linear-gradient(135deg, #fff 0%, ${currentHighlight.accentColor} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  {currentHighlight.title}
                </h1>
                <p className="text-2xl md:text-3xl font-bold text-gray-300 tracking-wider">
                  {currentHighlight.subtitle}
                </p>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl">
                  {currentHighlight.tagline}
                </p>
              </div>

              {/* Stats Grid - Modern Cards */}
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(currentHighlight.stats).map(([key, value], index) => (
                  <div 
                    key={key}
                    className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-6 py-5 rounded-2xl border border-white/20 hover:border-white/40 hover:scale-110 transition-all duration-300 cursor-default shadow-xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                         style={{ background: `linear-gradient(135deg, ${currentHighlight.accentColor}, transparent)` }} />
                    <p className="text-3xl md:text-4xl font-black relative z-10" 
                       style={{ color: currentHighlight.accentColor }}>
                      {value}
                    </p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1 relative z-10">
                      {key}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons - Premium Design */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => router.push('/matches')}
                  className="group relative overflow-hidden rounded-xl font-black text-lg px-10 py-5 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 50%, #E5E7EB 100%)',
                    boxShadow: '0 10px 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    color: '#000',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2)';
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent)',
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-3 font-black tracking-tight">
                    EXPLORE MATCHES
                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                
                <button 
                  onClick={() => router.push('/teams')}
                  className="group relative overflow-hidden rounded-xl font-black text-lg py-5 px-10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent)',
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-3 font-black tracking-tight">
                    VIEW TEAMS
                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* Right Visual - SportsUP18 Orbital Logo Panel */}
            <div className="relative h-[500px] lg:h-[600px] flex items-center justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              {/* Glow Effects */}
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
                   style={{ background: `radial-gradient(circle, ${currentHighlight.accentColor}, transparent)` }} />
              
              {/* Central Visual Element */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Rotating Ring */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20" />
                </div>
                
                {/* Center Badge - SportsUP18 Logo */}
                <div className="relative group">
                  <div
                    className="absolute inset-0 bg-gradient-to-br rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-700"
                    style={{
                      background: `conic-gradient(from 0deg, ${currentHighlight.accentColor}, transparent, ${currentHighlight.accentColor})`,
                    }}
                  />
                  <div className="relative w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-blur-2xl rounded-full border border-white/20 flex items-center justify-center shadow-[0_40px_120px_rgba(15,23,42,0.9)] transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 animate-glow-pulse">
                    <div className="flex flex-col items-center gap-4 animate-scale-in">
                      <div className="w-24 h-24 md:w-28 md:h-28 drop-shadow-2xl">
                        <IPLLogo size="lg" animated />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-400">Season</p>
                        <p className="text-4xl md:text-5xl font-black text-white tracking-tight">2026</p>
                      </div>
                      <div className="h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-sky-400 via-ipl-gold to-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Floating Stats Pills */}
                <div className="absolute top-10 right-10 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-xl animate-float">
                  <p className="text-sm font-bold text-white">🏆 10 TEAMS</p>
                </div>
                <div className="absolute bottom-20 left-10 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                  <p className="text-sm font-bold text-white">🔥 74 MATCHES</p>
                </div>
                <div className="absolute top-1/2 -right-5 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                  <p className="text-sm font-bold text-white">⚡ LIVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Navigation Dots */}
          <div className="flex justify-center gap-3 mt-16">
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index 
                    ? 'w-12 h-3' 
                    : 'w-3 h-3 hover:scale-150'
                }`}
                style={{
                  background: currentSlide === index 
                    ? `linear-gradient(to right, ${currentHighlight.accentColor}, ${currentHighlight.accentColor}80)` 
                    : 'rgba(255, 255, 255, 0.3)',
                  boxShadow: currentSlide === index 
                    ? `0 0 20px ${currentHighlight.accentColor}80` 
                    : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
