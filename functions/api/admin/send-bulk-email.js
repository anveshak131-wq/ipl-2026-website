/**
 * Cloudflare Pages Function for /api/admin/send-bulk-email
 * Handles bulk email sending to multiple users
 */

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

        // TODO: Replace with actual email sending service (Resend, SendGrid, Mailgun, etc.)
        // For now, simulate sending
        console.log(`[Email] Sending to ${recipient.email}:`, {
          subject: processedSubject,
          bodyLength: processedBody.length,
        });

        // Log email to KV for tracking
        const emailLog = {
          id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          templateId: templateId || '',
          recipientEmail: recipient.email,
          recipientName: recipient.name || 'User',
          subject: processedSubject,
          status: 'sent',
          sentAt: new Date().toISOString(),
          emailType: emailType || 'custom',
        };

        // Store email log
        const logsKey = `email-logs:${Date.now()}`;
        await env.SPORTS_KV.put(logsKey, JSON.stringify(emailLog), {
          expirationTtl: 31536000, // 1 year
        });

        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
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

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: successCount,
        totalCount: recipients.length,
        sentEmails,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Bulk email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send emails' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

