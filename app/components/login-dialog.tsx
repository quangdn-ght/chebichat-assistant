"use client";

import React, { useState, useEffect } from "react";
import styles from "./login-dialog.module.scss";
import BotIcon from "../icons/bot.svg";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export function LoginDialog({ open, onClose, onLoginClick }: LoginDialogProps) {
  const [authLoginUrl, setAuthLoginUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch auth config and construct proper auth URL
    const fetchAuthConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();

          // Get base URL for current domain
          const baseUrl = window.location.origin;

          // Get AUTHEN_PAGE from config or fallback
          const authenPage = config.authLogin || "https://chebichat.ai";

          // Remove any existing auth path from authenPage
          const cleanAuthenPage = authenPage.replace(/\/auth.*$/, "");

          // Construct the auth URL: {AUTHEN_PAGE}/auth/callback?redirect={BASE_URL}/auth/callback
          const constructedAuthUrl = `${cleanAuthenPage}/auth/callback?redirect=${encodeURIComponent(
            baseUrl + "/api/auth/callback",
          )}`;

          console.log("Constructed auth URL:", constructedAuthUrl);
          setAuthLoginUrl(constructedAuthUrl);
        } else {
          // Fallback URL construction
          const baseUrl = window.location.origin;
          const fallbackUrl = `https://chebichat.ai/auth/callback?redirect=${encodeURIComponent(
            baseUrl + "/api/auth/callback",
          )}`;
          setAuthLoginUrl(fallbackUrl);
        }
      } catch (error) {
        console.error("Failed to fetch auth config:", error);
        // Keep default URL if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchAuthConfig();
    }
  }, [open]);

  const handleLoginClick = async () => {
    if (isLoading || !authLoginUrl) return; // Prevent click during loading or if URL not ready

    setIsLoading(true);

    try {
      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Direct redirect to the constructed auth URL
      console.log("Redirecting to auth URL:", authLoginUrl);
      window.location.replace(authLoginUrl);
    } catch (error) {
      console.error("Login redirect error:", error);
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <div className={styles["modal-icon"]}>
            <BotIcon />
          </div>
          <h2 className={styles["modal-title"]}>
            Chào mừng đến với ChebiChat!
          </h2>
          <p className={styles["modal-subtitle"]}>
            Vui lòng đăng nhập để bắt đầu trò chuyện với AI
          </p>
        </div>

        <div className={styles["modal-body"]}>
          <button
            className={styles["login-button"]}
            onClick={handleLoginClick}
            disabled={isLoading || !authLoginUrl}
          >
            <span
              className={`${styles["login-icon"]} ${
                isLoading ? styles["loading"] : ""
              }`}
            >
              {isLoading ? "⭕" : "🚀"}
            </span>
            {isLoading ? "Đang chuyển hướng..." : "Đăng nhập ngay"}
          </button>
        </div>

        <div className={styles["modal-footer"]}>
          <button className={styles["cancel-button"]} onClick={onClose}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
