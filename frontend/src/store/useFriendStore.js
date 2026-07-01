import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  isLoading: false,

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data });
    } catch (error) {
      console.error("Error fetching friends:", error.message);
    }
  },

  getReceivedRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ receivedRequests: res.data });
    } catch (error) {
      console.error("Error fetching received requests:", error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("Error fetching sent requests:", error.message);
    }
  },

  sendFriendRequest: async (userId) => {
    // Optimistic update — flip to Pending immediately before the API responds
    const optimisticId = `optimistic-${userId}`;
    set((state) => ({
      sentRequests: [{ _id: optimisticId, receiverId: { _id: userId }, status: "pending" }, ...state.sentRequests],
    }));
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      // Swap the placeholder for the real request object
      set((state) => ({
        sentRequests: state.sentRequests.map((r) => (r._id === optimisticId ? res.data : r)),
      }));
      toast.success("Friend request sent!");
      return true;
    } catch (error) {
      // Revert if the API call fails
      set((state) => ({
        sentRequests: state.sentRequests.filter((r) => r._id !== optimisticId),
      }));
      toast.error(error.response?.data?.message || "Failed to send request");
      return false;
    }
  },

  respondToRequest: async (requestId, action) => {
    try {
      await axiosInstance.post(`/friends/respond/${requestId}`, { action });

      const request = get().receivedRequests.find((r) => String(r._id) === String(requestId));
      set((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => String(r._id) !== String(requestId)),
        friends:
          action === "accept" && request
            ? [...state.friends, request.senderId]
            : state.friends,
      }));

      if (action === "accept") {
        toast.success("Friend request accepted!");
        // Refresh friends and chat data so the new friend appears immediately
        get().getFriends();
        useChatStore.getState().getUsers();
        useChatStore.getState().getConversations();
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to respond to request");
      return false;
    }
  },

  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newFriendRequest");
    socket.on("newFriendRequest", (request) => {
      set((state) => ({ receivedRequests: [request, ...state.receivedRequests] }));
      toast(`${request.senderId.fullName} sent you a friend request`, { icon: "👋" });
    });

    socket.off("friendRequestAccepted");
    socket.on("friendRequestAccepted", ({ requestId, newFriend }) => {
      // Optimistic update with safe String() ID comparison
      set((state) => ({
        sentRequests: state.sentRequests.filter((r) => String(r._id) !== String(requestId)),
        friends: [...state.friends, newFriend],
      }));
      // Sync from server to guarantee accuracy (avoids any ID format mismatch)
      get().getSentRequests();
      get().getFriends();
      useChatStore.getState().getUsers();
      useChatStore.getState().getConversations();
      toast.success(`${newFriend.fullName} accepted your friend request!`);
    });
  },

  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newFriendRequest");
    socket?.off("friendRequestAccepted");
  },

  isSentPending: (userId) => {
    return get().sentRequests.some((r) => String(r.receiverId._id) === String(userId));
  },

  isReceivedPending: (userId) => {
    return get().receivedRequests.find((r) => String(r.senderId._id) === String(userId));
  },
}));
