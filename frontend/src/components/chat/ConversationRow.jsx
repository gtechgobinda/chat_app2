import { Avatar } from "@heroui/react";
import { ArchiveIcon, ArchiveRestoreIcon, BellOffIcon } from "lucide-react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

export function ConversationRow({ user, selected, onSelect, onArchive, onUnarchive, isMuted }) {
  const actionIcon = onUnarchive ? (
    <ArchiveRestoreIcon className="size-4 text-muted-foreground" />
  ) : onArchive ? (
    <ArchiveIcon className="size-4 text-muted-foreground" />
  ) : null;

  function handleAction(e) {
    e.stopPropagation();
    if (onUnarchive) onUnarchive(user.id);
    else if (onArchive) onArchive(user.id);
  }

  return (
    <div className="group relative border-b border-border">
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
          selected ? "bg-accent-soft" : ""
        }`}
      >
        <AvatarWithOnlineIndicator isOnline={user.isOnline ?? true}>
          <Avatar className="size-12 shrink-0">
            <Avatar.Image alt={user.name} src={user.avatarUrl} />
            <Avatar.Fallback className="text-sm font-medium">{user.initials}</Avatar.Fallback>
          </Avatar>
        </AvatarWithOnlineIndicator>

        <div className="min-w-0 flex-1 pr-6">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold">{user.name}</p>
            {isMuted && (
              <BellOffIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="Muted" />
            )}
          </div>
        </div>
      </button>

      {/* Unread count badge — shares position with action icon, fades out on hover when icon present */}
      {user.unreadCount > 0 && !selected && (
        <span
          className={`pointer-events-none absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground transition-opacity duration-150 ${actionIcon ? "group-hover:opacity-0" : ""}`}
        >
          {user.unreadCount > 9 ? "9+" : user.unreadCount}
        </span>
      )}

      {actionIcon && (
        <button
          type="button"
          onClick={handleAction}
          title={onUnarchive ? "Unarchive conversation" : "Archive conversation"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
        >
          {actionIcon}
        </button>
      )}
    </div>
  );
}
