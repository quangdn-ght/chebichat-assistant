// Import các hàm và hằng số cần thiết từ các module khác
import { getClientConfig } from "../config/client";
import {
  ApiPath,
  STORAGE_KEY,
  StoreKey,
  UPSTASH_APIKEY,
  UPSTASH_ENDPOINT,
  UPSTASH_APIKEY_SERVER,
  UPSTASH_ENDPOINT_SERVER,
} from "../constant";
import { createPersistStore } from "../utils/store";
import {
  AppState,
  getLocalAppState,
  GetStoreState,
  mergeAppState,
  setLocalAppState,
} from "../utils/sync";
import { downloadAs, readFromFile } from "../utils";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";
import { createSyncClient, ProviderType } from "../utils/cloud";

// Định nghĩa interface cho cấu hình WebDav
export interface WebDavConfig {
  server: string;
  username: string;
  password: string;
}

// Kiểm tra xem ứng dụng đang chạy ở chế độ app hay không
const isApp = !!getClientConfig()?.isApp;

// Định nghĩa kiểu dữ liệu cho SyncStore dựa trên useSyncStore
export type SyncStore = GetStoreState<typeof useSyncStore>;

/**
 * Get UpStash configuration from server-side API
 * This ensures we always get the correct environment variables
 */
async function getUpstashConfig(): Promise<{
  endpoint: string;
  apiKey: string;
}> {
  try {
    const response = await fetch("/api/upstash/config", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const config = await response.json();
      return {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
      };
    } else {
      console.warn(
        "[Sync] Failed to get UpStash config from API, using fallback",
      );
      return {
        endpoint: UPSTASH_ENDPOINT,
        apiKey: UPSTASH_APIKEY,
      };
    }
  } catch (error) {
    console.error("[Sync] Error fetching UpStash config:", error);
    return {
      endpoint: UPSTASH_ENDPOINT,
      apiKey: UPSTASH_APIKEY,
    };
  }
}

/**
 * Get user-specific storage key from the server
 * This will return user email-based key if authenticated, or default key if not
 */
async function getUserStorageKey(): Promise<string> {
  try {
    // Get access token from cookies for Authorization header
    const getAccessToken = (): string | null => {
      if (typeof window === "undefined") return null;

      try {
        const accessTokenCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("sb-access-token="));

        if (accessTokenCookie) {
          return decodeURIComponent(accessTokenCookie.split("=")[1]);
        }
      } catch (error) {
        console.error("Error reading access token cookie:", error);
      }

      return null;
    };

    const token = getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("[Sync] Using Authorization header for cross-domain auth");
    }

    const response = await fetch("/api/auth/storage-key", {
      method: "GET",
      credentials: "include",
      headers: headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        "[Sync] Got storage key:",
        data.storageKey,
        "authenticated:",
        data.authenticated,
      );
      return data.storageKey;
    } else {
      console.warn("[Sync] Failed to get storage key from API, using default");
      return STORAGE_KEY;
    }
  } catch (error) {
    console.error("[Sync] Error fetching storage key:", error);
    return STORAGE_KEY;
  }
}

// Trạng thái mặc định cho việc đồng bộ
const DEFAULT_SYNC_STATE = {
  provider: ProviderType.UpStash as ProviderType, // Nhà cung cấp mặc định là UpStash
  useProxy: true, // Sử dụng proxy mặc định
  proxyUrl: ApiPath.Cors as string, // Đường dẫn proxy mặc định

  // Cấu hình WebDav mặc định
  webdav: {
    endpoint: "",
    username: "",
    password: "",
  },

  // Cấu hình Upstash, endpoint và apiKey luôn lấy từ environment variables
  upstash: {
    endpoint: UPSTASH_ENDPOINT,
    username: STORAGE_KEY,
    apiKey: UPSTASH_APIKEY,
  },

  lastSyncTime: 0, // Thời gian đồng bộ lần cuối
  lastProvider: "", // Nhà cung cấp đồng bộ lần cuối
};

