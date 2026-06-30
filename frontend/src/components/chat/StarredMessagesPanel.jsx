import { useEffect } from "react";
import { BookmarkIcon, XIcon, ImageIcon, VideoIcon } from "lucide-react";
import { Avatar, Button } from "@heroui/react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { withTransform } from "../../lib/imagekit";
import { formatMessageTime } from "../../lib/utils";

const THUMB_TRANSFORM = "q-auto,w-120,h-120,fo-auto,f-auto";

export function StarredMessagesPanel() {
  const starredMessages = useChatStore((state) => state.starredMessages);
  const starredPanelOpen = useChatStore((state) => state.starredPanelOpen);
  const getStarredMessages = useChatStore((state) => state.getStarredMessages);
  const unstarMessage = useChatStore((state) => state.unstarMessage);
  const setStarredPanelOpen = useChatStore((state) => state.setStarredPanelOpen);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);

  const authUser = useAuthStore((state) => state.authUser);

  useEffect(() => {
    if (starredPanelOpen) getStarredMessages();
  }, [starredPanelOpen]);

  if (!starredPanelOpen) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <BookmarkIcon className="size-4.5 fill-accent text-accent" />
        <h2 className="flex-1 text-[15px] font-semibold">Starred Messages</h2>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => setStarredPanelOpen(false)}
          aria-label="Close"
        >
          <XIcon className="size-5" strokeWidth={2} />
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
        {starredMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <BookmarkIcon className="size-10 text-muted opacity-30" strokeWidth={1.5} />
            <p className="text-sm text-muted">No starred messages yet.</p>
            <p className="text-xs text-muted opacity-70">
              Hover a message and click the bookmark icon to save it here.
            </p>
          </div>
        ) : (
          starredMessages.map((msg) => {
            const isOwn = String(msg.senderId?._id) === String(authUser?._id);
            const senderName = isOwn ? "You" : (msg.senderId?.fullName ?? "Unknown");
            const otherUser = isOwn ? msg.receiverId : msg.senderId;

            return (
              <div
                key={msg._id}
                className="group flex items-start gap-3 border-b border-border px-4 py-3 hover:bg-accent/5"
              >
                {/* Avatar */}
                <Avatar className="mt-0.5 size-8 shrink-0">
                  <Avatar.Image src={msg.senderId?.profilePic} alt={senderName} />
                  <Avatar.Fallback className="text-xs font-medium">
                    {senderName.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>

                {/* Content */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (otherUser?._id) setActiveConversationId(String(otherUser._id));
                    setStarredPanelOpen(false);
                  }}
                >
                  <div className="mb-0.5 flex items-baseline gap-1.5">
                    <span className="text-[13px] font-semibold leading-tight">{senderName}</span>
                    <span className="text-[11px] text-muted">
                      → {isOwn ? (msg.receiverId?.fullName ?? "Unknown") : "You"}
                    </span>
                    <span className="ml-auto text-[11px] tabular-nums text-muted">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Message preview */}
                  {msg.text && (
                    <p className="line-clamp-2 text-[13px] leading-snug text-foreground/80">
                      {msg.text}
                    </p>
                  )}
                  {msg.image && !msg.text && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={withTransform(msg.image, THUMB_TRANSFORM)}
                        alt=""
                        className="size-10 rounded-lg object-cover"
                      />
                      <span className="flex items-center gap-1 text-[12px] text-muted">
                        <ImageIcon className="size-3.5" /> Photo
                      </span>
                    </div>
                  )}
                  {msg.image && msg.text && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={withTransform(msg.image, THUMB_TRANSFORM)}
                        alt=""
                        className="size-10 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  {msg.video && (
                    <span className="flex items-center gap-1 text-[12px] text-muted">
                      <VideoIcon className="size-3.5" /> Video
                    </span>
                  )}
                </div>

                {/* Unstar button */}
                <button
                  type="button"
                  title="Remove from starred"
                  onClick={() => unstarMessage(String(msg._id))}
                  className="mt-0.5 shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                >
                  <BookmarkIcon className="size-3.5 fill-accent text-accent" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
