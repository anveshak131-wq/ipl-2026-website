import {
  ADMIN_CSRF_HEADER,
  createAdminCsrfToken,
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
        'Access-Control-Allow-Headers': `Content-Type, Authorization, ${ADMIN_CSRF_HEADER}`,
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

  const csrfToken = await createAdminCsrfToken(env || {}, session);

  return jsonResponse({
    success: true,
    token: session.token,
    csrfToken,
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
      authProvider: 'google',
    },
  });
};
