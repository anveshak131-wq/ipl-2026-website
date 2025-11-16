# IPL 2026 Website - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Cloudflare account
- Git

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 📋 Project Structure

```
src/
├── app/
│   ├── admin/              # Admin panel pages
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── matches/        # Manage matches
│   │   ├── teams/          # Manage teams
│   │   ├── players/        # Manage players
│   │   ├── content/        # Manage content
│   │   └── settings/       # System settings
│   ├── api/                # API routes
│   │   ├── matches/        # Match endpoints
│   │   ├── teams/          # Team endpoints
│   │   ├── players/        # Player endpoints
│   │   ├── content/        # Content endpoints
│   │   ├── news/           # News endpoints
│   │   ├── predictions/    # AI predictions
│   │   └── admin/login/    # Admin login
│   ├── matches/            # Public matches page
│   ├── teams/              # Public teams page
│   ├── news/               # Public news page
│   ├── predictions/        # AI predictions page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── admin/              # Admin components
│   ├── home/               # Home page components
│   ├── teams/              # Team components
│   ├── matches/            # Match components
│   ├── layout/             # Layout components
│   └── ui/                 # UI components
├── lib/
│   ├── auth.ts             # Authentication utilities
│   └── data.ts             # Mock data & API calls
└── types/
    └── index.ts            # TypeScript types
```

## 🔐 Authentication

### Admin Login
- Default credentials (for development):
  - Username: `admin`
  - Password: `admin123`

### JWT Token
- Tokens are stored in `localStorage` as `adminToken`
- Tokens expire after 24 hours
- Protected routes redirect to login if token is missing

## 🌐 Deployment to Cloudflare Pages

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy ./out
```

#### Option B: Using GitHub Integration
1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Create new project → Connect to Git
4. Select your repository
5. Configure build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`

### Step 3: Configure Environment Variables

Create a `.env.local` file:
```env
# Admin credentials (hash these in production)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_hashed_password

# JWT Secret
JWT_SECRET=your_super_secret_key_here

# Cloudflare D1 Database
DATABASE_URL=your_d1_database_url

# Cloudflare KV Namespace
KV_NAMESPACE_ID=your_kv_namespace_id

# AI Service (Optional)
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

## 🗄️ Database Setup (Cloudflare D1)

### Create D1 Database
```bash
wrangler d1 create ipl-2026-db
```

### Initialize Schema
```sql
-- Teams table
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shortName TEXT NOT NULL UNIQUE,
  logo TEXT,
  description TEXT,
  primaryColor TEXT,
  secondaryColor TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  teamId TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  photo TEXT,
  bio TEXT,
  matches INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  average REAL DEFAULT 0,
  strikeRate REAL DEFAULT 0,
  economy REAL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id)
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  team1Id TEXT NOT NULL,
  team2Id TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  result TEXT,
  team1Runs INTEGER,
  team1Wickets INTEGER,
  team1Overs REAL,
  team2Runs INTEGER,
  team2Wickets INTEGER,
  team2Overs REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team1Id) REFERENCES teams(id),
  FOREIGN KEY (team2Id) REFERENCES teams(id)
);

-- News table
CREATE TABLE news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  category TEXT DEFAULT 'general',
  publishedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  videoUrl TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔑 Cloudflare KV Setup

### Create KV Namespace
```bash
wrangler kv:namespace create "IPL_CACHE"
wrangler kv:namespace create "IPL_CACHE" --preview
```

### Usage
- Cache AI predictions
- Store session data
- Cache frequently accessed content

## 🤖 AI Integration

### OpenAI Integration
```typescript
// Example: Generate match predictions
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Predict the winner of IPL match between ${team1} and ${team2}`
    }]
  })
});
```

## 📊 Monitoring & Analytics

### Cloudflare Analytics
- Monitor page views and traffic
- Track API performance
- View error rates

### Custom Analytics
- Integrate Google Analytics
- Track user behavior
- Monitor admin panel usage

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for API endpoints
4. **Rate Limiting**: Implement rate limiting on API routes
5. **Input Validation**: Validate all user inputs
6. **SQL Injection**: Use parameterized queries
7. **XSS Protection**: Sanitize user-generated content

## 🚨 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues
- Verify D1 database URL
- Check environment variables
- Ensure database is initialized

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT secret matches
- Verify token expiration

## 📝 TODO Items

### Backend Integration
- [ ] Replace mock data with Cloudflare D1 queries
- [ ] Implement JWT token validation
- [ ] Add database migrations
- [ ] Set up error logging

### AI Features
- [ ] Integrate OpenAI/Claude API
- [ ] Implement prediction caching
- [ ] Add confidence scoring
- [ ] Create prediction history

### Admin Panel
- [ ] Add bulk import/export
- [ ] Implement audit logs
- [ ] Add user management
- [ ] Create backup system

### Frontend
- [ ] Add real-time updates (WebSocket)
- [ ] Implement image optimization
- [ ] Add PWA support
- [ ] Improve accessibility

### Testing
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Performance testing

## 📞 Support

For issues or questions:
1. Check the TODO comments in code
2. Review Cloudflare documentation
3. Check Next.js documentation
4. Open an issue on GitHub

## 📄 License

This project is licensed under the ISC License.
