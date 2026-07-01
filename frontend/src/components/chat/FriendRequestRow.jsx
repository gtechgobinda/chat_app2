import { Avatar, Button } from "@heroui/react";
import { CheckIcon, XIcon } from "lucide-react";
import { getInitials } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

export function FriendRequestRow({ request, onAccept, onReject, isProcessing }) {
  const sender = request.senderId;
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const isOnline = onlineUsers.includes(sender._id);

  return (
    <div className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5">
      <AvatarWithOnlineIndicator isOnline={isOnline}>
        <Avatar className="size-12 shrink-0">
          <Avatar.Image alt={sender.fullName} src={sender.profilePic} />
          <Avatar.Fallback className="text-sm font-medium">
            {getInitials(sender.fullName)}
          </Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{sender.fullName}</p>
        <p className="truncate text-xs text-muted">{sender.email}</p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          isIconOnly
          aria-label="Accept"
          isDisabled={isProcessing}
          onPress={() => onAccept(request._id)}
          className="size-8 rounded-full bg-success/10 text-success hover:bg-success/20"
        >
          <CheckIcon className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isIconOnly
          aria-label="Reject"
          isDisabled={isProcessing}
          onPress={() => onReject(request._id)}
          className="size-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
