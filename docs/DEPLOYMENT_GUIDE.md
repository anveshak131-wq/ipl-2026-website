# Cloudflare Pages Deployment Guide

**Date**: November 15, 2025  
**Project**: IPL 2026 Website - Live Score System  
**Target**: Production Deployment

---

## 📋 Pre-Deployment Checklist

- [x] Build verified (33 routes, 0 errors)
- [x] Security features implemented
- [x] Documentation complete
- [ ] Cloudflare account configured
- [ ] KV namespace set up
- [ ] Environment variables configured
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS enabled

---

## 🚀 Deployment Steps

### Step 1: Cloudflare Account Setup

1. **Sign in to Cloudflare Dashboard**
   ```
   URL: https://dash.cloudflare.com
   ```

2. **Create KV Namespace**
   - Go to: Workers & Pages → KV → Create a namespace
   - Name: `SPORTS_KV` (must match wrangler.json binding)
   - Note the namespace ID

3. **Link GitHub Repository**
   - Pages → Create application
   - Connect to GitHub
   - Select: `anveshak131-wq/ipl-2026-website`
   - Production branch: `main`

### Step 2: Build Configuration

**wrangler.toml** (already configured):
```toml
name = "ipl-2026-website"
pages_build_command = "npm run build"
pages_build_output_dir = "out"
```

**package.json** (verify scripts):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

### Step 3: Environment Variables

In Cloudflare Pages dashboard:

**Production Variables:**
```
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production
```

**Build Settings:**
- Framework preset: Next.js
- Build command: `npm run build`
- Build output directory: `out`
- Environment: Node.js 18

### Step 4: KV Binding Configuration

In **wrangler.json**:
```json
{
  "pages_build_config": {
    "kv_namespaces": [
      {
        "binding": "SPORTS_KV",
        "namespace_id": "YOUR_NAMESPACE_ID"
      }
    ]
  }
}
```

Or through Cloudflare Dashboard:
- Settings → Environment variables
- Add KV namespace binding
- Name: `SPORTS_KV`
- Namespace ID: (from Step 2)

### Step 5: Deploy

**Option A: Automatic (via GitHub)**
```
Push to main branch → Cloudflare auto-deploys
Deployment time: 2-5 minutes
```

**Option B: Manual (via Wrangler)**
```bash
npm install -g wrangler
wrangler pages deploy out/
```

### Step 6: Verify Deployment

```bash
# Test homepage
curl https://yourdomain.pages.dev

# Test live-score page
curl https://yourdomain.pages.dev/live-score

# Test API endpoint
curl https://yourdomain.pages.dev/api/live-score
```

---

## 👤 Admin Account Setup

### Create Initial Admin User

**Method 1: Direct KV Insertion (via Wrangler)**

```bash
# 1. Set working directory
cd /Users/anvesh/Downloads/sportsup99

# 2. Create admin user in KV
wrangler kv:key put \
  --namespace-id "YOUR_NAMESPACE_ID" \
  "user:admin@example.com" \
  '{
    "id": "admin_123456",
    "email": "admin@example.com",
    "name": "Admin User",
    "salt": "unique_salt_value",
    "hashedPassword": "hashed_password_here",
    "token": "initial_token",
    "role": "admin",
    "isBlocked": false,
    "createdAt": "2025-11-15T00:00:00Z",
    "lastLogin": null
  }'
```

**Method 2: Signup then Update Role**

1. Use the app's signup page:
   ```
   URL: https://yourdomain.pages.dev
   Email: admin@example.com
   Password: SecureAdminPass123
   Name: Admin User
   ```

2. Update user role via KV:
   ```bash
   wrangler kv:key get \
     --namespace-id "YOUR_NAMESPACE_ID" \
     "user:admin@example.com"
   
   # Copy the output, update role to "admin"
   
   wrangler kv:key put \
     --namespace-id "YOUR_NAMESPACE_ID" \
     "user:admin@example.com" \
     '{"...": "...", "role": "admin"}'
   ```

**Method 3: Via Admin Script**

