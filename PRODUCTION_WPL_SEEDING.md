# Production WPL Data Seeding Guide

## Overview
The WPL Scorecard Admin at `https://ipl-2026-website.pages.dev/ipl-admin-2026/scorecard` requires WPL data (teams, matches, players) to be present in your Cloudflare KV storage.

## The Issue
When you see:
```
✗ No WPL players available. Please seed WPL data: POST /api/admin/seed-wpl-data
```

This means the production Cloudflare KV doesn't have WPL data initialized.

## Solution: Seed WPL Data

### Step 1: Deploy the Latest Code
Make sure your latest code is deployed to Cloudflare Pages:
```bash
git push  # This triggers automatic deployment
```

Wait for the deployment to complete. You can monitor it at:
```
https://dash.cloudflare.com/
→ Pages → ipl-2026-website
```

### Step 2: Seed the Data
Once deployed, make a POST request to the seed endpoint:

```bash
curl -X POST https://ipl-2026-website.pages.dev/api/admin/seed-wpl-data \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json"
```

### Step 3: Verify Success
You should get a response like:
```json
{
  "success": true,
  "message": "WPL data seeded successfully",
  "stats": {
    "teamsAdded": 5,
    "matchesAdded": 5,
    "playersAdded": 12,
    "totalTeams": 15,
    "totalMatches": 30,
    "totalPlayers": 100
  }
}
```

### Step 4: Refresh the Admin Page
Go back to:
```
https://ipl-2026-website.pages.dev/ipl-admin-2026/scorecard
```

Refresh the page. You should now see:
- ✅ 5 WPL matches available
- ✅ 12 WPL players loaded
- ✅ No error messages

## What Gets Seeded

### WPL Teams (5)
- Mumbai Indians (WPL) - MI-W
- Royal Challengers Bengaluru (WPL) - RCB-W
- Delhi Capitals (WPL) - DC-W
- Gujarat Giants (WPL) - GG
- UP Warriorz (WPL) - UPW

### WPL Matches (5)
- MI-W vs RCB-W - Feb 15, 2026
- UPW vs GG - Feb 16, 2026
- DC-W vs MI-W - Feb 17, 2026
- RCB-W vs GG - Feb 18, 2026

### WPL Players (12)
- Harmanpreet Kaur (MI-W Captain)
- Smriti Mandhana (RCB-W Captain)
- Ellyse Perry (RCB-W)
- Sophie Devine (GG Captain)
- Meg Lanning (DC-W Captain)
- And 7 more international and domestic players

## Notes on the Seed Endpoint

- **Location**: `/api/admin/seed-wpl-data`
- **Method**: POST
- **Authentication**: Requires `Authorization: Bearer <token>` header
- **Idempotent**: Safe to call multiple times - won't create duplicates
- **Production Safe**: Will preserve existing data and only add new teams/matches/players
- **KV Storage**: Uses your production Cloudflare IPL_CACHE namespace

## Troubleshooting

### Error: "Unauthorized"
Make sure you include the Authorization header:
```bash
-H "Authorization: Bearer admin-token"
```

### Error: "Failed to seed WPL data"
Check:
1. Your Cloudflare Pages deployment is active
2. KV namespace `IPL_CACHE` exists in your Cloudflare dashboard
3. The endpoint is properly deployed (wait for build to complete)

### Data Not Showing After Seeding
1. Wait 30 seconds for KV propagation
2. Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check browser console for any errors

## For Local Development

If you're developing locally with `npm run dev:wrangler`:

The WPL data is already pre-seeded in local development. Just:
1. Run `npm run dev:wrangler`
2. Visit `http://localhost:8788/wpl-admin-2026/scorecard`
3. Data loads automatically

## Production Deployment Checklist

- [ ] Push code to main branch (includes seed endpoint)
- [ ] Wait for Cloudflare Pages build to complete
- [ ] Run the seed-wpl-data endpoint
- [ ] Verify data appears in admin pages
- [ ] Test creating a WPL scorecard
- [ ] Verify scorecard is saved to KV

---

**Last Updated**: January 15, 2026
