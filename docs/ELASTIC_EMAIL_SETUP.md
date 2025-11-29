# Elastic Email Setup guide

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

## Free Tier Limits & Limitations ⚠️

### Test Account Limitation

**IMPORTANT**: Elastic Email's free/test account has the same limitation as Resend:
- ❌ Can only send emails to your account owner email (the email you used to sign up)
- ✅ To send to **all recipients**, you need to **upgrade to a paid plan**

### Upgrade Options

1. **Go to Elastic Email Dashboard** → Billing/Pricing
2. **Choose a plan** (usually starts at $9-15/month)
3. **Upgrade your account**
4. After upgrade, you can send to any email address

### Alternative Solutions

If you don't want to pay, you can:

**Option 1: Use Resend with Domain Verification** (One-time domain cost: $0.88-$10/year)
- Buy a cheap domain (e.g., Namecheap: $0.88/year)
- Verify domain in Resend
- Send unlimited emails (within free tier limits)

**Option 2: Test with Account Owner Email**
- For testing: Send emails to your account owner email only
- For production: Upgrade Elastic Email or verify domain in Resend

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
