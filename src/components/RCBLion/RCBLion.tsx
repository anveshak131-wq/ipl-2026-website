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

    function drawShield(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rotation: number) {
      const s = size;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Main gradient - rich crimsons
      const grad = ctx.createLinearGradient(-s / 2.2, -s / 2.2, s / 2.2, s / 2.2);
      grad.addColorStop(0, '#FF2D2D');
      grad.addColorStop(0.5, '#DC143C');
      grad.addColorStop(1, '#8B0000');

      // Shield path - pentagonal
      const top = -s / 2;
      const bottom = s / 2.2;
      const left = -s / 2.4;
      const right = s / 2.4;

      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(right, -s / 5);
      ctx.lineTo(right * 1.05, bottom * 0.7);
      ctx.bezierCurveTo(right * 0.7, bottom, 0, bottom + s * 0.08, -right * 0.7, bottom);
      ctx.lineTo(-right * 1.05, bottom * 0.7);
      ctx.lineTo(left, -s / 5);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();
      
      // Depth shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    function draw() {
      const w = width;
      const h = height;
      tRef.current += 1;
      const t = tRef.current / 10;

      // Entrance animation
      let entranceScale = 1;
      if (tRef.current <= 40) {
        entranceScale = Math.min(1, (tRef.current / 40) * 1.25);
      }

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-w / 2, -h / 2);

      const cx = w / 2;
      const cy = h / 2;
      const shieldSize = Math.min(w, h) * 0.35;

      // Outer decorative ring (pulsing)
      ctx.save();
      const ringPulse = 1 + Math.sin(t * 0.6) * 0.08;
      ctx.strokeStyle = `rgba(255, 210, 77, ${0.3 * ringPulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, shieldSize * 1.3 * ringPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Main shield (rotating)
      const shieldRotation = t * 0.1;
      drawShield(ctx, cx, cy, shieldSize, shieldRotation);

      // Central vertical power line (pulsing glow)
      ctx.save();
      ctx.globalAlpha = 0.65 + Math.sin(t * 0.8) * 0.2;
      const gradLine = ctx.createLinearGradient(0, cy - shieldSize * 0.5, 0, cy + shieldSize * 0.5);
      gradLine.addColorStop(0, '#FFE66D');
      gradLine.addColorStop(0.5, '#FFD24D');
      gradLine.addColorStop(1, '#FFE66D');
      ctx.strokeStyle = gradLine;
      ctx.lineWidth = shieldSize * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - shieldSize * 0.5);
      ctx.lineTo(cx, cy + shieldSize * 0.5);
      ctx.stroke();
      ctx.restore();

      // Top crown peak (animated)
      ctx.save();
      const crownBob = Math.sin(t * 0.7) * 2;
      ctx.beginPath();
      const crownTop = cy - shieldSize * 0.35;
      const crownW = shieldSize * 0.3;
      ctx.moveTo(cx - crownW, crownTop + crownBob);
      ctx.lineTo(cx, crownTop - shieldSize * 0.25 + crownBob);
      ctx.lineTo(cx + crownW, crownTop + crownBob);
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = shieldSize * 0.08;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.8 + Math.sin(t * 1.2) * 0.15;
      ctx.stroke();
      ctx.restore();

      // Upper jewels (crown accents)
      ctx.save();
      ctx.fillStyle = '#FFD24D';
      for (let i = 0; i < 2; i++) {
        const offset = i === 0 ? -1 : 1;
        const jx = cx + offset * shieldSize * 0.3;
        const jy = cy - shieldSize * 0.18;
        ctx.globalAlpha = 0.6 + Math.sin(t * 1.5 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(jx, jy, shieldSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Middle lightning accent (animated rotation)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.5) * 0.1);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = shieldSize * 0.07;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.6 + Math.sin(t * 1.3) * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx, cy - shieldSize * 0.1);
      ctx.lineTo(cx + shieldSize * 0.15, cy + shieldSize * 0.12);
      ctx.lineTo(cx - shieldSize * 0.1, cy + shieldSize * 0.28);
      ctx.lineTo(cx + shieldSize * 0.12, cy + shieldSize * 0.42);
      ctx.stroke();
      ctx.restore();

      // Bottom accent diamonds (pulsing)
      ctx.save();
      ctx.fillStyle = '#FFE66D';
      const positions = [
        [cx - shieldSize * 0.25, cy + shieldSize * 0.35],
        [cx, cy + shieldSize * 0.48],
        [cx + shieldSize * 0.25, cy + shieldSize * 0.35],
      ];
      positions.forEach((pos, i) => {
        ctx.globalAlpha = 0.5 + (Math.sin(t * 1.2 + i * 0.5) * 0.3);
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], shieldSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Inner crown arc (subtle animated breathe)
      ctx.save();
      const arcScale = 1 + Math.sin(t * 0.5) * 0.08;
      ctx.strokeStyle = '#FFD24D';
      ctx.lineWidth = shieldSize * 0.05;
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.9) * 0.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy - shieldSize * 0.15, shieldSize * 0.22 * arcScale, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

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


