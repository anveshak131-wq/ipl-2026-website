# 📧 Email Template Guide for Elastic Email

## 🎨 Two Approaches

### Option 1: Email Designer (Recommended for You)
**Best for**: Quick setup, visual editing, drag-and-drop
- ✅ No coding required
- ✅ Pre-made templates
- ✅ Visual preview
- ✅ Easy to test
- ✅ One-click send

**Use this if**: You want to get emails out ASAP with minimal technical work

---

### Option 2: AI Template Designer
**Best for**: Auto-generated templates, custom branding
- ✅ AI writes the copy
- ✅ Brand customization
- ✅ Personalization hints
- ✅ Quick iteration

**Use this if**: You want AI to help with email copy

---

## 🚀 Quick Start: Email Designer in Elastic Email

### Step 1: Access Email Designer
1. Log in to **Elastic Email dashboard**
2. Go to **Templates**
3. Click **New Template** or **Create from template**
4. Select **Email Designer**

### Step 2: Choose a Template
Look for:
- **Notification/Alert** templates (closest to match reminders)
- **Event** templates
- **Sports** templates (if available)

### Step 3: Customize for Match Reminders

**Replace these sections:**

```
Header:
- Logo: SportsUp99 logo
- Title: "🏏 Match Reminder"

Main Content:
- Match info (teams, time, venue)
- Live score link button
- Team colors/branding

Footer:
- "Watch Live"
- Unsubscribe link
- Social links
- Copyright
```

---

## 📋 Pre-Made Template Ready to Use

I've created templates you can use directly. Choose one:

