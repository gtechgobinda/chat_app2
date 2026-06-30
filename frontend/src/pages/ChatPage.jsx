import { useWallpaper } from "../context/wallpaper";
import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
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
