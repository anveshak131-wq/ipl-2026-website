'use client';

import { User, Calendar, Shirt, TrendingUp, BarChart3 } from 'lucide-react';

const STEPS = [
  { id: 'basic', label: 'Basic', icon: User },
  { id: 'personal', label: 'Personal', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: Shirt },
  { id: 'transfer', label: 'Transfer', icon: TrendingUp },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
] as const;

interface AdminPlayerFormProgressProps {
  showStatsStep: boolean;
}

export default function AdminPlayerFormProgress({ showStatsStep }: AdminPlayerFormProgressProps) {
  const visibleSteps = showStatsStep ? STEPS : STEPS.filter((s) => s.id !== 'stats');

  return (
    <div className="oil-form-progress">
      {visibleSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="oil-form-progress__item">
            <div className="oil-form-progress__node">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="oil-form-progress__label">{step.label}</span>
            {index < visibleSteps.length - 1 && <div className="oil-form-progress__line" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}
