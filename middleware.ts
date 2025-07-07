import { NextRequest, NextResponse } from "next/server";
import { checkAuthWithRefresh } from "@/app/api/supabase";

// Define protected routes that require authentication
const PROTECTED_PATHS = [
  "/chat",
  "/settings", 
  "/profile",
  "/api/chat",
  "/api/user",
  // Add more protected paths as needed
];

// Define public routes that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup", 
  "/api/auth/callback",
  "/api/auth/logout",
  "/api/auth/check",
  // Add more public paths as needed
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("[Middleware] Processing request for:", pathname);

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if path is explicitly public (with more precise matching)
  const isPublicPath = PUBLIC_PATHS.some(path => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path || pathname.startsWith(path + "/");
  });

  if (isPublicPath) {
    console.log("[Middleware] Public path, allowing access");
    return NextResponse.next();
  }

  // Check if path requires authentication (with more precise matching)
  const isProtectedPath = PROTECTED_PATHS.some(path => {
    return pathname === path || pathname.startsWith(path + "/");
  });

  if (isProtectedPath) {
    console.log("[Middleware] Protected path, checking authentication");
    
    try {
      const authResult = await checkAuthWithRefresh(req);

      if (!authResult.user) {
        console.log("[Middleware] User not authenticated, redirecting to login");
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect_to", pathname);
        return NextResponse.redirect(loginUrl);
      }

      console.log("[Middleware] User authenticated:", authResult.user.email);

      // If token was refreshed, return the response with updated cookies
      if (authResult.needsRefresh && authResult.response) {
        console.log("[Middleware] Returning response with refreshed tokens");
        // Continue to the original destination
        authResult.response.headers.set("x-middleware-rewrite", req.url);
        return authResult.response;
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[Middleware] Auth check failed:", error);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect_to", pathname);
      loginUrl.searchParams.set("error", "auth_check_failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  // For all other paths, allow access without authentication
  console.log("[Middleware] Unprotected path, allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
