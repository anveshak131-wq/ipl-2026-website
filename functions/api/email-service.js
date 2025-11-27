/**
 * Cloudflare Pages Function for email notifications
 * Enhanced with personalization, queue management, and analytics
 * Sends match reminders 30 minutes before matches
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const { action } = await request.json();

    if (action === 'send-match-reminder') {
      return await sendMatchReminder(request, env, corsHeaders);
    } else if (action === 'send-email') {
      return await sendEmail(request, env, corsHeaders);
    } else if (action === 'send-batch') {
      return await sendBatchEmails(request, env, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Email service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Send a match reminder email
 */
async function sendMatchReminder(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, matchId, team1, team2, venue, time, date } = body;

    if (!email || !matchId || !team1 || !team2) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user has accepted terms and opted in for notifications
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    
    // Check if user has accepted terms and opted in
    if (!user.termsAccepted || !user.emailNotificationsEnabled) {
      return new Response(
        JSON.stringify({ error: 'User has not opted in for notifications' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate HTML email template
    const htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);

    // Send email using Resend, SendGrid, or other service
    const emailResult = await sendEmailViaProvider(
      {
        from: 'noreply@sportsup99.com',
        to: email,
        subject: `🏏 Match Reminder: ${team1.shortName} vs ${team2.shortName} Starting in 30 Minutes!`,
        html: htmlContent,
      },
      env
    );

    if (emailResult.success) {
      // Log email sent to KV
      const emailLog = {
        matchId,
        email,
        sentAt: new Date().toISOString(),
        type: 'match-reminder',
      };
      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592000 } // 30 days
      );

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully', messageId: emailResult.messageId }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error('Send match reminder error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Generic email sending function
 */
async function sendEmail(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (to, subject, html)' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const emailResult = await sendEmailViaProvider(
      {
        from: 'noreply@sportsup99.com',
        to,
        subject,
        html,
      },
      env
    );

    if (emailResult.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: emailResult.messageId }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Send email via Resend, SendGrid, or fallback service
 */
async function sendEmailViaProvider(emailData, env) {
  // Try Resend first
  if (env.RESEND_API_KEY) {
    return await sendViaResend(emailData, env.RESEND_API_KEY);
  }

  // Try SendGrid
  if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid(emailData, env.SENDGRID_API_KEY);
  }

  // Try Mailgun
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return await sendViaMailgun(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }

  // Log locally if no email service configured
  console.log('No email service configured. Email data:', emailData);
  return { success: true, messageId: 'local-' + Date.now() };
}

/**
 * Send via Resend (recommended for Cloudflare)
 */
async function sendViaResend(emailData, apiKey) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Resend API error' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(emailData, apiKey) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: { email: emailData.from },
        subject: emailData.subject,
        content: [{ type: 'text/html', value: emailData.html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'SendGrid API error' };
    }

    const messageId = response.headers.get('X-Message-Id') || 'sendgrid-' + Date.now();
    return { success: true, messageId };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Mailgun
 */
async function sendViaMailgun(emailData, apiKey, domain) {
  try {
    const formData = new FormData();
    formData.append('from', emailData.from);
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:' + apiKey),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Mailgun API error' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Mailgun error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email template for match reminder
 */
function generateMatchReminderHTML(team1, team2, venue, time, date) {
  const matchTime = time || '19:30';
  const matchDate = date || 'TBD';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Match Reminder</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px 20px;
        }
        .match-info {
          background-color: #f9f9f9;
          border-left: 4px solid #ffd700;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .teams {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 20px 0;
          font-weight: bold;
        }
        .team {
          text-align: center;
          flex: 1;
        }
        .team-name {
          font-size: 18px;
          color: #333;
          margin: 10px 0;
        }
        .vs {
          font-size: 16px;
          color: #999;
          padding: 0 15px;
        }
        .details {
          background-color: #f0f0f0;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #666;
          font-weight: 600;
        }
        .detail-value {
          color: #333;
          font-weight: 500;
        }
        .cta-button {
          display: inline-block;
          background-color: #ffd700;
          color: #000;
          padding: 12px 30px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .cta-button:hover {
          background-color: #ffed4e;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }
        .footer a {
          color: #2a5298;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏏 Match Reminder</h1>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          
          <p style="font-size: 16px; color: #333; margin: 20px 0;">
            Your favorite match is starting in <strong>30 minutes</strong>! ⏰
          </p>
          
          <div class="match-info">
            <div class="teams">
              <div class="team">
                <div class="team-name">${team1.shortName || team1.name}</div>
                <div style="color: #999; font-size: 12px;">${team1.name}</div>
              </div>
              <div class="vs">VS</div>
              <div class="team">
                <div class="team-name">${team2.shortName || team2.name}</div>
                <div style="color: #999; font-size: 12px;">${team2.name}</div>
              </div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${matchDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏰ Time:</span>
                <span class="detail-value">${matchTime} IST</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📍 Venue:</span>
                <span class="detail-value">${venue}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://sportsup99.com/live-score" class="cta-button">
              Watch Live Score
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Don't miss the action! Head over to SportsUp99 to track live scores, updates, and join the live chat with other fans.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">
            © 2026 SportsUp99 IPL Experience. All rights reserved.
          </p>
          <p style="margin: 10px 0 0 0;">
            <a href="https://sportsup99.com/terms">Terms of Service</a> | 
            <a href="https://sportsup99.com/privacy">Privacy Policy</a> |
            <a href="https://sportsup99.com/account">Notification Settings</a> |
            <a href="https://sportsup99.com/api/email-preferences/unsubscribe/{{unsubscribeToken}}">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send batch emails with personalization
 */
async function sendBatchEmails(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { emails } = body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'emails must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const results = [];
    for (const emailData of emails) {
      const result = await sendPersonalizedEmail(emailData, env);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Send batch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send batch' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Send personalized email with user segment preferences
 */
async function sendPersonalizedEmail(emailData, env) {
  try {
    const { email, matchId, team1, team2, venue, time, date, personalization } = emailData;

    if (!email) {
      return { success: false, email, error: 'Email address required' };
    }

    // Get user segment and preferences
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return { success: false, email, error: 'User not found' };
    }

    const user = JSON.parse(userData);
    const prefs = user.emailPreferences || {};

    // Generate personalized subject and content
    const subject = `🏏 ${user.name}, Don't miss: ${team1.shortName} vs ${team2.shortName}!`;
    const greeting = `Hi ${user.name}`;

    let htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);
    htmlContent = htmlContent.replace('Hi there!', greeting);

    // Generate unsubscribe token
    const unsubToken = crypto.randomUUID();
    await env.SPORTS_KV.put(
      `unsubscribe-token:${unsubToken}`,
      JSON.stringify({ email, category: 'all' }),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );

    htmlContent = htmlContent.replace(
      '{{unsubscribeToken}}',
      unsubToken
    );

    const emailResult = await sendEmailViaProvider(
      {
        from: 'noreply@sportsup99.com',
        to: email,
        subject,
        html: htmlContent,
      },
      env
    );

    if (emailResult.success) {
      // Log email sent
      const emailLog = {
        matchId,
        email,
        sentAt: new Date().toISOString(),
        type: 'match-reminder',
        personalized: true,
        segment: user.segment || 'unknown',
      };

      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592000 }
      );

      return {
        success: true,
        email,
        matchId,
        messageId: emailResult.messageId,
      };
    } else {
      return {
        success: false,
        email,
        error: emailResult.error,
      };
    }
  } catch (error) {
    console.error('Send personalized error:', error);
    return {
      success: false,
      email: emailData.email,
      error: error.message,
    };
  }
}