// Tạo store đồng bộ với các hàm thao tác
export const useSyncStore = createPersistStore(
  DEFAULT_SYNC_STATE,
  (set, get) => ({
    // Hàm đảm bảo cấu hình UpStash luôn sử dụng environment variables
    async ensureUpstashConfig() {
      const currentState = get();

      // Get the actual server-side configuration
      const serverConfig = await getUpstashConfig();

      const needsUpdate =
        !currentState.upstash.endpoint ||
        currentState.upstash.endpoint === "" ||
        currentState.upstash.endpoint !== serverConfig.endpoint ||
        !currentState.upstash.apiKey ||
        currentState.upstash.apiKey === "" ||
        currentState.upstash.apiKey !== serverConfig.apiKey;

      if (needsUpdate) {
        console.log(
          "[Sync] Ensuring UpStash config uses server environment variables",
        );
        set((state) => ({
          ...state,
          upstash: {
            ...state.upstash,
            endpoint: serverConfig.endpoint,
            apiKey: serverConfig.apiKey,
          },
        }));
      }
    },

    // Hàm trả về cấu hình UpStash luôn đúng với environment variables
    async getUpstashConfig() {
      await this.ensureUpstashConfig();
      const serverConfig = await getUpstashConfig();
      return {
        endpoint: serverConfig.endpoint,
        apiKey: serverConfig.apiKey,
        username: get().upstash.username,
      };
    },

    // Kiểm tra xem đã cấu hình đầy đủ để đồng bộ cloud chưa
    async cloudSync() {
      // Đảm bảo UpStash config luôn đúng
      await this.ensureUpstashConfig();

      const config = get()[get().provider];
      return Object.values(config).every((c) => c.toString().length > 0);
    },

    // Đánh dấu thời gian đồng bộ gần nhất
    markSyncTime() {
      set({ lastSyncTime: Date.now(), lastProvider: get().provider });
    },

    // Xuất dữ liệu ứng dụng ra file JSON
    export() {
      const state = getLocalAppState();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `Backup-${datePart}.json`;
      downloadAs(JSON.stringify(state), fileName);
    },

    // Nhập dữ liệu ứng dụng từ file JSON
    async import() {
      const rawContent = await readFromFile();

      try {
        const remoteState = JSON.parse(rawContent) as AppState;
        const localState = getLocalAppState();
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },

    // Lấy client đồng bộ dựa vào provider hiện tại
    async getClient() {
      const provider = get().provider;

      // Đảm bảo UpStash config luôn đúng
      await this.ensureUpstashConfig();

      const client = createSyncClient(provider, get());
      return client;
    },

    // Hàm đồng bộ dữ liệu giữa local và cloud
    async sync() {
      const localState = getLocalAppState();
      const provider = get().provider;
      const config = get()[provider];

      // Get user-specific storage key
      const userStorageKey = await getUserStorageKey();

      // Create a config copy with user-specific storage key
      const userConfig = { ...config, username: userStorageKey };

      // Update the store with the user-specific storage key for UpStash
      if (provider === ProviderType.UpStash) {
        set((state) => ({
          ...state,
          upstash: { ...state.upstash, username: userStorageKey },
        }));
      }

      const client = await this.getClient();

      try {
        const remoteState = await client.get(userStorageKey);
        if (!remoteState || remoteState === "") {
          // Nếu cloud chưa có dữ liệu thì đẩy dữ liệu local lên cloud
          await client.set(userStorageKey, JSON.stringify(localState));
          console.log(
            "[Sync] Remote state is empty, using local state instead.",
          );
          return;
        } else {
          // Nếu cloud đã có dữ liệu thì merge với local
          const parsedRemoteState = JSON.parse(
            await client.get(userStorageKey),
          ) as AppState;
          mergeAppState(localState, parsedRemoteState);
          setLocalAppState(localState);
        }
      } catch (e) {
        console.log("[Sync] failed to get remote state", e);
        throw e;
      }

      // Đẩy dữ liệu đã merge lên cloud
      await client.set(userStorageKey, JSON.stringify(localState));

      this.markSyncTime();
    },

    // Kiểm tra trạng thái kết nối cloud
    async check() {
      const client = await this.getClient();
      return await client.check();
    },
  }),
  {
    name: StoreKey.Sync, // Tên store trong localStorage
    version: 1.2, // Phiên bản store

    // Hàm migrate để chuyển đổi dữ liệu khi nâng cấp version
    migrate(persistedState, version) {
      const newState = persistedState as typeof DEFAULT_SYNC_STATE;

      if (version < 1.1) {
        newState.upstash.username = STORAGE_KEY;
      }

      if (version < 1.2) {
        if (
          (persistedState as typeof DEFAULT_SYNC_STATE).proxyUrl ===
          "/api/cors/"
        ) {
          newState.proxyUrl = "";
        }
      }

      // Luôn đảm bảo endpoint và apiKey sử dụng environment variables
      // Điều này đảm bảo rằng ngay cả khi dữ liệu cũ có giá trị khác,
      // nó sẽ được override bằng environment variables
      // Use server-side constants if available, otherwise use fallback
      if (typeof process !== "undefined" && process.env) {
        newState.upstash.endpoint = UPSTASH_ENDPOINT_SERVER;
        newState.upstash.apiKey = UPSTASH_APIKEY_SERVER;
      } else {
        newState.upstash.endpoint = UPSTASH_ENDPOINT;
        newState.upstash.apiKey = UPSTASH_APIKEY;
      }

      return newState as any;
    },
  },
);
