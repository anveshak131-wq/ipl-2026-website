"use client";

import React from 'react';

interface Props {
  className?: string;
}

// Simple wrapper that renders the new animated inferno lion SVG from /public/logos.
export default function RCBLionLogo({ className }: Props) {
  return (
    <div className={`rcb-logo-shell ${className ?? ''}`}>
      <img
        src="/logos/rcb_inferno_lion.svg"
        alt="Royal Challengers Bengaluru lion crest"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
