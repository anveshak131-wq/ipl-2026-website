# Email Troubleshooting Guide

## Issue: Emails not sending / Getting SendGrid errors when using Resend

### Problem
You're getting SendGrid errors like:
```
"The from address does not match a verified Sender Identity"
```

But you've configured Resend API key.

### Solution

1. **Check Cloudflare Pages Environment Variables**
   - Go to: Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables
   - Verify `RESEND_API_KEY` is set:
     - Variable name: `RESEND_API_KEY`
     - Value should start with `re_` (e.g., `re_xxxxxxxxxxxxx`)
   - **Important**: Make sure there are no extra spaces or quotes around the value
   - **Remove any SendGrid API keys** if you want to use Resend only:
     - Delete `SENDGRID_API_KEY` if it exists

2. **Redeploy After Setting Environment Variables**
   - After adding/updating environment variables, you MUST redeploy
   - Cloudflare Pages → Deployments → Create deployment

3. **Verify API Key Format**
   - Resend API keys start with `re_`
   - Example: `re_1234567890abcdef`
   - Make sure the entire key is copied correctly

4. **Check Cloudflare Pages Logs**
   - Go to: Workers & Pages → Your Project → Logs
   - Look for `[Email Service]` messages to see which provider is being used
   - You should see: `[Email Service] Using Resend API`

5. **From Address**
   - By default, emails are sent from `onboarding@resend.dev` (works without domain verification)
   - To use your own domain:
     - Verify your domain in Resend dashboard
     - Add environment variable: `RESEND_FROM_ADDRESS = "SportsUP <noreply@yourdomain.com>"`

## Common Issues

### Issue 1: "Email service not configured"
**Solution**: Set `RESEND_API_KEY` in Cloudflare Pages environment variables

### Issue 2: SendGrid errors when Resend is configured
**Solution**: 
- Remove `SENDGRID_API_KEY` from environment variables
- Make sure `RESEND_API_KEY` is set correctly
- Redeploy

### Issue 3: "The from address does not match a verified Sender Identity"
**Solution**:
- This is a SendGrid error, not Resend
- Remove SendGrid API key
- Or verify your domain in SendGrid and use a verified from address

### Issue 4: Resend API errors
**Solution**:
- Check API key is valid and active in Resend dashboard
- Make sure you're using the correct API key (production vs test)
- Check Resend account limits/quotas

## Testing

1. **Send a test email** from Email Notifications page
2. **Check browser console** for errors
3. **Check Cloudflare Pages logs** for detailed error messages
4. **Check email inbox** (and spam folder)

## Need Help?

- Check `docs/EMAIL_NOTIFICATIONS_SETUP.md` for setup instructions
- Review Cloudflare Pages logs for error details
- Verify API keys in Resend/SendGrid dashboards

