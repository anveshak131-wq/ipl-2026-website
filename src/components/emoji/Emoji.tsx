"use client";

import React from "react";

export type EmojiName = "fire" | "clap" | "rocket" | "heart" | "wow" | "thumbs_up";

interface EmojiProps {
  name: EmojiName;
  size?: number;
  className?: string;
  animated?: boolean;
}

const EMOJI_CHAR: Record<EmojiName, string> = {
  fire: "🔥",
  clap: "👏",
  rocket: "🚀",
  heart: "💜",
  wow: "😲",
  thumbs_up: "👍",
};

export default function Emoji({ name, size = 20, className = "", animated = true }: EmojiProps) {
  const char = EMOJI_CHAR[name] ?? "✨";

  return (
    <span
      role="img"
      aria-label={name.replace("_", " ")}
      className={`inline-flex items-center justify-center rounded-full bg-white/5 px-1 ${
        animated ? "transition-transform duration-150 hover:scale-125" : ""
      } ${className}`}
      style={{ fontSize: size }}
    >
      <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]">{char}</span>
    </span>
  );
}
