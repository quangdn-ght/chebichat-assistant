import { useState, useEffect } from "react";

interface StorageKeyInfo {
  storageKey: string;
  authenticated: boolean;
  userEmail: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get user-specific storage key for UpStash Redis sync
 * Returns user email-based key if authenticated, or default key if not
 */
export function useUserStorageKey(): StorageKeyInfo {
  const [info, setInfo] = useState<StorageKeyInfo>({
    storageKey: "chebichat-backup", // Default fallback
    authenticated: false,
    userEmail: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStorageKey() {
      try {
        setInfo((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch("/api/auth/storage-key", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setInfo({
            storageKey: data.storageKey,
            authenticated: data.authenticated,
            userEmail: data.userEmail,
            loading: false,
            error: null,
          });
        } else {
          throw new Error("Failed to fetch storage key");
        }
      } catch (error) {
        console.error("[useUserStorageKey] Error:", error);
        setInfo((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    fetchStorageKey();
  }, []);

  return info;
}

/**
 * Utility function to get storage key directly (async)
 */
export async function getUserStorageKey(): Promise<string> {
  try {
    const response = await fetch("/api/auth/storage-key", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.storageKey;
    } else {
      console.warn(
        "[getUserStorageKey] Failed to get storage key, using default",
      );
      return "chebichat-backup";
    }
  } catch (error) {
    console.error("[getUserStorageKey] Error:", error);
    return "chebichat-backup";
  }
}
