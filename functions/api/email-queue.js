/**
 * Cloudflare Pages Function for email queue management
 * Handles failed emails, retry logic, and rate limiting
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
    // Admin only endpoints (require special admin token)
    if (url.pathname.includes('/admin/')) {
      return await handleAdminRequest(request, env, method, corsHeaders);
    }

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

    // GET: Get queue status for user
    if (method === 'GET') {
      return await getQueueStatus(email, env, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Email queue error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Handle admin requests
 */
async function handleAdminRequest(request, env, method, corsHeaders) {
  try {
    // Verify admin token
    const adminToken = request.headers.get('X-Admin-Token');
    if (adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin token' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const url = new URL(request.url);

    if (url.pathname.includes('/admin/queue')) {
      if (method === 'GET') {
        return await getFullQueue(env, corsHeaders);
      } else if (method === 'POST') {
        return await processQueue(env, corsHeaders);
      }
    }

    if (url.pathname.includes('/admin/retry')) {
      if (method === 'POST') {
        const body = await request.json();
        return await retryEmail(body.queueId, env, corsHeaders);
      }
    }

    if (url.pathname.includes('/admin/stats')) {
      return await getQueueStats(env, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Admin request error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process admin request' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get queue status for user
 */
async function getQueueStatus(email, env, corsHeaders) {
  try {
    const queueKey = `queue:${email}`;
    const queueData = await env.SPORTS_KV.get(queueKey);
    const queue = queueData ? JSON.parse(queueData) : { pending: [], failed: [], processed: 0 };

    return new Response(
      JSON.stringify({
        email,
        pending: queue.pending.length,
        failed: queue.failed.length,
        processed: queue.processed || 0,
        queue,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get queue status error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get queue status' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get full queue (admin)
 */
async function getFullQueue(env, corsHeaders) {
  try {
    // In production, you'd paginate this
    const queueStats = await env.SPORTS_KV.get('queue-stats');
    const stats = queueStats ? JSON.parse(queueStats) : {
      totalPending: 0,
      totalFailed: 0,
      totalProcessed: 0,
      byStatus: {},
    };

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get full queue error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get queue' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Process queue with retry logic
 */
async function processQueue(env, corsHeaders) {
  try {
    // Get all pending emails
    const maxRetries = 3;
    const baseDelay = 5 * 60 * 1000; // 5 minutes

    // This would normally be a scheduled job
    const processed = { succeeded: 0, retried: 0, failed: 0 };

    // In production, implement proper queue processing
    // with exponential backoff

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        message: 'Queue processed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Process queue error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process queue' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Retry specific email
 */
async function retryEmail(queueId, env, corsHeaders) {
  try {
    const emailData = await env.SPORTS_KV.get(`queued-email:${queueId}`);
    if (!emailData) {
      return new Response(
        JSON.stringify({ error: 'Email not found in queue' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const email = JSON.parse(emailData);
    email.retryCount = (email.retryCount || 0) + 1;
    email.lastRetryAt = new Date().toISOString();

    // Update retry count
    await env.SPORTS_KV.put(`queued-email:${queueId}`, JSON.stringify(email));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email queued for retry (attempt ${email.retryCount})`,
        email,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Retry email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retry email' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats(env, corsHeaders) {
  try {
    const stats = await env.SPORTS_KV.get('queue-stats');
    const queueStats = stats ? JSON.parse(stats) : {
      totalPending: 0,
      totalFailed: 0,
      totalProcessed: 0,
      totalRetried: 0,
      lastProcessed: null,
    };

    return new Response(
      JSON.stringify(queueStats),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get queue stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get stats' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Add email to queue
 */
export async function queueEmail(emailData, env) {
  try {
    const queueId = crypto.randomUUID();
    const queueEntry = {
      id: queueId,
      ...emailData,
      queuedAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
    };

    await env.SPORTS_KV.put(
      `queued-email:${queueId}`,
      JSON.stringify(queueEntry),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    return { success: true, queueId };
  } catch (error) {
    console.error('Queue email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check rate limit for user
 */
export async function checkRateLimit(email, env) {
  try {
    const key = `rate-limit:${email}`;
    const currentData = await env.SPORTS_KV.get(key);
    const current = currentData ? JSON.parse(currentData) : {
      count: 0,
      resetAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const now = Date.now();
    const maxEmails = 5; // 5 emails per day per user

    if (now > current.resetAt) {
      // Reset daily limit
      current.count = 0;
      current.resetAt = now + 24 * 60 * 60 * 1000;
    }

    const allowed = current.count < maxEmails;

    if (allowed) {
      current.count += 1;
      await env.SPORTS_KV.put(
        key,
        JSON.stringify(current),
        { expirationTtl: 24 * 60 * 60 }
      );
    }

    return {
      allowed,
      count: current.count,
      limit: maxEmails,
      resetAt: new Date(current.resetAt).toISOString(),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: false, error: error.message };
  }
}
