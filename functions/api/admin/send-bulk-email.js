/**
 * Cloudflare Pages Function for /api/admin/send-bulk-email
 * Handles bulk email sending to multiple users
 */

/**
 * Send email via Resend, Elastic Email, SendGrid, or Mailgun
 */
async function sendEmailViaProvider(emailData, env) {
  // Try Resend first (recommended for Cloudflare)
  if (env.RESEND_API_KEY) {
    return await sendViaResend(emailData, env.RESEND_API_KEY);
  }

  // Try Elastic Email
  if (env.ELASTIC_EMAIL_API_KEY) {
    return await sendViaElasticEmail(emailData, env.ELASTIC_EMAIL_API_KEY);
  }

  // Try SendGrid
  if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid(emailData, env.SENDGRID_API_KEY);
  }

  // Try Mailgun
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return await sendViaMailgun(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }

  // No email service configured - return error so admin knows to configure one
  console.error('[Email Service] No email service API key configured. Please configure RESEND_API_KEY, ELASTIC_EMAIL_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY in Cloudflare Pages environment variables.');
  return { 
    success: false, 
    error: 'Email service not configured. Please configure an email service API key (Resend, Elastic Email, SendGrid, or Mailgun) in Cloudflare Pages environment variables.',
    messageId: null
  };
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
      let errorMessage = 'Resend API error';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || JSON.stringify(error);
      } catch (e) {
        try {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}`;
        } catch (e2) {
          errorMessage = `HTTP ${response.status}`;
        }
      }
      console.error('[Resend] Failed to send email:', {
        to: emailData.to,
        status: response.status,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    console.log('[Resend] Email sent successfully:', {
      to: emailData.to,
      messageId: data.id,
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Elastic Email
 */
async function sendViaElasticEmail(emailData, apiKey) {
  try {
    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: apiKey,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        bodyHtml: emailData.html,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'Elastic Email API error' };
    }

    const data = await response.json();
    
    if (data.success) {
      return { success: true, messageId: data.transactionid || data.transaction_id || 'elastic-' + Date.now() };
    } else {
      return { success: false, error: data.error || 'Elastic Email error' };
    }
  } catch (error) {
    console.error('Elastic Email error:', error);
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

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify token
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let emailFromToken = tokenValue;
    let roleFromToken = 'user';

    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          emailFromToken = parsed.email;
        }
        if (parsed && typeof parsed.role === 'string') {
          roleFromToken = parsed.role;
        }
      } catch (e) {
        // fall back to raw tokenValue
      }
    }

    const adminUserData = await env.SPORTS_KV.get(`user:${emailFromToken}`);
    if (!adminUserData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const adminUser = JSON.parse(adminUserData);
    const effectiveRole = adminUser.role || roleFromToken;

    if (effectiveRole !== 'admin' && effectiveRole !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { templateId, subject, body: emailBody, recipientIds, emailType, matchId, newsId, newsData } = body;

    if (!subject || !emailBody || !recipientIds || recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user emails from recipient IDs
    let usersIndexRaw = await env.SPORTS_KV.get('users-index');
    let emails = [];
    if (usersIndexRaw) {
      try {
        emails = JSON.parse(usersIndexRaw) || [];
      } catch (e) {
        emails = [];
      }
    }

    const users = [];
    for (const email of emails) {
      try {
        const userData = await env.SPORTS_KV.get(`user:${email}`);
        if (!userData) continue;
        const user = JSON.parse(userData);
        users.push(user);
      } catch (e) {
        // skip invalid user
      }
    }

    // Filter users by recipient IDs and email notifications enabled
    const recipients = users.filter((user) => {
      const userId = user.id || user.email;
      const userEmail = user.email;
      return (
        (recipientIds.includes(userId) || recipientIds.includes(userEmail)) &&
        user.emailNotificationsEnabled !== false &&
        !user.unsubscribedAt
      );
    });

    if (recipients.length === 0) {
      // Check if users exist but don't have notifications enabled
      const allMatchingUsers = users.filter((user) => {
        const userId = user.id || user.email;
        const userEmail = user.email;
        return recipientIds.includes(userId) || recipientIds.includes(userEmail);
      });

      if (allMatchingUsers.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No users found matching the selected recipients. Please ensure users exist and try again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } else {
        const disabledCount = allMatchingUsers.filter((u) => u.emailNotificationsEnabled === false).length;
        const unsubscribedCount = allMatchingUsers.filter((u) => u.unsubscribedAt).length;

        let errorMsg = `No valid recipients found. ${allMatchingUsers.length} user(s) matched but: `;
        const issues = [];
        if (disabledCount > 0) issues.push(`${disabledCount} have email notifications disabled`);
        if (unsubscribedCount > 0) issues.push(`${unsubscribedCount} have unsubscribed`);
        errorMsg += issues.join(' and ') + '.';

        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Get origin for logo URL
    const url = new URL(request.url);
    const origin = url.origin;
    const logoUrl = `${origin}/logos/sportsup18_logo_round.svg`;

    // Process and send emails
    const sentEmails = [];

    for (const recipient of recipients) {
      try {
        let processedBody = emailBody;
        let processedSubject = subject;

        // Replace common variables
        processedBody = processedBody.replace(/\{\{userName\}\}/g, recipient.name || 'User');
        processedBody = processedBody.replace(/\{\{userEmail\}\}/g, recipient.email);
        processedBody = processedBody.replace(/\{\{logoUrl\}\}/g, logoUrl);
        processedSubject = processedSubject.replace(/\{\{userName\}\}/g, recipient.name || 'User');
        processedSubject = processedSubject.replace(/\{\{userEmail\}\}/g, recipient.email);

        // If match email, add match-specific variables
        if (emailType === 'match' && matchId) {
          processedBody = processedBody.replace(/\{\{matchDate\}\}/g, new Date().toLocaleString());
          processedBody = processedBody.replace(/\{\{matchTime\}\}/g, new Date().toLocaleTimeString());
        }

        // If news email, add news-specific variables
        if (emailType === 'news' && newsId && newsData) {
          const newsItem = Array.isArray(newsData) ? newsData.find((n) => n.id === newsId) : null;
          const newsTitle = newsItem?.title || 'Latest Cricket News';
          const newsSummary = newsItem?.summary || newsItem?.description || 'Stay updated with the latest cricket news and updates!';
          processedBody = processedBody.replace(/\{\{newsTitle\}\}/g, newsTitle);
          processedBody = processedBody.replace(/\{\{newsSummary\}\}/g, newsSummary);
        }

        // Ensure logo is ALWAYS included in ALL emails
        if (processedBody.includes('<!DOCTYPE') || processedBody.includes('<html>')) {
          if (!processedBody.includes('<img') || (!processedBody.includes(logoUrl) && !processedBody.includes('{{logoUrl}}'))) {
            const logoHtml = `<div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: linear-gradient(135deg, #0D1120 0%, #1A2035 100%); border-radius: 12px 12px 0 0;">
  <img src="${logoUrl}" alt="SportsUP Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
</div>`;

            if (processedBody.includes('<body')) {
              processedBody = processedBody.replace(/<body[^>]*>/i, `$&${logoHtml}`);
            } else {
              processedBody = logoHtml + processedBody;
            }
          }
        } else {
          const logoHeader = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🏏 SPORTSUP - Your Cricket Destination 🏏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[View Logo: ${logoUrl}]

`;
          if (!processedBody.startsWith('━━') && !processedBody.includes(logoUrl)) {
            processedBody = logoHeader + processedBody;
          }
        }

        // Actually send email using email service providers
        const emailResult = await sendEmailViaProvider(
          {
            from: 'SportsUP <noreply@sportsup99.com>',
            to: recipient.email,
            subject: processedSubject,
            html: processedBody,
          },
          env
        );

        // Log email to KV for tracking
        const emailLog = {
          id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          templateId: templateId || '',
          recipientEmail: recipient.email,
          recipientName: recipient.name || 'User',
          subject: processedSubject,
          status: emailResult.success ? 'sent' : 'failed',
          sentAt: new Date().toISOString(),
          emailType: emailType || 'custom',
          messageId: emailResult.messageId || null,
          error: emailResult.error || null,
        };

        // Store email log
        const logsKey = `email-logs:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await env.SPORTS_KV.put(logsKey, JSON.stringify(emailLog), {
          expirationTtl: 31536000, // 1 year
        });

        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: emailResult.success,
          error: emailResult.error || undefined,
          messageId: emailResult.messageId || undefined,
        });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = sentEmails.filter((e) => e.success).length;
    const failedCount = sentEmails.filter((e) => !e.success).length;

    // Check if no email service is configured (all failed with same error)
    const allFailedWithConfigError = failedCount === recipients.length && 
      sentEmails.every(e => !e.success && e.error && e.error.includes('not configured'));

    if (allFailedWithConfigError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. Please configure an email service API key (Resend, Elastic Email, SendGrid, or Mailgun) in Cloudflare Pages environment variables.',
          sentCount: 0,
          totalCount: recipients.length,
          failedCount: failedCount,
          sentEmails,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Return success even if some failed, but include details
    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sentCount: successCount,
        totalCount: recipients.length,
        failedCount: failedCount,
        sentEmails,
        message: successCount === recipients.length 
          ? `All ${successCount} email(s) sent successfully!`
          : `Sent ${successCount} email(s). ${failedCount} failed.`,
      }),
      { 
        status: successCount > 0 ? 200 : 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Bulk email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send emails' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