### Template 1: **Minimal & Clean** (Fast Loading)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Match Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .match-info { background: #f9f9f9; border-left: 4px solid #ffd700; padding: 20px; margin: 20px 0; }
    .teams { display: flex; justify-content: space-around; align-items: center; font-weight: bold; font-size: 18px; margin: 20px 0; }
    .cta-button { display: block; width: 200px; margin: 20px auto; padding: 12px; background: #007bff; color: white; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏏 Match Reminder</h1>
      <p>Your favorite match is starting soon!</p>
    </div>
    
    <div class="content">
      <div class="match-info">
        <h2>Match Details</h2>
        <div class="teams">
          <div>{{TEAM1_NAME}}</div>
          <div>vs</div>
          <div>{{TEAM2_NAME}}</div>
        </div>
        
        <p><strong>📅 Date:</strong> {{MATCH_DATE}}</p>
        <p><strong>⏰ Time:</strong> {{MATCH_TIME}} IST</p>
        <p><strong>📍 Venue:</strong> {{VENUE}}</p>
        
        <a href="{{LIVE_SCORE_URL}}" class="cta-button">Watch Live Score</a>
      </div>
      
      <p>Don't miss the action! Your favorite team is playing now. Head over to SportsUp99 to catch all the updates.</p>
    </div>
    
    <div class="footer">
      <p>© 2026 SportsUp99. All rights reserved.</p>
      <p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> | <a href="{{PREFERENCES_URL}}">Preferences</a></p>
    </div>
  </div>
</body>
</html>
```

---

### Template 2: **Premium & Branded** (With Team Colors)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Match Reminder</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f0f0; }
    
    .wrapper { background: #f0f0f0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    
    .header {
      background: linear-gradient(135deg, {{TEAM1_COLOR}} 0%, {{TEAM2_COLOR}} 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    
    .match-section {
      padding: 40px 20px;
      background: white;
    }
    
    .teams-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 30px 0;
      text-align: center;
    }
    
    .team {
      flex: 1;
    }
    
    .team-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 10px;
      background: #f0f0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
    }
    
    .team-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    
    .vs {
      font-size: 14px;
      color: #999;
      font-weight: bold;
    }
    
    .match-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      color: #666;
      font-weight: 500;
    }
    
    .detail-value {
      color: #333;
      font-weight: bold;
    }
    
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    
    .cta-button {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: scale(1.05);
    }
    
    .content-text {
      color: #666;
      line-height: 1.6;
      margin: 20px 0;
      font-size: 14px;
    }
    
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    
    .footer-links {
      font-size: 12px;
      color: #666;
    }
    
    .footer-links a {
      color: #007bff;
      text-decoration: none;
      margin: 0 10px;
    }
    
    .social-icons {
      margin: 15px 0;
    }
    
    .social-icons a {
      display: inline-block;
      width: 30px;
      height: 30px;
      background: #007bff;
      color: white;
      text-align: center;
      line-height: 30px;
      border-radius: 50%;
      margin: 0 5px;
      text-decoration: none;
    }
    
    @media (max-width: 600px) {
      .header { padding: 30px 15px; }
      .header h1 { font-size: 24px; }
      .teams-container { margin: 20px 0; }
      .match-details { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>🏏 Match Reminder</h1>
        <p>Get ready for an exciting match!</p>
      </div>
      
      <!-- Main Content -->
      <div class="match-section">
        <!-- Teams -->
        <div class="teams-container">
          <div class="team">
            <div class="team-logo">{{TEAM1_INITIALS}}</div>
            <div class="team-name">{{TEAM1_NAME}}</div>
          </div>
          <div class="vs">VS</div>
          <div class="team">
            <div class="team-logo">{{TEAM2_INITIALS}}</div>
            <div class="team-name">{{TEAM2_NAME}}</div>
          </div>
        </div>
        
        <!-- Match Details -->
        <div class="match-details">
          <div class="detail-row">
            <span class="detail-label">📅 Date</span>
            <span class="detail-value">{{MATCH_DATE}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Time</span>
            <span class="detail-value">{{MATCH_TIME}} IST</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📍 Venue</span>
            <span class="detail-value">{{VENUE}}</span>
          </div>
        </div>
        
        <!-- CTA -->
        <div class="cta-section">
          <a href="{{LIVE_SCORE_URL}}" class="cta-button">Watch Live Score →</a>
        </div>
        
        <!-- Content -->
        <p class="content-text">
          Don't miss the action! {{TEAM1_NAME}} takes on {{TEAM2_NAME}} in what promises to be an exciting match. Head over to SportsUp99 to watch live scores, get real-time updates, and never miss a moment of the action.
        </p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="social-icons">
          <a href="https://twitter.com/sportsup99">f</a>
          <a href="https://twitter.com/sportsup99">𝕏</a>
          <a href="https://instagram.com/sportsup99">📷</a>
        </div>
        
        <div class="footer-links">
          <p>© 2026 SportsUp99. All rights reserved.</p>
          <p>
            <a href="{{PREFERENCES_URL}}">Preferences</a> |
            <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> |
            <a href="#">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 🔧 Using Templates in Elastic Email

### Method 1: Copy-Paste into Designer
1. Open **Elastic Email Dashboard** → **Templates**
2. Click **New Template**
3. Choose **HTML** (not Designer initially)
4. Paste one of the templates above
5. Click **Continue to Designer**
6. Customize visually

### Method 2: Use in Your Code
Replace in `/functions/api/email-service.js`:

```javascript
// Inside sendMatchReminder() function
const htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);

