import {
  OAUTH_STATE_COOKIE,
  clearCookie,
  createAdminSessionCookie,
  exchangeGoogleCodeForTokens,
  htmlError,
  sanitizeReturnTo,
  upsertGoogleAdminUser,
  verifyGoogleIdToken,
  verifyOAuthState,
} from '../../../_adminAuth.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateFromQuery = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return htmlError(`Google sign-in was cancelled or denied: ${error}`, 400, {
      'Set-Cookie': clearCookie(OAUTH_STATE_COOKIE),
    });
  }

  if (!code || !stateFromQuery) {
    return htmlError('Google sign-in callback is missing required parameters.', 400, {
      'Set-Cookie': clearCookie(OAUTH_STATE_COOKIE),
    });
  }

  try {
    const state = await verifyOAuthState(request, env || {}, stateFromQuery);
    if (!state) {
      return htmlError('Google sign-in state is invalid or expired. Please try again.', 400, {
        'Set-Cookie': clearCookie(OAUTH_STATE_COOKIE),
      });
    }

    const tokens = await exchangeGoogleCodeForTokens(request, env || {}, code);
    const googleUser = await verifyGoogleIdToken(tokens.id_token, env || {});
    const adminUser = await upsertGoogleAdminUser(env || {}, googleUser);
    const { cookie: sessionCookie } = await createAdminSessionCookie(env || {}, adminUser);
    const returnTo = sanitizeReturnTo(state.returnTo);
    const headers = new Headers({
      Location: returnTo,
      'Cache-Control': 'no-store',
    });

    headers.append('Set-Cookie', sessionCookie);
    headers.append('Set-Cookie', clearCookie(OAUTH_STATE_COOKIE));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (callbackError) {
    console.error('Google admin sign-in failed:', callbackError);
    return htmlError(
      callbackError instanceof Error ? callbackError.message : 'Google admin sign-in failed.',
      401,
      { 'Set-Cookie': clearCookie(OAUTH_STATE_COOKIE) },
    );
  }
};
