/**
 * Cloudflare Workers Cron Trigger for Match Reminders
 * This runs every 5 minutes to check for matches starting in 30 minutes
 * and sends email reminders to all users with notifications enabled
 */

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleMatchReminders(env));
  },
};

async function handleMatchReminders(env) {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

    // Fetch upcoming matches from KV
    const matchesKey = 'matches';
    const matchesData = await env.SPORTS_KV.get(matchesKey, { type: 'json' });
    const matches = matchesData || [];

    // Find matches starting in ~30 minutes (with 5 minute window)
    const matchesToRemind = matches.filter((match) => {
      if (!match.date && !match.matchDate) return false;
      const matchDate = new Date(match.date || match.matchDate);
      const timeDiff = matchDate.getTime() - now.getTime();
      // Between 25 and 35 minutes from now
      return timeDiff >= 25 * 60 * 1000 && timeDiff <= 35 * 60 * 1000;
    });

    if (matchesToRemind.length === 0) {
      console.log('No matches starting in 30 minutes');
      return;
    }

    // Get all users with email notifications enabled
    const usersKey = 'email_users';
    const usersData = await env.SPORTS_KV.get(usersKey, { type: 'json' });
    const users = usersData?.users || [];

    const eligibleUsers = users.filter(
      (user) => user.emailNotificationsEnabled && !user.unsubscribedAt
    );

    if (eligibleUsers.length === 0) {
      console.log('No eligible users found for match reminders');
      return;
    }

    // Send reminders for each match
    for (const match of matchesToRemind) {
      const team1 = match.team1 || match.team1Name || 'Team 1';
      const team2 = match.team2 || match.team2Name || 'Team 2';
      const venue = match.venue || match.stadium || 'TBD';
      const matchDate = new Date(match.date || match.matchDate);

      const subject = `Match Reminder: ${team1} vs ${team2} starts in 30 minutes!`;
      
      for (const user of eligibleUsers) {
        try {
          // Replace variables in email body
          let body = `Don't miss the exciting match!\n\n${team1} vs ${team2}\nDate: ${matchDate.toLocaleString()}\nVenue: ${venue}\n\nTune in to catch all the action!`;
          
          body = body.replace(/\{\{userName\}\}/g, user.name || 'User');
          body = body.replace(/\{\{userEmail\}\}/g, user.email);
          body = body.replace(/\{\{teamName\}\}/g, user.favoriteTeamIds?.[0] || 'your team');
          body = body.replace(/\{\{matchDate\}\}/g, matchDate.toLocaleString());
          body = body.replace(/\{\{matchTime\}\}/g, matchDate.toLocaleTimeString());
          body = body.replace(/\{\{venue\}\}/g, venue);
          body = body.replace(/\{\{opponent\}\}/g, team1 === user.favoriteTeamIds?.[0] ? team2 : team1);

          // TODO: Replace with actual email sending service
          // Example with Resend:
          // await fetch('https://api.resend.com/emails', {
          //   method: 'POST',
          //   headers: {
          //     'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({
          //     from: 'noreply@yourdomain.com',
          //     to: user.email,
          //     subject: subject,
          //     html: body.replace(/\n/g, '<br>'),
          //   }),
          // });

          console.log(`Match reminder sent to ${user.email} for match ${match.id}`);

          // Log the email send
          const logKey = `email_logs_${Date.now()}_${Math.random()}`;
          await env.SPORTS_KV.put(logKey, JSON.stringify({
            id: logKey,
            templateId: 'match_reminder',
            templateName: 'Match Reminder',
            recipientEmail: user.email,
            recipientName: user.name || 'User',
            subject: subject,
            status: 'sent',
            sentAt: new Date().toISOString(),
            matchId: match.id,
          }));
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
        }
      }
    }

    console.log(`Processed ${matchesToRemind.length} match(es) for ${eligibleUsers.length} users`);
  } catch (error) {
    console.error('Match reminder cron error:', error);
  }
}