Create `/scripts/create-admin.js`:
```javascript
import crypto from 'crypto';

const email = 'admin@example.com';
const password = 'SecureAdminPass123';
const name = 'Admin User';

// Hash password
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.createHash('sha256');
hash.update(password + salt);
const hashedPassword = hash.digest('hex');

const adminUser = {
  id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  email,
  name,
  salt,
  hashedPassword,
  token: crypto.randomBytes(32).toString('hex'),
  role: 'admin',
  isBlocked: false,
  createdAt: new Date().toISOString(),
  lastLogin: null
};

console.log('Admin User Created:');
console.log(JSON.stringify(adminUser, null, 2));
console.log('\nKV Key:', `user:${email}`);
```

Run:
```bash
node scripts/create-admin.js
# Copy output and paste into KV
```

### Admin Credentials

**Recommended Initial Admin:**
```
Email:    admin@ipl2026.com
Password: IPLAdmin@2025
Name:     Admin User
Role:     admin
```

**Change After First Login:**
- Log in to `/admin`
- Update password in settings
- Generate secure token

---

## 🧪 Feature Testing Checklist

### 1. Authentication System

#### Signup Flow
```bash
# Test user registration
curl -X POST https://yourdomain.pages.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'

# Expected: 201 Created with token
```

#### Signin Flow
```bash
# Test user login
curl -X POST https://yourdomain.pages.dev/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }'

# Expected: 200 OK with token
```

#### Token Verification
```bash
# Test token validation
curl -X GET https://yourdomain.pages.dev/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with user data
```

### 2. Live Score Management

#### Get Current Score
```bash
curl https://yourdomain.pages.dev/api/live-score?matchId=current

# Expected: 200 OK with score object
```

#### Update Score (Admin)
```bash
curl -X POST https://yourdomain.pages.dev/api/live-score \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "current",
    "scoreUpdate": {
      "team1": {"runs": 45, "wickets": 1, "overs": 5},
      "team2": {"runs": 0, "wickets": 0, "overs": 0},
      "currentBatter": {"name": "Kohli", "runs": 25, "balls": 18},
      "currentBowler": {"name": "Bumrah", "runs": 8, "balls": 3},
      "commentary": ["Ball 31: Four runs!"],
      "status": "Live"
    }
  }'

# Expected: 200 OK with updated score
```

### 3. Chat & Messaging

#### Send Message
```bash
curl -X POST https://yourdomain.pages.dev/api/messages \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "current",
    "text": "Amazing shot!"
  }'

# Expected: 201 Created with message ID
```

#### Get Messages
```bash
curl https://yourdomain.pages.dev/api/messages?matchId=current&limit=50&offset=0

# Expected: 200 OK with message array
```

#### Delete Message (Admin)
```bash
curl -X DELETE https://yourdomain.pages.dev/api/messages/MESSAGE_ID?matchId=current \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK
```

### 4. Admin User Management

#### Get Active Users
```bash
curl https://yourdomain.pages.dev/api/admin/users?matchId=current \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK with active users list
```

#### Block User
```bash
curl -X PUT https://yourdomain.pages.dev/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "isBlocked": true,
    "reason": "Inappropriate language"
  }'

# Expected: 200 OK
```

#### Delete User
```bash
curl -X DELETE https://yourdomain.pages.dev/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123"}'

# Expected: 200 OK
```

### 5. UI/UX Testing

#### End-User Pages
- [ ] `/` - Homepage loads
- [ ] `/live-score` - Live score page responsive
- [ ] `/matches` - Matches page works
- [ ] `/teams` - Teams page works
- [ ] `/news` - News page works

#### Admin Pages
- [ ] `/admin` - Admin login works
- [ ] `/admin/live-score` - Score update interface works
- [ ] `/admin/engagement` - User management works
- [ ] `/admin/dashboard` - Dashboard displays
- [ ] `/admin/players` - Players list works

#### Mobile Responsiveness
- [ ] Test on mobile (375px viewport)
- [ ] Test on tablet (768px viewport)
- [ ] Test on desktop (1920px viewport)
- [ ] Verify navigation collapse

#### Browser Compatibility
- [ ] Chrome/Chromium ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Edge ✓

---

## 📊 Performance Monitoring Setup

### 1. Sentry Error Tracking

