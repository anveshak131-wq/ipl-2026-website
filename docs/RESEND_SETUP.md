# Resend Email Setup - Quick Guide

## ✅ You Have Resend API Key Configured

Your Cloudflare Pages shows `RESEND_API_KEY` is set. To ensure Resend is used (and not SendGrid):

## Step 1: Remove SendGrid API Key (Important!)

Since you're using Resend, you should remove `SENDGRID_API_KEY` to avoid conflicts:

1. Go to: Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables
2. Find `SENDGRID_API_KEY` in the list
3. Click the "Delete" or "Remove" button next to it
4. Confirm deletion

**Why?** Having both keys can cause confusion, and the system will prioritize Resend, but removing SendGrid ensures there's no fallback that might cause issues.

## Step 2: Verify Resend API Key

1. Go to your [Resend Dashboard](https://resend.com/api-keys)
2. Verify your API key is active and starts with `re_`
3. Copy the full API key

## Step 3: Update Cloudflare Pages Environment Variables

1. Go to: Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables
2. Verify `RESEND_API_KEY`:
   - Click on `RESEND_API_KEY` to view/edit (if needed)
   - Value should start with `re_`
   - No quotes or spaces around the value
   - Example: `re_1234567890abcdef`
   - If you need to update it, click "Edit" and paste your Resend API key

## Step 4: Verify Domain (REQUIRED for sending to all users) ⚠️

By default, emails will be sent from `onboarding@resend.dev` which works immediately.

To use your own domain:
1. Verify your domain in [Resend Domains](https://resend.com/domains)
2. Add environment variable:
   - Variable name: `RESEND_FROM_ADDRESS`
   - Value: `SportsUP <noreply@yourdomain.com>`

## Step 5: Redeploy (CRITICAL!)

**IMPORTANT**: After updating environment variables, you MUST redeploy:
1. Cloudflare Pages → Deployments
2. Click "Retry deployment" on latest build OR push a new commit
3. Wait for deployment to complete

## Step 6: Test

1. Go to Email Notifications page
2. Select a user and send a test email
3. Check Cloudflare Pages logs (Workers & Pages → Your Project → Logs)
   - You should see: `[Email Service] Using Resend API`
   - You should NOT see: `[Email Service] Using SendGrid API`

## Troubleshooting

### Still getting SendGrid errors?
- Remove `SENDGRID_API_KEY` from environment variables completely
- Redeploy
- Check logs to confirm Resend is being used

### Emails not sending?

#### Error: "You can only send testing emails to your own email address"
**Solution**: This means you're using Resend's test mode. You need to verify a domain:
1. Go to [Resend Domains](https://resend.com/domains)
2. Add and verify your domain
3. Set `RESEND_FROM_ADDRESS` environment variable with your verified domain
4. Redeploy

#### Other issues:
- Check Resend dashboard for API key status
- Verify API key is correct in Cloudflare Pages
- Check Cloudflare Pages logs for error messages
- Make sure you redeployed after setting environment variables
- Verify domain is fully verified in Resend dashboard

## Need Help?

- See `docs/EMAIL_TROUBLESHOOTING.md` for detailed troubleshooting
- Check Resend dashboard for account status and limits

