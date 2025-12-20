import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route handles automatic match reminders
 * It should be called by a cron job or scheduled task every few minutes
 * to check for matches starting in 30 minutes and send reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is called from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    const cfCron = request.headers.get('cf-cron'); // Cloudflare cron header

    // Allow Cloudflare cron triggers or valid secret/auth
    const isAuthorized = 
      cfCron === 'true' || // Cloudflare cron trigger
      cronSecret === process.env.CRON_SECRET || // Custom cron secret
      (authHeader && authHeader.startsWith('Bearer ')); // Admin token

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // Will be used in production for more precise filtering

    // Fetch upcoming matches
    const matchesResponse = await fetch(`${request.nextUrl.origin}/api/matches`);
    if (!matchesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
    const matchesData = await matchesResponse.json();
    const matches = Array.isArray(matchesData) ? matchesData : (matchesData.matches || []);

    // Find matches starting in ~30 minutes (with 5 minute window)
    const matchesToRemind = matches.filter((match: any) => {
      if (!match.date && !match.matchDate) return false;
      const matchDate = new Date(match.date || match.matchDate);
      const timeDiff = matchDate.getTime() - now.getTime();
      // Between 25 and 35 minutes from now
      return timeDiff >= 25 * 60 * 1000 && timeDiff <= 35 * 60 * 1000;
    });

    if (matchesToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches starting in 30 minutes',
        checked: matches.length,
      });
    }

    // Get all users with email notifications enabled
    // For cron jobs, fetch directly from KV or use internal API
    let users: any[] = [];
    try {
      // Try to fetch users - for cron, we might need to access KV directly
      // For now, use the API endpoint with proper auth
      const usersResponse = await fetch(`${request.nextUrl.origin}/api/admin/email-users`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        users = usersData.users || [];
      } else {
        // If API fails, return early - cron will retry
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch users',
          matchesFound: matchesToRemind.length,
        });
      }
    } catch (e) {
      console.error('Failed to fetch users for reminders:', e);
      return NextResponse.json({
        success: false,
        message: 'Error fetching users',
        error: String(e),
      }, { status: 500 });
    }

    const eligibleUsers = users.filter(
      (user: any) => user.emailNotificationsEnabled && !user.unsubscribedAt
    );

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible users found',
        matchesFound: matchesToRemind.length,
      });
    }

    // Send reminders for each match
    const results = [];

    for (const match of matchesToRemind) {
      const team1 = match.team1 || match.team1Name || 'Team 1';
      const team2 = match.team2 || match.team2Name || 'Team 2';
      const venue = match.venue || match.stadium || 'TBD';
      const matchDate = new Date(match.date || match.matchDate);

      // const subject = `Match Reminder: ${team1} vs ${team2} starts in 30 minutes!`; // Will be used in production when email sending is implemented
      const body = `Don't miss the exciting match!\n\n${team1} vs ${team2}\nDate: ${matchDate.toLocaleString()}\nVenue: ${venue}\n\nTune in to catch all the action!`;

      const sentEmails: Array<{ email: string; success: boolean; error?: string }> = [];

      for (const user of eligibleUsers) {
        try {
          // Replace variables
          let processedBody = body;
          processedBody = processedBody.replace(/\{\{userName\}\}/g, user.name || 'User');
          processedBody = processedBody.replace(/\{\{userEmail\}\}/g, user.email);
          processedBody = processedBody.replace(/\{\{teamName\}\}/g, user.favoriteTeamIds?.[0] || 'your team');
          processedBody = processedBody.replace(/\{\{matchDate\}\}/g, matchDate.toLocaleString());
          processedBody = processedBody.replace(/\{\{matchTime\}\}/g, matchDate.toLocaleTimeString());
          processedBody = processedBody.replace(/\{\{venue\}\}/g, venue);
          processedBody = processedBody.replace(/\{\{opponent\}\}/g, team1 === user.favoriteTeamIds?.[0] ? team2 : team1);

          // TODO: Replace with actual email sending service
          console.log(`Sending match reminder to ${user.email} for match ${match.id}`);

          // Example with a service like SendGrid:
          // await sendEmail({
          //   to: user.email,
          //   subject: subject,
          //   html: processedBody,
          // });

          sentEmails.push({
            email: user.email,
            success: true,
          });
        } catch (error: any) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
          sentEmails.push({
            email: user.email,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = sentEmails.filter((e) => e.success).length;

      results.push({
        matchId: match.id,
        match: `${team1} vs ${team2}`,
        sentCount: successCount,
        totalCount: eligibleUsers.length,
        sentEmails,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${matchesToRemind.length} match(es)`,
      matchesProcessed: matchesToRemind.length,
      totalUsers: eligibleUsers.length,
      results,
    });
  } catch (error: any) {
    console.error('Match reminder error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process reminders' }, { status: 500 });
  }
}

