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
  const entranceCompleteRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    function drawShield(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, scale: number, rotation: number) {
      const s = size * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Premium gradient shield
      const gradMain = ctx.createLinearGradient(-s / 2.2, -s / 2.2, s / 2.2, s / 2.2);
      gradMain.addColorStop(0, '#FF5722');
      gradMain.addColorStop(0.4, '#EC1C24');
      gradMain.addColorStop(0.8, '#D91F1F');
      gradMain.addColorStop(1, '#A31820');

      // Shield body - refined pentagonal shape
      const top = -s / 2;
      const bottom = s / 2.2;
      const left = -s / 2.4;
      const right = s / 2.4;

      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(right, -s / 5);
      ctx.lineTo(right * 1.05, bottom * 0.7);
      ctx.bezierCurveTo(right * 0.7, bottom + s * 0.08, 0, bottom + s * 0.12, -right * 0.7, bottom + s * 0.08);
      ctx.lineTo(-right * 1.05, bottom * 0.7);
      ctx.lineTo(left, -s / 5);
      ctx.closePath();

      ctx.fillStyle = gradMain;
      ctx.fill();

      // Inner shadow for depth
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Highlight edge
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

      // Entrance animation: scale + pop (first 40 frames)
      let entranceScale = 1;
      if (tRef.current <= 40) {
        entranceScale = Math.min(1, (tRef.current / 40) * 1.2);
        if (tRef.current === 40) entranceCompleteRef.current = true;
      }

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Apply entrance scale
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-w / 2, -h / 2);

      const cx = w / 2;
      const cy = h / 2;

      // Pulsing background glow
      const pulse = 1 + Math.sin(t * 0.8) * 0.04;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = `rgba(236, 28, 36, ${0.06 * pulse})`;
      ctx.arc(cx, cy, Math.min(w, h) * 0.55 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main rotating shield
      const shieldRotation = t * 0.12;
      const shieldSize = Math.min(w, h) * 0.32;
      drawShield(ctx, cx, cy, shieldSize, 1, shieldRotation);

      // Vertical accent line (center stripe with glow)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - shieldSize * 0.5);
      ctx.lineTo(cx, cy + shieldSize * 0.5);
      ctx.strokeStyle = '#FFD24D';
      ctx.lineWidth = shieldSize * 0.08;
      ctx.globalAlpha = 0.6 + Math.sin(t * 0.8) * 0.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      // Top accent - animated V shape
      ctx.save();
      ctx.beginPath();
      const accentTop = cy - shieldSize * 0.35;
      const accentW = shieldSize * 0.25;
      ctx.moveTo(cx - accentW, accentTop);
      ctx.lineTo(cx, accentTop + accentW * 0.8);
      ctx.lineTo(cx + accentW, accentTop);
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = shieldSize * 0.06;
      ctx.globalAlpha = 0.5 + Math.sin(t * 1.5) * 0.35;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      // Bottom accent - three dots in arc
      ctx.save();
      ctx.fillStyle = '#FFD24D';
      for (let i = 0; i < 3; i++) {
        const angle = Math.PI * 0.3 + (i * Math.PI * 0.2);
        const dotR = shieldSize * 0.3;
        const dotX = cx + Math.cos(angle - Math.PI / 2) * dotR;
        const dotY = cy + shieldSize * 0.25 + Math.sin(angle - Math.PI / 2) * dotR * 0.5;
        ctx.beginPath();
        ctx.globalAlpha = 0.4 + (Math.sin(t * 1.2 + i) * 0.35);
        ctx.arc(dotX, dotY, shieldSize * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Subtle pulsing outer ring
      ctx.save();
      const ringPulse = 1 + Math.sin(t * 0.6) * 0.06;
      ctx.strokeStyle = `rgba(255, 210, 77, ${0.3 * ringPulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.arc(cx, cy, shieldSize * 1.25 * ringPulse, 0, Math.PI * 2);
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

