/**
 * Cloudflare Pages Middleware
 * Ensures all functions receive proper context and request routing
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  
  // Add logging for debugging
  console.log(`[Middleware] ${request.method} ${new URL(request.url).pathname}`);

  // Pass request to next handler (the function file)
  return context.next();
};
