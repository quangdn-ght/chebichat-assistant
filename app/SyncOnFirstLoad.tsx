"use client";
import { useEffect } from "react";
import { useSyncStore } from "./store/sync";

export default function SyncOnFirstLoad() {
  const syncStore = useSyncStore();

  useEffect(() => {
    // if (syncStore.lastSyncTime === 0) {
    //   // If this is the first time syncing, call sync()
    // alert("[SyncOnFirstLoad] Dong bo hoa du lieu lan dau tien");

    console.log("[SyncOnFirstLoad] Dong bo hoa du lieu lan dau tien");

    console.log("Thoi gian dong bo lan cuoi: ", syncStore.lastSyncTime);

    syncStore.sync();
    // }
  }, []);

  return null;
}
