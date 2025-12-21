# Restore IPL Players from Workers KV

## Problem
IPL players were accidentally deleted from Workers KV storage, but WPL players still exist.

## Solution
Use the restore endpoint to add IPL players back without affecting WPL players.

## How to Restore IPL Players

### Option 1: Using Browser/curl

**If deployed:**
```bash
curl "https://YOUR_DOMAIN.pages.dev/api/seed?restoreIPL=true"
```

**If local:**
```bash
curl "http://localhost:8788/api/seed?restoreIPL=true"
```

### Option 2: Using Browser

Navigate to:
- **Deployed**: `https://YOUR_DOMAIN.pages.dev/api/seed?restoreIPL=true`
- **Local**: `http://localhost:8788/api/seed?restoreIPL=true`

## What Happens

1. ✅ **Preserves WPL players** - All WPL players (teamIds 11-15) are kept
2. ✅ **Adds IPL players** - Adds default IPL players (Virat Kohli, Rohit Sharma, Jasprit Bumrah)
3. ✅ **No duplicates** - Won't add players that already exist
4. ✅ **Safe operation** - Only adds, never deletes

## Response

You'll get a JSON response like:
```json
{
  "message": "IPL players restored successfully",
  "restored": 3,
  "existingWPL": 5,
  "totalPlayers": 8,
  "restoredPlayers": ["Virat Kohli", "Rohit Sharma", "Jasprit Bumrah"]
}
```

## Verify Restoration

After restoring, check the diagnostic endpoint:
```bash
curl "https://YOUR_DOMAIN.pages.dev/api/players?diagnostic=true"
```

You should see:
- IPL players count > 0
- WPL players still present
- Total players = IPL + WPL

## Default IPL Players Restored

1. **Virat Kohli** - RCB (Team ID: 1)
2. **Rohit Sharma** - MI (Team ID: 2)  
3. **Jasprit Bumrah** - MI (Team ID: 2)

## Notes

- This endpoint is **safe to run multiple times** - it won't create duplicates
- It only adds IPL players, never removes WPL players
- If you need more IPL players, add them through the admin interface after restoration

