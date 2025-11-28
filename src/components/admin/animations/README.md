# Admin Animations & Visual Polish

Comprehensive animation and visual polish components for the admin panel.

## Components

### Page Transitions

#### PageTransition
Smooth page transition with fade, scale, and slide effects.

```tsx
import { PageTransition } from '@/components/admin/animations';

<PageTransition>
  <YourPageContent />
</PageTransition>
```

#### SlideTransition
Slide animation for modals and panels.

```tsx
import { SlideTransition } from '@/components/admin/animations';

<SlideTransition direction="right">
  <SidePanel />
</SlideTransition>
```

#### FadeTransition
Simple fade in/out transition.

```tsx
import { FadeTransition } from '@/components/admin/animations';

<FadeTransition>
  <Content />
</FadeTransition>
```

### Staggered Animations

#### StaggeredList
Animate list items with staggered timing.

```tsx
import { StaggeredList } from '@/components/admin/animations';

<StaggeredList staggerDelay={0.1}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggeredList>
```

#### StaggeredGrid
Staggered animation for grid layouts.

```tsx
import { StaggeredGrid } from '@/components/admin/animations';

<StaggeredGrid className="grid grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</StaggeredGrid>
```

### Hover Effects

#### HoverCard
Card with smooth scale and glow effects on hover.

```tsx
import { HoverCard } from '@/components/admin/animations';

<HoverCard scale={1.05} glow>
  <YourCardContent />
</HoverCard>
```

#### HoverButton
Button with hover scale effects.

```tsx
import { HoverButton } from '@/components/admin/animations';

<HoverButton onClick={handleClick}>
  Click Me
</HoverButton>
```

#### HoverIcon
Icon with rotation on hover.

```tsx
import { HoverIcon } from '@/components/admin/animations';

<HoverIcon rotation={15}>
  <SettingsIcon />
</HoverIcon>
```

#### GlowOnHover
Glow effect on hover.

```tsx
import { GlowOnHover } from '@/components/admin/animations';

<GlowOnHover color="#2F6FED">
  <Button />
</GlowOnHover>
```

#### LiftOnHover
Lift effect on hover.

```tsx
import { LiftOnHover } from '@/components/admin/animations';

<LiftOnHover lift={8}>
  <Card />
</LiftOnHover>
```

### Loading Animations

#### LoadingSpinner
Animated loading spinner.

```tsx
import { LoadingSpinner } from '@/components/admin/animations';

<LoadingSpinner size="md" color="#2F6FED" />
```

#### PulsingDot
Pulsing dot indicator.

```tsx
import { PulsingDot } from '@/components/admin/animations';

<PulsingDot size="md" color="#2F6FED" />
```

#### SkeletonLoader
Shimmer effect skeleton loader.

```tsx
import { SkeletonLoader } from '@/components/admin/animations';

<SkeletonLoader width="100%" height="2rem" />
```

#### ThreeDotsLoader
Three dots bouncing animation.

```tsx
import { ThreeDotsLoader } from '@/components/admin/animations';

<ThreeDotsLoader color="#2F6FED" />
```

#### ProgressBar
Animated progress bar.

```tsx
import { ProgressBar } from '@/components/admin/animations';

<ProgressBar progress={75} showLabel />
```

### Success Animations

#### SuccessCheckmark
Animated success checkmark.

```tsx
import { SuccessCheckmark } from '@/components/admin/animations';

<SuccessCheckmark size="md" color="#10B981" />
```

#### SuccessMessage
Success message with checkmark.

```tsx
import { SuccessMessage } from '@/components/admin/animations';

<SuccessMessage message="Saved successfully!" />
```

### Micro Interactions

#### RippleButton
Button with ripple effect on click.

```tsx
import { RippleButton } from '@/components/admin/animations';

<RippleButton onClick={handleClick}>
  Click Me
</RippleButton>
```

#### ShakeAnimation
Shake animation for errors.

```tsx
import { ShakeAnimation } from '@/components/admin/animations';

<ShakeAnimation trigger={hasError}>
  <Input />
</ShakeAnimation>
```

#### BounceAnimation
Bouncing animation.

```tsx
import { BounceAnimation } from '@/components/admin/animations';

<BounceAnimation>
  <Icon />
</BounceAnimation>
```

#### PulseAnimation
Pulsing animation.

```tsx
import { PulseAnimation } from '@/components/admin/animations';

<PulseAnimation intensity={1.2}>
  <Badge />
</PulseAnimation>
```

#### FlipAnimation
Flip animation.

```tsx
import { FlipAnimation } from '@/components/admin/animations';

<FlipAnimation trigger={isFlipped}>
  <Card />
</FlipAnimation>
```

## Icons & Graphics

### EmptyStateIllustration
Custom empty state with animated icon.

```tsx
import { EmptyStateIllustration } from '@/components/admin/icons';

<EmptyStateIllustration
  type="teams"
  title="No teams yet"
  description="Create your first team to get started."
  action={{
    label: "Create Team",
    onClick: () => handleCreate(),
  }}
/>
```

### AnimatedStatusIcon
Animated status icon with pulse effects.

```tsx
import { AnimatedStatusIcon, StatusBadge } from '@/components/admin/icons';

<AnimatedStatusIcon status="success" size="md" pulse />
<StatusBadge status="live" label="Live Now" />
```

### IconBadge
Icon with animated count badge.

```tsx
import { IconBadge, NotificationBadge } from '@/components/admin/icons';

<IconBadge
  icon={<BellIcon />}
  count={5}
  maxCount={99}
  pulse
/>

<NotificationBadge
  icon={<BellIcon />}
  count={3}
  onClick={handleClick}
/>
```

## Usage Examples

### Complete Page with Animations

```tsx
'use client';

import { PageTransition, StaggeredList, HoverCard } from '@/components/admin/animations';
import { EmptyStateIllustration } from '@/components/admin/icons';

export default function AdminPage() {
  const items = [/* ... */];

  return (
    <PageTransition>
      <div className="p-6">
        {items.length === 0 ? (
          <EmptyStateIllustration
            type="teams"
            action={{
              label: "Create Team",
              onClick: () => {},
            }}
          />
        ) : (
          <StaggeredList className="grid grid-cols-3 gap-4">
            {items.map((item) => (
              <HoverCard key={item.id} glow>
                <Card data={item} />
              </HoverCard>
            ))}
          </StaggeredList>
        )}
      </div>
    </PageTransition>
  );
}
```

### Loading State

```tsx
import { LoadingSpinner, SkeletonLoader } from '@/components/admin/animations';

{isLoading ? (
  <div className="space-y-4">
    <SkeletonLoader width="100%" height="3rem" />
    <SkeletonLoader width="80%" height="2rem" />
    <SkeletonLoader width="60%" height="2rem" />
  </div>
) : (
  <Content />
)}
```

### Success Feedback

```tsx
import { SuccessMessage } from '@/components/admin/animations';

{showSuccess && (
  <SuccessMessage message="Changes saved successfully!" />
)}
```

## Best Practices

1. **Performance**: Use `AnimatePresence` for exit animations
2. **Accessibility**: Respect `prefers-reduced-motion`
3. **Consistency**: Use consistent animation durations (0.2s, 0.3s, 0.5s)
4. **Easing**: Use custom easing curves for smooth animations
5. **Staggering**: Use staggered animations for lists (0.05s - 0.1s delay)
6. **Loading States**: Always show loading states for async operations
7. **Feedback**: Provide visual feedback for all user actions

