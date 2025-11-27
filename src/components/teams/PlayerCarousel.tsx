'use client';

import React, { useState, useEffect } from 'react';
import type { Player } from '@/types';

interface PlayerCarouselProps {
  players: Player[];
  teamName: string;
}

export default function PlayerCarousel({ players, teamName }: PlayerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || players.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % players.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [autoPlay, players.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % players.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + players.length) % players.length);
    setAutoPlay(false);
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No players available
      </div>
    );
  }

  const currentPlayer = players[currentIndex];

  return (
    <>
      <style>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .carousel-item {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
      <div className="space-y-6">
      {/* Main Player Display */}
      <div className="carousel-item bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Player Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-ipl-gold to-yellow-400 flex items-center justify-center text-6xl font-black text-black shadow-2xl">
              {currentPlayer.name.charAt(0)}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-grow space-y-4">
            <div>
              <h3 className="text-3xl font-black text-white mb-2">{currentPlayer.name}</h3>
              <p className="text-ipl-gold font-semibold">{currentPlayer.role || 'Player'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Matches</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Runs</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Wickets</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Avg</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-ipl-gold hover:bg-ipl-gold/90 text-black font-bold transition-all hover:scale-110 active:scale-95"
        >
          ←
        </button>

        {/* Carousel Indicators */}
        <div className="flex gap-2 flex-wrap justify-center">
          {players.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex % 5
                  ? 'bg-ipl-gold w-8'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
          {players.length > 5 && (
            <span className="text-gray-400 text-sm ml-2">+{players.length - 5}</span>
          )}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-ipl-gold hover:bg-ipl-gold/90 text-black font-bold transition-all hover:scale-110 active:scale-95"
        >
          →
        </button>
      </div>

      {/* Auto-play Toggle */}
      <button
        onClick={() => setAutoPlay(!autoPlay)}
        className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:border-white/30"
      >
        {autoPlay ? '⏸ Pause' : '▶ Play'} Auto-scroll
      </button>
      </div>
    </>
  );
}
