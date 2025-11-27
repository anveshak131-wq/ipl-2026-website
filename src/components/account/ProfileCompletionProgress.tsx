'use client';

import React from 'react';

interface ProfileCompletionProgressProps {
  completionPercentage: number;
  completedItems: string[];
  totalItems: string[];
}

export default function ProfileCompletionProgress({
  completionPercentage,
  completedItems,
  totalItems,
}: ProfileCompletionProgressProps) {
  return (
    <>
    <style>{`
      @keyframes progressGrow {
        0% { width: 0%; }
        100% { width: var(--progress); }
      }
      @keyframes progressPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes checklistSlide {
        0% { opacity: 0; transform: translateX(-10px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      .progress-bar {
        animation: progressGrow 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .progress-pulse {
        animation: progressPulse 2s ease-in-out infinite;
      }
      .checklist-item {
        animation: checklistSlide 0.4s ease-out forwards;
      }
      .checklist-item:nth-child(1) { animation-delay: 0s; }
      .checklist-item:nth-child(2) { animation-delay: 0.1s; }
      .checklist-item:nth-child(3) { animation-delay: 0.2s; }
      .checklist-item:nth-child(4) { animation-delay: 0.3s; }
      .checklist-item:nth-child(5) { animation-delay: 0.4s; }
    `}</style>
  ) || (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10 space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Profile Completion</h3>
          <p className="text-sm text-gray-400">{completedItems.length} of {totalItems.length} items</p>
        </div>
        <div className={`text-3xl font-black ${
          completionPercentage === 100 ? 'text-green-500' : 'text-ipl-gold'
        }`}>
          {completionPercentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div
            className="progress-bar h-full bg-gradient-to-r from-ipl-gold to-yellow-400 rounded-full shadow-lg"
            style={{ '--progress': `${completionPercentage}%` } as React.CSSProperties}
          />
        </div>
        <p className="text-xs text-gray-500">
          {completionPercentage === 100 ? '✨ Profile complete!' : 'Complete your profile to unlock features'}
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {totalItems.map((item, idx) => {
          const isCompleted = completedItems.includes(item);
          return (
            <div
              key={idx}
              className={`checklist-item flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCompleted
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs">•</span>
                )}
              </div>
              <span className={`text-sm font-medium ${
                isCompleted ? 'text-green-400' : 'text-gray-300'
              }`}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completionPercentage === 100 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-green-400 font-semibold">🎉 Profile Complete!</p>
          <p className="text-green-400/80 text-sm mt-1">You've unlocked all features</p>
        </div>
      )}
    </div>
    </>
  );
}