// Replace with this for premium template:
const htmlContent = getPremiumTemplate({
  team1Name: team1.name,
  team1Initials: team1.shortName,
  team1Color: team1.color,
  team2Name: team2.name,
  team2Initials: team2.shortName,
  team2Color: team2.color,
  matchDate: date,
  matchTime: time,
  venue: venue,
  liveScoreUrl: 'https://yourdomain.com/live/' + matchId,
});
```

---

## 📧 Template Variables to Personalize

When sending, replace these:

| Variable | Example | Purpose |
|----------|---------|---------|
| `{{TEAM1_NAME}}` | Royal Challengers | First team |
| `{{TEAM1_INITIALS}}` | RCB | Team short code |
| `{{TEAM1_COLOR}}` | #FF6B00 | Team brand color |
| `{{TEAM2_NAME}}` | Mumbai Indians | Second team |
| `{{TEAM2_INITIALS}}` | MI | Team short code |
| `{{TEAM2_COLOR}}` | #004B87 | Team brand color |
| `{{MATCH_DATE}}` | March 23, 2026 | Match date |
| `{{MATCH_TIME}}` | 7:30 PM | Match time |
| `{{VENUE}}` | M.A. Chidambaram Stadium | Stadium name |
| `{{LIVE_SCORE_URL}}` | https://sportsup99.com/live/1 | Link to live score |
| `{{PREFERENCES_URL}}` | https://sportsup99.com/preferences | User preferences |
| `{{UNSUBSCRIBE_URL}}` | https://sportsup99.com/unsubscribe/token | Unsubscribe link |

---

## 🎨 Customization Tips

### Add Team Colors Dynamically
```javascript
// In email-service.js
const team1Color = team1.primaryColor || '#1e3c72';
const team2Color = team2.primaryColor || '#2a5298';

const htmlContent = htmlTemplate
  .replace('{{TEAM1_COLOR}}', team1Color)
  .replace('{{TEAM2_COLOR}}', team2Color)
  // ... other replacements
```

### Add User's Name
```javascript
const userGreeting = user.firstName ? `Hi ${user.firstName}!` : 'Match Reminder';
```

### Add Match Status Badge
```html
<div class="badge">
  {{#if MATCH_STATUS == 'LIVE'}}
    <span style="background: red; color: white; padding: 5px 10px;">LIVE</span>
  {{else if MATCH_STATUS == 'UPCOMING'}}
    <span style="background: blue; color: white; padding: 5px 10px;">UPCOMING</span>
  {{/if}}
</div>
```

---

## 🚀 Next Steps

### Option A: Use Email Designer (Easiest)
1. Go to Elastic Email Dashboard → Templates
2. Create new template
3. Use "Designer" mode
4. Paste one of the templates above
5. Customize colors and text
6. Test send to yourself

### Option B: Use AI Template Designer (Fastest)
1. Go to Elastic Email → Templates
2. Click "AI Template Designer"
3. Describe your email: "Match reminder for cricket matches with team names, time, and live score link"
4. Let AI generate
5. Fine-tune in designer

### Option C: Use Code Templates (Most Control)
1. Copy template HTML above
2. Add to `/functions/api/email-service.js`
3. Create function to replace variables
4. Test via API endpoint

---

## ✅ Testing Your Template

### Test 1: Send Yourself
```bash
curl -X POST https://api.elasticemail.com/v2/email/send \
  -d "apikey=YOUR_KEY" \
  -d "from=noreply@sportsup99.com" \
  -d "to=your-email@example.com" \
  -d "subject=Test Match Reminder" \
  -d "bodyHtml=<html>...</html>"
```

### Test 2: Check Rendering
Use **Email on Acid** or **Litmus** to preview in different clients:
- Gmail
- Outlook
- Apple Mail
- Mobile clients

### Test 3: Spam Score
Run through **Mail-tester** to check deliverability

---

## 💡 Recommendation

**I recommend: Start with Email Designer + Premium Template**

**Why?**
- ✅ No coding needed
- ✅ Beautiful, modern design
- ✅ Team colors automatically applied
- ✅ Mobile responsive
- ✅ Easy to test
- ✅ Professional looking

**Steps to do it right now:**
1. Log into Elastic Email
2. Go to Templates → Create New
3. Choose "Email Designer"
4. Search for "Notification" or "Event" templates
5. Pick one that looks good
6. Customize with team names, colors, logo
7. Test send to yourself
8. You're done! 🎉

---

**Which approach sounds best to you?**
- Email Designer (visual, easiest)
- AI Designer (fastest)
- Code templates (most control)

Let me know and I'll help you implement it!
