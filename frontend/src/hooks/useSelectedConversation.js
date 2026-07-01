import { useMediaQuery } from "./useMediaQuery";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// John Doe -> JD
export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("");
}

// mapUserToConversation is an adapter — it converts the raw backend shapes (a user document + an array of message documents) into the clean view-model that the chat UI components expect to render.

// Two transformations happen:
// 1. Messages → UI messages
// 2. User → peer

function mapUserToConversation({ user, messages, authUser, onlineUsers, starredIds }) {
  const mappedMessages = messages.map((message) => {
    const role = String(message.senderId) === String(authUser?._id) ? "me" : "them";
    const status = message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent";
    return {
      id: message._id,
      role,
      text: message.text || "",
      time: formatMessageTime(message.createdAt),
      imageUrl: message.image,
      videoUrl: message.video,
      status,
      isEdited: Boolean(message.editedAt),
      isDeletedForEveryone: Boolean(message.deletedForEveryone),
      isPinned: Boolean(message.isPinned),
      isStarred: starredIds ? starredIds.has(String(message._id)) : false,
      reactions: (message.reactions || []).map((r) => ({
        userId: String(r.userId),
        emoji: r.emoji,
      })),
      myReaction:
        message.reactions?.find((r) => String(r.userId) === String(authUser?._id))?.emoji ?? null,
      createdAt: message.createdAt,
      senderName: role === "me" ? (authUser?.fullName ?? "You") : user.fullName,
      replyTo: message.replyTo?.messageId
        ? {
            messageId: String(message.replyTo.messageId),
            senderName: message.replyTo.senderName || "",
            text: message.replyTo.text || "",
            imageUrl: message.replyTo.imageUrl || null,
          }
        : null,
    };
  });

  return {
    id: user._id,
    peer: {
      name: user.fullName,
      subtitle: user.email,
      isOnline: onlineUsers.includes(user._id),
      lastSeen: user.lastSeen ?? null,
      avatarUrl: user.profilePic,
      initials: getInitials(user.fullName),
    },
    messages: mappedMessages,
  };
}

export function useSelectedConversation() {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);
  const messages = useChatStore((state) => state.messages);
  const starredMessages = useChatStore((state) => state.starredMessages);

  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const starredIds = new Set(starredMessages.map((m) => String(m._id)));

  const selectedUser = activeConversationId
    ? users.find((user) => user._id === activeConversationId) ||
      conversations.find((user) => user._id === activeConversationId)
    : null;

  const activeConversation = selectedUser
    ? mapUserToConversation({ user: selectedUser, messages, authUser, onlineUsers, starredIds })
    : null;

  return {
    activeConversation,
    activeConversationId,
    isLargeScreen,
  };
}
