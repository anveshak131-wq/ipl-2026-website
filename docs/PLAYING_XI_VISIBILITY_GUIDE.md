# Playing XI Visibility Rules - IPL/WPL 2027

## Overview
This feature allows admins to manage the **Playing XI** (playing 11) for IPL and WPL matches with controlled visibility:
- **Admins** can set/edit playing 11 at any time
- **End Users** can only see the playing XI starting 30 minutes before match begins

## How It Works

### Admin Functionality
1. Go to: `https://ipl-2026-website.pages.dev/ipl-admin-2026/playing-11`
2. Select a match (IPL or WPL)
3. Choose exactly 11 players for each team
4. Click **Save Playing 11**
5. When saved, the timestamp is recorded (this allows users to see it 30 minutes before match)

**Key Point**: Admins can modify the playing 11 at any time—even after initially setting it.

### User Visibility Rules
Users will see the playing XI based on these conditions:

| Condition | Visible? |
|-----------|----------|
| Match not started yet + 30+ mins remaining | ❌ No |
| Within 30 minutes of match start | ✅ Yes (if set by admin) |
| Match is live | ✅ Yes |
| Match completed | ✅ Yes |

### Example Timeline
```
Match scheduled for 7:00 PM IST

5:00 PM - 6:29 PM  → Playing XI hidden ("Will be revealed in X minutes")
6:30 PM - 7:00 PM  → Playing XI visible to users
7:00 PM onwards    → Playing XI always visible
```

## Technical Implementation

### Database Changes
- Match type now includes `playing11.setAt` field (ISO timestamp)
- Tracks exactly when admin set the playing XI

### Key Files Updated
1. **src/types/index.ts** - Updated Match interface
2. **src/lib/playing11Utils.ts** - New utility functions for visibility checks
3. **src/app/ipl-admin-2026/playing-11/page.tsx** - Admin page (records timestamp)
4. **src/components/matches/Playing11Display.tsx** - User-facing component

### Utility Functions

```typescript
import { 
  canViewPlaying11,
  isPlaying11VisibleNow,
  getPlaying11VisibilityMessage,
  getPlaying11VisibilityTime
} from '@/lib/playing11Utils';

// Check if user can see playing 11
const canSee = isPlaying11VisibleNow(
  match.date,        // "2027-04-10"
  match.time,        // "19:00"
  match.playing11?.setAt // ISO timestamp
);

// Get user-friendly message about when XI becomes visible
const msg = getPlaying11VisibilityMessage(
  match.date,
  match.time
);
// Returns: "Playing XI will be revealed in 15 minutes"
```

## Integration in Your Pages

### Using Playing11Display Component

```tsx
import Playing11Display from '@/components/matches/Playing11Display';

export default function MatchDetail({ match }: { match: Match }) {
  const [players, setPlayers] = useState<Player[]>([]);

  // ... fetch players ...

  return (
    <div>
      {/* ... match info ... */}
      
      {/* Playing XI section - automatically handles visibility */}
      <Playing11Display match={match} players={players} />
    </div>
  );
}
```

### Manual Implementation (if needed)

```tsx
import { isPlaying11VisibleNow } from '@/lib/playing11Utils';

if (isPlaying11VisibleNow(match.date, match.time, match.playing11?.setAt)) {
  // Show playing XI players
} else {
  // Show "Coming soon" message
}
```

## Testing Scenarios

### Scenario 1: Admin Sets Playing 11
1. Go to admin playing-11 page
2. Select match (IPL or WPL)
3. Select 11 players for each team
4. Click Save
5. Verify timestamp is recorded

### Scenario 2: User Access Before 30 Minutes
1. Check matchday page for an upcoming match
2. Current time: >30 mins before match
3. ✅ Should see: "Playing XI will be revealed in X minutes"
4. ✅ Should NOT see: Actual player names/numbers

### Scenario 3: User Access Within 30 Minutes
1. Navigate to live-score page
2. Current time: <30 mins before match
3. ✅ Should see: Playing XI with all player names & numbers
4. ✅ Should see: Both teams' playing 11 side-by-side

### Scenario 4: Admin Override
1. Admin navigates to playing-11 page
2. Match has playing 11 already set
3. Admin can delete/change players
4. Click Save
5. New timestamp is recorded
6. Users see the updated XI (if within 30 min window)

## API Endpoints

### Save Playing XI (Admin)
```bash
PUT /api/matches?id=<matchId>
Authorization: Bearer <adminToken>

{
  "id": "match123",
  "date": "2027-04-10",
  "time": "19:00",
  "playing11": {
    "team1": ["player1", "player2", ...],
    "team2": ["player3", "player4", ...],
    "setAt": "2027-04-10T18:30:00Z"  // Auto-set by admin page
  }
}
```

## For Next Year (2027) Rollout

When deploying this for IPL 2027:

1. ✅ Update all match records to include empty `playing11` initially
2. ✅ Train admins to use the playing-11 page
3. ✅ Update all end-user match detail pages to use `Playing11Display` component
4. ✅ Test 30-minute visibility window before first match
5. ✅ Monitor playing11.setAt timestamps in logs to verify admin usage

## Common Issues & Troubleshooting

### "Playing XI still not visible at 6:30 PM"
- **Check**: Did admin actually save the playing 11?
- **Check**: Look at `match.playing11.setAt` in the match data
- **Solution**: Have admin go to playing-11 page and save again

### "Users can see playing 11 too early"
- **Check**: Current time vs match start time
- **Check**: Verify `getPlaying11VisibilityTime()` calculation
- **Solution**: Check client's system time is correct

### Playing XI showing wrong players
- **Check**: Did admin select all 11 players?
- **Check**: Verify player IDs match in database
- **Solution**: Admin can re-save to fix

---

For questions or issues, refer to the utility functions in `src/lib/playing11Utils.ts` or the admin page in `src/app/ipl-admin-2026/playing-11/page.tsx`.
