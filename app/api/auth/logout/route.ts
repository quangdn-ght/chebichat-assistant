import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[Auth Logout] Processing logout request");

  const redirectTo =
    new URL(req.url).searchParams.get("redirect_to") || "/login";

  // Create response
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear authentication cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0, // Expire immediately
    path: "/",
  };

  response.cookies.set("sb-access-token", "", cookieOptions);
  response.cookies.set("sb-refresh-token", "", cookieOptions);
  response.cookies.set("sb-user-info", "", {
    ...cookieOptions,
    httpOnly: false,
  });

  console.log("[Auth Logout] Authentication cookies cleared");

  return response;
}

export async function GET(req: NextRequest) {
  // Handle GET requests with redirect
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect_to") || "/login";

  console.log("[Auth Logout] Processing logout request with redirect");

  // Create redirect response
  const response = NextResponse.redirect(new URL(redirectTo, req.url));

  // Clear authentication cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0, // Expire immediately
    path: "/",
  };

  response.cookies.set("sb-access-token", "", cookieOptions);
  response.cookies.set("sb-refresh-token", "", cookieOptions);
  response.cookies.set("sb-user-info", "", {
    ...cookieOptions,
    httpOnly: false,
  });

  console.log(
    "[Auth Logout] Authentication cookies cleared, redirecting to:",
    redirectTo,
  );

  return response;
}
