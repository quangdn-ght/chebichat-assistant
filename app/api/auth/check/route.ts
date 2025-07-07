// /app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkAuthWithRefresh, getUserInfoFromCookie } from "../../supabase";

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAuthWithRefresh(req);
    const userInfo = getUserInfoFromCookie(req);

    console.log("[Auth Check] user:", authResult.user?.email || "none");

    if (!authResult.user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "No valid authentication found",
        },
        { status: 401 },
      );
    }

    // Create response
    const response = NextResponse.json({
      authenticated: true,
      user: authResult.user,
      userInfo: userInfo, // Include cached user info for quick access
    });

    // If token was refreshed, merge the refreshed cookies
    if (authResult.needsRefresh && authResult.response) {
      // Copy cookies from refresh response
      authResult.response.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path,
        });
      });
    }

    return response;
  } catch (error) {
    console.error("[Auth Check] Error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Authentication check failed",
      },
      { status: 500 },
    );
  }
}
