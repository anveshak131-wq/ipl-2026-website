'use client';

import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface RCBLottieProps {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export default function RCBLottie({ className = 'w-full h-full', loop = true, autoplay = true }: RCBLottieProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let anim: any;
    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: '/assets/lottie/rcb-lion.json'
      });
    }

    return () => {
      if (anim) anim.destroy();
    };
  }, [loop, autoplay]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="RCB logo animation"
    />
  );
}
