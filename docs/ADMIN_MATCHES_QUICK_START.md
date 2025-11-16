# Quick Reference - Admin Matches

## 🎯 What Changed?

Your admin matches page is now **fully dynamic and interactive**.

## 📍 Live URL
https://ipl-2026-website.pages.dev/admin/matches/

## ✨ What You Can Do Now

| Action | How |
|--------|-----|
| **View all matches** | Page loads automatically from API |
| **Add new match** | Click "Add New Match" button → Fill form → Submit |
| **Edit a match** | Click "Edit" on any row → Update fields → Submit |
| **Delete a match** | Click "Delete" on any row → Confirm |
| **See changes** | Updates show instantly in the table |

## 🔧 Required Fields for New Matches

- **Date** (YYYY-MM-DD format)
- **Time** (HH:MM format)
- **Venue** (stadium name)
- **Team 1** (dropdown selection)
- **Team 2** (dropdown selection - must be different from Team 1)
- **Status** (upcoming, live, or completed)

## 📊 API Endpoints (Advanced)

```
GET    /api/matches              → Get all matches
POST   /api/matches              → Create new match (requires auth)
PUT    /api/matches              → Update match (requires auth)
DELETE /api/matches?id=<matchId> → Delete match (requires auth)
```

## 🔐 Authentication

- Automatically uses your admin login token
- Stored in browser's localStorage
- Sent with every API request
- Automatically redirects to login if expired

## 💾 Data Storage

- Matches stored in **Cloudflare KV**
- Persistent across sessions
- Real-time synchronization
- Automatic fallback to default data if KV is empty

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see matches | Make sure you're logged in as admin |
| Edit/Delete buttons don't work | Check if token is valid, re-login |
| Form won't submit | Fill all required fields, teams must be different |
| Changes not saved | Check browser console for error messages |

## 📝 Example: Adding a Match

1. Click **"Add New Match"** button
2. Enter **Date**: 2026-04-01
3. Enter **Time**: 19:30
4. Enter **Venue**: Narendra Modi Stadium, Ahmedabad
5. Select **Team 1**: RCB
6. Select **Team 2**: MI
7. Select **Status**: upcoming
8. Click **"Create Match"**
9. ✅ Match appears in table instantly!

## 📞 Support

If something isn't working:
1. Check browser console (F12) for error messages
2. Verify you're logged in as admin
3. Try refreshing the page
4. Check that the API is responding: `curl https://ipl-2026-website.pages.dev/api/matches`

---

**Last Updated**: 13 November 2025
**Status**: ✅ Production Ready
