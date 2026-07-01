import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useBlockStore = create((set, get) => ({
  blockedUsers: [],
  isLoading: false,

  getBlockedUsers: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/block");
      set({ blockedUsers: res.data });
    } catch (error) {
      console.error("Error fetching blocked users:", error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/block/${userId}`);
      set((state) => ({ blockedUsers: [...state.blockedUsers, { _id: userId }] }));
      toast.success("User blocked");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
      return false;
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.delete(`/block/${userId}`);
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((u) => u._id !== userId),
      }));
      toast.success("User unblocked");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
      return false;
    }
  },

  isBlocked: (userId) => {
    return get().blockedUsers.some((u) => String(u._id) === String(userId));
  },
}));
