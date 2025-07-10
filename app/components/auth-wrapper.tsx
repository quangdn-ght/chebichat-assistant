"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "./ui-lib";
import { LoginDialog } from "./login-dialog";
import { Path } from "../constant";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { authenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (authenticated && user && !hasShownWelcome) {
        // Show welcome toast
        const username =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          "User";
        showToast(`Welcome @${username}! 🎉`, undefined, 4000);
        setHasShownWelcome(true);
      } else if (!authenticated) {
        // Show login dialog instead of immediate redirect
        setShowLoginDialog(true);
      }
    }
  }, [authenticated, loading, user, hasShownWelcome]);

  const handleDialogClose = () => {
    setShowLoginDialog(false);
    // Redirect to auth page using HashRouter navigation
    navigate(Path.Auth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {authenticated ? (
        children
      ) : (
        <>
          <LoginDialog
            open={showLoginDialog}
            onClose={handleDialogClose}
            onLoginClick={() => {}} // Not used - LoginDialog handles its own login
          />
          {/* Show content in background while dialog is open */}
          <div style={{ filter: showLoginDialog ? "blur(3px)" : "none" }}>
            {children}
          </div>
        </>
      )}
    </>
  );
}
