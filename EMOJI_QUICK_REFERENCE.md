# 🎨 Custom Emoji Quick Reference

## Usage

```tsx
import { CustomEmoji } from '@/components/emoji/Emoji';

<CustomEmoji type="trophy" size={20} />
```

---

## Available Emojis (17)

### Sports
- `trophy` - 🏆 Gold, bounce + glow
- `cricket` - 🏏 Red, rotate + pulse
- `target` - 🎯 Red, ripple
- `glove` - 🧤 Orange, wobble
- `lightning` - ⚡ Yellow, pulse

### People & Places
- `people` - 👥 Blue, wave
- `globe` - 🌍 Green, rotate
- `flag-india` - 🇮🇳 Tri-color
- `stadium` - 🏟️ Purple, scale

### UI Elements
- `star` - ⭐ Gold, rotate
- `star-outline` - ☆ Gold outline
- `calendar` - 📅 Purple, pulse
- `chart` - 📊 Cyan, bars grow
- `clock` - 🕐 Blue, hands rotate

### Effects
- `fire` - 🔥 Multi-color flicker
- `sparkles` - ✨ Multi-color burst
- `party` - 🎉 Confetti explosion
- `crown` - 👑 Gold, float

---

## Props

```tsx
type: EmojiType        // Required
size?: number | string // Default: 20
animate?: boolean      // Default: true
color?: string         // Override color
gradient?: boolean     // Default: true
className?: string     // CSS classes
```

---

## Examples

```tsx
// Basic
<CustomEmoji type="trophy" />

// Large
<CustomEmoji type="fire" size={48} />

// Static
<CustomEmoji type="star" animate={false} />

// Custom color
<CustomEmoji type="trophy" color="#FF0000" />

// Conditional
<CustomEmoji 
  type={active ? 'star' : 'star-outline'} 
  animate={active}
/>
```

---

## 📊 Coverage: 87+ replacements across 13+ files

✅ **100% Complete**
