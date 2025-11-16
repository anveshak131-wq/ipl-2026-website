# ✅ IPL 2026 Website - Production Launch Checklist

**Project Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** January 2025  
**Version:** 1.0

---

## 📋 Phase 1: Pre-Deployment (Day 1)

### Code & Build Verification

- [ ] Git repository up-to-date
- [ ] All code committed and pushed
- [ ] No uncommitted changes
- [ ] Build command runs successfully: `npm run build`
- [ ] Build output in `out` directory (33+ routes)
- [ ] 0 TypeScript compilation errors
- [ ] 0 ESLint warnings or errors
- [ ] All dependencies installed: `npm install`

**Verification Command:**
```bash
npm run build
npm run lint
```

---

### Cloudflare Setup

- [ ] Cloudflare account created
- [ ] Account ID noted: ___________________
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Logged in: `wrangler login`
- [ ] KV namespace created: "SPORTS_KV"
- [ ] Namespace ID noted: ___________________
- [ ] Namespace linked in `wrangler.toml`
- [ ] Preview namespace ID added

**Verification Command:**
```bash
wrangler whoami
wrangler kv:namespace list
```

---

### Environment Configuration

**wrangler.toml Setup:**
- [ ] `account_id` set correctly
- [ ] `name` set to "ipl-2026-website"
- [ ] KV namespace binding configured
- [ ] Build command: `npm run build`
- [ ] Build output: `out`
- [ ] Production environment section added

**Environment Variables:**
- [ ] `ENVIRONMENT` = "production"
- [ ] `SETUP_KEY` = secure random value (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `ALLOWED_ORIGINS` = your domain

**Verification Command:**
```bash
cat wrangler.toml | grep -E "account_id|SPORTS_KV|SETUP_KEY"
```

---

### Local Testing

- [ ] Local dev server starts: `npm run dev`
- [ ] Homepage loads at http://localhost:3000
- [ ] Admin login page accessible
- [ ] No console errors on pages
- [ ] All navigation links work
- [ ] Forms submit correctly
- [ ] LocalStorage working

**Verification Steps:**
1. Run `npm run dev`
2. Open http://localhost:3000
3. Check browser console (F12)
4. Navigate all pages
5. Test admin login with test account

---

### Documentation Review

- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] TESTING_GUIDE.md reviewed
- [ ] MONITORING_OPERATIONS_GUIDE.md reviewed
- [ ] ENVIRONMENT_SETUP_GUIDE.md reviewed
- [ ] README.md updated with current status
- [ ] All links verified and working

---

## 📋 Phase 2: Deployment (Day 2)

### Pre-Deployment Backup

- [ ] Database backup created (if applicable)
- [ ] Configuration backed up
- [ ] Current code tagged in git: `git tag v1.0.0`
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

---

### Cloudflare Pages Deployment

**Step 1: Connect Repository**
- [ ] Go to https://dash.cloudflare.com
- [ ] Navigate to Pages
- [ ] Click "Create application" → "Connect to Git"
- [ ] Select your GitHub repository
- [ ] Select branch: `main`

**Step 2: Configure Build**
- [ ] Build command: `npm run build`
- [ ] Build output directory: `out`
- [ ] Click "Save and Deploy"

**Step 3: Add Custom Domain**
- [ ] Go to Pages → Project → Custom domains
- [ ] Add your domain (e.g., yourdomain.com)
- [ ] Verify DNS settings
- [ ] Wait for HTTPS certificate (usually < 5 min)

**Verification:**
- [ ] Deployment completes without errors
- [ ] Build logs show "Success"
- [ ] Site accessible at custom domain
- [ ] HTTPS indicator shows secure connection

---

### Initial Admin Account Creation

**Option 1: Using Setup Script (Recommended)**
```bash
node scripts/create-admin.js admin@ipl2026.com "SecurePassword123" "Admin User"
```

**Option 2: Using Setup Page**
1. [ ] Navigate to https://yourdomain.com/admin/setup
2. [ ] Enter email, password, name
3. [ ] Submit form
4. [ ] Note admin credentials securely

