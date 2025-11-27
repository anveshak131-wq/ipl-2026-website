/**
 * Cloudflare Worker - Match Reminder Scheduler
 * Runs every 5 minutes to check for matches starting in 30 minutes
 * and sends email notifications to interested users
 */

export default {
  async scheduled(event, env, ctx) {
    try {
      console.log('Running match reminder scheduler...');

      // Get all matches from KV cache
      let matches = await env.IPL_CACHE.get('matches', 'json');
      if (!Array.isArray(matches)) {
        matches = [];
      }

      if (matches.length === 0) {
        console.log('No matches found');
        return;
      }

      const now = Date.now();
      const thirtyMinutesFromNow = now + 30 * 60 * 1000;
      const tenMinuteWindow = 10 * 60 * 1000; // 10-minute window for sending reminders

      // Find matches starting in ~30 minutes (within ±10 minute window)
      const matchesToRemind = matches.filter((match) => {
        if (!match || match.status !== 'upcoming') return false;

        const startTime = parseMatchStartTime(match);
        if (!startTime) return false;

        const timeDifference = startTime.getTime() - now;
        // Send reminder if match is between 20-40 minutes away
        return timeDifference > 20 * 60 * 1000 && timeDifference < 40 * 60 * 1000;
      });

      console.log(`Found ${matchesToRemind.length} matches to remind users about`);

      // For each match, find users with matching favorite teams
      for (const match of matchesToRemind) {
        await notifyUsersForMatch(match, env, ctx);
      }

      console.log('Match reminder scheduler completed');
    } catch (error) {
      console.error('Scheduler error:', error);
      throw error;
    }
  },
};

/**
 * Parse match start time from match object
 */
function parseMatchStartTime(match) {
  if (!match || !match.date) return null;

  const datePart = String(match.date).trim();
  const timePart = (match.time ? String(match.time) : '00:00').trim() || '00:00';

  try {
    const dt = new Date(`${datePart}T${timePart}:00+05:30`);
    if (!Number.isNaN(dt.getTime())) return dt;
  } catch (e) {
    // fall through
  }

  try {
    const dt2 = new Date(datePart);
    if (!Number.isNaN(dt2.getTime())) return dt2;
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Get team metadata
 */
function getTeamMeta(teamId, teamObj) {
  const mockTeams = {
    '1': { name: 'Royal Challengers Bengaluru', shortName: 'RCB' },
    '2': { name: 'Mumbai Indians', shortName: 'MI' },
    '3': { name: 'Sunrisers Hyderabad', shortName: 'SRH' },
    '4': { name: 'Gujarat Titans', shortName: 'GT' },
    '5': { name: 'Punjab Kings', shortName: 'PBKS' },
    '6': { name: 'Delhi Capitals', shortName: 'DC' },
    '7': { name: 'Lucknow Super Giants', shortName: 'LSG' },
    '8': { name: 'Rajasthan Royals', shortName: 'RR' },
    '9': { name: 'Kolkata Knight Riders', shortName: 'KKR' },
    '10': { name: 'Chennai Super Kings', shortName: 'CSK' },
  };

  const id = teamId != null ? String(teamId) : (teamObj && teamObj.id ? String(teamObj.id) : '');
  const found = mockTeams[id];

  return {
    id: id || '',
    name: (teamObj?.name) || (found?.name) || (id ? `Team ${id}` : 'Unknown'),
    shortName: (teamObj?.shortName) || (found?.shortName) || (found?.name) || 'TBD',
  };
}

/**
 * Notify users for a specific match
 */
async function notifyUsersForMatch(match, env, ctx) {
  try {
    const matchId = String(match.id);
    const team1Id = String(match.team1Id || (match.team1?.id) || '');
    const team2Id = String(match.team2Id || (match.team2?.id) || '');

    if (!team1Id || !team2Id) {
      console.log(`Skipping match ${matchId} - teams not found`);
      return;
    }

    const team1 = getTeamMeta(team1Id, match.team1);
    const team2 = getTeamMeta(team2Id, match.team2);

    // Get all users from KV (this is a pattern search)
    // Note: KV doesn't have a built-in list all keys, so we need to maintain a user index
    const userIndexRaw = await env.SPORTS_KV.get('users-index');
    if (!userIndexRaw) {
      console.log('No users index found');
      return;
    }

    let userEmails = [];
    try {
      userEmails = JSON.parse(userIndexRaw);
    } catch (e) {
      console.error('Error parsing users index:', e);
      return;
    }

    if (!Array.isArray(userEmails) || userEmails.length === 0) {
      console.log('No users to notify');
      return;
    }

    // Process each user
    const notificationPromises = [];
    for (const email of userEmails) {
      notificationPromises.push(
        notifyUserIfInterested(email, match, matchId, team1, team2, env)
      );
    }

    // Wait for all notifications
    await Promise.all(notificationPromises);

    console.log(`Completed notifications for match ${matchId}`);
  } catch (error) {
    console.error(`Error notifying users for match:`, error);
  }
}

/**
 * Check if user is interested in this match and notify if so
 */
async function notifyUserIfInterested(email, match, matchId, team1, team2, env) {
  try {
    // Get user data
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) return;

    const user = JSON.parse(userData);

    // Check if user has accepted terms
    if (!user.termsAccepted) {
      console.log(`User ${email} has not accepted terms`);
      return;
    }

    // Check if user has email notifications enabled
    if (user.emailNotificationsEnabled === false) {
      console.log(`User ${email} has disabled email notifications`);
      return;
    }

    // Check if user has favorite teams matching this match
    const favoriteTeamIds = Array.isArray(user.favoriteTeamIds)
      ? user.favoriteTeamIds.map((v) => String(v))
      : [];

    const team1Id = String(match.team1Id || (match.team1?.id) || '');
    const team2Id = String(match.team2Id || (match.team2?.id) || '');

    const involvesFavorite =
      favoriteTeamIds.includes(team1Id) || favoriteTeamIds.includes(team2Id);

    if (!involvesFavorite) {
      return; // User not interested in this match
    }

    // Check if we already sent a reminder for this match
    const emailLogKey = `email-log:${email}:${matchId}`;
    const existingLog = await env.SPORTS_KV.get(emailLogKey);
    if (existingLog) {
      console.log(`Already sent reminder for match ${matchId} to ${email}`);
      return;
    }

    // Send email via email service
    const emailResponse = await fetch('https://sportsup99.com/api/email-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send-match-reminder',
        email,
        matchId,
        team1,
        team2,
        venue: match.venue || 'TBD',
        time: match.time || '19:30',
        date: match.date || 'TBD',
      }),
    });

    if (emailResponse.ok) {
      console.log(`Sent reminder for match ${matchId} to ${email}`);
    } else {
      console.error(`Failed to send reminder for match ${matchId} to ${email}:`, await emailResponse.text());
    }
  } catch (error) {
    console.error(`Error notifying user ${email}:`, error);
  }
}
