import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "../../auth";

/**
 * Test endpoint to verify user authentication and storage key functionality
 * GET /api/test/user-info
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await checkUserAuth(req);

    return NextResponse.json({
      success: true,
      authenticated: authResult.authenticated,
      user: authResult.user
        ? {
            id: authResult.user.id,
            email: authResult.user.email,
            email_confirmed_at: authResult.user.email_confirmed_at,
          }
        : null,
      storageKey: authResult.storageKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Test User Info] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user info",
        authenticated: false,
        user: null,
        storageKey: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
