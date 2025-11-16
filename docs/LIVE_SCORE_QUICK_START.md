# Live Score System - Quick Start Guide

## 🚀 What's New?

Your IPL 2026 platform now includes a complete live score and community engagement system!

---

## 📍 For End Users

### 1. **Live Score Page** (`/live-score`)
- **Access**: Click "Live Score" in the navbar
- **Features**:
  - Real-time match scores for both teams
  - Live ball-by-ball commentary
  - Current batter and bowler stats
  - Live chat for community engagement

### 2. **How to Use Live Chat**
```
Step 1: Click "Live Score" in navbar
Step 2: See the chat panel on the right
Step 3: Click "Sign In" or "Create Account"
Step 4: Enter your email and password
Step 5: Start chatting!

Note: You must be logged in to participate in chat
```

### 3. **Authentication**
- **Sign Up**: Create new account with email, password, and name
- **Sign In**: Login with credentials
- **Password Requirements**: Minimum 6 characters
- **Data Storage**: Your account is securely stored in Cloudflare KV

### 4. **Chat Features**
- Send comments during live matches (500 char limit)
- View all active users' messages
- Auto-scrolling to latest messages
- Real-time updates every 3 seconds
- Sign out when done

---

## 🛠️ For Admins/Managers

### 1. **Admin Live Score Management** (`/admin/live-score`)
**Access**: 
- Login at `/admin`
- Click "Live Score" in the left sidebar

**What You Can Do**:
- Update team names and scores
- Record wickets and overs
- Add current batter and bowler info
- Write ball-by-ball commentary
- Set match status (Live, Scheduled, Completed, Cancelled)
- View live preview of updates

**How to Use**:
```
1. Fill in the score update form (left side)
2. Update both teams' information
3. Add current match details
4. Write commentary (auto-adds to list)
5. Click "Update Live Score"
6. See changes in live preview immediately
```

### 2. **User Engagement Management** (`/admin/engagement`)
**Access**: 
- Click "Engagement" in the left sidebar

**Features**:
- Monitor all active users in live chat
- View user names and email addresses
- See when users were last active
- Block users (violating guidelines)
- Delete users (severe violations)

**How to Moderate**:
```
Step 1: View "Active Users in Chat" table
Step 2: Find user causing issues
Step 3: Click "Block" or "Delete"
Step 4: Optionally add reason (for block)
Step 5: Confirm action

Blocked users:
- Cannot send new messages
- Cannot view chat
- Cannot access the platform
```

### 3. **Real-Time Updates**
- Scores update instantly across all users' screens
- Commentary appears at top of feed
- Chat refreshes every 3 seconds
- Live preview shows all changes

---

## 🔐 Security Features

✅ **What's Protected**:
- Passwords are hashed with SHA-256 + salt
- Authentication tokens are secure (32-byte random)
- Sessions expire after 30 days
- Blocked users cannot access the system
- All data encrypted in transit (HTTPS)

✅ **User Data**:
- Email, name, user ID stored securely
- Login timestamps tracked
- Account metadata (creation date, last login)
- Optionally: Block reason and timestamp

---

## 📱 Browser Storage

### Local Storage (Client-Side)
The app stores in your browser:
```javascript
localStorage.setItem('auth_token', 'your-token');    // 30-day session
localStorage.setItem('user', JSON.stringify({...})); // User info
```

**Clear Data**:
- Sign out to clear localStorage
- Or manually clear in browser DevTools
- Or when you close the browser (use private/incognito mode)

---

## 🐛 Troubleshooting

### Chat Not Loading?
- Refresh the page
- Check if you're signed in
- Check browser console for errors
- Clear localStorage and sign in again

### Score Not Updating?
- Admin: Check if "Update Live Score" button worked (watch for loading state)
- User: Refresh the page manually
- Check your internet connection

### Can't Sign In?
- Check email spelling
- Verify password (min 6 characters)
- Try signing up if account doesn't exist
- Clear browser cache/cookies

### Blocked from Chat?
- Contact administrator
- An admin may have blocked your account
- Check your email for block reason

