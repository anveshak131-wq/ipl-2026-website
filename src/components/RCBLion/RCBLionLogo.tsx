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
      setSize(clamped);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minSize, maxSize]);

  return (
    <div ref={containerRef} className={className} style={{ display: 'block', position: 'relative' }}>
      {/* Renders a canvas animation sized to container using measured pixels */}
      <RCBLion width={size} height={size} />
    </div>
  );
}
