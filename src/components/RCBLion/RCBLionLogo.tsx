"use client";
/* eslint-disable @next/next/no-img-element */

import React from 'react';

interface Props {
  className?: string;
}

export default function RCBLionLogo({ className }: Props) {
  return (
    <div className={`rcb-logo-shell ${className ?? ''}`}>
      <img
        src="/logos/rcb_logo_premium.svg"
        alt="Original RCB-inspired logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
