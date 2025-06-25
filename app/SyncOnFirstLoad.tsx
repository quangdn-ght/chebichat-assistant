"use client";
import { useEffect } from "react";
import { useSyncStore } from "./store/sync";

export default function SyncOnFirstLoad() {
  const syncStore = useSyncStore();

  useEffect(() => {
    if (syncStore.lastSyncTime === 0) {
      syncStore.sync();
    }
  }, []);

  return null;
}
