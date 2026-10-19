'use client';

import React from 'react';
import ModerationQueue from '@/components/admin/ModerationQueue';

export default function ModerationPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Moderation Queue</h1>
          <p className="text-sm text-slate-400">Rule-based content filtering, automated flags, and bulk actions</p>
        </div>
      </div>
      <ModerationQueue />
    </div>
  );
}
