"use client";

import React from "react";
import { useAuth, withAuth } from "../hooks/useAuth";

function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Profile Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 text-sm text-gray-900">{user?.id}</p>
              </div>

              {user?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
              )}

              {user?.user_metadata &&
                Object.keys(user.user_metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      User Metadata
                    </label>
                    <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Home
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
