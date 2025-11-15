# 🧪 IPL 2026 - Comprehensive Testing Guide

## Overview

This guide provides complete testing procedures for all features after deployment. Follow the checklist systematically to validate all functionality.

---

## 📋 Pre-Testing Checklist

- [ ] Application deployed to Cloudflare Pages
- [ ] All environment variables set in `wrangler.toml`
- [ ] KV namespace created and linked
- [ ] Admin account created
- [ ] Network connectivity verified
- [ ] Browser console checked for errors (F12)

---

## 🔐 1. Authentication Testing

### 1.1 User Signup

**Test Case: Create new user account**

```bash
# Send signup request
curl -X POST https://yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'

# Expected Response (201 Created)
{
  "message": "User created successfully",
  "user": {
    "id": "user_1234567890_abc123",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "user",
    "token": "token_abc123xyz789"
  }
}
```

**Manual Testing:**
1. Open `/admin/login` page
2. Click "Sign up here"
3. Enter: Email: `test@example.com`, Password: `TestPass123`, Name: `Test User`
4. Click "Sign up"
5. ✅ Verify redirect to `/admin` after successful signup

**Failure Cases:**
- [ ] Signup with invalid email format → Error message shown
- [ ] Signup with weak password → Error message shown
- [ ] Signup with existing email → Error message shown
- [ ] Signup with missing fields → Form validation errors shown

---

### 1.2 User Login

**Test Case: Login with correct credentials**

```bash
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ipl2026.com",
    "password": "IPLAdmin@2025"
  }'

# Expected Response (200 OK)
{
  "message": "Login successful",
  "user": {
    "id": "user_xxxxx",
    "email": "admin@ipl2026.com",
    "name": "Admin User",
    "role": "admin",
    "token": "token_xxxxx"
  }
}
```

**Manual Testing:**
1. Go to `/admin/login`
2. Enter admin credentials
3. Click "Sign in"
4. ✅ Verify redirect to `/admin/dashboard`
5. ✅ Verify token stored in localStorage

**Failure Cases:**
- [ ] Login with wrong password → "Invalid credentials" error
- [ ] Login with non-existent email → "User not found" error
- [ ] Login with missing fields → Form validation error

---

### 1.3 Token Verification

**Test Case: Verify token validity**

```bash
curl -X GET https://yourdomain.com/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected Response (200 OK)
{
  "valid": true,
  "user": {
    "id": "user_xxxxx",
    "email": "admin@ipl2026.com",
    "role": "admin"
  }
}
```

**Verification:**
- [ ] Valid token returns user info
- [ ] Invalid token returns 401 error
- [ ] Expired token returns 401 error

---

### 1.4 Logout

**Test Case: User logout**

```bash
curl -X POST https://yourdomain.com/api/auth/signout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected Response (200 OK)
{
  "message": "Logged out successfully"
}
```

**Manual Testing:**
1. Login as admin
2. Click user menu → "Logout"
3. ✅ Verify token removed from localStorage
4. ✅ Verify redirect to login page
5. ✅ Verify cannot access admin pages without token

---

## 🏏 2. Live Score Testing

### 2.1 Get Current Score (Public)

**Test Case: Retrieve current match score**

```bash
curl -X GET https://yourdomain.com/api/live-score

# Expected Response (200 OK)
{
  "matchId": "match_001",
  "team1": {
    "name": "Royal Challengers Bangalore",
    "score": 156,
    "wickets": 8,
    "overs": 19.3
  },
  "team2": {
    "name": "Mumbai Indians",
    "score": 0,
    "wickets": 0,
    "overs": 0
  },
  "status": "inprogress",
  "updatedAt": "2025-01-15T18:30:45Z"
}
```

**Manual Testing:**
1. Visit `/live-score` (public page)
2. ✅ Verify current score displayed
3. ✅ Verify teams shown
4. ✅ Verify refreshes every 5-10 seconds

**Verification:**
- [ ] Score data loads without authentication
- [ ] Data refreshes automatically
- [ ] No console errors during polling

---

### 2.2 Update Score (Admin Only)

**Test Case: Admin updates match score**

```bash
curl -X POST https://yourdomain.com/api/live-score \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_001",
    "team1": {
      "score": 160,
      "wickets": 8,
      "overs": 20
    },
    "commentary": "Six! RCB wins the match!",
    "status": "completed"
  }'

# Expected Response (200 OK)
{
  "message": "Score updated",
  "score": {
    "matchId": "match_001",
    "team1": { "score": 160, "wickets": 8, "overs": 20 },
    "status": "completed",
    "updatedAt": "2025-01-15T18:35:00Z"
  }
}
```

