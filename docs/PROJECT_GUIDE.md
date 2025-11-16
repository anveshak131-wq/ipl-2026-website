# IPL 2026 Website - Complete Project Guide

## 📖 Overview

This is a full-stack IPL 2026 website built with Next.js 15, featuring:
- **Public Website**: Home, Matches, Teams, News, AI Predictions
- **Admin Panel**: Manage matches, teams, players, content, and settings
- **AI Integration**: AI-powered match predictions (placeholder)
- **Responsive Design**: Mobile-first, fully responsive UI
- **Modern Stack**: Next.js, TypeScript, Tailwind CSS, Cloudflare

## 🎯 Features Implemented

### ✅ Public Website

#### Home Page (`/`)
- Hero section with IPL branding
- Upcoming matches carousel
- Latest news feed
- Call-to-action buttons

#### Match Schedule (`/matches`)
- List all matches with filtering (upcoming, live, completed)
- Match details: date, time, venue, teams
- Live score display (placeholder)
- Pagination support

#### Teams Page (`/teams`)
- Display all 10 IPL teams
- Team cards with logos and descriptions
- **Player Modal**: Click on team to view players
  - Frosted glass blur effect on background
  - Player details: name, role, stats, bio
  - Player photo and statistics

#### News Page (`/news`)
- News articles with categories (match, team, player, general)
- Search functionality
- Category filtering
- Article cards with images and summaries

#### AI Predictions Page (`/predictions`)
- Match selection sidebar
- Win probability visualization
- Predicted winner with confidence score
- Key factors analysis
- AI-generated match analysis

### ✅ Admin Panel

#### Admin Login (`/admin`)
- JWT-based authentication
- Secure credential validation
- Token storage in localStorage

#### Dashboard (`/admin/dashboard`)
- Overview statistics
- Quick action buttons
- Recent activity feed
- Navigation to all admin sections

#### Manage Matches (`/admin/matches`)
- View all matches in table format
- Add new matches
- Edit existing matches
- Delete matches
- Status indicators (upcoming, live, completed)

#### Manage Teams (`/admin/teams`)
- Team cards with color preview
- Add new teams
- Edit team information
- Delete teams
- Color picker for team branding

#### Manage Players (`/admin/players`)
- Player table with all details
- Add new players
- Edit player information
- Delete players
- Player statistics form
- Team assignment

#### Manage Content (`/admin/content`)
- Content management (banners, highlights, news)
- Add/edit/delete content
- Publish/unpublish content
- Content type filtering
- Image preview

#### Settings (`/admin/settings`)
- General site settings
- AI settings (enable/disable predictions)
- Upload size configuration
- Notification preferences
- Maintenance mode toggle
- Danger zone (cache clear, database reset)

### ✅ API Endpoints

#### Public Endpoints
- `GET /api/matches` - Fetch all matches
- `GET /api/teams` - Fetch all teams
- `GET /api/players?teamId=<id>` - Fetch players
- `GET /api/news?category=<type>` - Fetch news
- `GET /api/content?type=<type>` - Fetch content
- `GET /api/predictions?matchId=<id>` - Fetch predictions

#### Admin Endpoints (Protected)
- `POST /api/matches` - Create match
- `PUT /api/matches` - Update match
- `DELETE /api/matches?id=<id>` - Delete match
- `POST /api/teams` - Create team
- `PUT /api/teams` - Update team
- `DELETE /api/teams?id=<id>` - Delete team
- `POST /api/players` - Create player
- `PUT /api/players` - Update player
- `DELETE /api/players?id=<id>` - Delete player
- `POST /api/content` - Create content
- `PUT /api/content` - Update content
- `DELETE /api/content?id=<id>` - Delete content
- `POST /api/admin/login` - Admin login

## 🎨 Design System

### Color Scheme
- **Primary**: Purple (`#6B46C1`)
- **Secondary**: Gold (`#FFD700`)
- **Dark Background**: `#1a1a2e`
- **Light Text**: White with opacity

### Components

#### Reusable Components
- `Navbar` - Navigation bar with mobile menu
- `Footer` - Footer with links
- `TeamCard` - Team display card
- `PlayerModal` - Player details modal with blur effect
- `MatchCard` - Match information card
- `LoadingSpinner` - Loading indicator
- `AdminSidebar` - Admin navigation
- `ProtectedRoute` - Route protection wrapper

#### Styling
- Tailwind CSS for utility-first styling
- Glass-effect class for frosted glass UI
- Frosted-glass class for modal overlays
- IPL gradient for buttons and accents
- Smooth transitions and animations

## 🔐 Authentication & Security

### JWT Implementation
- Token generation on login
- Token validation on protected routes
- 24-hour token expiration
- Secure password hashing with bcryptjs

### Protected Routes
- Admin pages check for valid token
- Redirect to login if unauthorized
- Token stored in localStorage

