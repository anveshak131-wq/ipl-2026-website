# RCB Premium Logo Component

A premium, animated logo component for Royal Challengers Bangalore with dynamic effects and modern design.

## Features

✨ **Dynamic Animations**
- Smooth, fluid animations that bring the logo to life
- Lion mane flowing animation
- Blinking eyes
- Pulsing glow effects
- Energy particles

🎨 **Premium Design**
- Modern, bold design with RCB brand colors
- 3D shield effect
- Crown with animated jewels
- Gradient color transitions

⚡ **Interactive Effects**
- Hover effects with scale and rotation
- Responsive animations
- Customizable size and animation settings

## Usage

```tsx
import RCBPremiumLogo from '@/components/RCBLion/RCBPremiumLogo';

// Basic usage
<RCBPremiumLogo />

// With custom size
<RCBPremiumLogo size="lg" />

// Without animations
<RCBPremiumLogo animated={false} />

// Without particles
<RCBPremiumLogo showParticles={false} />

// Full customization
<RCBPremiumLogo 
  size="xl"
  animated={true}
  showParticles={true}
  className="my-custom-class"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Logo size |
| `animated` | `boolean` | `true` | Enable/disable animations |
| `showParticles` | `boolean` | `true` | Show energy particles |

## Sizes

- `sm`: 96px × 96px (w-24 h-24)
- `md`: 192px × 192px (w-48 h-48)
- `lg`: 256px × 256px (w-64 h-64)
- `xl`: 384px × 384px (w-96 h-96)

## Brand Colors

- **Primary Red**: `#EC1C24`
- **Black**: `#000000`
- **Gold**: `#FFD700`
- **Dark Red**: `#B91C1C`
- **Orange**: `#FF8C00`

## Demo

Visit `/rcb-lion` to see the logo in action with interactive controls.

## Technical Details

- Built with Framer Motion for smooth animations
- SVG-based for crisp rendering at any size
- Unique gradient IDs to prevent conflicts
- Fully responsive and accessible
- Optimized for performance

