/**
 * API endpoint to check if user has accepted terms
 * Can be called from server-side code
 * 
 * Usage:
 * const response = await fetch('/api/auth/check-terms');
 * const { accepted, version } = await response.json();
 */

import type { NextRequest } from "next/server";

export function GET(_request: NextRequest) {
  // Note: In a real application, you would:
  // 1. Check authentication cookies/tokens
  // 2. Query database for user's terms acceptance status
  // 3. Return server-side verified data
  
  // For now, this is a placeholder that indicates
  // client-side localStorage should be used
  
  return new Response(
    JSON.stringify({
      message: "Use client-side localStorage for terms acceptance checking",
      keys: {
        accepted: "terms_accepted",
        acceptedDate: "terms_accepted_date",
        version: "terms_version",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
