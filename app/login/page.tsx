"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

function LoginForm() {
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, authenticated, loading: authLoading } = useAuth();

  const redirectTo = searchParams.get("redirect_to") || "/";
  const errorParam = searchParams.get("error");
  const manualAuth = searchParams.get("manual") === "true"; // Allow manual token entry

  // Reused logic from auth.tsx
  const fetchAuthConfigAndRedirect = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/config");
      if (response.ok) {
        const config = await response.json();
        const redirectUrl =
          config.authLogin || "https://chebichat.ai/auth/login";
        console.log("LoginForm: Redirecting to auth URL:", redirectUrl);
        window.location.replace(redirectUrl);
      } else {
        // Fallback redirect if config fetch fails
        window.location.replace("https://chebichat.ai/auth/login");
      }
    } catch (error) {
      console.error("LoginForm: Failed to fetch auth config:", error);
      // Fallback redirect if error occurs
      window.location.replace("https://chebichat.ai/auth/login");
    }
  };

  useEffect(() => {
    if (authenticated) {
      router.push(redirectTo);
    }
  }, [authenticated, redirectTo, router]);

  // Immediate redirect for unauthenticated users (unless there's an error or manual token input)
  useEffect(() => {
    // Don't redirect if:
    // 1. Still loading authentication state
    // 2. Already authenticated
    // 3. There's an error parameter (user came back from failed auth)
    // 4. User has started entering a token (manual auth flow)
    // 5. Manual auth is explicitly requested via query param
    if (
      authLoading ||
      authenticated ||
      errorParam ||
      token.trim() ||
      manualAuth
    ) {
      return;
    }

    // Check if user is definitely not authenticated and redirect immediately
    if (!authenticated && !authLoading) {
      console.log("LoginForm: User not authenticated, redirecting immediately");
      setLoading(true); // Show loading state during redirect
      fetchAuthConfigAndRedirect();
    }
  }, [authenticated, authLoading, errorParam, token, manualAuth]);

  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case "no_token":
          setError("No authentication token provided");
          break;
        case "invalid_token":
          setError("Invalid authentication token");
          break;
        case "auth_failed":
          setError("Authentication failed");
          break;
        case "auth_check_failed":
          setError("Authentication check failed");
          break;
        default:
          setError("An error occurred during authentication");
      }
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please enter an access token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(token.trim(), refreshToken.trim() || undefined);
      router.push(redirectTo);
    } catch (err) {
      setError("Login failed. Please check your token and try again.");
    } finally {
      setLoading(false);
    }
  };

  // If still checking authentication, show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect immediately
  if (authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If automatic redirect is in progress, show loading
  if (loading && !manualAuth && !errorParam && !token.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to authentication...</p>
          <p className="mt-2 text-sm text-gray-500">
            If this takes too long, you can{" "}
            <a
              href="/login?manual=true"
              className="text-indigo-600 hover:text-indigo-500"
            >
              use manual token entry
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred authentication method
          </p>
        </div>

        {/* Direct Authentication Button */}
        <div className="mt-8">
          <button
            onClick={fetchAuthConfigAndRedirect}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 Login with ChebiChat Auth
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">
            Redirects to the main authentication page
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">
              Or use manual token
            </span>
          </div>
        </div>

        {/* Manual Token Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700"
            >
              Access Token *
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="refreshToken"
              className="block text-sm font-medium text-gray-700"
            >
              Refresh Token (optional)
            </label>
            <input
              id="refreshToken"
              name="refreshToken"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your refresh token (optional)"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in with Token"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Advanced: You can also authenticate by visiting:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                /api/auth/callback?token=YOUR_TOKEN
              </code>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Need manual token entry? Visit:{" "}
              <a
                href="/login?manual=true"
                className="text-indigo-600 hover:text-indigo-500"
              >
                /login?manual=true
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
