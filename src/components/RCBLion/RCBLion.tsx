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

      // Gradient
      const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
      grad.addColorStop(0, '#FF6B35');
      grad.addColorStop(0.5, '#EC1C24');
      grad.addColorStop(1, '#CC1818');

      // Shield path
      const top = -s / 2;
      const bottom = s / 2;
      const left = -s / 2.5;
      const right = s / 2.5;

      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(right, -s / 4.5);
      ctx.lineTo(right * 1.1, bottom / 2);
      ctx.quadraticCurveTo(0, bottom + s / 4, -right * 1.1, bottom / 2);
      ctx.lineTo(left, -s / 4.5);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.95;
      ctx.fill();

      // Inner highlight
      ctx.strokeStyle = 'rgba(255, 229, 229, 0.4)';
      ctx.lineWidth = 2;
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
      const shieldRotation = t * 0.15;
      const shieldSize = Math.min(w, h) * 0.28;
      drawShield(ctx, cx, cy, shieldSize, 1, shieldRotation);

      // Accent chevron (animated opacity pulse)
      ctx.save();
      ctx.beginPath();
      const chevronY = cy - shieldSize * 0.15;
      const chevronW = shieldSize * 0.4;
      ctx.moveTo(cx - chevronW, chevronY);
      ctx.lineTo(cx, chevronY + chevronW * 0.6);
      ctx.lineTo(cx + chevronW, chevronY);
      ctx.strokeStyle = '#FFD24D';
      ctx.lineWidth = Math.max(3, shieldSize * 0.12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.7 + Math.sin(t * 1.2) * 0.2;
      ctx.stroke();
      ctx.restore();

      // RCB Text - animated scale
      ctx.save();
      const textScale = 0.9 + Math.sin(t * 0.6) * 0.08;
      ctx.translate(cx, cy + shieldSize * 0.1);
      ctx.scale(textScale, textScale);
      ctx.font = `900 ${shieldSize * 1.4}px Inter, Arial, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.fillText('RCB', 0, 0);
      ctx.restore();

      // Accent dots (orbiting)
      ctx.save();
      ctx.fillStyle = '#FFD24D';
      for (let i = 0; i < 2; i++) {
        const a = shieldRotation + (i * Math.PI);
        const r = shieldSize * 0.75;
        const dotX = cx + Math.cos(a) * r;
        const dotY = cy + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(dotX, dotY, shieldSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Rotating frame (subtle reference circle)
      ctx.save();
      ctx.strokeStyle = `rgba(236, 28, 36, ${0.15 * (1 + Math.sin(t * 0.4) * 0.5)})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, shieldSize * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Corner sparkles
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + t * 0.3 * (i % 2 ? 1 : -1);
        const r = shieldSize * 0.95;
        const sx = cx + Math.cos(angle) * r;
        const sy = cy + Math.sin(angle) * r;
        const sparkleSize = shieldSize * (0.04 + (i % 2) * 0.02);
        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
      }
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

