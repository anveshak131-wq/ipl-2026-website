"use client";

import React from 'react';

interface Props {
  className?: string;
}

// Premium RCB logo component - renders the new premium animated logo
export default function RCBLionLogo({ className }: Props) {
  return (
    <div className={`rcb-logo-shell ${className ?? ''}`}>
      <img
        src="/logos/rcb_logo_premium.svg"
        alt="Royal Challengers Bengaluru premium logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
