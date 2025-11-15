'use client';

import { useEffect, useRef, useState } from 'react';
import { default as lottie } from 'lottie-web';

interface RCBLottieProps {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export default function RCBLottie({ className = 'w-full h-full', loop = true, autoplay = true }: RCBLottieProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || hasError) return;

    try {
      // Destroy previous animation if exists
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }

      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: '/assets/lottie/rcb-lion.json'
      });

      animRef.current.addEventListener('error', () => {
        console.error('Lottie animation error');
        setHasError(true);
      });
    } catch (error) {
      console.error('Error loading Lottie animation:', error);
      setHasError(true);
    }

    return () => {
      if (animRef.current) {
        try {
          animRef.current.destroy();
          animRef.current = null;
        } catch (e) {
          console.error('Error destroying animation:', e);
        }
      }
    };
  }, [loop, autoplay, hasError]);

  // Fallback: simple animated SVG if Lottie fails
  if (hasError) {
    return (
      <svg
        viewBox="0 0 240 240"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="RCB logo"
      >
        <defs>
          <style>
            {`
              @keyframes maneRotate {
                from { transform: rotate(0deg); transform-origin: 120px 95px; }
                to { transform: rotate(360deg); transform-origin: 120px 95px; }
              }
              .rcb-mane { animation: maneRotate 4s linear infinite; }
            `}
          </style>
        </defs>
        {/* Shield */}
        <rect x="50" y="20" width="140" height="160" rx="15" fill="#EC1C24" />
        {/* Mane */}
        <circle cx="120" cy="95" r="55" fill="#FDD08D" className="rcb-mane" />
        {/* Text */}
        <text x="120" y="200" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#EC1C24" fontFamily="Arial Black">
          RCB
        </text>
      </svg>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="RCB logo animation"
    />
  );
}
