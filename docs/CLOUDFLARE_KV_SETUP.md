# Cloudflare KV Setup Guide - IPL 2026 Website

## 🚀 Overview

This guide explains how to set up Cloudflare Workers KV for persistent data storage. With KV, your data will persist across page refreshes and be available globally.

---

## 📋 Prerequisites

- Cloudflare account
- Wrangler CLI installed
- Project already set up locally

---

## 🔧 Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

---

## 🔑 Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate. Follow the prompts and authorize Wrangler.

---

## 📦 Step 3: Create KV Namespaces

Create two KV namespaces (one for production, one for preview):

```bash
# Production namespace
wrangler kv:namespace create "IPL_CACHE"

# Preview namespace (for testing)
wrangler kv:namespace create "IPL_CACHE" --preview
```

You'll get output like:
```
✓ Created namespace with title "IPL_CACHE"
 Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "IPL_CACHE"
id = "your_namespace_id_here"
preview_id = "your_preview_id_here"
```

---

## ⚙️ Step 4: Update wrangler.toml

Copy the namespace IDs from the output above and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your_production_id"
preview_id = "your_preview_id"
```

---

## 🔗 Step 5: Update next.config.js

Add Cloudflare configuration to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'],
  },
  // Cloudflare Pages configuration
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
```

---

## 📝 Step 6: Create .env.local

```env
# Cloudflare Configuration
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your_account_id
NEXT_PUBLIC_CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## 🧪 Step 7: Test Locally

The KV integration works automatically when deployed to Cloudflare. For local testing:

```bash
npm run dev
```

The app will use mock data locally and KV when deployed.

---

## 🚀 Step 8: Deploy to Cloudflare Pages

### Option A: Using Wrangler

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy ./out
```

### Option B: Using GitHub Integration

1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Create new project → Connect to Git
4. Select your repository
5. Configure build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`
6. Add environment variables in Cloudflare Dashboard

---

## ✅ Verify KV Setup

After deployment, verify KV is working:

1. Go to Cloudflare Dashboard
2. Navigate to Workers → KV
3. Click on your namespace
4. You should see keys being created as you add data

---

## 📊 How Data Flows

### Adding Data (Admin Panel)
```
Admin Form → API Route → KV Storage → Persisted Globally
```

### Retrieving Data (Public Pages)
```
Page Load → API Route → Check KV → Return Data → Display
```

### Data Persistence
```
Refresh Page → API Route → KV Still Has Data → Display Same Data
```

---

## 🔄 KV Operations

### Get Data
```typescript
const data = await getFromKV('ipl:teams');
```

### Store Data
```typescript
await setInKV('ipl:teams', teamsArray);
```

### Delete Data
```typescript
await deleteFromKV('ipl:teams');
```

### List Keys
```typescript
const keys = await listKVKeys('ipl:');
```

---

## 🎯 Available KV Keys

```typescript
KV_KEYS = {
  TEAMS: 'ipl:teams',
  PLAYERS: 'ipl:players',
  MATCHES: 'ipl:matches',
  NEWS: 'ipl:news',
  CONTENT: 'ipl:content',
  PREDICTIONS: 'ipl:predictions',
  SETTINGS: 'ipl:settings'
}
```

---

## 🔒 Security Best Practices

1. **Never expose API tokens** in client-side code
2. **Use environment variables** for sensitive data
3. **Validate all inputs** before storing in KV
4. **Set TTL** for sensitive data:
   ```typescript
   await setInKV(key, value, 3600); // 1 hour TTL
   ```

---

## 📈 Monitoring KV Usage

### View KV Stats
1. Cloudflare Dashboard → Workers → KV
2. Click on your namespace
3. View read/write operations

### Pricing
- **Free tier**: 100,000 reads/day, 1,000 writes/day
- **Paid tier**: Unlimited operations

---

## 🐛 Troubleshooting

### KV Not Working Locally
- KV only works when deployed to Cloudflare
- Locally, the app uses mock data as fallback
- This is by design for development

### Data Not Persisting
- Check if KV namespace is properly configured
- Verify namespace ID in `wrangler.toml`
- Check Cloudflare Dashboard for errors

### Deployment Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build

# Try deploying again
wrangler pages deploy ./out
```

### Can't Authenticate
```bash
# Re-authenticate
wrangler logout
wrangler login
```

---

## 📚 Example: Adding a Match

### Step 1: Admin submits form
```typescript
const response = await fetch('/api/matches', {
  method: 'POST',
  body: JSON.stringify(matchData)
});
```

### Step 2: API stores in KV
```typescript
// In /api/matches/route.ts
const existingMatches = await getFromKV('ipl:matches');
const updatedMatches = [...existingMatches, newMatch];
await setInKV('ipl:matches', updatedMatches);
```

### Step 3: Data persists
- Refresh page → Data still there ✅
- Other users see it → Global availability ✅
- Survives server restart → Persistent ✅

---

## 🎓 Next Steps

1. Deploy to Cloudflare Pages
2. Test adding/editing data in admin panel
3. Refresh page and verify data persists
4. Check Cloudflare Dashboard for KV operations
5. Monitor usage and performance

---

## 📞 Support

- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

## ✨ Summary

With Cloudflare KV:
- ✅ Data persists across refreshes
- ✅ Global availability
- ✅ Fast performance
- ✅ No database setup needed
- ✅ Scales automatically
- ✅ Free tier available

Your IPL 2026 website is now ready for production deployment! 🚀
