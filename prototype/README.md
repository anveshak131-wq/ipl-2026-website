# IPL Admin Prototype

Enhanced prototype with player cards, badges, multi-select, bulk actions, and responsive design.

## Files

- `index.html` — Player table with avatars, badges, checkboxes
- `styles.css` — Theming, responsive cards, compact mode, print styles
- `script.js` — Interactivity: multi-select, bulk actions, theme toggle, dark mode

## Features

### 1. Player Cards (Responsive)
- **Desktop**: Full data table with avatars, names, badges, stats
- **Mobile** (< 768px): Card-based layout with labeled fields
- Smooth transitions and hover effects

### 2. Avatars
- Initials-based avatar circles
- Team color gradients
- Centered, rounded design

### 3. Badges & Tags
- **C** (Captain) — Blue
- **OVS** (Overseas) — Purple
- **INJ** (Injured) — Red
- **NEW** (New Signing) — Green
- Hover titles for clarity

### 4. Multi-Select & Bulk Actions
- Checkbox per row
- "Select All" header checkbox
- Bulk action toolbar shows on selection:
  - **Export** — Export selected players
  - **Edit** — Batch edit
  - **Delete** — Delete with confirmation
- Selected rows highlighted

### 5. Compact Mode
- Toggle button in toolbar
- Reduces padding & font size for dense view
- Persists in localStorage
- Keyboard shortcut: Ctrl+C

### 6. Dark Mode
- Toggle in app bar
- Persists in localStorage
- Keyboard shortcut: Ctrl+D

### 7. Per-Team Color Theming
- Default, MI (blue), CSK (yellow), RCB (red), KKR (purple)
- Applies to header gradient, accents, badges
- Persists in localStorage

### 8. Print Stylesheet
- Hides controls and UI chrome
- Clean layout with team branding header
- Optimized for A4 paper

## Quick Start

```bash
cd prototype
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser.

## Accessibility

- Semantic HTML (`<th scope>`, `<label>`)
- ARIA labels on interactive elements
- Keyboard shortcuts (Ctrl+D for dark, Ctrl+C for compact)
- Focus outlines on buttons and inputs
- Sufficient color contrast

## Storage

All settings persisted to localStorage:
- `prototype-team`: Selected team
- `prototype-dark`: Dark mode state
- `prototype-compact`: Compact mode state
