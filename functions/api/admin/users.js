export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const email = await env.SPORTS_KV.get(`token:${token}`);
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userData = await env.SPORTS_KV.get(`user:${email}`);
    const user = JSON.parse(userData);

    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all active users
    if (pathname === '/api/admin/users' && method === 'GET') {
      const matchId = searchParams.get('matchId') || 'current';
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      const activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];

      return new Response(JSON.stringify({ users: activeUsers }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Block/Unblock user
    if (pathname === '/api/admin/users' && method === 'PUT') {
      const { userId, isBlocked, reason } = await request.json();

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get user email from userId
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);

      targetUser.isBlocked = isBlocked;
      if (reason) {
        targetUser.blockReason = reason;
        targetUser.blockedAt = new Date().toISOString();
      }

      await env.SPORTS_KV.put(`user:${userEmail}`, JSON.stringify(targetUser), {
        expirationTtl: 31536000,
      });

      return new Response(
        JSON.stringify({ success: true, user: targetUser }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete user
    if (pathname === '/api/admin/users' && method === 'DELETE') {
      const { userId } = await request.json();

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get user email from userId
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);

      // Delete all related data
      await env.SPORTS_KV.delete(`user:${userEmail}`);
      await env.SPORTS_KV.delete(`userId:${userId}`);
      if (targetUser.token) {
        await env.SPORTS_KV.delete(`token:${targetUser.token}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Track user activity (heartbeat)
    if (pathname === '/api/admin/users/activity' && method === 'POST') {
      const { matchId = 'current' } = await request.json();
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];

      // Remove duplicate entries for same user
      activeUsers = activeUsers.filter((u) => u.id !== user.id);

      // Add current user activity
      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: new Date().toISOString(),
      });

      // Keep only last 500 active users
      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }

      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600, // 1 hour - auto cleanup
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin users error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
