/**
 * Catch-all route handler for Cloudflare Pages
 * Delegates to static pages (managed by Next.js build)
 */

export const onRequest: PagesFunction = async (context) => {
  // This catch-all will only be reached if no other specific route matches
  // All /api/* routes should be handled by /functions/api/
  // All pages should be served from the static build output
  return context.next();
};
