# Quick Setup: Make Repository Private

## Fastest Solution (Recommended)

The easiest way to hide admin files from public view is to make your GitHub repository private.

### Steps:

1. **Go to Repository Settings:**
   ```
   https://github.com/anveshak131-wq/ipl-2026-website/settings
   ```

2. **Scroll to "Danger Zone"** (at the bottom)

3. **Click "Change visibility"**

4. **Select "Make private"**

5. **Type your repository name to confirm**

6. **Click "I understand, change repository visibility"**

### ✅ Done!

Your repository is now private. Only you and collaborators you invite can see the code.

### Cloudflare Access:

- Cloudflare Pages can still access private repositories
- Make sure your GitHub account is connected to Cloudflare
- Cloudflare will automatically have read access

### Adding Collaborators:

1. Go to repository Settings → Collaborators
2. Click "Add people"
3. Enter GitHub username or email
4. Choose permission level (usually "Write" for team members)

---

## Alternative: Private Branch (If you want to keep main public)

If you want to keep the main branch public but hide admin code:

```bash
# Run the setup script
./scripts/setup-private-admin-branch.sh

# Or manually:
git checkout -b admin-private
# Your admin code stays here
git checkout main
# Remove admin from main if needed
```

Then configure Cloudflare to deploy from the `admin-private` branch.

---

## Security Headers Added

I've also added security headers to `next.config.js` that:
- Prevent search engines from indexing admin pages
- Add security headers to admin routes
- Protect against common attacks

These headers work regardless of whether your repo is public or private.

---

## Need Help?

See `docs/ADMIN_SECURITY_GUIDE.md` for detailed options and explanations.

