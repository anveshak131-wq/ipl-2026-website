/**
 * Cloudflare Pages Function for user segmentation and personalization
 * Handles user segments, behavioral tracking, and personalization rules
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let email = tokenValue;
    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed?.email) email = parsed.email;
      } catch (e) {
        // fall back
      }
    }

    // GET: Get user segment
    if (method === 'GET' && url.pathname.includes('/segment')) {
      return await getUserSegment(email, env, corsHeaders);
    }

    // POST: Track engagement event
    if (method === 'POST' && url.pathname.includes('/track')) {
      const body = await request.json();
      return await trackEngagement(email, body, env, corsHeaders);
    }

    // GET: Get personalization rules
    if (method === 'GET' && url.pathname.includes('/personalization')) {
      return await getPersonalization(email, env, corsHeaders);
    }

    // PUT: Update engagement history
    if (method === 'PUT') {
      const body = await request.json();
      return await updateEngagementHistory(email, body, env, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('User segmentation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Get user segment based on behavior
 */
async function getUserSegment(email, env, corsHeaders) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    const engagement = await env.SPORTS_KV.get(`engagement:${email}`);
    const engagementData = engagement ? JSON.parse(engagement) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0,
    };

    // Calculate segment based on engagement
    const segment = calculateSegment(user, engagementData);

    return new Response(
      JSON.stringify({
        email,
        segment,
        engagement: engagementData,
        recommendations: getSegmentRecommendations(segment),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get user segment error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get segment' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Calculate user segment
 */
function calculateSegment(user, engagement) {
  const emailEngagement = {
    openRate: engagement.emailsOpened / Math.max(engagement.emailsSent || 1, 1),
    clickRate: engagement.emailsClicked / Math.max(engagement.emailsOpened || 1, 1),
  };

  const activityScore = 
    (engagement.emailsOpened || 0) * 0.3 +
    (engagement.matchesWatched || 0) * 0.4 +
    (engagement.chatMessages || 0) * 0.2 +
    (engagement.newsRead || 0) * 0.1;

  // At-risk: Low engagement for 30+ days
  const lastActive = engagement.lastActiveAt ? new Date(engagement.lastActiveAt) : null;
  const daysSinceActive = lastActive ? 
    Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000)) : 30;

  if (daysSinceActive > 30 && activityScore < 2) {
    return {
      name: 'at-risk',
      label: 'At-Risk Subscriber',
      description: 'Low engagement, no activity in 30+ days',
      emailFrequency: 'weekly',
      contentType: 're-engagement',
    };
  }

  // Super fans: High engagement across all channels
  if (activityScore > 10 && engagement.chatMessages > 5 && engagement.matchesWatched > 3) {
    return {
      name: 'super-fan',
      label: 'Super Fan',
      description: 'High engagement, active across all features',
      emailFrequency: 'daily',
      contentType: 'exclusive',
      includes: ['previews', 'insider-tips', 'expert-analysis'],
    };
  }

  // Regular watchers: Moderate engagement
  if (activityScore > 5 && engagement.matchesWatched > 1) {
    return {
      name: 'regular-watcher',
      label: 'Regular Watcher',
      description: 'Moderate engagement, watches matches regularly',
      emailFrequency: 'daily',
      contentType: 'match-reminders',
      includes: ['match-updates', 'team-news'],
    };
  }

  // Casual fans: Low engagement, minimal activity
  if (activityScore > 0) {
    return {
      name: 'casual-fan',
      label: 'Casual Fan',
      description: 'Low engagement, occasional activity',
      emailFrequency: 'weekly',
      contentType: 'digest',
      includes: ['weekly-summary', 'top-matches'],
    };
  }

  // New users: Just signed up
  if (!lastActive || daysSinceActive < 1) {
    return {
      name: 'new-user',
      label: 'New User',
      description: 'Recently joined',
      emailFrequency: 'immediate',
      contentType: 'onboarding',
      includes: ['welcome', 'getting-started', 'featured-teams'],
    };
  }

  // Default: Engaged
  return {
    name: 'engaged',
    label: 'Engaged User',
    description: 'Regular engagement',
    emailFrequency: 'daily',
    contentType: 'personalized',
  };
}

/**
 * Get recommendations for segment
 */
function getSegmentRecommendations(segment) {
  const recommendations = {
    'at-risk': [
      'Send re-engagement email with special offer',
      'Simplify preference options',
      'Highlight new teams/features',
      'Offer SMS as alternative',
    ],
    'super-fan': [
      'Offer premium features',
      'Send exclusive previews',
      'Include insider analysis',
      'Feature user in community',
    ],
    'regular-watcher': [
      'Send all match reminders',
      'Include team news',
      'Highlight favorite team updates',
      'Suggest similar teams',
    ],
    'casual-fan': [
      'Send weekly digest',
      'Highlight top matches',
      'Suggest interesting teams',
      'Keep emails short',
    ],
    'new-user': [
      'Send welcome series',
      'Explain key features',
      'Suggest favorite teams',
      'Build engagement gradually',
    ],
    'engaged': [
      'Maintain current email frequency',
      'Personalize based on preferences',
      'Test new content formats',
      'Gather feedback',
    ],
  };

  return recommendations[segment.name] || [];
}

/**
 * Track engagement event
 */
async function trackEngagement(email, body, env, corsHeaders) {
  try {
    const { eventType, matchId, duration, metadata } = body;

    const engagementKey = `engagement:${email}`;
    const current = await env.SPORTS_KV.get(engagementKey);
    const engagement = current ? JSON.parse(current) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0,
      emailsSent: 0,
      lastActiveAt: null,
      history: [],
    };

    // Update engagement based on event type
    switch (eventType) {
      case 'email-opened':
        engagement.emailsOpened += 1;
        break;
      case 'email-clicked':
        engagement.emailsClicked += 1;
        break;
      case 'match-watched':
        engagement.matchesWatched += 1;
        if (matchId) engagement.lastWatchedMatch = matchId;
        break;
      case 'chat-message':
        engagement.chatMessages += 1;
        break;
      case 'news-read':
        engagement.newsRead += 1;
        break;
    }

    engagement.lastActiveAt = new Date().toISOString();

    // Store event in history
    engagement.history = engagement.history || [];
    engagement.history.push({
      eventType,
      timestamp: new Date().toISOString(),
      matchId,
      duration,
      metadata,
    });

    // Keep only last 100 events
    if (engagement.history.length > 100) {
      engagement.history = engagement.history.slice(-100);
    }

    await env.SPORTS_KV.put(engagementKey, JSON.stringify(engagement), {
      expirationTtl: 365 * 24 * 60 * 60, // 1 year
    });

    return new Response(
      JSON.stringify({
        success: true,
        eventType,
        engagement,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Track engagement error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track engagement' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get personalization rules for user
 */
async function getPersonalization(email, env, corsHeaders) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    const engagement = await env.SPORTS_KV.get(`engagement:${email}`);
    const engagementData = engagement ? JSON.parse(engagement) : {};

    const segment = calculateSegment(user, engagementData);

    const personalization = {
      greeting: `Hi ${user.name}`,
      favoriteTeams: user.favoriteTeamIds || [],
      lastWatchedMatch: engagementData.lastWatchedMatch,
      recommendedTeams: getRecommendedTeams(user, engagementData),
      contentPreferences: {
        matchReminders: true,
        teamNews: true,
        playerStats: engagementData.newsRead > 5,
        expertAnalysis: segment.name === 'super-fan',
        sponsorContent: segment.name !== 'at-risk',
      },
      sendTime: user.preferredSendTime || '19:00',
      timezone: user.timezone || 'UTC',
      language: user.preferredLanguage || 'en',
    };

    return new Response(
      JSON.stringify({
        email,
        segment,
        personalization,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get personalization error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get personalization' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get recommended teams based on engagement
 */
function getRecommendedTeams(user, engagement) {
  // Simple recommendation: suggest teams not in favorites with similar attributes
  const teamMap = {
    '1': { name: 'RCB', color: '#EC1C24' },
    '2': { name: 'MI', color: '#004BA0' },
    '3': { name: 'SRH', color: '#FF822A' },
    '4': { name: 'GT', color: '#E15454' },
    '5': { name: 'PBKS', color: '#ED1D24' },
    '6': { name: 'DC', color: '#EF1B26' },
    '7': { name: 'LSG', color: '#9C2A2C' },
    '8': { name: 'RR', color: '#EA1A85' },
    '9': { name: 'KKR', color: '#3A225D' },
    '10': { name: 'CSK', color: '#FFFF00' },
  };

  const favorites = user.favoriteTeamIds || [];
  const all = Object.keys(teamMap);
  const notFavorites = all.filter(id => !favorites.includes(id));

  // Return top 3 recommendations
  return notFavorites.slice(0, 3).map(id => ({
    id,
    name: teamMap[id].name,
    reason: 'Similar to your favorite teams',
  }));
}

/**
 * Update engagement history
 */
async function updateEngagementHistory(email, body, env, corsHeaders) {
  try {
    const { events } = body;

    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: 'events must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const engagementKey = `engagement:${email}`;
    const current = await env.SPORTS_KV.get(engagementKey);
    const engagement = current ? JSON.parse(current) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0,
      history: [],
    };

    // Batch add events
    events.forEach(event => {
      switch (event.eventType) {
        case 'email-opened':
          engagement.emailsOpened += 1;
          break;
        case 'email-clicked':
          engagement.emailsClicked += 1;
          break;
        case 'match-watched':
          engagement.matchesWatched += 1;
          break;
        case 'chat-message':
          engagement.chatMessages += 1;
          break;
        case 'news-read':
          engagement.newsRead += 1;
          break;
      }

      engagement.history.push(event);
    });

    engagement.lastActiveAt = new Date().toISOString();

    // Keep only last 100 events
    if (engagement.history.length > 100) {
      engagement.history = engagement.history.slice(-100);
    }

    await env.SPORTS_KV.put(engagementKey, JSON.stringify(engagement), {
      expirationTtl: 365 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({
        success: true,
        engagement,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Update engagement error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update engagement' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
