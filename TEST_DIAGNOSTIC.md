# Testing Diagnostic Endpoint for IPL Players

## Quick Test Methods

### Option 1: Test on Deployed Site (Recommended)

If your site is deployed to Cloudflare Pages:

```bash
# Replace YOUR_DOMAIN with your actual domain
curl "https://YOUR_DOMAIN.pages.dev/api/players?diagnostic=true" | jq

# Or use the test script:
API_URL=https://YOUR_DOMAIN.pages.dev node test-diagnostic.mjs
```

### Option 2: Test Locally with Wrangler

1. **Start the dev server:**
```bash
npm run build
wrangler pages dev out --port 8788 --kv IPL_CACHE --kv SPORTS_KV --kv WEATHER_CACHE
```

2. **In another terminal, run the test:**
```bash
node test-diagnostic.mjs
```

Or use curl:
```bash
curl "http://localhost:8788/api/players?diagnostic=true" | jq
```

### Option 3: Test in Browser

Open your browser and navigate to:
- **Local**: `http://localhost:8788/api/players?diagnostic=true`
- **Deployed**: `https://YOUR_DOMAIN.pages.dev/api/players?diagnostic=true`

## What the Diagnostic Shows

The diagnostic endpoint returns:
- **Summary**: Total count of IPL, WPL, and unknown players
- **IPL Players**: Full list with details (name, teamId, league, role)
- **WPL Players**: Full list with details
- **Unknown Players**: Players with invalid team IDs

## Expected Results

After the fixes:
- ✅ IPL players should have `league: 'ipl'` and teamIds 1-10
- ✅ WPL players should have `league: 'wpl'` and teamIds 11-15
- ✅ Ellyse Perry should be in WPL with teamId '12' (RCB-W)
- ✅ No IPL players should be incorrectly marked as WPL

## Troubleshooting

If you see "No IPL players found":
1. Check if players exist: `/api/players` (without diagnostic)
2. Use seed endpoint to restore: `/api/seed`
3. Check KV storage in Cloudflare Dashboard
