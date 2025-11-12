# IPL 2026 Website - Setup Guide

## 🎯 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
```
http://localhost:3000
```

### 4. Access Admin Panel
```
http://localhost:3000/admin
Username: admin
Password: admin123
```

---

## 📋 Detailed Setup

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- Git
- Cloudflare account (for deployment)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd sportsup99
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Environment Setup

Create `.env.local` file in root directory:
```env
# Admin Credentials (for development)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$YourHashedPasswordHere

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Cloudflare Configuration (optional for local development)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ZONE_ID=your_zone_id

# Database Configuration (when using Cloudflare D1)
DATABASE_URL=your_d1_database_url

# KV Namespace (when using Cloudflare KV)
KV_NAMESPACE_ID=your_kv_namespace_id

# AI Service Keys (optional)
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

### Step 4: Run Development Server
```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Step 5: Test the Application

#### Public Pages
- Home: http://localhost:3000
- Matches: http://localhost:3000/matches
- Teams: http://localhost:3000/teams
- News: http://localhost:3000/news
- Predictions: http://localhost:3000/predictions

#### Admin Panel
- Login: http://localhost:3000/admin
- Dashboard: http://localhost:3000/admin/dashboard
- Manage Matches: http://localhost:3000/admin/matches
- Manage Teams: http://localhost:3000/admin/teams
- Manage Players: http://localhost:3000/admin/players
- Manage Content: http://localhost:3000/admin/content
- Settings: http://localhost:3000/admin/settings

---

## 🔐 Authentication Setup

### Default Admin Credentials
```
Username: admin
Password: admin123
```

### Change Admin Password (Development)

Edit `src/lib/auth.ts`:
```typescript
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'your_new_password' // Change this
};
```

### Generate Password Hash (Production)

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_password', 10))"
```

Then update `.env.local`:
```env
ADMIN_PASSWORD_HASH=your_hashed_password
```

---

## 🗄️ Database Setup (Optional)

### Using Cloudflare D1

#### 1. Create D1 Database
```bash
npm install -g wrangler
wrangler login
wrangler d1 create ipl-2026-db
```

#### 2. Initialize Schema
```bash
wrangler d1 execute ipl-2026-db --file=./schema.sql
```

#### 3. Update Configuration
Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "ipl-2026-db"
database_id = "your_database_id"
```

### Using Local SQLite (Development)

```bash
# Install sqlite3
npm install sqlite3

# Create database
sqlite3 ipl-2026.db < schema.sql
```

---

## 🚀 Build & Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Cloudflare Pages

#### Option 1: Using Wrangler
```bash
wrangler pages deploy ./out
```

#### Option 2: Using GitHub Integration
1. Push code to GitHub
2. Go to Cloudflare Dashboard
3. Pages → Create project → Connect to Git
4. Select repository
5. Configure build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Build output: `.next`

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Build Check
```bash
npm run build
```

### Lint Check
```bash
npm run lint
```

---

## 📁 Project Structure

```
sportsup99/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── public/                  # Static assets
├── .env.local              # Environment variables (local)
├── .env.production         # Environment variables (production)
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── wrangler.toml           # Cloudflare Workers configuration
├── package.json            # Dependencies
└── README.md               # Project documentation
```

---

## 🔧 Configuration Files

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'],
  },
};

module.exports = nextConfig;
```

### tailwind.config.js
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ipl-purple': '#6B46C1',
        'ipl-gold': '#FFD700',
      },
    },
  },
  plugins: [],
};
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Authentication Issues
```bash
# Clear browser storage
# Open DevTools → Application → Local Storage → Clear All

# Or in console:
localStorage.clear()
```

### Database Connection Error
- Verify DATABASE_URL in .env.local
- Check Cloudflare D1 database is created
- Ensure database credentials are correct

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database
wrangler d1 list         # List D1 databases
wrangler d1 execute      # Execute SQL query
wrangler d1 backup       # Backup database

# Deployment
wrangler pages deploy    # Deploy to Cloudflare Pages
wrangler publish         # Publish Workers

# Utilities
npm install              # Install dependencies
npm update               # Update dependencies
npm audit                # Check for vulnerabilities
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable database encryption
- [ ] Set up monitoring and logging

---

## 📞 Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Cloudflare Docs](https://developers.cloudflare.com)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Tailwind CSS Discord](https://discord.gg/tailwindcss)
- [Cloudflare Community](https://community.cloudflare.com)

### Troubleshooting
- Check browser console for errors
- Check server logs: `npm run dev` output
- Check network tab in DevTools
- Review error messages carefully

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Dev server runs without errors
- [ ] Home page loads correctly
- [ ] Navigation works
- [ ] Admin login works
- [ ] Can add/edit/delete items in admin
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] Build completes successfully

---

## 🎉 You're Ready!

Your IPL 2026 website is now set up and ready for development. Start by:

1. Exploring the codebase
2. Customizing the design
3. Adding your own data
4. Integrating with Cloudflare services
5. Deploying to production

Happy coding! 🚀
