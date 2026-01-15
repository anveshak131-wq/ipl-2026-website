# WPL Scorecard Admin - Setup & Fix Guide

## The Problem
You were seeing this error when accessing the WPL Scorecard Admin:
```
✗ Error fetching WPL players from Workers KV. Check if the Workers KV dev server is running on port 8787.
```

## Root Cause
The WPL Scorecard Admin page tries to fetch WPL matches and players from Cloudflare Workers KV. During development, you need to run the **Wrangler dev server** to access KV storage locally, not just the Next.js dev server.

## Solution: Start the Correct Dev Server

### Before (❌ Wrong)
```bash
npm run dev
```
This only starts the Next.js dev server on port 3001, without Cloudflare KV access.

### After (✅ Correct)
```bash
npm run dev:wrangler
```

This command:
1. Starts the Wrangler Pages dev server on port **8788**
2. Proxies requests to a Next.js dev server on port 3000
3. Enables access to Cloudflare Workers KV storage
4. Serves both your app and API routes with KV support

## What Changed in Your Project

### 1. **Updated `package.json`**
Added a new npm script:
```json
"dev:wrangler": "wrangler pages dev -- next dev --port 3000 --hostname localhost"
```

### 2. **Fixed `wrangler.json`**
Removed Pages-specific build configuration that was conflicting with dev mode:
- Removed `pages_build_command`
- Removed `pages_build_output_dir`
- Removed `pages_build_config`

### 3. **Verified `wrangler.toml`**
Kept KV namespace bindings for local development:
```toml
[[kv_namespaces]]
binding = "IPL_CACHE"
id = "local-ipl-cache"
preview_id = "local-ipl-cache-preview"
```

## How to Use the WPL Scorecard Admin

### Step 1: Start the Server
```bash
npm run dev:wrangler
```

Wait for output like:
```
Your Worker has access to the following bindings:
✓ env.IPL_CACHE (local KV Namespace)
✓ env.SPORTS_KV (local KV Namespace)
```

### Step 2: Access the App
Open your browser and navigate to:
```
http://localhost:8788/wpl-admin-2026/scorecard
```

### Step 3: Verify Data is Loaded
You should now see:
- ✅ WPL matches available (showing 5 scheduled matches)
- ✅ WPL players loaded (showing multiple players from different teams)
- ✅ No error messages

### Step 4: Create a Scorecard
1. Click on any match to select it
2. Fill in the match information (toss, venue, etc.)
3. Switch to innings tabs to add batting and bowling stats
4. Save and publish the scorecard

## Available Data

### WPL Matches (Pre-seeded)
- **MI-W vs RCB-W** - Jan 15, 2026 @ 7:30 PM
- **UPW vs GG** - Jan 16, 2026 @ 3:30 PM
- **DC-W vs MI-W** - Jan 17, 2026 @ 7:30 PM
- **RCB-W vs GG** - Jan 18, 2026 @ 3:30 PM
- **UPW vs DC-W** - Jan 19, 2026 @ 7:30 PM

### WPL Teams
- Mumbai Indians (WPL) - MI-W
- Royal Challengers Bengaluru (WPL) - RCB-W
- Delhi Capitals (WPL) - DC-W
- Gujarat Giants - GG
- UP Warriorz - UPW

### WPL Players
Pre-seeded players include:
- Harmanpreet Kaur (MI-W Captain)
- Smriti Mandhana (RCB-W Captain)
- Ellyse Perry (RCB-W)
- Sophie Devine (GG Captain)
- Meg Lanning (DC-W Captain)
- And many more...

## API Endpoints

While developing locally, you can access:

### Get WPL Players
```bash
curl http://localhost:8788/api/players?league=wpl
```

### Get WPL Matches
```bash
curl http://localhost:8788/api/matches?league=wpl
```

### Create a Match (requires admin token)
```bash
curl -X POST http://localhost:8788/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{"league":"wpl","date":"2026-02-01",...}'
```

## Troubleshooting

### Error: "Port already in use"
Kill the existing process:
```bash
lsof -i :8788 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Error: "Cannot connect to localhost:8788"
1. Wait 10 seconds for the server to fully start
2. Check if the terminal shows "Your Worker has access to the following bindings"
3. Look for any error messages in the startup output

### No WPL Data Showing
1. Verify the API endpoint returns data: `curl http://localhost:8788/api/players?league=wpl`
2. Check browser console for error messages
3. Make sure you're using `npm run dev:wrangler` (not `npm run dev`)

### KV Namespace Issues
KV namespaces are stored locally in `.wrangler/state` directory. To reset:
```bash
rm -rf .wrangler/state
npm run dev:wrangler
```

## Next Steps

1. **Create Scorecards**: Use the WPL Scorecard Admin to create match scorecards
2. **View Public Scorecards**: Created scorecards appear at `/wpl/scorecard/[matchId]`
3. **Deploy**: When ready, deploy to Cloudflare Pages with `wrangler deploy`

## Important Notes

- **Local Development**: Use `npm run dev:wrangler` to access KV
- **Production**: Will use actual Cloudflare KV namespace from your account
- **Data Persistence**: Local KV data is stored in `.wrangler/state` during development
- **API Routes**: All `/api/*` routes go through Cloudflare Functions

---

**Last Updated**: January 15, 2026

For more details, see:
- [WPL Scorecard Development Guide](docs/WPL_SCORECARD_DEVELOPMENT_GUIDE.md)
- [WPL Scorecard Quick Reference](docs/WPL_SCORECARD_QUICK_REFERENCE.md)