**Manual Testing:**
1. Login as admin
2. Go to `/admin/live-score`
3. Update score values
4. Click "Update Score"
5. ✅ Verify score updates in KV
6. ✅ Verify public page reflects changes within 5-10 seconds
7. ✅ Verify commentary updates

**Failure Cases:**
- [ ] Non-admin trying to update → 403 Forbidden
- [ ] Invalid token trying to update → 401 Unauthorized
- [ ] Invalid match data → 400 Bad Request

---

## 💬 3. Messaging/Chat Testing

### 3.1 Send Message

**Test Case: User sends chat message**

```bash
curl -X POST https://yourdomain.com/api/messages \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_001",
    "text": "What an amazing match!",
    "username": "TestUser"
  }'

# Expected Response (201 Created)
{
  "message": "Message sent",
  "data": {
    "id": "msg_xxxxx",
    "matchId": "match_001",
    "text": "What an amazing match!",
    "username": "TestUser",
    "timestamp": "2025-01-15T18:36:00Z"
  }
}
```

**Manual Testing:**
1. Visit `/live-score`
2. (May require signin) Enter message text
3. Click "Send"
4. ✅ Verify message appears in chat
5. ✅ Verify timestamp correct
6. ✅ Verify username displayed

**Verification:**
- [ ] Unauthenticated user cannot send message
- [ ] Empty message rejected
- [ ] Message appears immediately in UI
- [ ] All users see same messages

---

### 3.2 Get Messages

**Test Case: Retrieve chat messages**

```bash
curl -X GET "https://yourdomain.com/api/messages?matchId=match_001&limit=50"

# Expected Response (200 OK)
{
  "messages": [
    {
      "id": "msg_001",
      "matchId": "match_001",
      "text": "Great catch!",
      "username": "User1",
      "timestamp": "2025-01-15T18:35:00Z"
    },
    {
      "id": "msg_002",
      "matchId": "match_001",
      "text": "Amazing performance!",
      "username": "User2",
      "timestamp": "2025-01-15T18:36:00Z"
    }
  ],
  "total": 2,
  "limit": 50
}
```

**Manual Testing:**
1. Visit `/live-score`
2. Scroll through chat
3. ✅ Verify messages load (max 1000)
4. ✅ Verify messages sorted by time
5. ✅ Verify auto-scrolls to latest

**Verification:**
- [ ] Messages load without authentication
- [ ] Message limit enforced (max 1000)
- [ ] Pagination works if implemented
- [ ] No console errors

---

### 3.3 Delete Message (Admin)

**Test Case: Admin deletes inappropriate message**

```bash
curl -X DELETE https://yourdomain.com/api/messages/msg_001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected Response (200 OK)
{
  "message": "Message deleted successfully"
}
```

**Manual Testing:**
1. Login as admin
2. Go to `/admin/engagement`
3. Find message to delete
4. Click delete
5. ✅ Verify message removed from chat
6. ✅ Verify not visible to other users

**Failure Cases:**
- [ ] Non-admin trying to delete → 403 Forbidden
- [ ] Deleting non-existent message → 404 Not Found

---

## 👥 4. User Management Testing (Admin)

### 4.1 Get Active Users

**Test Case: Admin views active users**

```bash
curl -X GET https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected Response (200 OK)
{
  "users": [
    {
      "id": "user_001",
      "email": "user1@example.com",
      "name": "User One",
      "role": "user",
      "isBlocked": false,
      "lastActive": "2025-01-15T18:36:00Z",
      "messageCount": 5
    },
    {
      "id": "user_002",
      "email": "user2@example.com",
      "name": "User Two",
      "role": "user",
      "isBlocked": false,
      "lastActive": "2025-01-15T18:35:00Z",
      "messageCount": 3
    }
  ],
  "total": 2
}
```

**Manual Testing:**
1. Login as admin
2. Go to `/admin/engagement`
3. ✅ Verify user list loads
4. ✅ Verify displays active users
5. ✅ Verify shows last active time
6. ✅ Verify displays message count

**Verification:**
- [ ] Only admin can access
- [ ] Shows only active users (last 30 mins)
- [ ] Displays correct user info
- [ ] Loads within 2 seconds

---

### 4.2 Block/Unblock User

