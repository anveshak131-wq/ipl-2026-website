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
      const t = tRef.current / 10;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Center
      const cx = w / 2;
      const cy = h / 2 - Math.round(Math.min(w, h) * 0.05);

      // Subtle head bob for life
      const headBob = Math.sin(t * 0.8) * (Math.min(w, h) * 0.004);

      // Pulsing background circle (outer)
      const pulse = 1 + Math.sin(t * 0.9) * 0.04;
      const bgRadius = Math.min(w, h) * 0.22 * pulse;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = '#EC1C24';
      ctx.globalAlpha = 1;
      ctx.arc(cx, cy - Math.round(Math.min(w, h) * 0.06), bgRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer ring glow (soft)
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,180,180,${0.06 + Math.sin(t * 1.2) * 0.02})`;
      ctx.arc(cx, cy - Math.round(Math.min(w, h) * 0.06), bgRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mane silhouette - animated with subtle radial waves
      ctx.save();
      const maneOuter = Math.min(w, h) * 0.36;
      const maneInner = maneOuter * 0.78;
      ctx.fillStyle = '#C96A12';
      ctx.beginPath();
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const r = maneOuter + Math.sin(t * 1.2 + i) * (maneOuter * 0.02);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r + headBob * 8;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Inner mane
      ctx.save();
      ctx.fillStyle = '#F8C97E';
      ctx.beginPath();
      ctx.arc(cx, cy, maneInner, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Face (smaller, centered)
      ctx.save();
      const faceR = Math.min(w, h) * 0.14;
      ctx.beginPath();
      ctx.fillStyle = '#FDD08D';
      ctx.arc(cx, cy - headBob * 0.5, faceR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes - angry slits with tiny glint
      ctx.save();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.max(2, Math.round(faceR * 0.12));
      ctx.lineCap = 'round';
      const eyeOffsetX = faceR * 0.55;
      const eyeY = cy - faceR * 0.2 - headBob;
      ctx.beginPath();
      ctx.moveTo(cx - eyeOffsetX - 6, eyeY - 2);
      ctx.quadraticCurveTo(cx - eyeOffsetX + 2, eyeY - 8, cx - eyeOffsetX + 18, eyeY - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + eyeOffsetX + 6, eyeY - 2);
      ctx.quadraticCurveTo(cx + eyeOffsetX - 2, eyeY - 8, cx + eyeOffsetX - 18, eyeY - 2);
      ctx.stroke();
      ctx.restore();

      // Eyebrows - slanted intense
      ctx.save();
      ctx.strokeStyle = '#6b3e26';
      ctx.lineWidth = Math.max(3, Math.round(faceR * 0.12));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - faceR * 0.95, eyeY - faceR * 0.25);
      ctx.lineTo(cx - faceR * 0.25, eyeY - faceR * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + faceR * 0.95, eyeY - faceR * 0.25);
      ctx.lineTo(cx + faceR * 0.25, eyeY - faceR * 0.05);
      ctx.stroke();
      ctx.restore();

      // Nose
      ctx.save();
      ctx.fillStyle = '#5A2F25';
      ctx.beginPath();
      ctx.moveTo(cx - faceR * 0.16, cy + faceR * 0.05);
      ctx.quadraticCurveTo(cx, cy + faceR * 0.42, cx + faceR * 0.16, cy + faceR * 0.05);
      ctx.quadraticCurveTo(cx, cy + faceR * 0.22, cx - faceR * 0.16, cy + faceR * 0.05);
      ctx.fill();
      ctx.restore();

      // Mouth - snarl + small teeth lines
      ctx.save();
      ctx.strokeStyle = '#5A2F25';
      ctx.lineWidth = Math.max(2, Math.round(faceR * 0.08));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - faceR * 0.42, cy + faceR * 0.42);
      ctx.quadraticCurveTo(cx, cy + faceR * 0.58, cx + faceR * 0.42, cy + faceR * 0.42);
      ctx.stroke();
      // Snarl lines
      ctx.beginPath();
      ctx.moveTo(cx - faceR * 0.14, cy + faceR * 0.36);
      ctx.lineTo(cx - faceR * 0.14, cy + faceR * 0.52);
      ctx.moveTo(cx + faceR * 0.14, cy + faceR * 0.36);
      ctx.lineTo(cx + faceR * 0.14, cy + faceR * 0.52);
      ctx.stroke();
      ctx.restore();

      // Crown with sparkle - animate small rotating sparkle above crown
      ctx.save();
      const crownW = faceR * 2.2;
      const crownX = cx - crownW / 2;
      const crownY = cy - faceR * 2.2;
      ctx.fillStyle = '#FFD24D';
      ctx.beginPath();
      ctx.rect(crownX + crownW * 0.04, crownY + crownW * 0.12, crownW * 0.92, crownW * 0.12);
      ctx.fill();
      // crown points
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const px = crownX + 8 + i * (crownW * 0.22);
        const py = crownY + crownW * -0.12;
        ctx.moveTo(px, crownY + crownW * 0.12);
        ctx.lineTo(px + crownW * 0.08, py);
        ctx.lineTo(px + crownW * 0.16, crownY + crownW * 0.12);
      }
      ctx.fill();
      ctx.restore();

      // Crown sparkle (rotating)
      ctx.save();
      const sparkleA = t * 0.9;
      const sx = cx + Math.cos(sparkleA) * faceR * 0.9;
      const sy = crownY + crownW * -0.24 + Math.sin(sparkleA * 1.3) * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.6, faceR * 0.06), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Small sparkles around mane
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.4 * (i % 2 ? 1 : -1);
        const r = maneOuter * (0.72 + (i % 2) * 0.06);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r * 0.8 + Math.sin(t * 0.6 + i) * 2;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, faceR * 0.04), 0, Math.PI * 2);
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
