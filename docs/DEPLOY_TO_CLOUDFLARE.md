# Deploy to Cloudflare - Quick Guide 🚀

## ⚡ 5-Minute Deployment

### Step 1: Install Wrangler (1 min)
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare (1 min)
```bash
wrangler login
```
Browser will open - authorize and return to terminal

### Step 3: Create KV Namespaces (1 min)
```bash
wrangler kv:namespace create "IPL_CACHE"
wrangler kv:namespace create "IPL_CACHE" --preview
```

Copy the output IDs

### Step 4: Update wrangler.toml (1 min)
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your_production_id_from_step_3"
preview_id = "your_preview_id_from_step_3"
```

### Step 5: Deploy (1 min)
```bash
npm run build
wrangler pages deploy ./out
```

**Done!** Your site is live! 🎉

---

## 📋 Deployment Checklist

- [ ] Wrangler installed
- [ ] Logged in to Cloudflare
- [ ] KV namespaces created
- [ ] wrangler.toml updated
- [ ] Build successful (`npm run build`)
- [ ] Deployed (`wrangler pages deploy ./out`)

---

## 🔗 Your Live Site

After deployment, you'll get a URL like:
```
https://your-project.pages.dev
```

### Access Points
- **Public Site**: `https://your-project.pages.dev`
- **Admin Panel**: `https://your-project.pages.dev/admin`
- **API**: `https://your-project.pages.dev/api/*`

---

## 🧪 Test Your Deployment

1. Visit your site
2. Go to admin panel (`/admin`)
3. Login with `admin` / `admin123`
4. Add a match/team/player
5. Refresh page
6. **Data should still be there!** ✅

---

## 📊 Monitor Your Site

### Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to Pages
4. Click your project
5. View analytics and logs

### KV Storage
1. Dashboard → Workers → KV
2. Click your namespace
3. See all stored data
4. Monitor read/write operations

---

## 🔄 Update Your Site

After making changes:

```bash
# Build
npm run build

# Deploy
wrangler pages deploy ./out
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
rm -rf .next
npm install
npm run build
```

### Deployment Fails
```bash
wrangler logout
wrangler login
wrangler pages deploy ./out
```

### Data Not Persisting
- Check KV namespace in Cloudflare Dashboard
- Verify namespace ID in wrangler.toml
- Check browser console for errors

### Can't Login to Admin
- Clear browser cache
- Try incognito/private window
- Check localStorage in DevTools

---

## 📈 Performance Tips

1. **Enable Caching**: Cloudflare automatically caches
2. **Monitor KV**: Check usage in dashboard
3. **Optimize Images**: Use next/image component
4. **Enable Compression**: Cloudflare does this automatically

---

## 🔐 Security Checklist

- [ ] Change admin password (in `src/lib/auth.ts`)
- [ ] Set strong JWT_SECRET (in `.env`)
- [ ] Enable HTTPS (automatic with Cloudflare)
- [ ] Set up rate limiting (optional)
- [ ] Enable security headers (optional)

---

## 💰 Pricing

### Cloudflare Pages
- **Free**: Unlimited deployments, 500 builds/month
- **Pro**: $20/month, unlimited builds

### Cloudflare KV
- **Free**: 100,000 reads/day, 1,000 writes/day
- **Paid**: $0.50 per million reads, $5 per million writes

---

## 📞 Support

- [Cloudflare Status](https://www.cloudflarestatus.com)
- [Cloudflare Community](https://community.cloudflare.com)
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## ✅ You're Live!

Your IPL 2026 website is now deployed on Cloudflare with:
- ✅ Global edge caching
- ✅ Persistent KV storage
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Fast performance

**Congratulations!** 🎉

---

## 🎯 Next Steps

1. **Share your site**: Send the URL to others
2. **Monitor performance**: Check Cloudflare dashboard
3. **Add more data**: Use admin panel to add content
4. **Customize domain**: Add custom domain in Cloudflare
5. **Set up analytics**: Enable Cloudflare Analytics

---

## 📚 Additional Resources

- `CLOUDFLARE_KV_SETUP.md` - Detailed KV setup
- `DEPLOYMENT.md` - Full deployment guide
- `QUICK_START.md` - Quick start guide
- `PROJECT_GUIDE.md` - Complete project guide

---

**Happy deploying!** 🚀
