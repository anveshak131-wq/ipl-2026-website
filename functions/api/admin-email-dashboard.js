/**
 * Cloudflare Pages Function for admin email dashboard
 * Provides analytics, user management, and email campaign management
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify admin token
    const adminToken = request.headers.get('X-Admin-Token');
    if (!adminToken || adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Route requests
    if (url.pathname.includes('/dashboard/stats')) {
      return await getDashboardStats(env, corsHeaders);
    }

    if (url.pathname.includes('/dashboard/segments')) {
      return await getSegmentStats(env, corsHeaders);
    }

    if (url.pathname.includes('/dashboard/campaigns')) {
      if (method === 'GET') {
        return await getCampaigns(env, corsHeaders);
      } else if (method === 'POST') {
        const body = await request.json();
        return await createCampaign(body, env, corsHeaders);
      }
    }

    if (url.pathname.includes('/dashboard/templates')) {
      return await getEmailTemplates(env, corsHeaders);
    }

    if (url.pathname.includes('/dashboard/ab-test')) {
      if (method === 'POST') {
        const body = await request.json();
        return await createABTest(body, env, corsHeaders);
      }
    }

    if (url.pathname.includes('/dashboard/users')) {
      if (method === 'GET') {
        const searchParam = url.searchParams.get('search');
        return await searchUsers(searchParam, env, corsHeaders);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Get overall email dashboard statistics
 */
async function getDashboardStats(env, corsHeaders) {
  try {
    const stats = {
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsBounced: 0,
      unsubscribed: 0,
      timestamp: new Date().toISOString(),
    };

    // In production, aggregate from analytics data
    const aggregated = await env.SPORTS_KV.get('dashboard-stats');
    if (aggregated) {
      const data = JSON.parse(aggregated);
      Object.assign(stats, data);
    }

    // Calculate rates
    stats.deliveryRate = stats.emailsSent > 0
      ? Math.round((stats.emailsDelivered / stats.emailsSent) * 100)
      : 0;
    stats.openRate = stats.emailsDelivered > 0
      ? Math.round((stats.emailsOpened / stats.emailsDelivered) * 100)
      : 0;
    stats.clickRate = stats.emailsDelivered > 0
      ? Math.round((stats.emailsClicked / stats.emailsDelivered) * 100)
      : 0;
    stats.bounceRate = stats.emailsSent > 0
      ? Math.round((stats.emailsBounced / stats.emailsSent) * 100)
      : 0;

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get stats' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get statistics by user segment
 */
async function getSegmentStats(env, corsHeaders) {
  try {
    const segments = {
      'super-fan': { users: 0, emails: 0, openRate: 0 },
      'regular-watcher': { users: 0, emails: 0, openRate: 0 },
      'casual-fan': { users: 0, emails: 0, openRate: 0 },
      'at-risk': { users: 0, emails: 0, openRate: 0 },
      'new-user': { users: 0, emails: 0, openRate: 0 },
      'engaged': { users: 0, emails: 0, openRate: 0 },
    };

    // In production, aggregate from segment data
    const segmentData = await env.SPORTS_KV.get('segment-stats');
    if (segmentData) {
      Object.assign(segments, JSON.parse(segmentData));
    }

    return new Response(
      JSON.stringify(segments),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get segment stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get segment stats' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get email campaigns
 */
async function getCampaigns(env, corsHeaders) {
  try {
    // Fetch all campaigns
    const campaigns = [];
    // In production, list campaigns from KV or database

    return new Response(
      JSON.stringify({ campaigns }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get campaigns error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get campaigns' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Create email campaign
 */
async function createCampaign(body, env, corsHeaders) {
  try {
    const { name, subject, template, targetSegments, schedule } = body;

    if (!name || !subject || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const campaign = {
      id: crypto.randomUUID(),
      name,
      subject,
      template,
      targetSegments: targetSegments || [],
      schedule: schedule || { type: 'immediate' },
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    await env.SPORTS_KV.put(
      `campaign:${campaign.id}`,
      JSON.stringify(campaign),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );

    return new Response(
      JSON.stringify({
        success: true,
        campaign,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Create campaign error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create campaign' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get email templates
 */
async function getEmailTemplates(env, corsHeaders) {
  try {
    const templates = {
      'match-reminder': {
        name: 'Match Reminder',
        description: '30-min before match notification',
        variables: ['team1', 'team2', 'venue', 'time', 'date'],
      },
      'team-news': {
        name: 'Team News',
        description: 'Daily team news digest',
        variables: ['teamName', 'headlines', 'topStory'],
      },
      'weekly-recap': {
        name: 'Weekly Recap',
        description: 'Weekly summary of matches and news',
        variables: ['week', 'matches', 'highlights'],
      },
      'special-offer': {
        name: 'Special Offer',
        description: 'Promotional offers and deals',
        variables: ['offerTitle', 'offerDescription', 'expiryDate'],
      },
      're-engagement': {
        name: 'Re-engagement',
        description: 'Win back inactive users',
        variables: ['userName', 'lastActive'],
      },
    };

    return new Response(
      JSON.stringify(templates),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get templates error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get templates' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Create A/B test
 */
async function createABTest(body, env, corsHeaders) {
  try {
    const { name, campaign, variants, trafficSplit, duration } = body;

    if (!name || !campaign || !Array.isArray(variants) || variants.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Need at least 2 variants' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const test = {
      id: crypto.randomUUID(),
      name,
      campaignId: campaign,
      variants: variants.map((v, i) => ({
        ...v,
        id: `variant-${i}`,
        conversions: 0,
        opens: 0,
        clicks: 0,
      })),
      trafficSplit: trafficSplit || [50, 50],
      duration: duration || 7, // days
      startedAt: new Date().toISOString(),
      winner: null,
      status: 'running',
    };

    await env.SPORTS_KV.put(
      `ab-test:${test.id}`,
      JSON.stringify(test),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );

    return new Response(
      JSON.stringify({
        success: true,
        test,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Create A/B test error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create A/B test' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Search users
 */
async function searchUsers(query, env, corsHeaders) {
  try {
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // In production, implement proper search with pagination
    const results = [];

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Search users error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to search users' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
