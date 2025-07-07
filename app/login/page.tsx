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
  const { login, authenticated } = useAuth();

  const redirectTo = searchParams.get("redirect_to") || "/";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (authenticated) {
      router.push(redirectTo);
    }
  }, [authenticated, redirectTo, router]);

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

  if (authenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your Supabase authentication token
          </p>
        </div>

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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              You can also authenticate by visiting:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                /api/auth/callback?token=YOUR_TOKEN
              </code>
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
