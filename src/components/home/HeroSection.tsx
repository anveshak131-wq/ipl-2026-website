'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const highlights = [
    {
      id: 1,
      title: 'IPL 2026 Season',
      subtitle: 'The Biggest Cricket Festival is Back',
      image: '/hero/ipl-2026.jpg',
      description: 'Get ready for the most exciting cricket season with 10 teams competing for the prestigious trophy'
    },
    {
      id: 2,
      title: 'Star Players to Watch',
      subtitle: 'Legends in the Making',
      image: '/hero/players.jpg',
      description: 'Witness cricketing giants battle it out in the world\'s premier T20 league'
    },
    {
      id: 3,
      title: 'Epic Moments',
      subtitle: 'Unforgettable Action',
      image: '/hero/action.jpg',
      description: 'Experience thrilling matches, last-ball finishes, and record-breaking performances'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [highlights.length, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0">
        {highlights.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10" />
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 mb-6 animate-pulse-slow">
                <img 
                  src="/logos/ipl_logo_new.svg" 
                  alt="IPL 2026 logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                IPL 2026
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-6" />
            </div>

            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl text-white mb-4 animate-fade-in">
                {highlights[currentSlide].title}
              </h2>
              <p className="text-xl text-gray-200 mb-8 animate-fade-in-delay">
                {highlights[currentSlide].subtitle}
              </p>
              <p className="text-lg text-gray-300 mb-12 animate-fade-in-delay-2">
                {highlights[currentSlide].description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="ipl-button text-lg px-8 py-4">
                Explore Teams
              </button>
              <button className="glass-effect text-white font-bold py-4 px-8 rounded-lg hover:bg-white/20 transition-all duration-200 text-lg">
                View Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex space-x-2">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-ipl-gold w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-30 animate-bounce-slow">
        <svg
          className="w-6 h-6 text-white/50"
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
