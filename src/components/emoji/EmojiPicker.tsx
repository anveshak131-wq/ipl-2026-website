"use client";

import React from "react";
import Emoji, { EmojiName } from "./Emoji";

interface EmojiPickerProps {
  onSelect: (code: string) => void;
}

const EMOJIS: { name: EmojiName; code: string; label: string; hint: string }[] = [
  { name: "fire", code: ":fire:", label: "Fire", hint: "Big moment" },
  { name: "clap", code: ":clap:", label: "Clap", hint: "Applause" },
  { name: "rocket", code: ":rocket:", label: "Rocket", hint: "Momentum" },
  { name: "heart", code: ":heart:", label: "Heart", hint: "Support" },
  { name: "wow", code: ":wow:", label: "Wow", hint: "Shock" },
  { name: "thumbs_up", code: ":thumbs_up:", label: "Thumbs up", hint: "Agree" },
];

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => onSelect(item.code)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-800/60 px-2.5 py-1 text-[11px] text-gray-200 hover:border-ipl-gold/80 hover:bg-slate-700/80 transition-colors"
          >
            <Emoji name={item.name} size={16} />
            <span className="hidden sm:inline font-semibold tracking-wide">{item.label}</span>
            <span className="sm:hidden font-semibold tracking-wide">{item.code}</span>
          </button>
        ))}
      </div>
      <span className="hidden md:inline text-[10px] text-gray-500 whitespace-nowrap">
        Tip: type codes like <span className="text-ipl-gold font-mono">:fire:</span>
      </span>
    </div>
  );
}
