import { useEffect } from "react";

export function AuthPage() {
  useEffect(() => {
    // Fetch auth login URL from server config and redirect immediately
    const fetchAuthConfigAndRedirect = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();
          const redirectUrl =
            config.authLogin || "https://chebichat.ai/auth/login";
          console.log("AuthPage: Redirecting to auth URL:", redirectUrl);
          window.location.replace(redirectUrl);
        } else {
          // Fallback redirect if config fetch fails
          window.location.replace("https://chebichat.ai/auth/login");
        }
      } catch (error) {
        console.error("AuthPage: Failed to fetch auth config:", error);
        // Fallback redirect if error occurs
        window.location.replace("https://chebichat.ai/auth/login");
      }
    };

    fetchAuthConfigAndRedirect();
  }, []);

  // Return minimal loading UI while redirect is happening
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "16px",
        color: "var(--text-color)",
      }}
    >
      Đang chuyển hướng...
    </div>
  );
}
