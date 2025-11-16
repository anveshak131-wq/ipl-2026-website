# 📊 IPL 2026 - Monitoring & Operations Guide

## Overview

Comprehensive guide for monitoring, maintaining, and operating the IPL 2026 website in production.

---

## 🎯 Key Metrics to Monitor

### Performance Metrics
- **Page Load Time**: Target < 3 seconds (95th percentile)
- **API Response Time**: Target < 500ms (95th percentile)
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

### Reliability Metrics
- **Uptime**: Target > 99.9%
- **Error Rate**: Target < 0.1%
- **Failed Requests**: 0 critical errors

### Business Metrics
- **Active Users**: Track concurrent connections
- **Message Volume**: Monitor chat traffic
- **Admin Actions**: Track user management
- **Match Events**: Live score updates

---

## 🔍 1. Real-Time Monitoring Setup

### Option 1: Cloudflare Analytics Engine (Recommended)

**Setup:**
```bash
# Enable in wrangler.toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"

# In API endpoints, log events
```

**Example Implementation:**

```javascript
// In your API endpoints
export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // Your endpoint logic...
    
    // Log to Analytics Engine
    if (env.ANALYTICS) {
      await env.ANALYTICS.writeDataPoint({
        indexes: [request.method, new URL(request.url).pathname],
        blobs: [request.headers.get('cf-ray')],
        doubles: [Date.now()],
      });
    }
    
    return response;
  } catch (error) {
    // Log error
    if (env.ANALYTICS) {
      await env.ANALYTICS.writeDataPoint({
        indexes: ['error', error.message],
        blobs: [request.headers.get('cf-ray')],
        doubles: [Date.now()],
      });
    }
    throw error;
  }
}
```

**View in Cloudflare Dashboard:**
1. Workers → Analytics
2. View real-time metrics
3. Filter by endpoint or status

---

### Option 2: Sentry Integration (Error Tracking)

**Setup:**

```bash
# Install Sentry
npm install @sentry/nextjs @sentry/tracing

# Create Sentry account at https://sentry.io
# Get DSN from project settings
```

**Configure in Next.js:**

```javascript
// next.config.js
const withSentryConfig = require("@sentry/nextjs/withSentryConfig");

module.exports = withSentryConfig(
  {
    // ... other config
  },
  {
    org: "your-org",
    project: "ipl-2026",
  }
);
```

**Environment Setup:**

```bash
# Add to .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxx
```

**Track Errors:**

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: "live-score",
      severity: "critical",
    },
  });
}
```

**Features:**
- ✅ Real-time error notifications
- ✅ Error grouping and deduplication
- ✅ Stack traces and breadcrumbs
- ✅ Release tracking
- ✅ Performance monitoring

---

### Option 3: UptimeRobot (Uptime Monitoring)

**Setup:**

1. Go to https://uptimerobot.com
2. Create account (free tier available)
3. Add monitor:
   - URL: `https://yourdomain.com`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Alerting: Email notification

**Monitors to Set Up:**

```
1. Main Site
   URL: https://yourdomain.com
   Expected: 200 OK

2. Live Score API
   URL: https://yourdomain.com/api/live-score
   Expected: 200 OK

3. Admin Login
   URL: https://yourdomain.com/admin/login
   Expected: 200 OK (redirect acceptable)

4. Health Check (create custom endpoint)
   URL: https://yourdomain.com/api/health
   Expected: {"status": "ok"}
```

**Create Health Check Endpoint:**

