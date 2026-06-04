import {
  createOAuthState,
  getGoogleOAuthConfig,
  getGoogleRedirectUri,
  sanitizeReturnTo,
} from '../../../_adminAuth.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const { clientId, clientSecret, sessionSecret } = getGoogleOAuthConfig(env || {});

  if (!clientId || !clientSecret || !sessionSecret) {
    return new Response(
      JSON.stringify({
        error: 'Google admin login is not configured',
        required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'ADMIN_SESSION_SECRET'],
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  const returnTo = sanitizeReturnTo(url.searchParams.get('return_to'));
  const { signedState, cookie } = await createOAuthState(request, env || {}, returnTo);

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', getGoogleRedirectUri(request, env || {}));
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', signedState);
  googleUrl.searchParams.set('prompt', 'select_account');
  googleUrl.searchParams.set('access_type', 'online');

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleUrl.toString(),
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
};
