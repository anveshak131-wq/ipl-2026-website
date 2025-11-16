# ADMIN README - CONFIDENTIAL

**⚠️ SENSITIVE INFORMATION - KEEP THIS FILE PRIVATE AND OUT OF VERSION CONTROL**

This document contains admin credentials, deployment information, and internal setup instructions. **NEVER** commit this to version control or share publicly.

## 🔐 Access Control

- This file should be stored in a secure location (password manager, secure note, etc.)
- Add `ADMIN_README.md` to `.gitignore`
- Only share with authorized team members

## 🔑 Admin Credentials

### Login Portal
- **URL**: `/admin` or `https://your-domain.com/admin`
- **Username**: Contact your project manager for credentials
- **Password**: Contact your project manager for credentials

### Admin Login API
- **Endpoint**: `POST /api/admin/login`
- **Location**: `functions/api/admin/login.js`

### Session Management
- Sessions stored in browser localStorage with key: `adminToken`
- Token expiration: 24 hours (configurable)
- Automatic redirect to login if token expires

## ☁️ Cloudflare Configuration

### Deployment Settings
- **Platform**: Cloudflare Pages
- **Build Command**: `npm run build`
- **Build Output**: `.next` directory
- **Environment**: Production

### KV (Key-Value) Storage Binding
- **Database Name**: `IPL_CACHE`
- **Namespace ID**: [Available in Cloudflare Dashboard]
- **Account ID**: [Available in Cloudflare Dashboard]

### Environment Variables (.env.local & Cloudflare)
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
IPL_CACHE_NAMESPACE_ID=your_namespace_id
```

**How to Set:**
1. In Cloudflare Dashboard → Pages → Your Project → Settings
2. Add environment variables under "Build settings" → "Environment variables"
3. Separate dev and production environments if needed

## 📊 Database Management

### Data Structure (KV Storage)
- **Key**: `players` → JSON array of player objects
- **Key**: `teams` → JSON array of team objects
- **Key**: `matches` → JSON array of match objects
- **Key**: `content` → JSON array of content objects

### Backup Data
All data is automatically backed up in Cloudflare KV. To manually export:

```bash
# Export all data
npx wrangler kv:key list --binding=IPL_CACHE

# Get specific key
npx wrangler kv:key get players --binding=IPL_CACHE
```

### Restore Data
```bash
# Put key-value pair
npx wrangler kv:key put players "$DATA" --binding=IPL_CACHE
```

## 🚀 Deployment Process

### Deploy to Cloudflare Pages
```bash
# 1. Build locally
npm run build

# 2. Push to Git (main branch auto-deploys)
git add .
git commit -m "Deployment: [description]"
git push origin main

# 3. Cloudflare automatically:
#    - Builds the project
#    - Runs tests
#    - Deploys to production
```

### Monitor Deployments
1. Cloudflare Dashboard → Pages → Your Project → Deployments
2. View build logs and deployment status
3. Rollback to previous deployment if needed

### Custom Domain Setup
- Domain configured in Cloudflare DNS
- SSL/TLS certificate automatically managed
- CNAME record points to Cloudflare Pages

## 🔒 Security Practices

### Authentication
- All admin endpoints require valid session token
- Token validated in `lib/auth.ts`
- Protected routes use `ProtectedRoute` component

### Password Policy
- Admin passwords should be strong (12+ characters)
- Include uppercase, lowercase, numbers, symbols
- Change passwords every 90 days

### Access Logging
- All admin actions logged in Cloudflare logs
- Check activity in Cloudflare Dashboard → Analytics

### Rate Limiting
- Login attempts limited to 5 per minute per IP
- API endpoints rate-limited to prevent abuse
- Configure in Cloudflare firewall rules

## 🛠 Maintenance Tasks

### Monthly Tasks
- [ ] Review admin access logs
- [ ] Verify all data backups
- [ ] Check Cloudflare uptime/performance
- [ ] Update dependencies: `npm update`

### Quarterly Tasks
- [ ] Security audit of admin panel
- [ ] Review and rotate credentials
- [ ] Performance optimization review
- [ ] Backup migration test

### Annual Tasks
- [ ] Full security assessment
- [ ] Disaster recovery drill
- [ ] Update documentation
- [ ] License compliance check

## 🐛 Troubleshooting Admin Issues

### Admin Page Not Loading
1. Clear browser cache and localStorage
2. Check Cloudflare Pages build status
3. Verify environment variables are set
4. Check browser console for errors

### Login Not Working
1. Verify correct credentials
2. Check browser cookie/localStorage settings
3. Ensure token has not expired
4. Clear browser data and try again

### Data Not Saving
1. Check Cloudflare KV binding status
2. Verify API endpoint responses in browser DevTools
3. Check Cloudflare dashboard for errors
4. Review function logs: Cloudflare Dashboard → Pages → Functions

### Performance Issues
1. Monitor Cloudflare analytics dashboard
2. Check for excessive API calls
3. Optimize image sizes
4. Review database query performance

## 📞 Support Contacts

### Internal Team
- **Project Lead**: [Name] - [Email]
- **DevOps**: [Name] - [Email]
- **QA**: [Name] - [Email]

### External Vendors
- **Cloudflare Support**: https://dash.cloudflare.com/help
- **Next.js Documentation**: https://nextjs.org/docs
- **GitHub Issues**: [Repository URL]

## 📋 Checklist for New Admin Users

- [ ] Received login credentials
- [ ] Logged into admin panel successfully
- [ ] Reviewed admin capabilities
- [ ] Understood data privacy requirements
- [ ] Signed NDA/confidentiality agreement
- [ ] Added to internal communication channels
- [ ] Reviewed this file and security practices
- [ ] Confirmed ability to contact support

## 🔄 Change Log

### v2.5.0 (November 14, 2025)
- Added Date of Birth management for players
- Updated player form with DOB input validation
- Implemented age auto-calculation logic

### v2.4.0 (Previous)
- White font standardization
- Background brightness improvements
- Role-specific metrics display

## ⚠️ Critical Alerts

**If any of these occur, immediately contact the DevOps team:**
- Unauthorized login attempts detected
- Data corruption or loss
- Performance degradation > 50%
- SSL certificate expiration notice
- Cloudflare service interruption
- Suspicious database access patterns

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2025  
**Classification**: CONFIDENTIAL - INTERNAL USE ONLY  
**Next Review Date**: November 14, 2026

**Remember**: This document must remain private and secure. Never commit to version control!
