'use client';

import { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  primaryColor: string;
  secondaryColor: string;
  particleCount?: number;
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ParticleBackground({
  primaryColor,
  secondaryColor,
  particleCount = 50,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = getPrefersReducedMotion();

    // Set canvas size
    let width = 0;
    let height = 0;
    let dpr = 1;
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Parse hex colors to RGB
    const hexToRgb = (hex: string) => {
      const cleaned = String(hex || '').trim().replace('#', '');
      if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        if ([r, g, b].some((v) => Number.isNaN(v))) return { r: 255, g: 255, b: 255 };
        return { r, g, b };
      }
      const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleaned);
      if (!result) return { r: 255, g: 255, b: 255 };
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    };

    const color1 = hexToRgb(primaryColor);
    const color2 = hexToRgb(secondaryColor);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: { r: number; g: number; b: number };
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 1;
        this.speedX = reducedMotion ? 0 : Math.random() * 0.45 - 0.225;
        this.speedY = reducedMotion ? 0 : Math.random() * 0.45 - 0.225;
        // Mix colors
        const mixRatio = Math.random();
        this.color = {
          r: Math.floor(color1.r * mixRatio + color2.r * (1 - mixRatio)),
          g: Math.floor(color1.g * mixRatio + color2.g * (1 - mixRatio)),
          b: Math.floor(color1.b * mixRatio + color2.b * (1 - mixRatio)),
        };
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
      }

      draw() {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const effectiveCount = reducedMotion ? Math.min(14, particleCount) : particleCount;
    for (let i = 0; i < effectiveCount; i++) {
      particles.push(new Particle());
    }

    const maxDistance = 110;
    const maxDistanceSq = maxDistance * maxDistance;

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles (kept subtle for performance)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < maxDistanceSq) {
            const opacity = (1 - Math.sqrt(distanceSq) / maxDistance) * 0.16;
            ctx.strokeStyle = `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    if (reducedMotion) {
      drawFrame();
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }

    // Animation loop (throttled)
    let animationFrame: number;
    let running = true;
    let lastTime = 0;
    const frameInterval = 1000 / 30;

    const tick = (time: number) => {
      if (!running) return;
      if (time - lastTime >= frameInterval) {
        lastTime = time;
        drawFrame();
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      running = !document.hidden;
      if (running) {
        lastTime = 0;
        animationFrame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    animationFrame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrame);
    };
  }, [primaryColor, secondaryColor, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
