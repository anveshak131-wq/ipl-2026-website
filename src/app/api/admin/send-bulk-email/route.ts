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
    const { templateId, subject, body: emailBody, recipientIds, emailType, matchId, newsId } = body;

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
    const recipients = users.filter(
      (user: any) =>
        recipientIds.includes(user.id || user.email) &&
        user.emailNotificationsEnabled &&
        !user.unsubscribedAt
    );

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Process and send emails
    const sentEmails: Array<{ email: string; name?: string; success: boolean; error?: string }> = [];

    for (const recipient of recipients) {
      try {
        // Replace variables in email body
        let processedBody = emailBody;
        let processedSubject = subject;

        // Replace common variables
        processedBody = processedBody.replace(/\{\{userName\}\}/g, recipient.name || 'User');
        processedBody = processedBody.replace(/\{\{userEmail\}\}/g, recipient.email);
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
          // In production, fetch news details from your database
          processedBody = processedBody.replace(/\{\{newsTitle\}\}/g, 'Latest News');
          processedBody = processedBody.replace(/\{\{newsSummary\}\}/g, '');
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

