"use client";
import { useEffect } from "react";
import { useSyncStore } from "./store/sync";

export default function SyncOnFirstLoad() {
  const syncStore = useSyncStore();

  useEffect(() => {
    // Parse cookies using the custom function
    //  syncStore.sync();
  }, []);

  return null;
}