**Option 3: Using KV Dashboard**
1. [ ] Go to Cloudflare Dashboard
2. [ ] Workers → KV → SPORTS_KV
3. [ ] Click "Edit"
4. [ ] Click "Add Key"
5. [ ] Paste user JSON (see DEPLOYMENT_GUIDE.md)
6. [ ] Click "Save"

**Verification:**
- [ ] Admin can login at https://yourdomain.com/admin/login
- [ ] Admin dashboard loads
- [ ] KV contains user record

---

### Initial Configuration

- [ ] Test admin account login successful
- [ ] Change admin password after first login
- [ ] Disable SETUP_KEY (optional but recommended)
- [ ] Configure admin preferences if available
- [ ] Verify all admin pages accessible

---

## 📋 Phase 3: Smoke Testing (Day 2-3)

### Public Pages

**Homepage**
- [ ] Loads in < 3 seconds
- [ ] Logo visible and animated
- [ ] Navigation links work
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1440px)

**Live Score Page**
- [ ] Loads in < 3 seconds
- [ ] Score displays correctly
- [ ] Refreshes automatically (5-10 sec)
- [ ] Chat visible
- [ ] Auth modal appears when trying to chat
- [ ] No console errors

**Other Public Pages**
- [ ] Matches page loads
- [ ] News page loads
- [ ] Teams page loads
- [ ] Predictions page loads
- [ ] All navigation functional

---

### Authentication System

**Signup**
- [ ] Signup form accessible
- [ ] Can create new account with valid email
- [ ] Password validation enforced
- [ ] Email validation enforced
- [ ] Account created successfully
- [ ] Auto-login after signup

**Login**
- [ ] Can login with credentials
- [ ] Invalid credentials show error
- [ ] Forgot password flow works (if implemented)
- [ ] Session persists on page reload
- [ ] Logout clears session

**Token Management**
- [ ] Token stored in localStorage
- [ ] Token included in API requests
- [ ] Expired token triggers re-login
- [ ] Invalid token handled gracefully

---

### API Endpoints

**Auth Endpoints**
- [ ] POST /api/auth/signup → 201 Created
- [ ] POST /api/auth/signin → 200 OK
- [ ] GET /api/auth/verify → 200 OK (with token)
- [ ] GET /api/auth/verify → 401 (without token)
- [ ] POST /api/auth/signout → 200 OK

**Live Score Endpoints**
- [ ] GET /api/live-score → 200 OK (public)
- [ ] POST /api/live-score → 200 OK (admin)
- [ ] POST /api/live-score → 403 Forbidden (non-admin)

**Message Endpoints**
- [ ] POST /api/messages → 201 Created (auth)
- [ ] GET /api/messages → 200 OK (public)
- [ ] DELETE /api/messages/:id → 200 OK (admin)

**User Management Endpoints**
- [ ] GET /api/admin/users → 200 OK (admin)
- [ ] PUT /api/admin/users → 200 OK (admin)
- [ ] DELETE /api/admin/users → 200 OK (admin)

