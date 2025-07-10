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
  const [authenPage, setAuthenPage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch AUTHEN_PAGE from config
    const fetchAuthConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();
          setAuthenPage(config.authLogin || "https://chebichat.ai");
        } else {
          setAuthenPage("https://chebichat.ai"); // Fallback
        }
      } catch (error) {
        console.error("Failed to fetch auth config:", error);
        setAuthenPage("https://chebichat.ai"); // Fallback
      }
    };

    if (open) {
      fetchAuthConfig();
    }
  }, [open]);

  const handleLoginClick = () => {
    if (isLoading || !authenPage) return;

    setIsLoading(true);

    // Simple redirect to AUTHEN_PAGE
    console.log("Redirecting to AUTHEN_PAGE:", authenPage);
    window.location.href = authenPage;
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
            disabled={isLoading || !authenPage}
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
