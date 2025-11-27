'use client';

import React from 'react';

interface SmoothToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  icon?: string;
  color?: 'gold' | 'blue' | 'green';
}

export default function SmoothToggle({
  label,
  description,
  enabled,
  onChange,
  icon,
  color = 'gold',
}: SmoothToggleProps) {
  const colorMap = {
    gold: 'bg-ipl-gold',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <>
    <style>{`
      @keyframes toggleSlide {
        0% { transform: translateX(0); }
        100% { transform: translateX(var(--translate)); }
      }
      @keyframes togglePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
      }
      .toggle-switch {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .toggle-switch.enabled {
        background-color: var(--color);
      }
      .toggle-circle {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .toggle-switch.enabled .toggle-circle {
        transform: translateX(24px);
      }
      .toggle-switch:active .toggle-circle {
        box-shadow: 0 0 0 8px rgba(251, 191, 36, 0.2);
      }
    `}</style>
  ) || (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 flex-1">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <p className="text-white font-semibold">{label}</p>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onChange(!enabled)}
        className={`toggle-switch relative w-14 h-8 rounded-full border-2 border-white/20 flex-shrink-0 ${
          enabled ? 'enabled' : 'bg-white/10'
        }`}
        style={{
          '--color': color === 'gold' ? '#fbbf24' : color === 'blue' ? '#3b82f6' : '#10b981',
          '--translate': enabled ? '24px' : '0px',
        } as React.CSSProperties}
      >
        <div
          className="toggle-circle absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
    </>
  );
}
