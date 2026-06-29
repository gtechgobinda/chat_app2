import { PinIcon, XIcon } from "lucide-react";

export function PinnedMessageBanner({ message, onJump, onUnpin }) {
  if (!message) return null;

  const preview = message.isDeletedForEveryone
    ? "This message was deleted"
    : message.imageUrl
    ? "📷 Photo"
    : message.videoUrl
    ? "🎥 Video"
    : message.text;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2">
      <PinIcon className="size-3.5 shrink-0 rotate-45 text-accent" aria-hidden />

      <button
        type="button"
        onClick={onJump}
        className="min-w-0 flex-1 text-left"
        title="Jump to pinned message"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Pinned Message</p>
        <p className="truncate text-[13px]">{preview}</p>
      </button>

      <button
        type="button"
        onClick={onUnpin}
        title="Unpin message"
        className="shrink-0 rounded-md p-1 hover:bg-accent"
        aria-label="Unpin message"
      >
        <XIcon className="size-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
