# Email Notifications System - Setup Guide

## Overview

The email notifications system allows admins to:
1. Send bulk emails to selected users (matches, news, or custom)
2. Automatically send match reminders 30 minutes before each match starts

## Features

### 1. Bulk Email Sending

**Location**: Admin → Email Notifications → Users Tab

**How to Use**:
1. Select users using checkboxes
2. Click "Send Email" button in the bulk operations toolbar
3. Choose email type:
   - **Custom**: Write your own email
   - **Match**: Select a match and auto-fill match details
   - **News**: Select a news article and auto-fill news details
4. Optionally select a template
5. Edit subject and body as needed
6. Click "Send" to send to all selected users

**Features**:
- Variable replacement: `{{userName}}`, `{{userEmail}}`, `{{teamName}}`, etc.
- Template support
- Preview recipients before sending
- Email logging

### 2. Automatic Match Reminders

**How It Works**:
- A cron job runs every 5 minutes
- Checks for matches starting in 30 minutes (25-35 minute window)
- Sends email reminders to all users with notifications enabled
- Emails include match details (teams, date, venue)

## Setup Instructions

### Step 1: Configure Email Service

You need to integrate an email service provider. Choose one:

#### Option A: Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key
3. Add to environment variables:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

#### Option B: SendGrid
1. Sign up at https://sendgrid.com
2. Get your API key
3. Add to environment variables:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

#### Option C: Mailgun
1. Sign up at https://mailgun.com
2. Get your API key and domain
3. Add to environment variables:
   ```bash
   MAILGUN_API_KEY=xxxxxxxxxxxxx
   MAILGUN_DOMAIN=mg.yourdomain.com
   ```

### Step 2: Update Email Sending Code

Edit the following files to integrate your email service:

#### For Bulk Emails: `src/app/api/admin/send-bulk-email/route.ts`

Replace the TODO comment with actual email sending:

```typescript
// Example with Resend:
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: recipient.email,
  subject: processedSubject,
  html: processedBody.replace(/\n/g, '<br>'),
});
```

#### For Match Reminders: `src/app/api/admin/match-reminders/route.ts`

Replace the TODO comment with actual email sending (same as above).

### Step 3: Configure Cron Job

#### For Cloudflare Pages:

1. Add cron trigger in `wrangler.toml`:
   ```toml
   [[triggers.crons]]
   cron = "*/5 * * * *"  # Every 5 minutes
   ```

2. Set up Cloudflare Cron Trigger:
   - Go to Cloudflare Dashboard → Workers & Pages → Your Project
   - Navigate to Settings → Triggers
   - Add a Cron Trigger:
     - Schedule: `*/5 * * * *` (every 5 minutes)
     - Path: `/api/admin/match-reminders`

3. Set environment variable for cron secret:
   ```bash
   CRON_SECRET=your-secure-random-string
   ```

#### Alternative: External Cron Service

If not using Cloudflare cron, set up an external cron service (e.g., cron-job.org) to call:
```
GET https://your-domain.com/api/admin/match-reminders
Headers:
  x-cron-secret: your-secure-random-string
```

### Step 4: Test the System

1. **Test Bulk Email**:
   - Go to Email Notifications page
   - Select a few test users
   - Send a test email
   - Check email logs tab

2. **Test Match Reminders**:
   - Create a test match scheduled for 30 minutes from now
   - Wait for cron job to run (or manually call the API)
   - Check that emails were sent

## API Endpoints

### POST `/api/admin/send-bulk-email`
Send bulk emails to selected users.

**Request Body**:
```json
{
  "templateId": "optional-template-id",
  "subject": "Email Subject",
  "body": "Email Body with {{variables}}",
  "recipientIds": ["user-id-1", "user-id-2"],
  "emailType": "match" | "news" | "custom",
  "matchId": "optional-match-id",
  "newsId": "optional-news-id"
}
```

**Response**:
```json
{
  "success": true,
  "sentCount": 10,
  "totalCount": 10,
  "sentEmails": [...]
}
```

### GET `/api/admin/match-reminders`
Check for matches starting in 30 minutes and send reminders.

**Headers**:
- `x-cron-secret`: Your cron secret (or Cloudflare cron header)

**Response**:
```json
{
  "success": true,
  "message": "Processed 2 match(es)",
  "matchesProcessed": 2,
  "totalUsers": 150,
  "results": [...]
}
```

## Email Variables

Available variables in email templates:

- `{{userName}}` - User's name
- `{{userEmail}}` - User's email
- `{{teamName}}` - User's favorite team
- `{{matchDate}}` - Match date/time
- `{{matchTime}}` - Match time only
- `{{venue}}` - Match venue
- `{{opponent}}` - Opposing team
- `{{newsTitle}}` - News article title
- `{{newsSummary}}` - News article summary

## Troubleshooting

### Emails Not Sending
1. Check email service API key is set correctly
2. Verify email service account is active
3. Check API route logs for errors
4. Ensure users have notifications enabled

### Match Reminders Not Working
1. Verify cron job is configured correctly
2. Check cron secret matches environment variable
3. Verify matches have correct date format
4. Check API route logs for errors
5. Ensure users have notifications enabled

### Build Errors
- Make sure all imports are correct
- Check TypeScript compilation errors
- Verify all API routes are properly exported

## Security Notes

1. **Cron Secret**: Use a strong, random string for `CRON_SECRET`
2. **API Authentication**: Bulk email sending requires admin authentication
3. **Rate Limiting**: Consider adding rate limiting for bulk emails
4. **Email Validation**: Validate email addresses before sending
5. **Unsubscribe**: Respect user unsubscribe preferences

## Future Enhancements

- [ ] Email service integration (Resend/SendGrid/Mailgun)
- [ ] Email templates with rich HTML
- [ ] Email scheduling with timezone support
- [ ] Email analytics (open rates, click rates)
- [ ] A/B testing for email content
- [ ] Email personalization based on user preferences
- [ ] Batch processing for large user lists
- [ ] Retry logic for failed sends

