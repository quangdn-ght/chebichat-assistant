import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  console.log("[Auth Refresh] Processing token refresh request");

  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  if (!refreshToken) {
    console.log("[Auth Refresh] No refresh token found");
    return NextResponse.json(
      { error: "No refresh token found" },
      { status: 401 },
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      console.error("[Auth Refresh] Token refresh failed:", error);
      return NextResponse.json(
        { error: "Token refresh failed", details: error },
        { status: 401 },
      );
    }

    console.log(
      "[Auth Refresh] Token refreshed successfully for user:",
      data.session.user.id,
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        user_metadata: data.session.user.user_metadata,
      },
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      },
    });

    // Update authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    response.cookies.set(
      "sb-access-token",
      data.session.access_token,
      cookieOptions,
    );

    if (data.session.refresh_token) {
      response.cookies.set(
        "sb-refresh-token",
        data.session.refresh_token,
        cookieOptions,
      );
    }

    // Update user info cookie
    response.cookies.set(
      "sb-user-info",
      JSON.stringify({
        id: data.session.user.id,
        email: data.session.user.email,
        user_metadata: data.session.user.user_metadata,
      }),
      {
        ...cookieOptions,
        httpOnly: false,
      },
    );

    return response;
  } catch (err) {
    console.error("[Auth Refresh] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
