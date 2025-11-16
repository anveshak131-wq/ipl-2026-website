# IPL 2026 Website - Quick Start Guide ⚡

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
```
http://localhost:3000
```

---

## 🔐 Admin Login

**URL**: http://localhost:3000/admin

**Credentials**:
- Username: `admin`
- Password: `admin123`

---

## 📍 Quick Navigation

### Public Pages
- **Home**: http://localhost:3000
- **Matches**: http://localhost:3000/matches
- **Teams**: http://localhost:3000/teams
- **News**: http://localhost:3000/news
- **Predictions**: http://localhost:3000/predictions

### Admin Pages
- **Login**: http://localhost:3000/admin
- **Dashboard**: http://localhost:3000/admin/dashboard
- **Manage Matches**: http://localhost:3000/admin/matches
- **Manage Teams**: http://localhost:3000/admin/teams
- **Manage Players**: http://localhost:3000/admin/players
- **Manage Content**: http://localhost:3000/admin/content
- **Settings**: http://localhost:3000/admin/settings

---

## 📝 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Utilities
npm install              # Install dependencies
npm update               # Update dependencies
npm audit                # Check for vulnerabilities
```

---

## 🎯 What to Try First

### 1. Explore the Public Website
- [ ] Visit home page
- [ ] Check matches schedule
- [ ] Browse teams and click on a team to see players
- [ ] Read news articles
- [ ] View AI predictions

### 2. Test Admin Panel
- [ ] Login with admin credentials
- [ ] View dashboard
- [ ] Add a new match
- [ ] Add a new player
- [ ] Create news content
- [ ] Check settings

### 3. Test Responsive Design
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar
- [ ] Test on mobile, tablet, desktop
- [ ] Check hamburger menu on mobile

---

## 🔧 Configuration

### Environment Variables
Create `.env.local` file:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$YourHashedPasswordHere
JWT_SECRET=your_super_secret_jwt_key
```

### Change Admin Password
Edit `src/lib/auth.ts`:
```typescript
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'your_new_password'
};
```

---

## 📂 Project Structure

```
src/
├── app/                 # Pages and API routes
├── components/          # React components
├── lib/                 # Utilities and data
├── types/               # TypeScript types
└── styles/              # Global styles
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

### Clear Cache
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Build Errors
```bash
npm run build
```

---

## 📚 Documentation

- **SETUP.md** - Detailed setup guide
- **DEPLOYMENT.md** - Deployment instructions
- **PROJECT_GUIDE.md** - Complete project guide
- **FEATURES_COMPLETED.md** - All completed features

---

## ✨ Key Features

✅ 10 IPL Teams with players
✅ Match scheduling
✅ News management
✅ AI predictions
✅ Admin panel
✅ JWT authentication
✅ Responsive design
✅ Glass-effect UI
✅ Dark theme
✅ Mobile-friendly

---

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Cloudflare Pages](https://pages.cloudflare.com)

---

## 💡 Tips

1. **Hot Reload**: Changes are automatically reflected in the browser
2. **TypeScript**: Full type safety with IntelliSense
3. **Tailwind**: Use utility classes for styling
4. **Components**: Keep components small and reusable
5. **API Routes**: Use `/api` routes for backend logic

---

## 🚀 Ready to Deploy?

See **DEPLOYMENT.md** for:
- Building for production
- Deploying to Cloudflare Pages
- Setting up database
- Configuring environment variables

---

## 📞 Need Help?

1. Check the documentation files
2. Review code comments
3. Check browser console for errors
4. Check server logs in terminal

---

**Happy Coding! 🎉**
