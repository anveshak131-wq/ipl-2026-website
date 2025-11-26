'use client';

import CustomEmoji, { EmojiType } from './CustomEmoji';

// Export type for legacy compatibility
export type EmojiName = 
  | 'trophy' 
  | 'cricket' 
  | 'fire' 
  | 'star' 
  | 'star-outline'
  | 'people' 
  | 'globe' 
  | 'lightning' 
  | 'calendar' 
  | 'chart' 
  | 'target'
  | 'sparkles'
  | 'party'
  | 'clock'
  | 'crown'
  | 'flag-india'
  | 'stadium'
  | 'glove'
  | 'clap'
  | 'rocket'
  | 'heart'
  | 'wow'
  | 'thumbs_up';

interface EmojiProps {
  name: EmojiName | string;
  size?: number | string;
  className?: string;
  animate?: boolean;
  color?: string;
  gradient?: boolean;
}

// Legacy emoji character mapping (for fallback)
const EMOJI_CHAR: Record<string, string> = {
  trophy: "🏆",
  cricket: "🏏",
  fire: "🔥",
  star: "⭐",
  "star-outline": "☆",
  people: "👥",
  globe: "🌍",
  lightning: "⚡",
  calendar: "📅",
  chart: "📊",
  target: "🎯",
  sparkles: "✨",
  party: "🎉",
  clap: "👏",
  rocket: "🚀",
  heart: "❤️",
  wow: "😮",
  thumbs_up: "👍",
  clock: "🕐",
  crown: "👑",
  "flag-india": "🇮🇳",
  stadium: "🏟️",
  glove: "🧤"
};

// Mapping string names to CustomEmoji types
const EMOJI_TYPE_MAP: Record<string, EmojiType> = {
  trophy: 'trophy',
  cricket: 'cricket',
  fire: 'fire',
  star: 'star',
  'star-outline': 'star-outline',
  people: 'people',
  globe: 'globe',
  lightning: 'lightning',
  calendar: 'calendar',
  chart: 'chart',
  target: 'target',
  sparkles: 'sparkles',
  party: 'party',
  clock: 'clock',
  crown: 'crown',
  'flag-india': 'flag-india',
  stadium: 'stadium',
  glove: 'glove',
  // Legacy names that map to our custom emojis
  clap: 'sparkles',
  rocket: 'fire',
  heart: 'star',
  wow: 'sparkles',
  thumbs_up: 'star'
};

export default function Emoji({ 
  name, 
  size = 20, 
  className = '', 
  animate = true,
  color,
  gradient = true
}: EmojiProps) {
  const emojiType = EMOJI_TYPE_MAP[name];
  
  if (emojiType) {
    return (
      <CustomEmoji
        type={emojiType}
        size={size}
        className={className}
        animate={animate}
        color={color}
        gradient={gradient}
      />
    );
  }
  
  // Fallback to character emoji
  const char = EMOJI_CHAR[name] ?? "✨";
  return <span className={className} style={{ fontSize: typeof size === 'number' ? `${size}px` : size }}>{char}</span>;
}

// Convenient exports for direct usage
export { CustomEmoji };
export type { EmojiType };
