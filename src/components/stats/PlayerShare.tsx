'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';

interface PlayerShareProps {
  player: Player;
  type: 'batting' | 'bowling';
}

export default function PlayerShare({ player, type }: PlayerShareProps) {
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const playerStats = {
      name: player.name,
      team: player.teamId,
      runs: player.stats.runs,
      wickets: player.stats.wickets,
      strikeRate: player.stats.strikeRate,
      economy: player.stats.economy,
      average: player.stats.average,
      matches: player.stats.matches,
    };
    
    // Encode the player data in the URL
    const encodedData = encodeURIComponent(JSON.stringify(playerStats));
    return `${baseUrl}/stats?player=${encodedData}`;
  };

  const handleShare = async () => {
    const shareUrl = generateShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${player.name} Stats`,
          text: `Check out ${player.name}'s stats: ${player.stats.runs} runs, ${player.stats.wickets} wickets`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 text-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="hidden sm:inline">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </motion.button>
  );
}