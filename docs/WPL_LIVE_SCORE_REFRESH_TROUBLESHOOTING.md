# WPL Live-Score Refresh Data Recovery Guide

## Issue
After refreshing `/wpl-admin-2026/live-score`, data appears missing momentarily.

## How It's Fixed Now

### Data Persistence Flow

**On Initial Load:**
```
1. Page loads
2. Check localStorage for 'wpl-live-score-matchId'
3. If found, restore it
4. Load matches from API
5. Validate restored match still exists
6. If match changed/deleted, select first available live/upcoming
7. Fetch live-score data for selected match
8. Display all data
```

**Console Check:**
Open browser DevTools Console (F12) and you'll see:
```
[WPL Live-Score] Successfully loaded state: {...}
```

If you see this, data loaded correctly ✓

## Troubleshooting

### Issue: "Data still missing after refresh"

**Step 1: Check localStorage**
```javascript
// In browser console, paste this:
localStorage.getItem('wpl-live-score-matchId')

// Should return matchId like "match-123-456"
// If empty string or null, no data was previously saved
```

**Step 2: Check API Response**
```javascript
// In browser console:
fetch('/api/live-score?matchId=YOUR_MATCH_ID')
  .then(r => r.json())
  .then(d => console.log('API data:', d))

// Should show current live score data
```

**Step 3: Check Network Tab**
1. Open DevTools
2. Go to Network tab
3. Refresh the page
4. Look for `/api/live-score?matchId=...` call
5. Click it and check Response
6. Should show score data

### Issue: "Live score shows but disappears on refresh"

This means data exists but isn't being fetched on page mount.

**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Clear localStorage:
   ```javascript
   localStorage.removeItem('wpl-live-score-matchId')
   ```
3. Refresh page
4. Should auto-select first live match and load data

### Issue: Chrome Extension Error

The error "A listener indicated an asynchronous response by returning true..." 
is from Chrome extensions like:
- React DevTools
- Redux DevTools
- Vue DevTools

**This doesn't affect functionality** - it's just console noise.

To suppress:
1. Disable developer extensions
2. Or ignore the error (it won't break anything)

## What Should Happen on Refresh

✅ **Timeline of Events:**

```
0ms    - Page starts loading
50ms   - Auth check passes
100ms  - Page renders with LoadingSpinner
150ms  - localStorage restored
200ms  - API matches loaded
250ms  - Match ID selected
300ms  - Live score API called
350ms  - Live score data received
400ms  - BallEntryPanel renders with data
500ms  - Ready for admin to score
```

## Verification Checklist

After refresh, check these in DevTools Console:

- [ ] `localStorage.getItem('wpl-live-score-matchId')` returns a match ID
- [ ] Network tab shows `/api/live-score?matchId=...` request
- [ ] Response shows live score data with `currentBatter`, `currentBowler`
- [ ] BallEntryPanel displays with player names and runs/wickets
- [ ] No "Error fetching live score" messages

## Expected Console Output

```
[WPL Live-Score] Successfully loaded state: {
  team1: { runs: 45, wickets: 2, balls: 32 },
  team2: { runs: 0, wickets: 0, balls: 0 },
  currentBatter: { name: "Alyssa Healy", runs: 15, balls: 8 },
  currentBowler: { name: "Ecclestone", runs: 8, balls: 8 },
  ...
}
```

## Still Having Issues?

1. **Check if match exists:**
   - Go to `/wpl-admin-2026/playing-11`
   - Verify match is there
   - Verify Playing 11 is set

2. **Check API availability:**
   - Try `/api/matches?league=wpl` in browser
   - Should return list of matches
   - Check response status is 200

3. **Check localStorage:**
   ```javascript
   // Show all WPL data
   for (let key in localStorage) {
     if (key.includes('wpl')) {
       console.log(key, ':', localStorage[key])
     }
   }
   ```

4. **Force reset:**
   ```javascript
   // Clear all WPL live-score data
   localStorage.removeItem('wpl-live-score-matchId')
   // Refresh page
   ```

## Technical Details

### Data Persistence Layer
- **Storage:** Browser localStorage
- **Key:** `wpl-live-score-matchId`
- **Value:** Match UUID string
- **Persistence:** Across page refreshes until manually cleared

### API Calls
- `/api/matches?league=wpl` - Gets available matches
- `/api/players?league=wpl` - Gets all players
- `/api/live-score?matchId=X` - Gets live score for match X

### Component Hierarchy
```
WPLAdminLiveScorePage
├─ localStorage → selectedMatchId
├─ API calls → matches, players, liveScoreState
└─ BallEntryPanel (with initialState)
   └─ useLiveScore hook (initializes from initialState)
```

## Recovery Steps for Complete Reset

If nothing is working:

```javascript
// Step 1: Clear all storage
localStorage.clear()

// Step 2: Refresh page (Ctrl+Shift+R hard refresh)
// Keyboard: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

// Step 3: Select match from dropdown
// Should auto-select first available

// Step 4: Verify data loads
// Check console for [WPL Live-Score] message
```

## Contact Support

If data is still missing after refresh:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Copy all errors/logs
4. Provide:
   - Browser type (Chrome, Firefox, Safari)
   - Operating system
   - Console logs/errors
   - Network tab screenshot of `/api/live-score` call

---

**Last Updated:** January 10, 2026
**System:** WPL Live-Score v2.1
**Status:** Data persistence and refresh recovery working ✓