### Environment Variables
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=hashed_password
JWT_SECRET=your_secret_key
DATABASE_URL=cloudflare_d1_url
KV_NAMESPACE_ID=cloudflare_kv_id
```

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Hamburger menu on mobile
- Touch-friendly buttons
- Optimized images
- Responsive grid layouts

## 🚀 Performance Optimizations

### Next.js Features
- Server-side rendering (SSR)
- Static generation where possible
- Image optimization
- Code splitting
- Lazy loading

### Cloudflare Integration
- Edge caching
- Global CDN
- Automatic compression
- DDoS protection

## 📊 Data Structure

### Teams
```typescript
{
  id: string;
  name: string;
  shortName: string;
  logo: string;
  description: string;
  colors: { primary: string; secondary: string };
  players: Player[];
}
```

### Players
```typescript
{
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  teamId: string;
  age: number;
  nationality: string;
  photo: string;
  stats: {
    matches: number;
    runs: number;
    wickets: number;
    average: number;
    strikeRate: number;
    economy: number;
  };
  bio: string;
}
```

### Matches
```typescript
{
  id: string;
  date: string;
  time: string;
  venue: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'completed';
  result?: string;
  score?: {
    team1: { runs: number; wickets: number; overs: number };
    team2: { runs: number; wickets: number; overs: number };
  };
}
```

## 🔄 Workflow

### Adding a New Match
1. Go to Admin Dashboard
2. Click "Add Match" or navigate to Manage Matches
3. Fill in match details (date, time, venue, teams)
4. Submit form
5. Match appears on public schedule

### Adding a Player
1. Go to Admin Dashboard
2. Click "Add Player" or navigate to Manage Players
3. Fill in player details (name, role, team, stats)
4. Upload player photo
5. Submit form
6. Player appears on team page

### Publishing News
1. Go to Admin Dashboard
2. Click "Add News" or navigate to Manage Content
3. Fill in news details (title, content, category)
4. Upload news image
5. Publish
6. News appears on public news page

## 🧪 Testing

### Manual Testing Checklist
- [ ] Home page loads correctly
- [ ] Navigation works on all pages
- [ ] Matches page filters work
- [ ] Teams page displays all teams
- [ ] Player modal opens and closes
- [ ] News page search works
- [ ] Admin login works
- [ ] Admin can add/edit/delete items
- [ ] Mobile responsive design works
- [ ] All links are functional

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 📚 File Structure Reference

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── matches/page.tsx
│   │   ├── teams/page.tsx
│   │   ├── players/page.tsx
│   │   ├── content/page.tsx
│   │   ├── settings/page.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── matches/route.ts
│   │   ├── teams/route.ts
│   │   ├── players/route.ts
│   │   ├── content/route.ts
│   │   ├── news/route.ts
│   │   ├── predictions/route.ts
│   │   └── admin/login/route.ts
│   ├── matches/page.tsx
│   ├── teams/page.tsx
│   ├── news/page.tsx
│   ├── predictions/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── admin/
│   │   ├── AdminLogin.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── UpcomingMatches.tsx
│   │   └── NewsSection.tsx
│   ├── teams/
│   │   ├── TeamCard.tsx
│   │   ���── PlayerModal.tsx
│   ├── matches/
│   │   └── MatchCard.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/
│       └── LoadingSpinner.tsx
├── lib/
│   ├── auth.ts
│   └── data.ts
└── types/
    └── index.ts
```

## 🔗 Important Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Cloudflare KV](https://developers.cloudflare.com/kv)

## 🎓 Learning Resources

### Next.js
- App Router documentation
- API Routes
- Server Components
- Image Optimization

### Tailwind CSS
- Utility-first CSS
- Responsive design
- Custom components
- Dark mode

### TypeScript
- Type definitions
- Interfaces
- Generics
- Type safety

## 🐛 Known Issues & TODOs

### Backend Integration
- [ ] Connect to Cloudflare D1 database
- [ ] Implement real JWT validation
- [ ] Add database migrations
- [ ] Set up error logging

### AI Features
- [ ] Integrate OpenAI/Claude API
- [ ] Implement prediction caching
- [ ] Add confidence scoring
- [ ] Create prediction history

### Frontend
- [ ] Add real-time updates
- [ ] Implement image optimization
- [ ] Add PWA support
- [ ] Improve accessibility (WCAG)

### Testing
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Performance testing

## 💡 Tips & Best Practices

1. **Always use TypeScript** for type safety
2. **Keep components small** and reusable
3. **Use Tailwind utilities** instead of custom CSS
4. **Validate all inputs** on both client and server
5. **Handle errors gracefully** with user feedback
6. **Test on mobile** before deployment
7. **Use environment variables** for sensitive data
8. **Comment complex logic** for maintainability

## 🚀 Next Steps

1. **Database Setup**: Connect to Cloudflare D1
2. **API Integration**: Replace mock data with real API calls
3. **AI Integration**: Connect to OpenAI/Claude
4. **Testing**: Add comprehensive test suite
5. **Deployment**: Deploy to Cloudflare Pages
6. **Monitoring**: Set up analytics and error tracking
7. **Optimization**: Performance and SEO optimization

---

**Last Updated**: 2024
**Version**: 1.0.0
