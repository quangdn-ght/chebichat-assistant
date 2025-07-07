import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export async function checkAuth(req: NextRequest) {
  // Use NextRequest.cookies API
  const authToken = req.cookies.get("sb-access-token")?.value;

  // console.log("[Supabase] authToken", authToken);

  if (!authToken) {
    // Không tìm thấy token xác thực
    console.log("[Supabase] No auth token found");
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      // Lỗi khi lấy thông tin người dùng
      console.error("[Supabase] Error getting user:", error);
      return null;
    }

    // Đã xác thực thành công, trả về thông tin người dùng
    console.log("[Supabase] Authenticated user:", data.user);
    return data.user;
  } catch (err) {
    // Lỗi khi lấy dữ liệu người dùng
    console.error("[Supabase] Error fetching user data:", err);
    return null;
  }
}

// Enhanced auth check with token refresh capability
export async function checkAuthWithRefresh(req: NextRequest): Promise<{
  user: any | null;
  response?: NextResponse;
  needsRefresh?: boolean;
}> {
  const authToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  if (!authToken) {
    console.log("[Supabase] No auth token found");
    return { user: null };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      // Token might be expired, try to refresh if refresh token is available
      if (refreshToken && error?.message?.includes("JWT expired")) {
        console.log("[Supabase] Access token expired, attempting refresh");

        try {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession({
              refresh_token: refreshToken,
            });

          if (refreshError || !refreshData?.session) {
            console.error("[Supabase] Token refresh failed:", refreshError);
            return { user: null };
          }

          console.log("[Supabase] Token refreshed successfully");

          // Create response with updated cookies
          const response = new NextResponse();
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
          };

          response.cookies.set(
            "sb-access-token",
            refreshData.session.access_token,
            cookieOptions,
          );

          if (refreshData.session.refresh_token) {
            response.cookies.set(
              "sb-refresh-token",
              refreshData.session.refresh_token,
              cookieOptions,
            );
          }

          // Update user info cookie
          response.cookies.set(
            "sb-user-info",
            JSON.stringify({
              id: refreshData.session.user.id,
              email: refreshData.session.user.email,
              user_metadata: refreshData.session.user.user_metadata,
            }),
            {
              ...cookieOptions,
              httpOnly: false,
            },
          );

          return {
            user: refreshData.session.user,
            response,
            needsRefresh: true,
          };
        } catch (refreshErr) {
          console.error("[Supabase] Error during token refresh:", refreshErr);
          return { user: null };
        }
      }

      console.error("[Supabase] Error getting user:", error);
      return { user: null };
    }

    console.log("[Supabase] Authenticated user:", data.user);
    return { user: data.user };
  } catch (err) {
    console.error("[Supabase] Error fetching user data:", err);
    return { user: null };
  }
}

// Utility function to get user info from cookie (client-side accessible)
export function getUserInfoFromCookie(req: NextRequest) {
  const userInfoCookie = req.cookies.get("sb-user-info")?.value;

  if (!userInfoCookie) {
    return null;
  }

  try {
    return JSON.parse(userInfoCookie);
  } catch (err) {
    console.error("[Supabase] Error parsing user info cookie:", err);
    return null;
  }
}

// Middleware helper to protect routes
export function createAuthMiddleware(protectedPaths: string[] = []) {
  return async function authMiddleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check if this path requires authentication
    const isProtectedPath = protectedPaths.some(
      (path) => pathname.startsWith(path) || pathname === path,
    );

    if (!isProtectedPath) {
      return NextResponse.next();
    }

    const authResult = await checkAuthWithRefresh(req);

    if (!authResult.user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If token was refreshed, return the response with updated cookies
    if (authResult.needsRefresh && authResult.response) {
      return authResult.response;
    }

    return NextResponse.next();
  };
}
