# 🔧 Environment Setup Guide

This guide walks through setting up all required environment variables for the IPL 2026 website.

---

## 📋 Environment Variables Overview

The application requires configuration in two places:
1. **Cloudflare wrangler.toml** - Backend configuration
2. **Application .env files** - Frontend configuration (optional)

---

## 🚀 Cloudflare Configuration (wrangler.toml)

Your `wrangler.toml` should look like this:

```toml
name = "ipl-2026-website"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
route = ""
zone_id = ""

# Build configuration
[env.production]
vars = { ENVIRONMENT = "production" }

# Triggers
[triggers]
crons = ["0 */6 * * *"]  # Health check every 6 hours

# Analytics Engine binding (optional but recommended)
[[analytics_engine_datasets]]
binding = "ANALYTICS"

# KV Namespace binding (REQUIRED)
[[kv_namespaces]]
binding = "SPORTS_KV"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_NAMESPACE_ID"

# Build output
[build]
command = "npm run build"
cwd = "."
watch_paths = ["src/**/*.tsx", "src/**/*.ts", "functions/**/*.js"]

[build.upload]
format = "service-worker"
main = "./functions/api/*.js"

# Development server
[env.development]
vars = { ENVIRONMENT = "development" }

[[env.development.kv_namespaces]]
binding = "SPORTS_KV"
id = "YOUR_DEV_KV_NAMESPACE_ID"
```

---

## 🔑 Required Environment Variables

### 1. Cloudflare Account Credentials

**Where to find:**
- Go to https://dash.cloudflare.com
- Click profile icon → Account settings
- Copy "Account ID"

```toml
account_id = "1a2b3c4d5e6f7g8h9i0j"
```

---

### 2. KV Namespace Setup

**Create namespace:**
```bash
# If not already created
wrangler kv:namespace create SPORTS_KV
wrangler kv:namespace create SPORTS_KV --preview
```

**Add to wrangler.toml:**
```toml
[[kv_namespaces]]
binding = "SPORTS_KV"
id = "production_id_here"
preview_id = "preview_id_here"
```

**Example IDs:**
```
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
preview_id = "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k"
```

---

### 3. Setup Key (For Admin Creation)

**Purpose:** Prevents unauthorized admin account creation after setup

**Set as environment variable:**
```toml
[env.production]
vars = { 
  ENVIRONMENT = "production",
  SETUP_KEY = "change-me-to-random-key-12345"
}
```

**Generate secure key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**
```
SETUP_KEY = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

**⚠️ SECURITY:** 
- Change this to a strong random value
- Store securely (don't commit to git)
- Change after first admin account creation (optional)

---

### 4. CORS Configuration

**If hosting on custom domain:**

```toml
[env.production]
vars = {
  ENVIRONMENT = "production",
  ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
}
```

**If using localhost for testing:**
```toml
[env.development]
vars = {
  ENVIRONMENT = "development",
  ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001"
}
```

---

## 📝 Complete wrangler.toml Template

```toml
# IPL 2026 Website Configuration
name = "ipl-2026-website"
type = "javascript"
account_id = "REPLACE_WITH_YOUR_ACCOUNT_ID"
workers_dev = true
route = ""
zone_id = ""

# Build configuration
[build]
command = "npm run build"
cwd = "."
watch_paths = ["src/**/*.tsx", "src/**/*.ts", "functions/**/*.js"]

[build.upload]
format = "service-worker"
main = "./functions/api/*.js"

# KV Namespace binding (REQUIRED)
[[kv_namespaces]]
binding = "SPORTS_KV"
id = "REPLACE_WITH_YOUR_PRODUCTION_KV_ID"
preview_id = "REPLACE_WITH_YOUR_PREVIEW_KV_ID"

# Production environment
[env.production]
name = "ipl-2026-website-prod"
route = "yourdomain.com/*"
vars = {
  ENVIRONMENT = "production",
  SETUP_KEY = "REPLACE_WITH_SECURE_RANDOM_KEY",
  ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
}

[env.production.kv_namespaces]
binding = "SPORTS_KV"
id = "REPLACE_WITH_YOUR_PRODUCTION_KV_ID"
preview_id = "REPLACE_WITH_YOUR_PREVIEW_KV_ID"

# Development environment
[env.development]
name = "ipl-2026-website-dev"
vars = {
  ENVIRONMENT = "development",
  SETUP_KEY = "dev-key-change-in-production",
  ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001"
}

[[env.development.kv_namespaces]]
binding = "SPORTS_KV"
id = "REPLACE_WITH_YOUR_DEV_KV_ID"

# Triggers (optional)
[triggers]
crons = ["0 */6 * * *"]  # Run health check every 6 hours

# Analytics Engine (optional but recommended)
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

---

## 🔍 Verification Steps

### 1. Verify Account ID

```bash
# Test wrangler configuration
wrangler whoami

# Should output your Cloudflare account info
# Example:
# You are logged in with an API Token to account: example@email.com
# 🌍 Account ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

### 2. Verify KV Namespace

```bash
# List KV namespaces
wrangler kv:namespace list

# Should show:
# ┌─────────────────────────────────────────┐
# │ id                                      │
# ├─────────────────────────────────────────┤
# │ a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6      │ (production)
# │ z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k      │ (preview)
# └─────────────────────────────────────────┘
```

---

### 3. Test KV Access

```bash
# Put a test key
wrangler kv:key put --binding=SPORTS_KV "test-key" '{"test": "data"}' \
  --namespace-id="YOUR_KV_ID"

