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

    function drawAnimatedRCB() {
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
      const radius = Math.min(w, h) * 0.35;
      const cornerRadius = radius * 0.25;

      // ===== Background Pulse + Glow =====
      ctx.save();
      const pulse = 1 + Math.sin(t * 0.9) * 0.08;
      ctx.globalAlpha = 1 * pulse * 0.95;
      
      // Main rounded rectangle background
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy - radius + cornerRadius);
      ctx.lineTo(cx - radius, cy + radius - cornerRadius);
      ctx.quadraticCurveTo(cx - radius, cy + radius, cx - radius + cornerRadius, cy + radius);
      ctx.lineTo(cx + radius - cornerRadius, cy + radius);
      ctx.quadraticCurveTo(cx + radius, cy + radius, cx + radius, cy + radius - cornerRadius);
      ctx.lineTo(cx + radius, cy - radius + cornerRadius);
      ctx.quadraticCurveTo(cx + radius, cy - radius, cx + radius - cornerRadius, cy - radius);
      ctx.lineTo(cx - radius + cornerRadius, cy - radius);
      ctx.quadraticCurveTo(cx - radius, cy - radius, cx - radius, cy - radius + cornerRadius);
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      grad.addColorStop(0, '#EC1C24');
      grad.addColorStop(0.5, '#990000');
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.fill();

      // Glow effect
      ctx.strokeStyle = `rgba(255, 107, 107, ${0.5 * pulse})`;
      ctx.lineWidth = 8 * pulse;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();

      // ===== Inner Highlight =====
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - radius + 2, cy - radius + cornerRadius + 2);
      ctx.lineTo(cx - radius + 2, cy + radius - cornerRadius - 2);
      ctx.quadraticCurveTo(cx - radius + 2, cy + radius - 2, cx - radius + cornerRadius + 2, cy + radius - 2);
      ctx.lineTo(cx + radius - cornerRadius - 2, cy + radius - 2);
      ctx.quadraticCurveTo(cx + radius - 2, cy + radius - 2, cx + radius - 2, cy + radius - cornerRadius - 2);
      ctx.lineTo(cx + radius - 2, cy - radius + cornerRadius + 2);
      ctx.quadraticCurveTo(cx + radius - 2, cy - radius + 2, cx + radius - cornerRadius - 2, cy - radius + 2);
      ctx.lineTo(cx - radius + cornerRadius + 2, cy - radius + 2);
      ctx.quadraticCurveTo(cx - radius + 2, cy - radius + 2, cx - radius + 2, cy - radius + cornerRadius + 2);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // ===== Rotating Outer Ring =====
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.12);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = `rgba(255, 215, 0, 0.3)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ===== Crown with Animated Jewels =====
      ctx.save();
      
      // Crown body with rotation
      const crownRotate = Math.sin(t * 0.75) * 0.05;
      ctx.translate(cx, cy - radius * 0.35);
      ctx.rotate(crownRotate);
      ctx.translate(-cx, -(cy - radius * 0.35));

      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.5, cy - radius * 0.1);
      ctx.lineTo(cx - radius * 0.3, cy - radius * 0.55);
      ctx.lineTo(cx - radius * 0.1, cy - radius * 0.2);
      ctx.lineTo(cx, cy - radius * 0.7);
      ctx.lineTo(cx + radius * 0.1, cy - radius * 0.2);
      ctx.lineTo(cx + radius * 0.3, cy - radius * 0.55);
      ctx.lineTo(cx + radius * 0.5, cy - radius * 0.1);
      ctx.closePath();

      // Crown gradient
      const crownGrad = ctx.createLinearGradient(cx - radius * 0.5, cy - radius * 0.7, cx + radius * 0.5, cy - radius * 0.1);
      crownGrad.addColorStop(0, '#FFE66D');
      crownGrad.addColorStop(1, '#FFD700');
      ctx.fillStyle = crownGrad;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Crown jewels
      const jewelPositions = [
        { x: cx - radius * 0.25, y: cy - radius * 0.35, size: 4 },
        { x: cx, y: cy - radius * 0.5, size: 5.5 },
        { x: cx + radius * 0.25, y: cy - radius * 0.35, size: 4 },
      ];

      jewelPositions.forEach((jewel, i) => {
        ctx.globalAlpha = 0.7 + Math.sin(t * 1.5 + i) * 0.3;
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(jewel.x, jewel.y, jewel.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // ===== RCB Text with Flicker =====
      ctx.save();
      ctx.globalAlpha = 1 + Math.sin(t * 1) * 0.05;
      ctx.font = `bold ${radius * 0.7}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = `rgba(255, 215, 0, ${0.6 + Math.sin(t * 1) * 0.3})`;
      ctx.shadowBlur = 10 + Math.sin(t * 1.2) * 5;
      ctx.fillText('RCB', cx, cy + radius * 0.3);
      ctx.restore();

      // ===== Corner Sparkles =====
      ctx.save();
      ctx.fillStyle = '#FFD700';
      const sparkles = [
        { x: cx - radius * 0.6, y: cy - radius * 0.6 },
        { x: cx + radius * 0.6, y: cy - radius * 0.6 },
        { x: cx - radius * 0.7, y: cy, },
        { x: cx + radius * 0.7, y: cy, },
      ];

      sparkles.forEach((spark, i) => {
        ctx.globalAlpha = 0.3 + (Math.sin(t * 1.5 + i * 0.5) * 0.4);
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 2 + Math.sin(t * 2 + i) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      ctx.restore();

      rafRef.current = requestAnimationFrame(drawAnimatedRCB);
    }

    rafRef.current = requestAnimationFrame(drawAnimatedRCB);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [width, height]);

  return <canvas ref={canvasRef} className={className} />;
}


