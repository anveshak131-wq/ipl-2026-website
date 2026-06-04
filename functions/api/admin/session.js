import {
  jsonResponse,
  verifyAdminSession,
} from '../../_adminAuth.js';

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const session = await verifyAdminSession(request, env || {});

  if (!session) {
    return jsonResponse({ error: 'Google admin sign-in required' }, 401);
  }

  return jsonResponse({
    success: true,
    token: session.token,
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
      authProvider: 'google',
    },
  });
};
