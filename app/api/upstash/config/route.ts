import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to get UpStash configuration
 * This returns the server-side environment variables for UpStash
 */
export async function GET(request: NextRequest) {
  try {
    const upstashConfig = {
      endpoint:
        process.env.KV_REST_API_URL ||
        "https://your-upstash-redis-url.upstash.io",
      apiKey: process.env.KV_REST_API_TOKEN || "your-upstash-redis-token",
      // Only return masked version of the API key for security
      maskedApiKey: process.env.KV_REST_API_TOKEN
        ? `${process.env.KV_REST_API_TOKEN.substring(0, 8)}${"*".repeat(16)}`
        : "your-upstash-redis-token",
    };

    return NextResponse.json(upstashConfig);
  } catch (error) {
    console.error("[API] Error getting UpStash config:", error);
    return NextResponse.json(
      { error: "Failed to get UpStash configuration" },
      { status: 500 },
    );
  }
}
