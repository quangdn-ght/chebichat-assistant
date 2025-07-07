import { indexedDBStorage } from "./indexedDB-storage";
import { StoreKey } from "../constant";

// Storage debugging utilities
export class StorageDebugger {
  static async checkStorageHealth() {
    console.log("🔍 Checking storage health...");
    const health = await indexedDBStorage.checkHealth();

    console.log("📊 Storage Health Report:");
    console.log(
      `  - IndexedDB: ${health.indexedDB ? "✅ Available" : "❌ Unavailable"}`,
    );
    console.log(
      `  - localStorage: ${
        health.localStorage ? "✅ Available" : "❌ Unavailable"
      }`,
    );

    return health;
  }

  static async listAllStoreData() {
    console.log("📋 Listing all store data...");

    const storeKeys = Object.values(StoreKey);
    const storeData: Record<string, any> = {};

    for (const key of storeKeys) {
      try {
        const data = await indexedDBStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          storeData[key] = {
            size: data.length,
            hasState: !!parsed.state,
            hasHydrated: parsed.state?._hasHydrated || false,
            lastUpdateTime: parsed.state?.lastUpdateTime || 0,
            keys: Object.keys(parsed.state || {}),
          };

          // Special handling for chat store
          if (key === StoreKey.Chat && parsed.state?.sessions) {
            storeData[key].sessionCount = parsed.state.sessions.length;
            storeData[key].currentSessionIndex =
              parsed.state.currentSessionIndex;
          }
        } else {
          storeData[key] = null;
        }
      } catch (error) {
        console.error(`Error reading store ${key}:`, error);
        storeData[key] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    console.table(storeData);
    return storeData;
  }

  static async migrateData() {
    console.log("🔄 Starting data migration...");
    await indexedDBStorage.migrateFromLocalStorage();
    console.log("✅ Migration completed");
  }

  static async clearStore(storeKey: StoreKey) {
    console.log(`🗑️ Clearing store: ${storeKey}`);
    try {
      await indexedDBStorage.removeItem(storeKey);
      console.log(`✅ Store ${storeKey} cleared successfully`);
    } catch (error) {
      console.error(`❌ Failed to clear store ${storeKey}:`, error);
    }
  }

  static async clearAllStores() {
    console.log("🗑️ Clearing all stores...");
    try {
      await indexedDBStorage.clear();
      console.log("✅ All stores cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear all stores:", error);
    }
  }

  static async backupStores() {
    console.log("💾 Creating backup of all stores...");

    const backup: Record<string, any> = {
      timestamp: new Date().toISOString(),
      stores: {},
    };

    const storeKeys = Object.values(StoreKey);

    for (const key of storeKeys) {
      try {
        const data = await indexedDBStorage.getItem(key);
        if (data) {
          backup.stores[key] = data;
        }
      } catch (error) {
        console.error(`Error backing up store ${key}:`, error);
        backup.stores[key] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Save backup to localStorage as well
    try {
      const backupString = JSON.stringify(backup);
      localStorage.setItem("store-backup", backupString);
      console.log("💾 Backup saved to localStorage");

      // Also download as file
      const blob = new Blob([backupString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `store-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("💾 Backup downloaded as file");
    } catch (error) {
      console.error("❌ Failed to save backup:", error);
    }

    return backup;
  }

  static async restoreFromBackup(backupData: any) {
    console.log("♻️ Restoring from backup...");

    if (!backupData || !backupData.stores) {
      throw new Error("Invalid backup data");
    }

    for (const [key, data] of Object.entries(backupData.stores)) {
      if (typeof data === "string") {
        try {
          await indexedDBStorage.setItem(key, data);
          console.log(`✅ Restored store: ${key}`);
        } catch (error) {
          console.error(`❌ Failed to restore store ${key}:`, error);
        }
      }
    }

    console.log("♻️ Restore completed");
  }

  static async validateStoreIntegrity() {
    console.log("🔍 Validating store integrity...");

    const issues: string[] = [];
    const storeKeys = Object.values(StoreKey);

    for (const key of storeKeys) {
      try {
        const data = await indexedDBStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);

          // Basic structure validation
          if (!parsed.state) {
            issues.push(`${key}: Missing state object`);
          }

          if (
            parsed.state &&
            typeof parsed.state._hasHydrated === "undefined"
          ) {
            issues.push(`${key}: Missing _hasHydrated flag`);
          }

          // Store-specific validation
          if (key === StoreKey.Chat) {
            if (
              !parsed.state?.sessions ||
              !Array.isArray(parsed.state.sessions)
            ) {
              issues.push(`${key}: Invalid or missing sessions array`);
            }

            if (typeof parsed.state?.currentSessionIndex !== "number") {
              issues.push(`${key}: Invalid currentSessionIndex`);
            }
          }
        }
      } catch (error) {
        issues.push(
          `${key}: JSON parse error - ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (issues.length === 0) {
      console.log("✅ All stores have valid integrity");
    } else {
      console.warn("⚠️ Store integrity issues found:");
      issues.forEach((issue) => console.warn(`  - ${issue}`));
    }

    return issues;
  }
}

// Global debugging functions for console use
if (typeof window !== "undefined") {
  (window as any).debugStorage = StorageDebugger;

  // Add helpful console messages
  console.log(`
🔧 Storage Debug Utils Available:
- debugStorage.checkStorageHealth()
- debugStorage.listAllStoreData() 
- debugStorage.migrateData()
- debugStorage.clearStore(StoreKey.Chat)
- debugStorage.clearAllStores()
- debugStorage.backupStores()
- debugStorage.validateStoreIntegrity()

Example: debugStorage.listAllStoreData()
  `);
}
