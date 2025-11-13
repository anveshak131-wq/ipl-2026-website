'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';
import IPLLogo from '../ui/IPLLogo';

export default function HeroSection() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const highlights = [
    {
      id: 1,
      title: 'IPL 2026',
      subtitle: 'The Biggest Cricket Festival',
      tagline: 'Experience the Thrills. Chase the Glory.',
      image: '/hero/ipl-2026.jpg',
      cta: 'Explore Now',
      gradient: 'from-blue-600 via-purple-500 to-pink-500'
    },
    {
      id: 2,
      title: 'Elite Players',
      subtitle: 'World-Class Talent',
      tagline: 'Watch legends battle on the biggest stage.',
      image: '/hero/players.jpg',
      cta: 'View Teams',
      gradient: 'from-purple-600 via-blue-500 to-cyan-500'
    },
    {
      id: 3,
      title: 'Epic Moments',
      subtitle: 'High-Octane Action',
      tagline: 'Last-ball finishes. Record-breaking performances.',
      image: '/hero/action.jpg',
      cta: 'Check Schedule',
      gradient: 'from-orange-500 via-red-500 to-pink-600'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlights.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [highlights.length, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${highlights[currentSlide].gradient} opacity-20 transition-all duration-1000`} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
        </div>

        {/* Animated Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="order-2 md:order-1 space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">Live Cricket Action</span>
              </div>

              {/* Main Title */}
              <div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                  {highlights[currentSlide].title}
                </h1>
                <p className="text-xl text-gray-200 mb-2">
                  {highlights[currentSlide].subtitle}
                </p>
                <p className="text-lg text-gray-400">
                  {highlights[currentSlide].tagline}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-sm px-4 py-4 rounded-lg border border-white/10">
                  <p className="text-2xl font-bold text-ipl-gold">10</p>
                  <p className="text-sm text-gray-400">Teams</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm px-4 py-4 rounded-lg border border-white/10">
                  <p className="text-2xl font-bold text-ipl-gold">70+</p>
                  <p className="text-sm text-gray-400">Matches</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm px-4 py-4 rounded-lg border border-white/10">
                  <p className="text-2xl font-bold text-ipl-gold">2026</p>
                  <p className="text-sm text-gray-400">Season</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => router.push('/matches')}
                  className="ipl-button text-lg px-8 py-4 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-ipl-gold/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  {highlights[currentSlide].cta}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button 
                  onClick={() => router.push('/teams')}
                  className="glass-effect text-white font-bold py-4 px-8 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20 cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Visual Element */}
            <div className="order-1 md:order-2 relative h-96 md:h-full flex items-center justify-center">
              {/* Glow effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-ipl-blue-light/30 to-ipl-gold/30 rounded-[3rem] blur-3xl animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tl from-ipl-purple/20 to-ipl-blue-dark/20 rounded-[3rem] blur-2xl" />
              
              {/* Main Panel */}
              <div className="relative group">
                <div className="w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] rounded-[2.5rem] border-2 border-white/20 backdrop-blur-md overflow-hidden shadow-2xl relative transition-all duration-500 hover:scale-105 hover:border-white/30">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ipl-blue-dark/80 via-ipl-purple/60 to-ipl-gold/70 animate-gradient-shift" />
                  
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" 
                       style={{
                         backgroundSize: '200% 200%',
                         animation: 'shimmer 3s linear infinite'
                       }} />
                  
                  {/* Content */}
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                    {/* Logo with float animation */}
                    <div className="mb-8 animate-float">
                      <IPLLogo size="xl" animated={true} className="scale-125 sm:scale-150 md:scale-[1.8]" />
                    </div>
                    
                    {/* Text */}
                    <div className="text-center space-y-2">
                      <p className="text-white font-black text-3xl md:text-4xl tracking-wider drop-shadow-lg bg-gradient-to-r from-white via-ipl-gold to-white bg-clip-text text-transparent animate-glow">
                        IPL 2026
                      </p>
                      <div className="flex items-center justify-center gap-2 text-ipl-gold/80 text-sm font-semibold">
                        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-ipl-gold" />
                        <span className="animate-pulse">SEASON 19</span>
                        <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-ipl-gold" />
                      </div>
                    </div>

                    {/* Decorative corner accents */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-ipl-gold/50 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-ipl-gold/50 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-ipl-gold/50 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-ipl-gold/50 rounded-br-xl" />
                  </div>
                </div>
                
                {/* Orbiting elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-ipl-gold/20 rounded-full blur-xl animate-ping" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-ipl-blue-light/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'bg-ipl-gold w-8 h-2'
                  : 'bg-white/30 hover:bg-white/50 w-2 h-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce-slow">
        <svg
          className="w-6 h-6 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  );
}
