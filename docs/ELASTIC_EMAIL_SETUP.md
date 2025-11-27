# 🚀 Elastic Email Setup Guide

**Your API is ready!** Here's how to activate it in your email system.

---

## Step 1: Get Your API Key

From your Elastic Email dashboard:
1. Go to **Settings** → **API**
2. Find your API key (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Copy it

---

## Step 2: Add to Cloudflare Pages

### Via Cloudflare Dashboard:

1. Go to **Cloudflare Pages** → Your Project (`ipl-2026-website`)
2. Click **Settings**
3. Go to **Environment variables**
4. Click **Secrets** (for sensitive data)
5. Click **Add secret**

Fill in:
```
Variable name: ELASTIC_EMAIL_API_KEY
Value: [your_api_key_from_step_1]
Environment: Production (or both if you want it in preview too)
```

6. Click **Save**

### Via Wrangler CLI (Alternative):

```bash
cd /Users/anvesh/Downloads/sportsup99

# Add the secret
wrangler secret put ELASTIC_EMAIL_API_KEY

# It will prompt you to paste the API key
# Paste: [your_api_key]
# Press Enter
```

---

## Step 3: Verify It's Working

### Test Email Send:

```bash
curl -X POST https://api.elasticemail.com/v2/email/send \
  -d "apikey=YOUR_API_KEY" \
  -d "from=noreply@sportsup99.com" \
  -d "to=your-test@example.com" \
  -d "subject=Test Email" \
  -d "bodyHtml=<h1>It works!</h1>"
```

Should return:
```json
{
  "success": true,
  "transactionid": "xxxx-xxxx-xxxx"
}
```

---

## Step 4: (Optional) Set Up Webhooks for Analytics

If you want to track opens, clicks, bounces:

1. In Elastic Email Dashboard: **Settings** → **API** → **Webhooks**
2. Click **Add Webhook**
3. Fill in:

```
URL: https://yourdomain.com/api/email-analytics/webhooks/elastic-email
Events: 
  ☑ Sent
  ☑ Delivered  
  ☑ Opened
  ☑ Clicked
  ☑ Bounced
  ☑ Unsubscribed
  ☑ Abuse Report
```

4. Click **Save**

**Note**: Your domain must be publicly accessible. If you're testing locally, use ngrok:
```bash
ngrok http 8787
# Use the ngrok URL as your webhook endpoint
```

---

## Step 5: Test from Your App

### Send a Test Match Reminder:

```bash
curl -X POST https://your-sportsup.pages.dev/api/email-service \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-email",
    "email": "your-test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test from Elastic Email</h1>"
  }'
```

---

## Your API Permissions ✅

Based on what you shared, you have:

| Permission | Status | What It Does |
|-----------|--------|-------------|
| **Send email via HTTP** | ✅ | Can send emails |
| **View** | ✅ | Can view data |
| **View & Modify** | ✅ | Can edit settings |
| **Full access** | ✅ | All permissions granted |

Everything you need is enabled! 🎉

---

## Sender Email Address

When sending emails, use:
```javascript
from: "noreply@sportsup99.com"
// or any email you've verified in Elastic Email
```

To verify a sender email:
1. Elastic Email Dashboard → **Settings** → **Senders**
2. Click **Add Sender**
3. Enter your email (e.g., `noreply@sportsup99.com`)
4. Verify the email (click link in confirmation email)
5. Use it in your code

---

## Troubleshooting

### "Unauthorized" or "Invalid API key"
- Check API key is copied correctly
- Verify it's in Cloudflare Secrets (not in the code)
- Redeploy: `wrangler deploy`

### Emails not sending
- Check Elastic Email dashboard for error logs
- Verify sender email is verified
- Check rate limits (free tier has limits)

### Webhooks not firing
- Verify webhook URL is publicly accessible
- Check Elastic Email webhook logs
- Make sure endpoint returns 200 OK

---

## Pricing

**Elastic Email Free Tier**:
- ✅ Up to 160 emails/day (free)
- ✅ Unlimited contacts
- ✅ Email templates
- ✅ Basic analytics

**For higher volume**:
- $15/month = 10,000 emails/month
- $20/month = 20,000 emails/month
- etc.

---

## Quick Reference

| Setting | Value |
|---------|-------|
| API Endpoint | `https://api.elasticemail.com/v2/email/send` |
| Auth Method | API key in request body |
| Request Type | POST, form-encoded |
| Rate Limit | Free: 160/day; Paid: per plan |
| Webhook Events | Sent, Delivered, Opened, Clicked, Bounced, Unsubscribed, AbuseReport |

---

## You're All Set! 🚀

Your email system will now:
1. Try **Resend** first
2. If Resend fails → Try **Elastic Email** (now active!)
3. If Elastic Email fails → Try **SendGrid**
4. If SendGrid fails → Try **Mailgun**

All automatic failover. No code changes needed!

---

**Next Steps**:
1. ✅ Add API key to Cloudflare (do this now)
2. ✅ Verify sender email in Elastic Email
3. ⏳ Deploy: `wrangler deploy`
4. ⏳ Test with a real email address
5. ⏳ Monitor dashboard for delivery

Questions? Check the other documentation files!
