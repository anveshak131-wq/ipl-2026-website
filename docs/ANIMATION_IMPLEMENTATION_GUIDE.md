# 🎬 Animation Implementation Guide

## Quick Start for Recommended Animations

---

## 🎯 Top 10 Animations to Implement

### 1. **Score Flip Animation** (Live Score Page)
```tsx
// CSS
@keyframes scoreFlip {
  0% { transform: rotateX(0deg); opacity: 1; }
  50% { transform: rotateX(90deg); opacity: 0.5; }
  100% { transform: rotateX(0deg); opacity: 1; }
}

// Component
<div className="animate-score-flip text-4xl font-bold">
  {score}
</div>

// Tailwind Config
animation: {
  'score-flip': 'scoreFlip 0.6s ease-out',
}
```

---

### 2. **Wicket Celebration Animation** (Live Score Page)
```tsx
// CSS
@keyframes wicketCelebration {
  0% { scale: 1; opacity: 1; }
  50% { scale: 1.3; }
  100% { scale: 0; opacity: 0; }
}

// Component
<div className="animate-wicket-celebration text-2xl">
  🎉 WICKET!
</div>

// Tailwind Config
animation: {
  'wicket-celebration': 'wicketCelebration 1s ease-out',
}
```

---

### 3. **Boundary Flash Animation** (Live Score Page)
```tsx
// CSS
@keyframes boundaryFlash {
  0% { boxShadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
  100% { boxShadow: 0 0 0 20px rgba(251, 191, 36, 0); }
}

// Component
<div className="animate-boundary-flash p-4 rounded-lg">
  BOUNDARY!
</div>

// Tailwind Config
animation: {
  'boundary-flash': 'boundaryFlash 0.8s ease-out',
}
```

---

### 4. **Team Card 3D Flip** (Teams Page)
```tsx
// CSS
@keyframes team3DFlip {
  0% { transform: perspective(1000px) rotateY(0deg); }
  100% { transform: perspective(1000px) rotateY(360deg); }
}

// Component
<div className="hover:animate-team-3d-flip transition-all duration-500">
  <div className="p-6 rounded-lg">
    {/* Team content */}
  </div>
</div>

// Tailwind Config
animation: {
  'team-3d-flip': 'team3DFlip 0.8s ease-out',
}
```

---

### 5. **Confidence Meter Animation** (Predictions Page)
```tsx
// CSS
@keyframes meterFill {
  0% { width: 0%; }
  100% { width: var(--confidence); }
}

// Component
<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
  <div 
    className="h-full bg-gradient-to-r from-ipl-gold to-yellow-400 animate-meter-fill"
    style={{ '--confidence': `${confidence}%` }}
  />
</div>

// Tailwind Config
animation: {
  'meter-fill': 'meterFill 1s ease-out forwards',
}
```

---

### 6. **Chart Bar Animation** (Stats Page)
```tsx
// CSS
@keyframes chartGrow {
  0% { height: 0; }
  100% { height: var(--height); }
}

// Component
<div className="flex items-end gap-2 h-64">
  {data.map((item, idx) => (
    <div
      key={idx}
      className="flex-1 bg-gradient-to-t from-ipl-gold to-yellow-400 animate-chart-grow"
      style={{ '--height': `${item.value}%` }}
    />
  ))}
</div>

// Tailwind Config
animation: {
  'chart-grow': 'chartGrow 0.8s ease-out forwards',
}
```

---

### 7. **Notification Slide-In** (Notifications Page)
```tsx
// CSS
@keyframes notificationSlideIn {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

// Component
<div className="animate-notification-slide-in fixed top-4 right-4">
  <div className="bg-green-500 text-white p-4 rounded-lg">
    {message}
  </div>
</div>

// Tailwind Config
animation: {
  'notification-slide-in': 'notificationSlideIn 0.4s ease-out',
}
```

---

### 8. **Heart Beat Animation** (Feed Page)
```tsx
// CSS
@keyframes heartBeat {
  0%, 100% { scale: 1; }
  25% { scale: 1.3; }
  50% { scale: 1.1; }
}

// Component
<button className="hover:animate-heart-beat transition-all">
  <Heart className="w-6 h-6" />
</button>

// Tailwind Config
animation: {
  'heart-beat': 'heartBeat 0.6s ease-out',
}
```

---

### 9. **Ripple Effect** (Buttons)
```tsx
// CSS
@keyframes ripple {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
}

// Component
<button className="relative overflow-hidden">
  <span className="relative z-10">Click me</span>
  <span className="absolute inset-0 animate-ripple bg-white/20" />
</button>

// Tailwind Config
animation: {
  'ripple': 'ripple 0.6s ease-out',
}
```

---

### 10. **Validation Shake** (Forms)
```tsx
// CSS
@keyframes validationShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

// Component
<input
  className={`${error ? 'animate-validation-shake border-red-500' : ''}`}
/>

// Tailwind Config
animation: {
  'validation-shake': 'validationShake 0.4s ease-out',
}
```

---

## 🛠️ Setup Instructions

