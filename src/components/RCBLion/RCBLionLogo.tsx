"use client";

import React, { useEffect, useRef, useState } from 'react';
import RCBLion from './RCBLion';

interface Props {
  className?: string;
  minSize?: number;
  maxSize?: number;
}

export default function RCBLionLogo({ className, minSize = 40, maxSize = 800 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<number>(minSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(rect.width, rect.height || rect.width);
      const clamped = Math.max(minSize, Math.min(maxSize, Math.round(s)));
      // apply a default scale so the lion canvas leaves room for the label (slightly smaller)
      const scaled = Math.round(clamped * 0.68);
      setSize(scaled);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minSize, maxSize]);

  // canvasSize is the square pixels used for the canvas; label will sit below
  const canvasSize = Math.max(28, Math.round(size));

  return (
    <div ref={containerRef} className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Renders a canvas animation sized to container using measured pixels */}
      <div style={{ width: '100%', height: canvasSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RCBLion width={canvasSize} height={canvasSize} />
      </div>
      <div style={{ marginTop: 6, textAlign: 'center' }}>
        <span style={{ fontFamily: 'Inter, system-ui, Arial', fontWeight: 800, fontSize: Math.max(10, Math.round(canvasSize * 0.18)), color: '#EC1C24', letterSpacing: 1.8, textTransform: 'uppercase', textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>
          RCB
        </span>
      </div>
    </div>
  );
}
