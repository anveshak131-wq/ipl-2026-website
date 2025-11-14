# IPL 2026 Website

A modern, feature-rich web application for IPL 2026 with player profiles, match schedules, team information, and more. Built with Next.js, TypeScript, and Tailwind CSS.

## 🎯 Features

### Public Features (End Users)
- **Team Pages**: Explore detailed team information with player profiles and statistics
- **Player Profiles**: View player information including:
  - Date of Birth (DOB) with auto-calculated age (auto-increments on birthday)
  - Career statistics (runs, wickets, batting/bowling averages)
  - Role-specific performance metrics
  - Playing styles and nationality
  - Captain and foreign player badges
- **Matches**: View upcoming, live, and completed match schedules
- **News Section**: Latest IPL news and updates
- **Predictions**: Match predictions and analytics
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Admin Panel Features
- **Player Management**: Add, edit, and delete players with DOB tracking
- **Team Management**: Manage team information and colors
- **Match Management**: Create and update match schedules
- **Content Management**: Manage news and highlights
- **Settings**: Configure system settings
- **Admin Dashboard**: Overview of all activities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
npm run build
npm run start
```

## 📋 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── matches/           # Match pages
│   ├── news/              # News pages
│   ├── teams/             # Team and player detail pages
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── admin/            # Admin components
│   ├── home/             # Home page components
│   ├── layout/           # Layout components (Navbar, Footer)
│   ├── matches/          # Match components
│   ├── teams/            # Team and player components
│   └── ui/               # UI components
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── colorUtils.ts     # Color manipulation utilities
│   ├── data.ts           # Data fetching functions
│   ├── dateUtils.ts      # Date and age calculation utilities
│   ├── kv.ts             # Cloudflare KV storage utilities
│   └── logoUtils.ts      # Logo path utilities
├── types/                # TypeScript type definitions
└── public/              # Static assets (logos, icons)

functions/api/          # Cloudflare Pages Functions (serverless API)
├── content.js
├── matches.js
├── players.js
├── teams.js
└── admin/
    └── login.js
```

## 🛠 Tech Stack

- **Framework**: Next.js 14.2.33
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Storage**: Cloudflare KV (production)
- **Deployment**: Cloudflare Pages
- **UI Components**: Custom React components with smooth animations

## 📦 Key Dependencies

- `next`: React framework
- `react`: UI library
- `typescript`: Type safety
- `tailwindcss`: Utility-first CSS
- `wrangler`: Cloudflare CLI tool

## 🎨 Design Features

- **Team-Specific Theming**: Each team has custom primary and secondary colors
- **Smooth Animations**: Fade-in, slide-up, and floating animations
- **Glass-morphism Effects**: Modern frosted glass aesthetic
- **Gradient Backgrounds**: Dynamic gradient overlays with team colors
- **Responsive Grid Layouts**: Adapts to different screen sizes
- **Dark Theme**: Premium dark interface with gold accents

## �� Recent Updates (November 2025)

### Date of Birth & Age Management (v2.5.0)
- ✅ Added optional `dateOfBirth` field to Player type
- ✅ DOB stored in ISO format (YYYY-MM-DD) internally
- ✅ Admin input in user-friendly DD/MM/YYYY format
- ✅ Age auto-calculates from DOB and auto-increments on birthday
- ✅ Age-only entry supported for players without DOB
- ✅ DOB visible on player profiles for end users
- ✅ DOB column in admin players table for management
- ✅ New date utility functions: `calculateAge()`, `formatDateDDMMYYYY()`, `parseDateDDMMYYYY()`, `isValidDate()`
- ✅ Form validation for DD/MM/YYYY date format
- ✅ Backward compatible - age field still works independently

### UI/UX Improvements (Previous Updates - v2.0-2.4)
- ✅ White font standardization across all team pages
- ✅ Brightened backgrounds (gray-950/900 gradients)
- ✅ Role-specific performance metrics display (bowlers, batsmen, all-rounders)
- ✅ Playing style highlighting based on player role
- ✅ Team-specific color theming on all pages
- ✅ Enhanced player modals with detailed information
- ✅ Fixed JavaScript errors in hero section (parallax effects)
- ✅ Mobile-responsive design improvements

## 📱 Responsive Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

## ♻️ Development Workflow

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Data Not Loading
- Check Cloudflare KV binding configuration
- Verify environment variables in `.env.local`

### Styling Issues
- Rebuild Tailwind CSS: `npm run dev`
- Check for conflicting CSS classes

## 📝 API Endpoints

All API endpoints are located in `functions/api/`:

- `GET /api/players` - Fetch all players
- `POST /api/players` - Create new player (requires auth)
- `PUT /api/players` - Update player (requires auth)
- `DELETE /api/players` - Delete player (requires auth)
- `GET /api/teams` - Fetch all teams
- `GET /api/matches` - Fetch all matches
- `GET /api/content` - Fetch content

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- Components are reusable and well-documented
- Styling uses Tailwind CSS classes
- All new features include proper type definitions
- Build passes without errors: `npm run build`

## 📄 License

This project is part of the IPL 2026 platform. All rights reserved.

## 📞 Support

For technical issues or feature requests, please create an issue in the repository or contact the development team.

---

**Last Updated**: November 14, 2025  
**Version**: 2.5.0  
**Status**: Production Ready