```javascript
// functions/api/health.js
export async function onRequest(context) {
  const { env } = context;

  try {
    // Test KV connectivity
    const testKey = await env.SPORTS_KV.get('health-check');
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        kv: 'connected',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

---

### Option 4: Custom Dashboard

**Create Admin Dashboard (`/admin/monitoring`):**

```typescript
// src/app/admin/monitoring/page.tsx
import React, { useEffect, useState } from 'react';
import { Activity, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    totalMessages: 0,
    apiHealth: 'ok',
    uptime: 99.9,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Fetch every 10 seconds
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">📊 Live Metrics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Users Card */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics.activeUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Messages Card */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Messages</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics.totalMessages}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* API Health Card */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">API Status</p>
              <p className={`text-xl font-bold mt-2 ${
                metrics.apiHealth === 'ok' ? 'text-green-500' : 'text-red-500'
              }`}>
                {metrics.apiHealth.toUpperCase()}
              </p>
            </div>
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        {/* Uptime Card */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Uptime</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics.uptime}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">📋 Recent Activity</h2>
        <div className="space-y-2 text-sm text-slate-300">
          <p>✓ System running normally</p>
          <p>✓ All APIs responding</p>
          <p>✓ KV storage connected</p>
        </div>
      </div>
    </div>
  );
}
```

**Create Metrics API Endpoint:**

```javascript
// functions/api/admin/metrics.js
export async function onRequest(context) {
  const { request, env } = context;

  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const token = authHeader.substring(7);
    const tokenData = await env.SPORTS_KV.get(`token:${token}`);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
      });
    }

    const parsed = JSON.parse(tokenData);
    if (parsed.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not admin' }), {
        status: 403,
      });
    }

    // Get metrics
    const metrics = {
      activeUsers: 0, // Get from KV or calculate
      totalMessages: 0, // Count from messages
      apiHealth: 'ok',
      uptime: 99.9,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
```

---

## 📈 2. Logging Strategy

### Server-Side Logging

**Log All Critical Events:**

```javascript
// Log template
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info|warn|error',
  component: 'auth|live-score|messages|admin',
  action: 'login|score-update|message-send',
  status: 'success|failure',
  details: { /* relevant data */ },
  userId: user?.id,
  duration: elapsedTime,
}));
```

**Example Log Entries:**

```json
{
  "timestamp": "2025-01-15T18:36:00Z",
  "level": "info",
  "component": "auth",
  "action": "login",
  "status": "success",
  "userId": "user_123",
  "duration": 250
}

{
  "timestamp": "2025-01-15T18:37:00Z",
  "level": "error",
  "component": "live-score",
  "action": "score-update",
  "status": "failure",
  "details": { "error": "KV write failed" },
  "userId": "user_456",
  "duration": 5000
}
```

**View Logs:**

```bash
# Tail logs (Cloudflare Workers)
wrangler tail

# Format output
wrangler tail --format pretty

# Filter by status
wrangler tail | grep "error"
```

---

### Client-Side Error Tracking

```typescript
// utils/errorTracking.ts
export function trackError(error: Error, context: Record<string, any>) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Send to error tracking service
  fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData),
  }).catch(console.error);

  // Also log locally
  console.error('[Client Error]', errorData);
}

// Usage
try {
  // code
} catch (error) {
  trackError(error as Error, {
    page: 'live-score',
    action: 'send-message',
  });
}
```

---

## 🚨 3. Alert Configuration

### Create Alert Rules

**Critical Alerts:**
1. **High Error Rate** (> 1% of requests failing)
   - Action: Immediate notification
   - Severity: Critical

2. **API Response Slow** (> 2s average)
   - Action: Notification + logs
   - Severity: High

3. **Site Down** (> 5 min downtime)
   - Action: SMS + Email + Slack
   - Severity: Critical

4. **KV Storage Error** (Cannot read/write)
   - Action: Immediate notification
   - Severity: Critical

**Setup Example (Sentry):**

```python
# Sentry alert rule
{
  "name": "High Error Rate",
  "conditions": [
    {
      "id": "sentry.rules.conditions.error_event_percent",
      "value": 5,
    }
  ],
  "actions": [
    {
      "id": "sentry.rules.actions.notify_event_service",
      "service": "slack",
    },
    {
      "id": "sentry.rules.actions.notify_event_service",
      "service": "email",
    }
  ],
}
```

---

## 🔧 4. Maintenance Tasks

### Daily Tasks (Automated)

- [ ] Backup KV data (if backup service configured)
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify uptime

```bash
# Schedule daily health check
0 0 * * * /usr/local/bin/check-ipl-health.sh
```

### Weekly Tasks (Manual)

- [ ] Review error logs
- [ ] Analyze user engagement
- [ ] Check storage usage
- [ ] Review performance metrics
- [ ] Update documentation

**Weekly Review Checklist:**

```markdown
Week: _____________

