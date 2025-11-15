"use client";

import React, { useEffect, useRef } from 'react';

interface RCBLionProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function RCBLion({ width = 400, height = 400, className }: RCBLionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    function draw() {
      const w = width;
      const h = height;
      tRef.current += 1;
      const t = tRef.current;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Center
      const cx = w / 2;
      const cy = h / 2 - 20;

      // Pulsing background circle
      const pulse = 1 + Math.sin(t * 0.06) * 0.06;
      const bgRadius = Math.min(w, h) * 0.22 * pulse;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = '#EC1C24';
      ctx.globalAlpha = 1;
      ctx.arc(cx, cy - 20, bgRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Glow behind face
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.fillStyle = '#FDD08D';
      ctx.arc(cx, cy + 10, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mane - Outer hair layer (darker)
      ctx.save();
      ctx.fillStyle = '#D4900F';
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mane - Hair texture with individual strands
      ctx.save();
      ctx.strokeStyle = '#C97F0F';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      
      // Top mane strands
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const startX = cx + Math.cos(angle) * 70;
        const startY = cy + 10 + Math.sin(angle) * 70;
        const endX = cx + Math.cos(angle) * 95;
        const endY = cy + 10 + Math.sin(angle) * 95;
        const controlX = cx + Math.cos(angle + 0.3) * 85;
        const controlY = cy + 10 + Math.sin(angle + 0.3) * 85;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
      }
      ctx.restore();

      // Mane - lighter inner layer
      ctx.save();
      ctx.fillStyle = '#F8C97E';
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Face circle
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = '#FDD08D';
      ctx.arc(cx, cy + 10, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes
      ctx.save();
      ctx.fillStyle = '#1B1B1B';
      ctx.beginPath();
      ctx.arc(cx - 25, cy - 5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 25, cy - 5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Nose
      ctx.save();
      ctx.fillStyle = '#3B2720';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 12);
      ctx.quadraticCurveTo(cx, cy + 22, cx + 8, cy + 12);
      ctx.quadraticCurveTo(cx, cy + 18, cx - 8, cy + 12);
      ctx.fill();
      ctx.restore();

      // Mouth
      ctx.save();
      ctx.strokeStyle = '#3B2720';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 28);
      ctx.quadraticCurveTo(cx, cy + 40, cx + 20, cy + 28);
      ctx.stroke();
      ctx.restore();

      // Crown (simple)
      ctx.save();
      ctx.fillStyle = '#FFD24D';
      ctx.beginPath();
      const crownW = 120;
      const crownX = cx - crownW / 2;
      const crownY = cy - 92;
      ctx.rect(crownX + 10, crownY + 18, crownW - 20, 12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(crownX + 20, crownY + 18);
      ctx.lineTo(crownX + 40, crownY - 10);
      ctx.lineTo(crownX + 60, crownY + 18);
      ctx.lineTo(crownX + 80, crownY - 6);
      ctx.lineTo(crownX + 100, crownY + 18);
      ctx.fill();
      ctx.restore();

      // Sparkles
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const sparkleCount = 5;
      for (let i = 0; i < sparkleCount; i++) {
        const a = (i / sparkleCount) * Math.PI * 2 + (t * 0.02 * (i % 2 ? 1 : -1));
        const sx = cx + Math.cos(a) * (bgRadius * 0.7);
        const sy = cy - 40 + Math.sin(a) * (bgRadius * 0.35);
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [width, height]);

  return <canvas ref={canvasRef} className={className} />;
}
