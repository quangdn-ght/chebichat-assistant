import { StoreKey } from "../constant";
import { indexedDBStorage } from "./indexedDB-storage";
import { safeLocalStorage } from "../utils";

const localStorage = safeLocalStorage();

export class StorageMigration {
  /**
   * Initialize storage system and perform necessary migrations
   */
  static async initialize(): Promise<void> {
    console.log("[StorageMigration] Initializing storage system...");

    try {
      // Check storage health
      const health = await indexedDBStorage.checkHealth();

      if (health.indexedDB) {
        console.log("[StorageMigration] IndexedDB available");

        // Attempt to migrate data from localStorage if needed
        await this.migrateFromLocalStorageIfNeeded();
      } else if (health.localStorage) {
        console.log(
          "[StorageMigration] IndexedDB unavailable, using localStorage",
        );
      } else {
        console.error("[StorageMigration] No storage available!");
        throw new Error("No storage mechanism available");
      }

      // Validate existing data
      await this.validateAndRepairStores();
    } catch (error) {
      console.error("[StorageMigration] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Migrate data from localStorage to IndexedDB if needed
   */
  private static async migrateFromLocalStorageIfNeeded(): Promise<void> {
    const storeKeys = Object.values(StoreKey);
    let migratedCount = 0;

    for (const key of storeKeys) {
      try {
        // Check if data exists in localStorage but not in IndexedDB
        const localData = localStorage.getItem(key);
        const indexedData = await indexedDBStorage.getItem(key);

        if (localData && !indexedData) {
          // Validate the data before migration
          try {
            const parsed = JSON.parse(localData);
            if (parsed && typeof parsed === "object") {
              await indexedDBStorage.setItem(key, localData);
              migratedCount++;
              console.log(
                `[StorageMigration] Migrated ${key} from localStorage to IndexedDB`,
              );
            }
          } catch (parseError) {
            console.warn(
              `[StorageMigration] Skipping invalid data for ${key}:`,
              parseError,
            );
          }
        }
      } catch (error) {
        console.error(`[StorageMigration] Failed to migrate ${key}:`, error);
      }
    }

    if (migratedCount > 0) {
      console.log(
        `[StorageMigration] Successfully migrated ${migratedCount} stores`,
      );
    }
  }

  /**
   * Validate and repair store data if necessary
   */
  private static async validateAndRepairStores(): Promise<void> {
    const storeKeys = Object.values(StoreKey);

    for (const key of storeKeys) {
      try {
        const data = await indexedDBStorage.getItem(key);
        if (data) {
          const repaired = await this.repairStoreData(key, data);
          if (repaired && repaired !== data) {
            await indexedDBStorage.setItem(key, repaired);
            console.log(`[StorageMigration] Repaired data for ${key}`);
          }
        }
      } catch (error) {
        console.error(`[StorageMigration] Failed to validate ${key}:`, error);
      }
    }
  }

  /**
   * Repair store data if it has known issues
   */
  private static async repairStoreData(
    storeKey: string,
    data: string,
  ): Promise<string | null> {
    try {
      const parsed = JSON.parse(data);
      let modified = false;

      // Ensure basic structure exists
      if (!parsed.state) {
        parsed.state = {};
        modified = true;
      }

      // Ensure _hasHydrated flag exists
      if (typeof parsed.state._hasHydrated === "undefined") {
        parsed.state._hasHydrated = false;
        modified = true;
      }

      // Ensure lastUpdateTime exists
      if (typeof parsed.state.lastUpdateTime === "undefined") {
        parsed.state.lastUpdateTime = Date.now();
        modified = true;
      }

      // Store-specific repairs
      switch (storeKey) {
        case StoreKey.Chat:
          if (this.repairChatStore(parsed.state)) {
            modified = true;
          }
          break;

        case StoreKey.Config:
          if (this.repairConfigStore(parsed.state)) {
            modified = true;
          }
          break;

        case StoreKey.Access:
          if (this.repairAccessStore(parsed.state)) {
            modified = true;
          }
          break;
      }

      return modified ? JSON.stringify(parsed) : null;
    } catch (error) {
      console.error(`[StorageMigration] Failed to repair ${storeKey}:`, error);
      return null;
    }
  }

  /**
   * Repair chat store specific issues
   */
  private static repairChatStore(state: any): boolean {
    let modified = false;

    // Ensure sessions array exists
    if (!Array.isArray(state.sessions)) {
      state.sessions = [];
      modified = true;
    }

    // Ensure currentSessionIndex is valid
    if (
      typeof state.currentSessionIndex !== "number" ||
      state.currentSessionIndex < 0 ||
      state.currentSessionIndex >= state.sessions.length
    ) {
      state.currentSessionIndex = 0;
      modified = true;
    }

    // Ensure each session has required properties
    state.sessions.forEach((session: any, index: number) => {
      if (!session.id) {
        session.id = `session-${Date.now()}-${index}`;
        modified = true;
      }

      if (!Array.isArray(session.messages)) {
        session.messages = [];
        modified = true;
      }

      if (!session.mask) {
        session.mask = { modelConfig: {} };
        modified = true;
      }

      if (typeof session.lastUpdate !== "number") {
        session.lastUpdate = Date.now();
        modified = true;
      }
    });

    return modified;
  }

  /**
   * Repair config store specific issues
   */
  private static repairConfigStore(state: any): boolean {
    let modified = false;

    // Ensure basic config properties exist
    if (!state.theme) {
      state.theme = "auto";
      modified = true;
    }

    if (!state.models || !Array.isArray(state.models)) {
      state.models = [];
      modified = true;
    }

    return modified;
  }

  /**
   * Repair access store specific issues
   */
  private static repairAccessStore(state: any): boolean {
    let modified = false;

    // Ensure access code exists
    if (typeof state.accessCode !== "string") {
      state.accessCode = "";
      modified = true;
    }

    return modified;
  }

  /**
   * Clear corrupted stores and reset to defaults
   */
  static async clearCorruptedStores(): Promise<void> {
    console.log("[StorageMigration] Clearing corrupted stores...");

    const storeKeys = Object.values(StoreKey);

    for (const key of storeKeys) {
      try {
        const data = await indexedDBStorage.getItem(key);
        if (data) {
          try {
            JSON.parse(data);
          } catch (parseError) {
            console.warn(`[StorageMigration] Clearing corrupted store ${key}`);
            await indexedDBStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error(`[StorageMigration] Error checking ${key}:`, error);
      }
    }
  }

  /**
   * Create a backup before performing migrations
   */
  static async createPreMigrationBackup(): Promise<string> {
    console.log("[StorageMigration] Creating pre-migration backup...");

    const backup: Record<string, any> = {
      timestamp: new Date().toISOString(),
      type: "pre-migration",
      stores: {},
    };

    const storeKeys = Object.values(StoreKey);

    for (const key of storeKeys) {
      try {
        const localData = localStorage.getItem(key);
        const indexedData = await indexedDBStorage.getItem(key);

        backup.stores[key] = {
          localStorage: localData,
          indexedDB: indexedData,
        };
      } catch (error) {
        console.error(`[StorageMigration] Error backing up ${key}:`, error);
        backup.stores[key] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const backupString = JSON.stringify(backup);
    localStorage.setItem("pre-migration-backup", backupString);

    console.log("[StorageMigration] Backup created successfully");
    return backupString;
  }
}

// Auto-initialize when module is loaded (client-side only)
if (typeof window !== "undefined") {
  // Wait for the page to load before initializing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      StorageMigration.initialize().catch(console.error);
    });
  } else {
    StorageMigration.initialize().catch(console.error);
  }
}
