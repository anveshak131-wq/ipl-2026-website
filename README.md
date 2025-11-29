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