**Test Case: Admin blocks spamming user**

```bash
curl -X PUT https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_002",
    "action": "block",
    "reason": "Spam"
  }'

# Expected Response (200 OK)
{
  "message": "User blocked successfully",
  "user": {
    "id": "user_002",
    "isBlocked": true,
    "blockedReason": "Spam"
  }
}
```

**Manual Testing:**
1. Login as admin
2. Go to `/admin/engagement`
3. Find user → Click "Block"
4. Confirm action
5. ✅ Verify user marked as blocked
6. ✅ Verify blocked user cannot login
7. Unblock same user
8. ✅ Verify user can login again

**Verification:**
- [ ] Block prevents login
- [ ] Block prevents message sending
- [ ] Unblock restores access
- [ ] Block reason stored

---

### 4.3 Delete User

**Test Case: Admin deletes user account**

```bash
curl -X DELETE https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_999",
    "reason": "Account cleanup"
  }'

# Expected Response (200 OK)
{
  "message": "User deleted successfully",
  "deletedUserId": "user_999"
}
```

**Manual Testing:**
1. Create test user
2. Login as admin
3. Go to `/admin/engagement`
4. Select user → Click "Delete"
5. Confirm
6. ✅ Verify user removed from list
7. ✅ Verify deleted user cannot login
8. ✅ Verify user data purged from KV

**Verification:**
- [ ] Deleted user cannot access account
- [ ] User removed from active list
- [ ] User data removed from KV
- [ ] Deletion logged (if logging implemented)

---

## 🎨 5. UI/UX Testing

### 5.1 Navigation

**Manual Testing:**
- [ ] All navigation links work
- [ ] Active page highlighted in sidebar
- [ ] Mobile menu toggles correctly
- [ ] Breadcrumbs show correct path
- [ ] Back button works correctly

**Pages to Test:**
- [ ] Home page (`/`)
- [ ] Live Score page (`/live-score`)
- [ ] Admin Login (`/admin/login`)
- [ ] Admin Dashboard (`/admin/dashboard`) - after login
- [ ] Admin Live Score (`/admin/live-score`) - after login
- [ ] Admin Engagement (`/admin/engagement`) - after login

### 5.2 Responsive Design

**Test on Different Devices:**
- [ ] Desktop (1920px, 1440px)
- [ ] Tablet (768px)
- [ ] Mobile (375px, 414px)

**Verification:**
- [ ] Layout adapts correctly
- [ ] Touch targets large enough (44px min)
- [ ] Text readable without zoom
- [ ] Images scale properly
- [ ] No horizontal scrolling (except intentional)

### 5.3 Form Validation

**Test Each Form:**
- [ ] Required fields show error when empty
- [ ] Email validation works
- [ ] Password requirements enforced
- [ ] Error messages clear and helpful
- [ ] Success messages appear
- [ ] Buttons disable during submission

### 5.4 Loading States

**Manual Testing:**
- [ ] Spinners appear during API calls
- [ ] Loading text shown
- [ ] Buttons disabled during submission
- [ ] No duplicate submissions possible
- [ ] Errors handled gracefully

### 5.5 Error Handling

**Simulate Errors:**

```bash
# Test network error
# - Disconnect internet while loading
# ✅ Verify error message shown
# ✅ Verify retry button available

# Test API error
# - Use invalid token
# ✅ Verify error message
# ✅ Verify redirect to login if needed

# Test 404 errors
# - Visit non-existent page
# ✅ Verify 404 page displayed
```

---

## ⚡ 6. Performance Testing

### 6.1 Page Load Times

**Measure with DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Visit each page
4. Record timings:

```
Page                    Target    Actual    Status
────────────────────────────────────────────────────
Home                    < 3s      ___s      [ ]
Live Score              < 3s      ___s      [ ]
Admin Login             < 2s      ___s      [ ]
Admin Dashboard         < 3s      ___s      [ ]
Admin Live Score        < 3s      ___s      [ ]
Admin Engagement        < 4s      ___s      [ ]
```

### 6.2 API Response Times

```bash
# Time API calls
time curl https://yourdomain.com/api/live-score
# Target: < 500ms

time curl https://yourdomain.com/api/messages
# Target: < 500ms

time curl https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer TOKEN"
# Target: < 1s
```

### 6.3 Resource Sizes

**Check in DevTools:**
- [ ] JavaScript total < 200KB
- [ ] CSS total < 50KB
- [ ] Images optimized
- [ ] No unused assets
- [ ] Gzip compression enabled