### 1. Add to `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      animation: {
        'score-flip': 'scoreFlip 0.6s ease-out',
        'wicket-celebration': 'wicketCelebration 1s ease-out',
        'boundary-flash': 'boundaryFlash 0.8s ease-out',
        'team-3d-flip': 'team3DFlip 0.8s ease-out',
        'meter-fill': 'meterFill 1s ease-out forwards',
        'chart-grow': 'chartGrow 0.8s ease-out forwards',
        'notification-slide-in': 'notificationSlideIn 0.4s ease-out',
        'heart-beat': 'heartBeat 0.6s ease-out',
        'ripple': 'ripple 0.6s ease-out',
        'validation-shake': 'validationShake 0.4s ease-out',
      },
      keyframes: {
        scoreFlip: {
          '0%': { transform: 'rotateX(0deg)', opacity: '1' },
          '50%': { transform: 'rotateX(90deg)', opacity: '0.5' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        wicketCelebration: {
          '0%': { scale: '1', opacity: '1' },
          '50%': { scale: '1.3' },
          '100%': { scale: '0', opacity: '0' },
        },
        boundaryFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.7)' },
          '100%': { boxShadow: '0 0 0 20px rgba(251, 191, 36, 0)' },
        },
        team3DFlip: {
          '0%': { transform: 'perspective(1000px) rotateY(0deg)' },
          '100%': { transform: 'perspective(1000px) rotateY(360deg)' },
        },
        meterFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--confidence)' },
        },
        chartGrow: {
          '0%': { height: '0' },
          '100%': { height: 'var(--height)' },
        },
        notificationSlideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        heartBeat: {
          '0%, 100%': { scale: '1' },
          '25%': { scale: '1.3' },
          '50%': { scale: '1.1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        validationShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
}

export default config
```

---

## 📋 Implementation Checklist

### Live Score Page
- [ ] Add score flip animation
- [ ] Add wicket celebration animation
- [ ] Add boundary flash animation
- [ ] Add commentary typewriter effect
- [ ] Add player highlight glow

### Teams Page
- [ ] Add 3D flip animation
- [ ] Add player carousel
- [ ] Add stats bar chart animation
- [ ] Add trophy rotation
- [ ] Add team color gradient

### Predictions Page
- [ ] Add confidence meter animation
- [ ] Add probability bar animation
- [ ] Add vote particle effect
- [ ] Add leaderboard rank animation
- [ ] Add result reveal animation

### Stats Page
- [ ] Add chart grow animation
- [ ] Add ranking slide animation
- [ ] Add trend indicator animation
- [ ] Add comparison animation
- [ ] Add milestone celebration

### Notifications Page
- [ ] Add slide-in animation
- [ ] Add dismiss animation
- [ ] Add badge pulse
- [ ] Add type icon animation
- [ ] Add read/unread transition

### Feed Page
- [ ] Add fade-in animation
- [ ] Add heart beat animation
- [ ] Add comment count animation
- [ ] Add share ripple effect
- [ ] Add infinite scroll loading

### Admin Dashboard
- [ ] Add metric counter animation
- [ ] Add chart animation
- [ ] Add status pulse
- [ ] Add alert notification
- [ ] Add widget loading skeleton

### Admin Live Score
- [ ] Add score update animation
- [ ] Add wicket update animation
- [ ] Add form validation animation
- [ ] Add success confirmation
- [ ] Add error shake animation

---

## 🎨 Color Animation Examples

### Gradient Transition
```tsx
className="bg-gradient-to-r from-ipl-gold to-yellow-400 hover:from-yellow-400 hover:to-ipl-gold transition-all duration-300"
```

### Color Pulse
```tsx
@keyframes colorPulse {
  0%, 100% { color: #fbbf24; }
  50% { color: #facc15; }
}
```

### Shadow Animation
```tsx
className="hover:shadow-2xl hover:shadow-ipl-gold/50 transition-shadow duration-300"
```

---

## 🚀 Performance Tips

### 1. Use CSS Animations
```tsx
// ✅ Good - CSS animation
className="animate-score-flip"

// ❌ Avoid - JavaScript animation
useEffect(() => {
  setRotation(rotation + 1);
}, []);
```

### 2. Use GPU Acceleration
```tsx
// ✅ Good - GPU accelerated
className="transform transition-transform"

// ❌ Avoid - Layout-triggering
className="transition-width"
```

### 3. Optimize for Mobile
```tsx
// ✅ Good - Reduced motion
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}

// ✅ Good - Simpler animations on mobile
@media (max-width: 640px) {
  .animate-complex { animation: none; }
}
```

---

## 📊 Animation Timing Guide

```
Micro-interactions:    100-200ms
Hover effects:         200-300ms
Page transitions:      300-500ms
Loading animations:    600-800ms
Complex animations:    800-1200ms
```

---

## 🎯 Priority Implementation Order

### Week 1 (High Priority)
1. Score flip animation
2. Wicket celebration
3. Boundary flash
4. Notification slide-in
5. Heart beat animation

### Week 2 (Medium Priority)
1. Team 3D flip
2. Confidence meter
3. Chart grow animation
4. Ripple effect
5. Validation shake

### Week 3 (Low Priority)
1. Advanced 3D effects
2. Particle effects
3. Complex parallax
4. Gesture animations
5. Custom effects

---

## 💡 Testing Animations

### Browser DevTools
1. Open DevTools (F12)
2. Go to Rendering tab
3. Enable "Paint flashing"
4. Check for layout thrashing

### Performance Testing
```bash
# Lighthouse audit
npm run build
npx lighthouse https://your-site.com
```

### Mobile Testing
- Test on real devices
- Check animation smoothness
- Verify touch interactions
- Test on low-end devices

---

## 📚 Resources

### Documentation
- [MDN Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Tailwind Animation](https://tailwindcss.com/docs/animation)

### Tools
- [Cubic Bezier](https://cubic-bezier.com/)
- [Animista](https://animista.net/)
- [Keyframe Animation Generator](https://keyframes.app/)

---

**Version:** 1.0
**Created:** November 27, 2025
**Status:** Ready for Implementation
