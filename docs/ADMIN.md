# Admin Panel Guide

This document explains how to access and use the IPL 2026 admin panel for managing teams, players, matches, and other content.

## Quick Start

### Access Admin Panel (Demo Mode)

The easiest way to access the admin panel is via the demo login page:

```
https://ipl-2026-website.pages.dev/admin/demo
```

This page will **automatically sign you in** with demo credentials and redirect you to the admin dashboard.

---

## Admin Pages Overview

Once logged in, you can access the following admin pages:

### 1. **Admin Dashboard**
- **URL:** `/admin/dashboard`
- **Purpose:** Overview of admin functions and quick navigation
- **Features:** Links to all other admin pages

### 2. **Players Management**
- **URL:** `/admin/players`
- **Purpose:** Manage cricket players (add, edit, delete)
- **Features:**
  - View all players in a table
  - Add new players with full details (name, role, team, age, nationality, photo, bio)
  - Edit existing player information
  - Delete players
  - Player statistics (matches, runs, wickets, average, strike rate, economy)

### 3. **Teams Management**
- **URL:** `/admin/teams`
- **Purpose:** Manage cricket teams
- **Features:**
  - View all teams
  - Add new teams
  - Edit team details
  - Delete teams

### 4. **Matches Management**
- **URL:** `/admin/matches`
- **Purpose:** Manage match schedules and results
- **Features:**
  - Create and schedule matches
  - Update match results
  - View match listings

### 5. **Content Management**
- **URL:** `/admin/content`
- **Purpose:** Manage website content (news, announcements, etc.)
- **Features:**
  - Create and edit content
  - Manage featured content
  - Delete content

### 6. **Settings**
- **URL:** `/admin/settings`
- **Purpose:** Configure admin panel and system settings
- **Features:**
  - Update system configurations
  - Manage admin preferences

---

## Authentication Methods

### Option 1: Demo Auto-Login (Recommended for Testing)
1. Visit: `https://ipl-2026-website.pages.dev/admin/demo`
2. The page will automatically sign you in
3. You'll be redirected to `/admin/dashboard`

### Option 2: Manual Login
1. Visit: `https://ipl-2026-website.pages.dev/admin`
2. Enter login credentials:
   - **Admin User:**
     - Username: `admin`
     - Password: `admin123`
   - **Manager User:**
     - Username: `manager`
     - Password: `manager123`
3. Click "Sign In"
4. You'll be redirected to `/admin/dashboard`

### Option 3: Local Development
For local development, run:

```bash
npm install
npm run dev
```

Then access the admin panel at:
- Demo login: `http://localhost:3000/admin/demo`
- Manual login: `http://localhost:3000/admin`

---

## Using the Admin Panel

### 1. Login Flow
- Visit the demo login page or the main login page
- Enter credentials (see above)
- Click "Sign In"
- You'll be authenticated and redirected to the dashboard
- Your session is stored in `localStorage` as `adminToken`

### 2. Navigation
- Use the **Admin Sidebar** (left side of the page) to navigate between different admin pages
- The current page is highlighted in the sidebar
- All pages are protected and require a valid token

### 3. Add/Edit Items (Players, Teams, etc.)
- Click the **"Add New [Item]"** button (e.g., "Add New Player")
- A modal form will appear
- Fill in all required fields
- Click **"Add [Item]"** or **"Update [Item]"** to save
- Click **"Cancel"** to close the form without saving

### 4. Delete Items
- In the item table, find the row for the item you want to delete
- Click the **"Delete"** button
- Confirm the deletion in the dialog
- The item will be removed

---

## Session & Logout

### Session Management
- Your admin session is stored in browser `localStorage` under the key `adminToken`
- The token is valid for **7 days** (configurable in `src/lib/auth.ts`)

### How to Logout
- **Option 1:** Close the browser or clear `localStorage`
- **Option 2:** In most admin pages, use the browser back button to return to the login page and close the tab
- **Option 3 (Local Dev):** Clear browser `localStorage`:
  ```javascript
  localStorage.removeItem('adminToken');
  location.reload();
  ```