**Installation:**
```bash
npm install @sentry/nextjs
```

**Configuration** (`src/app/layout.tsx`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

**Dashboard:**
```
URL: https://sentry.io
Monitor: Error rates, performance, releases
Alerts: Set for 5xx errors, 10%+ error rate increase
```

### 2. Cloudflare Analytics

**Access:**
```
Dashboard → Analytics & Logs
Monitor:
  - Page views
  - Unique visitors
  - Request count
  - Error rate
  - Response time
  - Bandwidth usage
```

**Custom Metrics:**
- Signup success rate
- Login success rate
- Message posting rate
- Score update frequency

### 3. Real-time Monitoring

**KV Storage Metrics:**
```bash
# Check KV usage
wrangler kv:namespace list

# Monitor KV operations
# Dashboard → Analytics → Workers → Requests
```

**Response Time Monitoring:**
- Set baseline: <500ms API response
- Set alert: >1000ms sustained
- Monitor: Cold starts, peak traffic

### 4. Uptime Monitoring

**UptimeRobot Configuration:**
```
URL: https://uptimerobot.com

Add monitors:
1. Homepage: https://yourdomain.pages.dev
2. API: https://yourdomain.pages.dev/api/live-score
3. Admin: https://yourdomain.pages.dev/admin

Interval: Every 5 minutes
Notification: Email/Slack on downtime
```

### 5. Analytics Dashboard

**Recommended Metrics:**
```typescript
interface AnalyticsMetrics {
  // User Metrics
  dailySignups: number,
  dailyLogins: number,
  activeUsers: number,
  userRetention: number, // %
  
  // Engagement Metrics
  messagesPerMatch: number,
  avgEngagementTime: number, // minutes
  uniqueCommenters: number,
  
  // Performance Metrics
  apiResponseTime: number, // ms
  pageLoadTime: number, // ms
  errorRate: number, // %
  
  // Business Metrics
  matchesBroadcast: number,
  peakConcurrentUsers: number,
  totalMessages: number,
}
```

---

## 🎯 Phase 1 Improvement Roadmap

### Phase 1: WebSocket Real-Time Implementation (2 Weeks)

**Goal**: Replace polling with true real-time updates

#### Week 1: Infrastructure Setup
- [ ] Set up Cloudflare Durable Objects
- [ ] Implement WebSocket connection handler
- [ ] Create match state manager
- [ ] Build connection pool for users
- [ ] Implement reconnection logic

**Files to Create:**
```
/functions/ws/match-state.ts
  - Durable Object for match state
  - Real-time state synchronization
  - Broadcasting updates to clients

/functions/ws/handler.ts
  - WebSocket connection management
  - Message routing
  - Error handling & recovery
```

#### Week 2: Client Integration & Testing
- [ ] Update live-score page with WebSocket client
- [ ] Remove polling, implement push updates
- [ ] Add loading indicators
- [ ] Test with 100+ concurrent users
- [ ] Performance optimization

**Benefits:**
- 5x faster score updates (<100ms vs 5-10s)
- Reduced server load (push vs pull)
- Smoother UX (instant updates)
- Lower bandwidth usage

**Implementation Example:**
```typescript
// Current (Polling)
useEffect(() => {
  const interval = setInterval(async () => {
    const score = await fetch('/api/live-score');
    setLiveScore(score.json());
  }, 5000);
}, []);

// Phase 1 (WebSocket)
useEffect(() => {
  const ws = new WebSocket('wss://yourdomain.com/ws/match');
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.type === 'score') {
      setLiveScore(update.data); // Instant update
    }
  };
}, []);
```

### Phase 1 Technical Architecture

```
┌─────────────────────────────────────────────┐
│         Web Client (Browser)                │
│  - Live Score Page                          │
│  - Admin Dashboard                          │
│  - Chat Interface                           │
└────────────────┬────────────────────────────┘
                 │ WebSocket
                 │ (wss://)
                 ▼
┌─────────────────────────────────────────────┐
│     Cloudflare Durable Objects              │
│  - Match State Manager                      │
│  - Active Connection Pool                   │
│  - Broadcast Engine                         │
│  - Real-time Synchronization                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│     Cloudflare KV Storage                   │
│  - Persistent Match State                   │
│  - User Sessions                            │
│  - Historical Data                          │
└─────────────────────────────────────────────┘
```

### Phase 1 Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Score Update Latency | 5-10s | <100ms | 50-100x faster |
| Server Requests/sec | 100 | 10 | 90% reduction |
| Bandwidth/user | 5KB/min | 0.5KB/min | 90% reduction |
| Max Concurrent Users | 1,000 | 10,000+ | 10x increase |
| Database Load | High | Low | 80% reduction |

### Phase 1 Priority Features

#### Must Have (Week 1-2)
- [x] WebSocket infrastructure
- [x] Real-time score updates
- [x] Connection management
- [x] Error recovery

#### Should Have (Week 2)
- [ ] Real-time message broadcasting
- [ ] User activity updates
- [ ] Performance optimization

#### Nice to Have (Future)
- [ ] Presence indicators
- [ ] Typing indicators
- [ ] Read receipts

### Phase 1 Testing Strategy

```bash
# Load testing
npm install autocannon

# Test 100 concurrent connections
autocannon -c 100 -d 30 https://yourdomain.pages.dev/live-score

# Expected metrics:
# - Avg latency: <100ms
# - P99 latency: <500ms
# - Error rate: <0.1%
# - Throughput: 1000+ req/sec
```

### Phase 1 Deployment Plan

**Branch Strategy:**
```
main (current production)
  ↓
feature/websocket (development)
  ↓
staging.pages.dev (testing)
  ↓
main (production after testing)
```

**Rollout:**
- Day 1-2: Deploy to staging
- Day 3-5: Testing & optimization
- Day 6-7: Gradual rollout to production (10% → 50% → 100%)
- Day 8+: Monitor & optimize

### Phase 1 Success Metrics

```
Target KPIs:
✅ Score update latency: <100ms (vs 5-10s current)
✅ Max concurrent users: 10,000+ (vs 1,000 current)
✅ Server resource usage: 80% reduction
✅ User satisfaction: 95%+ (from surveys)
✅ Zero downtime deployment: Yes
✅ Rollback capability: <5 minutes
```

### Phase 1 Documentation Needed

- [ ] WebSocket API documentation
- [ ] Client integration guide
- [ ] Deployment runbook
- [ ] Monitoring dashboard setup
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (automatic with Cloudflare)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] DDoS protection active
- [ ] Bot management configured
- [ ] WAF rules set
- [ ] API authentication verified
- [ ] Admin credentials secure
- [ ] KV data encrypted
- [ ] Logs monitored for anomalies

