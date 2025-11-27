'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiAnimationProps {
  trigger?: boolean;
  duration?: number;
  particleCount?: number;
}

export default function ConfettiAnimation({
  trigger = false,
  duration = 3000,
  particleCount = 50,
}: ConfettiAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle array
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }> = [];

    // Colors for confetti
    const colors = ['#fbbf24', '#3b82f6', '#a78bfa', '#10b981', '#ef4444'];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 3,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      });
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (progress < 1) {
        // Update and draw particles
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.2; // gravity
          particle.life -= 1 / (duration / 16);

          if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        requestAnimationFrame(animate);
      } else {
        // Clear canvas when done
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trigger, duration, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
}
