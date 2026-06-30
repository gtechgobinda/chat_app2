import { useWallpaper } from "../context/wallpaper";
import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect, useRef } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { StarredMessagesPanel } from "../components/chat/StarredMessagesPanel";

function ChatPage() {
  const { frameStyle } = useWallpaper();

  const getConversations = useChatStore((state) => state.getConversations);
  const getArchivedConversations = useChatStore((state) => state.getArchivedConversations);
  const getMutedConversations = useChatStore((state) => state.getMutedConversations);
  const getMessages = useChatStore((state) => state.getMessages);
  const getUsers = useChatStore((state) => state.getUsers);
  const users = useChatStore((state) => state.users);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
  const getStarredMessages = useChatStore((state) => state.getStarredMessages);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useEffect(() => {
    getUsers();
    getConversations();
    getArchivedConversations();
    getMutedConversations();
    getStarredMessages();
  }, [getConversations, getArchivedConversations, getMutedConversations, getUsers, getStarredMessages]);

  // Safety-net: if users list is empty after the initial load (e.g. race condition where
  // the Clerk webhook fires after the first getUsers() call), retry up to 3 times.
  const retryRef = useRef(0);
  useEffect(() => {
    if (isUsersLoading) return;
    if (users.length > 0) { retryRef.current = 0; return; }
    if (retryRef.current >= 3) return;
    retryRef.current += 1;
    const delay = retryRef.current * 2000; // 2s, 4s, 6s
    const timer = setTimeout(getUsers, delay);
    return () => clearTimeout(timer);
  }, [users, isUsersLoading, getUsers]);

  useEffect(() => {
    // Subscribe even without an active conversation so incoming messages
    // always refresh the conversations list (fixes "first message needs refresh" bug).
    subscribeToMessages(activeConversationId ?? null);

    if (activeConversationId) {
      getMessages(activeConversationId);
    }

    return () => unsubscribeFromMessages();
  }, [getMessages, activeConversationId, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden p-2 sm:p-3 md:p-8" style={frameStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-border bg-background text-foreground">
        <ChatSidebar />

        <div
          className={`relative flex-1 flex-col overflow-hidden ${
            !isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
          }`}
        >
          <ChatHeader />
          <MessageList />
          {activeConversation ? <ChatComposer /> : null}
          <StarredMessagesPanel />
        </div>
      </div>
    </div>
  );
}
export default ChatPage;