[ ] Error rate acceptable (< 0.1%)
[ ] Response times good (< 500ms)
[ ] Uptime acceptable (> 99.9%)
[ ] No KV quota issues
[ ] User feedback reviewed
[ ] Security logs reviewed
[ ] Performance improvements identified

Issues Found:
_____________________________
_____________________________

Actions for Next Week:
_____________________________
_____________________________
```

### Monthly Tasks

- [ ] Full backup verification
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Documentation updates
- [ ] Capacity planning

---

## 🛡️ 5. Security Monitoring

### Track Admin Actions

```javascript
// Log all admin operations
async function logAdminAction(env, action, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action, // 'user-blocked', 'user-deleted', 'score-updated'
    details: details,
    adminId: details.adminId,
  };

  // Store in KV with time-based key for easy querying
  const dateKey = new Date().toISOString().split('T')[0];
  const key = `admin-log:${dateKey}`;
  
  let logs = JSON.parse(await env.SPORTS_KV.get(key) || '[]');
  logs.push(logEntry);
  logs = logs.slice(-1000); // Keep last 1000 entries
  
  await env.SPORTS_KV.put(key, JSON.stringify(logs));
}
```

### Monitor Suspicious Activity

**Detect:**
- Multiple failed login attempts
- Rapid API calls (rate limiting)
- Unusual data access patterns
- Mass deletions/blocking

**Alert on:**
- 5+ failed logins in 15 minutes → Account lockout
- 100+ requests from IP in 1 minute → Rate limit
- 10+ users blocked by admin → Investigate

---

## 📊 6. Performance Optimization

### Monitor Performance Metrics

```bash
# Check build size
npm run build
# Look for: "out" folder size

# Analyze bundle
npm install --save-dev @next/bundle-analyzer
npm run analyze
# Review which files are largest
```

### Optimization Checklist

- [ ] JavaScript minified and tree-shaken
- [ ] Images optimized and lazy-loaded
- [ ] CSS critical path optimized
- [ ] API responses cached where appropriate
- [ ] Database queries optimized
- [ ] CDN configured (Cloudflare)

### Target Metrics

```
Metric              Target    Current   Status
─────────────────────────────────────────────
FCP (First Paint)   < 1.5s    ___s      [ ]
LCP (Load Complete) < 2.5s    ___s      [ ]
TTFB (First Byte)   < 600ms   ___ms     [ ]
Total JS Size       < 200KB   ___KB     [ ]
Total CSS Size      < 50KB    ___KB     [ ]
API Response        < 500ms   ___ms     [ ]
```

---

## 📞 7. Incident Response

### When Something Goes Wrong

**Step 1: Assess Impact**
```
- Severity (Critical/High/Medium/Low)
- Affected users/features
- Duration of issue
- Cause (if known)
```

**Step 2: Immediate Actions**
```
- [] Notify team
- [] Create incident ticket
- [] Investigate logs
- [] Check error rate
- [] Verify system health
```

**Step 3: Mitigation**
```
- [] Scale resources if needed
- [] Disable non-critical features
- [] Clear caches
- [] Restart services
- [] Rollback if necessary
```

**Step 4: Root Cause Analysis**
```
- [] Timeline of events
- [] What changed recently
- [] Error patterns
- [] User impact analysis
```

**Step 5: Resolution & Prevention**
```
- [] Deploy fix
- [] Monitor for regression
- [] Update documentation
- [] Post-mortem review
- [] Implement preventive measures
```

### Incident Template

```markdown
## Incident Report

**Date/Time:** 2025-01-15 18:30 UTC
**Duration:** 15 minutes
**Severity:** High

### Summary
Live score API returning 500 errors

### Impact
- 50% of users affected
- Live score not updating
- Chat still functional

### Root Cause
KV storage quota exceeded

### Resolution
- Deleted old messages (> 30 days)
- Freed up space
- Increased monitoring

### Prevention
- Set up quota alerts
- Implement auto-cleanup
- Add quota dashboard widget

### Lessons Learned
- Need better storage management
- Should have quota dashboard
- Need rate limiting for API

### Action Items
- [ ] Implement auto-cleanup job
- [ ] Add quota monitoring
- [ ] Review storage strategy
- [ ] Update runbook
```

---

## 📚 8. Runbooks

### Runbook: API Endpoint Slow

**Diagnosis:**
```bash
# Check API latency
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/live-score

