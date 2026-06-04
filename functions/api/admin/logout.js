import {
  ADMIN_SESSION_COOKIE,
  clearCookie,
  jsonResponse,
  revokeAdminSessionToken,
  verifyAdminSession,
} from '../../_adminAuth.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  const session = await verifyAdminSession(request, env || {});

  if (session?.token) {
    await revokeAdminSessionToken(env || {}, session.token);
  }

  const headers = {
    'Set-Cookie': clearCookie(ADMIN_SESSION_COOKIE),
  };

  if (request.method === 'GET') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/ipl-admin-2026',
        'Cache-Control': 'no-store',
        ...headers,
      },
    });
  }

  return jsonResponse({ success: true }, 200, headers);
};
