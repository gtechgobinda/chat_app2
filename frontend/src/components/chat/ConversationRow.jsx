import { Avatar } from "@heroui/react";
import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

export function ConversationRow({ user, selected, onSelect, onArchive, onUnarchive }) {
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
          <p className="truncate text-[15px] font-semibold">{user.name}</p>
        </div>
      </button>

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
