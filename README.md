# 🏏 Cricket Premier Leagues - IPL & WPL 2026

A modern, full-stack cricket website supporting both **Indian Premier League (IPL)** and **Women's Premier League (WPL)** with real-time scores, comprehensive statistics, news, and admin management.

![Status](https://img.shields.io/badge/status-production%20ready-success)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Recent Updates](#recent-updates)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Technology Stack](#technology-stack)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

This is a comprehensive cricket platform that provides:

- **Dual League Support**: Seamless experience for both IPL and WPL
- **Real-time Live Scores**: Live match updates with ball-by-ball commentary
- **Comprehensive Statistics**: Player and team performance analytics
- **News & Updates**: Latest cricket news and match reports
- **Admin Panel**: Full content management system
- **Modern UI/UX**: Premium design with smooth animations

---

## ✨ Features

### 🌐 Public Website

#### **Home Pages**
- **Main Home Page** (`/`): Unified landing page showcasing both IPL and WPL
- **IPL Home Page** (`/ipl`): Dedicated IPL experience with blue/cyan theme
- **WPL Home Page** (`/wpl`): Dedicated WPL experience with purple/pink theme

#### **League Switcher**
- Quick toggle between IPL and WPL
- Automatic navigation to respective home pages
- Context-aware content filtering

#### **Match Management**
- Live score tracking (`/live-score`)
- Match schedule with filtering (`/matches`)
- Match details and statistics
- Real-time updates

#### **Teams & Players**
- Team profiles with logos and colors (`/teams`)
- Player statistics and profiles
- Team performance analytics
- Player comparison tools

#### **News & Content**
- Latest cricket news (`/news`)
- Category filtering (match, team, player, general)
- Search functionality
- Article details with images

#### **Statistics**
- League-wide statistics (`/stats`)
- Player performance metrics
- Team comparisons
- Historical data

### 🔐 Admin Panel

- **Dashboard**: Overview statistics and quick actions
- **Match Management**: Create, edit, and manage matches
- **Team Management**: Manage teams and rosters
- **Player Management**: Add and update player information
- **Content Management**: News articles and content
- **Live Score Control**: Real-time score updates
- **User Management**: User accounts and engagement
- **Email Notifications**: Automated match reminders

---

## 🔧 How It Works

This section explains the architecture, data flow, and key mechanisms of the website.

### Architecture Overview

The website follows a **full-stack architecture** with:

1. **Frontend (Next.js)**: React-based UI with server-side rendering
2. **Backend (Cloudflare Workers)**: Serverless API endpoints
3. **Storage (Cloudflare KV)**: Key-value database for persistent data
4. **State Management**: React Context API for league switching

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js Frontend│
│  (React + SSR)   │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│ Cloudflare Pages│
│   Functions API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare KV  │
│   (Database)     │
└─────────────────┘
```

### League Switching System

The website supports **dual league mode** (IPL and WPL) with seamless switching:

#### **League Context (`LeagueContext.tsx`)**
- **Purpose**: Manages the current league state across the entire application
- **Storage**: Persists selection in `localStorage` (key: `sportsup99_current_league`)
- **Default**: IPL if no preference is stored
- **API**: Provides `currentLeague`, `setCurrentLeague()`, `toggleLeague()`, `isIPL`, `isWPL`

#### **How It Works**:
1. User selects IPL or WPL via the `LeagueSwitcher` component
2. Context updates and saves to `localStorage`
3. All components using `useLeague()` hook automatically re-render
4. API calls include `?league=ipl` or `?league=wpl` parameter
5. Backend filters data based on league parameter

#### **League-Aware Components**:
- **Navbar**: Shows/hides stats link (WPL doesn't have stats)
- **Home Pages**: Filter matches, teams, news by league
- **Admin Panel**: League switcher in sidebar, filters all data
- **API Calls**: All endpoints support league parameter

### Data Flow

#### **1. Data Fetching Pattern**

```typescript
// Frontend Component
const { currentLeague } = useLeague();
const [matches, setMatches] = useState<Match[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const data = await api.getMatches(currentLeague);
    setMatches(data);
  };
  fetchData();
}, [currentLeague]);
```

#### **2. API Client (`src/lib/data.ts`)**

Centralized API client that:
- Constructs URLs with league parameters
- Handles errors gracefully
- Falls back to mock data if API fails
- Provides type-safe methods for all entities

```typescript
export const api = {
  getMatches: async (league?: League) => {
    const url = `/api/matches${league ? `?league=${league}` : ''}`;
    // Fetch and return typed data
  },
  // ... other methods
};
```

#### **3. Backend API (`functions/api/*.js`)**

Cloudflare Workers that:
- Read/write to Cloudflare KV storage
- Filter data by league parameter
- Handle CRUD operations (GET, POST, PUT, DELETE)
- Return JSON responses

**Storage Keys**:
- `matches` - All match data
- `teams` - All team data
- `players` - All player data
- `content` - News and content
- `settings` - App settings

**Data Flow Example (Creating a Match)**:
```
Admin Panel → POST /api/matches
  ↓
Cloudflare Worker validates request
  ↓
Read existing matches from KV
  ↓
Add new match to array
  ↓
Write back to KV
  ↓
Return success response
  ↓
Frontend refreshes match list
```

### Match Numbering System

Matches are automatically assigned numbers based on chronological order:

#### **How It Works**:
1. **Generation**: `generateMatchNumber()` in `src/lib/matchNumberUtils.ts`
   - Sorts matches by date and time
   - Assigns sequential numbers: `IPL-001`, `IPL-002`, etc.
   - Format: `{LEAGUE}-{NUMBER}` (e.g., `WPL-001`)

2. **Recalculation**: `recalculateMatchNumbers()`
   - Called when matches are created, updated, or deleted
   - Ensures numbers stay sequential and correct

3. **Display**: `getMatchNumberDisplay()`
   - Shows match number: `"IPL-001"`
   - For playoffs: `"IPL-001 - Eliminator"` or `"WPL-020 - Final"`
   - Handles missing numbers gracefully

#### **Playoff Match Support**:
- Playoff matches have `playoffType`: `'eliminator'`, `'qualifier1'`, `'qualifier2'`, `'final'`
- Display combines match number + playoff type
- Example: `"Match 21 - Eliminator"` or `"Match 25 - Final"`

### Playoff Match System

Special handling for playoff matches (Eliminator, Qualifier, Final):

#### **Features**:
1. **TBD Teams**: Playoff matches start with placeholder teams
   - "1st Place Team", "2nd Place Team", "Winner of Eliminator"
   - Teams are determined after league stage completion

2. **TBA Logo**: Placeholder teams use `/logos/tba_logo.svg`
   - Animated "To Be Announced" logo
   - Replaced with actual team logos when teams are determined

3. **Fixed Details**: Date, time, and venue are pre-filled but editable
   - WPL Eliminator: 2nd vs 3rd place
   - WPL Final: 1st place vs Eliminator winner
   - IPL has Qualifier 1, Eliminator, Qualifier 2, Final

4. **Filtering**: Placeholder teams are filtered out from team listings
   - Only actual teams (5 WPL, 10 IPL) appear in team pages
   - `isPlaceholderTeam()` utility identifies placeholder teams

#### **Workflow**:
```
1. Admin creates playoff match
   ↓
2. System pre-fills date, time, venue, TBD teams
   ↓
3. Match appears with TBA logos
   ↓
4. After league stage, admin updates teams
   ↓
5. TBA logos replaced with actual team logos
```

### Logo System

Sophisticated logo resolution system with multiple fallbacks:

#### **Logo Priority Order**:
1. **Team Logo** (`team.logo`): Direct logo path (e.g., `/logos/tba_logo.svg`)
2. **TBA Logo**: For placeholder teams
3. **RCB Premium Logo**: Special animated logo for RCB
4. **Animated Logos**: League-specific animated SVGs
5. **Static Logos**: Fallback static images

#### **Logo Utilities** (`src/lib/logoUtils.ts`):
- `getAnimatedLogoPath()`: Returns animated logo path for team
- `getTeamLogo()`: Main function that resolves logo with priority
- Handles special cases (RCB premium, TBA, etc.)

#### **Logo Types**:
- **Animated SVGs**: `/logos/{team}_logo_animated.svg`
- **Static SVGs**: `/logos/{team}_logo_new.svg`
- **Premium Logos**: Special animated logos (e.g., RCB Lion)
- **TBA Logo**: `/logos/tba_logo.svg` for placeholder teams

### Time Zone Handling

Matches are stored in **IST (Indian Standard Time)** and displayed in multiple timezones:

#### **Storage**:
- All match times stored in IST format: `"19:30"` (7:30 PM IST)

#### **Display**:
- **End-user pages**: Show both IST and local timezone
- **Format**: `"7:30 PM IST / 2:00 PM GMT"` (example)
- **Conversion**: `convertISTToLocalTime()` in `src/lib/timeUtils.ts`

#### **Admin Panel**:
- **IPL**: Free-form time input
- **WPL**: Dropdown with fixed times (3:30 PM, 7:30 PM IST)
- Times stored as IST, displayed with conversions

### Countdown Timer

Modern countdown timer component for upcoming matches:

#### **Features**:
- **Accurate Calculation**: Combines date and time for precise countdown
- **Modern UI**: Dark purple gradient boxes with flip animations
- **Time Units**: Days, Hours, Minutes, Seconds
- **Auto-update**: Updates every second
- **Expiration Handling**: Shows "Match Started" when time expires

#### **Component**: `src/components/ui/CountdownTimer.tsx`
- Props: `targetDate`, `matchTime`, `onComplete`, `className`
- Uses Framer Motion for smooth animations
- Responsive design fits within match panels

### Admin Panel Workflow

#### **Authentication**:
1. Admin logs in at `/ipl-admin-2026`
2. JWT token stored in `localStorage`
3. Token validated on each API request
4. Protected routes check authentication

#### **Match Management**:
1. **View Matches**: Table or timeline view
2. **Create Match**: Form with league-aware fields
   - Venue dropdown (IPL) or text input (WPL)
   - Time input (IPL) or dropdown (WPL)
   - Team selection with logos
3. **Edit Match**: Update any field, including status
4. **Delete Match**: Removes from KV storage permanently
5. **Playoff Matches**: Special form with TBD teams

#### **Data Persistence**:
- **KV Storage**: All data persisted in Cloudflare KV
- **No Mock Fallback**: Once data exists in KV, mock data is not used
- **Deletion**: Deleted items remain deleted (no reappearance)

### Statistics System

#### **IPL Statistics**:
- Full player statistics (runs, wickets, averages, etc.)
- Team comparisons
- Historical data
- Available at `/stats` page

#### **WPL Statistics**:
- **No Statistics**: WPL players don't have statistics
- **Stats Page Hidden**: `/stats` redirects to home for WPL
- **Admin Panel**: Stats columns hidden in players page
- **Player Info Only**: Basic player information (name, role, age, etc.)

### News & Content System

#### **Content Types**:
- **News Articles**: Match reports, team updates, player news
- **Categories**: Match, Team, Player, General
- **League Support**: Can be IPL, WPL, or both
- **Rich Content**: Images, summaries, linked entities

#### **Content Management**:
- Admin creates content via `/ipl-admin-2026/content`
- Content stored in KV with metadata
- Public pages filter by league and category
- Search functionality across all content

### Live Score System

#### **Real-time Updates**:
- Admin updates scores via `/ipl-admin-2026/live-score`
- Scores stored in match object under `score` property
- Public page polls for updates (5-10 second intervals)
- Ball-by-ball commentary support

#### **Score Structure**:
```typescript
score: {
  team1: { runs: 150, wickets: 3, overs: 15.2 },
  team2: { runs: 120, wickets: 5, overs: 14.0 }
}
```

### Error Handling & Fallbacks

#### **API Failures**:
1. **Primary**: Fetch from Cloudflare KV via API
2. **Fallback**: Use mock data from `src/lib/data.ts`
3. **Error State**: Show user-friendly error messages
4. **Loading States**: Skeleton loaders during data fetch

#### **Data Validation**:
- TypeScript types ensure type safety
- Runtime validation in API endpoints
- Graceful degradation for missing data

### Performance Optimizations

1. **Server-Side Rendering**: Initial page load is fast
2. **Client-Side Hydration**: Interactive after hydration
3. **Memoization**: `useMemo` for expensive computations
4. **Lazy Loading**: Components loaded on demand
5. **Image Optimization**: Next.js Image component
6. **Code Splitting**: Automatic route-based splitting

### Security Features

1. **Admin Authentication**: JWT tokens with expiration
2. **Protected Routes**: Admin routes require authentication
3. **Input Validation**: Server-side validation for all inputs
4. **CORS**: Configured for production domain
5. **Rate Limiting**: Cloudflare Workers rate limiting

---

## 🆕 Recent Updates

### **Dual League Support (Latest)**

#### **1. Separate Home Pages**
- ✅ Created dedicated home pages for IPL (`/ipl`) and WPL (`/wpl`)
- ✅ Main home page (`/`) showcases both leagues with interactive cards
- ✅ League-specific branding and color schemes

#### **2. League Switcher Integration**
- ✅ Added league switcher component in navigation
- ✅ Clicking IPL/WPL buttons redirects to respective home pages
- ✅ Context-aware content filtering throughout the app

#### **3. API Enhancements**
- ✅ Updated all API endpoints to support `league` parameter
- ✅ Backend filtering for teams, players, matches, coaches, and content
- ✅ Backward compatibility with default 'ipl' league

**Updated Endpoints:**
- `/api/teams?league=ipl|wpl`
- `/api/players?league=ipl|wpl`
- `/api/matches?league=ipl|wpl`
- `/api/coaches?league=ipl|wpl`
- `/api/content?league=ipl|wpl`

#### **4. UI/UX Improvements**
- ✅ **Premium Hero Sections**: Animated gradient backgrounds with parallax effects
- ✅ **Modern Card Designs**: Glassmorphism effects with hover animations
- ✅ **Better Visual Hierarchy**: Improved typography and spacing
- ✅ **Smooth Animations**: Framer Motion animations throughout
- ✅ **Responsive Design**: Optimized for all screen sizes
- ✅ **Scroll Indicators**: Animated scroll indicators on hero sections
- ✅ **Quick Stats Widgets**: Interactive statistics cards

#### **5. Data Fetching Improvements**
- ✅ League-aware data fetching in all components
- ✅ Fallback to mock data when API fails
- ✅ Proper error handling and loading states
- ✅ Optimized API calls with Promise.all

#### **6. Navigation Updates**
- ✅ Removed direct WPL link from navigation bar
- ✅ Dynamic home page routing based on league context
- ✅ League switcher integrated in navbar

---

## 📁 Project Structure

```
sportsup99/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main home page (both leagues)
│   │   ├── ipl/
│   │   │   └── page.tsx          # IPL home page
│   │   ├── wpl/
│   │   │   ├── page.tsx          # WPL home page
│   │   │   ├── teams/
│   │   │   ├── matches/
│   │   │   └── stats/
│   │   ├── teams/                # Teams page
│   │   ├── matches/              # Matches page
│   │   ├── live-score/           # Live scores
│   │   ├── news/                 # News page
│   │   ├── stats/                # Statistics page
│   │   └── ipl-admin-2026/       # Admin panel
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── LeagueSwitcher.tsx  # League toggle component
│   │   │   └── Footer.tsx
│   │   ├── home/                 # Home page components
│   │   ├── teams/                # Team-related components
│   │   └── ui/                   # Reusable UI components
│   ├── contexts/
│   │   └── LeagueContext.tsx     # League state management
│   ├── lib/
│   │   └── data.ts               # API client with league support
│   └── types/
│       └── index.ts              # TypeScript types
├── functions/
│   └── api/
│       ├── teams.js              # Teams API (league-aware)
│       ├── players.js            # Players API (league-aware)
│       ├── matches.js            # Matches API (league-aware)
│       ├── coaches.js            # Coaches API (league-aware)
│       └── content.js            # Content API (league-aware)
├── docs/                         # Documentation
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sportsup99
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   # Add your Cloudflare KV namespace bindings
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

---

## 🛠 Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Hooks**: State management

### Backend
- **Cloudflare Workers**: Serverless runtime
- **Cloudflare KV**: Key-value storage
- **RESTful API**: Standard API architecture

### Features
- **Real-time Updates**: WebSocket-like polling
- **Authentication**: JWT-based auth system
- **Responsive Design**: Mobile-first approach
- **SEO Optimized**: Server-side rendering

---

## 📡 API Endpoints

### Public Endpoints

| Endpoint | Method | Description | League Support |
|----------|--------|-------------|----------------|
| `/api/teams` | GET | Get all teams | ✅ `?league=ipl\|wpl` |
| `/api/players` | GET | Get all players | ✅ `?league=ipl\|wpl` |
| `/api/matches` | GET | Get all matches | ✅ `?league=ipl\|wpl` |
| `/api/coaches` | GET | Get coaching staff | ✅ `?league=ipl\|wpl` |
| `/api/content` | GET | Get news/content | ✅ `?league=ipl\|wpl` |
| `/api/live-score` | GET | Get live match data | - |
| `/api/settings` | GET | Get app settings | - |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/*` | Various | Admin management endpoints |
| `/api/auth` | POST | Authentication |

---

## 🚢 Deployment

### Cloudflare Pages

1. **Connect repository** to Cloudflare Pages
2. **Configure build settings**:
   - Build command: `npm run build`
   - Output directory: `out`
   - Node version: `18.x`

3. **Set environment variables** in Cloudflare dashboard

4. **Deploy**: Push to main branch triggers automatic deployment

### Environment Variables

```env
ENVIRONMENT=production
CLOUDFLARE_KV_NAMESPACE=your-kv-namespace
```

---

## 🎨 Design System

### Color Schemes

**IPL Theme:**
- Primary: Blue (`#3B82F6`) to Cyan (`#06B6D4`)
- Accent: Indigo (`#6366F1`)
- Background: Slate (`#0F172A`)

**WPL Theme:**
- Primary: Purple (`#9333EA`) to Pink (`#EC4899`)
- Accent: Rose (`#F43F5E`)
- Background: Slate (`#0F172A`)

### Typography
- Headings: Inter (Black weight)
- Body: System font stack
- Code: JetBrains Mono

### Components
- Glassmorphism cards with backdrop blur
- Gradient text effects
- Smooth hover animations
- Responsive grid layouts

---

## 📝 Key Files Modified

### Recent Changes

1. **`src/app/page.tsx`**: Main home page redesign
2. **`src/app/ipl/page.tsx`**: IPL home page with premium UI
3. **`src/app/wpl/page.tsx`**: WPL home page with premium UI
4. **`src/components/layout/LeagueSwitcher.tsx`**: League toggle component
5. **`src/contexts/LeagueContext.tsx`**: League state management
6. **`src/lib/data.ts`**: API client with league support
7. **`functions/api/teams.js`**: Teams API with league filtering
8. **`functions/api/players.js`**: Players API with league filtering
9. **`functions/api/matches.js`**: Matches API with league filtering
10. **`functions/api/coaches.js`**: Coaches API with league filtering
11. **`functions/api/content.js`**: Content API with league filtering

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Support

For issues, questions, or contributions, please contact the development team.

---

## 🎉 Acknowledgments

- Built with Next.js and Cloudflare
- Design inspiration from modern cricket websites
- Icons from Lucide React
- Animations powered by Framer Motion

---

**Last Updated**: November 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready

