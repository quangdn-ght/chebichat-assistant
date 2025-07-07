"use client";

import React, { useState, useEffect } from "react";

export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAuthState({
            user: data.user,
            loading: false,
            authenticated: true,
          });
          return data.user;
        }
      }

      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      return null;
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      return null;
    }
  };

  const login = async (accessToken: string, refreshToken?: string) => {
    try {
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        });
        return data.user;
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        });
        return data.user;
      } else {
        // Refresh failed, user needs to login again
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        });
        return null;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      return null;
    }
  };

  const getUserFromCookie = () => {
    if (typeof window === "undefined") return null;

    try {
      const userInfoCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-user-info="));

      if (userInfoCookie) {
        const userInfo = decodeURIComponent(userInfoCookie.split("=")[1]);
        return JSON.parse(userInfo);
      }
    } catch (error) {
      console.error("Error reading user cookie:", error);
    }

    return null;
  };

  useEffect(() => {
    // Try to get user from cookie first for faster initial load
    const cachedUser = getUserFromCookie();
    if (cachedUser) {
      setAuthState({
        user: cachedUser,
        loading: true, // Still check with server
        authenticated: true,
      });
    }

    // Then verify with server
    checkAuth();
  }, []);

  return {
    ...authState,
    checkAuth,
    login,
    logout,
    refreshToken,
    getUserFromCookie,
  };
}

// Higher-order component for protecting routes
export function withAuth<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
) {
  const AuthenticatedComponent = (props: T) => {
    const { authenticated, loading } = useAuth();

    useEffect(() => {
      if (!loading && !authenticated) {
        // Redirect to login if not authenticated
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect_to=${encodeURIComponent(
          currentPath,
        )}`;
      }
    }, [authenticated, loading]);

    if (loading) {
      return React.createElement("div", null, "Loading...");
    }

    if (!authenticated) {
      return React.createElement("div", null, "Redirecting to login...");
    }

    return React.createElement(Component, props);
  };

  AuthenticatedComponent.displayName = `withAuth(${
    Component.displayName || Component.name
  })`;

  return AuthenticatedComponent;
}
