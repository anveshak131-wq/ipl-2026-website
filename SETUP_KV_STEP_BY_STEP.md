# Setup Cloudflare KV - Step by Step 🔧

## ⚠️ Fix the Error

You got this error because `wrangler.toml` had empty KV namespace IDs. Follow these steps to fix it:

---

## 📋 Step 1: Login to Cloudflare

```bash
wrangler login
```

A browser window will open. Authorize Wrangler and return to terminal.

---

## 📋 Step 2: Create KV Namespaces

Run these commands one by one:

### Create Production Namespace
```bash
wrangler kv:namespace create "IPL_CACHE"
```

**Output will look like:**
```
✓ Created namespace with title "IPL_CACHE"
 Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "CACHE"
id = "abc123def456ghi789"
preview_id = "xyz789uvw456rst123"
```

**Copy the `id` value** (e.g., `abc123def456ghi789`)

### Create Preview Namespace
```bash
wrangler kv:namespace create "IPL_CACHE" --preview
```

**Output will look like:**
```
✓ Created namespace with title "IPL_CACHE" (preview)
 Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "CACHE"
id = "preview_abc123def456ghi789"
preview_id = "preview_xyz789uvw456rst123"
```

**Copy the `id` value** (e.g., `preview_abc123def456ghi789`)

---

## 📋 Step 3: Update wrangler.toml

Open `wrangler.toml` and find this section:

```toml
# NOTE: Add KV namespace bindings after creating them with:
# wrangler kv:namespace create "IPL_CACHE"
# wrangler kv:namespace create "IPL_CACHE" --preview
#
# Then uncomment and update the IDs below:
#
# [[kv_namespaces]]
# binding = "CACHE"
# id = "your_production_namespace_id"
# preview_id = "your_preview_namespace_id"
```

Replace it with (using YOUR IDs from Step 2):

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "abc123def456ghi789"
preview_id = "preview_abc123def456ghi789"
```

**Example:**
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "e1a2b3c4d5e6f7g8h9i0"
preview_id = "preview_j1k2l3m4n5o6p7q8r9s0"
```

---

## 📋 Step 4: Verify wrangler.toml

Your `wrangler.toml` should now look like:

```toml
name = "ipl-2026"
type = "javascript"
account_id = ""
workers_dev = true
route = ""
zone_id = ""

# Cloudflare Pages configuration
pages_build_output_dir = ".next"

# Environment variables
[env.production]
vars = { ENVIRONMENT = "production" }

[env.development]
vars = { ENVIRONMENT = "development" }

# Compatibility settings
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Build configuration
[build]
command = "npm run build"
cwd = "./"
watch_paths = ["src/**/*.ts", "src/**/*.tsx"]

[[kv_namespaces]]
binding = "CACHE"
id = "your_production_id_here"
preview_id = "your_preview_id_here"
```

---

## 📋 Step 5: Test Configuration

```bash
wrangler pages deploy ./out
```

If you get an error about `.next` not existing, run:

```bash
npm run build
wrangler pages deploy ./out
```

---

## ✅ Success!

If you see:
```
✓ Deployment complete!
```

Your KV is now configured! 🎉

---

## 🧪 Test KV is Working

### 1. Deploy to Cloudflare
```bash
npm run build
wrangler pages deploy ./out
```

### 2. Visit Your Site
```
https://your-project.pages.dev
```

### 3. Go to Admin Panel
```
https://your-project.pages.dev/admin
```

### 4. Login
- Username: `admin`
- Password: `admin123`

### 5. Add a Match
- Click "Add Match"
- Fill in details
- Click "Add Match"

### 6. Refresh Page
- Refresh the page
- **Match should still be there!** ✅

### 7. Check KV in Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers → KV
3. Click your namespace
4. You should see your data stored!

---

## 🐛 Troubleshooting

### Error: "id" field is empty
**Solution**: You didn't update `wrangler.toml` with the namespace IDs. Follow Step 3 above.

### Error: Namespace not found
**Solution**: Run Step 2 again to create the namespaces.

### Error: Build failed
**Solution**: 
```bash
rm -rf .next
npm install
npm run build
```

### Data not persisting
**Solution**: 
- Make sure you deployed (not just running locally)
- Check Cloudflare Dashboard → Workers → KV
- Verify namespace ID in wrangler.toml

---

## 📊 Your KV Namespace IDs

**Save these somewhere safe!**

```
Production ID: ___________________________
Preview ID:    ___________________________
```

---

## 🎯 Next Steps

1. ✅ Create KV namespaces
2. ✅ Update wrangler.toml
3. ✅ Deploy to Cloudflare
4. ✅ Test adding data
5. ✅ Verify data persists

---

## 📞 Need Help?

- Check `CLOUDFLARE_KV_SETUP.md` for detailed info
- Check `DEPLOY_TO_CLOUDFLARE.md` for deployment
- Visit [Cloudflare Docs](https://developers.cloudflare.com/kv/)

---

**You're all set!** 🚀