---

## 📊 API Endpoints (For Developers)

### Authentication
```
POST   /api/auth/signup      - Create new account
POST   /api/auth/signin      - Login
GET    /api/auth/verify      - Check token validity
POST   /api/auth/signout     - Logout
```

### Live Score
```
GET    /api/live-score       - Get current score
POST   /api/live-score       - Update score (admin only)
```

### Messages/Chat
```
GET    /api/messages         - Get chat messages
POST   /api/messages         - Send message (requires auth)
DELETE /api/messages/:id     - Delete message (admin only)
```

### User Management
```
GET    /api/admin/users      - Get active users (admin only)
PUT    /api/admin/users      - Block/unblock user
DELETE /api/admin/users      - Delete user (admin only)
POST   /api/admin/users/activity - Track user activity
```

---

## 🎮 Example Usage Flow

### As an End User:
```
1. Visit /live-score
2. See live match score between two teams
3. Read commentary from ball-by-ball updates
4. Click "Create Account" in chat
5. Sign up with email, password, name
6. Type your comment about the match
7. Click "Send" (max 500 characters)
8. See your message in the chat
9. Read other users' comments
10. Sign out when done watching
```

### As an Admin:
```
1. Visit /admin
2. Navigate to Live Score
3. Update match information:
   - Team 1: RCB 45/2 in 5 overs
   - Team 2: ---
   - Batter: Virat Kohli 25(18)
   - Bowler: Rashid Khan 1/12(2)
4. Add commentary: "Rashid gets one to turn sharply!"
5. Click "Update Live Score"
6. All users see update in 3 seconds
7. Check Engagement tab to monitor users
8. Block any user violating guidelines
```

---

## 📈 Current Capabilities

### Implemented ✅
- Real-time live score display
- Ball-by-ball commentary
- User authentication (signup/signin)
- Live chat system (3-sec polling)
- User blocking/deletion by admins
- Active user tracking
- Message storage (1000 msgs per match)
- 30-day session tokens
- Password hashing & security

### Coming Soon 🔮
- WebSocket for instant messaging (<100ms)
- Push notifications
- User profiles & reputation
- Advanced analytics dashboard
- Predictions & polls
- Rich media (emojis, images, videos)
- Mobile PWA app
- Premium subscriptions

---

## ❓ FAQ

**Q: How long do sessions last?**
A: 30 days. You'll need to sign in again after that.

**Q: Can I delete my account?**
A: Contact an admin. They can delete your account from the engagement page.

**Q: What happens if I'm blocked?**
A: You won't be able to sign in or access the chat. Contact an admin to appeal.

**Q: How many messages can I send?**
A: Unlimited, but we store max 1000 most recent messages per match.

**Q: Is my password saved?**
A: No, only a hashed version with a unique salt is stored.

**Q: Can I edit my messages?**
A: Not in current version. Future update will add this.

**Q: How many users can be active at once?**
A: System tracks up to 500 concurrent users. Supports more with scaling.

**Q: Can I use the same email multiple times?**
A: No, email must be unique for each account.

**Q: What's the rate limit for sending messages?**
A: No hard limit yet, but don't spam! Admins can block abusive users.

---

## 📞 Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Contact your system administrator
3. Check browser console for technical errors
4. Report bugs with: [feature description] + [error message]

---

## 🎯 Best Practices

### For End Users:
- ✅ Use respectful language in chat
- ✅ Keep messages under 500 characters
- ✅ Be constructive with criticism
- ❌ Don't spam or flood the chat
- ❌ Don't share personal info of others
- ❌ Don't use abusive language

### For Admins:
- ✅ Update score after each delivery
- ✅ Add engaging commentary
- ✅ Monitor chat for violations
- ✅ Document reason when blocking users
- ❌ Don't block without cause
- ❌ Don't share admin credentials

---

**Version**: 1.0
**Last Updated**: November 15, 2025
**Status**: Production Ready

For detailed technical information, see: `LIVE_SCORE_NEXT_ITERATIONS.md`
