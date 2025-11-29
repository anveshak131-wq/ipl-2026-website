# Elastic Email Setup Guide

## Which Product to Choose? 📧

When signing up for Elastic Email, choose:

### ✅ **Email API** (This is what you need!)

**Features**:
- ✅ API Keys & SMTP relay
- ✅ RESTful API for sending emails
- ✅ Perfect for application integration
- ✅ Free tier: 100 emails/day

**This is the correct product for sending emails from your application.**

### ❌ Don't Choose:

- **Email Marketing** - For newsletters and campaigns (not what you need)
- **Creator Suite** - For link-in-bio and creative brands (not what you need)

## Sign Up Steps

1. Go to https://elasticemail.com
2. Click **"Sign Up"** or **"Get Started"**
3. Look for **"Email API"** product option
4. Sign up for the **Email API** product
5. Complete registration

## Get Your API Key

1. After signing up, go to **Settings** → **API Keys**
2. Click **"Create API Key"** or **"New API Key"**
3. Give it a name (e.g., "SportsUP Email Service")
4. Copy the API key (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. **Add to Cloudflare Pages Environment Variables**:
   - Variable name: `ELASTIC_EMAIL_API_KEY`
   - Value: Your API key (paste it here)
6. **Save and Redeploy**

## Free Tier Limits

- **100 emails per day** (free tier)
- Perfect for testing and small projects
- Upgrade options available if needed

## How It Works in Your System

The system automatically:
1. Tries Resend first
2. If Resend fails (domain verification needed), falls back to Elastic Email
3. Elastic Email sends the email successfully
4. **No domain verification needed!**

## Testing

1. Make sure `ELASTIC_EMAIL_API_KEY` is set in Cloudflare Pages
2. Try sending an email from Email Notifications page
3. Check logs - you should see: `[Email Service] Using Elastic Email API`
4. Email should be delivered successfully!

## Troubleshooting

### API Key Not Working?
- Make sure you signed up for **Email API** (not Email Marketing)
- Verify API key is correct in Cloudflare Pages
- Check Elastic Email dashboard for API key status

### Emails Not Sending?
- Check daily limit (100 emails/day on free tier)
- Verify API key is active in Elastic Email dashboard
- Check Cloudflare Pages logs for error messages

### Need More Emails?
- Upgrade plan in Elastic Email dashboard
- Or use multiple email services (Resend + Elastic Email)

## Summary

**Choose: Email API** ✅
- Get API key from Settings → API Keys
- Add to Cloudflare Pages as `ELASTIC_EMAIL_API_KEY`
- Redeploy
- Done! No domain needed.