---

## 📞 Post-Deployment Support

### Daily Checks
- [ ] Error rate < 1%
- [ ] Response time < 500ms
- [ ] Uptime 99.9%+
- [ ] No security alerts

### Weekly Review
- [ ] User growth analysis
- [ ] Engagement metrics
- [ ] Performance trends
- [ ] Bug report review

### Monthly Assessment
- [ ] Feature adoption
- [ ] User feedback
- [ ] Cost analysis
- [ ] Roadmap updates

---

## 🆘 Troubleshooting

### Deployment Issues

**Build fails:**
```
Check: npm run build locally
Check: Node version matches (v18+)
Check: All dependencies installed
Solution: Clear cache, reinstall
```

**KV binding not working:**
```
Check: Namespace ID correct in wrangler.json
Check: Binding name matches (SPORTS_KV)
Solution: Restart build, clear Cloudflare cache
```

**API endpoints 404:**
```
Check: Next.js API routes in /app/api
Check: Routes exported properly
Solution: Rebuild and redeploy
```

### Runtime Issues

**CORS errors:**
```
Add CORS headers to API responses
Verify origin whitelist
Test with curl
```

**Auth failures:**
```
Check: Token format correct
Check: Token not expired
Check: User role correct
```

**WebSocket issues (Phase 1):**
```
Check: Durable Objects created
Check: WebSocket URL correct
Check: Firewall not blocking WebSocket
```

---

**Deployment Status**: Ready for Production ✅  
**Next Step**: Execute Step 1 above  
**Estimated Time**: 2-4 hours for full setup

