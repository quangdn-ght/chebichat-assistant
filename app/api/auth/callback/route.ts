import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const authToken = url.searchParams.get("token");
  const access_token = url.searchParams.get("access_token");
  const refresh_token = url.searchParams.get("refresh_token");
  const redirectTo = url.searchParams.get("redirect_to") || "/";

  console.log("[Auth Callback] Processing authentication callback");
  console.log("[Auth Callback] authToken:", authToken);
  console.log("[Auth Callback] access_token:", access_token);
  console.log("[Auth Callback] refresh_token:", refresh_token);

  // Use either authToken or access_token (flexible for different auth flows)
  const token = authToken || access_token;

  if (!token) {
    console.log(
      "[Auth Callback] No authentication token found in query string",
    );
    return NextResponse.redirect(new URL("/login?error=no_token", req.url));
  }

  try {
    // Validate the token with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      console.error("[Auth Callback] Invalid token:", error);
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url),
      );
    }

    console.log(
      "[Auth Callback] Token validated successfully for user:",
      data.user.id,
    );

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectTo, req.url));

    // Set authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    // Set access token cookie
    response.cookies.set("sb-access-token", token, cookieOptions);

    // Set refresh token if available
    if (refresh_token) {
      response.cookies.set("sb-refresh-token", refresh_token, cookieOptions);
    }

    // Set user info cookie (optional, for quick access)
    response.cookies.set(
      "sb-user-info",
      JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      }),
      {
        ...cookieOptions,
        httpOnly: false, // Allow client-side access for user info
      },
    );

    console.log("[Auth Callback] Authentication cookies set successfully");

    return response;
  } catch (err) {
    console.error("[Auth Callback] Error processing authentication:", err);
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}

export async function POST(req: NextRequest) {
  // Handle POST requests for programmatic token setting
  try {
    const body = await req.json();
    const { access_token, refresh_token, redirect_to = "/" } = body;

    if (!access_token) {
      return NextResponse.json(
        { error: "access_token is required" },
        { status: 400 },
      );
    }

    // Validate the token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        { error: "Invalid token", details: error },
        { status: 401 },
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      },
      redirect_to,
    });

    // Set authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    response.cookies.set("sb-access-token", access_token, cookieOptions);

    if (refresh_token) {
      response.cookies.set("sb-refresh-token", refresh_token, cookieOptions);
    }

    response.cookies.set(
      "sb-user-info",
      JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      }),
      {
        ...cookieOptions,
        httpOnly: false,
      },
    );

    return response;
  } catch (err) {
    console.error("[Auth Callback POST] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