**Test Commands:**
```bash
# Test public endpoint (should work)
curl https://yourdomain.com/api/live-score

# Test auth endpoint (should fail without token)
curl -X GET https://yourdomain.com/api/admin/users

# Test auth endpoint (should work with token)
curl -X GET https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Verification:**
- [ ] All endpoints return expected status codes
- [ ] API response times < 500ms
- [ ] Error responses are meaningful
- [ ] CORS headers present
- [ ] No internal error details exposed

---

### Admin Features

**Dashboard Access**
- [ ] Admin can access /admin/dashboard
- [ ] Dashboard displays stats
- [ ] Navigation menu shows all sections
- [ ] Logout button works

**Live Score Management**
- [ ] Can view current score
- [ ] Can update score values
- [ ] Can add commentary
- [ ] Updates persist in KV
- [ ] Public sees updates within 10s

**User Management**
- [ ] Can view active users
- [ ] Can block/unblock users
- [ ] Can delete user accounts
- [ ] Blocked users cannot login
- [ ] Deleted users removed

**Player Management**
- [ ] Can view player roster
- [ ] Can add/edit/delete players
- [ ] Delete confirmation works
- [ ] Changes persist

---

## 📋 Phase 4: Full Feature Testing (Day 3-4)

Complete the **TESTING_GUIDE.md** checklist:

- [ ] All 100+ test scenarios run
- [ ] Authentication tests pass
- [ ] Live score tests pass
- [ ] Messaging tests pass
- [ ] User management tests pass
- [ ] UI/UX tests pass
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Data integrity tests pass
- [ ] Browser compatibility tests pass
- [ ] Accessibility tests pass

**Completion:**
```
TESTING_GUIDE.md Progress: _____/100 scenarios passed
```

---

## 📋 Phase 5: Security Verification (Day 4)

### Authentication Security

- [ ] Passwords hashed with salt
- [ ] Tokens expire after 7 days
- [ ] Cannot use expired tokens
- [ ] Tokens securely transmitted (HTTPS only)
- [ ] No passwords in logs
- [ ] Session tokens cannot be forged

**Test:**
```bash
# Get token
TOKEN=$(curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123"}' \
  | jq -r '.user.token')

# Use token (should work)
curl -H "Authorization: Bearer $TOKEN" \
  https://yourdomain.com/api/admin/users

# Use invalid token (should fail)
curl -H "Authorization: Bearer invalid" \
  https://yourdomain.com/api/admin/users
```

---

### Authorization

- [ ] Non-admin cannot access admin endpoints
- [ ] Cannot access other user's data
- [ ] Role verification on all protected endpoints
- [ ] No privilege escalation possible
- [ ] User cannot change own role to admin

**Test:**
1. Create regular user account
2. Try to access /admin/users → Should get 403
3. Try to update admin role → Should fail
4. Verify non-admin operations work

---

### Data Protection

- [ ] Sensitive data not exposed in URLs
- [ ] Sensitive data not exposed in error messages
- [ ] HTTPS enforced (no HTTP)
- [ ] Cookies have secure flag (if used)
- [ ] XSS prevention implemented
- [ ] CSRF protection (if applicable)

---

### Infrastructure Security

- [ ] Cloudflare DDoS protection enabled
- [ ] WAF rules active
- [ ] Rate limiting configured
- [ ] Environment variables not exposed
- [ ] Error details not exposed to clients
- [ ] No stack traces in production

---

## 📋 Phase 6: Performance Verification (Day 4-5)

### Page Load Performance

Measure with DevTools (F12 → Performance tab):

```
Page Load Times (Target < 3 seconds)
────────────────────────────────────
Homepage:             ___s  [ ] < 3s
Live Score:           ___s  [ ] < 3s
Admin Login:          ___s  [ ] < 2s
Admin Dashboard:      ___s  [ ] < 3s
Admin Live Score:     ___s  [ ] < 3s
Admin Engagement:     ___s  [ ] < 4s

Core Web Vitals (Target LCP < 2.5s)
────────────────────────────────────
LCP (Largest Paint):  ___s  [ ] < 2.5s
FID (Input Delay):    ___ms [ ] < 100ms
CLS (Layout Shift):   ___   [ ] < 0.1
```

---

### API Performance

```bash
# Time API responses (Target < 500ms)
time curl https://yourdomain.com/api/live-score
time curl https://yourdomain.com/api/messages
time curl https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer TOKEN"
```

---

### Resource Optimization

- [ ] JavaScript < 200KB (gzipped)
- [ ] CSS < 50KB (gzipped)
- [ ] Images optimized and lazy-loaded
- [ ] No unused assets
- [ ] Gzip compression enabled
- [ ] Caching headers set correctly

**Check with:**
```bash
# View resource sizes in DevTools
# Network tab → Filter → All
# Right-click columns → Add "Transferred" column
```

---

### Load Testing

- [ ] Test with 10 concurrent users
- [ ] Test with 100 concurrent users
- [ ] Test with 1000+ message load
- [ ] Verify no errors under load
- [ ] Check scaling (auto-scale if configured)

---

## 📋 Phase 7: Monitoring Setup (Day 5)

### Choose Monitoring Solution

**Option 1: Sentry (Recommended for errors)**
- [ ] Create account at https://sentry.io
- [ ] Create project for "ipl-2026"
- [ ] Get DSN
- [ ] Add to environment variables
- [ ] Test error tracking with test error

**Option 2: UptimeRobot (Uptime monitoring)**
- [ ] Create account at https://uptimerobot.com
- [ ] Add monitors for:
  - [ ] Main site
  - [ ] API endpoints
  - [ ] Admin login
- [ ] Configure email alerts
- [ ] Test alert (trigger fake downtime)

**Option 3: Cloudflare Analytics**
- [ ] Enable in Cloudflare Dashboard
- [ ] View real-time metrics
- [ ] Set up custom alerts (if available)

**Option 4: Custom Dashboard**
- [ ] Configure /admin/monitoring page
- [ ] Set up /api/admin/metrics endpoint
- [ ] Configure auto-refresh
- [ ] Add to admin bookmarks

---

### Configure Alerts

Alert rules to set up:

```
Alert Triggers (choose at least 2)
──────────────────────────────────
1. High Error Rate
   Condition: > 1% of requests failing
   Action: Email + Slack notification
   Severity: Critical

2. High Latency
   Condition: API response > 2 seconds
   Action: Email notification
   Severity: High

3. Site Down
   Condition: > 5 minutes downtime
   Action: SMS + Email + Slack
   Severity: Critical

4. KV Storage Error
   Condition: Cannot read/write KV
   Action: Immediate notification
   Severity: Critical
```

---

### Verify Monitoring

- [ ] Dashboard accessible
- [ ] Metrics updating in real-time
- [ ] Alerts configured and tested
- [ ] Alert notifications working (test alerts)
- [ ] Team members notified of alert channels
- [ ] Runbooks accessible to on-call team

---

## 📋 Phase 8: Documentation & Handoff (Day 5-6)

### Documentation Complete

- [ ] DEPLOYMENT_GUIDE.md finalized
- [ ] TESTING_GUIDE.md finalized
- [ ] MONITORING_OPERATIONS_GUIDE.md finalized
- [ ] ENVIRONMENT_SETUP_GUIDE.md finalized
- [ ] README.md updated with deployment date
- [ ] Runbooks available to on-call team
- [ ] API documentation in code comments
- [ ] Admin manual created
- [ ] Troubleshooting guide available
- [ ] Contact information updated

---

### Team Training

- [ ] Developers trained on deployment process
- [ ] Admins trained on content management
- [ ] Ops team trained on monitoring & alerts
- [ ] On-call procedures documented
- [ ] Escalation paths defined
- [ ] Communication channels established

---

### Team Signoff

```
DEPLOYMENT TEAM SIGN-OFF
════════════════════════════════════

Development Team
Name: __________________  Date: ____  Signature: ____

Operations Team
Name: __________________  Date: ____  Signature: ____

QA/Testing
Name: __________________  Date: ____  Signature: ____

Project Manager
Name: __________________  Date: ____  Signature: ____

Approval to Launch: ☐ Yes  ☐ No

Notes:
_________________________________________________
_________________________________________________
```

---

## 📋 Phase 9: Go-Live (Day 6)

### Pre-Launch Checklist (1 hour before)

**Final Verification:**
- [ ] All tests passed
- [ ] Monitoring active and alerting
- [ ] Admin account verified
- [ ] Domain pointing to Cloudflare
- [ ] HTTPS certificate valid
- [ ] On-call team ready
- [ ] Communication channels open
- [ ] Runbooks accessible

**System Status:**
- [ ] Build: ✅ Complete
- [ ] Deployment: ✅ Complete
- [ ] Testing: ✅ Complete
- [ ] Security: ✅ Verified
- [ ] Monitoring: ✅ Active
- [ ] Documentation: ✅ Complete

**Launch Command:**
```bash
# Final deployment check
wrangler deploy

# Verify site loads
curl -I https://yourdomain.com

# Verify API responds
curl https://yourdomain.com/api/live-score
```

---

### Go-Live Procedure

**T-0 (30 minutes before)**
- [ ] Notify team of launch window
- [ ] Monitor logs/dashboards
- [ ] Have rollback plan ready

**T+0 (Launch)**
- [ ] Announce launch to team
- [ ] Monitor for errors
- [ ] Check user feedback

**T+15 min (Post-launch)**
- [ ] Verify key features working
- [ ] Check error rates
- [ ] Check performance metrics
- [ ] Monitor user activity

**T+1 hour (Full Verification)**
- [ ] All systems nominal
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Users can access

**T+24 hours (Day 1 Wrap-up)**
- [ ] No major incidents
- [ ] System stable
- [ ] Update status page
- [ ] Publish launch announcement

---

## 📋 Post-Launch (Week 1)

### Daily Monitoring

- [ ] Check error rates (target < 0.1%)
- [ ] Check uptime (target > 99.9%)
- [ ] Check API response times (target < 500ms)
- [ ] Check user engagement
- [ ] Review error logs
- [ ] Check KV quota usage
- [ ] Monitor team feedback

---

### Bug Fixes (if needed)

- [ ] Identify issues from error tracking
- [ ] Create bug report with:
  - [ ] Steps to reproduce
  - [ ] Expected vs actual behavior
  - [ ] Error logs/screenshots
  - [ ] Severity level
- [ ] Fix in dev environment
- [ ] Test thoroughly
- [ ] Deploy to production
- [ ] Verify fix live
- [ ] Document in changelog

---

### Performance Optimization

- [ ] Analyze load testing results
- [ ] Identify slow endpoints
- [ ] Optimize as needed
- [ ] Monitor improvements
- [ ] Document changes

---

### User Feedback

- [ ] Collect feedback from initial users
- [ ] Identify pain points
- [ ] Prioritize improvements
- [ ] Plan next sprint
- [ ] Update roadmap

---

## ✅ Final Checklist

### Before Clicking "Deploy"

```
FUNCTIONALITY
[ ] All pages load correctly
[ ] All APIs responding
[ ] Auth system working
[ ] Admin controls functional
[ ] No console errors
[ ] No network errors
[ ] Responsive design working

SECURITY
[ ] HTTPS enforced
[ ] No sensitive data exposed
[ ] Passwords hashed
[ ] Tokens working
[ ] Authorization enforced
[ ] No hardcoded secrets

PERFORMANCE
[ ] Page load < 3s
[ ] API response < 500ms
[ ] No memory leaks
[ ] Images optimized
[ ] JS/CSS minified

MONITORING
[ ] Alerts configured
[ ] Dashboards active
[ ] Notifications working
[ ] Runbooks prepared
[ ] Team trained

DOCUMENTATION
[ ] All guides complete
[ ] Deployment doc ready
[ ] Testing doc ready
[ ] Monitoring doc ready
[ ] Admin manual done

TEAM READY
[ ] Dev team available
[ ] Ops team available
[ ] On-call team ready
[ ] Communication open
[ ] Rollback plan ready
```

---

### Launch Status

```
STATUS:     ☐ Ready  ☐ Not Ready
DATE:       ________________
TIME:       ________________
AUTHORIZED BY: ________________
```

---

## 🎉 Success Criteria

Launch is successful when:

✅ Site loads in < 3 seconds  
✅ API endpoints respond correctly  
✅ Admin can login and manage content  
✅ Users can access live score  
✅ Chat system functional  
✅ Error rate < 0.1%  
✅ Uptime > 99.9%  
✅ No critical bugs in first 24 hours  
✅ Monitoring and alerts active  
✅ Team feedback positive  

---

## 📞 Emergency Contacts

**Deployment Issues:**
- Primary: _________________ (______-____-____)
- Secondary: _________________ (______-____-____)

**Runtime Issues:**
- On-call: _________________ (______-____-____)
- Escalation: _________________ (______-____-____)

**Communication:**
- Slack Channel: #ipl-2026-deployment
- Status Page: https://status.yourdomain.com
- Admin Panel: https://yourdomain.com/admin

---

## 📋 Post-Launch Review

**One Week After Launch**

```
Date: ________________
Reviewer: ________________

METRICS
[ ] Uptime: ____%
[ ] Error Rate: ____%
[ ] Avg Response Time: ___ms
[ ] User Count: _____
[ ] Issues Found: _____

ISSUES
1. ______________________________
2. ______________________________
3. ______________________________

IMPROVEMENTS
1. ______________________________
2. ______________________________
3. ______________________________

NEXT STEPS
1. ______________________________
2. ______________________________

APPROVAL:  ☐ Pass  ☐ Needs Work
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Deployment

