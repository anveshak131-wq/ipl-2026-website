"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  className?: string;
  minSize?: number;
  maxSize?: number;
}

export default function RCBLionLogo({ className, minSize = 40, maxSize = 800 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<number>(minSize);

  // Measure container so the canvas scales nicely inside any parent
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(rect.width, rect.height || rect.width || minSize);
      const clamped = Math.max(minSize, Math.min(maxSize, Math.round(s)));
      const scaled = clamped; // fill the container for a slightly larger logo
      setSize(scaled);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minSize, maxSize]);

  // Draw a static lion crest using the HTML canvas API (no glow, no crown)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = size;
    const h = size;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;
    const cornerRadius = radius * 0.25;

    // Helper to draw a rounded-rect crest
    const drawRoundedRect = (r: number, cr: number) => {
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r + cr);
      ctx.lineTo(cx - r, cy + r - cr);
      ctx.quadraticCurveTo(cx - r, cy + r, cx - r + cr, cy + r);
      ctx.lineTo(cx + r - cr, cy + r);
      ctx.quadraticCurveTo(cx + r, cy + r, cx + r, cy + r - cr);
      ctx.lineTo(cx + r, cy - r + cr);
      ctx.quadraticCurveTo(cx + r, cy - r, cx + r - cr, cy - r);
      ctx.lineTo(cx - r + cr, cy - r);
      ctx.quadraticCurveTo(cx - r, cy - r, cx - r, cy - r + cr);
      ctx.closePath();
    };

    // Crest background (static gradient, no pulsing)
    drawRoundedRect(radius, cornerRadius);
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, '#EC1C24');
    grad.addColorStop(0.5, '#B00000');
    grad.addColorStop(1, '#111111');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner border
    const innerR = radius * 0.8;
    const innerCR = innerR * 0.25;
    drawRoundedRect(innerR, innerCR);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lion + mane (stylised, no crown)
    ctx.save();
    ctx.translate(cx, cy - radius * 0.1);
    ctx.scale(0.7, 0.7);

    // Left mane arcs
    ctx.beginPath();
    ctx.moveTo(-48, -6);
    ctx.bezierCurveTo(-72, -6, -84, -24, -84, -40);
    ctx.bezierCurveTo(-84, -68, -56, -72, -36, -60);
    ctx.bezierCurveTo(-24, -54, -8, -64, 0, -58);
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Right mane arcs
    ctx.beginPath();
    ctx.moveTo(48, -6);
    ctx.bezierCurveTo(72, -6, 84, -24, 84, -40);
    ctx.bezierCurveTo(84, -68, 56, -72, 36, -60);
    ctx.bezierCurveTo(24, -54, 8, -64, 0, -58);
    ctx.strokeStyle = '#EC1C24';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Lower flowing mane
    ctx.beginPath();
    ctx.moveTo(-60, 6);
    ctx.bezierCurveTo(-84, 10, -94, 30, -86, 48);
    ctx.bezierCurveTo(-74, 78, -44, 86, -20, 76);
    ctx.bezierCurveTo(-6, 70, 4, 84, 0, 76);
    ctx.strokeStyle = '#E68E2B';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Lion face silhouette
    ctx.beginPath();
    ctx.moveTo(-32, 10);
    ctx.bezierCurveTo(-32, -18, -6, -34, 0, -36);
    ctx.bezierCurveTo(6, -34, 34, -18, 34, 10);
    ctx.bezierCurveTo(34, 38, 20, 56, 0, 60);
    ctx.bezierCurveTo(-20, 56, -32, 38, -32, 10);
    ctx.closePath();
    ctx.fillStyle = '#111111';
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.ellipse(-10, -2, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(10, -2, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose / muzzle
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.bezierCurveTo(-2, 12, 2, 12, 4, 8);
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // RCB letters near the bottom of the crest
    ctx.font = `900 ${radius * 0.6}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('RCB', cx, cy + radius * 0.5);
  }, [size]);

  const canvasSize = Math.max(28, size);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="w-full h-full flex items-center justify-center animate-float hover:scale-105 transition-transform duration-700">
        <canvas
          ref={canvasRef}
          style={{ width: canvasSize, height: canvasSize, display: 'block' }}
        />
      </div>
    </div>
  );
}
