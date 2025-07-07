"use client";

import { useEffect } from "react";

export default function StorageInitializer() {
  useEffect(() => {
    // Initialize storage migration and debugging in development
    if (process.env.NODE_ENV === "development") {
      // Import and initialize storage utilities
      Promise.all([
        import("../utils/storage-debug"),
        import("../utils/storage-migration"),
      ])
        .then(([storageDebug, storageMigration]) => {
          console.log("🔧 Storage utilities loaded");

          // Run a quick health check
          if ((window as any).debugStorage?.checkStorageHealth) {
            (window as any).debugStorage.checkStorageHealth();
          }
        })
        .catch((error) => {
          console.error("Failed to load storage utilities:", error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
