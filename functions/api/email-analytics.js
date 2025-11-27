/**
 * Cloudflare Pages Function for email analytics & event tracking
 * Handles email delivery events, opens, clicks, bounces
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Public webhook endpoints (from email providers)
    if (url.pathname.includes('/webhooks/')) {
      return await handleWebhook(request, env, corsHeaders);
    }

    // Authenticated endpoints
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

    // GET: Get analytics for user
    if (method === 'GET') {
      const range = url.searchParams.get('range') || '30'; // days
      return await getAnalytics(email, range, env, corsHeaders);
    }

    // POST: Record custom event
    if (method === 'POST') {
      const body = await request.json();
      return await recordEvent(email, body, env, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Email analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Handle webhooks from email providers
 */
async function handleWebhook(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const event = detectProvider(body);

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Unknown provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Store event in analytics
    await storeAnalyticsEvent(event, env);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process webhook' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Detect email provider and normalize event
 */
function detectProvider(body) {
  // Resend webhook format
  if (body.type && body.data?.email) {
    return {
      provider: 'resend',
      type: body.type,
      email: body.data.email,
      messageId: body.data.id,
      timestamp: new Date(body.created_at).getTime(),
      raw: body,
    };
  }

  // SendGrid webhook format
  if (Array.isArray(body) && body[0]?.email) {
    return body.map((event) => ({
      provider: 'sendgrid',
      type: event.event,
      email: event.email,
      messageId: event.message_id,
      timestamp: event.timestamp * 1000,
      raw: event,
    }));
  }

  // Mailgun webhook format
  if (body.signature && body['event-data']) {
    const eventData = body['event-data'];
    return {
      provider: 'mailgun',
      type: eventData.severity === 'permanent' ? 'bounce' : eventData.event,
      email: eventData.recipient,
      messageId: eventData.message.id,
      timestamp: eventData.timestamp * 1000,
      raw: body,
    };
  }

  // Elastic Email webhook format
  if (body.status && body.email && body.messageid) {
    return {
      provider: 'elastic-email',
      type: normalizeElasticEmailEvent(body.status),
      email: body.email,
      messageId: body.messageid,
      timestamp: body.dateSent ? new Date(body.dateSent).getTime() : Date.now(),
      raw: body,
    };
  }

  return null;
}

/**
 * Normalize Elastic Email event type to standard format
 */
function normalizeElasticEmailEvent(elasticStatus) {
  const statusMap = {
    'Sent': 'email-sent',
    'Delivered': 'email-delivered',
    'Opened': 'email-opened',
    'Clicked': 'email-clicked',
    'Bounced': 'bounce',
    'AbuseReport': 'complained',
    'Unsubscribed': 'unsubscribed',
    'Failed': 'failed',
  };
  return statusMap[elasticStatus] || elasticStatus.toLowerCase();
}

/**
 * Store analytics event in KV
 */
async function storeAnalyticsEvent(event, env) {
  const events = Array.isArray(event) ? event : [event];

  for (const evt of events) {
    const key = `analytics:${evt.email}:${evt.messageId}:${evt.type}`;
    const data = {
      provider: evt.provider,
      type: evt.type,
      email: evt.email,
      messageId: evt.messageId,
      timestamp: evt.timestamp,
      date: new Date(evt.timestamp).toISOString(),
    };

    await env.SPORTS_KV.put(key, JSON.stringify(data), {
      expirationTtl: 90 * 24 * 60 * 60, // 90 days
    });

    // Also store in summary
    const summaryKey = `analytics-summary:${evt.email}`;
    const summary = await env.SPORTS_KV.get(summaryKey);
    const summaryData = summary ? JSON.parse(summary) : { total: 0, events: {} };

    summaryData.total += 1;
    summaryData.events[evt.type] = (summaryData.events[evt.type] || 0) + 1;
    summaryData.lastUpdated = new Date().toISOString();

    await env.SPORTS_KV.put(summaryKey, JSON.stringify(summaryData), {
      expirationTtl: 90 * 24 * 60 * 60,
    });
  }
}

/**
 * Get analytics for user
 */
async function getAnalytics(email, rangeParam, env, corsHeaders) {
  try {
    const range = Math.min(parseInt(rangeParam) || 30, 365); // Max 1 year
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    const summaryKey = `analytics-summary:${email}`;
    const summary = await env.SPORTS_KV.get(summaryKey);
    const summaryData = summary ? JSON.parse(summary) : { total: 0, events: {} };

    // Calculate rates
    const metrics = {
      totalEmails: summaryData.events.sent || 0,
      delivered: summaryData.events.delivered || 0,
      opened: summaryData.events.opened || 0,
      clicked: summaryData.events.clicked || 0,
      bounced: summaryData.events.bounce || 0,
      complained: summaryData.events.complained || 0,
      unsubscribed: summaryData.events.unsubscribed || 0,
    };

    metrics.deliveryRate = metrics.totalEmails > 0
      ? Math.round((metrics.delivered / metrics.totalEmails) * 100)
      : 0;
    metrics.openRate = metrics.delivered > 0
      ? Math.round((metrics.opened / metrics.delivered) * 100)
      : 0;
    metrics.clickRate = metrics.delivered > 0
      ? Math.round((metrics.clicked / metrics.delivered) * 100)
      : 0;
    metrics.bounceRate = metrics.totalEmails > 0
      ? Math.round((metrics.bounced / metrics.totalEmails) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        email,
        range: `${range} days`,
        startDate: startDate.toISOString(),
        metrics,
        events: summaryData.events,
        lastUpdated: summaryData.lastUpdated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Record custom event
 */
async function recordEvent(email, body, env, corsHeaders) {
  try {
    const { eventType, matchId, action, metadata } = body;

    if (!eventType) {
      return new Response(
        JSON.stringify({ error: 'eventType required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const event = {
      email,
      type: eventType,
      action: action || 'custom',
      matchId,
      metadata,
      timestamp: new Date().toISOString(),
    };

    const key = `custom-event:${email}:${Date.now()}`;
    await env.SPORTS_KV.put(key, JSON.stringify(event), {
      expirationTtl: 90 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Record event error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record event' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