# Get the key
wrangler kv:key get --binding=SPORTS_KV "test-key" \
  --namespace-id="YOUR_KV_ID"

# Should output: {"test": "data"}

# Delete the key
wrangler kv:key delete --binding=SPORTS_KV "test-key" \
  --namespace-id="YOUR_KV_ID"
```

---

### 4. Test Local Development

```bash
# Start local development server
npm run dev

# Should output:
# ▲ Next.js [version]
# - Local: http://localhost:3000
# ✓ Ready in [time]ms

# Open http://localhost:3000 and verify pages load
# Open http://localhost:3000/admin/login and test login flow
```

---

## 🔐 Security Best Practices

### ✅ DO

- ✅ Use strong random values for `SETUP_KEY`
- ✅ Change `SETUP_KEY` after first admin account creation
- ✅ Keep `wrangler.toml` out of public repositories
- ✅ Use separate KV namespaces for dev/prod
- ✅ Rotate credentials periodically
- ✅ Monitor KV access patterns
- ✅ Enable Cloudflare DDoS protection

### ❌ DON'T

- ❌ Commit sensitive credentials to git
- ❌ Use simple passwords or keys
- ❌ Reuse credentials across environments
- ❌ Share wrangler.toml publicly
- ❌ Leave default SETUP_KEY in production
- ❌ Use HTTP (always use HTTPS)
- ❌ Expose KV namespace IDs publicly

---

## 🚀 Deployment Configuration

### Cloudflare Pages Setup

**In Cloudflare Dashboard:**

1. **Workers → Overview**
   - Verify account is connected

2. **Pages → Create → Connect Git**
   - Select your repository
   - Branch: `main`
   - Build command: `npm run build`
   - Build output directory: `out`

3. **Pages → Settings → Environment**
   - Set production environment variables:

```
ENVIRONMENT = production
SETUP_KEY = your-secure-key
```

4. **Pages → Settings → Functions**
   - Verify "Enable Functions" is checked
   - Verify KV namespace is bound in wrangler.toml

5. **Pages → Custom domains**
   - Add your custom domain
   - Enable SSL/TLS

---

## 📊 Environment Comparison

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| ENVIRONMENT | development | staging | production |
| DEBUG | true | false | false |
| SETUP_KEY | dev-key | staging-key | random-secure-key |
| ALLOWED_ORIGINS | localhost:3000 | staging-url | yourdomain.com |
| KV_NAMESPACE | dev_namespace | staging_namespace | prod_namespace |
| LOG_LEVEL | debug | info | error |

---

## 🐛 Troubleshooting

### Issue: "KV Namespace not found"

**Error:**
```
Error: The namespace with ID 'xxx' does not exist.
```

**Solution:**
1. Verify KV ID in wrangler.toml is correct
2. Run `wrangler kv:namespace list` to see available namespaces
3. Create namespace if missing: `wrangler kv:namespace create SPORTS_KV`
4. Update wrangler.toml with correct ID

---

### Issue: "Invalid Account ID"

**Error:**
```
Error: Authentication failed. Could not verify account id.
```

**Solution:**
1. Run `wrangler whoami` to verify authentication
2. Verify account_id in wrangler.toml matches output
3. Check Cloudflare API token is valid
4. Re-authenticate: `wrangler logout` then `wrangler login`

---

### Issue: "SETUP_KEY not working"

**Error:**
```
403 Forbidden: Invalid setup key
```

**Solution:**
1. Verify SETUP_KEY is set in environment variables
2. Check it hasn't been changed after initial admin creation
3. Verify it's the same value in local dev and production
4. Generate new key if needed: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### Issue: "KV operations too slow"

**Error:**
```
Timeout waiting for KV response
```

**Solution:**
1. Check KV quota usage (Analytics → KV)
2. Verify no request loops (e.g., polling KV too frequently)
3. Consider caching responses in Worker memory
4. Check network connectivity to Cloudflare

---

## 📚 Reference Links

- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/cli-wrangler/)
- [Cloudflare Workers KV](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Environment Variables Documentation](https://developers.cloudflare.com/workers/configuration/environment-variables/)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

```
CONFIGURATION
[ ] wrangler.toml configured with correct account_id
[ ] KV namespace created and linked
[ ] Production KV ID set in wrangler.toml
[ ] SETUP_KEY set to secure random value
[ ] ALLOWED_ORIGINS configured for production domain
[ ] Environment set to "production"

SECURITY
[ ] No credentials committed to git
[ ] SETUP_KEY different from development
[ ] HTTPS enabled on custom domain
[ ] Cloudflare DDoS protection enabled
[ ] WAF rules configured

VERIFICATION
[ ] npm run build completes without errors
[ ] wrangler deployment test successful
[ ] KV connectivity verified
[ ] Admin account creation tested
[ ] All API endpoints responding
[ ] Pages loading correctly

DOCUMENTATION
[ ] wrangler.toml documented
[ ] Environment setup guide stored
[ ] Backup of configuration maintained
[ ] Team notified of deployment
```

---

## 📞 Support

For environment setup issues:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review [Cloudflare Documentation](https://developers.cloudflare.com/)
3. Check project [GitHub Issues](https://github.com/yourrepo/issues)
4. Contact DevOps team

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Ready for Deployment

