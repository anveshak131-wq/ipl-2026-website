"use client";

import React, { useEffect, useRef } from 'react';

interface RCBLionProps {
  width?: number;
  height?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export default function RCBLion({ width = 400, height = 400, className }: RCBLionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    function createParticles(cx: number, cy: number, count: number, color: string) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 0.5 + Math.random() * 1.5;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 40 + Math.random() * 40,
          size: 1 + Math.random() * 2.5,
          color: color,
        });
      }
    }

    function updateParticles() {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }
    }

    function drawParticles(ctx: CanvasRenderingContext2D) {
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = (p.life / p.maxLife) * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawAnimatedRCB() {
      const w = width;
      const h = height;
      tRef.current += 1;
      const t = tRef.current / 10;

      let entranceScale = 1;
      if (tRef.current <= 60) {
        const progress = tRef.current / 60;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        entranceScale = progress < 1 ? (c3 * progress * progress * progress - c1 * progress * progress) : 1;
      }

      ctx.clearRect(0, 0, w, h);

      if (tRef.current % 15 === 0) {
        createParticles(w * 0.25, h * 0.5, 3, '#FFE66D');
        createParticles(w * 0.75, h * 0.5, 3, '#FF6B6B');
      }

      updateParticles();

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-w / 2, -h / 2);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.35;
      const cornerRadius = radius * 0.25;

      // MULTI-LAYER GLOW
      ctx.save();
      const pulse1 = 1 + Math.sin(t * 0.7) * 0.12;
      const pulse2 = 1 + Math.sin(t * 1.1) * 0.08;
      
      ctx.globalAlpha = 0.3 * pulse1;
      ctx.fillStyle = '#8B0000';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.2, cy - radius * 0.8 + cornerRadius);
      ctx.lineTo(cx - radius * 1.2, cy + radius * 0.8 - cornerRadius);
      ctx.quadraticCurveTo(cx - radius * 1.2, cy + radius * 0.8, cx - radius * 1.2 + cornerRadius, cy + radius * 0.8);
      ctx.lineTo(cx + radius * 1.2 - cornerRadius, cy + radius * 0.8);
      ctx.quadraticCurveTo(cx + radius * 1.2, cy + radius * 0.8, cx + radius * 1.2, cy + radius * 0.8 - cornerRadius);
      ctx.lineTo(cx + radius * 1.2, cy - radius * 0.8 + cornerRadius);
      ctx.quadraticCurveTo(cx + radius * 1.2, cy - radius * 0.8, cx + radius * 1.2 - cornerRadius, cy - radius * 0.8);
      ctx.lineTo(cx - radius * 1.2 + cornerRadius, cy - radius * 0.8);
      ctx.quadraticCurveTo(cx - radius * 1.2, cy - radius * 0.8, cx - radius * 1.2, cy - radius * 0.8 + cornerRadius);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.5 * pulse2;
      ctx.fillStyle = '#EC1C24';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.05, cy - radius * 0.7 + cornerRadius);
      ctx.lineTo(cx - radius * 1.05, cy + radius * 0.7 - cornerRadius);
      ctx.quadraticCurveTo(cx - radius * 1.05, cy + radius * 0.7, cx - radius * 1.05 + cornerRadius, cy + radius * 0.7);
      ctx.lineTo(cx + radius * 1.05 - cornerRadius, cy + radius * 0.7);
      ctx.quadraticCurveTo(cx + radius * 1.05, cy + radius * 0.7, cx + radius * 1.05, cy + radius * 0.7 - cornerRadius);
      ctx.lineTo(cx + radius * 1.05, cy - radius * 0.7 + cornerRadius);
      ctx.quadraticCurveTo(cx + radius * 1.05, cy - radius * 0.7, cx + radius * 1.05 - cornerRadius, cy - radius * 0.7);
      ctx.lineTo(cx - radius * 1.05 + cornerRadius, cy - radius * 0.7);
      ctx.quadraticCurveTo(cx - radius * 1.05, cy - radius * 0.7, cx - radius * 1.05, cy - radius * 0.7 + cornerRadius);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();

      // ANIMATED BACKGROUND
      ctx.save();
      const bgPulse = 1 + Math.sin(t * 1.2) * 0.06;
      const bgScale = 1 + Math.sin(t * 0.8) * 0.04;
      ctx.translate(cx, cy);
      ctx.scale(bgScale * bgPulse, bgScale * bgPulse);
      ctx.translate(-cx, -cy);

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

      const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      const gradShift = Math.sin(t * 0.5) * 0.1;
      grad.addColorStop(Math.max(0, 0.1 + gradShift), '#EC1C24');
      grad.addColorStop(0.5, '#990000');
      grad.addColorStop(Math.min(1, 0.9 - gradShift), '#660000');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 107, 107, ${0.4 + Math.sin(t * 1.5) * 0.3})`;
      ctx.lineWidth = 3 + Math.sin(t * 0.9) * 1.5;
      ctx.stroke();

      ctx.restore();

      // INNER SHIMMER
      ctx.save();
      ctx.strokeStyle = `rgba(255, 200, 200, ${0.2 + Math.sin(t * 2) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - radius + 3, cy - radius + cornerRadius + 3);
      ctx.lineTo(cx - radius + 3, cy + radius - cornerRadius - 3);
      ctx.quadraticCurveTo(cx - radius + 3, cy + radius - 3, cx - radius + cornerRadius + 3, cy + radius - 3);
      ctx.lineTo(cx + radius - cornerRadius - 3, cy + radius - 3);
      ctx.quadraticCurveTo(cx + radius - 3, cy + radius - 3, cx + radius - 3, cy + radius - cornerRadius - 3);
      ctx.lineTo(cx + radius - 3, cy - radius + cornerRadius + 3);
      ctx.quadraticCurveTo(cx + radius - 3, cy - radius + 3, cx + radius - cornerRadius - 3, cy - radius + 3);
      ctx.lineTo(cx - radius + cornerRadius + 3, cy - radius + 3);
      ctx.quadraticCurveTo(cx - radius + 3, cy - radius + 3, cx - radius + 3, cy - radius + cornerRadius + 3);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // ROTATING RINGS
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.25);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.25 + Math.sin(t * 1.8) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.12);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 + Math.sin(t * 1.3 + Math.PI / 2) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.08);
      ctx.translate(-cx, -cy);
      const ringPulse = 1 + Math.sin(t * 0.6) * 0.1;
      ctx.strokeStyle = `rgba(255, 107, 107, ${0.2 * ringPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.1 * ringPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // CROWN
      ctx.save();
      const crownRotate = Math.sin(t * 0.6) * 0.08;
      const crownTilt = Math.sin(t * 0.4) * 0.04;
      ctx.translate(cx, cy - radius * 0.35);
      ctx.rotate(crownRotate + crownTilt);
      ctx.translate(-cx, -(cy - radius * 0.35));

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.5, cy - radius * 0.08);
      ctx.lineTo(cx - radius * 0.3, cy - radius * 0.53);
      ctx.lineTo(cx - radius * 0.1, cy - radius * 0.18);
      ctx.lineTo(cx, cy - radius * 0.68);
      ctx.lineTo(cx + radius * 0.1, cy - radius * 0.18);
      ctx.lineTo(cx + radius * 0.3, cy - radius * 0.53);
      ctx.lineTo(cx + radius * 0.5, cy - radius * 0.08);
      ctx.closePath();
      ctx.translate(0, 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.5, cy - radius * 0.1);
      ctx.lineTo(cx - radius * 0.3, cy - radius * 0.55);
      ctx.lineTo(cx - radius * 0.1, cy - radius * 0.2);
      ctx.lineTo(cx, cy - radius * 0.7);
      ctx.lineTo(cx + radius * 0.1, cy - radius * 0.2);
      ctx.lineTo(cx + radius * 0.3, cy - radius * 0.55);
      ctx.lineTo(cx + radius * 0.5, cy - radius * 0.1);
      ctx.closePath();

      const crownGrad = ctx.createLinearGradient(cx - radius * 0.5, cy - radius * 0.7, cx + radius * 0.5, cy - radius * 0.1);
      crownGrad.addColorStop(0, '#FFFFFF');
      crownGrad.addColorStop(0.3, '#FFE66D');
      crownGrad.addColorStop(0.7, '#FFD700');
      crownGrad.addColorStop(1, '#FFA500');
      ctx.fillStyle = crownGrad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(t * 1.4) * 0.4})`;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(t * 2.2) * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const jewelPositions = [
        { x: cx - radius * 0.25, y: cy - radius * 0.35, size: 4, speed: 1.5 },
        { x: cx, y: cy - radius * 0.5, size: 5.5, speed: 1.8 },
        { x: cx + radius * 0.25, y: cy - radius * 0.35, size: 4, speed: 1.5 },
      ];

      jewelPositions.forEach((jewel, i) => {
        const jewelPulse = 1 + Math.sin(t * jewel.speed + i * 0.7) * 0.4;
        ctx.globalAlpha = 0.7 + Math.sin(t * jewel.speed + i * 0.8) * 0.35;
        
        ctx.fillStyle = `rgba(255, 230, 109, ${0.6 * jewelPulse})`;
        ctx.beginPath();
        ctx.arc(jewel.x, jewel.y, jewel.size * 2.5 * jewelPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(jewel.x, jewel.y, jewel.size * jewelPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(jewel.x - jewel.size * 0.3 * jewelPulse, jewel.y - jewel.size * 0.3 * jewelPulse, jewel.size * 0.5 * jewelPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.restore();

      // TEXT
      ctx.save();
      ctx.globalAlpha = 1 + Math.sin(t * 1.2) * 0.08;
      
      const textScale = 1 + Math.sin(t * 0.8) * 0.04;
      ctx.translate(cx, cy + radius * 0.35);
      ctx.scale(textScale, textScale);
      ctx.translate(-cx, -(cy + radius * 0.35));

      ctx.font = `900 ${radius * 0.65}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(t * 1.6) * 0.2})`;
      ctx.globalAlpha = 0.4;
      ctx.fillText('RCB', cx, cy + radius * 0.35);

      ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(t * 1.3) * 0.3})`;
      ctx.globalAlpha = 0.6;
      ctx.fillText('RCB', cx, cy + radius * 0.35);

      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 1;
      ctx.shadowColor = `rgba(255, 215, 0, ${0.7 + Math.sin(t * 1.4) * 0.3})`;
      ctx.shadowBlur = 15 + Math.sin(t * 1.2) * 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText('RCB', cx, cy + radius * 0.35);

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 3; i++) {
        const sparkleOffset = Math.sin(t * 2 + i) * 8;
        ctx.globalAlpha = 0.3 + Math.sin(t * 2.5 + i * 0.7) * 0.4;
        ctx.fillText('RCB', cx + sparkleOffset, cy + radius * 0.35);
      }

      ctx.restore();

      // GLOW POINTS
      ctx.save();
      ctx.fillStyle = '#FFD700';
      const glowPoints = [
        { x: cx - radius * 0.6, y: cy - radius * 0.6 },
        { x: cx + radius * 0.6, y: cy - radius * 0.6 },
        { x: cx - radius * 0.7, y: cy },
        { x: cx + radius * 0.7, y: cy },
        { x: cx, y: cy + radius * 0.65 },
      ];

      glowPoints.forEach((point, i) => {
        const pointPulse = 0.4 + Math.sin(t * 2 + i * 0.6) * 0.5;
        ctx.globalAlpha = pointPulse;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pointPulse})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 + Math.sin(t * 1.8 + i) * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5 + Math.sin(t * 2.5 + i) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      drawParticles(ctx);

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


