'use client';

import { useState } from 'react';
import { Target, CheckCircle, XCircle } from 'lucide-react';

interface DRSReviewProps {
  team: 'team1' | 'team2';
  teamName: string;
  used: number;
  remaining: number;
  successful: number;
  onReview: (type: string) => void;
  onResult?: (successful: boolean) => void;
}

const REVIEWABLE_TYPES = [
  { key: 'lbw', label: 'LBW', icon: '🎯', description: 'Leg Before Wicket' },
  { key: 'caught', label: 'Caught', icon: '✋', description: 'Caught by fielder' },
  { key: 'run-out', label: 'Run Out', icon: '🏃', description: 'Run out at crease' },
  { key: 'stumped', label: 'Stumped', icon: '👋', description: 'Stumped by wicketkeeper' },
  { key: 'height-wide', label: 'Height Wide', icon: '⬆️', description: 'Wide due to height' },
  { key: 'off-side-wide', label: 'Off-Side Wide', icon: '➡️', description: 'Wide on off-side' },
];

export default function DRSReview({ 
  team, 
  teamName,
  used, 
  remaining, 
  successful, 
  onReview,
  onResult
}: DRSReviewProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [reviewResult, setReviewResult] = useState<boolean | null>(null);
  const canReview = remaining > 0;

  const handleReviewClick = (type: string) => {
    setSelectedType(type);
    onReview(type);
    // Simulate review process (in real implementation, this would wait for actual result)
    setTimeout(() => {
      // Random result for demo - in real implementation, admin would set this
      const result = Math.random() > 0.5;
      setReviewResult(result);
      setShowResult(true);
      if (onResult) {
        onResult(result);
      }
      setTimeout(() => {
        setShowResult(false);
        setSelectedType(null);
        setReviewResult(null);
      }, 3000);
    }, 2000);
  };

  const handleResultClick = (successful: boolean) => {
    setReviewResult(successful);
    setShowResult(true);
    if (onResult) {
      onResult(successful);
    }
    setTimeout(() => {
      setShowResult(false);
      setSelectedType(null);
      setReviewResult(null);
    }, 3000);
  };

  return (
    <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">DRS Reviews</span>
          <span className="text-gray-400 text-sm">({teamName})</span>
        </div>
        <span className="text-gray-300 text-sm">
          Used: {used}/2 | Remaining: {remaining} | Successful: {successful}
        </span>
      </div>

      {showResult && reviewResult !== null && (
        <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 ${
          reviewResult ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
        }`}>
          {reviewResult ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold">Review Successful!</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 font-semibold">Review Unsuccessful</span>
            </>
          )}
        </div>
      )}

      {canReview ? (
        <>
          {!selectedType ? (
            <div className="grid grid-cols-3 gap-2">
              {REVIEWABLE_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleReviewClick(type.key)}
                  className="bg-purple-500/30 hover:bg-purple-500/50 border border-purple-500/50 rounded-lg p-2 text-sm text-white transition-all hover:scale-105"
                >
                  <span className="text-lg block mb-1">{type.icon}</span>
                  <div className="text-xs font-semibold">{type.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-purple-500/30 rounded-lg p-3">
              <div className="text-white text-sm mb-2">Review in progress...</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResultClick(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Successful
                </button>
                <button
                  onClick={() => handleResultClick(false)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Unsuccessful
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 text-sm text-center py-2">No reviews remaining</div>
      )}
    </div>
  );
}

