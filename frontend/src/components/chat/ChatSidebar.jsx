import { useEffect, useState } from "react";
import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useFriendStore } from "../../store/useFriendStore";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";

import { Badge, SearchField, Tabs } from "@heroui/react";
import { BellIcon, MessageSquareIcon, UsersIcon } from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { FriendRequestRow } from "./FriendRequestRow";
import { UserWithStatusRow } from "./UserWithStatusRow";

function mapUserForList(user, onlineUsers) {
  return {
    conversationId: user._id,
    id: user._id,
    name: user.fullName,
    avatarUrl: user.profilePic,
    initials: getInitials(user.fullName),
    isOnline: onlineUsers.includes(user._id),
    peer: {
      name: user.fullName,
      avatarUrl: user.profilePic,
      initials: getInitials(user.fullName),
      isOnline: onlineUsers.includes(user._id),
    },
  };
}

function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);

  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const authUser = useAuthStore((state) => state.authUser);

  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const friends = useFriendStore((state) => state.friends);
  const receivedRequests = useFriendStore((state) => state.receivedRequests);
  const getFriends = useFriendStore((state) => state.getFriends);
  const getReceivedRequests = useFriendStore((state) => state.getReceivedRequests);
  const getSentRequests = useFriendStore((state) => state.getSentRequests);
  const sendFriendRequest = useFriendStore((state) => state.sendFriendRequest);
  const respondToRequest = useFriendStore((state) => state.respondToRequest);
  const subscribeToFriendEvents = useFriendStore((state) => state.subscribeToFriendEvents);

  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    getFriends();
    getReceivedRequests();
    getSentRequests();
    subscribeToFriendEvents();
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const conversationUsers = conversations.map((user) => mapUserForList(user, onlineUsers));

  const friendIds = new Set(friends.map((f) => f._id));

  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((c) => c.peer.name.toLowerCase().includes(normalizedSearchQuery))
    : conversationUsers;

  const filteredUsers = normalizedSearchQuery
    ? users.filter((u) => u.fullName.toLowerCase().includes(normalizedSearchQuery))
    : users;

  const filteredRequests = normalizedSearchQuery
    ? receivedRequests.filter((r) =>
        r.senderId.fullName.toLowerCase().includes(normalizedSearchQuery),
      )
    : receivedRequests;

  async function handleAccept(requestId) {
    setProcessingRequestId(requestId);
    await respondToRequest(requestId, "accept");
    setProcessingRequestId(null);
  }

  async function handleReject(requestId) {
    setProcessingRequestId(requestId);
    await respondToRequest(requestId, "reject");
    setProcessingRequestId(null);
  }

  async function handleSendRequest(userId) {
    await sendFriendRequest(userId);
    getSentRequests();
  }

  return (
    <aside
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-border lg:w-72 ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="shrink-0 border-b border-border px-2 pb-2 pt-2.5 sm:px-3 sm:pt-3">
        <div className="flex items-center gap-2 px-0.5 sm:gap-2.5 sm:px-1">
          <AppLogo size={32} className="size-8 shrink-0 rounded-[9px] sm:size-8.5" alt="" />
          <p className="flex-1 truncate text-lg font-bold tracking-tight sm:text-[22px]">
            {APP_NAME}
          </p>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>

      <Tabs
        selectedKey={sidebarTab}
        onSelectionChange={(key) => setSidebarTab(String(key))}
        variant="secondary"
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <div className="shrink-0 border-b border-border px-3 pb-2 pt-2">
          <SearchField
            fullWidth
            variant="secondary"
            className="w-full"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search" />
              {searchQuery ? <SearchField.ClearButton /> : null}
            </SearchField.Group>
          </SearchField>
        </div>

        <Tabs.ListContainer className="shrink-0 border-b border-border px-2 pb-2 pt-1">
          <Tabs.List className="w-full gap-0.5">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1.5">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              Chats
            </Tabs.Tab>
            <Tabs.Tab id="users" className="flex-1 justify-center gap-1.5">
              <UsersIcon className="size-3.5 opacity-80" aria-hidden />
              Users
            </Tabs.Tab>
            <Tabs.Tab id="requests" className="flex-1 justify-center gap-1.5">
              <span className="relative inline-flex">
                <BellIcon className="size-3.5 opacity-80" aria-hidden />
                {receivedRequests.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {receivedRequests.length > 9 ? "9+" : receivedRequests.length}
                  </span>
                )}
              </span>
              Requests
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="chats" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              {normalizedSearchQuery
                ? "No conversations match your search."
                : "No conversations yet. Add friends to start chatting!"}
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                user={conversation}
                selected={conversation.id === activeConversationId}
                onSelect={() => setActiveConversationId(conversation.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel id="users" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          {filteredUsers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No people match your search.
            </p>
          ) : (
            filteredUsers.map((user) => (
              <UserWithStatusRow
                key={user._id}
                user={user}
                isFriend={friendIds.has(user._id)}
                onOpenChat={(id) => setActiveConversationId(id)}
                onSendRequest={handleSendRequest}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel
          id="requests"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredRequests.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              {normalizedSearchQuery
                ? "No requests match your search."
                : "No pending friend requests."}
            </p>
          ) : (
            filteredRequests.map((request) => (
              <FriendRequestRow
                key={request._id}
                request={request}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={processingRequestId === request._id}
              />
            ))
          )}
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}
export default ChatSidebar;
