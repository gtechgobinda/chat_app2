import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    // Retry up to 5 times if the user profile isn't synced yet (webhook delay on first login).
    // PageLoader stays visible during retries so the user never sees a broken empty state.
    const MAX_ATTEMPTS = 5;
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await axiosInstance.get("/auth/check");
        set({ authUser: res.data });
        get().connectSocket(res.data);
        set({ isCheckingAuth: false });
        return;
      } catch (error) {
        lastError = error;
        const notSyncedYet = error.response?.status === 404;
        if (notSyncedYet && attempt < MAX_ATTEMPTS) {
          // Wait 1s × attempt before next retry (1s, 2s, 3s, 4s)
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }
        break;
      }
    }

    console.error("Error in checkAuth:", lastError);
    set({ authUser: null, isCheckingAuth: false });
  },

  clearAuth: () => {
    set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
    get().disconnectSocket();
  },

  connectSocket: (user) => {
    if (!user || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: user._id } });

    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null });
  },
}));
