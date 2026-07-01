import { Avatar, Button } from "@heroui/react";
import { UserPlusIcon, ClockIcon, MessageSquareIcon } from "lucide-react";
import { getInitials } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";
import { formatLastSeen } from "../../lib/utils";

export function UserWithStatusRow({ user, isFriend, onOpenChat, onSendRequest }) {
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  // Subscribe to the arrays directly so the component re-renders when they change.
  // Subscribing to isSentPending/isReceivedPending (function refs) wouldn't trigger re-renders.
  const sentRequests = useFriendStore((state) => state.sentRequests);
  const receivedRequests = useFriendStore((state) => state.receivedRequests);

  const isOnline = onlineUsers.includes(user._id);
  const sentPending = sentRequests.some((r) => String(r.receiverId?._id) === String(user._id));
  const receivedRequest = receivedRequests.find((r) => String(r.senderId?._id) === String(user._id));

  return (
    <div className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5">
      <AvatarWithOnlineIndicator isOnline={isOnline}>
        <Avatar className="size-12 shrink-0">
          <Avatar.Image alt={user.fullName} src={user.profilePic} />
          <Avatar.Fallback className="text-sm font-medium">
            {getInitials(user.fullName)}
          </Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{user.fullName}</p>
        <p className="truncate text-xs text-muted">
          {isOnline ? "Online" : formatLastSeen(user.lastSeen)}
        </p>
      </div>

      <div className="shrink-0">
        {isFriend ? (
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            aria-label="Open chat"
            onPress={() => onOpenChat(user._id)}
            className="size-8 rounded-full"
          >
            <MessageSquareIcon className="size-4" />
          </Button>
        ) : receivedRequest ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Respond
          </span>
        ) : sentPending ? (
          <span className="flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted">
            <ClockIcon className="size-3" />
            Pending
          </span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            aria-label="Add friend"
            onPress={() => onSendRequest(user._id)}
            className="size-8 rounded-full"
          >
            <UserPlusIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
