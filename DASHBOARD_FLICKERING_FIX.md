# Dashboard Flickering Fix - 25 Feb 2026

## Problem
The dashboard at `/ipl-admin-2026/dashboard` was constantly flickering and showing "Loading Dashboard..." indefinitely.

## Root Causes

### 1. **Duplicate LeagueProvider** ❌
- `AdminRouter.tsx` wrapped components in `<LeagueProvider>`
- `layout.tsx` already provided `<LeagueProvider>` at a higher level
- This created nested contexts causing re-initialization loops

### 2. **Multiple Authentication Checks** ❌
- `layout.tsx` performed authentication check
- `dashboard/page.tsx` performed its own separate auth check
- Both had their own loading states that conflicted with each other
- Created race conditions and state flickering

### 3. **Unstable LeagueContext Initialization** ❌
- LeagueContext used `useState` initializer function that accessed `window.location.pathname`
- On every re-render, this could trigger state updates
- `useEffect` for localStorage persistence ran on every league change
- No flag to prevent re-initialization

## Solutions Applied

### ✅ Removed Duplicate LeagueProvider
**File**: `src/app/ipl-admin-2026/AdminRouter.tsx`
- Removed the `LeagueProvider` wrapper (already in layout)
- Removed the import statement

### ✅ Simplified Dashboard Authentication
**File**: `src/app/ipl-admin-2026/dashboard/page.tsx`
- Removed duplicate auth check logic (layout handles it)
- Removed `isAuthenticated` state
- Kept only `isLoading` state for data fetching
- Changed loading condition from `!isAuthenticated || isLoading` to just `isLoading`
- Used `hasFetchedStats` ref to prevent multiple fetches

### ✅ Stabilized LeagueContext
**File**: `src/contexts/LeagueContext.tsx`
- Moved initialization logic from `useState` to `useEffect`
- Added `initialized` flag to prevent re-initialization
- Split localStorage logic: only persist after initial load
- Prevents unnecessary re-renders during mount phase

## Technical Details

### Before:
```tsx
// PROBLEM: Two providers
<LeagueProvider>  // in layout
  <LeagueProvider>  // in AdminRouter (duplicate!)
    <Dashboard />
  </LeagueProvider>
</LeagueProvider>

// PROBLEM: Two auth checks
layout.tsx: useEffect(() => checkAuth())
dashboard.tsx: useEffect(() => checkAuth())  // duplicate!
```

### After:
```tsx
// SOLUTION: Single provider
<LeagueProvider>  // only in layout
  <Dashboard />
</LeagueProvider>

// SOLUTION: Single auth check
layout.tsx: useEffect(() => checkAuth())  // handles auth
dashboard.tsx: useEffect(() => fetchStats())  // only fetches data
```

## Result
- ✅ Dashboard loads smoothly without flickering
- ✅ Single source of truth for authentication (layout)
- ✅ No duplicate context providers
- ✅ Stable state management
- ✅ Build passes with no errors

## Files Modified
1. `/src/app/ipl-admin-2026/AdminRouter.tsx`
2. `/src/app/ipl-admin-2026/dashboard/page.tsx`
3. `/src/contexts/LeagueContext.tsx`

## Testing
- Build completed successfully
- No TypeScript errors
- Route: `/ipl-admin-2026/dashboard` (631 B)
