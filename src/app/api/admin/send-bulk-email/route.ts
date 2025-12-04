import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    // Verify token (simplified - in production, use proper JWT verification)
    const verifyResponse = await fetch(`${request.nextUrl.origin}/api/auth?action=verify&token=${token}`);
    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const role = verifyData.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId: _templateId, subject, body: emailBody, recipientIds, emailType, matchId, newsId, newsData } = body;

    if (!subject || !emailBody || !recipientIds || recipientIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user emails from recipient IDs
    const usersResponse = await fetch(`${request.nextUrl.origin}/api/admin/email-users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!usersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    // Filter users by recipient IDs and email notifications enabled
    // Handle both id and email matching since recipientIds can contain either
    const recipients = users.filter(
      (user: any) => {
        const userId = user.id || user.email;
        const userEmail = user.email;
        return (
          (recipientIds.includes(userId) || recipientIds.includes(userEmail)) &&
          user.emailNotificationsEnabled !== false && // Allow if undefined
          !user.unsubscribedAt
        );
      }
    );

    if (recipients.length === 0) {
      // Check if users exist but don't have notifications enabled or are unsubscribed
      const allMatchingUsers = users.filter(
        (user: any) => {
          const userId = user.id || user.email;
          const userEmail = user.email;
          return recipientIds.includes(userId) || recipientIds.includes(userEmail);
        }
      );
      
      if (allMatchingUsers.length === 0) {
        return NextResponse.json({ 
          error: 'No users found matching the selected recipients. Please ensure users exist and try again.' 
        }, { status: 400 });
      } else {
        const disabledCount = allMatchingUsers.filter((u: any) => u.emailNotificationsEnabled === false).length;
        const unsubscribedCount = allMatchingUsers.filter((u: any) => u.unsubscribedAt).length;
        
        let errorMsg = `No valid recipients found. ${allMatchingUsers.length} user(s) matched but: `;
        const issues = [];
        if (disabledCount > 0) issues.push(`${disabledCount} have email notifications disabled`);
        if (unsubscribedCount > 0) issues.push(`${unsubscribedCount} have unsubscribed`);
        errorMsg += issues.join(' and ') + '.';
        
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    }

    // Process and send emails
    const sentEmails: Array<{ email: string; name?: string; success: boolean; error?: string }> = [];

    for (const recipient of recipients) {
      try {
        // Replace variables in email body
        let processedBody = emailBody;
        let processedSubject = subject;

        // Get logo URL (use absolute URL for emails)
        const logoUrl = `${request.nextUrl.origin}/logos/sportsup18_logo_round.svg`;
        
        // Replace common variables
        processedBody = processedBody.replace(/\{\{userName\}\}/g, recipient.name || 'User');
        processedBody = processedBody.replace(/\{\{userEmail\}\}/g, recipient.email);
        processedBody = processedBody.replace(/\{\{logoUrl\}\}/g, logoUrl);
        processedSubject = processedSubject.replace(/\{\{userName\}\}/g, recipient.name || 'User');
        processedSubject = processedSubject.replace(/\{\{userEmail\}\}/g, recipient.email);

        // If match email, add match-specific variables
        if (emailType === 'match' && matchId) {
          // In production, fetch match details from your database
          processedBody = processedBody.replace(/\{\{matchDate\}\}/g, new Date().toLocaleString());
          processedBody = processedBody.replace(/\{\{matchTime\}\}/g, new Date().toLocaleTimeString());
        }

        // If news email, add news-specific variables
        if (emailType === 'news' && newsId) {
          // Use newsData if provided, otherwise use placeholders
          const newsItem = newsData?.find((n: any) => n.id === newsId);
          const newsTitle = newsItem?.title || 'Latest Cricket News';
          const newsSummary = newsItem?.summary || newsItem?.description || 'Stay updated with the latest cricket news and updates!';
          processedBody = processedBody.replace(/\{\{newsTitle\}\}/g, newsTitle);
          processedBody = processedBody.replace(/\{\{newsSummary\}\}/g, newsSummary);
        }
        
        // Ensure logo is ALWAYS included in ALL emails (HTML or plain text)
        // Reference: Professional email templates from Mailchimp, SendGrid, Litmus
        if (processedBody.includes('<!DOCTYPE') || processedBody.includes('<html>')) {
          // HTML email - ensure logo is present at the top
          if (!processedBody.includes('<img') || (!processedBody.includes(logoUrl) && !processedBody.includes('{{logoUrl}}'))) {
            // Professional email header with logo
            const logoHtml = `<div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: linear-gradient(135deg, #0D1120 0%, #1A2035 100%); border-radius: 12px 12px 0 0;">
  <img src="${logoUrl}" alt="SportsUP Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
</div>`;
            
            // Insert logo after opening body tag or at the very beginning
            if (processedBody.includes('<body')) {
              processedBody = processedBody.replace(
                /<body[^>]*>/i,
                `$&${logoHtml}`
              );
            } else {
              processedBody = logoHtml + processedBody;
            }
          }
        } else {
          // Plain text email - add professional logo header
          const logoHeader = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🏏 SPORTSUP - Your Cricket Destination 🏏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[View Logo: ${logoUrl}]

`;
          if (!processedBody.startsWith('━━') && !processedBody.includes(logoUrl)) {
            processedBody = logoHeader + processedBody;
          }
        }

        // In production, integrate with your email service (SendGrid, AWS SES, etc.)
        // For now, we'll simulate sending
        console.log(`Sending email to ${recipient.email}:`, {
          subject: processedSubject,
          body: processedBody.substring(0, 100) + '...',
        });

        // TODO: Replace with actual email sending service
        // Example with a service like SendGrid:
        // await sendEmail({
        //   to: recipient.email,
        //   subject: processedSubject,
        //   html: processedBody,
        // });

        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
        });
      } catch (error: any) {
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

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      totalCount: recipients.length,
      sentEmails,
    });
  } catch (error: any) {
    console.error('Bulk email send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send emails' }, { status: 500 });
  }
}

