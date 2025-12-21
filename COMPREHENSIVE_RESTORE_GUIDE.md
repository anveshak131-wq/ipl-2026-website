# Comprehensive IPL Players Restore Guide

## 🚨 Situation
200+ IPL players were accidentally deleted from Workers KV. Unfortunately, Cloudflare KV doesn't have built-in backup/recovery, so we need to restore from available sources.

## ✅ Solution Created

### 1. Restore Endpoint
**URL**: `/api/restore-players`

**Methods**:
- **GET**: `?restoreAll=true` - Restores starter set (30 players)
- **POST**: Accepts custom player dataset JSON

### 2. Quick Restore (Starter Set)

```bash
# Restore 30 starter players
curl "https://ipl-2026-website.pages.dev/api/restore-players?restoreAll=true"
```

### 3. Restore Full Dataset (If You Have Backup)

If you have a backup file or can export players from another source:

```bash
# Create a JSON file with your players array
# Format: { "players": [/* array of player objects */] }

# Then POST it
curl -X POST "https://ipl-2026-website.pages.dev/api/restore-players" \
  -H "Content-Type: application/json" \
  -d @your-players-backup.json
```

### 4. Player Object Format

Each player should have this structure:
```json
{
  "id": "unique-id",
  "league": "ipl",
  "name": "Player Name",
  "role": "Batsman|Bowler|All-rounder|Wicket-keeper",
  "teamId": "1-10",
  "age": 25,
  "nationality": "India",
  "jerseyNumber": 18,
  "isCaptain": false,
  "bowlingStyle": "Right-arm fast",
  "battingStyle": "Right-handed bat",
  "stats": {
    "matches": 100,
    "runs": 2500,
    "wickets": 50,
    "average": 30.5,
    "strikeRate": 135.2,
    "economy": 7.5,
    "highest": 89,
    "fours": 200,
    "sixes": 100,
    "fifties": 15,
    "hundreds": 2,
    "bestBowling": "3/20"
  }
}
```

## 🔍 Check Current Status

```bash
# Diagnostic endpoint
curl "https://ipl-2026-website.pages.dev/api/players?diagnostic=true" | jq

# Regular endpoint
curl "https://ipl-2026-website.pages.dev/api/players?league=ipl" | jq
```

## 📋 Recovery Options

### Option 1: If You Have a Backup
- Export from admin panel (if available)
- Check Cloudflare Dashboard → Workers KV → Check for any backups
- Use POST endpoint to restore

### Option 2: Recreate Manually
- Use admin panel to add players back
- Or use POST endpoint with your dataset

### Option 3: Use Starter Set + Add More
- Restore starter set (30 players)
- Add remaining players via admin panel or POST endpoint

## 🛡️ Prevention for Future

1. **Regular Backups**: Export players data periodically
2. **Safeguards**: The code now protects IPL players from accidental deletion
3. **Monitoring**: Use diagnostic endpoint to monitor player counts

## 📞 Next Steps

1. **Deploy the restore endpoint** (already created in code)
2. **Call restore endpoint** to get starter set
3. **Add remaining players** via admin panel or POST endpoint
4. **Verify** using diagnostic endpoint

## Files Created

- `functions/api/restore-players.js` - Restore endpoint
- `restore-all-players.sh` - Helper script
- `COMPREHENSIVE_RESTORE_GUIDE.md` - This guide

