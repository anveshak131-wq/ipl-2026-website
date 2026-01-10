# WPL Live-Scoring Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Set Playing 11 (Pre-Match)
```
URL: https://yoursite.com/wpl-admin-2026/playing-11

1. Select match from dropdown
2. Click on Team 1 player cards to select exactly 11 players
3. Click on Team 2 player cards to select exactly 11 players
4. Press "Save Playing 11"
5. Confirm: "✓ Playing 11 set successfully"
```

### Step 2: Start Live Scoring (During Match)
```
URL: https://yoursite.com/wpl-admin-2026/live-score

1. Select match from dropdown
2. If warning shows: "Playing 11 Not Set"
   → Go back to Playing 11 and set teams first
3. Start recording balls:
   - Click run buttons (0, 1, 2, 4, 6)
   - Click wicket for dismissals
   - Use undo button if mistake
4. Changes auto-save every few seconds
5. Check status indicator: "Saved ✓"
```

## 🎯 Key Concepts

| Concept | Rule | Flexibility |
|---------|------|-------------|
| **Batter** | Must be from Playing 11 | ❌ No |
| **Bowler** | Must be from Playing 11 | ❌ No |
| **Fielder** | Any squad player | ✅ Yes |
| **Fielding Changes** | Track injuries/tactics | ✅ Yes (recorded separately) |

## 🎬 Common Actions

### Change Batter
1. Click "Change Batter" button
2. Select from Playing 11 list
3. New batter appears in score display

### Record Wicket
1. Click "W" (Wicket) button
2. Choose dismissal type:
   - Bowled 🏏
   - Caught ✋ (select fielder)
   - LBW 🦵
   - Stumped 🧤 (select wicketkeeper)
   - Run Out 🏃 (select fielder)
   - Others...
3. Click "Confirm Dismissal"
4. Auto-advances to next batter

### Record Fielding Change (Injury/Tactic)
1. Scroll to "Substitute Fielders" section
2. Click "Record Change"
3. Select fielder being replaced
4. Select substitute player
5. Choose reason:
   - 🤕 Injury
   - 🎯 Tactical Change
   - ⚡ Impact Player (IPL)
   - 😰 Player Fatigue
6. Click "Record Change"
7. Appears in substitutes list below

### Undo Last Ball
1. Click "↶ Undo" button (top right)
2. Choose how many balls to undo (max 5)
3. Last ball entry removed

## 📊 Data Fields Auto-Calculated

These update automatically - don't enter manually:
- **Overs** (from balls: 12 balls = 2.0 overs)
- **Run Rate** (runs / overs)
- **Strike Rate** (batter runs / balls × 100)
- **Economy Rate** (bowler runs / overs)
- **Dot Ball %** (dots / total balls)
- **Boundaries** (4s + 6s)

## 🔄 Auto-Save

- Every ball is saved automatically
- Status shows: "Saved ✓" in green
- If error: "Failed ✗" in red
- Click "Manual Save" if needed

## ⚠️ Common Issues

### Problem: "Can't select this player as batter"
**Cause**: Player not in Playing 11
**Fix**: Go to Playing 11 page and add them

### Problem: "Playing 11 Not Set" warning
**Cause**: No playing 11 selected before match
**Fix**: Click the warning link → Go to Playing 11 → Set teams

### Problem: Player not showing in wicket fielder list
**Cause**: Player not in any team squad
**Fix**: Add player to team squad database first

### Problem: "Failed to save" error
**Cause**: API error or connection issue
**Fix**: Wait 2 seconds, click "Manual Save"

## 🎨 UI Reference

### Match Selector
```
┌─ Select Match ─────────────────────┐
│ [Team1 vs Team2 · Jan 10, 2025]   │
└────────────────────────────────────┘
```

### Score Display
```
Team 1: 45/2 (5.2 overs)
Team 2: 0/0 (0.0 overs)

Current Batter: Alyssa Healy - 15 (8)
Current Bowler: Ecclestone - 0/8 (1.2)
```

### Ball Entry Panel
```
┌────────────────────────────────────┐
│  0️⃣ 1️⃣ 2️⃣ 4️⃣ 6️⃣             │
│  W  WD NB B  LB                    │
│                                     │
│  ↶ Undo  💾 Save                  │
└────────────────────────────────────┘
```

### Substitute Fielders Section
```
┌─ Substitute Fielders ──────────────┐
│ + Record Change                    │
│                                     │
│ Ecclestone → Georgia Adams          │
│ 🤕 Injury  Over 8.4                │
│                                     │
│ [Removed: ✕]                       │
└────────────────────────────────────┘
```

## 📱 Mobile Tips

- Use **landscape mode** for better button layout
- Tap buttons quickly - they respond in 100ms
- Use undo if mistouch happens
- Auto-save on every successful ball

## 🌍 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Safari
- ✅ Firefox
- ❌ IE11 (not supported)

## 🔐 Admin Authentication

- Login at `/wpl-admin-2026`
- Token stored in localStorage
- Auto-logout after 1 hour
- Re-login on expired token

## 📊 Live Public Scorecard

After entering ball:
1. Public scorecard updates in 5 seconds (polling)
2. Changes visible on `/wpl` page
3. Commentary shows ball-by-ball
4. Statistics auto-calculate

## 🎓 Best Practices

✅ **DO:**
- Set Playing 11 before match starts
- Use correct dismiss types for accuracy
- Record fielding changes for transparency
- Save manually if unsure
- Check green "Saved ✓" after each ball

❌ **DON'T:**
- Change batter outside playing 11
- Edit previous overs (use undo)
- Force refresh during live match
- Mix up batter/bowler positions

## 📞 Need Help?

- **Playing 11 issues**: Check `/wpl-admin-2026/playing-11` page
- **Fielding questions**: See "Record Change" section above
- **Data missing**: Verify players assigned to teams first
- **API errors**: Check connection and retry

## 🚀 Advanced Features

### Keyboard Shortcuts
- `0` = Dot
- `1` = Single
- `4` = Four
- `6` = Six
- `W` = Wicket
- `U` = Undo
- `S` = Save

### Commentary
- Auto-generated from each ball
- Stores last 10 events
- Shows: "Over 12.3: 4 runs"
- Displays wickets: "WICKET! Caught at long-on"

### Statistics
- Live batting stats
- Live bowling stats
- Strike rate trends
- Economy rate trends

---

**Last Updated**: January 10, 2026
**System**: WPL Live-Score Admin v2.0
**Build**: Production Ready ✓
