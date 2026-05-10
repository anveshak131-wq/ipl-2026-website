"use client";

import React from 'react';
import Image from 'next/image';

interface Props {
  className?: string;
}

export default function RCBLionLogo({ className }: Props) {
  return (
    <div className={`rcb-logo-shell relative overflow-hidden ${className ?? ''}`}>
      <Image
        src="/logos/rcb_logo_official.png"
        alt="Royal Challengers Bengaluru logo"
        fill
        sizes="(max-width: 768px) 96px, 160px"
        className="object-contain"
      />
    </div>
  );
}