# Check KV connectivity
# - Go to Cloudflare Dashboard
# - Workers → KV
# - Check namespace status

# Check Worker logs
wrangler tail
```

**Resolution:**
1. [ ] Check KV namespace is not at quota
2. [ ] Look for slow database queries
3. [ ] Check for spike in traffic
4. [ ] Monitor until back to normal
5. [ ] Document issue

---

### Runbook: High Error Rate

**Diagnosis:**
```bash
# Check errors
wrangler tail | grep error

# View in Sentry
# - Go to https://sentry.io
# - Select ipl-2026 project
# - Review error types and frequency
```

**Resolution:**
1. [ ] Identify error pattern
2. [ ] Check recent deploys
3. [ ] Check system resources
4. [ ] Roll back if needed
5. [ ] Deploy fix
6. [ ] Monitor metrics

---

### Runbook: KV Storage Issues

**Diagnosis:**
```bash
# Test KV connectivity
curl -X GET https://yourdomain.com/api/health

# Check KV logs
# - Dashboard → Workers → KV → Check operations
```

**Resolution:**
1. [ ] Check KV namespace exists
2. [ ] Verify namespace linked in wrangler.toml
3. [ ] Check quota usage
4. [ ] Clean old data if quota full
5. [ ] Re-deploy if config changed
6. [ ] Test again

---

## 🎯 9. Service Level Objectives (SLOs)

### Availability SLO

**Target:** 99.9% uptime per month
- Allowed downtime: 43.2 minutes/month
- Measured: Synthetic monitoring
- Alert threshold: 99.5% (need 2+ minutes down)

### Performance SLO

**API Response Time:**
- Target: 95th percentile < 500ms
- Alert threshold: > 1s average
- Measured: Every endpoint

**Page Load:**
- Target: 95th percentile < 3s
- Alert threshold: > 5s
- Measured: Real User Monitoring

### Error Rate SLO

**Target:** < 0.1% error rate
- Alert threshold: > 0.5%
- Measured: Failed requests / total requests
- Excluded: 3xx redirects

---

## 📋 10. On-Call Runbook

### On-Call Responsibilities

**Before Shift:**
- [ ] Review recent incidents
- [ ] Check open alerts
- [ ] Ensure contact info updated
- [ ] Review runbooks

**During Shift:**
- [ ] Monitor dashboard every hour
- [ ] Respond to alerts within 5 minutes
- [ ] Update status page
- [ ] Communicate with team

**After Shift:**
- [ ] Handoff to next on-call
- [ ] Review any issues encountered
- [ ] Update documentation
- [ ] Note improvements needed

### Escalation Path

**Level 1 (On-call):**
- Severity: Low to Medium
- Response: 15 minutes
- Resolution: 4 hours

**Level 2 (Tech Lead):**
- Severity: High
- Response: 5 minutes
- Resolution: 1 hour

**Level 3 (CTO/Manager):**
- Severity: Critical
- Response: Immediate
- Resolution: 30 minutes

---

## 🎓 11. Training & Documentation

### Admin Training

- [ ] How to view metrics
- [ ] How to manage users
- [ ] How to update live score
- [ ] How to moderate chat
- [ ] How to respond to incidents

### Runbook Access

All runbooks should be:
- [ ] Documented clearly
- [ ] Stored in shared location
- [ ] Updated regularly
- [ ] Tested periodically

---

## 📅 Monitoring Calendar

```
DAILY
- [ ] 9 AM: Check dashboard
- [ ] 6 PM: Check error rates
- [ ] Automated health checks

WEEKLY (Monday 10 AM)
- [ ] Review metrics
- [ ] Analyze user engagement
- [ ] Review logs

MONTHLY (1st of month, 10 AM)
- [ ] Security audit
- [ ] Capacity planning
- [ ] Performance review

QUARTERLY
- [ ] Full infrastructure review
- [ ] Update documentation
- [ ] Plan improvements
```

---

## 🔗 Useful Links

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Sentry Docs](https://docs.sentry.io/)
- [UptimeRobot](https://uptimerobot.com)
- [Next.js Docs](https://nextjs.org/docs)

---

**Last Updated:** January 2025
**Version:** 1.0
**Owner:** DevOps Team

