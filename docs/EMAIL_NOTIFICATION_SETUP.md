# Email Notification System Setup Guide

## Overview
This document explains how to set up and configure the automatic email notification system that sends match reminders to users 30 minutes before their favorite team's match.

## Architecture

### Components

1. **Email Service API** (`/functions/api/email-service.js`)
   - Handles sending emails via multiple providers (Resend, SendGrid, Mailgun)
   - Generates HTML email templates for match reminders
   - Logs sent emails to KV for deduplication

2. **User Preferences API** (`/functions/api/preferences.js`)
   - Syncs terms acceptance from localStorage to backend
   - Manages email notification preferences per user
   - Maintains a user index for the email scheduler

3. **Scheduled Email Reminder Worker** (`/functions/scheduled-email-reminder.js`)
   - Runs every 5 minutes via Cloudflare CRON
   - Checks for matches starting in ~30 minutes
   - Sends reminders to interested users

4. **Email Logging**
   - Prevents duplicate emails via `email-log:${email}:${matchId}` KV entries
   - Entries expire after 30 days

## User Flow

1. **User Signs Up**
   - User creates account via `/api/auth` signup endpoint
   - User accepts terms and conditions (stored in localStorage and synced to backend)
   - User selects favorite teams

2. **Preference Sync**
   - Frontend calls `/api/preferences` with user auth token
   - Backend stores `termsAccepted` and `emailNotificationsEnabled` flags
   - User email is added to `users-index` in KV for scheduled emails

3. **Match Reminder (30 mins before)**
   - Scheduled worker checks all matches
   - Finds matches starting in ~30 minutes (20-40 minute window)
   - For each match, finds users with matching favorite teams
   - Sends email via configured provider (Resend, SendGrid, or Mailgun)
   - Logs sent email to prevent duplicates

## Setup Instructions

### Step 1: Choose Email Provider

Choose one of the three supported email providers:

#### Option A: Resend (Recommended)
```bash
# Sign up at https://resend.com
# Get your API key from dashboard
```

#### Option B: SendGrid
```bash
# Sign up at https://sendgrid.com
# Create API key in Settings > API Keys
```

#### Option C: Mailgun
```bash
# Sign up at https://www.mailgun.com
# Create API key in API Security
```

### Step 2: Configure Environment Variables

Update your `wrangler.toml` with your email service credentials:

```toml
# For Resend
[env.production]
vars = { ENVIRONMENT = "production" }
secrets = ["RESEND_API_KEY"]

# For SendGrid
# secrets = ["SENDGRID_API_KEY"]

# For Mailgun
# secrets = ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"]
```

Or set via Cloudflare Pages environment variables:
1. Go to Pages > Your Project > Settings > Environment Variables
2. Add the appropriate secret (RESEND_API_KEY, SENDGRID_API_KEY, etc.)

### Step 3: Configure Sender Email

Update the sender email in `/functions/api/email-service.js`:

```javascript
from: 'noreply@sportsup99.com', // Change to your domain
```

### Step 4: Configure KV Namespaces

Ensure you have two KV namespaces configured:

```toml
[[kv_namespaces]]
binding = "SPORTS_KV"
id = "your-kv-id"

[[kv_namespaces]]
binding = "IPL_CACHE"
id = "your-cache-id"
```

### Step 5: Enable Scheduled Event

The scheduled event is configured in `wrangler.toml`:

```toml
[[triggers.crons]]
cron = "*/5 * * * *"  # Run every 5 minutes
```

This is automatically enabled when deployed to Cloudflare Pages with Workers.

## API Endpoints

### Sync User Preferences
```bash
curl -X PUT https://sportsup99.com/api/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "termsAccepted": true,
    "emailNotificationsEnabled": true,
    "favoriteTeamIds": ["1", "2", "3"]
  }'
```

### Get User Preferences
```bash
curl -X GET https://sportsup99.com/api/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Manual Email
```bash
curl -X POST https://sportsup99.com/api/email-service \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-email",
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<p>Hello!</p>"
  }'
```

## Frontend Integration

### Sync Terms Acceptance

After user accepts terms, call the preferences API:

```typescript
// In your terms acceptance modal or component
const syncTermsAcceptance = async (token: string) => {
  const response = await fetch('/api/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      termsAccepted: true,
      emailNotificationsEnabled: true,
      favoriteTeamIds: selectedTeams,
    }),
  });

  return response.json();
};
```

### Manage Email Notification Settings

Add a preferences page for users to manage their settings:

```typescript
const updateEmailPreferences = async (token: string, enabled: boolean) => {
  await fetch('/api/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      emailNotificationsEnabled: enabled,
    }),
  });
};
```

## Email Template Customization

The email template is generated in `/functions/api/email-service.js` in the `generateMatchReminderHTML()` function.

To customize:

1. **Change header color**: Update the gradient in the `.header` style
2. **Add team logos**: Include logo URLs in the template
3. **Change CTA button**: Modify the link and button text
4. **Add branding**: Update footer with your branding

## Troubleshooting

### Emails Not Being Sent

1. **Check KV Namespaces**
   - Ensure SPORTS_KV and IPL_CACHE are configured
   - Check that users-index exists in SPORTS_KV

2. **Verify Email Provider**
   - Test API key with provider's test endpoint
   - Check environment variables are set correctly

3. **Check User Data**
   - Verify `termsAccepted: true` in user data
   - Verify `emailNotificationsEnabled: true` (default)
   - Verify `favoriteTeamIds` includes match teams

4. **View Logs**
   - Check Cloudflare Pages function logs
   - Look for error messages in email-service and scheduler

### Duplicate Emails

- Emails are deduplicated via `email-log:${email}:${matchId}`
- If a user receives duplicates, check the email log entries
- Logs expire after 30 days

### Scheduled Job Not Running

- Ensure you're using Cloudflare Pages with Workers (not static hosting)
- Check that cron trigger is in wrangler.toml
- Verify the function is deployed correctly

## Testing

### Test Email Sending

```bash
curl -X POST http://localhost:8788/api/email-service \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-email",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Test Match Reminder

Manually trigger the scheduler function to test:

```javascript
// In your Cloudflare Worker
await env.SCHEDULED_EMAIL_REMINDER.trigger();
```

Or wait 5 minutes for the next scheduled run.

## Best Practices

1. **Always require terms acceptance** before sending promotional emails
2. **Provide unsubscribe links** in emails for compliance
3. **Monitor email delivery rates** via provider dashboard
4. **Test with staging environment** before production
5. **Set up email delivery alerts** in provider settings
6. **Maintain user index** - clean up inactive users periodically
7. **Rate limit** email sending to prevent abuse

## Database Schema

### User Data (SPORTS_KV)
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "termsAccepted": true,
  "termsAcceptedDate": "2025-11-27T00:00:00Z",
  "emailNotificationsEnabled": true,
  "favoriteTeamIds": ["1", "2", "3"],
  "hashedPassword": "...",
  "salt": "...",
  "token": "...",
  "createdAt": "2025-11-27T00:00:00Z",
  "isBlocked": false,
  "role": "user"
}
```

### Email Log (SPORTS_KV)
```json
{
  "matchId": "1",
  "email": "user@example.com",
  "sentAt": "2025-11-27T19:00:00Z",
  "type": "match-reminder"
}
```

### Users Index (SPORTS_KV)
```json
[
  "user1@example.com",
  "user2@example.com",
  "user3@example.com"
]
```

## Support

For issues or questions:
1. Check Cloudflare Pages logs
2. Review email provider documentation
3. Verify all environment variables are set
4. Test each component independently
