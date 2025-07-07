"use client";

import React from "react";
import { useAuth } from "@/app/hooks/useAuth";

export default function AuthDemoPage() {
  const { user, authenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            🔐 Authentication System Demo
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Authentication Status Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Authentication Status
            </h2>

            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 w-24">
                  Status:
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    authenticated
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {authenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
                </span>
              </div>

              {user?.id && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-24">
                    User ID:
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {user.id}
                  </span>
                </div>
              )}

              {user?.email && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-24">
                    Email:
                  </span>
                  <span className="text-sm text-gray-900">{user.email}</span>
                </div>
              )}
            </div>

            {authenticated && (
              <div className="mt-6">
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                🔑 Login Page
              </a>

              <a
                href="/profile"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                👤 Profile Page (Protected)
              </a>

              <a
                href="/api/auth/check"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ✅ Check Auth API
              </a>
            </div>
          </div>

          {/* Authentication Flow Card */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              🔄 Authentication Flow
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  1. Token Authentication via URL
                </h3>
                <code className="text-xs text-gray-600 bg-white p-2 rounded block">
                  GET
                  /api/auth/callback?token=YOUR_SUPABASE_TOKEN&refresh_token=REFRESH_TOKEN&redirect_to=/profile
                </code>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  2. Programmatic Login via POST
                </h3>
                <code className="text-xs text-gray-600 bg-white p-2 rounded block">
                  POST /api/auth/callback
                  <br />
                  {`{"access_token": "token", "refresh_token": "refresh"}`}
                </code>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  3. Manual Token Entry
                </h3>
                <p className="text-xs text-gray-600">
                  Visit the{" "}
                  <a
                    href="/login"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    login page
                  </a>{" "}
                  to enter your Supabase tokens manually.
                </p>
              </div>
            </div>
          </div>

          {/* API Endpoints Card */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              🚀 Available API Endpoints
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Authentication
                </h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>
                    <code>GET /api/auth/check</code> - Check auth status
                  </li>
                  <li>
                    <code>POST /api/auth/callback</code> - Login with tokens
                  </li>
                  <li>
                    <code>POST /api/auth/refresh</code> - Refresh access token
                  </li>
                  <li>
                    <code>POST /api/auth/logout</code> - Logout and clear
                    cookies
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Protected Routes
                </h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>
                    <code>GET /api/user</code> - Get user information
                  </li>
                  <li>
                    <code>GET /profile</code> - User profile page
                  </li>
                  <li>
                    <code>GET /chat</code> - Chat interface (if implemented)
                  </li>
                  <li>
                    <code>GET /settings</code> - Settings page (if implemented)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            📚 See <code>AUTH_SYSTEM.md</code> for detailed documentation
          </p>
        </div>
      </div>
    </div>
  );
}
