import { create } from "zustand";
import { persist } from "zustand/middleware";

import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

function playNotificationTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // audio not available — silent fail
  }
}

export const useChatStore = create(
  persist(
    (set, get) => ({
      users: [],
      conversations: [],
      archivedConversations: [],
      mutedConversations: [], // [{ userId, mutedUntil: ISO string | null }]
      messages: [],
      selectedUser: null,
      isConversationsLoading: false,
      isUsersLoading: false,
      isMessagesLoading: false,
      activeConversationId: null,
      searchQuery: "",
      sidebarTab: "chats",
      composerText: "",
      isSoundEnabled: true,
      isSendingMedia: false,
      typingUsers: {},

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set((state) => ({
            users: res.data,
            selectedUser:
              state.selectedUser && res.data.some((user) => user._id === state.selectedUser._id)
                ? state.selectedUser
                : null,
          }));
        } catch (error) {
          console.log("Error in get Users", error.message);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
          const res = await axiosInstance.get("/messages/conversations");
          set({ conversations: res.data });
        } catch (error) {
          console.log("Error in getConversations", error.message);
        } finally {
          set({ isConversationsLoading: false });
        }
      },

      getArchivedConversations: async () => {
        try {
          const res = await axiosInstance.get("/messages/archived");
          set({ archivedConversations: res.data });
        } catch (error) {
          console.log("Error in getArchivedConversations", error.message);
        }
      },

      archiveConversation: async (userId) => {
        try {
          await axiosInstance.post(`/messages/archive/${userId}`);
          await Promise.all([get().getConversations(), get().getArchivedConversations()]);
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to archive conversation");
        }
      },

      unarchiveConversation: async (userId) => {
        try {
          await axiosInstance.delete(`/messages/archive/${userId}`);
          await Promise.all([get().getConversations(), get().getArchivedConversations()]);
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to unarchive conversation");
        }
      },

      getMutedConversations: async () => {
        try {
          const res = await axiosInstance.get("/messages/muted");
          set({ mutedConversations: res.data });
        } catch (error) {
          console.log("Error in getMutedConversations", error.message);
        }
      },

      muteConversation: async (userId, duration) => {
        try {
          await axiosInstance.post(`/messages/mute/${userId}`, { duration });
          await get().getMutedConversations();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to mute conversation");
        }
      },

      unmuteConversation: async (userId) => {
        try {
          await axiosInstance.delete(`/messages/mute/${userId}`);
          await get().getMutedConversations();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to unmute conversation");
        }
      },

      isConversationMuted: (userId) => {
        const entry = get().mutedConversations.find((m) => String(m.userId) === String(userId));
        if (!entry) return false;
        if (entry.mutedUntil === null) return true;
        return new Date(entry.mutedUntil) > new Date();
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
          // We're viewing this conversation — mark their messages as read
          get().markMessagesAsRead(userId);
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      editMessage: async (messageId, newText) => {
        try {
          const res = await axiosInstance.patch(`/messages/${messageId}`, { text: newText });
          set((state) => ({
            messages: state.messages.map((m) =>
              String(m._id) === String(messageId)
                ? { ...m, text: res.data.text, editedAt: res.data.editedAt }
                : m,
            ),
          }));
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to edit message");
          return false;
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return false;

        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({ messages: [...messages, res.data], composerText: "" });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      subscribeToMessages: (userId) => {
        if (!userId) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
        socket.on("newMessage", (newMessage) => {
          // Always refresh conversation lists so archived auto-unarchive is reflected
          get().getConversations();
          get().getArchivedConversations();

          // Play notification sound unless this conversation is muted or global sound is off
          if (get().isSoundEnabled && !get().isConversationMuted(newMessage.senderId)) {
            playNotificationTone();
          }

          // if im not the receiver don't do anything just return
          if (String(newMessage.senderId) !== String(userId)) return;

          set({ messages: [...get().messages, newMessage] });
          // clear typing when message arrives
          set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: false } }));
          // Mark as read since we're actively in this conversation
          get().markMessagesAsRead(userId);
        });

        socket.off("typing");
        socket.on("typing", ({ senderId }) => {
          console.log("[typing received]", { senderId, expectedUserId: userId, match: String(senderId) === String(userId) });
          if (String(senderId) !== String(userId)) return;
          set((state) => ({ typingUsers: { ...state.typingUsers, [senderId]: true } }));
          console.log("[typingUsers updated]", get().typingUsers);
        });

        socket.off("stopTyping");
        socket.on("stopTyping", ({ senderId }) => {
          if (String(senderId) !== String(userId)) return;
          set((state) => ({ typingUsers: { ...state.typingUsers, [senderId]: false } }));
        });

        socket.off("messageDelivered");
        socket.on("messageDelivered", ({ messageId, deliveredAt }) => {
          set((state) => ({
            messages: state.messages.map((msg) =>
              String(msg._id) === String(messageId) ? { ...msg, deliveredAt } : msg,
            ),
          }));
        });

        socket.off("messagesRead");
        socket.on("messagesRead", ({ at }) => {
          const authUserId = useAuthStore.getState().authUser?._id;
          set((state) => ({
            messages: state.messages.map((msg) =>
              String(msg.senderId) === String(authUserId) && !msg.readAt
                ? { ...msg, readAt: at }
                : msg,
            ),
          }));
        });

        socket.off("messageEdited");
        socket.on("messageEdited", ({ messageId, text, editedAt }) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              String(m._id) === String(messageId) ? { ...m, text, editedAt } : m,
            ),
          }));
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage");
        socket?.off("typing");
        socket?.off("stopTyping");
        socket?.off("messageDelivered");
        socket?.off("messagesRead");
        socket?.off("messageEdited");
      },

      markMessagesAsRead: (senderId) => {
        const socket = useAuthStore.getState().socket;
        socket?.emit("markMessagesRead", { senderId });
      },

      sendTypingEvent: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        socket?.emit("typing", { receiverId });
      },

      sendStopTypingEvent: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        socket?.emit("stopTyping", { receiverId });
      },

      setSelectedUser: (selectedUser) => set({ selectedUser }),

      setActiveConversationId: (activeConversationId) => {
        set((state) => ({
          activeConversationId,
          selectedUser:
            state.users.find((user) => user._id === activeConversationId) ||
            state.conversations.find((user) => user._id === activeConversationId) ||
            null,
          messages: activeConversationId ? state.messages : [],
        }));
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),

      sendTextMessage: async (conversationId) => {
        const messageText = get().composerText.trim();
        if (!conversationId || !messageText) return false;

        return get().sendMessage({ text: messageText });
      },

      sendMediaMessage: async ({ conversationId, file }) => {
        if (!conversationId || !file) return false;

        const formData = new FormData();
        formData.append("media", file);

        set({ isSendingMedia: true });
        try {
          return await get().sendMessage(formData);
        } finally {
          set({ isSendingMedia: false });
        }
      },
    }),
    {
      name: "chatkoro-storage",
      partialize: (state) => ({ isSoundEnabled: state.isSoundEnabled }),
    },
  ),
);
