/**
 * API endpoint to receive terms decline feedback
 * Logs user feedback when they decline terms and conditions
 * 
 * Usage:
 * POST /api/legal/decline-feedback
 * Body: {
 *   reason: string,
 *   version: string,
 *   language: string,
 *   timestamp: ISO string
 * }
 */

import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reason, version, language, timestamp } = body;

    // Log decline feedback (in production, save to database)
    const feedbackRecord = {
      reason,
      version,
      language,
      timestamp,
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      recordedAt: new Date().toISOString(),
    };

    // Console log for development (replace with database save in production)
    console.log("Terms Decline Feedback:", feedbackRecord);

    // TODO: In production, save to database:
    // const result = await db.collection('terms_decline_feedback').insertOne(feedbackRecord);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Feedback recorded successfully",
        id: `feedback-${Date.now()}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing decline feedback:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process feedback",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
