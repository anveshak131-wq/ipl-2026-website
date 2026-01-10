# WPL Live-Score Admin & Playing 11 Enforcement

## Overview

This system implements proper cricket live-scoring with Playing 11 enforcement and flexible fielding substitutes. After the toss is selected in WPL, admins must set the Playing 11 for both teams before live scoring can begin.

## Architecture

### 1. **Playing 11 Selection** (`/wpl-admin-2026/playing-11`)
- Admins select exactly 11 players per team **before the match starts**
- Data structure:
  ```typescript
  playing11: {
    team1: [playerId1, playerId2, ..., playerId11],
    team2: [playerId1, playerId2, ..., playerId11],
    setAt: ISO timestamp
  }
  ```
- Players are stored in match record and used for validation

### 2. **Live-Score Admin** (`/wpl-admin-2026/live-score`)
- Admins record ball-by-ball updates after match starts
- **REQUIRES Playing 11 to be set** - warning banner shown if missing
- Validates that:
  - Current batter is from Playing 11
  - Current bowler is from Playing 11
  - Batting and bowling lineups follow playing 11

### 3. **Fielding Flexibility** (SubstituteFielderManager)
- Fielders can be ANY squad player (not restricted to Playing 11)
- Allows for:
  - **Injury substitutes**: Player gets injured, replaced by reserve
  - **Tactical changes**: Manager substitutes for strategy
  - **Impact player**: IPL/WPL impact player substitution
  - **Fatigue management**: Rotate fresh player for tiring conditions
- Tracks:
  - Which fielder was replaced
  - Who the substitute is
  - Reason for change
  - Time of substitution (over.ball)

## Data Flow

```
Toss Selection
    ↓
Playing 11 Setup (Required)
    ↓
Live Scoring Starts
    │
    ├─ Batter Selection → Must be from Playing 11
    ├─ Bowler Selection → Must be from Playing 11
    └─ Fielding Changes → Any squad player (tracked separately)
    ↓
Score Update to API
```

## Technical Implementation

### Player Filtering in BallEntryPanel

```typescript
// Only show playing 11 for batting/bowling
const battingTeamPlaying11 = playing11 
  ? (state.battingTeam === 'team1' ? playing11.team1 : playing11.team2)
  : undefined;

const battingTeamPlayers = battingTeamPlaying11
  ? players.filter(p => p.teamId === battingTeamId && battingTeamPlaying11.includes(p.id))
  : players.filter(p => p.teamId === battingTeamId);

// Similar logic for bowling team
```

### Fielder Selection (No Restrictions)

Wicket modal receives ALL players:
```typescript
<WicketModal
  players={players}  // All squad players, not filtered
  // ...
/>
```

This allows fielders to come from:
- Playing 11 (primary fielders)
- Bench/reserves (injury subs)
- Any other squad member

## Usage Flow

### For Admin - Pre-Match

1. Go to `/wpl-admin-2026/playing-11`
2. Select the match
3. Select exactly 11 players for each team
4. Click "Save" to lock in playing 11

### For Admin - During Match

1. Go to `/wpl-admin-2026/live-score`
2. Select the match
3. If warning shows "Playing 11 Not Set":
   - Click link to go back to Playing 11
   - Set the lineups first
4. Start recording balls:
   - When changing batter/bowler: Only players from playing 11 appear
   - When entering wicket (caught/run out): Can select ANY fielder
5. If fielding change needed (injury/tactic):
   - Use "Substitute Fielders" section
   - Record which fielder is being replaced and by whom
   - Specify reason for change

## Key Rules

### ✅ Always Enforced
- Batter MUST be from Playing 11
- Bowler MUST be from Playing 11
- Can't have same player bat and bowl simultaneously

### ✅ Flexible (No Restrictions)
- Fielders can be anyone from squad
- Fielding changes tracked separately
- Multiple substitutes for same position allowed
- Injury/tactical reasons don't prevent fielding

### ✅ Validation
- Playing 11 must be exactly 11 players per team
- Can't select same player twice in playing 11
- Fielding substitutes must be from team squad

## Database Schema

### Match Record
```typescript
{
  id: string;
  status: 'upcoming' | 'live' | 'completed';
  team1: Team;
  team2: Team;
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'field';
  };
  playing11?: {
    team1: string[]; // player IDs
    team2: string[]; // player IDs
    setAt: ISO timestamp;
  };
  // ... other fields
}
```

### Live-Score Record
```typescript
{
  matchId: string;
  team1: { runs, wickets, overs };
  team2: { runs, wickets, overs };
  currentBatter: { name, runs, balls };
  currentBowler: { name, runs, balls };
  playing11: { team1[], team2[] }; // Reference to selected players
  fieldingChanges: {
    substitutes: [{
      id: string;
      playerId: string;
      playerName: string;
      replacedId: string;
      replacedName: string;
      time: "12.3"; // over.ball
      reason: string;
    }];
  };
  // ... other fields
}
```

## Real-World Examples

### Example 1: Injury Substitution
- Batter: Alyssa Healy (Playing 11) - batting normally
- Bowler: Ecclestone (Playing 11) - fielding
- **Injury**: Ecclestone gets injured while fielding
- **Action**: Record substitute fielder change:
  - Replaced: Ecclestone
  - Substitute: Georgia Adams (from squad bench)
  - Reason: Injury
  - Time: Over 8.4
- **Result**: Adams now in Ecclestone's fielding position, but lineups unchanged

### Example 2: Impact Player (IPL Only)
- Playing 11 set before match
- During 6th over: Impact player can enter
- **Action**: Record substitute:
  - Replaced: Original fielder
  - Substitute: Impact player
  - Reason: Impact Player (IPL)
- **Result**: Impact player can field, but original playing 11 intact

### Example 3: Tactical Change
- Team wants fresh bowler in powerplay
- **Action**: Change bowler in BallEntryPanel
- **System**: Shows only Playing 11 bowlers - select next bowler
- **Result**: New bowler from playing 11 takes over

## API Integration

### Endpoints Used

```bash
# Get matches
GET /api/matches?league=wpl

# Get players
GET /api/players?league=wpl

# Save live score (includes playing11 & field changes)
POST /api/live-score
{
  matchId: string;
  scoreUpdate: {
    team1: { runs, wickets, overs };
    team2: { runs, wickets, overs };
    playing11: { team1[], team2[] };
    fieldingChanges: [...];
  };
}
```

## Color Scheme

### WPL
- Primary: Purple (`#A855F7`)
- Accent: Pink (`#EC4899`)
- Background: Dark purple with gradient

### IPL
- Primary: Blue (`#3B82F6`)
- Accent: Gold (`#FFD700`)
- Background: Dark slate with gradient

## Troubleshooting

### "Playing 11 Not Set" Warning
- **Cause**: No playing11 data in match record
- **Solution**: Click link to go to Playing 11 page and set the teams

### Can't Select Player as Batter/Bowler
- **Cause**: Player is not in Playing 11
- **Solution**: Go to Playing 11 page and add them

### Fielder Not Appearing in Wicket Modal
- **Cause**: Fielder may not be in any team squad
- **Solution**: Add player to team squad first

## Future Enhancements

- [ ] Live update of fielding position display on public scorecard
- [ ] Automatic fielding change tracking on wickets
- [ ] Injury/tactical reason templates
- [ ] Historical tracking of all fielding changes
- [ ] Visual fielding position diagram
- [ ] Impact player countdown timer (IPL)