### Clear Session in Browser Console
If you need to manually clear your session:
1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.removeItem('adminToken');
   location.href = '/admin';
   ```

---

## File Structure

### Admin Pages (User Interface)
```
src/app/admin/
├── page.tsx                 # Login page
├── demo/
│   └── page.tsx            # Demo auto-login page
├── dashboard/
│   └── page.tsx            # Admin dashboard
├── players/
│   └── page.tsx            # Players management
├── teams/
│   └── page.tsx            # Teams management
├── matches/
│   └── page.tsx            # Matches management
├── content/
│   └── page.tsx            # Content management
└── settings/
    └── page.tsx            # Settings page
```

### Admin Components
```
src/components/admin/
├── AdminLogin.tsx          # Login form component
├── AdminSidebar.tsx        # Sidebar navigation
└── ProtectedRoute.tsx      # Route protection wrapper
```

### Admin API Routes
```
src/app/api/
├── admin/
│   └── login/
│       └── route.ts        # Login API endpoint
├── players/
│   └── route.ts            # Players API
├── teams/
│   └── route.ts            # Teams API
├── matches/
│   └── route.ts            # Matches API
└── content/
    └── route.ts            # Content API
```

### Authentication Library
```
src/lib/auth.ts             # JWT generation, token verification, user validation
```

---

## Demo Credentials

Use these credentials for testing:

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123    |
| Manager | manager  | manager123  |

**Note:** These are demo credentials only. In production, replace with secure authentication (database with hashed passwords, OAuth, etc.).

---

## Important Notes

### Styling
- Admin pages use **Tailwind CSS** for styling
- Custom classes: `glass-effect`, `frosted-glass`, `ipl-button`, `ipl-card` (defined in `src/app/globals.css`)
- Dark theme with purple and gold accents (IPL colors)

### Authentication
- All admin pages check for `adminToken` in `localStorage`
- If no token is found, the page redirects to the login page (`/admin`)
- Tokens are validated using JWT (see `src/lib/auth.ts`)

### API Calls
- The admin pages fetch data from the corresponding API routes (`/api/players`, `/api/teams`, etc.)
- Forms submit data back to the API (implementation in progress)
- Currently, some endpoints are placeholders—they need backend integration

### Trailing Slashes
- Admin URLs use **trailing slashes** (e.g., `/admin/players/`)
- If you visit without a trailing slash (e.g., `/admin/players`), you'll be redirected to the trailing-slash version

---

## Troubleshooting

### "Page isn't loading" or "404"
- Ensure you are logged in (have a valid `adminToken`)
- Try visiting `/admin` to log in again
- Or visit `/admin/demo` for automatic demo login

### "Invalid credentials"
- Check that you're using the correct username and password (see Demo Credentials above)
- Make sure CAPS LOCK is off

### "Session expired"
- Your token may have expired (7 days by default)
- Log in again by visiting `/admin` or `/admin/demo`

### "Styles aren't loading" (admin page appears unstyled)
- Check that CSS is being served correctly at `/_next/static/css/`
- Clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete on Mac)
- Try accessing the page in an incognito/private window

### "API calls failing"
- The API endpoints (`/api/players`, etc.) may not be fully implemented
- Check the browser console (F12 → Console) for error messages
- Verify the API routes exist in `src/app/api/`

---

## Production Considerations

Before deploying to production:

1. **Change demo credentials** in `src/lib/auth.ts`
   - Remove or hide the demo login page (`src/app/admin/demo/page.tsx`)
   - Integrate with a proper database and authentication system

2. **Use environment variables for secrets**
   - Move `JWT_SECRET` to `.env` file (see `src/lib/auth.ts`)
   - Use bcrypt or similar for password hashing

3. **Implement proper password hashing**
   - Replace the mock password check in `validateCredentials()` with bcrypt

4. **Add HTTPS and secure headers**
   - Use HTTPS only (already enforced by Cloudflare Pages)
   - Set secure cookie flags for tokens (if using cookies instead of localStorage)

5. **Implement CSRF protection**
   - Add CSRF tokens to admin forms if needed

6. **Set up database**
   - Replace mock users and in-memory data with real database queries
   - Implement proper data persistence

7. **Add audit logging**
   - Log all admin actions (create, update, delete) for compliance

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code comments in `src/app/admin/` and `src/lib/auth.ts`
- Check the browser console for error messages
- Refer to the Next.js documentation: https://nextjs.org/docs

---

**Last Updated:** November 12, 2025
**Version:** 1.0
