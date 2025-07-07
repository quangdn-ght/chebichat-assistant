import { StateStorage } from "zustand/middleware";
import { get, set, del, clear } from "idb-keyval";
import { safeLocalStorage } from "@/app/utils";

const localStorage = safeLocalStorage();

class IndexedDBStorage implements StateStorage {
  private isIndexedDBAvailable = true;

  public async getItem(name: string): Promise<string | null> {
    try {
      // First try IndexedDB
      if (this.isIndexedDBAvailable) {
        const value = await get(name);
        if (value !== undefined) {
          return value;
        }
      }

      // Fallback to localStorage
      const localValue = localStorage.getItem(name);
      console.log(`[IndexedDB] Retrieved from localStorage for key: ${name}`);
      return localValue;
    } catch (error) {
      console.error(`[IndexedDB] Error getting item ${name}:`, error);
      this.isIndexedDBAvailable = false;
      return localStorage.getItem(name);
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    try {
      // Validate JSON structure
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (parseError) {
        console.error(`[IndexedDB] Invalid JSON for key ${name}:`, parseError);
        // Still try to store the raw value
        parsedValue = null;
      }

      // Check if this is a Zustand store with hydration state
      const isZustandStore =
        parsedValue &&
        typeof parsedValue === "object" &&
        parsedValue.state &&
        typeof parsedValue.state === "object";

      // For Zustand stores, check hydration status
      if (isZustandStore) {
        const hasHydrated = parsedValue.state._hasHydrated;

        // Allow storage if:
        // 1. Already hydrated, OR
        // 2. Initial state (not hydrated but has meaningful data)
        const shouldStore =
          hasHydrated ||
          (parsedValue.state.sessions &&
            parsedValue.state.sessions.length > 0) ||
          Object.keys(parsedValue.state).length > 2; // More than just _hasHydrated and version

        if (!shouldStore) {
          console.log(
            `[IndexedDB] Skipping storage for ${name} - not hydrated and no meaningful data`,
          );
          return;
        }
      }

      // Try IndexedDB first
      if (this.isIndexedDBAvailable) {
        await set(name, value);
        console.log(`[IndexedDB] Successfully stored ${name} in IndexedDB`);

        // Also store in localStorage as backup for critical stores
        if (
          name.includes("chat") ||
          name.includes("config") ||
          name.includes("access")
        ) {
          localStorage.setItem(name, value);
        }
        return;
      }

      // Fallback to localStorage
      localStorage.setItem(name, value);
      console.log(
        `[IndexedDB] Stored ${name} in localStorage (IndexedDB unavailable)`,
      );
    } catch (error) {
      console.error(`[IndexedDB] Error setting item ${name}:`, error);
      this.isIndexedDBAvailable = false;

      // Always fallback to localStorage on error
      try {
        localStorage.setItem(name, value);
        console.log(`[IndexedDB] Fallback: stored ${name} in localStorage`);
      } catch (localError) {
        console.error(
          `[IndexedDB] Failed to store ${name} in localStorage:`,
          localError,
        );
      }
    }
  }

  public async removeItem(name: string): Promise<void> {
    try {
      // Remove from both storages to ensure cleanup
      if (this.isIndexedDBAvailable) {
        await del(name);
      }
      localStorage.removeItem(name);
      console.log(`[IndexedDB] Removed ${name} from both storages`);
    } catch (error) {
      console.error(`[IndexedDB] Error removing item ${name}:`, error);
      this.isIndexedDBAvailable = false;
      localStorage.removeItem(name);
    }
  }

  public async clear(): Promise<void> {
    try {
      // Clear both storages
      if (this.isIndexedDBAvailable) {
        await clear();
      }
      localStorage.clear();
      console.log(`[IndexedDB] Cleared both storages`);
    } catch (error) {
      console.error(`[IndexedDB] Error clearing storage:`, error);
      this.isIndexedDBAvailable = false;
      localStorage.clear();
    }
  }

  // Utility method to check storage health
  public async checkHealth(): Promise<{
    indexedDB: boolean;
    localStorage: boolean;
  }> {
    const health = {
      indexedDB: false,
      localStorage: false,
    };

    // Test IndexedDB
    try {
      await set("health-check", "test");
      await get("health-check");
      await del("health-check");
      health.indexedDB = true;
      this.isIndexedDBAvailable = true;
    } catch (error) {
      console.warn("[IndexedDB] Health check failed:", error);
      this.isIndexedDBAvailable = false;
    }

    // Test localStorage
    try {
      localStorage.setItem("health-check", "test");
      localStorage.getItem("health-check");
      localStorage.removeItem("health-check");
      health.localStorage = true;
    } catch (error) {
      console.warn("[IndexedDB] localStorage health check failed:", error);
    }

    return health;
  }

  // Method to migrate data from localStorage to IndexedDB
  public async migrateFromLocalStorage(): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      console.warn("[IndexedDB] Cannot migrate - IndexedDB unavailable");
      return;
    }

    try {
      // Get all store keys from constants
      const storeKeys = [
        "chat-next-web-store",
        "chat-next-web-plugin",
        "access-control",
        "app-config",
        "mask-store",
        "prompt-store",
        "chat-update",
        "sync",
        "sd-list",
        "mcp-store",
      ];

      for (const key of storeKeys) {
        const localValue = localStorage.getItem(key);
        if (localValue) {
          try {
            // Check if already exists in IndexedDB
            const existingValue = await get(key);
            if (!existingValue) {
              await set(key, localValue);
              console.log(
                `[IndexedDB] Migrated ${key} from localStorage to IndexedDB`,
              );
            }
          } catch (error) {
            console.error(`[IndexedDB] Failed to migrate ${key}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("[IndexedDB] Migration failed:", error);
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage();
