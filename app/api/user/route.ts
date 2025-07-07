import { NextRequest, NextResponse } from "next/server";
import { checkAuthWithRefresh } from "../supabase";

export async function GET(req: NextRequest) {
  console.log("[User API] Processing user info request");

  try {
    const authResult = await checkAuthWithRefresh(req);

    if (!authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    console.log("[User API] Returning user info for:", authResult.user.email);

    // Create response
    const response = NextResponse.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        user_metadata: authResult.user.user_metadata,
        created_at: authResult.user.created_at,
        updated_at: authResult.user.updated_at,
        last_sign_in_at: authResult.user.last_sign_in_at,
      },
    });

    // If token was refreshed, merge the refreshed cookies
    if (authResult.needsRefresh && authResult.response) {
      authResult.response.cookies.getAll().forEach((cookie: any) => {
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
    console.error("[User API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  console.log("[User API] Processing user update request");

  try {
    const authResult = await checkAuthWithRefresh(req);

    if (!authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { user_metadata } = body;

    // Note: In a real application, you would update the user in Supabase here
    // For now, we'll just return the current user data
    console.log("[User API] User update requested for:", authResult.user.email);
    console.log("[User API] Update data:", user_metadata);

    // Create response
    const response = NextResponse.json({
      user: authResult.user,
      message: "User update functionality would be implemented here",
    });

    // If token was refreshed, merge the refreshed cookies
    if (authResult.needsRefresh && authResult.response) {
      authResult.response.cookies.getAll().forEach((cookie: any) => {
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
    console.error("[User API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update user information" },
      { status: 500 },
    );
  }
}
