/**
 * Terms and Conditions Access Control
 * Centralized logic for checking terms acceptance and managing access
 */

/**
 * Routes that are accessible without terms acceptance
 * Users must accept terms to access any other route
 */
export const PUBLIC_ROUTES_WITHOUT_TERMS = [
  "/",                    // Home page - shows modal
  "/terms",               // Terms page - shows content only
  "/legal",
  "/privacy",
  "/rcb-lion", // Static page
  "/_next",
  "/api/legal", // API endpoint for fetching terms content
];

/**
 * Check if a route requires terms acceptance
 */
export function isProtectedRoute(pathname: string): boolean {
  // Check if path matches any public route
  return !PUBLIC_ROUTES_WITHOUT_TERMS.some(route => {
    if (route.endsWith("/")) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

/**
 * Get terms acceptance status from localStorage
 * Client-side only
 */
export function getTermsAcceptanceStatus(): {
  isAccepted: boolean;
  acceptedDate: string | null;
  version: string | null;
} {
  if (typeof window === "undefined") {
    return { isAccepted: false, acceptedDate: null, version: null };
  }

  const isAccepted = localStorage.getItem("terms_accepted") === "true";
  const acceptedDate = localStorage.getItem("terms_accepted_date");
  const version = localStorage.getItem("terms_version");

  return { isAccepted, acceptedDate, version };
}

/**
 * Check if user needs to re-accept terms (version update)
 */
export function needsTermsUpdate(requiredVersion: string = "1.0"): boolean {
  const { version } = getTermsAcceptanceStatus();
  return version !== requiredVersion;
}

/**
 * Get next protected route (redirect destination after terms acceptance)
 * Default: home page
 */
export function getNextRoute(currentPath?: string): string {
  if (!currentPath || currentPath === "/" || currentPath === "/terms") {
    return "/";
  }
  return currentPath;
}
