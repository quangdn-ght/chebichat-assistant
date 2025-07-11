import { NextRequest, NextResponse } from "next/server";
import { getUserStorageKey, checkUserAuth } from "../../auth";

/**
 * API endpoint to get the user's storage key for syncing data to UpStash Redis
 * GET /api/auth/storage-key
 *
 * Returns:
 * - If user is authenticated: user-specific storage key based on email
 * - If user is not authenticated: default storage key
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[Storage Key API] Processing request from:", req.url);
    console.log(
      "[Storage Key API] Has Authorization header:",
      !!req.headers.get("Authorization"),
    );
    console.log(
      "[Storage Key API] Has auth cookie:",
      !!req.cookies.get("sb-access-token"),
    );

    const authResult = await checkUserAuth(req);
    const storageKey = await getUserStorageKey(req);

    console.log("[Storage Key API] Auth result:", {
      authenticated: authResult.authenticated,
      userEmail: authResult.user?.email,
      storageKey: storageKey,
    });

    return NextResponse.json({
      success: true,
      storageKey: storageKey,
      authenticated: authResult.authenticated,
      userEmail: authResult.user?.email || null,
    });
  } catch (error) {
    console.error("[Storage Key API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get storage key",
        storageKey: "chebichat-backup", // Fallback to default
        authenticated: false,
        userEmail: null,
      },
      { status: 500 },
    );
  }
}