---

## 🔒 7. Security Testing

### 7.1 Authentication Security

**Test Cases:**
- [ ] Tokens expire after 7 days
- [ ] Cannot use expired token
- [ ] Cannot forge valid tokens
- [ ] Token not exposed in URL
- [ ] Token cleared on logout
- [ ] Password hashing verified

### 7.2 Authorization

**Test Cases:**
- [ ] Non-admin cannot access admin endpoints
- [ ] User cannot access other user's data
- [ ] Unauthenticated users blocked from protected routes
- [ ] Role-based access enforced
- [ ] Token required for protected endpoints

### 7.3 Data Protection

**Test Cases:**
- [ ] Passwords hashed with salt
- [ ] Sensitive data not logged
- [ ] No SQL injection possible (no SQL used)
- [ ] XSS prevention verified
- [ ] CSRF tokens implemented (if needed)

---

## 📊 8. Data Integrity Testing

### 8.1 KV Storage

**Verify Data Persistence:**

```bash
# Create data
curl -X POST https://yourdomain.com/api/live-score \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId": "test_001", "team1": {"score": 100}}'

# Wait 30 seconds
sleep 30

# Retrieve same data
curl https://yourdomain.com/api/live-score

# ✅ Verify same data retrieved
```

**TTL Verification:**
- [ ] User data persists 1 year
- [ ] Messages persist 7 days
- [ ] Tokens persist 7 days
- [ ] Score data persists indefinitely (or as configured)

### 8.2 Message Buffer

**Test 1000 Message Limit:**

```bash
# Send 1001 messages (script needed)
# ✅ Verify only last 1000 stored
# ✅ Verify oldest message dropped
```

---

## 🐛 9. Browser Compatibility

**Test on:**
- [ ] Chrome/Chromium (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest version)

**Verification:**
- [ ] No console errors
- [ ] Styles render correctly
- [ ] Animations smooth
- [ ] Forms functional
- [ ] LocalStorage works

---

## 📝 10. Accessibility Testing

**Manual Testing:**
- [ ] Can navigate with keyboard only (Tab key)
- [ ] Screen reader compatible
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Form labels associated
- [ ] Images have alt text
- [ ] Focus visible on interactive elements

**Tools:**
- Chrome DevTools Lighthouse
- axe DevTools extension

---

## ✅ Final Verification Checklist

Before declaring deployment complete:

```
FUNCTIONALITY
[ ] Authentication (signup, signin, verify, logout)
[ ] Live score (get, update)
[ ] Messaging (send, get, delete)
[ ] User management (list, block, delete)
[ ] All admin functions
[ ] All user functions

PERFORMANCE
[ ] Page load < 3 seconds
[ ] API responses < 500ms
[ ] Chat polling every 5-10s
[ ] No memory leaks
[ ] No console errors

SECURITY
[ ] Passwords hashed
[ ] Tokens expire
[ ] Authorization enforced
[ ] No sensitive data exposed
[ ] HTTPS enforced

COMPATIBILITY
[ ] Desktop browsers tested
[ ] Mobile responsive
[ ] Tablet tested
[ ] Keyboard navigation works
[ ] Screen readers work

DOCUMENTATION
[ ] All features documented
[ ] API endpoints documented
[ ] Deployment process documented
[ ] Troubleshooting guide created
[ ] Admin manual created
```

---

## 🚀 Deployment Sign-Off

When all tests pass, sign off on deployment:

```
Date: _______________
Tester: _______________
Status: ✅ Ready for Production
Issues Found: [ ] 0 [ ] Minor [ ] Major

Notes:
_________________________________
_________________________________
```

---

## 📞 Troubleshooting

### Common Issues

**Issue: 404 errors on API calls**
- Verify Wrangler build output includes `functions/` folder
- Check `_routes.json` in `public/` for correct routing
- Verify `wrangler.toml` has correct build config

**Issue: KV data not persisting**
- Verify namespace linked in `wrangler.toml`
- Check KV quota limits
- Verify TTL settings reasonable

**Issue: Messages not updating in real-time**
- Check polling interval (5-10s)
- Verify API endpoint working
- Check browser console for errors

**Issue: Admin routes inaccessible**
- Verify token valid (7 day expiry)
- Check role is "admin"
- Verify Authorization header format: `Bearer TOKEN`

---

## 📚 Related Documents

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- API documentation in code comments

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Ready for Use

